import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { useEffect, useState } from 'react';
import useClienteStore from '@/store/useClienteStore';
import UbicacionService from '@/router/ubicacion/services/UbicacionService';

const PedidoForm = ({ visible, onHide, onSave, loading }) => {
    const { clientes, fetchClientes } = useClienteStore();

    const [formData, setFormData] = useState({
        cliente: null,
        provincia: null,
        localidad: null,
        direccionCalle: '',
        direccionNumero: '',
        direccionPiso: '',
        direccionDepto: '',
        direccionId: null,
        observaciones: '',
        fechaPedido: new Date(),
        estado: 'Pendiente'
    });

    const [provincias, setProvincias] = useState([]);
    const [localidades, setLocalidades] = useState([]);

    // Estados segun el modelo
    const estados = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'Completado', value: 'Completado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    const formatDireccionTexto = (data) => {
        const calleNumero = [data.direccionCalle, data.direccionNumero].filter(Boolean).join(' ').trim();
        const locProv = [
            data.localidad?.nombre || data.localidad_nombre,
            data.provincia?.nombre || data.provincia_nombre
        ].filter(Boolean).join(', ').trim();
        return [calleNumero, locProv].filter(Boolean).join(' (') + (locProv ? ')' : '');
    };

    const loadProvincias = async () => {
        const response = await UbicacionService.getProvincias();
        if (response.success) {
            setProvincias(response.data || []);
        }
    };

    const handleProvinciaChange = async (provinciaSeleccionada) => {
        setFormData(prev => ({
            ...prev,
            provincia: provinciaSeleccionada,
            localidad: null,
            direccionCalle: '',
            direccionNumero: '',
            direccionPiso: '',
            direccionDepto: '',
            direccionId: null
        }));
        setLocalidades([]);
        if (provinciaSeleccionada) {
            const response = await UbicacionService.getLocalidades(provinciaSeleccionada.id || provinciaSeleccionada.value || provinciaSeleccionada);
            if (response.success) {
                setLocalidades(response.data || []);
            }
        }
    };

    const handleLocalidadChange = (localidadSeleccionada) => {
        setFormData(prev => ({
            ...prev,
            localidad: localidadSeleccionada,
            direccionId: null
        }));
    };

    const direccionDesdeCliente = (clienteSeleccionado) => {
        if (!clienteSeleccionado) return {
            provincia: null,
            localidad: null,
            direccionCalle: '',
            direccionNumero: '',
            direccionPiso: '',
            direccionDepto: '',
            direccionId: null
        };

        const dir = clienteSeleccionado.direccion || clienteSeleccionado.direccionEnvio || {};
        const provincia = dir.localidad?.provincia || null;
        const localidad = dir.localidad || null;

        return {
            provincia,
            localidad,
            direccionCalle: dir.calle || '',
            direccionNumero: dir.numero || '',
            direccionPiso: dir.piso || '',
            direccionDepto: dir.departamento || '',
            direccionId: dir.id || null
        };
    };

    const handleClienteChange = async (clienteSeleccionado) => {
        const dir = direccionDesdeCliente(clienteSeleccionado);
        if (dir.provincia) {
            await handleProvinciaChange(dir.provincia);
        } else {
            setLocalidades([]);
        }
        if (dir.localidad) {
            setLocalidades((prev) => prev.length ? prev : []);
        }

        setFormData(prev => ({
            ...prev,
            cliente: clienteSeleccionado,
            provincia: dir.provincia,
            localidad: dir.localidad,
            direccionCalle: dir.direccionCalle,
            direccionNumero: dir.direccionNumero,
            direccionPiso: dir.direccionPiso,
            direccionDepto: dir.direccionDepto,
            direccionId: dir.direccionId
        }));
    };

    useEffect(() => {
        if (visible) {
            fetchClientes();
            loadProvincias();
            setFormData({
                cliente: null,
                provincia: null,
                localidad: null,
                direccionCalle: '',
                direccionNumero: '',
                direccionPiso: '',
                direccionDepto: '',
                direccionId: null,
                observaciones: '',
                fechaPedido: new Date(),
                estado: 'Pendiente'
            });
            setLocalidades([]);
        }
    }, [visible, fetchClientes]);

    const handleSubmit = () => {
        if (!formData.cliente) return;
        const direccionPayload = {
            id: formData.direccionId,
            calle: formData.direccionCalle || null,
            numero: formData.direccionNumero || null,
            piso: formData.direccionPiso || null,
            departamento: formData.direccionDepto || null,
            localidad: formData.localidad?.id || formData.localidad || null,
            provincia: formData.provincia?.id || formData.provincia || null,
            display: formatDireccionTexto(formData)
        };
        onSave({
            ...formData,
            direccionEnvio: direccionPayload,
        });
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
            style={{ width: '700px' }}
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
                            onChange={(e) => handleClienteChange(e.value)}
                            optionLabel="nombreCompleto"
                            placeholder="Seleccione un cliente"
                            filter
                        />
                    </div>
                </div>

                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Provincia</label>
                        <Dropdown
                            value={formData.provincia}
                            options={provincias}
                            optionLabel="nombre"
                            placeholder="Seleccione provincia"
                            onChange={(e) => handleProvinciaChange(e.value)}
                            filter
                        />
                    </div>
                </div>

                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Localidad</label>
                        <Dropdown
                            value={formData.localidad}
                            options={localidades}
                            optionLabel="nombre"
                            placeholder="Seleccione localidad"
                            onChange={(e) => handleLocalidadChange(e.value)}
                            filter
                            disabled={!formData.provincia}
                        />
                    </div>
                </div>

                <div className="col-12 md:col-8">
                    <div className="field">
                        <label className="font-bold">Calle</label>
                        <InputText
                            value={formData.direccionCalle}
                            onChange={(e) => setFormData({ ...formData, direccionCalle: e.target.value })}
                            placeholder="Ej: Calle Principal"
                        />
                    </div>
                </div>

                <div className="col-12 md:col-4">
                    <div className="field">
                        <label className="font-bold">Numero</label>
                        <InputText
                            value={formData.direccionNumero}
                            onChange={(e) => setFormData({ ...formData, direccionNumero: e.target.value })}
                            placeholder="Ej: 123"
                        />
                    </div>
                </div>

                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Piso</label>
                        <InputText
                            value={formData.direccionPiso}
                            onChange={(e) => setFormData({ ...formData, direccionPiso: e.target.value })}
                            placeholder="Opcional"
                        />
                    </div>
                </div>

                <div className="col-12 md:col-6">
                    <div className="field">
                        <label className="font-bold">Departamento</label>
                        <InputText
                            value={formData.direccionDepto}
                            onChange={(e) => setFormData({ ...formData, direccionDepto: e.target.value })}
                            placeholder="Opcional"
                        />
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
                        <small className="text-500">Fecha automatica, editable si es necesario</small>
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
                            <strong>Nota:</strong> Los items del pedido se agregan despues de crear el pedido,
                            usando el boton "Ver Detalle" en la tabla de pedidos.
                        </p>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default PedidoForm;
