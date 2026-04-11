import { isSameDay, isSameMonth, isSameWeek, parseISO } from 'date-fns';

import type { CartItem, DashboardMetrics, Order, OrderStatus } from '../types';

export const DELIVERY_FEE = 3.5;

export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const customizationDelta = item.customizations.reduce(
      (sum, customization) => sum + customization.priceDelta,
      0
    );
    return total + (item.basePrice + customizationDelta) * item.quantity;
  }, 0);
}

export function calculateOrderTotals(items: CartItem[], discountPercent = 0) {
  const subtotal = calculateCartSubtotal(items);
  const discount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;
  const total = Number((subtotal - discount + deliveryFee).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount,
    deliveryFee,
    total,
  };
}

export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  const flow: OrderStatus[] = [
    'pending',
    'accepted',
    'preparing',
    'ready',
    'on_the_way',
    'delivered',
  ];
  const index = flow.indexOf(current);
  if (index === -1 || index === flow.length - 1) {
    return null;
  }
  return flow[index + 1];
}

export function buildManagerMetrics(orders: Order[], nowIso: string): DashboardMetrics {
  const now = parseISO(nowIso);
  const deliveredOrders = orders.filter((order) => order.status === 'delivered');
  const deliveredTotal = deliveredOrders.reduce((sum, order) => sum + order.total, 0);

  const dailyRevenue = deliveredOrders
    .filter((order) => isSameDay(parseISO(order.createdAt), now))
    .reduce((sum, order) => sum + order.total, 0);

  const weeklyRevenue = deliveredOrders
    .filter((order) => isSameWeek(parseISO(order.createdAt), now, { weekStartsOn: 1 }))
    .reduce((sum, order) => sum + order.total, 0);

  const monthlyRevenue = deliveredOrders
    .filter((order) => isSameMonth(parseISO(order.createdAt), now))
    .reduce((sum, order) => sum + order.total, 0);

  const outstandingCod = orders
    .filter((order) => order.paymentMethod === 'cod' && order.paymentStatus !== 'cod_collected')
    .reduce((sum, order) => sum + order.total, 0);

  const pendingRefunds = orders.filter(
    (order) => order.refundRequest?.status === 'requested'
  ).length;

  return {
    dailyRevenue: Number(dailyRevenue.toFixed(2)),
    weeklyRevenue: Number(weeklyRevenue.toFixed(2)),
    monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
    deliveredOrders: deliveredOrders.length,
    averageOrderValue:
      deliveredOrders.length > 0
        ? Number((deliveredTotal / deliveredOrders.length).toFixed(2))
        : 0,
    pendingRefunds,
    outstandingCod: Number(outstandingCod.toFixed(2)),
  };
}
