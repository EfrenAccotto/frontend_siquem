// ============================================================================
// IMPORTS
// ============================================================================
import React, { useState } from 'react';

// PrimeReact Components
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';

// ============================================================================
// CONSTANTS
// ============================================================================

// Opciones de asunto predefinidas
const SUBJECT_OPTIONS = [
    { label: 'Problema técnico', value: 'technical' },
    { label: 'Consulta sobre productos', value: 'products' },
    { label: 'Facturación', value: 'billing' },
    { label: 'Error en el sistema', value: 'system_error' },
    { label: 'Solicitud de función', value: 'feature_request' },
    { label: 'Otro', value: 'other' }
];

// Opciones de prioridad
const PRIORITY_OPTIONS = [
    { label: 'Baja', value: 'low', icon: 'pi pi-circle', color: 'text-green-500' },
    { label: 'Media', value: 'medium', icon: 'pi pi-circle', color: 'text-yellow-500' },
    { label: 'Alta', value: 'high', icon: 'pi pi-circle', color: 'text-red-500' }
];

// Estado inicial del formulario
const INITIAL_FORM_STATE = {
    name: '',
    email: '',
    subject: null,
    priority: null,
    message: ''
};

// Estado inicial de errores
const INITIAL_ERRORS = {
    name: '',
    email: '',
    subject: '',
    priority: '',
    message: ''
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const HelpSupportDialog = ({ visible, onHide, toastRef }) => {
    // ============================================================================
    // STATE
    // ============================================================================
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState(INITIAL_ERRORS);
    const [loading, setLoading] = useState(false);

    // ============================================================================
    // VALIDATION
    // ============================================================================

    /**
     * Valida el email
     */
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    /**
     * Valida todo el formulario
     */
    const validateForm = () => {
        const newErrors = { ...INITIAL_ERRORS };
        let isValid = true;

        // Validar nombre
        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
            isValid = false;
        }

        // Validar email
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
            isValid = false;
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Email inválido';
            isValid = false;
        }

        // Validar asunto
        if (!formData.subject) {
            newErrors.subject = 'Seleccione un asunto';
            isValid = false;
        }

        // Validar prioridad
        if (!formData.priority) {
            newErrors.priority = 'Seleccione una prioridad';
            isValid = false;
        }

        // Validar mensaje
        if (!formData.message.trim()) {
            newErrors.message = 'El mensaje es requerido';
            isValid = false;
        } else if (formData.message.trim().length < 20) {
            newErrors.message = 'El mensaje debe tener al menos 20 caracteres';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    /**
     * Maneja el cambio en los campos del formulario
     */
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error del campo cuando el usuario empieza a escribir
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    /**
     * Maneja el envío del formulario
     */
    const handleSubmit = async () => {
        if (!validateForm()) {
            toastRef.current?.show({
                severity: 'warn',
                summary: 'Formulario incompleto',
                detail: 'Por favor complete todos los campos requeridos',
                life: 3000
            });
            return;
        }

        setLoading(true);

        // Simular envío al servidor
        try {
            // Aquí iría la llamada al API real
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log('Formulario enviado:', formData);

            toastRef.current?.show({
                severity: 'success',
                summary: 'Solicitud enviada',
                detail: 'Su solicitud ha sido enviada al equipo de posventa. Nos pondremos en contacto pronto.',
                life: 4000
            });

            // Resetear formulario y cerrar dialog
            setFormData(INITIAL_FORM_STATE);
            setErrors(INITIAL_ERRORS);
            onHide();
        } catch (error) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo enviar la solicitud. Intente nuevamente.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Maneja el cierre del dialog
     */
    const handleClose = () => {
        setFormData(INITIAL_FORM_STATE);
        setErrors(INITIAL_ERRORS);
        onHide();
    };

    // ============================================================================
    // TEMPLATES
    // ============================================================================

    /**
     * Template para opciones de prioridad
     */
    const priorityOptionTemplate = (option) => {
        if (!option) return null;
        return (
            <div className="flex align-items-center gap-2">
                <i className={`${option.icon} ${option.color}`}></i>
                <span>{option.label}</span>
            </div>
        );
    };

    /**
     * Footer del dialog con botones de acción
     */
    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Cancelar"
                icon="pi pi-times"
                onClick={handleClose}
                className="p-button-text"
                disabled={loading}
            />
            <Button
                label="Enviar"
                icon="pi pi-send"
                onClick={handleSubmit}
                loading={loading}
                className="p-button-primary"
            />
        </div>
    );

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-question-circle text-primary text-xl"></i>
                    <span>Solicitud de Ayuda</span>
                </div>
            }
            visible={visible}
            onHide={handleClose}
            footer={dialogFooter}
            style={{ width: '600px' }}
            className="p-fluid"
            breakpoints={{ '960px': '90vw', '640px': '95vw' }}
            modal
            draggable={false}
        >
            <div className="flex flex-column gap-4 py-3">
                {/* Mensaje de introducción */}
                <div className="bg-blue-50 dark:bg-blue-900 border-left-3 border-blue-500 p-3 mb-2">
                    <p className="m-0 text-sm">
                        <i className="pi pi-info-circle mr-2"></i>
                        Complete el formulario y nuestro equipo de posventa se pondrá en contacto con usted lo antes posible.
                    </p>
                </div>

                {/* Nombre */}
                <div className="field">
                    <label htmlFor="name" className="font-semibold mb-2 block">
                        Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Ingrese su nombre completo"
                        className={errors.name ? 'p-invalid' : ''}
                        disabled={loading}
                    />
                    {errors.name && (
                        <small className="p-error block mt-1">
                            <i className="pi pi-exclamation-circle mr-1"></i>
                            {errors.name}
                        </small>
                    )}
                </div>

                {/* Email */}
                <div className="field">
                    <label htmlFor="email" className="font-semibold mb-2 block">
                        Email de contacto <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className={errors.email ? 'p-invalid' : ''}
                        disabled={loading}
                    />
                    {errors.email && (
                        <small className="p-error block mt-1">
                            <i className="pi pi-exclamation-circle mr-1"></i>
                            {errors.email}
                        </small>
                    )}
                </div>

                {/* Asunto y Prioridad en fila */}
                <div className="grid">
                    {/* Asunto */}
                    <div className="col-12 md:col-7">
                        <div className="field">
                            <label htmlFor="subject" className="font-semibold mb-2 block">
                                Asunto <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="subject"
                                value={formData.subject}
                                onChange={(e) => handleChange('subject', e.value)}
                                options={SUBJECT_OPTIONS}
                                placeholder="Seleccione un asunto"
                                className={errors.subject ? 'p-invalid' : ''}
                                disabled={loading}
                            />
                            {errors.subject && (
                                <small className="p-error block mt-1">
                                    <i className="pi pi-exclamation-circle mr-1"></i>
                                    {errors.subject}
                                </small>
                            )}
                        </div>
                    </div>

                    {/* Prioridad */}
                    <div className="col-12 md:col-5">
                        <div className="field">
                            <label htmlFor="priority" className="font-semibold mb-2 block">
                                Prioridad <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="priority"
                                value={formData.priority}
                                onChange={(e) => handleChange('priority', e.value)}
                                options={PRIORITY_OPTIONS}
                                placeholder="Prioridad"
                                itemTemplate={priorityOptionTemplate}
                                valueTemplate={priorityOptionTemplate}
                                className={errors.priority ? 'p-invalid' : ''}
                                disabled={loading}
                            />
                            {errors.priority && (
                                <small className="p-error block mt-1">
                                    <i className="pi pi-exclamation-circle mr-1"></i>
                                    {errors.priority}
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mensaje */}
                <div className="field">
                    <label htmlFor="message" className="font-semibold mb-2 block">
                        Descripción del problema <span className="text-red-500">*</span>
                    </label>
                    <InputTextarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        rows={5}
                        placeholder="Describa su problema o consulta con el mayor detalle posible (mínimo 20 caracteres)..."
                        className={errors.message ? 'p-invalid' : ''}
                        disabled={loading}
                    />
                    <div className="flex justify-content-between align-items-start mt-1">
                        {errors.message ? (
                            <small className="p-error">
                                <i className="pi pi-exclamation-circle mr-1"></i>
                                {errors.message}
                            </small>
                        ) : (
                            <small className="text-color-secondary">
                                Mínimo 20 caracteres
                            </small>
                        )}
                        <small className="text-color-secondary">
                            {formData.message.length} caracteres
                        </small>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

// ============================================================================
// EXPORT
// ============================================================================
export default HelpSupportDialog;
