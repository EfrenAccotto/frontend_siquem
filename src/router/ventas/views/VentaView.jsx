import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import { useEffect, useState, useRef } from 'react';
import VentaService from '../services/VentaService';
import VentaForm from '../components/VentaForm';
import { Toast } from 'primereact/toast';

const Columns = [
  { field: 'order_id', header: 'Cliente', style: { width: '25%' } },
  { field: 'date', header: 'Fecha', style: { width: '15%' }, body: (rowData) => new Date(rowData.date).toLocaleDateString('es-ES') },
  { field: 'total_price', header: 'Total', style: { width: '15%' }, body: (rowData) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.total_price) },
];

const VentaView = () => {
  const [ventas, setVentas] = useState([]);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [ventaEditando, setVentaEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const response = await VentaService.getAll();
      if (response.success) {
        setVentas(response.data.results || response.data || []);
      } else {
        console.error('Error al obtener ventas:', response.error);
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar ventas', life: 3000 });
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error inesperado', life: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const handleNuevo = () => {
    setVentaEditando(null);
    setShowDialog(true);
  };

  const handleEditar = () => {
    if (selectedVenta) {
      setVentaEditando(selectedVenta);
      setShowDialog(true);
    }
  };

  const handleGuardar = async (formData) => {
    try {
      if (ventaEditando) {
        const response = await VentaService.update(ventaEditando.id, formData);
        if (response.success) {
          const updatedVentas = ventas.map(v => v.id === ventaEditando.id ? { ...v, ...formData } : v);
          setVentas(updatedVentas);
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Venta actualizada', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await VentaService.create(formData);
        if (response.success) {
          setVentas([...ventas, response.data]);
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Venta creada', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      }

      setShowDialog(false);
      setVentaEditando(null);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
  };

  const handleEliminar = async () => {
    if (selectedVenta) {
      try {
        const response = await VentaService.delete(selectedVenta.id);
        if (response.success) {
          const updatedVentas = ventas.filter(v => v.id !== selectedVenta.id);
          setVentas(updatedVentas);
          setSelectedVenta(null);
          toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Venta eliminada', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
      }
    }
  };

  return (
    <div className="venta-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestión de Ventas</h1>
      </div>

      <div className="bg-white p-6 rounded shadow h-full">
        <TableComponent
          data={ventas}
          loading={loading}
          columns={Columns}
          selection={selectedVenta}
          onSelectionChange={setSelectedVenta}
          header={<ActionButtons
            showCreate={true}
            showEdit={true}
            showDelete={true}
            editDisabled={!selectedVenta}
            deleteDisabled={!selectedVenta}
            onCreate={handleNuevo}
            onEdit={handleEditar}
            onDelete={handleEliminar}
          />}
        />
      </div>

      <VentaForm
        visible={showDialog}
        venta={ventaEditando}
        onHide={() => {
          setShowDialog(false);
          setVentaEditando(null);
        }}
        onSave={handleGuardar}
      />
    </div>
  );
};

export default VentaView;
