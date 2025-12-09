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
import { confirmDialog } from 'primereact/confirmdialog';

const estadoOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Completado', value: 'completed' },
  { label: 'Cancelado', value: 'cancelled' }
];

const buildPedidoParams = (filters) => {
  const params = {};
  if (filters?.estado) params.state = filters.estado;
  if (filters?.clienteId) params.customer = filters.clienteId;
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
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [pedidoDialogLoading, setPedidoDialogLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingVenta, setSavingVenta] = useState(false);
  const [pedidoParaVenta, setPedidoParaVenta] = useState(null);
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
          const list = response.data?.results || response.data || [];
          const sorted = Array.isArray(list) ? [...list].sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
          const enhanced = sorted.map((p) => {
            if (p.shipping_address_str) return p;
            const addr = p.shipping_address || p.customer?.address;
            return { ...p, shipping_address_str: formatAddress(addr) };
          });
          setPedidos(enhanced);
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

  const clienteOptions = Array.isArray(clientes)
    ? clientes.map((cliente) => ({
        label: `${cliente.first_name || ''} ${cliente.last_name || ''}`.trim() || cliente.name,
        value: cliente.id
      }))
    : [];

  const handleEstadoFilter = (value) => {
    setFilters((prev) => ({ ...prev, estado: value || null }));
  };

  const handleClienteFilter = (value) => {
    setFilters((prev) => ({ ...prev, clienteId: value || null }));
  };

  const handleSearch = (value) => {
    const term = typeof value === 'string'
      ? value
      : (value?.target?.value ?? '');
    setFilters((prev) => ({ ...prev, search: term }));
  };

  const handleNuevo = () => {
    setPedidoEditando(null);
    setShowDialog(true);
  };

  const formatAddress = (addr) => {
    if (!addr) return null;
    const locality = addr.locality_name || addr.locality?.name || '';
    const province = addr.province_name || addr.locality?.province?.name || '';
    const loc = [locality, province].filter(Boolean).join(', ');
    const streetNum = `${addr.street || ''} ${addr.number || ''}`.trim();
    const extra = [addr.floor, addr.apartment].filter(Boolean).join(' ');
    const main = [streetNum, loc ? `(${loc})` : ''].filter(Boolean).join(' ');
    return [main, extra].filter(Boolean).join(' ').trim() || null;
  };

  const mapPedidoDetalle = (pedidoData = {}) => {
    const detalles =
      (Array.isArray(pedidoData.detail) && pedidoData.detail) ||
      (Array.isArray(pedidoData.detalle) && pedidoData.detalle) ||
      (Array.isArray(pedidoData.detalles) && pedidoData.detalles) ||
      (Array.isArray(pedidoData.items) && pedidoData.items) ||
      [];

    const mapped = detalles.map((d) => {
      const productId = d.product_id ?? d.product?.id ?? d.producto?.id ?? d.producto_id;
      const productName = d.product_name || d.product?.name || d.producto?.name || (productId ? `Producto ${productId}` : 'Producto');
      const qty = d.quantity ?? d.cantidad ?? 1;
      const price = d.product_price ?? d.price ?? d.precio ?? d.product?.price ?? d.producto?.price ?? 0;
      return {
        ...d,
        product_id: productId,
        product_name: productName,
        quantity: qty,
        cantidad: qty,
        product_price: price,
        subtotal: d.subtotal ?? Number((price * qty).toFixed(2)),
        producto: d.product || d.producto || (productId ? { id: productId, name: productName, price } : null)
      };
    });

    const addr = pedidoData.shipping_address || pedidoData.customer?.address;
    return {
      ...pedidoData,
      shipping_address_str: pedidoData.shipping_address_str || formatAddress(addr),
      detail: mapped,
      detalle: mapped,
      detalles: mapped,
      items: mapped
    };
  };

  const handleEditar = async () => {
    if (!selectedPedido) return;
    setPedidoDialogLoading(true);
    try {
      const resp = await PedidoService.getById(selectedPedido.id);
      const pedidoCompleto = resp.success ? mapPedidoDetalle(resp.data) : mapPedidoDetalle(selectedPedido);
      setPedidoEditando(pedidoCompleto);
      setShowDialog(true);
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el pedido', life: 3000 });
    } finally {
      setPedidoDialogLoading(false);
    }
  };

  const handleVerDetalle = () => {
    if (!selectedPedido) return;
    setDetalleLoading(true);
    PedidoService.getById(selectedPedido.id)
      .then((resp) => {
        if (resp.success) {
          const pedidoCompleto = mapPedidoDetalle(resp.data);
          setPedidoDetalle(pedidoCompleto);
        } else {
          setPedidoDetalle(mapPedidoDetalle(selectedPedido));
        }
      })
      .catch(() => {
        setPedidoDetalle(mapPedidoDetalle(selectedPedido));
      })
      .finally(() => {
        setShowDetalleDialog(true);
        setDetalleLoading(false);
      });
  };

  const handleGenerarVenta = () => {
    if (!selectedPedido) return;
    // fallback inicial en caso de que la carga detallada falle
    setPedidoParaVenta(mapPedidoDetalle(selectedPedido));

    PedidoService.getById(selectedPedido.id)
      .then((resp) => {
        if (resp.success) {
          const pedidoCompleto = mapPedidoDetalle(resp.data);
          setSelectedPedido(pedidoCompleto);
          setPedidoParaVenta(pedidoCompleto);
        }
      })
      .finally(() => setShowVentaDialog(true));
  };

  const handleGenerarRemito = async () => {
    if (!selectedPedido) return;
    try {
      const response = await PedidoService.generateRemito(selectedPedido.id);
      if (response.success) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `remito_pedido_${selectedPedido.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: `No se pudo generar el remito: ${error.message}`, life: 4000 });
    }
  };

  const handleGuardar = async (formData) => {
    try {
      if (pedidoEditando) {
        const response = await PedidoService.update(pedidoEditando.id, formData);
        if (response.success) {
          const updated = response.data || formData;
          const updatedPedidos = [...pedidos.map((p) => {
            if (p.id !== pedidoEditando.id) return p;
            const addr = updated.shipping_address || updated.customer?.address;
            return { ...p, ...updated, shipping_address_str: formatAddress(addr) };
          })].sort(
            (a, b) => (b.id || 0) - (a.id || 0)
          );
          setPedidos(updatedPedidos);
          toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Pedido actualizado', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await PedidoService.create(formData);
        if (response.success) {
          setPedidos((prev) => {
            const enriched = {
              ...response.data,
              shipping_address_str: formatAddress(
                response.data.shipping_address || response.data.customer?.address
              )
            };
            const next = [enriched, ...(prev || [])];
            return next.sort((a, b) => (b.id || 0) - (a.id || 0));
          });
          PedidoService.getAll()
            .then((refetch) => {
              const list = refetch?.data?.results || refetch?.data || [];
              if (Array.isArray(list) && list.length > 0) {
                setPedidos([...list].sort((a, b) => (b.id || 0) - (a.id || 0)));
              }
            })
            .catch(() => {
              /* mantener lista optimista si falla */
            });
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

  const handleGuardarVenta = async (ventaData, items = []) => {
    if (!selectedPedido) return;
    try {
      setSavingVenta(true);

      const total = (items || []).reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
      const payload = { ...ventaData, total_price: Number(total.toFixed(2)) };

      const response = await VentaService.create(payload);
      if (!response.success) {
        const err = typeof response.error === 'string' ? response.error : JSON.stringify(response.error);
        throw new Error(err || 'No se pudo crear la venta');
      }

      const saleId = response.data?.id;

      if (saleId && Array.isArray(items) && items.length) {
        let existingProductIds = new Set();
        try {
          const existing = await VentaService.getDetailsBySaleId(saleId);
          const list = existing?.data || [];
          existingProductIds = new Set(list.map((d) => d.product_id || d.product?.id).filter(Boolean));
        } catch (_) {
          // seguimos con set vacío
        }

        const normalized = (items || [])
          .map((item) => {
            const qty = item.cantidad || item.quantity || 1;
            const price =
              item.precioUnitario ??
              item.product_price ??
              item.producto?.price ??
              item.product?.price ??
              0;
            const productId = item.producto?.id || item.product_id || item.product?.id;
            return {
              sale_id: saleId,
              product_id: productId,
              quantity: qty,
              price,
              subtotal: item.subtotal ?? Number((price * qty).toFixed(2))
            };
          })
          .filter((d) => d.product_id && !existingProductIds.has(d.product_id));

        for (const detailPayload of normalized) {
          const detailResp = await VentaService.createDetail(detailPayload);
          if (!detailResp.success) {
            const errDet =
              typeof detailResp.error === 'string' ? detailResp.error : JSON.stringify(detailResp.error);
            throw new Error(errDet || 'No se pudo crear un detalle de venta');
          }
        }
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Venta generada desde pedido',
        life: 3000
      });
      setShowVentaDialog(false);
    } catch (error) {
      const detail =
        error?.message || 'No se pudo crear la venta. Revisa los datos e inténtalo nuevamente.';
      console.error('Error generando venta desde pedido:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4000 });
    } finally {
      setSavingVenta(false);
      setPedidoParaVenta(null);
    }
  };

  const handleGuardarDetalle = (pedidoActualizado) => {
    const pedidosActualizados = pedidos.map((p) =>
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

  const eliminarSeleccionado = async () => {
    if (!selectedPedido) return;
    try {
      const response = await PedidoService.delete(selectedPedido.id);
      if (response.success) {
        setPedidos((prev) => prev.filter((p) => p.id !== selectedPedido.id));
        setSelectedPedido(null);
        PedidoService.getAll()
          .then((refetch) => {
            const list = refetch?.data?.results || refetch?.data || [];
            if (Array.isArray(list) && list.length > 0) {
              const enhanced = list.map((p) => ({
                ...p,
                shipping_address_str: formatAddress(p.shipping_address || p.customer?.address)
              }));
              setPedidos(enhanced.sort((a, b) => (b.id || 0) - (a.id || 0)));
            }
          })
          .catch(() => {
            /* mantener lista local si falla */
          });
        toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Pedido eliminado', life: 3000 });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    }
  };

  const handleEliminar = () => {
    if (!selectedPedido) return;
    confirmDialog({
      message: `¿Seguro que deseas eliminar el pedido #${selectedPedido.id}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: eliminarSeleccionado
    });
  };

  // Filtro cliente/estado/búsqueda en front para garantizar funcionamiento
  const filteredPedidos = Array.isArray(pedidos)
    ? pedidos.filter((p) => {
        const term = (filters.search || '').toLowerCase().trim();
        if (filters.estado && p.state !== filters.estado) return false;
        if (filters.clienteId && (p.customer?.id || p.customer_id) !== filters.clienteId) return false;
        if (!term) return true;

        const nombre = `${p.customer?.first_name || ''} ${p.customer?.last_name || ''}`.toLowerCase();
        const idMatch = (p.id || '').toString().toLowerCase().includes(term);
        const obsMatch = (p.observations || '').toLowerCase().includes(term);
        const fechaMatch = (p.date || '').toString().toLowerCase().includes(term);
        const nombreMatch = nombre.includes(term);

        return idMatch || obsMatch || fechaMatch || nombreMatch;
      })
    : [];

  const direccionTemplate = (rowData) => {
    if (rowData.shipping_address_str) return rowData.shipping_address_str;
    const addr = rowData.shipping_address || rowData.customer?.address;
    if (!addr) return '-';
    const locality = addr.locality_name || addr.locality?.name || '';
    const province = addr.province_name || addr.locality?.province?.name || '';
    const locProv = [locality, province].filter(Boolean).join(', ');
    const street = addr.street || '';
    const number = addr.number || '';
    const base = `${street} ${number}`.trim();
    const extra = [addr.floor, addr.apartment].filter(Boolean).join(' ');
    const main = [base, locProv ? `(${locProv})` : ''].filter(Boolean).join(' ');
    return [main, extra].filter(Boolean).join(' ').trim() || '-';
  };

  const estadoTemplate = (rowData) => {
    const estadoClasses = {
      pending: 'p-badge-warning',
      completed: 'p-badge-success',
      cancelled: 'p-badge-danger'
    };
    const className = estadoClasses[rowData.state] || 'p-badge-info';
    return <span className={`p-badge ${className}`}>{rowData.state}</span>;
  };

  const columns = [
    { field: 'id', header: 'ID', style: { width: '8%' } },
    {
      field: 'customer',
      header: 'Cliente',
      body: (rowData) =>
        `${rowData.customer?.first_name || ''} ${rowData.customer?.last_name || ''}`.trim() || '-',
      style: { width: '25%' }
    },
    {
      field: 'shipping_address',
      header: 'Direccion de Envio',
      body: direccionTemplate,
      style: { width: '27%' }
    },
    { field: 'date', header: 'Fecha Pedido', style: { width: '15%' } },
    {
      field: 'state',
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
        data={filteredPedidos}
        loading={loading}
        columns={columns}
        header={
          <ActionButtons
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
            filtersContent={
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
            }
            extraActions={
              <>
                <Button
                  label="Generar Remitos"
                  icon="pi pi-file"
                  className="p-button-help p-button-raised mr-2"
                  onClick={handleGenerarRemito}
                  disabled={!selectedPedido}
                />
                <Button
                  label="Generar Venta"
                  icon="pi pi-shopping-cart"
                  className="p-button-secondary p-button-raised"
                  onClick={handleGenerarVenta}
                  disabled={!selectedPedido}
                />
              </>
            }
          />
        }
        selection={selectedPedido}
        onSelectionChange={setSelectedPedido}
      />

      <PedidoForm
        visible={showDialog}
        pedido={pedidoEditando}
        onHide={() => {
          setShowDialog(false);
          setPedidoEditando(null);
          setPedidoDialogLoading(false);
        }}
        onSave={handleGuardar}
        loading={pedidoDialogLoading}
      />

      <DetallePedidoDialog
        visible={showDetalleDialog}
        pedido={pedidoDetalle || mapPedidoDetalle(selectedPedido || {})}
        loading={detalleLoading}
        onHide={() => {
          setShowDetalleDialog(false);
          setPedidoDetalle(null);
        }}
      />

      <VentaForm
        visible={showVentaDialog}
        onHide={() => {
          setShowVentaDialog(false);
          setPedidoParaVenta(null);
        }}
        onSave={handleGuardarVenta}
        loading={savingVenta}
        pedido={pedidoParaVenta || selectedPedido}
      />
    </div>
  );
};

export default PedidoView;
