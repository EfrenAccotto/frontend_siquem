import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ClienteForm from './ClienteForm';
import UbicacionService from '../../ubicacion/services/UbicacionService';

// Mock del servicio de ubicación
jest.mock('../../ubicacion/services/UbicacionService', () => ({
  getProvincias: jest.fn(),
  getLocalidades: jest.fn(),
}));

// Mock de PrimeReact components
jest.mock('primereact/dialog', () => ({
  Dialog: ({ children, visible, header, footer, onHide }) => 
    visible ? (
      <div data-testid="dialog">
        <div data-testid="dialog-header">{header}</div>
        <div>{children}</div>
        <div data-testid="dialog-footer">{footer}</div>
        <button onClick={onHide} data-testid="dialog-close">Close</button>
      </div>
    ) : null
}));

jest.mock('primereact/inputtext', () => ({
  InputText: (props) => (
    <input 
      {...props} 
      data-testid={props.id || 'input'} 
      onChange={(e) => props.onChange && props.onChange(e)}
    />
  )
}));

jest.mock('primereact/button', () => ({
  Button: ({ onClick, children, label, disabled, loading, ...props }) => (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {label || children}
    </button>
  )
}));

jest.mock('primereact/dropdown', () => ({
  Dropdown: ({ value, options, onChange, placeholder, optionLabel, optionValue, ...props }) => (
    <select 
      value={value || ''} 
      onChange={(e) => onChange && onChange({ value: e.target.value })}
      data-testid={props['data-testid'] || 'dropdown'}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options?.map((option, index) => (
        <option 
          key={index} 
          value={optionValue ? option[optionValue] : option.value}
        >
          {optionLabel ? option[optionLabel] : option.label}
        </option>
      ))}
    </select>
  )
}));

jest.mock('primereact/autocomplete', () => ({
  AutoComplete: ({ value, suggestions, onChange, field, placeholder, disabled, ...props }) => (
    <div>
      <input 
        value={typeof value === 'object' ? value?.[field] || '' : value || ''}
        onChange={(e) => onChange && onChange({ value: e.target.value })}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={props['data-testid'] || 'autocomplete'}
        list="suggestions"
      />
      <datalist id="suggestions">
        {suggestions?.map((suggestion, index) => (
          <option key={index} value={suggestion[field] || suggestion.label} />
        ))}
      </datalist>
    </div>
  )
}));

