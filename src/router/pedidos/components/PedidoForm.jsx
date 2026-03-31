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
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import useClienteStore from '@/store/useClienteStore';
import ProductoService from '@/router/productos/services/ProductoService';
import UbicacionService from '@/router/ubicacion/services/UbicacionService';
import ClienteService from '@/router/clientes/services/ClienteService';
import ClienteForm from '@/router/clientes/components/ClienteForm';
import { formatQuantityFromSource, extractStockUnit, parseQuantityValue } from '@/utils/unitParser';
import { PAYMENT_METHOD_OPTIONS, DEFAULT_PAYMENT_METHOD, normalizePaymentMethod } from '@/utils/paymentMethod';

const estadoOptionsBase = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Completado', value: 'completed' }
];

const getErrorDetail = (errorValue, fallbackMessage) => {
  if (typeof errorValue === 'string' && errorValue.trim()) return errorValue;
  if (!errorValue || typeof errorValue !== 'object') return fallbackMessage;

  const firstKey = Object.keys(errorValue)[0];
  const firstValue = errorValue[firstKey];

  if (Array.isArray(firstValue) && firstValue.length) {
    return `${firstKey}: ${firstValue[0]}`;
  }

  if (typeof firstValue === 'string' && firstValue.trim()) {
    return `${firstKey}: ${firstValue}`;
  }

  return fallbackMessage;
};

