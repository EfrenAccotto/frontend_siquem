import { useRef, useState, useEffect, useMemo } from 'react';
import { Toast } from 'primereact/toast';
import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import VentaService from '../services/VentaService';
import PedidoService from '@/router/pedidos/services/PedidoService';
import VentaForm from '../components/VentaForm';
import DetalleVentaDialog from '../components/DetalleVentaDialog';
import { confirmDialog } from 'primereact/confirmdialog';

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

const enrichVenta = (venta = {}, totalFallback = null) => {
  const addr = venta.shipping_address || venta.order?.shipping_address || venta.order?.customer?.address;
  return {
    ...venta,
    shipping_address_str: venta.shipping_address_str || formatAddress(addr),
    total_price: venta.total_price ?? totalFallback ?? 0
  };
};

const enrichVentaList = (list = []) => sortByIdDesc(list).map((venta) => enrichVenta(venta));

const VentaView = () => {
  const DEFAULT_ROWS = 60;
  const toast = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [ventaEditando, setVentaEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ventaDialogLoading, setVentaDialogLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, rows: DEFAULT_ROWS, total: 0 });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const loadVentas = async ({ page = pagination.page, rows = pagination.rows, searchTerm = debouncedSearch } = {}) => {
    setLoading(true);
    try {
      const params = { page, page_size: rows };
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await VentaService.getAll(params);
      if (response.success) {
        const list = response.data || [];
        setVentas(Array.isArray(list) ? enrichVentaList(list) : []);
        setSelectedVenta(null);
        setPagination((prev) => ({
          ...prev,
          page,
          rows,
          total: Number(response.pagination?.count) || 0
        }));
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
    loadVentas({
      page: pagination.page,
      rows: pagination.rows,
      searchTerm: debouncedSearch
    });
  }, [pagination.page, pagination.rows, debouncedSearch]);

  const handleNuevo = () => {
    setVentaEditando(null);
    setShowDialog(true);
  };

  const handleEditar = async () => {
    if (!selectedVenta) return;
    setVentaDialogLoading(true);
    try {
      const resp = await VentaService.getById(selectedVenta.id);
      const ventaBase = resp.success ? resp.data : selectedVenta;

      // Traer detalle de la venta
      let detalleVenta = Array.isArray(ventaBase.detail) ? ventaBase.detail : [];
      try {
        if (!detalleVenta.length) {
          const detResp = await VentaService.getDetailsBySaleId(ventaBase.id);
          if (detResp.success) detalleVenta = detResp.data || [];
        }
      } catch {
        /* continuar con lo que haya */
      }

      // Traer pedido completo si solo tenemos order_id
      let pedidoFull = ventaBase.order || ventaBase.pedido || null;
      if (!pedidoFull && ventaBase.order_id) {
        const pedResp = await PedidoService.getById(ventaBase.order_id);
        if (pedResp.success) pedidoFull = pedResp.data;
      }

      const addr = ventaBase.shipping_address || pedidoFull?.shipping_address || pedidoFull?.customer?.address;
      setVentaEditando({
        ...ventaBase,
        order_id: ventaBase.order_id || ventaBase.order?.id || null,
        detail: detalleVenta,
        pedido: pedidoFull,
        order: pedidoFull || ventaBase.order,
        shipping_address_str: ventaBase.shipping_address_str || formatAddress(addr)
      });
      setShowDialog(true);
    } catch {
      // Fallback: intentar abrir con la selección actual
      setVentaEditando(selectedVenta);
      setShowDialog(true);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la venta completa; usando datos locales.', life: 3000 });
    } finally {
      setVentaDialogLoading(false);
    }
  };

  const handleVerDetalle = () => {
    if (selectedVenta) {
      setShowDetalleDialog(true);
    }
  };

  const handleGuardar = async (salePayload, items = []) => {
    const roundMoney = (val) => Number(Number(val ?? 0).toFixed(2));
    const normalizeDetails = (saleId) => (itemsList = []) =>
      (itemsList || []).map((item) => {
        const qty = item.cantidad || item.quantity || 1;
        const price = roundMoney(item.precioUnitario ?? item.producto?.price ?? item.product?.price ?? item.price ?? 0);
        const subtotal = roundMoney(item.subtotal ?? price * qty);
        return {
          sale_id: saleId,
          product_id: item.producto?.id || item.product_id || item.product?.id,
          quantity: qty,
          price,
          subtotal
        };
      }).filter((d) => d.product_id);

    try {
      if (ventaEditando) {
        const response = await VentaService.update(ventaEditando.id, salePayload);
        if (!response.success) throw new Error(response.error);

        // Reemplazar detalles: eliminar existentes y crear los nuevos
        try {
          const existing = await VentaService.getDetailsBySaleId(ventaEditando.id);
          const list = existing?.data || [];
          for (const det of list) {
            if (det.id) await VentaService.deleteDetail(det.id);
          }
        } catch {
          /* continuar */
        }

        const normalized = normalizeDetails(ventaEditando.id)(items);
        const totalNormalized = normalized.reduce((acc, d) => acc + (Number(d.subtotal) || 0), 0);
        for (const detailPayload of normalized) {
          const respDetail = await VentaService.createDetail(detailPayload);
          if (!respDetail.success) {
            const errDet = typeof respDetail.error === 'string' ? respDetail.error : JSON.stringify(respDetail.error);
            throw new Error(errDet || 'No se pudo guardar un detalle de venta');
          }
        }

        // Refrescar venta puntual y lista para asegurar consistencia
        const single = await VentaService.getById(ventaEditando.id);
        const resolvedVenta = single.success
          ? enrichVenta(single.data, totalNormalized)
          : enrichVenta({ ...ventaEditando, ...response.data, ...salePayload }, totalNormalized);
        setVentas((prev) => {
          const filtered = (prev || []).filter((v) => v.id !== ventaEditando.id);
          return sortByIdDesc([resolvedVenta, ...filtered]);
        });
        await loadVentas();

        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Venta actualizada', life: 3000 });
      } else {
        // Crear venta
        const response = await VentaService.create(salePayload);
        if (!response.success) {
          const err = typeof response.error === 'string' ? response.error : JSON.stringify(response.error);
          throw new Error(err || 'No se pudo crear la venta');
        }

        // Crear detalles de venta usando el sale_id devuelto
        const saleId = response.data?.id;
        let normalized = [];
        if (saleId && Array.isArray(items) && items.length) {
          // Limpia cualquier detalle existente (defensivo, por si el backend crea por defecto)
          try {
            const existing = await VentaService.getDetailsBySaleId(saleId);
            const list = existing?.data || [];
            for (const det of list) {
              if (det.id) await VentaService.deleteDetail(det.id);
            }
          } catch {
            /* continuar */
          }

          normalized = normalizeDetails(saleId)(items);

          for (const detailPayload of normalized) {
            const respDetail = await VentaService.createDetail(detailPayload);
            if (!respDetail.success) {
              const errDet = typeof respDetail.error === 'string' ? respDetail.error : JSON.stringify(respDetail.error);
              throw new Error(errDet || 'No se pudo crear un detalle de venta');
            }
          }
        }

        // Refrescar lista paginada desde backend para asegurar consistencia
        setPagination((prev) => ({ ...prev, page: 1 }));
        await loadVentas({ page: 1 });
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Venta creada correctamente', life: 3000 });
      }

      setShowDialog(false);
      setVentaEditando(null);
    } catch (error) {
      const detail = error?.message || 'No se pudo guardar la venta. Revisa los datos e inténtalo nuevamente.';
      console.error('Error guardando venta:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 5000 });
    }
  };

  const eliminarSeleccionado = async () => {
    if (!selectedVenta) return;
    try {
      const response = await VentaService.delete(selectedVenta.id);
      if (response.success) {
        await loadVentas();
        setSelectedVenta(null);
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Venta eliminada', life: 3000 });
      } else {
        throw new Error(response.error);
      }
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la venta', life: 3000 });
    }
  };

  const handleEliminar = () => {
    if (!selectedVenta) return;
    confirmDialog({
      message: `¿Seguro que deseas eliminar la venta #${selectedVenta.id}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: eliminarSeleccionado
    });
  };

  const columns = useMemo(() => [
    { field: 'id', header: 'ID', style: { width: '10%' } },
    {
      field: 'order_id',
      header: 'Pedido',
      style: { width: '12%' },
      body: (rowData) => rowData.order_id || rowData.order?.id || '-'
    },
    {
      field: 'customer_name',
      header: 'Cliente',
      style: { width: '20%' },
      body: (rowData) => rowData.customer_name || rowData.order?.customer?.first_name && `${rowData.order.customer.first_name} ${rowData.order.customer.last_name}` || '-'
    },
    {
      field: 'shipping_address',
      header: 'Direccion de Envio',
      style: { width: '28%' },
      body: (rowData) => {
        const addrStr = rowData.shipping_address_str || rowData.order?.shipping_address_str;
        const addrObj = rowData.shipping_address || rowData.order?.shipping_address || rowData.order?.customer?.address;
        return addrStr || formatAddress(addrObj) || '-';
      }
    },
    { field: 'date', header: 'Fecha', style: { width: '12%' } },
    {
      field: 'total_price',
      header: 'Total',
      style: { width: '16%' },
      body: (rowData) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.total_price || 0)
    }
  ], []);

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
        header={<ActionButtons
          showCreate={true}
          showEdit={true}
          showDelete={true}
          showExport={false}
          showDetail={true}
          editDisabled={!selectedVenta}
          deleteDisabled={!selectedVenta}
          detailDisabled={!selectedVenta}
          searchValue={search}
          onSearch={(value) => {
            const term = typeof value === 'string' ? value : (value?.target?.value ?? '');
            setSearch(term);
          }}
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
          setVentaDialogLoading(false);
        }}
        onSave={handleGuardar}
        loading={ventaDialogLoading}
      />

      <DetalleVentaDialog
        visible={showDetalleDialog}
        venta={selectedVenta}
        onHide={() => setShowDetalleDialog(false)}
      />
    </div>
  );
};

export default VentaView;
