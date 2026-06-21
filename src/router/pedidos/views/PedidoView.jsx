import { useRef, useState, useEffect, useMemo } from 'react';
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
import { confirmDialog } from 'primereact/confirmdialog';
import { extractStockUnit } from '@/utils/unitParser';
import { normalizePaymentMethod, formatPaymentMethod } from '@/utils/paymentMethod';

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

const sortByIdDesc = (items = []) =>
  [...items].sort((a, b) => (b?.id || 0) - (a?.id || 0));

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

const enrichPedido = (pedido = {}, shippingOverride = null) => {
  const addr = pedido.shipping_address || pedido.customer?.address;
  const shippingObs = extractShippingFromObservations(pedido.observations || pedido.observaciones);

  return {
    ...pedido,
    shipping_address_str: shippingOverride || pedido.shipping_address_str || formatAddress(addr) || shippingObs,
    shipping_obs: pedido.shipping_obs || shippingObs
  };
};

const enrichPedidoList = (list = []) => sortByIdDesc(list).map((pedido) => enrichPedido(pedido));

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

  return {
    ...enrichPedido(pedidoData),
    detail: mapped,
    detalle: mapped,
    detalles: mapped,
    items: mapped
  };
};

const toDateKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  try {
    return value.toISOString().slice(0, 10);
  } catch {
    return null;
  }
};

const getPedidoTotal = (pedidoItem) => {
  const totalRaw = pedidoItem?.total_price ?? pedidoItem?.total;
  const totalNum = Number(totalRaw);
  if (Number.isFinite(totalNum) && totalNum > 0) return totalNum;

  const detailList = pedidoItem?.detail || pedidoItem?.detalles || pedidoItem?.items || [];
  return (detailList || []).reduce((acc, d) => {
    const qty = Number(d.quantity ?? d.cantidad ?? 0) || 0;
    const price = Number(d.product_price ?? d.price ?? d.product?.price ?? d.producto?.price ?? 0) || 0;
    const subtotal = Number(d.subtotal);
    return acc + (Number.isFinite(subtotal) ? subtotal : (qty * price));
  }, 0);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value) || 0);

const newIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const errorDetail = (value, fallback) => {
  if (typeof value === 'string') return value;
  if (value?.detail) return value.detail;
  if (value && typeof value === 'object') return JSON.stringify(value);
  return fallback;
};

