export const getPedidoTotal = (pedido = {}) => {
  const totalRaw = pedido.order_total ?? pedido.total_price ?? pedido.total;
  const total = Number(totalRaw);
  if (Number.isFinite(total)) return total;

  const details = pedido.detail || pedido.details || pedido.detalles || pedido.items || [];
  return (details || []).reduce((acc, detail) => {
    const quantity = Number(detail.quantity ?? detail.cantidad ?? 0) || 0;
    const price = Number(
      detail.product_price
      ?? detail.price
      ?? detail.product?.price
      ?? detail.producto?.price
      ?? 0
    ) || 0;
    const subtotal = Number(detail.subtotal);
    return acc + (Number.isFinite(subtotal) ? subtotal : quantity * price);
  }, 0);
};

export const flattenOrdersByZone = (reportData = {}) => {
  const zoneOrders = (reportData.zones || []).flatMap((zone) => zone.orders || []);
  const allOrders = [...zoneOrders, ...(reportData.unassigned_orders || [])];
  const uniqueOrders = new Map();

  allOrders.forEach((order) => {
    if (!order?.id || uniqueOrders.has(order.id)) return;
    uniqueOrders.set(order.id, {
      ...order,
      state: order.state || order.status,
      total_price: getPedidoTotal(order)
    });
  });

  return [...uniqueOrders.values()].sort((a, b) => (b.id || 0) - (a.id || 0));
};
