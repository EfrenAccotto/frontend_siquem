import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useState } from 'react';
import useClienteStore from '@/store/useClienteStore';
import ProductoService from '@/router/productos/services/ProductoService';
import UbicacionService from '@/router/ubicacion/services/UbicacionService';

// Estados base permitidos en el formulario
const estadoOptionsBase = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Completado', value: 'completed' }
];

const PedidoForm = ({ visible, onHide, onSave, loading, pedido = null }) => {
  const { clientes, fetchClientes } = useClienteStore();
  
  // Determinar opciones de estado basado en si es edición o creación
  const getEstadoOptions = () => {
    if (!pedido) {
      // Modo creación: permitir todos los estados incluyendo completed
      return estadoOptionsBase;
    } else {
      // Modo edición: no permitir cambiar a completed
      return estadoOptionsBase.filter(option => option.value !== 'completed');
    }
  };

  const [formData, setFormData] = useState({
    cliente: null,
    observaciones: '',
    fechaPedido: new Date(),
    estado: 'pending',
    items: [],
    usarEnvioPersonalizado: false,
    envioLocalidad: null,
    envioZona: null,
    envioCalle: '',
    envioNumero: ''
  });
  const [productos, setProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [cantidadError, setCantidadError] = useState('');
  const [localidades, setLocalidades] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [direccionErrors, setDireccionErrors] = useState({});
  const isPedidoCompleted = !!pedido && ['completed', 'completado'].includes(
    String(pedido?.state || pedido?.estado || formData?.estado || '').toLowerCase()
  );

  const resolveClienteValue = (clienteRaw, clientesList = []) => {
    if (!clienteRaw) return null;
    const id = clienteRaw.id || clienteRaw.clienteId || clienteRaw;
    const found = clientesList.find((c) => c.id === id);
    return found || clienteRaw;
  };

  const resolveProducto = (prodValue, productosList = []) => {
    if (!prodValue) return null;
    if (typeof prodValue === 'object' && prodValue.name) {
      return prodValue;
    }
    const prodId = prodValue.id || prodValue.product_id || prodValue.producto_id || prodValue;
    const found = productosList.find((p) => p.id === prodId);
    if (found) return found;
    const prodName = prodValue.name || prodValue.product_name || `Producto ${prodId}`;
    const prodPrice = prodValue.price || prodValue.product_price || prodValue.precio || 0;
    return { id: prodId, name: prodName, price: prodPrice };
  };

  const mapItemsFromPedido = (pedidoData, productosList = []) => {
    const detalles =
      (Array.isArray(pedidoData?.detail) && pedidoData.detail) ||
      (Array.isArray(pedidoData?.detalles) && pedidoData.detalles) ||
      (Array.isArray(pedidoData?.items) && pedidoData.items) ||
      [];

    return detalles.map((d) => {
      const productoResuelto = resolveProducto(
        d.product || d.producto || d.product_id || d.producto_id,
        productosList
      );
      const qty = d.quantity || d.cantidad || 1;
      return {
        id: d.id || Date.now() + Math.random(),
        producto: productoResuelto,
        cantidad: qty
      };
    });
  };

  const formatDireccionCliente = (cliente) => {
    const addr = cliente?.address;
    if (!addr) return '';
    const localidad = addr.locality?.name || addr.locality_name || '';
    const provincia = addr.locality?.province?.name || '';
    const calleNumero = `${addr.street || ''} ${addr.number || ''}`.trim();
    const locProv = [localidad, provincia].filter(Boolean).join(', ');
    return [calleNumero, locProv ? `(${locProv})` : ''].filter(Boolean).join(' ').trim();
  };

  const formatLocalidad = (loc) => {
    if (!loc) return '';
    const prov = loc.province?.name || loc.province_name || '';
    return [loc.name, prov].filter(Boolean).join(', ');
  };

  const formatZona = (zona) => zona?.name || '';

  const buildDireccionEntrega = (data, cliente) => {
    const calle = (data.envioCalle || '').trim();
    const numero = (data.envioNumero || '').trim();
    const dir = [calle, numero].filter(Boolean).join(' ').trim();
    const loc = formatLocalidad(data.envioLocalidad);
    const zona = formatZona(data.envioZona);
    if (dir || loc || zona) {
      const base = [dir, loc].filter(Boolean).join(' - ');
      return `${base}${zona ? ` (Zona: ${zona})` : ''}`.trim();
    }
    return formatDireccionCliente(cliente);
  };

  const isUnitProduct = (producto) => (producto?.stock_unit || 'unit') === 'unit';

  const normalizeCantidad = (producto, value) => {
    const num = Number(value);
    if (!isFinite(num)) return 0;
    if (isUnitProduct(producto)) return Math.trunc(num);
    return Number(num.toFixed(3));
  };

  const validateCantidad = (producto, value) => {
    const num = Number(value);
    if (!isFinite(num) || num <= 0) return 'La cantidad debe ser mayor a 0';
    if (isUnitProduct(producto) && !Number.isInteger(num)) {
      return 'La cantidad debe ser un numero entero para unidades';
    }
    return '';
  };

  useEffect(() => {
    if (!visible) return;

    const initForm = async () => {
      await fetchClientes();
      const clientesList = useClienteStore.getState()?.clientes || clientes;
      const productosList = (await loadProductos()) || productos;
      
      const clienteDelPedido = resolveClienteValue(pedido?.customer || pedido?.cliente, clientesList);
      if (pedido) {
        const items = mapItemsFromPedido(pedido, productosList);
        setFormData({
          cliente: clienteDelPedido,
          observaciones: pedido.observations || pedido.observaciones || '',
          fechaPedido: pedido.date ? new Date(pedido.date) : new Date(),
          estado: pedido.state || pedido.estado || 'pending',
          items: items,
          usarEnvioPersonalizado: false,
          envioLocalidad: null,
          envioZona: null,
          envioCalle: '',
          envioNumero: ''
        });
      } else {
        setFormData({
          cliente: null,
          observaciones: '',
          fechaPedido: new Date(),
          estado: 'pending',
          items: [],
          usarEnvioPersonalizado: false,
          envioLocalidad: null,
          envioZona: null,
          envioCalle: '',
          envioNumero: ''
        });
      }
      setSelectedProducto(null);
      setCantidad(1);
      setCantidadError('');
      setDireccionErrors({});
    };

    initForm();
  }, [visible, fetchClientes, pedido]);

  useEffect(() => {
    if (!visible) return;
    const loadLocalidades = async () => {
      const resp = await UbicacionService.getLocalidades();
      if (resp.success) {
        setLocalidades(resp.data || []);
      }
    };
    loadLocalidades();
  }, [visible]);

  useEffect(() => {
    if (!formData.usarEnvioPersonalizado) return;
    const locId = formData.envioLocalidad?.id;
    if (!locId) {
      setZonas([]);
      return;
    }
    const loadZonas = async () => {
      const resp = await UbicacionService.getZonas(locId);
      if (resp.success) {
        setZonas(resp.data || []);
      }
    };
    loadZonas();
  }, [formData.envioLocalidad, formData.usarEnvioPersonalizado]);

  const loadProductos = async () => {
    try {
      const resp = await ProductoService.getAll();
      if (resp.success) {
        const lista = resp.data || [];
        setProductos(lista);
        return lista;
      }
    } catch (err) {
      console.error('Error cargando productos', err);
    }
    return productos;
  };

  const clienteLabel = (c) => `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || c?.nombreCompleto || c?.name || 'Sin nombre';

  const handleSubmit = async () => {
    if (!formData.cliente) return;

    // No permitir crear pedidos en estado cancelado
    if (!pedido && formData.estado === 'cancelled') {
      return;
    }

    // Al editar, no permitir cambiar el estado a completed
    if (pedido && formData.estado === 'completed') {
      return;
    }

    if (!formData.usarEnvioPersonalizado && Object.keys(direccionErrors).length) {
      setDireccionErrors({});
    }

    // Validar que el pedido tenga al menos un item
    if (!formData.items || formData.items.length === 0) {
      console.warn('Intento de enviar pedido sin items');
      return;
    }

    const detailItems = (formData.items || []).map((item) => ({
      product_id: item.producto?.id || item.producto || item.product_id,
      quantity: normalizeCantidad(item.producto, item.cantidad || item.quantity || 1)
    })).filter((d) => d.product_id);

    // Validar que después del mapeo y filtro tengamos items válidos
    if (detailItems.length === 0) {
      console.warn('No hay items válidos después del mapeo');
      return;
    }

    let shippingAddressId = formData.cliente?.address?.id || null;
    const direccionEntrega = buildDireccionEntrega(formData, formData.cliente);

    if (formData.usarEnvioPersonalizado) {
      const newErrors = {};
      if (!formData.envioLocalidad?.id) newErrors.envioLocalidad = 'Seleccione una localidad';
      if (!formData.envioZona?.id) newErrors.envioZona = 'Seleccione una zona';
      if (!formData.envioCalle?.trim()) newErrors.envioCalle = 'Ingrese la calle';
      if (!formData.envioNumero?.trim()) newErrors.envioNumero = 'Ingrese la altura';

      setDireccionErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        return;
      }

      const addressPayload = {
        street: formData.envioCalle.trim(),
        number: formData.envioNumero.trim(),
        locality_id: formData.envioLocalidad.id
      };

      const createdAddress = await UbicacionService.createAddress(addressPayload);
      if (!createdAddress.success) {
        console.warn('No se pudo crear la direccion:', createdAddress.error);
        return;
      }

      shippingAddressId = createdAddress.data?.id || null;
      if (shippingAddressId && formData.envioZona?.id) {
        await UbicacionService.createZoneAddress({
          zone_id: formData.envioZona.id,
          address_id: shippingAddressId
        });
      }
    }
    const observacionesConEnvio = [formData.observaciones, formData.usarEnvioPersonalizado ? `Entrega: ${direccionEntrega}` : '']
      .filter(Boolean)
      .join('\n');

    const payload = {
      customer_id: formData.cliente.id || formData.cliente,
      observations: observacionesConEnvio,
      date: formData.fechaPedido?.toISOString?.().slice(0, 10) || formData.fechaPedido,
      state: formData.estado || 'pending',
      shipping_address_id: shippingAddressId,
      detail: detailItems
    };

    // Log para debug - puede removerse en producción
    console.log('Enviando pedido con payload:', payload);

    onSave(payload, {
      shipping_address_override: formData.usarEnvioPersonalizado ? direccionEntrega : null
    });
  };

  const handleAddItem = () => {
    if (isPedidoCompleted) return;
    console.log('=== DEBUGGING ADD ITEM ===');
    console.log('selectedProducto:', selectedProducto);
    console.log('cantidad:', cantidad);
    console.log('productos disponibles:', productos);
    console.log('formData.items actual:', formData.items);
    const error = validateCantidad(selectedProducto, cantidad);
    if (error) {
      setCantidadError(error);
      return;
    }

    if (!selectedProducto || (cantidad || 0) <= 0) {
      console.log('??O Validaci??n fall?? - selectedProducto:', !!selectedProducto, 'cantidad:', cantidad);
      return;
    }

    setCantidadError('');
    const item = {
      id: Date.now(),
      producto: selectedProducto,
      cantidad: normalizeCantidad(selectedProducto, cantidad || 1)
    };
    
    console.log('✅ Item a agregar:', item);
    
    setFormData((prev) => {
      const newItems = [...(prev.items || []), item];
      console.log('📝 Actualizando formData.items de', prev.items?.length || 0, 'a', newItems.length);
      console.log('📝 Nuevos items:', newItems);
      return {
        ...prev,
        items: newItems
      };
    });
    setSelectedProducto(null);
    setCantidad(1);
    console.log('=========================');
  };

  const handleRemoveItem = (rowData) => {
    if (isPedidoCompleted) return;
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).filter((it) => it.id !== rowData.id)
    }));
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
      <Button
        label="Guardar Pedido"
        icon="pi pi-check"
        onClick={() => {
          console.log('🔘 Botón Guardar clickeado - cliente:', !!formData.cliente, 'items:', formData.items?.length || 0);
          handleSubmit();
        }}
        disabled={!formData.cliente || !formData.items?.length}
        loading={loading}
      />
      
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '600px' }}
      header="Nuevo Pedido"
      modal
      className="p-fluid"
      footer={footer}
      onHide={onHide}
    >
      <div className="grid">
        <div className="col-12">
          <div className="field">
            <label className="font-bold">Cliente *</label>
            <Dropdown
              value={formData.cliente}
              options={clientes}
              onChange={(e) => setFormData((prev) => ({ ...prev, cliente: e.value }))}
              optionLabel={clienteLabel}
              placeholder="Seleccione un cliente"
              filter
              itemTemplate={(c) => clienteLabel(c)}
              valueTemplate={(c) => clienteLabel(c)}
            />
            <small className="text-500 block mt-1">
              {formData.cliente?.address
                ? `${formData.cliente.address.street || ''} ${formData.cliente.address.number || ''} (${formData.cliente.address.locality?.name || ''}, ${formData.cliente.address.locality?.province?.name || ''})`
                : 'El cliente no tiene dirección; puedes asignarla desde Clientes.'}
            </small>
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label className="font-bold">Fecha del Pedido</label>
            <Calendar
              value={formData.fechaPedido}
              onChange={(e) => setFormData((prev) => ({ ...prev, fechaPedido: e.value }))}
              showIcon
              dateFormat="dd/mm/yy"
            />
            <small className="text-500">Se usará también para la venta asociada.</small>
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="field">
            <label className="font-bold">Estado</label>
            {pedido && formData.estado === 'completed' ? (
              <InputText value="Completado" readOnly />
            ) : (
              <Dropdown
                value={formData.estado}
                options={getEstadoOptions()}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.value }))}
                placeholder="Seleccione estado"
              />
            )}
            {pedido && formData.estado === 'completed' && (
              <small className="text-500 block mt-1">
                Los pedidos completados no pueden editarse. 
              </small>
            )}
          </div>
        </div>

        <div className="col-12">
          <div className="field">
            <label className="font-bold">Observaciones</label>
            <InputTextarea
              value={formData.observaciones}
              onChange={(e) => setFormData((prev) => ({ ...prev, observaciones: e.target.value }))}
              rows={4}
              autoResize
              placeholder="Ingrese observaciones o notas sobre el pedido (opcional)"
            />
          </div>
        </div>

        <div className="col-12">
          <div className="field">
            <div className="flex align-items-center gap-2">
              <Checkbox
                inputId="usarEnvioPersonalizado"
                checked={formData.usarEnvioPersonalizado}
                onChange={(e) => setFormData((prev) => ({ ...prev, usarEnvioPersonalizado: e.checked }))}
              />
              <label htmlFor="usarEnvioPersonalizado" className="font-bold cursor-pointer">
                Usar datos de envío personalizados
              </label>
            </div>
            <small className="text-500 block mt-1">
              Si no ingresas datos, se usará la dirección del cliente: {formatDireccionCliente(formData.cliente) || 'Sin dirección asignada'}
            </small>
          </div>
        </div>

        {formData.usarEnvioPersonalizado && (
          <div className="col-12">
            <div className="formgrid grid">
              <div className="field col-12 md:col-4">
                <label className="font-bold">Localidad</label>
                <Dropdown
                  value={formData.envioLocalidad}
                  options={localidades}
                  optionLabel="name"
                  placeholder="Seleccione localidad"
                  filter
                  itemTemplate={(loc) => formatLocalidad(loc)}
                  valueTemplate={(loc) => formatLocalidad(loc)}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    envioLocalidad: e.value,
                    envioZona: null
                  }))}
                />
                {direccionErrors.envioLocalidad && (
                  <small className="p-error">{direccionErrors.envioLocalidad}</small>
                )}
              </div>
              <div className="field col-12 md:col-4">
                <label className="font-bold">Calle</label>
                <InputText
                  value={formData.envioCalle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, envioCalle: e.target.value }))}
                  placeholder="Ej: Mitre"
                />
                {direccionErrors.envioCalle && (
                  <small className="p-error">{direccionErrors.envioCalle}</small>
                )}
              </div>
              <div className="field col-12 md:col-4">
                <label className="font-bold">Altura</label>
                <InputText
                  value={formData.envioNumero}
                  onChange={(e) => setFormData((prev) => ({ ...prev, envioNumero: e.target.value }))}
                  placeholder="Ej: 123"
                />
                {direccionErrors.envioNumero && (
                  <small className="p-error">{direccionErrors.envioNumero}</small>
                )}
              </div>
              <div className="field col-12 md:col-4">
                <label className="font-bold">Zona</label>
                <Dropdown
                  value={formData.envioZona}
                  options={zonas}
                  optionLabel="name"
                  placeholder="Seleccione zona"
                  filter
                  onChange={(e) => setFormData((prev) => ({ ...prev, envioZona: e.value }))}
                  disabled={!formData.envioLocalidad}
                />
                {direccionErrors.envioZona && (
                  <small className="p-error">{direccionErrors.envioZona}</small>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="col-12">
          <div className="p-3 border-1 surface-border border-round surface-ground">
            <h4 className="m-0 mb-3">Agregar Producto</h4>
            {isPedidoCompleted && (
              <small className="text-500 block mb-2">
                Pedido completado: no se pueden modificar cantidades ni agregar/quitar productos.
              </small>
            )}
            <div className="formgrid grid">
              <div className="field col-12 md:col-6">
                <Dropdown
                  value={selectedProducto}
                  options={productos}
                  onChange={(e) => { setSelectedProducto(e.value); setCantidadError(''); setCantidad(1); }}
                  optionLabel="name"
                  placeholder="Seleccione producto"
                  filter
                  disabled={isPedidoCompleted}
                />
              </div>
              <div className="field col-12 md:col-3">
                <InputNumber
                  value={cantidad}
                  onValueChange={(e) => { setCantidad(e.value); setCantidadError(''); }}
                  showButtons
                  min={isUnitProduct(selectedProducto) ? 1 : 0.001}
                  maxFractionDigits={isUnitProduct(selectedProducto) ? 0 : 3}
                  minFractionDigits={isUnitProduct(selectedProducto) ? 0 : 3}
                  placeholder="Cantidad"
                  disabled={isPedidoCompleted}
                />
                {cantidadError && (
                  <small className="p-error">{cantidadError}</small>
                )}
              </div>
              <div className="field col-12 md:col-3">
                <Button
                  label="Agregar"
                  icon="pi pi-plus"
                  onClick={handleAddItem}
                  disabled={!selectedProducto || isPedidoCompleted}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <DataTable value={formData.items} dataKey="id" stripedRows size="small" emptyMessage="No hay items agregados">
            <Column
              header="Producto"
              body={(rowData) => rowData.producto?.name || rowData.producto?.nombre || `ID ${rowData.producto?.id || rowData.producto}`}
            />
            <Column field="cantidad" header="Cant." style={{ width: '12%' }} />
            <Column
              header=""
              body={(rowData) => (
                <Button
                  icon="pi pi-trash"
                  className="p-button-danger p-button-text p-button-sm"
                  onClick={() => handleRemoveItem(rowData)}
                  disabled={isPedidoCompleted}
                />
              )}
              style={{ width: '8%' }}
            />
          </DataTable>
          {(!formData.items || formData.items.length === 0) && (
            <small className="text-orange-500 block mt-2 font-medium">
              ⚠️ Debes agregar al menos un producto para crear el pedido
            </small>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default PedidoForm;
