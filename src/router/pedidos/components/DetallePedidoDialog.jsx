import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { formatQuantityFromSource, extractStockUnit } from '@/utils/unitParser';

const formatAddress = (addr) => {
  if (!addr) return '-';
  const locality = addr.locality_name || addr.locality?.name || '';
  const province = addr.province_name || addr.locality?.province?.name || '';
  const loc = [locality, province].filter(Boolean).join(', ');
  const streetNum = `${addr.street || ''} ${addr.number || ''}`.trim();
  const extra = [addr.floor, addr.apartment].filter(Boolean).join(' ');
  const main = [streetNum, loc ? `(${loc})` : ''].filter(Boolean).join(' ');
  return [main, extra].filter(Boolean).join(' ').trim() || '-';
};

const STATUS_MAP = {
  pending: 'Pendiente',
  completed: 'Completado',
  cancelled: 'Cancelado'
};

const normalizeDetalleItem = (item) => {
  const unit = extractStockUnit(item);
  const ensureUnitOnProduct = (prod) => {
    if (!prod) return null;
    return prod.stock_unit || prod.stockUnit ? prod : { ...prod, stock_unit: unit };
  };

  return {
    ...item,
    stock_unit: unit,
    product: ensureUnitOnProduct(item.product),
    producto: ensureUnitOnProduct(item.producto)
  };
};

const DetallePedidoDialog = ({ visible, pedido, onHide, loading = false }) => {
  const detallesRaw = Array.isArray(pedido?.detalles)
    ? pedido.detalles
    : Array.isArray(pedido?.detail)
      ? pedido.detail
      : Array.isArray(pedido?.items)
        ? pedido.items
        : [];
  const detalles = detallesRaw.map(normalizeDetalleItem);

  const clienteNombre = `${pedido?.customer?.first_name || pedido?.cliente?.first_name || ''} ${pedido?.customer?.last_name || pedido?.cliente?.last_name || ''}`.trim() || '-';
  const direccionEnvio = pedido?.shipping_address_str
    || formatAddress(pedido?.shipping_address || pedido?.customer?.address);
  const observaciones = pedido?.observations || pedido?.observaciones || '-';
  const estadoRaw = pedido?.state || pedido?.estado || '-';
  const estado = STATUS_MAP[estadoRaw] || estadoRaw || '-';
  const fecha = pedido?.date || pedido?.fechaPedido || '-';

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(Number(value) || 0);

  const productoTemplate = (rowData) =>
    rowData.producto?.name ||
    rowData.product?.name ||
    rowData.product_name ||
    (rowData.product_id ? `Producto ${rowData.product_id}` : '-');

  const cantidadTemplate = (rowData) => {
    const qty = rowData.cantidad ?? rowData.quantity ?? 1;
    return formatQuantityFromSource(qty, rowData);
  };

  const precioTemplate = (rowData) => {
    const price =
      rowData.product_price ??
      rowData.price ??
      rowData.precio ??
      rowData.producto?.price ??
      rowData.product?.price ??
      0;
    return formatCurrency(price);
  };

  const subtotalTemplate = (rowData) => {
    const qty = rowData.cantidad ?? rowData.quantity ?? 1;
    const price =
      rowData.product_price ??
      rowData.price ??
      rowData.precio ??
      rowData.producto?.price ??
      rowData.product?.price ??
      0;
    const subtotal = rowData.subtotal ?? price * qty;
    return formatCurrency(subtotal);
  };

  const total = detalles.reduce((acc, item) => {
    const qty = item.cantidad ?? item.quantity ?? 1;
    const price =
      item.product_price ??
      item.price ??
      item.precio ??
      item.producto?.price ??
      item.product?.price ??
      0;
    const subtotal = item.subtotal ?? price * qty;
    return acc + (Number(subtotal) || 0);
  }, 0);

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cerrar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '900px' }}
      header={`Detalle de Pedido ${pedido?.id ? `#${pedido.id}` : ''}`}
      modal
      className="p-fluid"
      footer={footer}
      onHide={onHide}
    >
      {loading ? (
        <div className="flex justify-content-center py-5">
          <ProgressSpinner />
        </div>
      ) : (
        <>
          <div className="grid mb-3">
            <div className="col-12 md:col-6">
              <div className="field">
                <label className="font-bold">Cliente</label>
                <div className="text-lg">{clienteNombre}</div>
              </div>
            </div>
            <div className="col-12 md:col-6">
              <div className="field">
                <label className="font-bold">Dirección de Envío</label>
                <div className="text-lg">{direccionEnvio || '-'}</div>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-bold">Fecha del Pedido</label>
                <div className="text-lg">{fecha || '-'}</div>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-bold">Estado</label>
                <div className="text-lg text-capitalize">{estado}</div>
              </div>
            </div>
            <div className="col-12 md:col-4">
              <div className="field">
                <label className="font-bold">Total Items</label>
                <div className="text-lg">{detalles.length}</div>
              </div>
            </div>
            <div className="col-12">
              <div className="field">
                <label className="font-bold">Observaciones</label>
                <div className="text-lg">{observaciones || '-'}</div>
              </div>
            </div>
          </div>

          <div className="field">
            <label className="font-bold text-lg">Items del Pedido</label>
            <DataTable
              value={detalles}
              dataKey="id"
              emptyMessage="No hay items en este pedido"
              className="p-datatable-sm mt-2"
            >
              <Column header="Producto" body={productoTemplate} style={{ width: '40%' }} />
              <Column header="Cantidad" body={cantidadTemplate} style={{ width: '20%' }} />
              <Column header="Precio" body={precioTemplate} style={{ width: '20%' }} />
              <Column header="Subtotal" body={subtotalTemplate} style={{ width: '20%' }} />
            </DataTable>
          </div>

          <div className="flex justify-content-end mt-3">
            <div className="text-xl font-bold">
              Total: {formatCurrency(total)}
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
};

export default DetallePedidoDialog;
