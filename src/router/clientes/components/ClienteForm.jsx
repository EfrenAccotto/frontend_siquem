// src/modules/clientes/components/ClienteForm.jsx
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useState, useEffect } from 'react';

const ClienteForm = ({ visible, cliente, onHide, onSave, loading }) => {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    dniCuit: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombreCompleto: cliente.nombreCompleto || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || '',
        codigoPostal: cliente.codigoPostal || '',
        dniCuit: cliente.dniCuit || ''
      });
    } else {
      setFormData({
        nombreCompleto: '',
        email: '',
        telefono: '',
        direccion: '',
        ciudad: '',
        codigoPostal: '',
        dniCuit: ''
      });
    }
    setErrors({});
  }, [cliente, visible]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'El nombre completo es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es requerida';
    }

    if (!formData.codigoPostal.trim()) {
      newErrors.codigoPostal = 'El código postal es requerido';
    }

    if (!formData.dniCuit.trim()) {
      newErrors.dniCuit = 'El DNI/CUIT es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
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
      style={{ width: '600px' }}
      header={cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      modal
      className="p-fluid"
      footer={footer}
      onHide={onHide}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div className="col-12">
            <div className="field">
              <label htmlFor="nombreCompleto" className="font-bold">
                Nombre Completo *
              </label>
              <InputText
                id="nombreCompleto"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                onChange={handleChange}
                className={errors.nombreCompleto ? 'p-invalid' : ''}
              />
              {errors.nombreCompleto && (
                <small className="p-error">{errors.nombreCompleto}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="email" className="font-bold">
                Email *
              </label>
              <InputText
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'p-invalid' : ''}
              />
              {errors.email && (
                <small className="p-error">{errors.email}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="telefono" className="font-bold">
                Teléfono *
              </label>
              <InputText
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className={errors.telefono ? 'p-invalid' : ''}
              />
              {errors.telefono && (
                <small className="p-error">{errors.telefono}</small>
              )}
            </div>
          </div>

          <div className="col-12">
            <div className="field">
              <label htmlFor="direccion" className="font-bold">
                Dirección *
              </label>
              <InputText
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className={errors.direccion ? 'p-invalid' : ''}
              />
              {errors.direccion && (
                <small className="p-error">{errors.direccion}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="ciudad" className="font-bold">
                Ciudad *
              </label>
              <InputText
                id="ciudad"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                className={errors.ciudad ? 'p-invalid' : ''}
              />
              {errors.ciudad && (
                <small className="p-error">{errors.ciudad}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-6">
            <div className="field">
              <label htmlFor="codigoPostal" className="font-bold">
                Código Postal *
              </label>
              <InputText
                id="codigoPostal"
                name="codigoPostal"
                value={formData.codigoPostal}
                onChange={handleChange}
                className={errors.codigoPostal ? 'p-invalid' : ''}
              />
              {errors.codigoPostal && (
                <small className="p-error">{errors.codigoPostal}</small>
              )}
            </div>
          </div>

          <div className="col-12">
            <div className="field">
              <label htmlFor="dniCuit" className="font-bold">
                DNI/CUIT *
              </label>
              <InputText
                id="dniCuit"
                name="dniCuit"
                value={formData.dniCuit}
                onChange={handleChange}
                className={errors.dniCuit ? 'p-invalid' : ''}
              />
              {errors.dniCuit && (
                <small className="p-error">{errors.dniCuit}</small>
              )}
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default ClienteForm;