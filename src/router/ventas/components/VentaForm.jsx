import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useState, useEffect } from 'react';
import useClienteStore from '@/store/useClienteStore';
import ProductoService from '@/router/productos/services/ProductoService';

const VentaForm = ({ visible, onHide, onSave, loading, venta = null, pedido = null }) => {
    const { clientes, fetchClientes } = useClienteStore();
    const [productosDisponibles, setProductosDisponibles] = useState([]);

    const [formData, setFormData] = useState({
        cliente: null,
        fecha: new Date(),
        formaPago: 'efectivo',
        items: [],
        total: 0,
        detalles: []
    });

    const [selectedProducto, setSelectedProducto] = useState(null);
    const [cantidad, setCantidad] = useState(1);

    // Formas de pago según el modelo
    const formasPago = [
        { label: 'Efectivo', value: 'efectivo' },
        { label: 'Transferencia', value: 'transferencia' },
        { label: 'Tarjeta', value: 'tarjeta' }
    ];

    const buildItemsFromPedido = (pedidoData) => {
        const detalles = pedidoData?.detalles || pedidoData?.items || [];
        return (detalles || []).map((detalle) => {
            const producto = detalle.producto || detalle.product || {};
            const price = producto.price ?? producto.precio ?? detalle.precioUnitario ?? detalle.precio ?? 0;
            const qty = detalle.cantidad ?? detalle.qty ?? 1;
            return {
                id: detalle.id || Date.now() + Math.random(),
                producto,
                cantidad: qty,
                precioUnitario: price,
                subtotal: price * qty
            };
        });
    };

    const resolveCliente = (clienteData) => {
        if (!clienteData) return null;
        const id = clienteData.id || clienteData.clienteId || clienteData;
        const nombre = clienteData.nombreCompleto || clienteData.nombre || clienteData.name || clienteData.cliente;
        const foundById = clientes.find((c) => c.id === id);
        if (foundById) return foundById;
        const foundByName = clientes.find((c) => c.nombreCompleto === nombre || c.nombre === nombre || c.name === nombre);
        return foundByName || null;
    };

    useEffect(() => {
        if (visible) {
            fetchClientes();
            loadProductos();

            const baseForm = {
                cliente: null,
                fecha: new Date(),
                formaPago: 'efectivo',
                items: [],
                total: 0,
                detalles: []
            };

            if (venta) {
                const itemsVenta = buildItemsFromPedido(venta);
                const totalVenta = itemsVenta.reduce((acc, item) => acc + item.subtotal, 0);
                setFormData({
                    ...baseForm,
                    cliente: resolveCliente(venta.cliente),
                    fecha: venta.fecha ? new Date(venta.fecha) : new Date(),
                    formaPago: venta.formaPago || 'efectivo',
                    items: itemsVenta,
                    detalles: itemsVenta,
                    total: totalVenta
                });
            } else if (pedido) {
                const itemsPedido = buildItemsFromPedido(pedido);
                const totalPedido = itemsPedido.reduce((acc, item) => acc + item.subtotal, 0);
                setFormData({
                    ...baseForm,
                    cliente: resolveCliente(pedido.cliente),
                    fecha: pedido.fechaPedido ? new Date(pedido.fechaPedido) : new Date(),
                    formaPago: 'efectivo',
                    items: itemsPedido,
                    detalles: itemsPedido,
                    total: totalPedido
                });
            } else {
                setFormData(baseForm);
            }

            setSelectedProducto(null);
            setCantidad(1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, fetchClientes, venta, pedido, clientes]);

    const loadProductos = async () => {
        try {
            const response = await ProductoService.getAll();
            if (response.success) {
                setProductosDisponibles(response.data?.results || response.data || []);
            }
        } catch (error) {
            console.error("Error loading products", error);
        }
    };

    const handleAddItem = () => {
        if (!selectedProducto || cantidad <= 0) return;

        const price = selectedProducto.price ?? selectedProducto.precio ?? 0;
        const newItem = {
            id: Date.now(),
            producto: selectedProducto,
            cantidad: cantidad,
            precioUnitario: price,
            subtotal: price * cantidad
        };

        setFormData(prev => {
            const newItems = [...prev.items, newItem];
            const newTotal = newItems.reduce((acc, item) => acc + item.subtotal, 0);
            return {
                ...prev,
                items: newItems,
                detalles: newItems,
                total: newTotal
            };
        });

        setSelectedProducto(null);
        setCantidad(1);
    };

    const handleRemoveItem = (rowData) => {
        setFormData(prev => {
            const newItems = prev.items.filter(item => item.id !== rowData.id);
            const newTotal = newItems.reduce((acc, item) => acc + item.subtotal, 0);
            return {
                ...prev,
                items: newItems,
                detalles: newItems,
                total: newTotal
            };
        });
    };

    const handleSubmit = () => {
        if (!formData.cliente && formData.items.length === 0) {
            // Se permite venta sin cliente según el modelo (opcional)
            return;
        }

        if (formData.items.length === 0) {
            return;
        }

        onSave(formData);
    };

    const precioTemplate = (rowData) => {
        const price = rowData.precioUnitario ?? rowData.producto?.price ?? 0;
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
    };

    const subtotalTemplate = (rowData) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(rowData.subtotal);
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
            <Button
                label="Guardar Venta"
                icon="pi pi-check"
                onClick={handleSubmit}
                disabled={formData.items.length === 0}
                loading={loading}
            />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '850px' }}
            header="Nueva Venta"
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
        >
            <div className="grid">
                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Cliente</label>
                        <Dropdown
                            value={formData.cliente}
                            options={clientes}
                            onChange={(e) => setFormData({ ...formData, cliente: e.value })}
                            optionLabel="nombreCompleto"
                            placeholder="Seleccione un cliente (opcional)"
                            filter
                        />
                        <small className="text-500">El cliente es opcional según el modelo del negocio</small>
                    </div>
                </div>

                <div className="col-12 md:col-3">
                    <div className="field">
                        <label className="font-bold">Fecha</label>
                        <Calendar
                            value={formData.fecha}
                            onChange={(e) => setFormData({ ...formData, fecha: e.value })}
                            showIcon
                            dateFormat="dd/mm/yy"
                        />
                    </div>
                </div>

                <div className="col-12 md:col-3">
                    <div className="field">
                        <label className="font-bold">Forma de Pago *</label>
                        <Dropdown
                            value={formData.formaPago}
                            options={formasPago}
                            onChange={(e) => setFormData({ ...formData, formaPago: e.value })}
                            placeholder="Seleccione forma de pago"
                        />
                    </div>
                </div>

                <div className="col-12">
                    <div className="p-3 border-1 surface-border border-round surface-ground">
                        <h4 className="m-0 mb-3">Agregar Producto</h4>
                        <div className="formgrid grid">
                            <div className="field col-12 md:col-6">
                                <Dropdown
                                    value={selectedProducto}
                                    options={productosDisponibles}
                                    onChange={(e) => setSelectedProducto(e.value)}
                                    optionLabel="name"
                                    placeholder="Seleccione producto"
                                    filter
                                />
                            </div>
                            <div className="field col-12 md:col-3">
                                <InputNumber
                                    value={cantidad}
                                    onValueChange={(e) => setCantidad(e.value)}
                                    showButtons
                                    min={1}
                                    placeholder="Cantidad"
                                />
                            </div>
                            <div className="field col-12 md:col-3">
                                <Button
                                    label="Agregar"
                                    icon="pi pi-plus"
                                    onClick={handleAddItem}
                                    disabled={!selectedProducto}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12">
                    <DataTable value={formData.items} stripedRows size="small" emptyMessage="No hay items agregados">
                        <Column field="producto.name" header="Producto"></Column>
                        <Column field="cantidad" header="Cant." style={{ width: '10%' }}></Column>
                        <Column field="producto.price" header="Precio Unit." body={precioTemplate}></Column>
                        <Column field="subtotal" header="Subtotal" body={subtotalTemplate}></Column>
                        <Column
                            body={(rowData) => (
                                <Button
                                    icon="pi pi-trash"
                                    className="p-button-danger p-button-text p-button-sm"
                                    onClick={() => handleRemoveItem(rowData)}
                                />
                            )}
                            style={{ width: '5%' }}
                        ></Column>
                    </DataTable>
                    <div className="flex justify-content-end mt-3">
                        <h3 className="m-0">
                            Total: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(formData.total)}
                        </h3>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default VentaForm;
