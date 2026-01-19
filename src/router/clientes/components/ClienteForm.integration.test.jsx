import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClienteForm from './ClienteForm';
import UbicacionService from '../../ubicacion/services/UbicacionService';
import ClienteService from '../services/ClienteService';

jest.mock('../../ubicacion/services/UbicacionService');
jest.mock('../services/ClienteService', () => ({
  __esModule: true,
  default: {
    getZones: jest.fn()
  }
}));

// Mock de PrimeReact components (mismos que en el archivo principal)
jest.mock('primereact/dialog', () => ({
  Dialog: ({ children, visible, header, footer }) => 
    visible ? (
      <div data-testid="dialog">
        <div>{header}</div>
        <div>{children}</div>
        <div>{footer}</div>
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
  Button: ({ onClick, label, disabled, loading }) => (
    <button onClick={onClick} disabled={disabled || loading}>
      {label}
    </button>
  )
}));

jest.mock('primereact/dropdown', () => ({
  Dropdown: ({ value, options, onChange, placeholder, optionLabel, optionValue }) => (
    <select 
      value={value || ''} 
      onChange={(e) => onChange && onChange({ value: e.target.value })}
      data-testid="dropdown"
    >
      <option value="">{placeholder}</option>
      {options?.map((option, index) => (
        <option key={index} value={optionValue ? option[optionValue] : option.value}>
          {optionLabel ? option[optionLabel] : option.label}
        </option>
      ))}
    </select>
  )
}));

jest.mock('primereact/autocomplete', () => ({
  AutoComplete: ({ value, onChange, disabled }) => (
    <input 
      value={typeof value === 'object' ? value?.label || '' : value || ''}
      onChange={(e) => onChange && onChange({ value: e.target.value })}
      disabled={disabled}
      data-testid="autocomplete"
    />
  )
}));

describe('ClienteForm - Pruebas de Integración Específicas', () => {
  const mockProps = {
    visible: true,
    cliente: null,
    onHide: jest.fn(),
    onSave: jest.fn(),
    loading: false
  };

  const mockProvincias = [{ id: 1, name: 'Córdoba' }];
  const mockLocalidades = [
    { id: 1, name: 'Rio Cuarto', province: 1 },
    { id: 2, name: 'Las Higueras', province: 1 },
    { id: 3, name: 'Holmberg', province: 1 }
  ];
  const mockZonas = [
    { id: 10, name: 'Centro', locality: 1 },
    { id: 11, name: 'Banda Norte', locality: 1 },
    { id: 12, name: 'Alberdi', locality: 2 },
    { id: 13, name: 'Las Higueras', locality: 2 },
    { id: 14, name: 'Holmberg', locality: 3 }
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
    ClienteService.getZones.mockResolvedValue({
      success: true,
      data: mockZonas
    });
  });

  const fillBasicForm = async () => {
    await act(async () => {
      fireEvent.change(screen.getByTestId('nombre'), { target: { value: 'Test' } });
      fireEvent.change(screen.getByTestId('apellido'), { target: { value: 'Usuario' } });
      fireEvent.change(screen.getByTestId('dni'), { target: { value: '12345678' } });
      fireEvent.change(screen.getByPlaceholderText('Ej: Calle Principal'), { target: { value: 'Test St' } });
      fireEvent.change(screen.getByPlaceholderText('Ej: 123'), { target: { value: '123' } });
    });
  };

  const selectProvince = async () => {
    const provinciaDropdown = screen.getAllByTestId('dropdown')[0];
    await act(async () => {
      fireEvent.change(provinciaDropdown, { target: { value: '1' } });
    });
    await waitFor(() => {
      expect(UbicacionService.getLocalidades).toHaveBeenCalledWith('1');
    });
  };

  const selectLocalidad = async (localidad) => {
    const localityMatch = mockLocalidades.find((loc) => loc.name === localidad);
    const localidadInput = screen.getByTestId('autocomplete');
    await act(async () => {
      fireEvent.change(localidadInput, { target: { value: localidad } });
    });
    await waitFor(() => {
      expect(ClienteService.getZones).toHaveBeenCalledWith(localityMatch?.id);
    });
  };

  const selectZona = async (zonaId) => {
    const zonaDropdown = screen.getAllByTestId('dropdown')[1];
    await act(async () => {
      fireEvent.change(zonaDropdown, { target: { value: String(zonaId) } });
    });
  };

  describe('Matriz de Pruebas: Zonas × Localidades', () => {
    const testCases = [
      { zona: 'Centro', localidad: 'Rio Cuarto', expectedLocalityCall: true },
      { zona: 'Banda Norte', localidad: 'Rio Cuarto', expectedLocalityCall: true },
      { zona: 'Alberdi', localidad: 'Las Higueras', expectedLocalityCall: true },
      { zona: 'Las Higueras', localidad: 'Las Higueras', expectedLocalityCall: true },
      { zona: 'Holmberg', localidad: 'Holmberg', expectedLocalityCall: true },
    ];

    test.each(testCases)(
      'Combinación: Zona=$zona + Localidad=$localidad',
      async ({ zona, localidad, expectedLocalityCall }) => {
        await act(async () => {
          render(<ClienteForm {...mockProps} />);
        });

        await fillBasicForm();

        // Seleccionar provincia (esto carga las localidades)
        await selectProvince();

        // Seleccionar localidad
        await selectLocalidad(localidad);

        // Seleccionar zona (depende de localidad)
        const zoneOption = mockZonas.find((z) => z.name === zona);
        if (zoneOption) {
          await selectZona(zoneOption.id);
        }

        // Verificar que la localidad esté habilitada después de seleccionar provincia
        expect(localidadInput).not.toBeDisabled();

        // Enviar formulario
        const submitButton = screen.getByText('Guardar');
        await act(async () => {
          fireEvent.click(submitButton);
        });

        // Verificar que se llamó el servicio de localidades si se esperaba
        if (expectedLocalityCall) {
          expect(UbicacionService.getLocalidades).toHaveBeenCalledWith('1');
        }

        // Verificar que se guardó con los datos correctos
        await waitFor(() => {
          expect(mockProps.onSave).toHaveBeenCalledWith(
            expect.objectContaining({
              zona: mockZonas.find((z) => z.name === zona)?.id,
              address: expect.objectContaining({
                locality_id: mockLocalidades.find((loc) => loc.name === localidad)?.id
              })
            })
          );
        });
      }
    );
  });

  describe('Casos especiales de combinaciones', () => {
    test('debe mantener coherencia cuando zona y localidad tienen el mismo nombre', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      await fillBasicForm();

      // Caso especial: Zona "Las Higueras" con Localidad "Las Higueras"
      await selectProvince();

      await selectLocalidad('Las Higueras');

      const zonaSeleccionada = mockZonas.find((z) => z.name === 'Las Higueras');
      if (zonaSeleccionada) {
        await selectZona(zonaSeleccionada.id);
      }

      const submitButton = screen.getByText('Guardar');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            zona: mockZonas.find((z) => z.name === 'Las Higueras')?.id
          })
        );
      });
    });

    test('debe filtrar zonas por localidad seleccionada', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      await fillBasicForm();

      await selectProvince();

      await selectLocalidad('Holmberg');

      const zonaDropdown = screen.getAllByTestId('dropdown')[1];
      expect(zonaDropdown).toBeInTheDocument();
      expect(screen.getByText('Holmberg')).toBeInTheDocument();
      expect(screen.queryByText('Centro')).not.toBeInTheDocument();
    });
  });

  describe('Pruebas de robustez con datos reales', () => {
    test('debe manejar cliente existente con datos completos de Córdoba', async () => {
      const clienteRealCordoba = {
        id: 1,
        first_name: 'Carlos',
        last_name: 'Mendoza',
        phone_number: '+54 358 4567890',
        dni: '12345678',
        zona: 'Las Higueras',
        address: {
          street: 'Rivadavia',
          number: '1234',
          floor: '2',
          apartment: 'B',
          locality: {
            id: 2,
            name: 'Las Higueras',
            province: {
              id: 1,
              name: 'Córdoba'
            }
          }
        }
      };

      await act(async () => {
        render(<ClienteForm {...mockProps} cliente={clienteRealCordoba} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('nombre')).toHaveValue('Carlos');
        expect(screen.getByTestId('apellido')).toHaveValue('Mendoza');
        expect(screen.getByTestId('telefono')).toHaveValue('+54 358 4567890');
        expect(screen.getByTestId('dni')).toHaveValue('12345678');
      });

      // Verificar que se cargaron las localidades para la provincia
      await waitFor(() => {
        expect(UbicacionService.getLocalidades).toHaveBeenCalledWith(1);
      });
    });

    test('debe validar DNI con formato argentino', async () => {
      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      const dniInput = screen.getByTestId('dni');
      
      // Probar diferentes formatos de DNI inválidos
      const invalidDnis = ['1234567', '123456789', 'abcd1234', '12.345.678'];
      
      for (const invalidDni of invalidDnis) {
        await act(async () => {
          fireEvent.change(dniInput, { target: { value: invalidDni } });
        });

        const submitButton = screen.getByText('Guardar');
        await act(async () => {
          fireEvent.click(submitButton);
        });

        await waitFor(() => {
          expect(screen.getByText('El DNI debe tener 8 dígitos numéricos')).toBeInTheDocument();
        });
      }

      // Probar DNI válido
      await act(async () => {
        fireEvent.change(dniInput, { target: { value: '12345678' } });
      });

      // El error debería desaparecer
      await waitFor(() => {
        expect(screen.queryByText('El DNI debe tener 8 dígitos numéricos')).not.toBeInTheDocument();
      });
    });
  });

  describe('Escenarios de error del servicio', () => {
    test('debe manejar falla en servicio de provincias', async () => {
      UbicacionService.getProvincias.mockRejectedValue(new Error('Conexión perdida'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading provincias:', expect.any(Error));
      });

      // El formulario debe seguir funcionando sin provincias
      expect(screen.getByTestId('dialog')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test('debe manejar falla en servicio de localidades', async () => {
      UbicacionService.getLocalidades.mockRejectedValue(new Error('Timeout'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      // Intentar seleccionar provincia
      const provinciaDropdown = screen.getAllByTestId('dropdown')[0];
      await act(async () => {
        fireEvent.change(provinciaDropdown, { target: { value: '1' } });
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading localidades:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    test('debe manejar respuesta de servicio con datos mal formateados', async () => {
      UbicacionService.getProvincias.mockResolvedValue({
        success: true,
        data: [
          { id: 1 }, // Sin nombre
          { name: 'Córdoba' }, // Sin ID
          null, // Elemento nulo
          { id: 2, name: 'Buenos Aires' } // Elemento válido
        ]
      });

      await act(async () => {
        render(<ClienteForm {...mockProps} />);
      });

      // Debe manejar los datos mal formateados sin errores
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
  });
});