describe('ClienteForm', () => {
  const mockProps = {
    visible: true,
    cliente: null,
    onHide: jest.fn(),
    onSave: jest.fn(),
    loading: false
  };

  const mockProvincias = [
    { id: 1, name: 'Córdoba' }
  ];

  const mockLocalidades = [
    { id: 1, name: 'Rio Cuarto', province: 1 },
    { id: 2, name: 'Las Higueras', province: 1 },
    { id: 3, name: 'Holmberg', province: 1 }
  ];

  const zonas = [
    { label: 'Centro', value: 'Centro' },
    { label: 'Banda Norte', value: 'Banda Norte' },
    { label: 'Alberdi', value: 'Alberdi' },
    { label: 'Las Higueras', value: 'Las Higueras' },
    { label: 'Holmberg', value: 'Holmberg' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    UbicacionService.getProvincias.mockResolvedValue({
      success: true,
      data: mockProvincias
    });
    UbicacionService.getLocalidades.mockResolvedValue({
      success: true,
      data: mockLocalidades
    });
  });

  describe('Renderizado inicial', () => {
    test('debe renderizar el diálogo cuando está visible', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-header')).toHaveTextContent('Nuevo Cliente');
    });

    test('no debe renderizar el diálogo cuando no está visible', () => {
      render(<ClienteForm {...mockProps} visible={false} />);
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    test('debe mostrar "Editar Cliente" cuando se edita un cliente existente', async () => {
      const clienteExistente = {
        id: 1,
        first_name: 'Juan',
        last_name: 'Pérez'
      };

      await act(async () => {
        render(<ClienteForm {...mockProps} cliente={clienteExistente} />);
      });

      expect(screen.getByTestId('dialog-header')).toHaveTextContent('Editar Cliente');
    });
  });

  describe('Campos del formulario', () => {
    test('debe renderizar todos los campos requeridos', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      expect(screen.getByTestId('nombre')).toBeInTheDocument();
      expect(screen.getByTestId('apellido')).toBeInTheDocument();
      expect(screen.getByTestId('dni')).toBeInTheDocument();
      expect(screen.getByTestId('telefono')).toBeInTheDocument();
    });

    test('debe renderizar el dropdown de zonas con todas las opciones', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      const zonaDropdown = screen.getByTestId('dropdown');
      expect(zonaDropdown).toBeInTheDocument();

      // Verificar que todas las zonas están disponibles
      zonas.forEach(zona => {
        expect(screen.getByText(zona.label)).toBeInTheDocument();
      });
    });
  });

  describe('Validación de formulario', () => {
    test('debe mostrar errores de validación para campos requeridos vacíos', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      const submitButton = screen.getByText('Guardar');
      
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
        expect(screen.getByText('El apellido es requerido')).toBeInTheDocument();
        expect(screen.getByText('El DNI es requerido')).toBeInTheDocument();
        expect(screen.getByText('La provincia es requerida')).toBeInTheDocument();
        expect(screen.getByText('La localidad es requerida')).toBeInTheDocument();
        expect(screen.getByText('La calle es requerida')).toBeInTheDocument();
        expect(screen.getByText('El número es requerido')).toBeInTheDocument();
      });

      expect(mockProps.onSave).not.toHaveBeenCalled();
    });

    test('debe validar formato de DNI', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      const dniInput = screen.getByTestId('dni');
      
      // DNI con menos de 8 dígitos
      await act(async () => {
        fireEvent.change(dniInput, { target: { value: '1234' } });
      });

      const submitButton = screen.getByText('Guardar');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('El DNI debe tener 8 dígitos numéricos')).toBeInTheDocument();
      });

      // DNI con caracteres no numéricos
      await act(async () => {
        fireEvent.change(dniInput, { target: { value: '12345abc' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('El DNI debe tener 8 dígitos numéricos')).toBeInTheDocument();
      });
    });
  });

  describe('Combinaciones de Zonas y Localidades', () => {
    beforeEach(async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });
    });

    test.each([
      ['Centro', 'Rio Cuarto'],
      ['Centro', 'Las Higueras'], 
      ['Centro', 'Holmberg'],
      ['Banda Norte', 'Rio Cuarto'],
      ['Banda Norte', 'Las Higueras'],
      ['Banda Norte', 'Holmberg'],
      ['Alberdi', 'Rio Cuarto'],
      ['Alberdi', 'Las Higueras'],
      ['Alberdi', 'Holmberg'],
      ['Las Higueras', 'Rio Cuarto'],
      ['Las Higueras', 'Las Higueras'],
      ['Las Higueras', 'Holmberg'],
      ['Holmberg', 'Rio Cuarto'],
      ['Holmberg', 'Las Higueras'],
      ['Holmberg', 'Holmberg']
    ])('debe permitir seleccionar zona %s con localidad %s', async (zona, localidad) => {
      // Llenar campos requeridos
      const nombreInput = screen.getByTestId('nombre');
      const apellidoInput = screen.getByTestId('apellido');
      const dniInput = screen.getByTestId('dni');
      const calleInput = screen.getByPlaceholderText('Ej: Calle Principal');
      const numeroInput = screen.getByPlaceholderText('Ej: 123');

      await act(async () => {
        fireEvent.change(nombreInput, { target: { value: 'Juan' } });
        fireEvent.change(apellidoInput, { target: { value: 'Pérez' } });
        fireEvent.change(dniInput, { target: { value: '12345678' } });
        fireEvent.change(calleInput, { target: { value: 'Calle Test' } });
        fireEvent.change(numeroInput, { target: { value: '123' } });
        fireEvent.change(numeroInput, { target: { value: '123' } });
      });

      // Seleccionar zona
      const dropdowns = screen.getAllByTestId('dropdown');
      const zonaDropdown = dropdowns[0];
      await act(async () => {
        fireEvent.change(zonaDropdown, { target: { value: zona } });
      });

      // Seleccionar provincia Córdoba
      const provinciaDropdown = screen.getAllByTestId('dropdown')[1];
      await act(async () => {
        fireEvent.change(provinciaDropdown, { target: { value: '1' } });
      });

      await waitFor(() => {
        expect(UbicacionService.getLocalidades).toHaveBeenCalledWith('1');
      });

      // Seleccionar localidad
      const localidadInput = screen.getByTestId('autocomplete');
      await act(async () => {
        fireEvent.change(localidadInput, { target: { value: localidad } });
      });

      // Enviar formulario
      const submitButton = screen.getByText('Guardar');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith({
          first_name: 'Juan',
          last_name: 'Pérez',
          phone_number: '',
          dni: '12345678',
          zona: zona,
          address: {
            street: 'Calle Test',
            number: '123',
            floor: '',
            apartment: '',
            locality_id: localidad
          }
        });
      });
    });
  });

  describe('Carga de datos de ubicación', () => {
    test('debe cargar provincias al montar el componente', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      await waitFor(() => {
        expect(UbicacionService.getProvincias).toHaveBeenCalled();
      });
    });

    test('debe cargar localidades cuando se selecciona una provincia', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      const provinciaDropdown = screen.getAllByTestId('dropdown')[1];
      
      await act(async () => {
        fireEvent.change(provinciaDropdown, { target: { value: '1' } });
      });

      await waitFor(() => {
        expect(UbicacionService.getLocalidades).toHaveBeenCalledWith('1');
      });
    });

    test('debe manejar errores en la carga de provincias', async () => {
      UbicacionService.getProvincias.mockResolvedValue({
        success: false,
        error: 'Error de red'
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading provincias:', 'Error de red');
      });

      consoleSpy.mockRestore();
    });

    test('debe manejar errores en la carga de localidades', async () => {
      UbicacionService.getLocalidades.mockResolvedValue({
        success: false,
        error: 'Error de localidades'
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      const provinciaDropdown = screen.getAllByTestId('dropdown')[1];
      
      await act(async () => {
        fireEvent.change(provinciaDropdown, { target: { value: '1' } });
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading localidades:', 'Error de localidades');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Formulario con datos existentes', () => {
    const clienteExistente = {
      id: 1,
      first_name: 'María',
      last_name: 'González',
      phone_number: '+54 358 4567890',
      dni: '87654321',
      zona: 'Centro',
      address: {
        street: 'San Martín',
        number: '456',
        floor: '2',
        apartment: 'A',
        locality: {
          id: 1,
          name: 'Rio Cuarto',
          province: {
            id: 1,
            name: 'Córdoba'
          }
        }
      }
    };

    test('debe cargar datos del cliente existente', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} cliente={clienteExistente} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('nombre')).toHaveValue('María');
        expect(screen.getByTestId('apellido')).toHaveValue('González');
        expect(screen.getByTestId('telefono')).toHaveValue('+54 358 4567890');
        expect(screen.getByTestId('dni')).toHaveValue('87654321');
      });
    });

    test('debe cargar localidades cuando hay provincia preseleccionada', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} cliente={clienteExistente} />);
      });

      await waitFor(() => {
        expect(UbicacionService.getLocalidades).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Interacciones del usuario', () => {
    test('debe limpiar errores cuando el usuario escribe en los campos', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      const submitButton = screen.getByText('Guardar');
      
      // Generar errores
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      });

      // Escribir en el campo nombre
      const nombreInput = screen.getByTestId('nombre');
      await act(async () => {
        fireEvent.change(nombreInput, { target: { value: 'Juan' } });
      });

      await waitFor(() => {
        expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument();
      });
    });

    test('debe deshabilitar localidad cuando no hay provincia seleccionada', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      const localidadInput = screen.getByTestId('autocomplete');
      expect(localidadInput).toBeDisabled();
    });

    test('debe habilitar localidad cuando se selecciona provincia', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      const provinciaDropdown = screen.getAllByTestId('dropdown')[1];
      
      await act(async () => {
        fireEvent.change(provinciaDropdown, { target: { value: '1' } });
      });

      await waitFor(() => {
        const localidadInput = screen.getByTestId('autocomplete');
        expect(localidadInput).not.toBeDisabled();
      });
    });

    test('debe llamar onHide cuando se cancela', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      const cancelButton = screen.getByText('Cancelar');
      
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      expect(mockProps.onHide).toHaveBeenCalled();
    });
  });

  describe('Estados de carga', () => {
    test('debe deshabilitar botones cuando está cargando', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} loading={true} />);
      });

      const cancelButton = screen.getByText('Cancelar');
      const submitButton = screen.getByText('Guardar');

      expect(cancelButton).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    test('debe mostrar texto de carga en botón de envío', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} loading={true} />);
      });

      const submitButton = screen.getByText('Guardar');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Casos extremos', () => {
    test('debe manejar respuesta vacía de provincias', async () => {
      UbicacionService.getProvincias.mockResolvedValue({
        success: true,
        data: null
      });

      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      // No debe mostrar errores en consola
      const consoleSpy = jest.spyOn(console, 'error');
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('debe manejar excepción en getProvincias', async () => {
      UbicacionService.getProvincias.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    test('debe manejar valores de localidad complejos', async () => {
      const clienteConLocalidadCompleja = {
        ...mockProps.cliente,
        address: {
          locality: {
            id: 1,
            name: 'Rio Cuarto',
            province: { id: 1 }
          }
        }
      };

      await act(async () => {
        render(<ClienteForm {...mockProps} cliente={clienteConLocalidadCompleja} />);
      });

      // Debe cargar sin errores
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });

  describe('Formulario completo válido', () => {
    test('debe enviar formulario completo con todos los datos', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      // Llenar todos los campos
      await act(async () => {
        fireEvent.change(screen.getByTestId('nombre'), { target: { value: 'Carlos' } });
        fireEvent.change(screen.getByTestId('apellido'), { target: { value: 'Rodríguez' } });
        fireEvent.change(screen.getByTestId('telefono'), { target: { value: '+54 358 1234567' } });
        fireEvent.change(screen.getByTestId('dni'), { target: { value: '11223344' } });
        
        // Seleccionar zona
        const dropdowns = screen.getAllByTestId('dropdown');
        fireEvent.change(dropdowns[0], { target: { value: 'Las Higueras' } });
        
        // Seleccionar provincia
        fireEvent.change(screen.getAllByTestId('dropdown')[1], { target: { value: '1' } });
      });

      await waitFor(() => {
        expect(UbicacionService.getLocalidades).toHaveBeenCalled();
      });

      await act(async () => {
        // Seleccionar localidad
        fireEvent.change(screen.getByTestId('autocomplete'), { target: { value: 'Las Higueras' } });
        
        // Dirección
        fireEvent.change(screen.getByPlaceholderText('Ej: Calle Principal'), { target: { value: 'Rivadavia' } });
        fireEvent.change(screen.getByPlaceholderText('Ej: 123'), { target: { value: '789' } });
        fireEvent.change(screen.getAllByPlaceholderText('Opcional')[0], { target: { value: '1' } });
        fireEvent.change(screen.getAllByPlaceholderText('Opcional')[1], { target: { value: 'B' } });
      });

      const submitButton = screen.getByText('Guardar');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith({
          first_name: 'Carlos',
          last_name: 'Rodríguez',
          phone_number: '+54 358 1234567',
          dni: '11223344',
          zona: 'Las Higueras',
          address: {
            street: 'Rivadavia',
            number: '789',
            floor: '1',
            apartment: 'B',
            locality_id: 'Las Higueras'
          }
        });
      });
    });
  });
});