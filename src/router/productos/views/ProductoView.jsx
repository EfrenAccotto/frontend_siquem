import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useRef, useState } from 'react';
import ProductoService from '../services/ProductoService';
import ProductoForm from '../components/ProductoForm';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { formatUnitValue } from '@/utils/unitParser';

const sortByIdDesc = (list = []) =>
  [...list].sort((a, b) => (b.id || 0) - (a.id || 0));

const formatStockUnit = (unit) => {
  if (unit === 'kg') return 'Kg';
  if (unit === 'unit') return 'Unidad';
  return unit || '-';
};

const Columns = [
  { field: 'name', header: 'Nombre', style: { width: '18%' } },
  { field: 'description', header: 'Descripcion', style: { width: '24%' } },
  { field: 'price', header: 'Precio', style: { width: '12%' }, body: (rowData) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.price) },
  {
    field: 'stock_unit',
    header: 'Unidad de Medida',
    style: { width: '12%' },
    body: (rowData) => formatStockUnit(rowData.stock_unit)
  },
  {
    field: 'stock',
    header: 'Stock Total',
    style: { width: '10%' },
    body: (rowData) => formatUnitValue(rowData.stock, rowData.stock_unit)
  },
  {
    field: 'reserve_stock',
    header: 'Stock Reservado',
    style: { width: '12%' },
    body: (rowData) => formatUnitValue(rowData.reserve_stock, rowData.stock_unit)
  },
  {
    field: 'stock_disponible',
    header: 'Stock Disponible',
    style: { width: '12%' },
    body: (rowData) => formatUnitValue((Number(rowData.stock) || 0) - (Number(rowData.reserve_stock) || 0), rowData.stock_unit)
  },
];

const ProductoView = () => {
  const DEFAULT_ROWS = 60;
  const [productos, setProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, rows: DEFAULT_ROWS, total: 0 });
  const toast = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadProductos = async ({ page = pagination.page, rows = pagination.rows, searchTerm = debouncedSearch } = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: rows
      };
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await ProductoService.getAll(params);
      if (response.success) {
        const productosList = Array.isArray(response.data) ? response.data : [];
        setProductos(sortByIdDesc(productosList));
        setSelectedProducto(null);
        setPagination((prev) => ({
          ...prev,
          page,
          rows,
          total: Number(response.pagination?.count) || 0
        }));
      } else {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar productos', life: 3000 });
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar productos', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductos({
      page: pagination.page,
      rows: pagination.rows,
      searchTerm: debouncedSearch
    });
  }, [pagination.page, pagination.rows, debouncedSearch]);

  const handleNuevo = () => {
    setProductoEditando(null);
    setShowDialog(true);
  };

  const handleEditar = () => {
    if (!selectedProducto) return;

    const fetchProducto = async () => {
      setFormBusy(true);
      try {
        const resp = await ProductoService.getById(selectedProducto.id);
        const data = resp.success ? resp.data : selectedProducto;
        setProductoEditando(data);
        setShowDialog(true);
      } catch {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el producto', life: 3000 });
      } finally {
        setFormBusy(false);
      }
    };

    fetchProducto();
  };

  const handleGuardar = async (formData) => {
    try {
      setSaving(true);
      if (productoEditando) {
        const response = await ProductoService.update(productoEditando.id, formData);
        if (!response.success) {
          throw new Error(response.error || 'No se pudo actualizar');
        }

        await loadProductos();
        toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Producto actualizado', life: 3000 });
      } else {
        const response = await ProductoService.create(formData);
        if (!response.success) {
          throw new Error(response.error || 'No se pudo crear');
        }

        setPagination((prev) => ({ ...prev, page: 1 }));
        await loadProductos({ page: 1 });
        toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Producto creado', life: 3000 });
      }

      setShowDialog(false);
      setProductoEditando(null);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    } finally {
      setSaving(false);
    }
  };

  const eliminarSeleccionado = async () => {
    if (!selectedProducto) return;

    try {
      const response = await ProductoService.delete(selectedProducto.id);
      if (!response.success) {
        throw new Error(response.error || 'No se pudo eliminar');
      }

      await loadProductos();
      setSelectedProducto(null);
      toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Producto eliminado', life: 3000 });
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
  };

  const handleEliminar = () => {
    if (!selectedProducto) return;
    confirmDialog({
      message: `¿Seguro que deseas eliminar "${selectedProducto.name}"?`,
      header: 'Confirmar eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: eliminarSeleccionado
    });
  };

  return (
    <div className="producto-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestion de Productos</h1>
      </div>

      <TableComponent
        visible={true}
        data={productos}
        loading={loading}
        columns={Columns}
        selection={selectedProducto}
        onSelectionChange={setSelectedProducto}
        rows={pagination.rows}
        first={(pagination.page - 1) * pagination.rows}
        totalRecords={pagination.total}
        rowsPerPageOptions={[10, 25, 50, 60]}
        onPage={(event) => {
          setPagination((prev) => ({
            ...prev,
            page: Math.floor(event.first / event.rows) + 1,
            rows: event.rows
          }));
        }}
        header={
          <ActionButtons
            showCreate={true}
            showEdit={true}
            showDelete={true}
            showExport={false}
            editDisabled={!selectedProducto}
            deleteDisabled={!selectedProducto}
            onCreate={handleNuevo}
            onEdit={handleEditar}
            onDelete={handleEliminar}
            searchValue={search}
            onSearch={(value) => setSearch(value || '')}
            searchPlaceholder="Filtrar por nombre"
          />
        }
      />

      <ProductoForm
        visible={showDialog}
        producto={productoEditando}
        onHide={() => {
          setShowDialog(false);
          setProductoEditando(null);
        }}
        onSave={handleGuardar}
        loading={saving || formBusy}
      />
    </div>
  );
};

export default ProductoView;
