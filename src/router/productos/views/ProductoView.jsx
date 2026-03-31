import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [productos, setProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [search, setSearch] = useState('');
  const toast = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadProductos = async () => {
      setLoading(true);
      try {
        const response = await ProductoService.getAll();
        if (!mounted) return;

        if (response.success) {
          const productosList = Array.isArray(response.data) ? response.data : [];
          setProductos(sortByIdDesc(productosList));
          setSelectedProducto(null);
        } else {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar productos', life: 3000 });
        }
      } catch (error) {
        if (mounted) {
          console.error('Error inesperado:', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProductos();

    return () => {
      mounted = false;
    };
  }, []);

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
      } catch (error) {
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

        setProductos((prev) =>
          sortByIdDesc(prev.map((producto) => (producto.id === productoEditando.id ? response.data : producto)))
        );
        toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Producto actualizado', life: 3000 });
      } else {
        const response = await ProductoService.create(formData);
        if (!response.success) {
          throw new Error(response.error || 'No se pudo crear');
        }

        setProductos((prev) => sortByIdDesc([response.data, ...(prev || [])]));
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

      setProductos((prev) => prev.filter((producto) => producto.id !== selectedProducto.id));
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

  const filteredProductos = useMemo(() => {
    if (!Array.isArray(productos)) return [];
    const term = search.toLowerCase().trim();
    if (!term) return productos;

    return productos.filter((producto) =>
      (producto.name || '').toLowerCase().includes(term) ||
      (producto.description || '').toLowerCase().includes(term)
    );
  }, [productos, search]);

  return (
    <div className="producto-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestion de Productos</h1>
      </div>

      <TableComponent
        visible={true}
        data={filteredProductos}
        loading={loading}
        columns={Columns}
        selection={selectedProducto}
        onSelectionChange={setSelectedProducto}
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
