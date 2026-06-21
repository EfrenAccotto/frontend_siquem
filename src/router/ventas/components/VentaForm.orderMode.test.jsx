import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import VentaForm from './VentaForm';
import PedidoService from '@/router/pedidos/services/PedidoService';
import ProductoService from '@/router/productos/services/ProductoService';

const mockFetchClientes = jest.fn();

jest.mock('@/store/useClienteStore', () => ({
  __esModule: true,
  default: () => ({ clientes: [], fetchClientes: mockFetchClientes })
}));
jest.mock('@/router/pedidos/services/PedidoService', () => ({
  __esModule: true,
  default: { getAll: jest.fn(), getById: jest.fn() }
}));
jest.mock('@/router/productos/services/ProductoService', () => ({
  __esModule: true,
  default: { getAll: jest.fn() }
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
    expect(mockFetchClientes).not.toHaveBeenCalled();
    expect(ProductoService.getAll).not.toHaveBeenCalled();
    expect(PedidoService.getAll).not.toHaveBeenCalled();
    expect(PedidoService.getById).not.toHaveBeenCalled();
  });
});
