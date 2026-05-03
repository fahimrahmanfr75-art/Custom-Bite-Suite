let mockDefaultDb: {
  execAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  runAsync: jest.Mock;
  withExclusiveTransactionAsync: jest.Mock;
};

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  digestStringAsync: jest.fn(async () => 'hash'),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => {
    mockDefaultDb = {
      execAsync: jest.fn(async () => undefined),
      getAllAsync: jest.fn(async () => []),
      getFirstAsync: jest.fn(async () => null),
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
      withExclusiveTransactionAsync: jest.fn(async (callback: (txn: unknown) => Promise<void>) => {
        await callback(mockDefaultDb);
      }),
    };

    return mockDefaultDb;
  }),
}));

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => JSON.stringify({ userId: 5, role: 'customer' })),
  setItemAsync: jest.fn(async () => undefined),
}));

import {
  __appStoreInternals,
  markNotificationRead,
  refreshAppStore,
  subscribeAppStore,
} from '../src/data/repository';

describe('repository app store invalidation', () => {
  beforeEach(() => {
    mockDefaultDb.execAsync.mockClear();
    mockDefaultDb.runAsync.mockClear();
    mockDefaultDb.getFirstAsync.mockClear();
    mockDefaultDb.getAllAsync.mockClear();
    mockDefaultDb.withExclusiveTransactionAsync.mockClear();
    __appStoreInternals.resetAppStore();
  });

  it('reloads only notifications after notification reads', async () => {
    let notificationReads = 0;
    let orderReads = 0;

    (mockDefaultDb.getFirstAsync as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql.includes('FROM users')) {
        return { id: 5, role: 'customer' };
      }
      return null;
    });

    (mockDefaultDb.getAllAsync as jest.Mock).mockImplementation(async (sql: string) => {
      if (sql.includes('FROM notifications')) {
        notificationReads += 1;
        return [
          {
            id: 1,
            audience: 'user',
            recipient_user_id: 5,
            recipient_role: null,
            order_id: 9,
            kind: 'order_status_changed',
            title: 'Order updated',
            message: 'Status changed',
            is_read: notificationReads > 1 ? 1 : 0,
            created_at: '2026-04-28T00:00:00.000Z',
          },
        ];
      }

      if (sql.includes('FROM orders')) {
        orderReads += 1;
        return [];
      }

      return [];
    });

    await refreshAppStore(['notifications']);

    const notificationListener = jest.fn();
    const unsubscribe = subscribeAppStore('notifications', notificationListener);

    await markNotificationRead(1);

    expect(notificationListener).toHaveBeenCalledTimes(1);
    expect(notificationReads).toBe(2);
    expect(orderReads).toBe(0);

    unsubscribe();
  });
});
