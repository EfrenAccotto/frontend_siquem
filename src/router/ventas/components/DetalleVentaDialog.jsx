import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useState, useEffect } from 'react';
import VentaService from '../services/VentaService';
import PedidoService from '@/router/pedidos/services/PedidoService';
import { formatQuantityFromSource } from '@/utils/unitParser';

const DetalleVentaDialog = ({ visible, venta, onHide }) => {
    const [detalles, setDetalles] = useState([]);
    const [clienteNombre, setClienteNombre] = useState('-');
    const [fechaVenta, setFechaVenta] = useState('-');
    const [formaPago, setFormaPago] = useState('-');
    const [total, setTotal] = useState(0);

    const isDev = import.meta?.env?.MODE !== 'production';

    const mapDetalle = (d) => {
        if (isDev) {
            console.log('[DetalleVentaDialog] detalle raw:', d);
        }
        const productoBase = d.product || d.producto || d.product_data || { id: d.product_id, name: d.product_name };
        const producto = {
            ...productoBase,
            stock_unit: productoBase?.stock_unit || d.product_stock_unit || d.stock_unit
        };
        if (isDev) {
            console.log('[DetalleVentaDialog] producto resuelto:', producto, 'stock_unit:', producto?.stock_unit);
        }
        const cantidad = d.quantity || d.cantidad || d.qty || 1;
        const precioUnit = d.price ?? d.precio ?? d.precioUnitario ?? d.unit_price ?? d.unit_price_with_tax ?? d.product_price ?? producto.price ?? 0;
        const subtotalRaw = d.subtotal ?? d.total ?? d.computed_subtotal ?? (precioUnit * cantidad);
        const precioUnitNum = Number(precioUnit) || 0;
        const subtotal = Number(subtotalRaw) || (precioUnitNum * (Number(cantidad) || 0));
        return {
            id: d.id || Date.now() + Math.random(),
            producto,
            cantidad,
            precioUnitario: precioUnitNum,
            subtotal
        };
    };

    const extractOrderDetails = (orderData) => {
        const candidates = [
            orderData?.detalles,
            orderData?.detail,
            orderData?.details,
            orderData?.items,
            orderData?.order_items,
            orderData?.orderDetails,
            orderData?.order_details
        ].filter(Array.isArray);
        return candidates.length ? candidates[0] : [];
    };

    useEffect(() => {
        const loadDetails = async () => {
            if (!venta?.id) {
                setDetalles([]);
                setTotal(0);
                return;
            }
            const resp = await VentaService.getDetailsBySaleId(venta.id);
            if (isDev) {
                console.log('[DetalleVentaDialog] getDetailsBySaleId resp:', resp);
                console.log('[DetalleVentaDialog] detalles venta raw:', resp?.data);
            }
            if (resp.success) {
                const list = resp.data?.results || resp.data || [];
                if (list.length > 0) {
                    const mapped = list.map(mapDetalle);
                    setDetalles(mapped);
                    setTotal(mapped.reduce((acc, it) => acc + (it.subtotal || 0), 0));
                    return;
                }
            }

            // Fallback: si no hay detalles de venta, mostrar los del pedido asociado
            const orderId = venta?.order_id || venta?.order?.id;
            if (orderId) {
                try {
                    const orderResp = await PedidoService.getById(orderId);
                    if (isDev) {
                        console.log('[DetalleVentaDialog] PedidoService.getById resp:', orderResp);
                        console.log('[DetalleVentaDialog] pedido raw:', orderResp?.data);
                        console.log('[DetalleVentaDialog] detalles pedido raw:', extractOrderDetails(orderResp?.data));
                    }
                    if (orderResp.success) {
                        const detallesPedido = extractOrderDetails(orderResp.data);
                        const mapped = detallesPedido.map(mapDetalle);
                        setDetalles(mapped);
                        setTotal(mapped.reduce((acc, it) => acc + (it.subtotal || 0), 0));
                        return;
                    }
                } catch (err) {
                    /* ignore */
                }
            }

            // Último recurso: usar detalle embebido en la venta si existe
            if (venta?.detail) {
                const mapped = (venta.detail || []).map(mapDetalle);
                setDetalles(mapped);
                setTotal(mapped.reduce((acc, it) => acc + (it.subtotal || 0), 0));
            } else {
                setDetalles([]);
                setTotal(0);
            }
        };
        loadDetails();
    }, [venta]);

    // Recalcular total si cambian los detalles (defensivo)
    useEffect(() => {
        const nuevoTotal = (detalles || []).reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
        setTotal(nuevoTotal);
    }, [detalles]);

    // Cargar datos del pedido asociado para mostrar cliente/fecha/forma de pago
    useEffect(() => {
        const loadOrder = async () => {
            const orderId = venta?.order_id || venta?.order?.id;
            if (!orderId) {
                setClienteNombre('-');
                setFechaVenta(venta?.date || venta?.fecha || '-');
                setFormaPago(venta?.payment_method || venta?.formaPago || '-');
                return;
            }
            try {
                const resp = await PedidoService.getById(orderId);
                if (resp.success) {
                    const order = resp.data;
                    const customer = order?.customer || order?.cliente;
                    const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : '-';
                    setClienteNombre(fullName || '-');
                    setFechaVenta(order?.date || order?.fechaPedido || venta?.date || '-');
                    setFormaPago(order?.payment_method || venta?.payment_method || venta?.formaPago || '-');
                    if (!detalles.length) {
                        const detallesPedido = extractOrderDetails(order);
                        const mapped = detallesPedido.map(mapDetalle);
                        setDetalles(mapped);
                        setTotal(mapped.reduce((acc, it) => acc + (it.subtotal || 0), 0));
                    }
                } else {
                    setClienteNombre('-');
                    setFechaVenta(venta?.date || venta?.fecha || '-');
                    setFormaPago(venta?.payment_method || venta?.formaPago || '-');
                }
            } catch (err) {
                setClienteNombre('-');
                setFechaVenta(venta?.date || venta?.fecha || '-');
                setFormaPago(venta?.payment_method || venta?.formaPago || '-');
            }
        };
        loadOrder();
    }, [venta]);

    const productoBodyTemplate = (rowData) => {
        return rowData.producto?.name || '-';
    };

    const precioBodyTemplate = (rowData) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.precioUnitario || 0);
    };

    const subtotalBodyTemplate = (rowData) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.subtotal || 0);
    };

    const calcularTotal = () => {
        return detalles.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    };

    const footer = (
        <div className="flex justify-content-between align-items-center">
            <div className="text-xl font-bold">
            </div>
            <div className="flex gap-2">
                <Button
                    label="Cerrar"
                    icon="pi pi-times"
                    onClick={onHide}
                    className="p-button-text"
                />
            </div>
        </div>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '900px' }}
            header={`Detalle de Venta ${venta?.id ? `#${venta.id}` : ''}`}
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
        >
            <div className="grid mb-3">
                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Cliente</label>
                        <div className="text-lg">{clienteNombre}</div>
                    </div>
                </div>
                <div className="col-12 md:col-3">
                    <div className="field">
                        <label className="font-bold">Fecha</label>
                        <div className="text-lg">{fechaVenta || '-'}</div>
                    </div>
                </div>
                <div className="col-12 md:col-3">
                    <div className="field">
                        <label className="font-bold">Forma de Pago</label>
                        <div className="text-lg">{formaPago || '-'}</div>
                    </div>
                </div>
            </div>

            <div className="field">
                <div className="flex justify-content-between align-items-center mb-2">
                    <label className="font-bold text-lg">Items de la Venta</label>
                </div>

                <DataTable
                    value={detalles}
                    dataKey="id"
                    emptyMessage="No hay items en esta venta"
                    className="p-datatable-sm"
                >
                    <Column
                        header="Producto"
                        body={productoBodyTemplate}
                        style={{ width: '40%' }}
                    />
                    <Column
                        header="Cantidad"
                        body={(rowData) => formatQuantityFromSource(rowData.cantidad, rowData)}
                        style={{ width: '15%' }}
                    />
                    <Column
                        header="Precio Unitario"
                        body={precioBodyTemplate}
                        style={{ width: '20%' }}
                    />
                    <Column
                        header="Subtotal"
                        body={subtotalBodyTemplate}
                        style={{ width: '20%' }}
                    />
                </DataTable>
            </div>

            <div className="flex justify-content-end mt-3">
                <div className="text-xl font-bold">
                    Total: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)}
                </div>
            </div>
        </Dialog>
    );
};

export default DetalleVentaDialog;
