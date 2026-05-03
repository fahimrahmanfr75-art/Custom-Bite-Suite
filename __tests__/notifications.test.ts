import {
  buildCustomerOrderStatusNotification,
  buildManagerNewOrderNotification,
  formatOrderStatusLabel,
  shouldNotifyRoleForNewOrder,
} from '../src/utils/notifications';

describe('notification helpers', () => {
  it('builds the manager alert for a new order', () => {
    expect(buildManagerNewOrderNotification(42)).toEqual({
      kind: 'new_order',
      title: 'New order #42',
      message: 'A new customer order has arrived and is waiting for manager review.',
    });
  });

  it('builds the customer alert for status changes', () => {
    expect(buildCustomerOrderStatusNotification(9, 'on_the_way')).toEqual({
      kind: 'order_status_changed',
      title: 'Order #9 is On the Way',
      message: 'Your order status changed to On the Way.',
    });
  });

  it('formats persisted order statuses for notification copy', () => {
    expect(formatOrderStatusLabel('ready')).toBe('Ready');
    expect(formatOrderStatusLabel('on_the_way')).toBe('On the Way');
    expect(formatOrderStatusLabel('canceled')).toBe('Canceled');
  });

  it('targets managers and suppresses rider availability notifications', () => {
    expect(shouldNotifyRoleForNewOrder('manager')).toBe(true);
    expect(shouldNotifyRoleForNewOrder('customer')).toBe(false);
    expect(shouldNotifyRoleForNewOrder('rider')).toBe(false);
  });
});
