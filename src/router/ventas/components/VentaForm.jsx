import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useMemo, useState } from 'react';
import useClienteStore from '@/store/useClienteStore';
import ProductoService from '@/router/productos/services/ProductoService';
import PedidoService from '@/router/pedidos/services/PedidoService';
import VentaService from '@/router/ventas/services/VentaService';
import { formatQuantityFromSource } from '@/utils/unitParser';
import { PAYMENT_METHOD_OPTIONS, DEFAULT_PAYMENT_METHOD, normalizePaymentMethod } from '@/utils/paymentMethod';

const buildItemsFromPedido = (pedidoData, productos = []) => {
  const detalles =
    pedidoData?.detalles ||
    pedidoData?.detalle ||
    pedidoData?.items ||
    pedidoData?.detail ||
    pedidoData?.details ||
    [];

  return (detalles || []).map((detalle) => {
    let producto = detalle.producto || detalle.product || detalle.product_id || {};
    if (typeof producto === 'number') {
      producto = productos.find((p) => p.id === producto) || { id: producto };
    } else if (producto?.id) {
      const found = productos.find((p) => p.id === producto.id);
      producto = found || producto;
    } else if (detalle.product_id) {
      producto = productos.find((p) => p.id === detalle.product_id) || { id: detalle.product_id };
    }

    if (!producto.name && detalle.product_name) {
      producto = { ...producto, name: detalle.product_name };
    }

    const precioDetalle = detalle.product_price ?? detalle.precioUnitario ?? detalle.precio ?? detalle.price;
    if (producto.price == null && precioDetalle != null) {
      producto = { ...producto, price: precioDetalle };
    }
    if (!producto.name && producto.id) {
      producto = { ...producto, name: `Producto ${producto.id}` };
    }

    const price = producto.price ?? producto.precio ?? precioDetalle ?? 0;
    const qty = detalle.cantidad ?? detalle.qty ?? detalle.quantity ?? 1;
    const subtotal = detalle.subtotal ?? price * qty;

    return {
      id: detalle.id || Date.now() + Math.random(),
      producto,
      cantidad: qty,
      precioUnitario: price,
      subtotal
    };
  });
};

const recalcTotal = (itemsList = []) =>
  (itemsList || []).reduce((acc, item) => {
    const qty = item.cantidad ?? item.quantity ?? 1;
    const price = item.precioUnitario ?? item.product_price ?? item.producto?.price ?? item.product?.price ?? 0;
    const subtotal = item.subtotal ?? price * qty;
    return acc + (Number(subtotal) || 0);
  }, 0);

