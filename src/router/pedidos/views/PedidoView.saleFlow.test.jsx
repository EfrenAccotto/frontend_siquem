import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import PedidoView from './PedidoView';
import PedidoService from '../services/PedidoService';

const mockFetchClientes = jest.fn();

jest.mock('@/store/useClienteStore', () => ({
  __esModule: true,
  default: () => ({ clientes: [], fetchClientes: mockFetchClientes })
}));
jest.mock('../services/PedidoService', () => ({
  __esModule: true,
  default: {
    getAll: jest.fn(),
    getById: jest.fn(),
    complete: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));
jest.mock('@/router/reportes/services/ReporteService', () => ({
  __esModule: true,
  default: {
    getOrdersByZone: jest.fn(),
    downloadOrdersByZonePdf: jest.fn(),
    downloadByOrderId: jest.fn()
  }
}));
jest.mock('../../../components/layout/TableComponent', () => ({
  __esModule: true,
  default: ({ data, header, onSelectionChange }) => (
    <div>
      {header}
      <button type="button" onClick={() => onSelectionChange(data[0])}>Seleccionar pedido</button>
    </div>
  )
}));
jest.mock('../../../components/layout/ActionButtons', () => ({
  __esModule: true,
  default: ({ extraActions }) => <div>{extraActions}</div>
}));
jest.mock('../components/PedidoForm', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../components/DetallePedidoDialog', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('@/router/ventas/components/VentaForm', () => ({
  __esModule: true,
  default: ({ visible, pedido, onSave }) => visible ? (
    <button
      type="button"
      onClick={() => onSave(
        { payment_method: 'transfer' },
        pedido.detail.map((item) => ({
          product_id: item.product_id,
          cantidad: item.quantity
        }))
      )}
    >
      Confirmar venta
    </button>
  ) : null
}));

describe('PedidoView sale flow', () => {
  const pedidoResumen = {
    id: 42,
    state: 'pending',
    date: '2026-06-23',
    customer: { id: 5, first_name: 'Ana', last_name: 'Perez' }
  };
  const pedidoCompleto = {
    ...pedidoResumen,
    payment_method: 'cash',
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
    mockFetchClientes.mockResolvedValue([]);
    PedidoService.getAll.mockResolvedValue({
      success: true,
      data: [pedidoResumen],
      pagination: { count: 1 }
    });
    PedidoService.getById.mockResolvedValue({ success: true, data: pedidoCompleto });
    PedidoService.complete.mockResolvedValue({
      success: true,
      data: {
        order: { ...pedidoCompleto, state: 'completed' },
        sale: { id: 9, order_id: 42 },
        replayed: false
      }
    });
  });

  it('loads the full order and completes it once with the modal items', async () => {
    render(<PedidoView />);

    const selectButton = await screen.findByRole('button', { name: 'Seleccionar pedido' });
    fireEvent.click(selectButton);
    fireEvent.click(screen.getByRole('button', { name: 'Generar Venta' }));

    expect(await screen.findByRole('button', { name: 'Confirmar venta' })).toBeInTheDocument();
    expect(PedidoService.getById).toHaveBeenCalledWith(42, expect.objectContaining({ signal: expect.any(AbortSignal) }));

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar venta' }));

    await waitFor(() => {
      expect(PedidoService.complete).toHaveBeenCalledTimes(1);
      expect(PedidoService.complete).toHaveBeenCalledWith(42, {
        detail: [{ product_id: 3, quantity: 2 }],
        payment_method: 'transfer'
      });
    });
  });
});
