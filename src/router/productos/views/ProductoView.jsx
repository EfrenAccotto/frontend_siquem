import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useState, useRef } from 'react';
import ProductoService from '../services/ProductoService';
import ProductoForm from '../components/ProductoForm';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';

const Columns = [
  { field: 'name', header: 'Nombre', style: { width: '20%' } },
  { field: 'description', header: 'Descripcion', style: { width: '30%' } },
  { field: 'price', header: 'Precio', style: { width: '15%' }, body: (rowData) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.price) },
  { field: 'stock', header: 'Stock Total', style: { width: '10%' } },
  { field: 'reserve_stock', header: 'Stock Reservado', style: { width: '12%' } },
  {
    field: 'stock_disponible',
    header: 'Stock Disponible',
    style: { width: '13%' },
    body: (rowData) => (rowData.stock - rowData.reserve_stock)
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
          const sorted = [...productosList].sort((a, b) => (b.id || 0) - (a.id || 0));
          setProductos(sorted);
          setSelectedProducto(null);
        } else {
          console.error('Error al obtener productos:', response.error);
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
        if (response.success) {
          const updatedProductos = productos
            .map(p => (p.id === productoEditando.id ? response.data : p))
            .sort((a, b) => (b.id || 0) - (a.id || 0));
          setProductos(updatedProductos);
          toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Producto actualizado', life: 3000 });
        } else {
          throw new Error(response.error || 'No se pudo actualizar');
        }
      } else {
        const response = await ProductoService.create(formData);
        if (response.success) {
          // Optimista
          setProductos((prev) => {
            const next = [response.data, ...(prev || [])];
            return next.sort((a, b) => (b.id || 0) - (a.id || 0));
          });
          // Refrescar con backend (solo si trae resultados)
          ProductoService.getAll()
            .then((refetch) => {
              const list = refetch?.data?.results || refetch?.data || [];
              if (Array.isArray(list) && list.length > 0) {
                setProductos([...list].sort((a, b) => (b.id || 0) - (a.id || 0)));
              }
            })
            .catch(() => { /* mantener lista optimista si falla */ });
          toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Producto creado', life: 3000 });
        } else {
          throw new Error(response.error || 'No se pudo crear');
        }
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
      if (response.success) {
        const refetch = await ProductoService.getAll();
        const list = refetch?.data?.results || refetch?.data || [];
        const sorted = Array.isArray(list) ? [...list].sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
        setProductos(sorted);
        setSelectedProducto(null);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Producto eliminado', life: 3000 });
      } else {
        throw new Error(response.error || 'No se pudo eliminar');
      }
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
  };

  const handleEliminar = () => {
    if (!selectedProducto) return;
    confirmDialog({
      message: `¿Seguro que deseas eliminar "${selectedProducto.name}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: eliminarSeleccionado
    });
  };

  const filteredProductos = Array.isArray(productos)
    ? productos.filter((p) => {
        const term = search.toLowerCase().trim();
        if (!term) return true;
        return (
          (p.name || '').toLowerCase().includes(term) ||
          (p.description || '').toLowerCase().includes(term)
        );
      })
    : [];

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
        header={<ActionButtons
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
        />}
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
