import type { NotificationKind, OrderStatus, Role } from '../types';

export function formatOrderStatusLabel(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready';
    case 'on_the_way':
      return 'On the Way';
    case 'delivered':
      return 'Delivered';
    case 'rejected':
      return 'Rejected';
    case 'canceled':
      return 'Canceled';
    default:
      return status;
  }
}

export function buildManagerNewOrderNotification(orderId: number) {
  return {
    kind: 'new_order' as NotificationKind,
    title: `New order #${orderId}`,
    message: `A new customer order has arrived and is waiting for manager review.`,
  };
}

export function buildCustomerOrderStatusNotification(orderId: number, status: OrderStatus) {
  const statusLabel = formatOrderStatusLabel(status);
  return {
    kind: 'order_status_changed' as NotificationKind,
    title: `Order #${orderId} is ${statusLabel}`,
    message: `Your order status changed to ${statusLabel}.`,
  };
}

export function shouldNotifyRoleForNewOrder(role: Role) {
  return role === 'manager';
}
