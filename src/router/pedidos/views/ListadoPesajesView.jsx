import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import PedidoService from '../services/PedidoService';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { parseQuantityValue } from '@/utils/unitParser';
import { useTheme } from '@/context/ThemeContext';

const ListadoPesajesView = () => {
    const [searchParams] = useSearchParams();
    const uuidParam = searchParams.get('uuid'); // Nuevo método
    const dataParam = searchParams.get('data'); // Legacy método (si se desea mantener o quitar)

    const { setTheme: setThemeMode, isDark } = useTheme();

    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [linkExpired, setLinkExpired] = useState(false);
    const [filtersInfo, setFiltersInfo] = useState({ fechaDesde: null, fechaHasta: null, estado: null });
    const [feedback, setFeedback] = useState({ visible: false, status: 'success', message: '' });
    const toast = useRef(null);

    useEffect(() => {
        if (isDark) {
            setThemeMode('light');
        }
    }, [isDark, setThemeMode]);

    const triggerFeedback = (status, message) => {
        const fallbackMessage = status === 'success'
            ? 'Pesaje cargado correctamente'
            : 'Ocurrió un problema al cargar el pesaje';
        setFeedback({ visible: true, status, message: message || fallbackMessage });
    };

    // Efecto principal para cargas datos (soporta uuid o legacy)
    useEffect(() => {
        let mounted = true;

        const fetchPedidos = async () => {
            setLoading(true);
            try {
                if (uuidParam) {
                    // Nuevo flujo: Share Link Backend
                    const response = await PedidoService.getSharedOrders(uuidParam);
                    if (!mounted) return;

                    if (response.success && response.data) {
                        const sharedData = response.data;
                        const list = sharedData.orders || sharedData.results || (Array.isArray(sharedData) ? sharedData : []);

                        const sorted = list.sort((a, b) => (b.id || 0) - (a.id || 0));
                        const mapped = sorted.map(p => ({
                            ...p,
                            detail: mapPedidoDetalle(p)
                        }));
                        setFiltersInfo({
                            fechaDesde: sharedData.start_date ?? sharedData.startDate ?? null,
                            fechaHasta: sharedData.end_date ?? sharedData.endDate ?? null,
                            estado: sharedData.state ?? sharedData.estado ?? null
                        });
                        setPedidos(mapped);
                    } else {
                        // Fallo al obtener (posible expirado o inválido)
                        setLinkExpired(true);
                    }
                } else if (dataParam) {
                    // Legacy Flujo: Client Side Token
                    try {
                        const decoded = atob(dataParam);
                        const payload = JSON.parse(decoded);
                        if (payload.expires && Date.now() > payload.expires) {
                            setLinkExpired(true);
                            setLoading(false);
                            return;
                        }

                        // Cargar pedidos normales con filtros
                        const filters = {
                            fechaDesde: payload.fechaDesde,
                            fechaHasta: payload.fechaHasta,
                            estado: payload.estado
                        };
                        setFiltersInfo(filters);

                        // Reutilizar lógica de filtrado cliente (o llamar al backend con filtros)
                        // Por simplicidad, llamamos getAll y filtramos (como estaba antes)
                        const resp = await PedidoService.getAll();
                        if (!mounted) return;
                        if (resp.success) {
                            let list = resp.data?.results || resp.data || [];
                            // ... lógica de filtrado simple ...
                            if (filters.fechaDesde || filters.fechaHasta || filters.estado) {
                                list = list.filter(p => {
                                    if (filters.estado && p.state !== filters.estado) return false;
                                    if (p.date) {
                                        const pDate = new Date(p.date);
                                        if (filters.fechaDesde && pDate < new Date(filters.fechaDesde)) return false;
                                        if (filters.fechaHasta && pDate > new Date(filters.fechaHasta)) return false;
                                    }
                                    return true;
                                });
                            }
                            const mapped = list.map(p => ({ ...p, detail: mapPedidoDetalle(p) }));
                            setPedidos(mapped);
                        }
                    } catch (e) {
                        console.error(e);
                        setError('Link inválido');
                    }
                } else {
                    setError('Enlace inválido. Falta identificador.');
                }
            } catch (err) {
                console.error(err);
                if (uuidParam) setLinkExpired(true); // Asumir expirado si falla backend share
                else setError('Error al cargar datos');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchPedidos();
        return () => { mounted = false; };
    }, [uuidParam, dataParam]);

    const mapPedidoDetalle = (pedidoData) => {
        const rawDetails =
            (Array.isArray(pedidoData.detail) && pedidoData.detail) ||
            (Array.isArray(pedidoData.detalle) && pedidoData.detalle) ||
            (Array.isArray(pedidoData.items) && pedidoData.items) ||
            [];

        return rawDetails.map((d) => {
            const product = d.product || d.producto || {};
            const stockUnit = product.stock_unit || d.stock_unit || 'unit';
            const parsedQuantity = parseQuantityValue(d.quantity ?? d.cantidad ?? 0);
            return {
                ...d,
                product_id: d.product_id ?? product.id,
                product_name: d.product_name || product.name || 'Producto Desconocido',
                quantity: parsedQuantity,
                stock_unit: stockUnit,
                original_product: product
            };
        });
    };

    const handleQuantityChange = (orderId, itemId, newValue) => {
        setPedidos(prev => prev.map(order => {
            if (order.id !== orderId) return order;
            const updatedDetail = order.detail.map((item) => {
                if (item.product_id === itemId || (item.product?.id === itemId)) {
                    return { ...item, quantity: newValue };
                }
                return item;
            });
            return { ...order, detail: updatedDetail };
        }));
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            if (uuidParam) {
                // Flujo Nuevo: Guardar usando Endpoint Share (Bulk Update)
                const ordersPayload = pedidos.map(order => {
                    const detailPayload = order.detail.map(d => ({
                        id: d.id, // ID del item (OrderItem)
                        quantity: String(d.quantity) // Convertir a string según ejemplo: "12.000"
                    }));
                    return {
                        id: order.id,
                        detail: detailPayload
                    };
                });

                const payload = { orders: ordersPayload };
                const result = await PedidoService.updateSharedOrders(uuidParam, payload);

                if (result.success) {
                    toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cambios guardados correctamente', life: 3000 });
                    triggerFeedback('success');
                } else {
                    throw new Error(result.error || 'Error al guardar cambios.');
                }
            } else {
                // Legacy Flujo: Guardar uno a uno
                const updates = pedidos.map(async (order) => {
                    const payload = {
                        detail: order.detail.map(d => ({
                            product_id: d.product_id,
                            quantity: d.quantity
                        })),
                        customer_id: order.customer_id || order.customer?.id,
                        date: order.date,
                    };
                    return PedidoService.update(order.id, payload);
                });

                const results = await Promise.all(updates);
                const errors = results.filter(r => !r.success);

                if (errors.length > 0) {
                    throw new Error(`Fallaron ${errors.length} actualizaciones.`);
                }
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cambios guardados correctamente', life: 3000 });
                triggerFeedback('success');
            }
        } catch (error) {
            console.error('Error guardando:', error);
            const msg = typeof error === 'string' ? error : (error.message || 'Error al guardar cambios');
            toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
            triggerFeedback('error', `${msg}`);
        } finally {
            setSaving(false);
        }
    };

    const quantityBody = (rowData, orderId) => {
        const isKg = rowData.stock_unit === 'kg' || rowData.stock_unit === 'kilogramos';
        // Si es KG, 3 decimales fijos. Si es unidad, 0 decimales.
        const minDecimals = isKg ? 3 : 0;
        const maxDecimals = isKg ? 3 : 0;

        return (
            <InputNumber
                value={rowData.quantity}
                onValueChange={(e) => handleQuantityChange(orderId, rowData.product_id, e.value)}
                mode="decimal"
                minFractionDigits={minDecimals}
                maxFractionDigits={maxDecimals}
                min={0}
                showButtons={false}
                inputClassName="w-full text-center font-bold"
                className="w-full"
                placeholder={isKg ? "0.000" : "0"}
            />
        );
    };

    if (linkExpired) {
        return (
            <div className="flex justify-content-center align-items-center h-screen bg-gray-100">
                <Card className="text-center shadow-4 w-30rem">
                    <i className="pi pi-clock text-6xl text-orange-500 mb-4"></i>
                    <h2 className="text-900 mb-2">Enlace Expirado</h2>
                    <p className="text-700 mb-4">Este enlace temporal ha caducado. Por favor solicite uno nuevo al administrador.</p>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-content-center align-items-center h-screen bg-gray-100">
                <Card className="text-center shadow-4 w-30rem">
                    <i className="pi pi-exclamation-circle text-6xl text-red-500 mb-4"></i>
                    <h2 className="text-900 mb-2">Error</h2>
                    <p className="text-700 mb-4">{error}</p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center h-screen">
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-primary">
            <Toast ref={toast} />

            {/* Header Tipo App Mobile/Tablet */}
            <div className="bg-white shadow-2 sticky top-0 z-5 px-4 py-3 flex align-items-center justify-content-between">
                <div>
                    <span className="text-xl font-bold text-900 block">Lista de Pesaje</span>
                    <span className="text-sm text-500">
                        {pedidos.length} pedidos • {filtersInfo.fechaDesde || 'Todo'}
                    </span>
                </div>
            </div>

            <div className="p-3 flex flex-column gap-3 max-w-60rem mx-auto" style={{ paddingBottom: '120px' }}>
                {pedidos.length === 0 && (
                    <div className="text-center p-5 text-500">No hay pedidos asignados.</div>
                )}

                {pedidos.map((order) => (
                    <div key={order.id} className="bg-white border-round-xl shadow-1 overflow-hidden transition-all hover:shadow-3">
                        <div className="p-3 border-bottom-1 surface-border bg-gray-50">
                            <div className="flex justify-content-between align-items-start">
                                <div>
                                    <span className="text-primary font-bold text-lg">Pedido #{order.id}</span>
                                    <div className="text-900 font-medium mt-1">
                                        Cliente: {order.customer?.first_name} {order.customer?.last_name}
                                    </div>
                                    <div className="text-600 text-sm mt-1">
                                        <i className="pi pi-map-marker text-xs mr-1"></i>
                                        {order.shipping_address_str || order.customer?.address?.street || 'Sin Dirección'}
                                    </div>
                                    <div className="text-600 text-sm">
                                        <i className="pi pi-calendar text-xs mr-1"></i>
                                        {order.date}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-3">
                            <h4 className="m-0 mb-3 text-700 font-medium text-sm text-uppercase">Lista de Productos</h4>
                            <DataTable value={order.detail} size="small" showHeaders={true} className="p-datatable-sm vertical-align-middle">
                                <Column field="product_name" header="Nombre" className="font-medium text-900"></Column>
                                <Column
                                    header="Cantidad"
                                    body={(rowData) => quantityBody(rowData, order.id)}
                                    style={{ width: '140px' }}
                                    headerClassName="text-center"
                                />
                                <Column
                                    header="Unidad"
                                    body={(r) => <span className="text-sm bg-gray-100 border-round px-2 py-1 uppercase">{r.stock_unit === 'kg' ? 'Kilogramos' : 'Unidades'}</span>}
                                    style={{ width: '100px' }}
                                    className="text-center"
                                    headerClassName="text-center"
                                />
                            </DataTable>
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 w-full p-3 bg-white border-top-1 surface-border shadow-8 z-5 flex justify-content-end">
                <Button
                    label="Guardar cambios"
                    icon="pi pi-save"
                    className="p-button-primary w-full md:w-auto"
                    style={{ minWidth: '200px' }}
                    onClick={handleSaveAll}
                    loading={saving}
                    disabled={pedidos.length === 0}
                />
            </div>

            {feedback.visible && (
                <div className="pesaje-feedback-layer">
                    <Card className={`text-center shadow-6 w-24rem pesaje-feedback-card ${feedback.status === 'success' ? 'is-success' : 'is-error'}`}>
                        <i
                            className={`pi ${feedback.status === 'success' ? 'pi-check-circle' : 'pi-times-circle'} text-6xl mb-4 pesaje-feedback-icon`}
                        ></i>
                        <h2 className="mb-2 pesaje-feedback-title">
                            {feedback.status === 'success' ? 'Pesaje cargado correctamente' : 'Error al cargar el pesaje'}
                        </h2>
                        {feedback.status === 'success' ? '' : <p className="mb-4 pesaje-feedback-message">
                            {feedback.message}
                        </p>}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ListadoPesajesView;
