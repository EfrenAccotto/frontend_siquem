import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import VentaForm from './VentaForm';
import PedidoService from '@/router/pedidos/services/PedidoService';
import ProductoService from '@/router/productos/services/ProductoService';

const mockFetchClientes = jest.fn();
const mockClientes = [
  { id: 5, first_name: 'Ana', last_name: 'Perez' },
  { id: 6, first_name: 'Luis', last_name: 'Gomez' }
];

jest.mock('@/store/useClienteStore', () => ({
  __esModule: true,
  default: () => ({ clientes: mockClientes, fetchClientes: mockFetchClientes })
}));
jest.mock('@/router/pedidos/services/PedidoService', () => ({
  __esModule: true,
  default: { getAllPages: jest.fn(), getById: jest.fn() }
}));
jest.mock('@/router/productos/services/ProductoService', () => ({
  __esModule: true,
  default: { getAllPages: jest.fn() }
}));
jest.mock('@/router/ventas/services/VentaService', () => ({
  __esModule: true,
  default: { getDetailsBySaleId: jest.fn() }
}));

describe('VentaForm order mode', () => {
  const pedido = {
    id: 42,
    date: '2026-06-21',
    payment_method: 'cash',
    customer: { id: 5, first_name: 'Ana', last_name: 'Perez' },
    detail: [{
      id: 1,
      product_id: 3,
      product_name: 'Yerba',
      product_price: '10.00',
      quantity: '2.000'
    }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchClientes.mockResolvedValue(mockClientes);
    ProductoService.getAllPages.mockResolvedValue({ success: true, data: [] });
    PedidoService.getAllPages.mockResolvedValue({ success: true, data: [] });
  });

  it('does not load catalogs or refetch the order and blocks a double submit', async () => {
    const onSave = jest.fn(() => new Promise(() => {}));

    render(
      <VentaForm
        visible
        pedido={pedido}
        onHide={jest.fn()}
        onSave={onSave}
        loading={false}
      />
    );

    const saveButton = await screen.findByRole('button', { name: /Guardar Venta/i });
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: 42,
        total_price: 20,
        date: '2026-06-21',
        payment_method: 'cash'
      }),
      expect.arrayContaining([
        expect.objectContaining({
          producto: expect.objectContaining({ id: 3 }),
          cantidad: '2.000'
        })
      ])
    );
    expect(mockFetchClientes).not.toHaveBeenCalled();
    expect(ProductoService.getAllPages).not.toHaveBeenCalled();
    expect(PedidoService.getAllPages).not.toHaveBeenCalled();
    expect(PedidoService.getById).not.toHaveBeenCalled();
  });

  it('loads complete catalogs when opened from sales CRUD', async () => {
    render(
      <VentaForm
        visible
        onHide={jest.fn()}
        onSave={jest.fn()}
        loading={false}
      />
    );

    await waitFor(() => {
      expect(mockFetchClientes).toHaveBeenCalledTimes(1);
      expect(ProductoService.getAllPages).toHaveBeenCalledTimes(1);
      expect(PedidoService.getAllPages).toHaveBeenCalledTimes(1);
    });
  });
});
