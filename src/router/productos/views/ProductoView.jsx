import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useState, useRef } from 'react';
import ProductoService from '../services/ProductoService';
import ProductoForm from '../components/ProductoForm';
import { Toast } from 'primereact/toast';

const Columns = [
  { field: 'name', header: 'Nombre', style: { width: '20%' } },
  { field: 'description', header: 'Descripción', style: { width: '30%' } },
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
  const toast = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadProductos = async () => {
      setLoading(true);
      try {
        const response = await ProductoService.getAll();
        if (mounted && response.success) {
          // Manejar ambos formatos de respuesta del backend
          setProductos(response.data.results || response.data || []);
        } else if (mounted && !response.success) {
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
    if (selectedProducto) {
      setProductoEditando(selectedProducto);
      setShowDialog(true);
    }
  };

  const handleGuardar = async (formData) => {
    console.log('Guardando producto:', formData);

    if (productoEditando) {
      const updatedProductos = productos.map(p => p.id === productoEditando.id ? { ...p, ...formData } : p);
      setProductos(updatedProductos);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Producto actualizado', life: 3000 });
    } else {
      const newProduct = { ...formData, id: Date.now() };
      setProductos([...productos, newProduct]);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Producto creado', life: 3000 });
    }

    setShowDialog(false);
    setProductoEditando(null);
  };

  const handleEliminar = () => {
    if (selectedProducto) {
      const updatedProductos = productos.filter(p => p.id !== selectedProducto.id);
      setProductos(updatedProductos);
      setSelectedProducto(null);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Producto eliminado', life: 3000 });
    }
  }

  return (
    <div className="producto-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestión de Productos</h1>
      </div>

      <TableComponent
        visible={true}
        data={productos}
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
      />
    </div>
  );
};

export default ProductoView;