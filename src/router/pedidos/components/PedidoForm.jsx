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
        fechaPedido: new Date(),
        fechaEntrega: null,
        estado: 'Pendiente',
        notas: ''
    });

    const estados = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En Proceso', value: 'En Proceso' },
        { label: 'Completado', value: 'Completado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    useEffect(() => {
        if (visible) {
            fetchClientes();
            setFormData({
                cliente: null,
                fechaPedido: new Date(),
                fechaEntrega: null,
                estado: 'Pendiente',
                notas: ''
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
                        <label className="font-bold">Cliente</label>
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

                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Fecha Pedido</label>
                        <Calendar value={formData.fechaPedido} onChange={(e) => setFormData({ ...formData, fechaPedido: e.value })} showIcon />
                    </div>
                </div>

                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Fecha Entrega Estimada</label>
                        <Calendar value={formData.fechaEntrega} onChange={(e) => setFormData({ ...formData, fechaEntrega: e.value })} showIcon />
                    </div>
                </div>

                <div className="col-12">
                    <div className="field">
                        <label className="font-bold">Estado</label>
                        <Dropdown
                            value={formData.estado}
                            options={estados}
                            onChange={(e) => setFormData({ ...formData, estado: e.value })}
                            placeholder="Seleccione estado"
                        />
                    </div>
                </div>

                <div className="col-12">
                    <div className="field">
                        <label className="font-bold">Notas</label>
                        <InputTextarea
                            value={formData.notas}
                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                            rows={3}
                            autoResize
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default PedidoForm;
