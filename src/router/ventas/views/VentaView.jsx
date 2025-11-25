import { useRef, useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import VentaService from '../services/VentaService';
import VentaForm from '../components/VentaForm';
import DetalleVentaDialog from '../components/DetalleVentaDialog';

const VentaView = () => {
  const toast = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [ventaEditando, setVentaEditando] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleVerDetalle = () => {
    if (selectedVenta) {
      setShowDetalleDialog(true);
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

  const handleGuardarDetalle = (ventaActualizada) => {
    const ventasActualizadas = ventas.map(v =>
      v.id === ventaActualizada.id ? ventaActualizada : v
    );
    setVentas(ventasActualizadas);
    setSelectedVenta(ventaActualizada);

    toast.current?.show({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Detalle de venta actualizado correctamente',
      life: 3000
    });
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

  const columns = [
    { field: 'id', header: 'ID', style: { width: '8%' } },
    { field: 'cliente', header: 'Cliente', style: { width: '25%' } },
    { field: 'fecha', header: 'Fecha', style: { width: '15%' } },
    {
      field: 'formaPago',
      header: 'Forma de Pago',
      style: { width: '17%' },
      body: (rowData) => {
        const formasPago = {
          efectivo: 'Efectivo',
          transferencia: 'Transferencia',
          tarjeta: 'Tarjeta'
        };
        return formasPago[rowData.formaPago] || rowData.formaPago;
      }
    },
    {
      field: 'montoTotal',
      header: 'Monto Total',
      style: { width: '15%' },
      body: (rowData) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.montoTotal)
    }
  ];

  return (
    <div className="venta-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestión de Ventas</h1>
      </div>

      <TableComponent
        data={ventas}
        loading={loading}
        columns={columns}
        header={<ActionButtons
          showCreate={true}
          showEdit={true}
          showDelete={true}
          showExport={false}
          showDetail={true}
          editDisabled={!selectedVenta}
          deleteDisabled={!selectedVenta}
          detailDisabled={!selectedVenta}
          onCreate={handleNuevo}
          onEdit={handleEditar}
          onDelete={handleEliminar}
          onDetail={handleVerDetalle}
        />}
        selection={selectedVenta}
        onSelectionChange={setSelectedVenta}
      />

      <VentaForm
        visible={showDialog}
        venta={ventaEditando}
        onHide={() => {
          setShowDialog(false);
          setVentaEditando(null);
        }}
        onSave={handleGuardar}
      />

      <DetalleVentaDialog
        visible={showDetalleDialog}
        venta={selectedVenta}
        onHide={() => setShowDetalleDialog(false)}
        onSave={handleGuardarDetalle}
      />
    </div>
  );
};

export default VentaView;
