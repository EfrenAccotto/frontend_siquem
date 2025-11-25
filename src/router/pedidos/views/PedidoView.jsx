import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useState, useRef } from 'react';
import PedidoService from '../services/PedidoService';
import PedidoForm from '../components/PedidoForm';
import { Toast } from 'primereact/toast';

const Columns = [
  { field: 'customer.first_name', header: 'Cliente', style: { width: '25%' } },
  { field: 'date', header: 'Fecha', style: { width: '15%' } },
  { field: 'shipping_address', header: 'Total', style: { width: '15%' }, body: (rowData) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.total_amount || 0) },
  { field: 'state', header: 'Estado', style: { width: '20%' }, body: (rowData) => new Date(rowData.created_at).toLocaleDateString('es-ES') },
  { field: 'delivery_date', header: 'Fecha Entrega', style: { width: '15%' }, body: (rowData) => rowData.delivery_date ? new Date(rowData.delivery_date).toLocaleDateString('es-ES') : 'No definida' },
];

const PedidoView = () => {
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const response = await PedidoService.getAll();
      if (response.success) {
        setPedidos(response.data.results || response.data || []);
      } else {
        console.error('Error al obtener pedidos:', response.error);
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar pedidos', life: 3000 });
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error inesperado', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const handleNuevo = () => {
    setPedidoEditando(null);
    setShowDialog(true);
  };

  const handleEditar = () => {
    if (selectedPedido) {
      setPedidoEditando(selectedPedido);
      setShowDialog(true);
    }
  };

  const handleGuardar = async (formData) => {
    try {
      if (pedidoEditando) {
        const response = await PedidoService.update(pedidoEditando.id, formData);
        if (response.success) {
          const updatedPedidos = pedidos.map(p => p.id === pedidoEditando.id ? { ...p, ...formData } : p);
          setPedidos(updatedPedidos);
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Pedido actualizado', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await PedidoService.create(formData);
        if (response.success) {
          setPedidos([...pedidos, response.data]);
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Pedido creado', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      }

      setShowDialog(false);
      setPedidoEditando(null);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
  };

  const handleEliminar = async () => {
    if (selectedPedido) {
      try {
        const response = await PedidoService.delete(selectedPedido.id);
        if (response.success) {
          const updatedPedidos = pedidos.filter(p => p.id !== selectedPedido.id);
          setPedidos(updatedPedidos);
          setSelectedPedido(null);
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Pedido eliminado', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
      }
    }
  };

  return (
    <div className="pedido-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestión de Pedidos</h1>
      </div>

      <div className="bg-white p-6 rounded shadow h-full">
        <TableComponent
          data={pedidos}
          loading={loading}
          columns={Columns}
          selection={selectedPedido}
          onSelectionChange={setSelectedPedido}
          header={<ActionButtons
            showCreate={true}
            showEdit={true}
            showDelete={true}
            editDisabled={!selectedPedido}
            deleteDisabled={!selectedPedido}
            onCreate={handleNuevo}
            onEdit={handleEditar}
            onDelete={handleEliminar}
          />}
        />
      </div>

      <PedidoForm
        visible={showDialog}
        pedido={pedidoEditando}
        onHide={() => {
          setShowDialog(false);
          setPedidoEditando(null);
        }}
        onSave={handleGuardar}
      />
    </div>
  );
};

export default PedidoView;
