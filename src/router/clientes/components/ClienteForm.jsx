import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useEffect, useState } from 'react';
import UbicacionService from '@/router/ubicacion/services/UbicacionService';

const zonaFijas = [
  { label: 'Centro', value: 'Centro' },
  { label: 'Banda Norte', value: 'Banda Norte' },
  { label: 'Alberdi', value: 'Alberdi' },
  { label: 'Las Higueras', value: 'Las Higueras' },
];

const mapZonas = (zonas = []) =>
  (zonas || []).map((z) => ({
    label: z.label || z.nombre || z.name || z,
    value: z.value || z.id || z.nombre || z.name || z
  }));

const ClienteForm = ({ visible, cliente, onHide, onSave, loading }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    provincia: null,
    localidad: null,
    direccionCalle: '',
    direccionNumero: '',
    direccionPiso: '',
    direccionDepto: '',
    zona: null,
    email: '',
    empresa: ''
  });

  const [errors, setErrors] = useState({});
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [zonas, setZonas] = useState(mapZonas(zonaFijas));

  const formatDireccionTexto = (data) => {
    const calleNumero = [data.direccionCalle, data.direccionNumero].filter(Boolean).join(' ').trim();
    const locProv = [
      data.localidad?.nombre || data.localidad_nombre,
      data.provincia?.nombre || data.provincia_nombre
    ].filter(Boolean).join(', ').trim();
    return [calleNumero, locProv].filter(Boolean).join(' (') + (locProv ? ')' : '');
  };

  const mapClienteToForm = async (clienteData) => {
    const direccion = clienteData?.direccion;
    const provincia = direccion?.localidad?.provincia || clienteData?.provincia || null;
    const localidad = direccion?.localidad || clienteData?.localidad || null;

    if (provincia?.id) {
      await handleProvinciaChange(provincia);
    }
    if (localidad?.id || localidad?.value) {
      await handleLocalidadChange(localidad);
    }

    setFormData((prev) => ({
      ...prev,
      nombre: clienteData?.nombre || '',
      apellido: clienteData?.apellido || '',
      telefono: clienteData?.telefono || '',
      provincia: provincia || null,
      localidad: localidad || null,
      direccionCalle: direccion?.calle || '',
      direccionNumero: direccion?.numero || '',
      direccionPiso: direccion?.piso || '',
      direccionDepto: direccion?.departamento || '',
      zona: clienteData?.zona?.id || clienteData?.zona?.value || clienteData?.zona || null,
      email: clienteData?.email || '',
      empresa: clienteData?.empresa || ''
    }));
  };

  const loadProvincias = async () => {
    const response = await UbicacionService.getProvincias();
    if (response.success) {
      setProvincias(response.data || []);
    }
  };

  const handleProvinciaChange = async (provinciaSeleccionada) => {
    setFormData((prev) => ({
      ...prev,
      provincia: provinciaSeleccionada,
      localidad: null,
      direccionCalle: '',
      direccionNumero: '',
      direccionPiso: '',
      direccionDepto: '',
      zona: null,
    }));
    setLocalidades([]);
    setZonas(mapZonas(zonaFijas));

    if (provinciaSeleccionada) {
      const response = await UbicacionService.getLocalidades(provinciaSeleccionada.id || provinciaSeleccionada.value || provinciaSeleccionada);
      if (response.success) {
        setLocalidades(response.data || []);
      }
    }
  };

  const handleLocalidadChange = async (localidadSeleccionada) => {
    setFormData((prev) => ({
      ...prev,
      localidad: localidadSeleccionada,
      zona: null,
    }));
    const zonasResp = await UbicacionService.getZonas(localidadSeleccionada?.id || localidadSeleccionada?.value || localidadSeleccionada);
    if (zonasResp.success && (zonasResp.data || []).length) {
      setZonas(mapZonas(zonasResp.data));
    } else {
      setZonas(mapZonas(zonaFijas));
    }
  };

  useEffect(() => {
    if (visible) {
      loadProvincias();
      if (cliente) {
        mapClienteToForm(cliente);
      } else {
        setFormData({
          nombre: '',
          apellido: '',
          telefono: '',
          provincia: null,
          localidad: null,
          direccionCalle: '',
          direccionNumero: '',
          direccionPiso: '',
          direccionDepto: '',
          zona: null,
          email: '',
          empresa: ''
        });
        setLocalidades([]);
        setZonas(mapZonas(zonaFijas));
      }
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, cliente]);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = 'El apellido es requerido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es valido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const direccionPayload = {
        calle: formData.direccionCalle || null,
        numero: formData.direccionNumero || null,
        piso: formData.direccionPiso || null,
        departamento: formData.direccionDepto || null,
        localidad: formData.localidad?.id || formData.localidad || null,
        provincia: formData.provincia?.id || formData.provincia || null,
        display: formatDireccionTexto(formData)
      };

      const dataToSave = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono,
        email: formData.email,
        empresa: formData.empresa,
        provincia: formData.provincia?.id || formData.provincia || null,
        localidad: formData.localidad?.id || formData.localidad || null,
        direccion: direccionPayload,
        zona: formData.zona?.id || formData.zona?.value || formData.zona || null,
        nombreCompleto: `${formData.nombre} ${formData.apellido}`.trim()
      };
      onSave(dataToSave);
    }
  };

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        onClick={onHide}
        className="p-button-text"
        disabled={loading}
      />
      <Button
        label={cliente ? 'Actualizar' : 'Guardar'}
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={loading}
        autoFocus
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '700px' }}
      header={cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      modal
      className="p-fluid"
      footer={footer}
      onHide={onHide}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="nombre" className="font-bold">
                Nombre *
              </label>
              <InputText
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className={errors.nombre ? 'p-invalid' : ''}
                placeholder="Ej: Juan"
              />
              {errors.nombre && (
                <small className="p-error">{errors.nombre}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="apellido" className="font-bold">
                Apellido *
              </label>
              <InputText
                id="apellido"
                value={formData.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)}
                className={errors.apellido ? 'p-invalid' : ''}
                placeholder="Ej: Perez"
              />
              {errors.apellido && (
                <small className="p-error">{errors.apellido}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="telefono" className="font-bold">
                Telefono
              </label>
              <InputText
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="Ej: +54 11 1234-5678"
              />
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="email" className="font-bold">
                Correo Electronico
              </label>
              <InputText
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'p-invalid' : ''}
                placeholder="Ej: cliente@email.com"
              />
              {errors.email && (
                <small className="p-error">{errors.email}</small>
              )}
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
                onChange={(e) => handleChange('direccionCalle', e.target.value)}
                placeholder="Ej: Calle Principal"
              />
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label className="font-bold">Numero</label>
              <InputText
                value={formData.direccionNumero}
                onChange={(e) => handleChange('direccionNumero', e.target.value)}
                placeholder="Ej: 123"
              />
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold">Piso</label>
              <InputText
                value={formData.direccionPiso}
                onChange={(e) => handleChange('direccionPiso', e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold">Departamento</label>
              <InputText
                value={formData.direccionDepto}
                onChange={(e) => handleChange('direccionDepto', e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="zona" className="font-bold">
                Zona
              </label>
              <Dropdown
                id="zona"
                value={formData.zona}
                options={zonas}
                optionLabel="label"
                placeholder="Seleccione zona"
                onChange={(e) => handleChange('zona', e.value)}
                disabled={!formData.localidad}
              />
            </div>
          </div>

          <div className="col-12">
            <div className="field">
              <label htmlFor="empresa" className="font-bold">
                Empresa
              </label>
              <InputText
                id="empresa"
                value={formData.empresa}
                onChange={(e) => handleChange('empresa', e.target.value)}
                placeholder="Empresa a la que pertenece (opcional)"
              />
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default ClienteForm;
