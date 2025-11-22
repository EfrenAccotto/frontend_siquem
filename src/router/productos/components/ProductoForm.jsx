import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { useState, useEffect } from 'react';

const ProductoForm = ({ visible, producto, onHide, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    reserve_stock: 0
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (producto) {
      setFormData({
        name: producto.name || '',
        description: producto.description || '',
        price: producto.price || 0,
        stock: producto.stock || 0,
        reserve_stock: producto.reserve_stock || 0
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        reserve_stock: 0
      });
    }
    setErrors({});
  }, [producto, visible]);

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

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.price <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
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
        label={producto ? 'Actualizar' : 'Guardar'}
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
      header={producto ? 'Editar Producto' : 'Nuevo Producto'}
      modal
      className="p-fluid"
      footer={footer}
      onHide={onHide}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div className="col-12">
            <div className="field">
              <label htmlFor="name" className="font-bold">
                Nombre del Producto *
              </label>
              <InputText
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'p-invalid' : ''}
              />
              {errors.name && (
                <small className="p-error">{errors.name}</small>
              )}
            </div>
          </div>

          <div className="col-12">
            <div className="field">
              <label htmlFor="description" className="font-bold">
                Descripción
              </label>
              <InputTextarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                autoResize
              />
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="price" className="font-bold">
                Precio *
              </label>
              <InputNumber
                id="price"
                value={formData.price}
                onValueChange={(e) => handleChange('price', e.value)}
                mode="currency"
                currency="ARS"
                locale="es-AR"
                className={errors.price ? 'p-invalid' : ''}
              />
              {errors.price && (
                <small className="p-error">{errors.price}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="stock" className="font-bold">
                Stock *
              </label>
              <InputNumber
                id="stock"
                value={formData.stock}
                onValueChange={(e) => handleChange('stock', e.value)}
                showButtons
                min={0}
                className={errors.stock ? 'p-invalid' : ''}
              />
               {errors.stock && (
                <small className="p-error">{errors.stock}</small>
              )}
            </div>
          </div>

          <div className="col-12 md:col-4">
            <div className="field">
              <label htmlFor="reserve_stock" className="font-bold">
                Stock de Reserva
              </label>
              <InputNumber
                id="reserve_stock"
                value={formData.reserve_stock}
                onValueChange={(e) => handleChange('reserve_stock', e.value)}
                showButtons
                min={0}
              />
            </div>
          </div>
        </div>
      </form>
    </Dialog>
  );
};

export default ProductoForm;