const PedidoForm = ({ visible, onHide, onSave, loading, pedido = null }) => {
  const { clientes, fetchClientes } = useClienteStore();
  const toast = useRef(null);

  const getEstadoOptions = () => {
    if (!pedido) {
      return estadoOptionsBase;
    }

    return estadoOptionsBase.filter((option) => option.value !== 'completed');
  };

  const [formData, setFormData] = useState({
    cliente: null,
    observaciones: '',
    fechaPedido: new Date(),
    estado: 'pending',
    formaPago: DEFAULT_PAYMENT_METHOD,
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
  const [showClienteDialog, setShowClienteDialog] = useState(false);
  const [savingCliente, setSavingCliente] = useState(false);
  const [clienteInlineError, setClienteInlineError] = useState('');
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

    const normalizeResult = (productData) => ({
      ...productData,
      stock_unit: extractStockUnit(productData)
    });

    if (typeof prodValue === 'object' && (prodValue.name || prodValue.id)) {
      return normalizeResult(prodValue);
    }

    const rawId = prodValue?.id || prodValue?.product_id || prodValue?.producto_id || prodValue;
    const matchId = rawId != null ? String(rawId) : null;
    const found = productosList.find((p) => String(p.id) === matchId);
    if (found) {
      return normalizeResult(found);
    }

    return normalizeResult({
      id: rawId,
      name: `Producto ${rawId}`,
      price: 0,
      stock_unit: 'unit'
    });
  };

  const mapItemsFromPedido = (pedidoData, productosList = []) => {
    const detalles =
      (Array.isArray(pedidoData?.detail) && pedidoData.detail) ||
      (Array.isArray(pedidoData?.detalles) && pedidoData.detalles) ||
      (Array.isArray(pedidoData?.items) && pedidoData.items) ||
      [];

    return detalles.map((detalle) => {
      const productoResuelto = resolveProducto(
        detalle.product || detalle.producto || detalle.product_id || detalle.producto_id,
        productosList
      );
      const unitFromDetail = extractStockUnit(detalle);
      const qty = parseQuantityValue(detalle.quantity ?? detalle.cantidad ?? 1);

      return {
        id: detalle.id || Date.now() + Math.random(),
        producto: productoResuelto,
        cantidad: qty,
        stock_unit: unitFromDetail || productoResuelto?.stock_unit || 'unit'
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

  const isUnitProduct = (producto) => extractStockUnit(producto) === 'unit';

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

  const verifyCreatedCliente = async (createdResponse) => {
    const createdId = createdResponse?.data?.id;

    if (!createdResponse?.success || !createdId) {
      throw new Error(getErrorDetail(createdResponse?.error, 'El backend no confirmo el alta del cliente'));
    }

    const verification = await ClienteService.getById(createdId);
    if (!verification?.success || !verification?.data?.id) {
      throw new Error(getErrorDetail(verification?.error, 'No se pudo verificar el cliente guardado en el backend'));
    }

    return verification.data;
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
          formaPago: normalizePaymentMethod(pedido.payment_method || pedido.paymentMethod),
          items,
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
          formaPago: DEFAULT_PAYMENT_METHOD,
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
        const lista = (resp.data || []).map((prod) => ({
          ...prod,
          stock_unit: extractStockUnit(prod)
        }));
        setProductos(lista);
        return lista;
      }
    } catch (error) {
      console.error('Error cargando productos', error);
    }

    return productos;
  };

  const clienteLabel = (cliente) =>
    `${cliente?.first_name || ''} ${cliente?.last_name || ''}`.trim() || cliente?.nombreCompleto || cliente?.name || 'Sin nombre';

  const handleSubmit = async () => {
    if (!formData.cliente) return;

    if (!pedido && formData.estado === 'cancelled') {
      return;
    }

    if (pedido && formData.estado === 'completed') {
      return;
    }

    if (!formData.usarEnvioPersonalizado && Object.keys(direccionErrors).length) {
      setDireccionErrors({});
    }

    if (!formData.items || formData.items.length === 0) {
      return;
    }

    const detailItems = (formData.items || []).map((item) => ({
      product_id: item.producto?.id || item.producto || item.product_id,
      quantity: normalizeCantidad(item.producto, item.cantidad || item.quantity || 1)
    })).filter((item) => item.product_id);

    if (detailItems.length === 0) {
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
      payment_method: normalizePaymentMethod(formData.formaPago),
      shipping_address_id: shippingAddressId,
      detail: detailItems
    };

    onSave(payload, {
      shipping_address_override: formData.usarEnvioPersonalizado ? direccionEntrega : null
    });
  };

  const handleCrearClienteDesdePedido = async (clientePayload) => {
    setSavingCliente(true);
    setClienteInlineError('');

    try {
      const response = await ClienteService.create(clientePayload);
      const clienteVerificado = await verifyCreatedCliente(response);

      await fetchClientes();
      const clientesActualizados = useClienteStore.getState()?.clientes || [];
      const clienteCreado = clientesActualizados.find((cliente) => cliente.id === clienteVerificado.id) || clienteVerificado;

      setFormData((prev) => ({
        ...prev,
        cliente: clienteCreado || prev.cliente
      }));
      setShowClienteDialog(false);
      toast.current?.show({ severity: 'success', summary: 'Exito', detail: 'Cliente guardado correctamente', life: 3000 });
    } catch (error) {
      const detail = error?.message || 'No se pudo crear el cliente';
      setClienteInlineError(detail);
      toast.current?.show({ severity: 'error', summary: 'Error', detail, life: 3500 });
    } finally {
      setSavingCliente(false);
    }
  };

  const handleAddItem = () => {
    if (isPedidoCompleted) return;

    const error = validateCantidad(selectedProducto, cantidad);
    if (error) {
      setCantidadError(error);
      return;
    }

    if (!selectedProducto || (cantidad || 0) <= 0) {
      return;
    }

    setCantidadError('');
    const normalizedProduct = selectedProducto?.stock_unit
      ? selectedProducto
      : { ...selectedProducto, stock_unit: extractStockUnit(selectedProducto) };

    const item = {
      id: Date.now(),
      producto: normalizedProduct,
      cantidad: normalizeCantidad(normalizedProduct, cantidad || 1),
      stock_unit: normalizedProduct.stock_unit || 'unit'
    };

    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), item]
    }));
    setSelectedProducto(null);
    setCantidad(1);
  };

  const handleRemoveItem = (rowData) => {
    if (isPedidoCompleted) return;

    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).filter((item) => item.id !== rowData.id)
    }));
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
      <Button
        label="Guardar Pedido"
        icon="pi pi-check"
        onClick={handleSubmit}
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
      <Toast ref={toast} />

      <div className="grid">
        <div className="col-12">
          <div className="field">
            <div className="flex justify-content-between align-items-center mb-2">
              <label className="font-bold m-0">Cliente *</label>
              <Button
                type="button"
                label="Nuevo cliente"
                icon="pi pi-user-plus"
                className="p-button-sm p-button-outlined"
                onClick={() => setShowClienteDialog(true)}
              />
            </div>
            <Dropdown
              value={formData.cliente}
              options={clientes}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, cliente: e.value }));
                setClienteInlineError('');
              }}
              optionLabel={clienteLabel}
              placeholder="Seleccione un cliente"
              filter
              itemTemplate={(cliente) => clienteLabel(cliente)}
              valueTemplate={(cliente) => clienteLabel(cliente)}
            />
            <small className="text-500 block mt-1">
              {formData.cliente?.address
                ? `${formData.cliente.address.street || ''} ${formData.cliente.address.number || ''} (${formData.cliente.address.locality?.name || ''}, ${formData.cliente.address.locality?.province?.name || ''})`
                : 'El cliente no tiene dirección; puedes asignarla desde Clientes.'}
            </small>
            {clienteInlineError && (
              <small className="p-error block mt-1">{clienteInlineError}</small>
            )}
          </div>
        </div>

        <div className="col-12 md:col-4">
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

        <div className="col-12 md:col-4">
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

        <div className="col-12 md:col-4">
          <div className="field">
            <label className="font-bold">Forma de Pago *</label>
            <Dropdown
              value={formData.formaPago}
              options={PAYMENT_METHOD_OPTIONS}
              onChange={(e) => setFormData((prev) => ({ ...prev, formaPago: normalizePaymentMethod(e.value) }))}
              placeholder="Seleccione forma de pago"
            />
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
                  onChange={(e) => {
                    setSelectedProducto(e.value);
                    setCantidadError('');
                    setCantidad(1);
                  }}
                  optionLabel="name"
                  placeholder="Seleccione producto"
                  filter
                  disabled={isPedidoCompleted}
                />
              </div>
              <div className="field col-12 md:col-3">
                <InputNumber
                  value={cantidad}
                  onValueChange={(e) => {
                    setCantidad(e.value);
                    setCantidadError('');
                  }}
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
            <Column
              header="Cant."
              body={(rowData) => formatQuantityFromSource(rowData.cantidad ?? rowData.quantity ?? 1, rowData)}
              style={{ width: '12%' }}
            />
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
              Debes agregar al menos un producto para crear el pedido
            </small>
          )}
        </div>
      </div>

      <ClienteForm
        visible={showClienteDialog}
        cliente={null}
        onHide={() => {
          setShowClienteDialog(false);
          setClienteInlineError('');
        }}
        onSave={handleCrearClienteDesdePedido}
        loading={savingCliente}
      />
    </Dialog>
  );
};

export default PedidoForm;
