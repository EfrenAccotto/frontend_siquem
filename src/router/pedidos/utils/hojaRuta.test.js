import { describe, expect, it } from '@jest/globals';
import { flattenOrdersByZone, getPedidoTotal } from './hojaRuta';

describe('hojaRuta', () => {
  it('usa el total calculado por el reporte', () => {
    expect(getPedidoTotal({ order_total: '1250.50' })).toBe(1250.5);
  });

  it('calcula el total desde los detalles cuando el reporte no lo incluye', () => {
    expect(getPedidoTotal({
      details: [
        { quantity: '2', price: '100.50' },
        { subtotal: '75.25' }
      ]
    })).toBe(276.25);
  });

  it('combina zonas y pedidos sin zona sin duplicar pedidos', () => {
    const result = flattenOrdersByZone({
      zones: [
        { orders: [{ id: 2, order_total: 200 }, { id: 1, order_total: 100 }] },
        { orders: [{ id: 2, order_total: 200 }] }
      ],
      unassigned_orders: [{ id: 3, order_total: 300 }]
    });

    expect(result.map((order) => order.id)).toEqual([3, 2, 1]);
    expect(result.reduce((acc, order) => acc + getPedidoTotal(order), 0)).toBe(600);
  });
});
