import { useRef, useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import TableComponent from '../../../components/layout/TableComponent';
import ActionButtons from '../../../components/layout/ActionButtons';
import VentaService from '../services/VentaService';
import PedidoService from '@/router/pedidos/services/PedidoService';
import VentaForm from '../components/VentaForm';
import DetalleVentaDialog from '../components/DetalleVentaDialog';
import { confirmDialog } from 'primereact/confirmdialog';

const VentaView = () => {
  const toast = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetalleDialog, setShowDetalleDialog] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [ventaEditando, setVentaEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ventaDialogLoading, setVentaDialogLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;

    const fetchVentas = async () => {
      setLoading(true);
      try {
        const response = await VentaService.getAll();
        if (!mounted) return;

        if (response.success) {
          const list = response.data.results || response.data || [];
          const sorted = Array.isArray(list) ? [...list].sort((a, b) => (b.id || 0) - (a.id || 0)) : [];
          const enhanced = sorted.map((v) => {
            if (v.shipping_address || v.shipping_address_str) return v;
            const addr = v.order?.shipping_address || v.order?.customer?.address;
            return { ...v, shipping_address_str: formatAddress(addr) };
          });
          setVentas(enhanced);
        } else {
          console.error('Error al obtener ventas:', response.error);
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar ventas', life: 3000 });
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

    fetchVentas();

    return () => {
      mounted = false;
    };
  }, []);

  const handleNuevo = () => {
    setVentaEditando(null);
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
      } catch (err) {
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
    } catch (error) {
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
        } catch (err) {
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
        if (single.success) {
          setVentas((prev) => {
            const filtered = (prev || []).filter((v) => v.id !== ventaEditando.id);
            const enriched = {
              ...single.data,
              shipping_address_str: formatAddress(
                single.data.shipping_address || single.data.shipping_address_str || single.data.order?.shipping_address || single.data.order?.customer?.address
              ),
              total_price: single.data?.total_price ?? totalNormalized
            };
            const next = [enriched, ...filtered];
            return next.sort((a, b) => (b.id || 0) - (a.id || 0));
          });
        } else {
          const refetch = await VentaService.getAll();
          if (refetch.success) {
            const list = refetch.data?.results || refetch.data || [];
            const enhanced = Array.isArray(list)
              ? list.map((v) => ({
                  ...v,
                  shipping_address_str: formatAddress(
                    v.shipping_address || v.shipping_address_str || v.order?.shipping_address || v.order?.customer?.address
                ),
                total_price: v.total_price ?? totalNormalized
              }))
              : [];
            setVentas(enhanced.sort((a, b) => (b.id || 0) - (a.id || 0)));
          }
        }

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
        let totalNormalized = 0;
        if (saleId && Array.isArray(items) && items.length) {
          // Limpia cualquier detalle existente (defensivo, por si el backend crea por defecto)
          try {
            const existing = await VentaService.getDetailsBySaleId(saleId);
            const list = existing?.data || [];
            for (const det of list) {
              if (det.id) await VentaService.deleteDetail(det.id);
            }
          } catch (err) {
            /* continuar */
          }

          normalized = normalizeDetails(saleId)(items);
          totalNormalized = normalized.reduce((acc, d) => acc + (Number(d.subtotal) || 0), 0);

          for (const detailPayload of normalized) {
            const respDetail = await VentaService.createDetail(detailPayload);
            if (!respDetail.success) {
              const errDet = typeof respDetail.error === 'string' ? respDetail.error : JSON.stringify(respDetail.error);
              throw new Error(errDet || 'No se pudo crear un detalle de venta');
            }
          }
        }

        // Refrescar desde backend para asegurar que la venta y detalles aparezcan en tabla
        const single = saleId ? await VentaService.getById(saleId) : null;
        if (single?.success) {
          setVentas((prev) => {
            const filtered = (prev || []).filter((v) => v.id !== saleId);
            const enriched = {
              ...single.data,
              shipping_address_str: formatAddress(
                single.data.shipping_address || single.data.shipping_address_str || single.data.order?.shipping_address || single.data.order?.customer?.address
              ),
              total_price: single.data?.total_price ?? totalNormalized ?? salePayload.total_price
            };
            const next = [enriched, ...filtered];
            return next.sort((a, b) => (b.id || 0) - (a.id || 0));
          });
        } else {
          const refetch = await VentaService.getAll();
          if (refetch.success) {
            const list = refetch?.data?.results || refetch?.data || [];
            if (Array.isArray(list) && list.length > 0) {
              const enhanced = list.map((v) => ({
                ...v,
                shipping_address_str: formatAddress(
                  v.shipping_address || v.shipping_address_str || v.order?.shipping_address || v.order?.customer?.address
                ),
                total_price: v.total_price ?? totalNormalized ?? salePayload.total_price
              }));
              setVentas(enhanced.sort((a, b) => (b.id || 0) - (a.id || 0)));
            }
          }
        }
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

  const eliminarSeleccionado = async () => {
    if (!selectedVenta) return;
    try {
      const response = await VentaService.delete(selectedVenta.id);
      if (response.success) {
        setVentas((prev) => prev.filter(v => v.id !== selectedVenta.id));
        setSelectedVenta(null);
        VentaService.getAll()
          .then((refetch) => {
            const list = refetch?.data?.results || refetch?.data || [];
            if (Array.isArray(list) && list.length > 0) {
              const enhanced = list.map((v) => ({
                ...v,
                shipping_address_str: formatAddress(
                  v.shipping_address || v.shipping_address_str || v.order?.shipping_address || v.order?.customer?.address
                )
              }));
              setVentas(enhanced.sort((a, b) => (b.id || 0) - (a.id || 0)));
            }
          })
          .catch(() => { /* mantener lista local si falla */ });
        toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Venta eliminada', life: 3000 });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
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

  const filteredVentas = Array.isArray(ventas)
    ? ventas.filter((v) => {
        const term = search.toLowerCase().trim();
        if (!term) return true;
        const addrText = v.shipping_address_str
          || (v.shipping_address && formatAddress(v.shipping_address))
          || (v.order?.shipping_address && formatAddress(v.order.shipping_address))
          || '';
        return (
          (v.order_id || v.order?.id || '').toString().toLowerCase().includes(term) ||
          (v.date || '').toString().toLowerCase().includes(term) ||
          (v.total_price || '').toString().toLowerCase().includes(term) ||
          (v.customer_name || '').toLowerCase().includes(term) ||
          addrText.toLowerCase().includes(term)
        );
      })
    : [];

  const columns = [
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
  ];

  return (
    <div className="venta-view h-full">
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0">Gestión de Ventas</h1>
      </div>

      <TableComponent
        data={filteredVentas}
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
        onSave={handleGuardarDetalle}
      />
    </div>
  );
};

export default VentaView;
