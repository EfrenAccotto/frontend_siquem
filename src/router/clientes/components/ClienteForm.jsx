import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { useState, useEffect } from 'react';

const ClienteForm = ({ visible, cliente, onHide, onSave, loading }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: null,
    email: '',
    empresa: ''
  });

  const [errors, setErrors] = useState({});

  // Mock de direcciones disponibles (luego vendrá del backend)
  const direccionesDisponibles = [
    { id: 1, label: 'Av. Libertador 1000 (CABA, Buenos Aires)' },
    { id: 2, label: 'Calle Falsa 123 (Springfield, Buenos Aires)' },
    { id: 3, label: 'San Martín 456 (Rosario, Santa Fe)' }
  ];

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || null,
        email: cliente.email || '',
        empresa: cliente.empresa || ''
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        telefono: '',
        direccion: null,
        email: '',
        empresa: ''
      });
    }
    setErrors({});
  }, [cliente, visible]);

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

    // Email es opcional, pero si se proporciona debe ser válido
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Combinar nombre y apellido para compatibilidad
      const dataToSave = {
        ...formData,
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
      style={{ width: '650px' }}
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
                placeholder="Ej: Pérez"
              />
              {errors.apellido && (
                <small className="p-error">{errors.apellido}</small>
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
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="Ej: +54 11 1234-5678"
              />
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="email" className="font-bold">
                Correo Electrónico
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

          <div className="col-12">
            <div className="field">
              <label htmlFor="direccion" className="font-bold">
                Dirección
              </label>
              <Dropdown
                id="direccion"
                value={formData.direccion}
                options={direccionesDisponibles}
                onChange={(e) => handleChange('direccion', e.value)}
                optionLabel="label"
                placeholder="Seleccione una dirección"
                filter
              />
              <small className="text-500">
                La dirección es opcional. Si no existe, deberá crearla primero en el módulo de Ubicaciones.
              </small>
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