import { useRef, useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import PedidoService from '../services/PedidoService';
import ReporteService from '@/router/reportes/services/ReporteService';
import PedidoForm from '../components/PedidoForm';
import DetallePedidoDialog from '../components/DetallePedidoDialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import useClienteStore from '@/store/useClienteStore';
import { Button } from 'primereact/button';
import VentaForm from '@/router/ventas/components/VentaForm';
import VentaService from '@/router/ventas/services/VentaService';
import { confirmDialog } from 'primereact/confirmdialog';
import { extractStockUnit } from '@/utils/unitParser';
import { normalizePaymentMethod } from '@/utils/paymentMethod';

// Estados soportados por backend
const STATUS_MAP = {
  'pending': 'Pendiente',
  'completed': 'Completado',
  'cancelled': 'Cancelado'
};

// Funci?n para traducir estado al espa?ol
const getStatusLabel = (status) => {
  return STATUS_MAP[status] || status || 'Sin Estado';
};

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
  const [loadingRemito, setLoadingRemito] = useState(false);
  const [loadingHojaRuta, setLoadingHojaRuta] = useState(false);
  const [showHojaRutaDialog, setShowHojaRutaDialog] = useState(false);
  const [fechaDesdeHoja, setFechaDesdeHoja] = useState(null);
  const [fechaHastaHoja, setFechaHastaHoja] = useState(null);
  const [estadoHojaRuta, setEstadoHojaRuta] = useState(null);

  // Estados para Modal de Pesajes
  const [showPesajeDialog, setShowPesajeDialog] = useState(false);
  const [fechaDesdePesaje, setFechaDesdePesaje] = useState(null);
  const [fechaHastaPesaje, setFechaHastaPesaje] = useState(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);


  const [loadingVentaBtn, setLoadingVentaBtn] = useState(false);
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
            const addr = p.shipping_address || p.customer?.address;
            const obsShipping = extractShippingFromObservations(p.observations || p.observaciones);
            const shippingStr = p.shipping_address_str || formatAddress(addr) || obsShipping;
            return { ...p, shipping_address_str: shippingStr, shipping_obs: obsShipping };
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

  const handleOpenPesajes = () => {
    setShowPesajeDialog(true);
  };

  const handleGenerarPesajes = async () => {
    if (!fechaDesdePesaje || !fechaHastaPesaje) {
      toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Fecha desde y Fecha hasta son obligatorias', life: 3000 });
      return;
    }

    const dDesde = formatDateISO(fechaDesdePesaje);
    const dHasta = formatDateISO(fechaHastaPesaje);

    // Payload requerido por el backend
    const payload = {
      start_date: dDesde,
      end_date: dHasta,
      state: 'pending' // Hardcodeado por requerimiento
    };

    try {
      const resp = await PedidoService.generateShareLink(payload);
      if (resp.success && resp.data?.share_id) {
        // Construir link con el share_id retornado
        // Frontend Route: /operario/pesajes?uuid={share_id}
        // Nota: resp.data.url es la URL de la API, no la usamos para el usuario final.
        const shareId = resp.data.share_id;
        const frontendUrl = `${window.location.origin}/operario/pesajes?uuid=${shareId}`;

        setGeneratedLink(frontendUrl);
        setShowPesajeDialog(false);
        setShowLinkDialog(true);
      } else {
        throw new Error(resp.error || 'No se pudo generar el link');
      }
    } catch (error) {
      console.error(error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Falló la generación del link', life: 3000 });
    }
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.current?.show({ severity: 'success', summary: 'Copiado', detail: 'Link copiado al portapapeles', life: 2000 });
  };

  const openLinkInNewTab = () => {
    window.open(generatedLink, '_blank');
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

  const extractShippingFromObservations = (obs) => {
    if (!obs) return null;
    const lines = String(obs).split('\n');
    const entregaLine = lines.find((line) => line.toLowerCase().startsWith('entrega:'));
    if (!entregaLine) return null;
    return entregaLine.replace(/entrega:\s*/i, '').trim() || null;
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
      const unit = extractStockUnit(d);
      const resolvedProduct = d.product || d.producto || (productId ? { id: productId, name: productName, price } : null);
      const productoConUnidad = resolvedProduct
        ? { ...resolvedProduct, stock_unit: resolvedProduct.stock_unit || resolvedProduct.stockUnit || unit }
        : null;
      return {
        ...d,
        product_id: productId,
        product_name: productName,
        quantity: qty,
        cantidad: qty,
        stock_unit: unit,
        product_price: price,
        subtotal: d.subtotal ?? Number((price * qty).toFixed(2)),
        producto: productoConUnidad
      };
    });

    const addr = pedidoData.shipping_address || pedidoData.customer?.address;
    const obsShipping = extractShippingFromObservations(pedidoData.observations || pedidoData.observaciones);
    return {
      ...pedidoData,
      shipping_address_str: pedidoData.shipping_address_str || formatAddress(addr) || obsShipping,
      shipping_obs: obsShipping,
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

  const handleGenerarVenta = async () => {
    if (!selectedPedido || selectedPedido.state === 'cancelled') return;
    // Verificar si el pedido ya está completado
    if (selectedPedido.state === 'completed') {
      toast.current?.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Este pedido ya está completado. No se puede generar otra venta.',
        life: 4000
      });
      return;
    }

    setLoadingVentaBtn(true);
    try {
      // fallback inicial en caso de que la carga detallada falle
      setPedidoParaVenta(mapPedidoDetalle(selectedPedido));

      try {
        const resp = await PedidoService.getById(selectedPedido.id);
        if (resp.success) {
          const pedidoCompleto = mapPedidoDetalle(resp.data);
          // Verificar nuevamente con datos actualizados
          if (pedidoCompleto.state === 'completed') {
            toast.current?.show({
              severity: 'warn',
              summary: 'Advertencia',
              detail: 'Este pedido ya está completado. No se puede generar otra venta.',
              life: 4000
            });
            return;
          }
          setSelectedPedido(pedidoCompleto);
          setPedidoParaVenta(pedidoCompleto);
        }
      } catch (_) {
        // continuar con fallback
      }
      setShowVentaDialog(true);
    } finally {
      setLoadingVentaBtn(false);
    }
  };

  const handleGenerarRemito = async () => {
    if (!selectedPedido) return;
    setLoadingRemito(true);
    try {
      const response = await ReporteService.downloadByOrderId(selectedPedido.id);
      if (response.success) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `remito_pedido_${selectedPedido.id}_${selectedPedido.date}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: `No se pudo generar el remito: ${error.message}`, life: 4000 });
    } finally {
      setLoadingRemito(false);
    }
  };

  const formatDateISO = (dateValue) => {
    if (!dateValue) return null;
    if (typeof dateValue === 'string') return dateValue;
    try {
      return dateValue.toISOString().slice(0, 10);
    } catch (_) {
      return null;
    }
  };

  const handleOpenHojaRuta = () => {
    setShowHojaRutaDialog(true);
  };

  const handleGenerarHojaRuta = async () => {
    const dateFrom = formatDateISO(fechaDesdeHoja);
    const dateTo = formatDateISO(fechaHastaHoja);
    const status = estadoHojaRuta || null;
    setLoadingHojaRuta(true);
    try {
      const response = await ReporteService.downloadOrdersByZonePdf({ dateFrom, dateTo, status });
      if (response.success) {
        const contentType = response.headers?.['content-type'] || 'application/pdf';
        const data = response.data;
        const blob =
          data instanceof Blob
            ? data
            : new Blob([data], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const nameFrom = dateFrom || 'todos';
        const nameTo = dateTo || 'todos';
        link.setAttribute('download', `hoja_ruta_zonas_${nameFrom}_${nameTo}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        setShowHojaRutaDialog(false);
      } else {
        throw new Error(response.error || 'No se pudo generar la hoja de ruta');
      }
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'No se pudo generar la hoja de ruta', life: 4000 });
    } finally {
      setLoadingHojaRuta(false);
    }
  };

  const handleGuardar = async (formData, meta = {}) => {
    try {
      if (!pedidoEditando && formData.state === 'cancelled') {
        throw new Error('No se puede crear un pedido ya cancelado.');
      }

      if (pedidoEditando) {
        const response = await PedidoService.update(pedidoEditando.id, formData);
        if (response.success) {
          const updated = response.data || formData;
          const updatedPedidos = [...pedidos.map((p) => {
            if (p.id !== pedidoEditando.id) return p;
            const addr = updated.shipping_address || updated.customer?.address;
            const obsShipping = extractShippingFromObservations(updated.observations || updated.observaciones);
            return { ...p, ...updated, shipping_address_str: formatAddress(addr) || obsShipping, shipping_obs: obsShipping };
          })].sort(
            (a, b) => (b.id || 0) - (a.id || 0)
          );
          setPedidos(updatedPedidos);
          setSelectedPedido(updated);
          toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Pedido actualizado', life: 3000 });
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await PedidoService.create(formData);
        console.log('Respuesta de creación de pedido:', response);
        if (response.success) {
          setPedidos((prev) => {
            const obsShipping = extractShippingFromObservations(response.data?.observations || response.data?.observaciones);
            const shippingOverride = meta?.shipping_address_override || null;
            const enriched = {
              ...response.data,
              shipping_address_str: shippingOverride || formatAddress(
                response.data.shipping_address || response.data.customer?.address
              ) || obsShipping,
              shipping_obs: obsShipping
            };
            const next = [enriched, ...(prev || [])];
            return next.sort((a, b) => (b.id || 0) - (a.id || 0));
          });
          PedidoService.getAll()
            .then((refetch) => {
              const list = refetch?.data?.results || refetch?.data || [];
              if (Array.isArray(list) && list.length > 0) {
                const enhanced = list.map((p) => {
                  const addr = p.shipping_address || p.customer?.address;
                  const obsShipping = extractShippingFromObservations(p.observations || p.observaciones);
                  return { ...p, shipping_address_str: formatAddress(addr) || obsShipping, shipping_obs: obsShipping };
                });
                setPedidos(enhanced.sort((a, b) => (b.id || 0) - (a.id || 0)));
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

      console.log('🔄 Completando pedido con productos del formulario de venta...');
      console.log('📋 Items del formulario:', items);
      // Transformar los items del formulario de venta al formato que espera el serializer
      // Estos items pueden haber sido modificados por el usuario en el modal de venta
      // IMPORTANTE: Solo enviar product_id y quantity - NO enviar subtotal, price, etc.
      const detallesParaEnviar = (items || []).map(item => {
        const productId = item.producto?.id || item.product_id || item.product?.id;
        const quantity = item.cantidad || item.quantity || 1;
        return {
          product_id: productId,
          quantity: Number(quantity) // Asegurar que sea número
        };
      }).filter(detalle => detalle.product_id && detalle.quantity > 0); // Filtrar items válidos

      console.log('📤 Detalles limpiados para OrderSerializer:', detallesParaEnviar);

      // Validar que tengamos al menos un producto
      if (detallesParaEnviar.length === 0) {
        throw new Error('Debe agregar al menos un producto para completar el pedido');
      }

      // Payload con los productos del formulario (pueden ser diferentes a los originales)
      const updatePayload = {
        state: 'completed',
        detail: detallesParaEnviar // Productos del formulario de venta
      };

      const paymentMethod = normalizePaymentMethod(ventaData?.payment_method || ventaData?.paymentMethod);
      updatePayload.payment_method = paymentMethod;

      // Campos adicionales necesarios
      if (selectedPedido.customer_id || selectedPedido.customer?.id) {
        updatePayload.customer_id = selectedPedido.customer_id || selectedPedido.customer?.id;
      }

      if (selectedPedido.date) {
        updatePayload.date = selectedPedido.date;
      }

      if (selectedPedido.observations !== undefined) {
        updatePayload.observations = selectedPedido.observations || '';
      }

      if (selectedPedido.shipping_address_id !== undefined) {
        updatePayload.shipping_address_id = selectedPedido.shipping_address_id;
      }

      console.log('📤 Payload completo con productos modificados:', updatePayload);
      const updateResponse = await PedidoService.update(selectedPedido.id, updatePayload);

      if (!updateResponse.success) {
        const err = typeof updateResponse.error === 'string' ? updateResponse.error : JSON.stringify(updateResponse.error);
        throw new Error(err || 'No se pudo completar el pedido');
      }

      // Actualizar estado local
      const updatedPedido = { ...selectedPedido, state: 'completed' };
      setSelectedPedido(updatedPedido);

      setPedidos(prev => prev.map(p =>
        p.id === selectedPedido.id
          ? { ...p, state: 'completed' }
          : p
      ));

      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Pedido completado con productos actualizados - venta generada automáticamente',
        life: 4000
      });

      console.log('✅ Pedido completado exitosamente con productos del formulario');
      setShowVentaDialog(false);

    } catch (error) {
      const detail = error?.message || 'No se pudo completar el pedido. Revisa los datos e inténtalo nuevamente.';
      console.error('❌ Error completando pedido:', error);
      console.error('❌ Detalles del error:', error.response?.data || error.message);
      toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4000 });
    } finally {
      setSavingVenta(false);
      setPedidoParaVenta(null);
    }
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
                shipping_address_str: formatAddress(p.shipping_address || p.customer?.address) || extractShippingFromObservations(p.observations || p.observaciones)
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
    const obsShipping = rowData.shipping_obs || extractShippingFromObservations(rowData.observations || rowData.observaciones);
    if (obsShipping) return obsShipping;
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
      pending: 'p-badge-warning p-1 border-round-sm',
      completed: 'p-badge-success p-1 border-round-sm',
      cancelled: 'p-badge-danger p-1 border-round-sm',
    };

    const status = rowData.state || rowData.status;
    const className = estadoClasses[status] || 'p-badge-secondary';
    const label = getStatusLabel(status);

    return <span className={`p-badge ${className}`}>{label}</span>;
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
            extraButtons={[
              {
                label: 'Listado de Pesajes',
                icon: 'pi pi-list',
                className: 'p-button-info',
                onClick: handleOpenPesajes,
              },
              {
                label: 'Hoja de ruta',
                icon: 'pi pi-send',
                onClick: handleOpenHojaRuta,
                disabled: loadingHojaRuta,
                loading: loadingHojaRuta
              }
            ]}
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
                  disabled={!selectedPedido || loadingRemito}
                  loading={loadingRemito}
                />
                <Button
                  label={selectedPedido?.state === 'completed' ? 'Ya Completado' : 'Generar Venta'}
                  icon="pi pi-shopping-cart"
                  className={`p-button-raised ${selectedPedido?.state === 'completed' ? 'p-button-success' : 'p-button-secondary'}`}
                  onClick={handleGenerarVenta}
                  disabled={!selectedPedido || loadingVentaBtn || selectedPedido?.state === 'cancelled' || selectedPedido?.state === 'completed'}
                  loading={loadingVentaBtn}
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
        pedido={pedidoParaVenta}
        onHide={() => {
          setShowVentaDialog(false);
          setPedidoParaVenta(null);
        }}
        onSave={handleGuardarVenta}
        loading={savingVenta}
      />

      <Dialog
        header="Link Generado para Responsable de Almacén"
        visible={showLinkDialog}
        onHide={() => setShowLinkDialog(false)}
        style={{ width: '500px' }}
        modal
      >
        <div className="flex flex-column gap-3">
          <p className="m-0 text-color-secondary">
            Enlace temporal válido por 2 horas.
          </p>
          <div className="p-inputgroup">
            <input
              type="text"
              className="p-inputtext p-component w-full"
              value={generatedLink}
              readOnly
            />
            <Button icon="pi pi-copy" onClick={copyLinkToClipboard} tooltip="Copiar" />
            <Button icon="pi pi-external-link" onClick={openLinkInNewTab} tooltip="Abrir" />
          </div>
        </div>
      </Dialog>



      <Dialog
        visible={showHojaRutaDialog}
        onHide={() => setShowHojaRutaDialog(false)}
        header="Generar hoja de ruta por zonas"
        style={{ width: '400px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" className="p-button-text" onClick={() => setShowHojaRutaDialog(false)} disabled={loadingHojaRuta} />
            <Button label="Generar" icon="pi pi-send" onClick={handleGenerarHojaRuta} loading={loadingHojaRuta} />
          </div>
        }
      >
        <div className="grid">
          <div className="col-12">
            <label className="font-bold">Rango de fechas (opcional)</label>
          </div>
          <div className="col-12 md:col-6">
            <div className="field">
              <label className="text-500">Desde</label>
              <Calendar
                value={fechaDesdeHoja}
                onChange={(e) => setFechaDesdeHoja(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className="w-full"
              />
            </div>
          </div>
          <div className="col-12 md:col-6">
            <div className="field">
              <label className="text-500">Hasta</label>
              <Calendar
                value={fechaHastaHoja}
                onChange={(e) => setFechaHastaHoja(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                className="w-full"
              />
            </div>
          </div>
          <div className="col-12">
            <div className="field">
              <label className="font-bold">Estado (opcional)</label>
              <Dropdown
                value={estadoHojaRuta}
                options={estadoOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Todos"
                onChange={(e) => setEstadoHojaRuta(e.value)}
                showClear
                className="w-full"
              />
            </div>
          </div>
          <div className="col-12">
            <small className="text-500 block mt-1">Si no eliges filtros, se generarán todos los pedidos agrupados por zona.</small>
          </div>
        </div>
      </Dialog>

      {/* Nuevo Dialogo Pesajes */}
      <Dialog
        visible={showPesajeDialog}
        onHide={() => setShowPesajeDialog(false)}
        header="Listado de Pesajes"
        style={{ width: '400px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" className="p-button-text" onClick={() => setShowPesajeDialog(false)} />
            <Button label="Generar" icon="pi pi-check" onClick={handleGenerarPesajes} />
          </div>
        }
      >
        <div className="grid">
          <div className="col-12">
            <label className="font-bold">Filtros (Obligatorio)</label>
          </div>
          <div className="col-12 md:col-6">
            <div className="field">
              <label className="text-500">Fecha Desde</label>
              <Calendar
                value={fechaDesdePesaje}
                onChange={(e) => setFechaDesdePesaje(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                required
                className={`w-full ${!fechaDesdePesaje ? 'p-invalid' : ''}`}
              />
              {!fechaDesdePesaje && <small className="p-error block">Requerido</small>}
            </div>
          </div>
          <div className="col-12 md:col-6">
            <div className="field">
              <label className="text-500">Fecha Hasta</label>
              <Calendar
                value={fechaHastaPesaje}
                onChange={(e) => setFechaHastaPesaje(e.value)}
                dateFormat="dd/mm/yy"
                showIcon
                required
                className={`w-full ${!fechaHastaPesaje ? 'p-invalid' : ''}`}
              />
              {!fechaHastaPesaje && <small className="p-error block">Requerido</small>}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default PedidoView;
