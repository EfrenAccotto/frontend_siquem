import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import PedidoForm from './PedidoForm';
import UbicacionService from '@/router/ubicacion/services/UbicacionService';
import ProductoService from '@/router/productos/services/ProductoService';

const mockCliente = {
  id: 5,
  first_name: 'Ana',
  last_name: 'Perez',
  address: { id: 8, street: 'Mitre', number: '10' }
};
const mockFetchClientes = jest.fn(async () => [mockCliente]);

jest.mock('@/store/useClienteStore', () => {
  const hook = () => ({ clientes: [mockCliente], fetchClientes: mockFetchClientes });
  hook.getState = () => ({ clientes: [mockCliente] });
  return { __esModule: true, default: hook };
});
jest.mock('@/router/productos/services/ProductoService', () => ({
  __esModule: true,
  default: { getAllPages: jest.fn() }
}));
jest.mock('@/router/ubicacion/services/UbicacionService', () => ({
  __esModule: true,
  default: { getLocalidades: jest.fn(), getZonas: jest.fn() }
}));
jest.mock('@/router/clientes/services/ClienteService', () => ({
  __esModule: true,
  default: { create: jest.fn(), getById: jest.fn() }
}));
jest.mock('@/router/clientes/components/ClienteForm', () => ({
  __esModule: true,
  default: () => null
}));

describe('PedidoForm submit lock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ProductoService.getAllPages.mockResolvedValue({
      success: true,
      data: [{ id: 3, name: 'Yerba', price: '10.00', stock_unit: 'unit' }]
    });
    UbicacionService.getLocalidades.mockResolvedValue({ success: true, data: [] });
  });

  it('calls onSave once when the save button is clicked twice synchronously', async () => {
    const onSave = jest.fn(() => new Promise(() => {}));
    const pedido = {
      id: 42,
      state: 'pending',
      date: '2026-06-21',
      payment_method: 'cash',
      customer: mockCliente,
      detail: [{ product_id: 3, product_name: 'Yerba', quantity: 2 }]
    };

    render(
      <PedidoForm
        visible
        pedido={pedido}
        onHide={jest.fn()}
        onSave={onSave}
        loading={false}
      />
    );

    const saveButton = await screen.findByRole('button', { name: /Guardar Pedido/i });
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(mockFetchClientes).toHaveBeenCalledTimes(1);
    expect(ProductoService.getAllPages).toHaveBeenCalledTimes(1);
  });
});