const VentaForm = ({ visible, onHide, onSave, loading, venta = null, pedido = null }) => {
  const { clientes, fetchClientes } = useClienteStore();
  const isVentaCompleted = true;
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [formData, setFormData] = useState({
    cliente: null,
    fecha: new Date(),
    formaPago: DEFAULT_PAYMENT_METHOD,
    items: [],
    pedido: null
  });
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  const total = useMemo(() => recalcTotal(formData.items), [formData.items]);

  const clienteLabel = (cliente) =>
    `${cliente?.first_name || ''} ${cliente?.last_name || ''}`.trim() || cliente?.nombreCompleto || cliente?.name || 'Sin nombre';

  const pedidoLabel = (pedidoData) => {
    if (!pedidoData) return 'Sin pedido';
    const cliente = pedidoData.customer || pedidoData.cliente;
    const cliName = cliente ? clienteLabel(cliente) : '';
    const fecha = pedidoData.date || pedidoData.fechaPedido || pedidoData.fecha;
    return `Pedido #${pedidoData.id}${cliName ? ` - ${cliName}` : ''}${fecha ? ` (${fecha})` : ''}`;
  };

  const resolveCliente = (clienteData) => {
    if (!clienteData) return null;
    const candidate = clienteData.customer || clienteData;
    const id = candidate.id || candidate.clienteId || candidate;
    const foundById = clientes.find((cliente) => cliente.id === id);
    return foundById || candidate;
  };

  const loadProductos = async () => {
    try {
      const response = await ProductoService.getAll();
      if (response.success) {
        const list = response.data || [];
        setProductosDisponibles(list);
        return list;
      }
    } catch (error) {
      console.error('Error loading products', error);
    }
    return [];
  };

  const loadPedidos = async () => {
    try {
      const response = await PedidoService.getAll();
      if (response.success) {
        const list = response.data?.results || response.data || [];
        setPedidosDisponibles(list);
        return list;
      }
    } catch (error) {
      console.error('Error loading orders', error);
    }
    return [];
  };

  const fetchPedidoDetalle = async (pedidoId) => {
    try {
      const response = await PedidoService.getById(pedidoId);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching order detail', error);
    }
    return null;
  };

  const fetchVentaDetalle = async (ventaId) => {
    if (!ventaId) return [];
    try {
      const response = await VentaService.getDetailsBySaleId(ventaId);
      if (response.success) {
        return response.data || [];
      }
    } catch (error) {
      console.error('Error fetching sale detail', error);
    }
    return [];
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const [fetchedClientes, productos, pedidos] = await Promise.all([
        fetchClientes(),
        loadProductos(),
        loadPedidos()
      ]);

      if (!mounted) return;

      const clientesList = Array.isArray(fetchedClientes) && fetchedClientes.length ? fetchedClientes : clientes;
      const baseForm = {
        cliente: null,
        fecha: new Date(),
        formaPago: DEFAULT_PAYMENT_METHOD,
        items: [],
        pedido: null
      };

      const findPedido = (pedidoId) =>
        Array.isArray(pedidos) ? pedidos.find((pedidoItem) => pedidoItem.id === pedidoId) || null : null;

      const ensureClienteOption = (clienteData) => {
        if (!clienteData?.id) return;
        const exists = (clientesList || []).some((clienteItem) => clienteItem.id === clienteData.id);
        if (!exists) {
          useClienteStore.setState((state) => ({
            clientes: [...(state.clientes || []), clienteData]
          }));
        }
      };

      if (venta) {
        let detalleVenta = Array.isArray(venta.detail) && venta.detail.length ? venta.detail : [];
        if (!detalleVenta.length && venta.id) {
          detalleVenta = await fetchVentaDetalle(venta.id);
        }

        let pedidoSeleccionado = venta.order || venta.pedido || findPedido(venta.order_id) || null;
        if (!pedidoSeleccionado && venta.order_id) {
          const fetchedOrder = await fetchPedidoDetalle(venta.order_id);
          pedidoSeleccionado = fetchedOrder || { id: venta.order_id };
        }

        if (pedidoSeleccionado && !findPedido(pedidoSeleccionado.id)) {
          setPedidosDisponibles((prev) => {
            const exists = (prev || []).some((pedidoItem) => pedidoItem.id === pedidoSeleccionado.id);
            return exists ? prev : [...(prev || []), pedidoSeleccionado];
          });
        }

        const sourceItems = pedidoSeleccionado
          ? { ...pedidoSeleccionado, detalle: detalleVenta, detalles: detalleVenta, items: detalleVenta }
          : { ...venta, detalle: detalleVenta, detalles: detalleVenta, detail: detalleVenta };

        const clienteResolved = resolveCliente(
          pedidoSeleccionado?.customer || pedidoSeleccionado?.cliente || venta.cliente || venta.customer
        );
        ensureClienteOption(clienteResolved);

        setFormData({
          ...baseForm,
          cliente: clienteResolved,
          fecha: venta.date ? new Date(venta.date) : (venta.fecha ? new Date(venta.fecha) : new Date()),
          formaPago: normalizePaymentMethod(venta.payment_method || venta.formaPago),
          items: buildItemsFromPedido(sourceItems, productos),
          pedido: pedidoSeleccionado
        });
      } else if (pedido) {
        const pedidoCompleto = pedido.id ? (await fetchPedidoDetalle(pedido.id)) || pedido : pedido;
        setFormData({
          ...baseForm,
          cliente: resolveCliente(pedidoCompleto?.customer || pedidoCompleto?.cliente),
          fecha: pedidoCompleto.fechaPedido ? new Date(pedidoCompleto.fechaPedido) : new Date(),
          formaPago: DEFAULT_PAYMENT_METHOD,
          items: buildItemsFromPedido(pedidoCompleto, productos),
          pedido: pedidoCompleto
        });
      } else {
        setFormData(baseForm);
      }

      setSelectedProducto(null);
      setCantidad(1);
    };

    if (visible) {
      init();
    }

    return () => {
      mounted = false;
    };
  }, [visible, venta?.id, pedido?.id]);

  const handleAddItem = () => {
    if (isVentaCompleted) return;
    if (!selectedProducto || (cantidad || 0) <= 0) return;

    const price = selectedProducto.price ?? selectedProducto.precio ?? 0;
    const newItem = {
      id: Date.now(),
      producto: selectedProducto,
      cantidad: cantidad || 1,
      precioUnitario: price,
      subtotal: price * (cantidad || 1)
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setSelectedProducto(null);
    setCantidad(1);
  };

  const handleRemoveItem = (rowData) => {
    if (isVentaCompleted) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== rowData.id)
    }));
  };

  const handlePedidoChange = async (pedidoSeleccionado) => {
    const productos = productosDisponibles.length ? productosDisponibles : await loadProductos();
    let fullOrder = pedidoSeleccionado;
    if (pedidoSeleccionado?.id) {
      const fetched = await fetchPedidoDetalle(pedidoSeleccionado.id);
      if (fetched) fullOrder = fetched;
    }

    setFormData((prev) => ({
      ...prev,
      pedido: fullOrder,
      cliente: resolveCliente(fullOrder?.customer || fullOrder?.cliente),
      items: buildItemsFromPedido(fullOrder, productos)
    }));
  };

  const handleSubmit = () => {
    const pedidoTarget = formData.pedido || pedido;
    if (!pedidoTarget?.id || formData.items.length === 0) {
      return;
    }

    const totalParsed = Number(total || 0);
    const payload = {
      order_id: pedidoTarget.id,
      total_price: Number.isNaN(totalParsed) ? 0 : Number(totalParsed.toFixed(2)),
      date: formData.fecha?.toISOString?.().slice(0, 10) || formData.fecha,
      payment_method: normalizePaymentMethod(formData.formaPago)
    };
    onSave(payload, formData.items);
  };

  const precioTemplate = (rowData) => {
    const price = rowData.precioUnitario ?? rowData.product_price ?? rowData.producto?.price ?? rowData.product?.price ?? 0;
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
  };

  const subtotalTemplate = (rowData) => {
    const qty = rowData.cantidad ?? rowData.quantity ?? 1;
    const price = rowData.precioUnitario ?? rowData.product_price ?? rowData.producto?.price ?? rowData.product?.price ?? 0;
    const subtotal = rowData.subtotal ?? price * qty;
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(subtotal);
  };

  const pedidoOptions = useMemo(
    () => (pedidosDisponibles || []).map((pedidoItem) => ({ label: pedidoLabel(pedidoItem), value: pedidoItem })),
    [pedidosDisponibles]
  );

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
      <Button
        label="Guardar Venta"
        icon="pi pi-check"
        onClick={handleSubmit}
        disabled={formData.items.length === 0 || !(formData.pedido || pedido)}
        loading={loading}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '850px' }}
      header={venta ? 'Editar Venta' : 'Nueva Venta'}
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
              optionLabel={clienteLabel}
              placeholder="Seleccione un cliente (opcional)"
              filter
              itemTemplate={(cliente) => clienteLabel(cliente)}
              valueTemplate={(cliente) => clienteLabel(cliente)}
            />
            <small className="text-500">El cliente es opcional segun el modelo del negocio</small>
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
              options={PAYMENT_METHOD_OPTIONS}
              onChange={(e) => setFormData({ ...formData, formaPago: normalizePaymentMethod(e.value) })}
              placeholder="Seleccione forma de pago"
            />
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label className="font-bold">Pedido</label>
            <Dropdown
              value={formData.pedido || pedido || null}
              options={pedidoOptions}
              optionLabel="label"
              onChange={(e) => handlePedidoChange(e.value)}
              placeholder="Seleccione un pedido"
              filter
              disabled={!!pedido}
              itemTemplate={(opt) => opt?.label || ''}
              valueTemplate={(opt) => opt?.label || pedidoLabel(opt)}
            />
            <small className="text-500">La venta se asocia a un pedido existente.</small>
          </div>
        </div>

        <div className="col-12">
          <div className="p-3 border-1 surface-border border-round surface-ground">
            <h4 className="m-0 mb-3">{isVentaCompleted ? 'Productos de la Venta' : 'Agregar Producto'}</h4>
            {isVentaCompleted ? (
              <small className="text-500 block mb-2">
                Venta completada: mostrando productos en modo de solo lectura.
              </small>
            ) : (
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
            )}
          </div>
        </div>

        <div className="col-12">
          <DataTable value={formData.items} dataKey="id" stripedRows size="small" emptyMessage="No hay items agregados">
            <Column
              header="Producto"
              body={(rowData) => rowData.producto?.name || rowData.product?.name || 'Sin nombre'}
            />
            <Column
              header="Cant."
              body={(rowData) => formatQuantityFromSource(rowData.cantidad ?? rowData.quantity ?? 1, rowData)}
              style={{ width: '12%' }}
            />
            <Column header="Precio Unit." body={precioTemplate} />
            <Column header="Subtotal" body={subtotalTemplate} />
            {!isVentaCompleted && (
              <Column
                body={(rowData) => (
                  <Button
                    icon="pi pi-trash"
                    className="p-button-danger p-button-text p-button-sm"
                    onClick={() => handleRemoveItem(rowData)}
                  />
                )}
                style={{ width: '5%' }}
              />
            )}
          </DataTable>
          <div className="flex justify-content-end mt-3">
            <h3 className="m-0">
              Total: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)}
            </h3>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default VentaForm;