const PedidoView = () => {
  const DEFAULT_ROWS = 60;
  const toast = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [showVentaDialog, setShowVentaDialog] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [savingPedido, setSavingPedido] = useState(false);
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


  const [pedidoParaVenta, setPedidoParaVenta] = useState(null);
  const [filters, setFilters] = useState({ estado: null, clienteId: null, search: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, rows: DEFAULT_ROWS, total: 0 });
  const { clientes, fetchClientes } = useClienteStore();
  const savingPedidoRef = useRef(false);
  const loadingPedidoRef = useRef(false);
  const savingVentaRef = useRef(false);
  const pedidoIdempotencyKeyRef = useRef(null);
  const listRequestSequenceRef = useRef(0);
  const mutationSequenceRef = useRef(0);
  const listAbortRef = useRef(null);
  const saleOpenSequenceRef = useRef(0);
  const saleOpenAbortRef = useRef(null);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const loadPedidos = async ({
    page = pagination.page,
    rows = pagination.rows,
    searchTerm = debouncedSearch,
    activeFilters = filters,
    silent = false
  } = {}) => {
    const requestSequence = ++listRequestSequenceRef.current;
    const mutationSequence = mutationSequenceRef.current;
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;
    if (!silent) setLoading(true);
    try {
      const params = {
        ...buildPedidoParams({ ...activeFilters, search: searchTerm }),
        page,
        page_size: rows
      };
      const response = await PedidoService.getAll(params, { signal: controller.signal });

      if (
        requestSequence !== listRequestSequenceRef.current
        || mutationSequence !== mutationSequenceRef.current
      ) return;

      if (response.success) {
        const list = response.data || [];
        const enriched = Array.isArray(list) ? enrichPedidoList(list) : [];
        setPedidos(enriched);
        setSelectedPedido((current) => {
          if (!silent || !current) return null;
          return enriched.find((item) => item.id === current.id) || current;
        });
        setPagination((prev) => ({
          ...prev,
          page,
          rows,
          total: Number(response.pagination?.count) || 0
        }));
      } else {
        console.error('Error al obtener pedidos:', response.error);
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar pedidos', life: 3000 });
      }
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      console.error('Error inesperado:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error inesperado', life: 3000 });
    } finally {
      if (!silent && requestSequence === listRequestSequenceRef.current) setLoading(false);
    }
  };

  const updatePedidoLocally = (rawPedido, { prepend = false } = {}) => {
    const updated = enrichPedido(rawPedido);
    mutationSequenceRef.current += 1;
    setPedidos((current) => {
      const exists = current.some((item) => item.id === updated.id);
      const next = exists
        ? current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
        : (prepend ? [updated, ...current] : current);
      return sortByIdDesc(next);
    });
    setSelectedPedido(updated);
    return updated;
  };

  useEffect(() => {
    loadPedidos({
      page: pagination.page,
      rows: pagination.rows,
      searchTerm: debouncedSearch,
      activeFilters: filters
    });
  // loadPedidos usa refs de secuencia para descartar respuestas obsoletas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.estado, filters.clienteId, debouncedSearch, pagination.page, pagination.rows]);

  const clienteOptions = useMemo(
    () => (
      Array.isArray(clientes)
        ? clientes.map((cliente) => ({
            label: `${cliente.first_name || ''} ${cliente.last_name || ''}`.trim() || cliente.name,
            value: cliente.id
          }))
        : []
    ),
    [clientes]
  );

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
    if (savingPedidoRef.current) return;
    setPedidoEditando(null);
    pedidoIdempotencyKeyRef.current = newIdempotencyKey();
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

  const handleEditar = async () => {
    if (!selectedPedido || loadingPedidoRef.current) return;
    loadingPedidoRef.current = true;
    setLoadingPedido(true);
    try {
      const resp = await PedidoService.getById(selectedPedido.id);
      const pedidoCompleto = resp.success ? mapPedidoDetalle(resp.data) : mapPedidoDetalle(selectedPedido);
      setPedidoEditando(pedidoCompleto);
      setShowDialog(true);
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el pedido', life: 3000 });
    } finally {
      loadingPedidoRef.current = false;
      setLoadingPedido(false);
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
    if (!selectedPedido || selectedPedido.state === 'cancelled' || loadingPedidoRef.current) return;
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

    const orderId = selectedPedido.id;
    const requestSequence = ++saleOpenSequenceRef.current;
    saleOpenAbortRef.current?.abort();
    const controller = new AbortController();
    saleOpenAbortRef.current = controller;
    loadingPedidoRef.current = true;
    setLoadingPedido(true);
    try {
      let loadedSuccessfully = false;

      try {
        const resp = await PedidoService.getById(orderId, { signal: controller.signal });
        if (requestSequence !== saleOpenSequenceRef.current) return;
        if (resp.success) {
          loadedSuccessfully = true;
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
      } catch {
        // El listado no contiene detalles; no se abre un formulario incompleto.
      }
      if (!loadedSuccessfully) {
        setPedidoParaVenta(null);
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el pedido', life: 3000 });
        return;
      }
      if (requestSequence === saleOpenSequenceRef.current) setShowVentaDialog(true);
    } finally {
      if (requestSequence === saleOpenSequenceRef.current) {
        loadingPedidoRef.current = false;
        setLoadingPedido(false);
      }
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
    } catch {
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

  const handleGuardar = async (formData) => {
    if (savingPedidoRef.current) return;
    savingPedidoRef.current = true;
    setSavingPedido(true);
    try {
      if (!pedidoEditando && formData.state === 'cancelled') {
        throw new Error('No se puede crear un pedido ya cancelado.');
      }

      if (pedidoEditando) {
        const response = await PedidoService.update(pedidoEditando.id, formData);
        if (response.success) {
          updatePedidoLocally(response.data);
          toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Pedido actualizado', life: 3000 });
        } else {
          throw new Error(errorDetail(response.error, 'No se pudo actualizar el pedido'));
        }
      } else {
        const idempotencyKey = pedidoIdempotencyKeyRef.current || newIdempotencyKey();
        pedidoIdempotencyKeyRef.current = idempotencyKey;
        const response = await PedidoService.create(formData, idempotencyKey);
        if (response.success) {
          setPagination((prev) => ({ ...prev, page: 1 }));
          updatePedidoLocally(response.data, { prepend: true });
          pedidoIdempotencyKeyRef.current = null;
          toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Pedido creado', life: 3000 });
        } else {
          throw new Error(errorDetail(response.error, 'No se pudo crear el pedido'));
        }
      }

      setShowDialog(false);
      setPedidoEditando(null);
      void loadPedidos({ page: pedidoEditando ? pagination.page : 1, silent: true });
    } catch (error) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message, life: 3000 });
    } finally {
      savingPedidoRef.current = false;
      setSavingPedido(false);
    }
  };

  const handleGuardarVenta = async (ventaData, items = []) => {
    const targetPedido = pedidoParaVenta;
    if (!targetPedido || savingVentaRef.current) return;
    savingVentaRef.current = true;
    try {
      setSavingVenta(true);

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

      // Validar que tengamos al menos un producto
      if (detallesParaEnviar.length === 0) {
        throw new Error('Debe agregar al menos un producto para completar el pedido');
      }

      // Payload con los productos del formulario (pueden ser diferentes a los originales)
      const updatePayload = {
        detail: detallesParaEnviar // Productos del formulario de venta
      };

      const paymentMethod = normalizePaymentMethod(ventaData?.payment_method || ventaData?.paymentMethod);
      updatePayload.payment_method = paymentMethod;

      const updateResponse = await PedidoService.complete(targetPedido.id, updatePayload);

      if (!updateResponse.success) {
        const err = typeof updateResponse.error === 'string' ? updateResponse.error : JSON.stringify(updateResponse.error);
        throw new Error(err || 'No se pudo completar el pedido');
      }

      // Actualizar estado local
      updatePedidoLocally(updateResponse.data.order);

      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Pedido completado con productos actualizados - venta generada automáticamente',
        life: 4000
      });

      setShowVentaDialog(false);
      setPedidoParaVenta(null);
      void loadPedidos({ silent: true });

    } catch (error) {
      const detail = error?.message || 'No se pudo completar el pedido. Revisa los datos e inténtalo nuevamente.';
      toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4000 });
    } finally {
      savingVentaRef.current = false;
      setSavingVenta(false);
    }
  };


  const eliminarSeleccionado = async () => {
    if (!selectedPedido) return;
    try {
      const response = await PedidoService.delete(selectedPedido.id);
      if (response.success) {
        await loadPedidos();
        setSelectedPedido(null);
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

  const observacionesTemplate = (rowData) => {
    const value = rowData.observations || rowData.observaciones || '-';
    return String(value).trim() || '-';
  };

  const columns = useMemo(() => [
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
      style: { width: '24%' }
    },
    {
      field: 'observations',
      header: 'Observacion',
      body: observacionesTemplate,
      style: { width: '18%' }
    },
    { field: 'date', header: 'Fecha Pedido', style: { width: '13%' } },
    {
      field: 'state',
      header: 'Estado',
      body: estadoTemplate,
      style: { width: '12%' }
    }
  ], []);

  const dateFromHojaKey = useMemo(() => toDateKey(fechaDesdeHoja), [fechaDesdeHoja]);
  const dateToHojaKey = useMemo(() => toDateKey(fechaHastaHoja), [fechaHastaHoja]);
  const pedidosHojaRuta = useMemo(
    () => (
      (pedidos || []).filter((p) => {
        if (estadoHojaRuta && p.state !== estadoHojaRuta) return false;
        const pedidoDate = toDateKey(p.date);
        if (!pedidoDate) return true;
        if (dateFromHojaKey && pedidoDate < dateFromHojaKey) return false;
        if (dateToHojaKey && pedidoDate > dateToHojaKey) return false;
        return true;
      })
    ),
    [pedidos, estadoHojaRuta, dateFromHojaKey, dateToHojaKey]
  );
  const totalGeneralHojaRuta = useMemo(
    () => pedidosHojaRuta.reduce((acc, p) => acc + getPedidoTotal(p), 0),
    [pedidosHojaRuta]
  );

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
        rows={pagination.rows}
        first={(pagination.page - 1) * pagination.rows}
        totalRecords={pagination.total}
        rowsPerPageOptions={[10, 25, 50, 60]}
        onPage={(event) => {
          setPagination((prev) => ({
            ...prev,
            page: Math.floor(event.first / event.rows) + 1,
            rows: event.rows
          }));
        }}
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
                  disabled={!selectedPedido || loadingPedido || selectedPedido?.state === 'cancelled' || selectedPedido?.state === 'completed'}
                  loading={loadingPedido}
                />
              </>
            }
          />
        }
        selection={selectedPedido}
        onSelectionChange={(pedido) => {
          saleOpenSequenceRef.current += 1;
          saleOpenAbortRef.current?.abort();
          loadingPedidoRef.current = false;
          setLoadingPedido(false);
          setSelectedPedido(pedido);
        }}
      />

      <PedidoForm
        visible={showDialog}
        pedido={pedidoEditando}
        onHide={() => {
          if (savingPedidoRef.current) return;
          setShowDialog(false);
          setPedidoEditando(null);
          pedidoIdempotencyKeyRef.current = null;
        }}
        onSave={handleGuardar}
        loading={savingPedido}
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
        key={pedidoParaVenta?.id || 'order-sale'}
        visible={showVentaDialog}
        pedido={pedidoParaVenta}
        onHide={() => {
          if (savingVentaRef.current) return;
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
            Enlace temporal válido por 1 dia.
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
        style={{ width: '650px' }}
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
          <div className="col-12">
            <div className="p-3 surface-100 border-round">
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="font-bold">Pedidos incluidos: {pedidosHojaRuta.length}</span>
                <span className="font-bold">Total general: {formatCurrency(totalGeneralHojaRuta)}</span>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {(pedidosHojaRuta || []).map((p) => {
                  const paymentRaw = p.payment_method || p.paymentMethod;
                  const paymentLabel = paymentRaw ? formatPaymentMethod(paymentRaw) : '-';
                  return (
                    <div key={`hoja-ruta-${p.id}`} className="flex justify-content-between align-items-center py-2 border-bottom-1 surface-border">
                      <span>Pedido #{p.id}</span>
                      <span>{paymentLabel}</span>
                      <span>{formatCurrency(getPedidoTotal(p))}</span>
                    </div>
                  );
                })}
                {!pedidosHojaRuta.length && (
                  <small className="text-500">No hay pedidos para los filtros seleccionados.</small>
                )}
              </div>
            </div>
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

