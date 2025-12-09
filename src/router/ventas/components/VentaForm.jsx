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
import PedidoService from '@/router/pedidos/services/PedidoService';
import VentaService from '@/router/ventas/services/VentaService';

const formasPago = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Transferencia', value: 'transferencia' },
  { label: 'Tarjeta', value: 'tarjeta' }
];

const buildItemsFromPedido = (pedidoData, productos = []) => {
  const detalles =
    pedidoData?.detalles ||
    pedidoData?.detalle ||
    pedidoData?.items ||
    pedidoData?.detail ||
    pedidoData?.details ||
    [];
  return (detalles || []).map((detalle) => {
    // Resolver producto con todas las variantes posibles
    let producto = detalle.producto || detalle.product || detalle.product_id || {};
    if (typeof producto === 'number') {
      producto = productos.find((p) => p.id === producto) || { id: producto };
    } else if (producto?.id) {
      const found = productos.find((p) => p.id === producto.id);
      producto = found || producto;
    } else if (detalle.product_id) {
      producto = productos.find((p) => p.id === detalle.product_id) || { id: detalle.product_id };
    }

    // Completar nombre/precio si vienen en el detalle
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

const VentaForm = ({ visible, onHide, onSave, loading, venta = null, pedido = null }) => {
  const { clientes, fetchClientes } = useClienteStore();
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);

  const [formData, setFormData] = useState({
    cliente: null,
    fecha: new Date(),
    formaPago: 'efectivo',
    items: [],
    total: 0,
    detalles: [],
    pedido: null
  });

  const [selectedProducto, setSelectedProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  const clienteLabel = (c) => `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || c?.nombreCompleto || c?.name || 'Sin nombre';
  const pedidoLabel = (p) => {
    if (!p) return 'Sin pedido';
    const cliente = p.customer || p.cliente;
    const cliName = cliente ? clienteLabel(cliente) : '';
    const fecha = p.date || p.fechaPedido || p.fecha;
    return `Pedido #${p.id}${cliName ? ` - ${cliName}` : ''}${fecha ? ` (${fecha})` : ''}`;
  };

  const resolveCliente = (clienteData) => {
    if (!clienteData) return null;
    const candidate = clienteData.customer || clienteData;
    const id = candidate.id || candidate.clienteId || candidate;
    const foundById = clientes.find((c) => c.id === id);
    if (foundById) return foundById;
    return candidate;
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await fetchClientes();
      const productos = await loadProductos(); // productos frescos
      const pedidos = await loadPedidos();

      if (!mounted) return;

      const baseForm = {
        cliente: null,
        fecha: new Date(),
        formaPago: 'efectivo',
        items: [],
        total: 0,
        detalles: [],
        pedido: null
      };

      const findPedido = (pid) => {
        if (!pid) return null;
        if (Array.isArray(pedidos)) {
          const found = pedidos.find((p) => p.id === pid);
          if (found) return found;
        }
        if (Array.isArray(pedidosDisponibles)) {
          const foundState = pedidosDisponibles.find((p) => p.id === pid);
          if (foundState) return foundState;
        }
        return null;
      };

      const ensureClienteOption = (cli) => {
        if (!cli || !cli.id) return;
        const exists = (clientes || []).some((c) => c.id === cli.id);
        if (!exists) {
          useClienteStore.setState((state) => ({
            clientes: [...(state.clientes || []), cli]
          }));
        }
      };

      if (venta) {
        // Traer detalles (usa los ya cargados si vienen en la venta)
        let detalleVenta = Array.isArray(venta.detail) && venta.detail.length
          ? venta.detail
          : [];
        if (!detalleVenta.length && venta.id) {
          detalleVenta = await fetchVentaDetalle(venta.id);
        }

        // Traer el pedido completo para precargar cliente/pedido (si solo viene order_id)
        let pedidoSeleccionado = venta.order || venta.pedido || findPedido(venta.order_id) || null;
        if (!pedidoSeleccionado && venta.order_id) {
          const fetchedOrder = await fetchPedidoDetalle(venta.order_id);
          if (fetchedOrder) pedidoSeleccionado = fetchedOrder;
          else pedidoSeleccionado = { id: venta.order_id }; // al menos conservar el id
        }

        // Si lo obtuvimos por fuera de la lista, asegurarlo en el dropdown
        if (pedidoSeleccionado && !findPedido(pedidoSeleccionado.id)) {
          setPedidosDisponibles((prev) => {
            const exists = (prev || []).some((p) => p.id === pedidoSeleccionado.id);
            const nextList = exists ? prev : [...(prev || []), pedidoSeleccionado];
            // Usar la misma referencia que queda en el estado para la selección
            const matched = nextList.find((p) => p.id === pedidoSeleccionado.id) || pedidoSeleccionado;
            pedidoSeleccionado = matched;
            return nextList;
          });
        }

        const ventaConDetalle = {
          ...venta,
          detalle: detalleVenta,
          detalles: detalleVenta,
          detail: detalleVenta
        };
        // Usa pedido si lo tenemos; si no, la propia venta con detalle
        const sourceItems = pedidoSeleccionado
          ? { ...pedidoSeleccionado, detalle: detalleVenta, detalles: detalleVenta, items: detalleVenta }
          : ventaConDetalle;
        const itemsVenta = buildItemsFromPedido(sourceItems, productos);
        const totalVenta = recalcTotal(itemsVenta);
        const clienteResolved = resolveCliente(
          pedidoSeleccionado?.customer || pedidoSeleccionado?.cliente || venta.cliente || venta.customer
        );
        ensureClienteOption(clienteResolved);
        setFormData({
          ...baseForm,
          cliente: clienteResolved,
          fecha: venta.date ? new Date(venta.date) : (venta.fecha ? new Date(venta.fecha) : new Date()),
          formaPago: venta.payment_method || venta.formaPago || 'efectivo',
          items: itemsVenta,
          detalles: itemsVenta,
          total: totalVenta,
          pedido: pedidoSeleccionado
        });
      } else if (pedido) {
        let pedidoCompleto = pedido;
        // Traer siempre el detalle fresco
        if (pedido.id) {
          const fetched = await fetchPedidoDetalle(pedido.id);
          if (fetched) pedidoCompleto = fetched;
        }
        const itemsPedido = buildItemsFromPedido(pedidoCompleto, productos);
        const totalPedido = recalcTotal(itemsPedido);
        setFormData({
          ...baseForm,
          cliente: resolveCliente(pedidoCompleto?.customer || pedidoCompleto?.cliente),
          fecha: pedidoCompleto.fechaPedido ? new Date(pedidoCompleto.fechaPedido) : new Date(),
          formaPago: 'efectivo',
          items: itemsPedido,
          detalles: itemsPedido,
          total: totalPedido,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, venta?.id, pedido?.id]);

  const loadProductos = async () => {
    try {
      const response = await ProductoService.getAll();
      if (response.success) {
        const list = response.data || [];
        setProductosDisponibles(list);
        return list;
      }
    } catch (error) {
      console.error("Error loading products", error);
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
    console.error("Error loading orders", error);
  }
  return [];
};

  const fetchPedidoDetalle = async (pedidoId) => {
    try {
      const response = await PedidoService.getById(pedidoId);
      if (response.success) {
        return response.data;
      }
    } catch (err) {
      console.error('Error fetching order detail', err);
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
    } catch (err) {
      console.error('Error fetching sale detail', err);
    }
    return [];
  };

  const recalcTotal = (itemsList = []) => {
    return (itemsList || []).reduce((acc, item) => {
      const qty = item.cantidad ?? item.quantity ?? 1;
      const price = item.precioUnitario ?? item.product_price ?? item.producto?.price ?? item.product?.price ?? 0;
      const subtotal = item.subtotal ?? price * qty;
      return acc + (Number(subtotal) || 0);
    }, 0);
  };

  const handleItemChange = (itemId, changes = {}) => {
    setFormData((prev) => {
      const updatedItems = (prev.items || []).map((item) => {
        if (item.id !== itemId) return item;
        const next = { ...item, ...changes };
        const qty = next.cantidad ?? next.quantity ?? 1;
        const price = next.precioUnitario ?? next.product_price ?? next.producto?.price ?? next.product?.price ?? 0;
        const subtotal = changes.subtotal ?? next.subtotal ?? price * qty;
        return { ...next, cantidad: qty, subtotal };
      });
      return {
        ...prev,
        items: updatedItems,
        detalles: updatedItems,
        total: recalcTotal(updatedItems)
      };
    });
  };

  const handleAddItem = () => {
    if (!selectedProducto || (cantidad || 0) <= 0) return;

    const price = selectedProducto.price ?? selectedProducto.precio ?? 0;
    const newItem = {
      id: Date.now(),
      producto: selectedProducto,
      cantidad: cantidad || 1,
      precioUnitario: price,
      subtotal: price * (cantidad || 1)
    };

    setFormData(prev => {
      const newItems = [...prev.items, newItem];
      const newTotal = recalcTotal(newItems);
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
      const newTotal = recalcTotal(newItems);
      return {
        ...prev,
        items: newItems,
        detalles: newItems,
        total: newTotal
      };
    });
  };

  const handlePedidoChange = async (pedidoSeleccionado) => {
    const pedidoObj = pedidoSeleccionado;
    // Siempre refrescamos productos para tener nombres/precios actualizados
    const productos = await loadProductos();
    // Traer pedido completo con detalle
    let fullOrder = pedidoObj;
    if (pedidoObj?.id) {
      const fetched = await fetchPedidoDetalle(pedidoObj.id);
      if (fetched) fullOrder = fetched;
    }
    const itemsPedido = buildItemsFromPedido(fullOrder, productos);
    const totalPedido = recalcTotal(itemsPedido);
    setFormData((prev) => ({
      ...prev,
      pedido: fullOrder,
      cliente: resolveCliente(fullOrder?.customer || fullOrder?.cliente),
      items: itemsPedido,
      detalles: itemsPedido,
      total: totalPedido
    }));
  };

  // Recalcula ítems si ya hay un pedido seleccionado y cambia (por ejemplo, tras cargar productos tarde)
  useEffect(() => {
    const recomputeFromPedido = async () => {
      if (!visible) return;
      const pedidoSel = formData.pedido;
      if (!pedidoSel?.id) return;

      let productos = productosDisponibles;
      if (!productosDisponibles.length) {
        productos = await loadProductos();
      }
      let fullOrder = pedidoSel;
      const fetched = await fetchPedidoDetalle(pedidoSel.id);
      if (fetched) fullOrder = fetched;
      const itemsPedido = buildItemsFromPedido(fullOrder, productos);
      const totalPedido = recalcTotal(itemsPedido);
      setFormData((prev) => ({
        ...prev,
        pedido: fullOrder,
        cliente: resolveCliente(fullOrder?.customer || fullOrder?.cliente) || prev.cliente,
        items: itemsPedido,
        detalles: itemsPedido,
        total: totalPedido
      }));
    };
    recomputeFromPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, formData.pedido?.id, productosDisponibles.length]);

  const handleSubmit = () => {
    const pedidoTarget = formData.pedido || pedido;
    if (!pedidoTarget?.id) {
      return;
    }
    if (formData.items.length === 0) {
      return;
    }
    const totalParsed = Number(formData.total || 0);
    const payload = {
      order_id: pedidoTarget.id,
      total_price: isNaN(totalParsed) ? 0 : Number(totalParsed.toFixed(2)),
      date: formData.fecha?.toISOString?.().slice(0, 10) || formData.fecha,
      payment_method: formData.formaPago
    };
    onSave(payload, formData.items);
  };

  const renderCantidadInput = (rowData) => (
    <InputNumber
      value={rowData.cantidad ?? rowData.quantity ?? 1}
      onValueChange={(e) => handleItemChange(rowData.id, { cantidad: e.value })}
      showButtons
      min={1}
      className="w-full"
    />
  );

  const renderPrecioInput = (rowData) => (
    <InputNumber
      value={rowData.precioUnitario ?? rowData.product_price ?? rowData.producto?.price ?? rowData.product?.price ?? 0}
      onValueChange={(e) => handleItemChange(rowData.id, { precioUnitario: e.value })}
      mode="currency"
      currency="ARS"
      locale="es-AR"
      className="w-full"
    />
  );

  const subtotalTemplate = (rowData) => {
    const qty = rowData.cantidad ?? rowData.quantity ?? 1;
    const price = rowData.precioUnitario ?? rowData.product_price ?? rowData.producto?.price ?? rowData.product?.price ?? 0;
    const subtotal = rowData.subtotal ?? price * qty;
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(subtotal);
  };

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
              itemTemplate={(c) => clienteLabel(c)}
              valueTemplate={(c) => clienteLabel(c)}
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

        <div className="col-12 md:col-6">
          <div className="field">
            <label className="font-bold">Pedido</label>
            <Dropdown
              value={formData.pedido || pedido || null}
              options={(pedidosDisponibles || []).map((p) => ({ label: pedidoLabel(p), value: p }))}
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
          <DataTable value={formData.items} dataKey="id" stripedRows size="small" emptyMessage="No hay items agregados">
            <Column
              header="Producto"
              body={(rowData) => rowData.producto?.name || rowData.product?.name || 'Sin nombre'}
            ></Column>
            <Column header="Cant." body={renderCantidadInput} style={{ width: '12%' }}></Column>
            <Column header="Precio Unit." body={renderPrecioInput}></Column>
            <Column header="Subtotal" body={subtotalTemplate}></Column>
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
