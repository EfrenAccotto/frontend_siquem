import { useRef, useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import PedidoService from '../services/PedidoService';
import PedidoForm from '../components/PedidoForm';
import DetallePedidoDialog from '../components/DetallePedidoDialog';
import { Dropdown } from 'primereact/dropdown';
import useClienteStore from '@/store/useClienteStore';
import { Button } from 'primereact/button';
import VentaForm from '@/router/ventas/components/VentaForm';
import VentaService from '@/router/ventas/services/VentaService';

const estadoOptions = [
  { label: 'Pendiente', value: 'Pendiente' },
  { label: 'Completado', value: 'Completado' },
  { label: 'Cancelado', value: 'Cancelado' }
];

const buildPedidoParams = (filters) => {
  const params = {};
  if (filters?.estado) params.status = filters.estado;
  if (filters?.clienteId) params.client = filters.clienteId;
  if (filters?.search?.trim()) params.search = filters.search.trim();
  return params;
};

const PedidoView = () => {
  const toast = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [showVentaDialog, setShowVentaDialog] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingVenta, setSavingVenta] = useState(false);
  const [filters, setFilters] = useState({ estado: null, clienteId: null, search: '' });
  const { clientes, fetchClientes } = useClienteStore();

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    let mounted = true;

    const fetchPedidos = async () => {
      setLoading(true);
      try {
        const params = buildPedidoParams(filters);
        const response = await PedidoService.getAll(params);
        if (!mounted) return;

        if (response.success) {
          setPedidos(response.data.results || response.data || []);
          setSelectedPedido(null);
        } else {
          console.error('Error al obtener pedidos:', response.error);
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar pedidos', life: 3000 });
        }
      } catch (error) {
        if (mounted) {
          console.error('Error inesperado:', error);
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error inesperado', life: 3000 });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPedidos();

    return () => {
      mounted = false;
    };
  }, [filters]);

  const clienteOptions = (clientes || []).map((cliente) => ({
    label: cliente.nombreCompleto || cliente.nombre || cliente.name,
    value: cliente.id
  }));

  const handleEstadoFilter = (value) => {
    setFilters((prev) => ({ ...prev, estado: value || null }));
  };

  const handleClienteFilter = (value) => {
    setFilters((prev) => ({ ...prev, clienteId: value || null }));
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

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

  const handleVerDetalle = () => {
    if (selectedPedido) {
      setShowDetalleDialog(true);
    }
  };

  const handleGenerarVenta = () => {
    if (selectedPedido) {
      setShowVentaDialog(true);
    }
  };

  const handleGuardar = async (formData) => {
    try {
      if (pedidoEditando) {
        const response = await PedidoService.update(pedidoEditando.id, formData);
        if (response.success) {
          const updatedPedidos = pedidos.map(p => p.id === pedidoEditando.id ? { ...p, ...formData } : p);
          setPedidos(updatedPedidos);
          toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Pedido actualizado', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await PedidoService.create(formData);
        if (response.success) {
          setPedidos([...pedidos, response.data]);
          toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Pedido creado', life: 3000 });
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

  const handleGuardarVenta = async (ventaData) => {
    if (!selectedPedido) return;
    try {
      setSavingVenta(true);
      const payload = {
        ...ventaData,
        pedidoId: selectedPedido.id
      };
      const response = await VentaService.create(payload);
      if (response.success) {
        toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Venta generada desde pedido', life: 3000 });
        setShowVentaDialog(false);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    } finally {
      setSavingVenta(false);
    }
  };

  const handleGuardarDetalle = (pedidoActualizado) => {
    const pedidosActualizados = pedidos.map(p =>
      p.id === pedidoActualizado.id ? pedidoActualizado : p
    );
    setPedidos(pedidosActualizados);
    setSelectedPedido(pedidoActualizado);

    toast.current?.show({
      severity: 'success',
      summary: 'Exito',
      detail: 'Detalle de pedido actualizado correctamente',
      life: 3000
    });
  };

  const handleEliminar = async () => {
    if (selectedPedido) {
      try {
        const response = await PedidoService.delete(selectedPedido.id);
        if (response.success) {
          const updatedPedidos = pedidos.filter(p => p.id !== selectedPedido.id);
          setPedidos(updatedPedidos);
          setSelectedPedido(null);
          toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Pedido eliminado', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
      }
    }
  };

  // Formatear direccion
  const direccionTemplate = (rowData) => {
    return rowData.direccionEnvio || '-';
  };

  // Formatear estado con badge de color
  const estadoTemplate = (rowData) => {
    const estadoClasses = {
      'Pendiente': 'p-badge-warning',
      'Completado': 'p-badge-success',
      'Cancelado': 'p-badge-danger'
    };
    const className = estadoClasses[rowData.estado] || 'p-badge-info';
    return <span className={`p-badge ${className}`}>{rowData.estado}</span>;
  };

  const columns = [
    { field: 'id', header: 'ID', style: { width: '8%' } },
    { field: 'cliente', header: 'Cliente', style: { width: '25%' } },
    {
      field: 'direccionEnvio',
      header: 'Direccion de Envio',
      body: direccionTemplate,
      style: { width: '27%' }
    },
    { field: 'fechaPedido', header: 'Fecha Pedido', style: { width: '15%' } },
    {
      field: 'estado',
      header: 'Estado',
      body: estadoTemplate,
      style: { width: '15%' }
    }
  ];

  return (
    <div className="pedido-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestion de Pedidos</h1>
      </div>

      <TableComponent
        data={pedidos}
        loading={loading}
        columns={columns}
        header={<ActionButtons
          showCreate={true}
          showEdit={true}
          showDelete={true}
          showDetail={true}
          showExport={false}
          editDisabled={!selectedPedido}
          deleteDisabled={!selectedPedido}
          detailDisabled={!selectedPedido}
          onCreate={handleNuevo}
          onEdit={handleEditar}
          onDelete={handleEliminar}
          onDetail={handleVerDetalle}
          searchValue={filters.search}
          onSearch={handleSearch}
          searchPlaceholder="Buscar pedido"
          filtersContent={(
            <>
              <Dropdown
                value={filters.estado}
                options={estadoOptions}
                onChange={(e) => handleEstadoFilter(e.value)}
                placeholder="Estado"
                showClear
                className="w-11rem"
              />
              <Dropdown
                value={filters.clienteId}
                options={clienteOptions}
                onChange={(e) => handleClienteFilter(e.value)}
                placeholder="Cliente"
                showClear
                filter
                className="w-14rem"
              />
            </>
          )}
          extraActions={
            <Button
              label="Generar Venta"
              icon="pi pi-shopping-cart"
              className="p-button-secondary p-button-raised"
              onClick={handleGenerarVenta}
              disabled={!selectedPedido}
              style={(!selectedPedido) ? { opacity: 0.5 } : undefined}
            />
          }
        />}
        selection={selectedPedido}
        onSelectionChange={setSelectedPedido}
      />

      <PedidoForm
        visible={showDialog}
        pedido={pedidoEditando}
        onHide={() => {
          setShowDialog(false);
          setPedidoEditando(null);
        }}
        onSave={handleGuardar}
      />

      <DetallePedidoDialog
        visible={showDetalleDialog}
        pedido={selectedPedido}
        onHide={() => setShowDetalleDialog(false)}
        onSave={handleGuardarDetalle}
      />

      <VentaForm
        visible={showVentaDialog}
        onHide={() => setShowVentaDialog(false)}
        onSave={handleGuardarVenta}
        loading={savingVenta}
        pedido={selectedPedido}
      />
    </div>
  );
};

export default PedidoView;
