import { isSameDay, isSameMonth, isSameWeek, parseISO } from 'date-fns';

import type { CartItem, DashboardMetrics, Order, OrderStatus } from '../types';
import { calculateDistance, type LatLng } from './locationUtils';

export const DELIVERY_FEE_CONFIG = {
  minimumFee: 2,
  includedDistanceKm: 1,
  perKmRate: 0.5,
  maximumFee: 8,
  freeDeliveryThreshold: 50,
  maxDemandMultiplier: 2,
} as const;

export const DEFAULT_RESTAURANT_LOCATION: LatLng = {
  latitude: 23.7508,
  longitude: 90.3906,
};

export type OrderPricingContext = {
  restaurantLocation?: LatLng | null;
  deliveryLocation?: LatLng | null;
  demandMultiplier?: number;
};

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function clampDemandMultiplier(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(
    Math.max(value ?? 1, 1),
    DELIVERY_FEE_CONFIG.maxDemandMultiplier
  );
}

export function calculateDeliveryFee(subtotal: number, context?: OrderPricingContext): number {
  if (subtotal <= 0) {
    return 0;
  }

  if (subtotal >= DELIVERY_FEE_CONFIG.freeDeliveryThreshold) {
    return 0;
  }

  const deliveryLocation = context?.deliveryLocation;
  if (!deliveryLocation) {
    return DELIVERY_FEE_CONFIG.minimumFee;
  }

  const restaurantLocation = context?.restaurantLocation ?? DEFAULT_RESTAURANT_LOCATION;
  const distanceKm = calculateDistance(restaurantLocation, deliveryLocation);
  const billableDistanceKm = Math.max(0, distanceKm - DELIVERY_FEE_CONFIG.includedDistanceKm);
  const distanceFee =
    DELIVERY_FEE_CONFIG.minimumFee + billableDistanceKm * DELIVERY_FEE_CONFIG.perKmRate;
  const adjustedFee = distanceFee * clampDemandMultiplier(context?.demandMultiplier);

  return roundCurrency(Math.min(adjustedFee, DELIVERY_FEE_CONFIG.maximumFee));
}

export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => {
    const customizationDelta = item.customizations.reduce(
      (sum, customization) => sum + customization.priceDelta,
      0
    );
    return total + (item.basePrice + customizationDelta) * item.quantity;
  }, 0);
}

export function calculateOrderTotals(
  items: CartItem[],
  discountPercent = 0,
  pricingContext?: OrderPricingContext
) {
  const subtotal = calculateCartSubtotal(items);
  const discount = roundCurrency((subtotal * discountPercent) / 100);
  const deliveryFee = items.length > 0 ? calculateDeliveryFee(subtotal, pricingContext) : 0;
  const total = roundCurrency(subtotal - discount + deliveryFee);

  return {
    subtotal: roundCurrency(subtotal),
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
