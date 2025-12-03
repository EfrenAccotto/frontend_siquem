import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useState } from 'react';
import useClienteStore from '@/store/useClienteStore';
import ProductoService from '@/router/productos/services/ProductoService';

const estadoOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Completado', value: 'completed' },
  { label: 'Cancelado', value: 'cancelled' }
];

const PedidoForm = ({ visible, onHide, onSave, loading, pedido = null }) => {
    const { clientes, fetchClientes } = useClienteStore();

  const [formData, setFormData] = useState({
    cliente: null,
    observaciones: '',
    fechaPedido: new Date(),
    estado: 'pending',
    items: []
  });
  const [productos, setProductos] = useState([]);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    if (visible) {
      fetchClientes();
      loadProductos();
      if (pedido) {
        setFormData({
          cliente: pedido.customer || pedido.cliente || null,
          observaciones: pedido.observations || pedido.observaciones || '',
          fechaPedido: pedido.date ? new Date(pedido.date) : new Date(),
          estado: pedido.state || pedido.estado || 'pending',
          items: (pedido.detail || pedido.detalles || pedido.items || []).map((d) => ({
            id: d.id || Date.now() + Math.random(),
            producto: d.product || d.producto || d.product_id || d.producto_id,
            cantidad: d.quantity || d.cantidad || 1
          }))
        });
      } else {
        setFormData({
          cliente: null,
          observaciones: '',
          fechaPedido: new Date(),
          estado: 'pending',
          items: []
        });
      }
      setSelectedProducto(null);
      setCantidad(1);
    }
  }, [visible, fetchClientes, pedido]);

  const loadProductos = async () => {
    try {
      const resp = await ProductoService.getAll();
      if (resp.success) {
        setProductos(resp.data || []);
      }
    } catch (err) {
      console.error('Error cargando productos', err);
    }
  };

    const clienteLabel = (c) => `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || c?.nombreCompleto || c?.name || 'Sin nombre';

    const handleSubmit = () => {
        if (!formData.cliente) return;
        const detailItems = (formData.items || []).map((item) => ({
          product_id: item.producto?.id || item.producto || item.product_id,
          quantity: item.cantidad || item.quantity || 1
        })).filter((d) => d.product_id);
        const payload = {
            customer_id: formData.cliente.id || formData.cliente,
            observations: formData.observaciones,
            date: formData.fechaPedido?.toISOString?.().slice(0, 10) || formData.fechaPedido,
            state: formData.estado || 'pending',
            shipping_address_id: formData.cliente.address?.id || null,
            detail: detailItems
        };
        onSave(payload);
    };

  const handleAddItem = () => {
    if (!selectedProducto || (cantidad || 0) <= 0) return;
    const item = {
      id: Date.now(),
      producto: selectedProducto,
      cantidad: cantidad || 1
    };
    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), item]
    }));
    setSelectedProducto(null);
    setCantidad(1);
  };

  const handleRemoveItem = (rowData) => {
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
        onClick={handleSubmit}
        disabled={!formData.cliente}
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
            <Dropdown
              value={formData.estado}
              options={estadoOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.value }))}
              placeholder="Seleccione estado"
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
          <div className="p-3 border-1 surface-border border-round surface-ground">
            <h4 className="m-0 mb-3">Agregar Producto</h4>
            <div className="formgrid grid">
              <div className="field col-12 md:col-6">
                <Dropdown
                  value={selectedProducto}
                  options={productos}
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
                />
              )}
              style={{ width: '8%' }}
            />
          </DataTable>
        </div>
      </div>
    </Dialog>
  );
};

export default PedidoForm;
