import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { useState, useEffect } from 'react';
import useClienteStore from '@/store/useClienteStore';

const PedidoForm = ({ visible, onHide, onSave, loading }) => {
    const { clientes, fetchClientes } = useClienteStore();

    const [formData, setFormData] = useState({
        cliente: null,
        direccionEnvio: null,
        observaciones: '',
        fechaPedido: new Date(),
        estado: 'Pendiente'
    });

    // Estados según el modelo
    const estados = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'Completado', value: 'Completado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    // Mock de direcciones (luego vendrá del backend)
    const direccionesDisponibles = [
        { id: 1, label: 'Av. Libertador 1000 (CABA, Buenos Aires)' },
        { id: 2, label: 'Calle Falsa 123 (Springfield, Buenos Aires)' },
        { id: 3, label: 'San Martín 456 (Rosario, Santa Fe)' }
    ];

    useEffect(() => {
        if (visible) {
            fetchClientes();
            setFormData({
                cliente: null,
                direccionEnvio: null,
                observaciones: '',
                fechaPedido: new Date(),
                estado: 'Pendiente'
            });
        }
    }, [visible, fetchClientes]);

    const handleSubmit = () => {
        if (!formData.cliente) return;
        onSave(formData);
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
            style={{ width: '650px' }}
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
                            onChange={(e) => setFormData({ ...formData, cliente: e.value })}
                            optionLabel="nombreCompleto"
                            placeholder="Seleccione un cliente"
                            filter
                        />
                    </div>
                </div>

                <div className="col-12">
                    <div className="field">
                        <label className="font-bold">Dirección de Envío</label>
                        <Dropdown
                            value={formData.direccionEnvio}
                            options={direccionesDisponibles}
                            onChange={(e) => setFormData({ ...formData, direccionEnvio: e.value })}
                            optionLabel="label"
                            placeholder="Seleccione dirección de envío"
                            filter
                        />
                        <small className="text-500">
                            Opcional. Si no se selecciona, se usa la dirección del cliente.
                        </small>
                    </div>
                </div>

                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Fecha del Pedido</label>
                        <Calendar
                            value={formData.fechaPedido}
                            onChange={(e) => setFormData({ ...formData, fechaPedido: e.value })}
                            showIcon
                            dateFormat="dd/mm/yy"
                        />
                        <small className="text-500">Fecha automática, editable si es necesario</small>
                    </div>
                </div>

                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Estado</label>
                        <Dropdown
                            value={formData.estado}
                            options={estados}
                            onChange={(e) => setFormData({ ...formData, estado: e.value })}
                            placeholder="Seleccione estado"
                        />
                        <small className="text-500">Por defecto: Pendiente</small>
                    </div>
                </div>

                <div className="col-12">
                    <div className="field">
                        <label className="font-bold">Observaciones</label>
                        <InputTextarea
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            rows={4}
                            autoResize
                            placeholder="Ingrese observaciones o notas sobre el pedido (opcional)"
                        />
                    </div>
                </div>

                <div className="col-12">
                    <div className="p-3 surface-100 border-round">
                        <p className="m-0 text-sm">
                            <i className="pi pi-info-circle mr-2"></i>
                            <strong>Nota:</strong> Los items del pedido se agregan después de crear el pedido,
                            usando el botón "Ver Detalle" en la tabla de pedidos.
                        </p>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default PedidoForm;
