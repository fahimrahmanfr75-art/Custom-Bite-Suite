import {
  DEFAULT_RESTAURANT_LOCATION,
  calculateDeliveryFee,
  calculateOrderTotals,
  nextOrderStatus,
  buildManagerMetrics,
} from '../src/utils/orderMath';
import { CartItem, Order } from '../src/types';

const cart: CartItem[] = [
  {
    id: '1',
    dishId: 1,
    dishName: 'Fireline Chicken Burger',
    quantity: 2,
    basePrice: 10,
    instructions: '',
    customizations: [{ ingredientId: 99, name: 'Avocado', action: 'add', priceDelta: 1.5 }],
  },
];

const orders: Order[] = [
  {
    id: 1,
    customerId: 1,
    customerName: 'Sara Ahmed',
    customerPhone: '01710000001',
    customerEmail: 'sara@example.com',
    riderId: 3,
    riderName: 'Arif Hasan',
    riderPhone: '01710000003',
    riderLatitude: 23.7,
    riderLongitude: 90.3,
    addressLine: 'House 14',
    latitude: 23.7,
    longitude: 90.3,
    deliveryNotes: '',
    status: 'delivered',
    paymentMethod: 'cod',
    paymentStatus: 'cod_collected',
    subtotal: 20,
    discount: 2,
    deliveryFee: 3.5,
    total: 21.5,
    createdAt: '2026-04-11T01:00:00.000Z',
    acceptedAt: null,
    preparingAt: null,
    readyAt: null,
    pickedUpAt: null,
    deliveredAt: null,
    rejectedAt: null,
    canceledAt: null,
    cashCollectedAt: null,
    items: [],
    refundRequest: null,
  },
  {
    id: 2,
    customerId: 1,
    customerName: 'Sara Ahmed',
    customerPhone: '01710000001',
    customerEmail: 'sara@example.com',
    riderId: 3,
    riderName: 'Arif Hasan',
    riderPhone: '01710000003',
    riderLatitude: 23.7,
    riderLongitude: 90.3,
    addressLine: 'House 14',
    latitude: 23.7,
    longitude: 90.3,
    deliveryNotes: '',
    status: 'ready',
    paymentMethod: 'cod',
    paymentStatus: 'cod_pending',
    subtotal: 12,
    discount: 0,
    deliveryFee: 3.5,
    total: 15.5,
    createdAt: '2026-04-11T02:00:00.000Z',
    acceptedAt: null,
    preparingAt: null,
    readyAt: null,
    pickedUpAt: null,
    deliveredAt: null,
    rejectedAt: null,
    canceledAt: null,
    cashCollectedAt: null,
    items: [],
    refundRequest: null,
  },
];

describe('order math', () => {
  it('calculates totals with a reduced fee for short-distance deliveries', () => {
    expect(
      calculateOrderTotals(cart, 10, {
        restaurantLocation: DEFAULT_RESTAURANT_LOCATION,
        deliveryLocation: {
          latitude: 23.7512,
          longitude: 90.391,
        },
      })
    ).toEqual({
      subtotal: 23,
      discount: 2.3,
      deliveryFee: 2,
      total: 22.7,
    });
  });

  it('raises the fee for longer-distance deliveries and honors the cap', () => {
    expect(
      calculateDeliveryFee(23, {
        restaurantLocation: DEFAULT_RESTAURANT_LOCATION,
        deliveryLocation: {
          latitude: 23.9008,
          longitude: 90.3906,
        },
      })
    ).toBe(8);
  });

  it('waives the fee for large orders after the free-delivery threshold', () => {
    expect(
      calculateDeliveryFee(50, {
        restaurantLocation: DEFAULT_RESTAURANT_LOCATION,
        deliveryLocation: {
          latitude: 23.79,
          longitude: 90.41,
        },
      })
    ).toBe(0);
  });

  it('advances order status in the expected flow', () => {
    expect(nextOrderStatus('pending')).toBe('accepted');
    expect(nextOrderStatus('ready')).toBe('on_the_way');
    expect(nextOrderStatus('delivered')).toBeNull();
  });

  it('builds manager metrics from delivered and outstanding COD orders', () => {
    expect(buildManagerMetrics(orders, '2026-04-11T03:00:00.000Z')).toEqual({
      dailyRevenue: 21.5,
      weeklyRevenue: 21.5,
      monthlyRevenue: 21.5,
      deliveredOrders: 1,
      averageOrderValue: 21.5,
      pendingRefunds: 0,
      outstandingCod: 15.5,
    });
  });
});
