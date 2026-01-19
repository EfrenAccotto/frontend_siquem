import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { useEffect, useState } from 'react';
import UbicacionService from '../../ubicacion/services/UbicacionService';
import ClienteService from '../services/ClienteService';

const ClienteForm = ({ visible, cliente, onHide, onSave, loading }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    dni: '',
    zona: '',
    province: null,
    locality: null,
    street: '',
    number: '',
    floor: '',
    apartment: ''
  });

  const [errors, setErrors] = useState({});
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [localidadSuggestions, setLocalidadSuggestions] = useState([]);
  const [zonas, setZonas] = useState([]);

  const localityIdFromValue = (loc) => {
    if (!loc) return null;
    if (typeof loc === 'string') {
      const match = localidades.find(
        (item) => (item.label || '').toLowerCase() === loc.toLowerCase()
      );
      return match?.value || match?.id || loc;
    }
    if (typeof loc === 'number') return loc;
    return loc.value || loc.id || loc.locality_id || null;
  };

  const mapProvincias = (items = []) =>
    (items || []).map((p) => ({
      label: p.name || p.label || p,
      value: p.id || p.value || p
    }));

  const mapLocalidades = (items = []) =>
    (items || []).map((l) => ({
      label: l.name || l.label || l,
      value: l.id || l.value || l,
      province: l.province
    }));

  const mapZonas = (items = []) =>
    (items || []).map((z) => ({
      label: z.name || z.label || z,
      value: z.id || z.value || z,
      locality: z.locality || z.locality_id || z.localidad || null
    }));

  const getLocalityIdFromZone = (zoneLocality) => {
    if (!zoneLocality) return null;
    if (typeof zoneLocality === 'number' || typeof zoneLocality === 'string') return zoneLocality;
    return zoneLocality.id || zoneLocality.value || null;
  };

  const loadProvincias = async () => {
    try {
      const response = await UbicacionService.getProvincias();
      if (response.success) {
        const list = response.data || [];
        setProvincias(mapProvincias(list));
      } else {
        console.error('Error loading provincias:', response.error);
        setProvincias([]);
      }
    } catch (error) {
      console.error('Error loading provincias:', error);
      setProvincias([]);
    }
  };

  const handleProvinciaChange = async (provinciaSeleccionada) => {
    setFormData((prev) => ({
      ...prev,
      province: provinciaSeleccionada,
      locality: null,
      zona: '',
      street: '',
      number: '',
      floor: '',
      apartment: ''
    }));
    setLocalidades([]);
    setLocalidadSuggestions([]);
    setZonas([]);

    if (provinciaSeleccionada) {
      try {
        const response = await UbicacionService.getLocalidades(provinciaSeleccionada);
        if (response.success) {
          const list = response.data || [];
          const mapped = mapLocalidades(list);
          setLocalidades(mapped);
          setLocalidadSuggestions(mapped);
        } else {
          console.error('Error loading localidades:', response.error);
        }
      } catch (error) {
        console.error('Error loading localidades:', error);
      }
    }
  };

  const handleLocalidadChange = async (localidadSeleccionada) => {
    setFormData((prev) => ({
      ...prev,
      locality: localidadSeleccionada,
      zona: ''
    }));

    const localityId = localityIdFromValue(localidadSeleccionada);
    if (localityId) {
      await loadZonas(localityId);
    } else {
      setZonas([]);
    }
  };

  const handleLocalidadInputChange = (value) => {
    handleLocalidadChange(value);
    if (errors.locality) {
      setErrors((prev) => ({ ...prev, locality: null }));
    }
  };

  const filterLocalidadSuggestions = (event) => {
    const query = (event.query || '').toLowerCase();
    const filtered = localidades.filter((loc) => (loc.label || '').toLowerCase().includes(query));
    setLocalidadSuggestions(filtered);
  };

  const loadZonas = async (localityId) => {
    try {
      const response = await ClienteService.getZones(localityId);
      if (response.success) {
        const list = response.data || [];
        const mapped = mapZonas(list);
        const filtered = localityId
          ? mapped.filter((z) => {
              const zoneLocalityId = getLocalityIdFromZone(z.locality);
              return !zoneLocalityId || zoneLocalityId === localityId;
            })
          : mapped;
        setZonas(filtered);
        return filtered;
      }
      console.error('Error loading zonas:', response.error);
      setZonas([]);
      return [];
    } catch (error) {
      console.error('Error loading zonas:', error);
      setZonas([]);
      return [];
    }
  };

  useEffect(() => {
    if (!visible) return;

    const initForm = async () => {
      await loadProvincias();
      const provinceId = cliente?.address?.locality?.province?.id || null;
      const localityId = cliente?.address?.locality?.id || null;
      const zoneId = cliente?.zona?.id || cliente?.zona_id || cliente?.zona || '';
      const baseForm = {
        first_name: cliente?.first_name || '',
        last_name: cliente?.last_name || '',
        phone_number: cliente?.phone_number || '',
        dni: cliente?.dni || '',
        zona: zoneId,
        province: provinceId,
        locality: localityId,
        street: cliente?.address?.street || '',
        number: cliente?.address?.number || '',
        floor: cliente?.address?.floor || '',
        apartment: cliente?.address?.apartment || ''
      };
      setFormData(baseForm);
      setErrors({});

      if (provinceId) {
        const response = await UbicacionService.getLocalidades(provinceId);
        if (response.success) {
          const list = response.data || [];
          const mapped = mapLocalidades(list);
          setLocalidades(mapped);
          setLocalidadSuggestions(mapped);
          const selectedLoc = mapped.find((loc) => loc.value === localityId || loc.id === localityId);
          setFormData((prev) => ({
            ...prev,
            locality: selectedLoc || localityId
          }));
          if (localityId) {
            const zones = await loadZonas(localityId);
            const matchedZone = zones.find((z) =>
              z.value === zoneId || z.id === zoneId || z.label === zoneId
            );
            if (matchedZone) {
              setFormData((prev) => ({
                ...prev,
                zona: matchedZone.value
              }));
            }
          }
        }
      } else {
        setLocalidades([]);
        setLocalidadSuggestions([]);
        setZonas([]);
      }
    };

    initForm();
  }, [visible, cliente]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
    } else if (formData.dni.length !== 8 || !/^\d+$/.test(formData.dni)) {
      newErrors.dni = 'El DNI debe tener 8 dígitos numéricos';
    }

    if (!formData.zona) {
      newErrors.zona = 'La zona es requerida';
    }

    if (!formData.province) {
      newErrors.province = 'La provincia es requerida';
    }

    if (!formData.locality) {
      newErrors.locality = 'La localidad es requerida';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'La calle es requerida';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'El número es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const localityId = localityIdFromValue(formData.locality);
      const dataToSave = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone_number: formData.phone_number || '',
        dni: formData.dni.trim(),
        zona: formData.zona || '',
        address: {
          street: formData.street.trim(),
          number: formData.number.trim(),
          floor: formData.floor || '',
          apartment: formData.apartment || '',
          locality_id: localityId || null
        }
      };
      console.log('Submitting form data:', dataToSave);
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
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                className={errors.first_name ? 'p-invalid' : ''}
                placeholder="Ej: Juan"
              />
              {errors.first_name && (
                <small className="p-error">{errors.first_name}</small>
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
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className={errors.last_name ? 'p-invalid' : ''}
                placeholder="Ej: Perez"
              />
              {errors.last_name && (
                <small className="p-error">{errors.last_name}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="telefono" className="font-bold">
                Teléfono
              </label>
              <InputText
                id="telefono"
                value={formData.phone_number}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                placeholder="Ej: +54 11 1234-5678"
              />
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="dni" className="font-bold">
                DNI *
              </label>
              <InputText
                id="dni"
                value={formData.dni}
                onChange={(e) => handleChange('dni', e.target.value)}
                className={errors.dni ? 'p-invalid' : ''}
                placeholder="Ej: 12345678"
              />
              {errors.dni && (
                <small className="p-error">{errors.dni}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold">Provincia</label>
              <Dropdown
                value={formData.province}
                options={provincias}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccione provincia"
                onChange={(e) => handleProvinciaChange(e.value)}
                filter
                className={errors.province ? 'p-invalid' : ''}
              />
              {errors.province && (
                <small className="p-error">{errors.province}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold">Localidad</label>
              <AutoComplete
                value={formData.locality}
                suggestions={localidadSuggestions}
                completeMethod={filterLocalidadSuggestions}
                field="label"
                forceSelection={false}
                dropdown
                placeholder="Seleccione o escriba localidad"
                onChange={(e) => handleLocalidadInputChange(e.value)}
                disabled={!formData.province}
                className={errors.locality ? 'p-invalid w-full' : 'w-full'}
              />
              {errors.locality && (
                <small className="p-error">{errors.locality}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold">Zona</label>
              <Dropdown
                value={formData.zona}
                options={zonas}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => handleChange('zona', e.value)}
                placeholder="Seleccione zona"
                showClear
                disabled={!formData.locality}
                className={errors.zona ? 'p-invalid' : ''}
              />
              {errors.zona && <small className="p-error">{errors.zona}</small>}
            </div>
          </div>

          <div className="col-12 md:col-8">
            <div className="field">
              <label className="font-bold">Calle</label>
              <InputText
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="Ej: Calle Principal"
                className={errors.street ? 'p-invalid' : ''}
              />
              {errors.street && <small className="p-error">{errors.street}</small>}
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label className="font-bold">Número</label>
              <InputText
                value={formData.number}
                onChange={(e) => handleChange('number', e.target.value)}
                placeholder="Ej: 123"
                className={errors.number ? 'p-invalid' : ''}
              />
              {errors.number && <small className="p-error">{errors.number}</small>}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold">Piso</label>
              <InputText
                value={formData.floor}
                onChange={(e) => handleChange('floor', e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label className="font-bold">Departamento</label>
              <InputText
                value={formData.apartment}
                onChange={(e) => handleChange('apartment', e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default ClienteForm;
