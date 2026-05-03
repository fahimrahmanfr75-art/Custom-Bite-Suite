import { createAppStore } from './appStore';
import { getSession, getUsers } from '../data/auth';
import { getOffers, getCategories, getDishes, getIngredientCategories } from '../data/dishes';
import { getOrders } from '../data/orders';
import { getAuditLogs } from '../data/audit';
import { getBannerImages } from '../data/banners';
import { getNotifications } from '../data/notifications';
import { buildManagerMetrics } from '../utils/orderMath';
import type { Session, Offer, Category, Dish, Order, AuditLog, DashboardMetrics, CurrentUserProfile, BannerImage, IngredientCategory, RestaurantLocation, AppNotification } from '../types';

export type AppStoreTopic = 'session' | 'catalog' | 'orders' | 'notifications' | 'audit' | 'metrics';

type SessionSnapshot = { session: Session | null; currentUser: CurrentUserProfile | null };
type CatalogSnapshot = { offers: Offer[]; categories: Category[]; dishes: Dish[]; banners: BannerImage[]; ingredientCategories: IngredientCategory[]; restaurantLocation: RestaurantLocation | null };
type OrdersSnapshot = { orders: Order[] };
type NotificationsSnapshot = { notifications: AppNotification[] };
type AuditSnapshot = { auditLogs: AuditLog[] };
type MetricsSnapshot = { metrics: DashboardMetrics };

type TopicSnapshotMap = {
  session: SessionSnapshot;
  catalog: CatalogSnapshot;
  orders: OrdersSnapshot;
  notifications: NotificationsSnapshot;
  audit: AuditSnapshot;
  metrics: MetricsSnapshot;
};

function getInitialSnapshot<T extends AppStoreTopic>(topic: T): TopicSnapshotMap[T] {
  switch (topic) {
    case 'session':
      return { session: null, currentUser: null } as TopicSnapshotMap[T];
    case 'catalog':
      return { offers: [], categories: [], dishes: [], banners: [], ingredientCategories: [], restaurantLocation: null } as unknown as TopicSnapshotMap[T];
    case 'orders':
      return { orders: [] } as unknown as TopicSnapshotMap[T];
    case 'notifications':
      return { notifications: [] } as unknown as TopicSnapshotMap[T];
    case 'audit':
      return { auditLogs: [] } as unknown as TopicSnapshotMap[T];
    case 'metrics':
      return { metrics: { dailyRevenue: 0, weeklyRevenue: 0, monthlyRevenue: 0, deliveredOrders: 0, averageOrderValue: 0, pendingRefunds: 0, outstandingCod: 0 } } as unknown as TopicSnapshotMap[T];
  }
}

async function loadTopicSnapshot(
  topic: AppStoreTopic,
  helpers: { getSnapshot: <T extends AppStoreTopic>(topic: T) => TopicSnapshotMap[T] }
): Promise<TopicSnapshotMap[AppStoreTopic]> {
  switch (topic) {
    case 'session': {
      const session = await getSession();
      let currentUser: CurrentUserProfile | null = null;
      if (session) {
        const users = await getUsers();
        const found = users.find((u) => u.id === session.userId);
        if (found) {
          currentUser = found;
        }
      }
      return { session, currentUser } as TopicSnapshotMap[AppStoreTopic];
    }
    case 'catalog': {
      const [offers, categories, dishes, banners, ingredientCategories] = await Promise.all([
        getOffers(),
        getCategories(),
        getDishes(),
        getBannerImages(),
        getIngredientCategories(),
      ]);
      return { offers, categories, dishes, banners, ingredientCategories, restaurantLocation: null } as TopicSnapshotMap[AppStoreTopic];
    }
    case 'orders': {
      const orders = await getOrders();
      return { orders } as TopicSnapshotMap[AppStoreTopic];
    }
    case 'notifications':
      return {
        notifications: helpers.getSnapshot('session').session
          ? await getNotifications(helpers.getSnapshot('session').session as Session)
          : [],
      } as TopicSnapshotMap[AppStoreTopic];
    case 'audit': {
      const auditLogs = await getAuditLogs();
      return { auditLogs } as TopicSnapshotMap[AppStoreTopic];
    }
    case 'metrics': {
      const orders = await getOrders();
      const metrics = buildManagerMetrics(orders, new Date().toISOString());
      return { metrics } as TopicSnapshotMap[AppStoreTopic];
    }
  }
}

const dependencies: Partial<Record<AppStoreTopic, AppStoreTopic[]>> = {
  session: [],
  catalog: [],
  orders: [],
  notifications: ['session'],
  audit: ['session', 'orders'],
  metrics: ['orders'],
};

const appStore = createAppStore<AppStoreTopic, TopicSnapshotMap>({
  dependencies,
  getInitialSnapshot,
  loadSnapshot: loadTopicSnapshot,
});

export function getAppStoreSnapshot<T extends AppStoreTopic>(topic: T): TopicSnapshotMap[T] {
  return appStore.getSnapshot(topic);
}

export function subscribeAppStore<T extends AppStoreTopic>(
  topic: T,
  listener: () => void
): () => void {
  return appStore.subscribe(topic, listener);
}

export async function refreshAppStore(topics?: AppStoreTopic[]): Promise<void> {
  const topicsToRefresh = topics ?? (['session', 'catalog', 'orders', 'notifications', 'audit', 'metrics'] as AppStoreTopic[]);
  await appStore.refresh(topicsToRefresh);
}

export function resetAppStore(): void {
  appStore.reset();
}
