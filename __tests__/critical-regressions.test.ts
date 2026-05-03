let mockDb: {
  execAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  runAsync: jest.Mock;
  withExclusiveTransactionAsync: jest.Mock;
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => {
    mockDb = {
      execAsync: jest.fn(async () => undefined),
      getAllAsync: jest.fn(async () => []),
      getFirstAsync: jest.fn(async () => null),
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
      withExclusiveTransactionAsync: jest.fn(async (callback: (txn: unknown) => Promise<void>) => {
        await callback(mockDb);
      }),
    };

    return mockDb;
  }),
}));

import { importDatabaseJson, exportDatabaseJson } from '../src/data/database';
import { advanceOrder, placeOrder } from '../src/data/orders';
import { getNotifications } from '../src/data/notifications';

describe('critical regression fixes', () => {
  beforeEach(() => {
    mockDb.execAsync.mockClear();
    mockDb.getAllAsync.mockClear();
    mockDb.getFirstAsync.mockClear();
    mockDb.runAsync.mockClear();
    mockDb.withExclusiveTransactionAsync.mockClear();
  });

  it('exports every persisted table, including session and notifications', async () => {
    mockDb.getAllAsync.mockImplementation(async (sql: string) => [{ table: sql }]);

    const exported = JSON.parse(await exportDatabaseJson()) as Record<string, unknown>;

    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM app_session');
    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM order_items');
    expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM app_notifications');
    expect(exported).toHaveProperty('users');
    expect(exported).toHaveProperty('app_session');
    expect(exported).toHaveProperty('order_items');
    expect(exported).toHaveProperty('app_notifications');
    expect(exported).toHaveProperty('exportedAt');
  });

  it('imports database json instead of throwing the dead-function error', async () => {
    await importDatabaseJson(
      JSON.stringify({
        users: [{ id: 7, role: 'customer', first_name: 'Ada' }],
        app_session: [{ id: 1, user_id: 7, role: 'customer' }],
        app_notifications: [{ id: 5, audience: 'user', recipient_user_id: 7, kind: 'order_status_changed' }],
      })
    );

    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = OFF');
    expect(mockDb.execAsync).toHaveBeenCalledWith('DELETE FROM app_notifications');
    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON');
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'INSERT INTO users (id, role, first_name) VALUES (?, ?, ?)',
      7,
      'customer',
      'Ada'
    );
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'INSERT INTO app_notifications (id, audience, recipient_user_id, kind) VALUES (?, ?, ?, ?)',
      5,
      'user',
      7,
      'order_status_changed'
    );
  });

  it('persists a manager notification when a customer places an order', async () => {
    let insertId = 100;
    mockDb.getFirstAsync.mockResolvedValue({
      id: 9,
      address_line: 'House 1',
      latitude: 23.78,
      longitude: 90.4,
    });
    mockDb.runAsync.mockImplementation(async () => ({ changes: 1, lastInsertRowId: ++insertId }));

    await placeOrder(
      9,
      [
        {
          dishId: 3,
          quantity: 2,
          basePrice: 12,
          instructions: '',
          customizations: [],
        },
      ],
      {
        deliveryNotes: 'Ring bell',
        paymentMethod: 'cod',
        latitude: 23.78,
        longitude: 90.4,
      },
      0
    );

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO app_notifications'),
      'role',
      null,
      'manager',
      101,
      'new_order',
      'New order #101',
      'A new customer order has arrived and is waiting for manager review.',
      expect.any(String)
    );
  });

  it('loads notifications from app_notifications and creates customer status updates', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      {
        id: 1,
        audience: 'user',
        recipient_user_id: 4,
        recipient_role: null,
        order_id: 88,
        kind: 'order_status_changed',
        title: 'Order #88 is Ready',
        message: 'Your order status changed to Ready.',
        is_read: 0,
        created_at: '2026-05-02T00:00:00.000Z',
      },
    ]);

    const notifications = await getNotifications({ userId: 4, role: 'customer' });
    expect(notifications).toHaveLength(1);
    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM app_notifications'),
      4,
      'customer'
    );

    mockDb.getFirstAsync.mockResolvedValueOnce({
      id: 88,
      customer_id: 4,
      status: 'accepted',
      accepted_at: null,
      preparing_at: null,
      ready_at: null,
      picked_up_at: null,
      delivered_at: null,
    });

    await advanceOrder(2, 88);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO app_notifications'),
      'user',
      4,
      null,
      88,
      'order_status_changed',
      'Order #88 is Preparing',
      'Your order status changed to Preparing.',
      expect.any(String)
    );
  });
});
