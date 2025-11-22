import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useState, useRef } from 'react';
import ProductoService from '../services/ProductoService';
import ProductoForm from '../components/ProductoForm';
import { Toast } from 'primereact/toast';

const Columns = [
  { field: 'name', header: 'Nombre', style: { width: '25%' } },
  { field: 'description', header: 'Descripción', style: { width: '35%' } },
  { field: 'price', header: 'Precio', style: { width: '15%' }, body: (rowData) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.price) },
  { field: 'stock', header: 'Stock', style: { width: '12%' } },
  { field: 'reserve_stock', header: 'Stock Reservado', style: { width: '13%' } },
];

const ProductoView = () => {
  const [productos, setProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const toast = useRef(null);

  const fetchProductos = async () => {
    try {
      const response = await ProductoService.getAll();
      if (response.success) {
        setProductos(response.data);
      } else {
        console.error('Error al obtener productos:', response.error);
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar productos', life: 3000 });
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error inesperado', life: 3000 });
    }
  };

  useEffect(() => {
    fetchProductos();
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
    // Aquí iría la lógica para guardar en el backend
    // Por ahora simulamos una actualización local
    console.log('Guardando producto:', formData);

    if (productoEditando) {
      // Update logic mock
      const updatedProductos = productos.map(p => p.id === productoEditando.id ? { ...p, ...formData } : p);
      setProductos(updatedProductos);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Producto actualizado', life: 3000 });
    } else {
      // Create logic mock
      const newProduct = { ...formData, id: Date.now() }; // Mock ID
      setProductos([...productos, newProduct]);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Producto creado', life: 3000 });
    }

    setShowDialog(false);
    setProductoEditando(null);
  };

  const handleEliminar = () => {
    if (selectedProducto) {
      // Delete logic mock
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

      <div className="bg-white p-6 rounded shadow h-full">
        <TableComponent
          visible={true}
          data={productos}
          columns={Columns}
          selection={selectedProducto}
          onSelectionChange={setSelectedProducto}
          header={<ActionButtons
            showCreate={true}
            showEdit={true}
            showDelete={true}
            editDisabled={!selectedProducto}
            deleteDisabled={!selectedProducto}
            onCreate={handleNuevo}
            onEdit={handleEditar}
            onDelete={handleEliminar}
          />}
        />
      </div>

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