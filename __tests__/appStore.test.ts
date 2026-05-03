import { createAppStore } from '../src/state/appStore';

type Topic = 'session' | 'notifications' | 'orders';

type SnapshotMap = {
  notifications: string[];
  orders: string[];
  session: { userId: number | null };
};

describe('appStore', () => {
  it('loads dependencies before dependent topics', async () => {
    const loadOrder: Topic[] = [];

    const store = createAppStore<Topic, SnapshotMap>({
      dependencies: {
        notifications: ['session'],
      },
      getInitialSnapshot(topic) {
        switch (topic) {
          case 'session':
            return { userId: null };
          case 'notifications':
            return [];
          case 'orders':
            return [];
        }
      },
      async loadSnapshot(topic, helpers) {
        loadOrder.push(topic);
        if (topic === 'session') {
          return { userId: 7 };
        }
        if (topic === 'notifications') {
          return [`for-${helpers.getSnapshot('session').userId}`];
        }
        return ['order-1'];
      },
    });

    await store.refresh(['notifications']);

    expect(loadOrder).toEqual(['session', 'notifications']);
    expect(store.getSnapshot('notifications')).toEqual(['for-7']);
  });

  it('notifies only listeners for refreshed topics', async () => {
    const store = createAppStore<Topic, SnapshotMap>({
      getInitialSnapshot(topic) {
        switch (topic) {
          case 'session':
            return { userId: null };
          case 'notifications':
            return [];
          case 'orders':
            return [];
        }
      },
      async loadSnapshot(topic) {
        if (topic === 'session') {
          return { userId: 3 };
        }
        if (topic === 'notifications') {
          return ['n1'];
        }
        return ['order-2'];
      },
    });

    const sessionListener = jest.fn();
    const ordersListener = jest.fn();

    const offSession = store.subscribe('session', sessionListener);
    const offOrders = store.subscribe('orders', ordersListener);

    await store.refresh(['orders']);

    expect(ordersListener).toHaveBeenCalledTimes(1);
    expect(sessionListener).not.toHaveBeenCalled();

    offSession();
    offOrders();
  });
});
