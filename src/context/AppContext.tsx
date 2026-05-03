import React, { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import {
  advanceOrder,
  assignOrderRider,
  cancelOrderByCustomer,
  claimOrderByRider,
  confirmCash,
  deleteDishRecord,
  exportDatabaseJson,
  getAppStoreSnapshot,
  importDatabaseJson,
  initializeRepository,
  login as loginAction,
  logout as logoutAction,
  markAllNotificationsReadForSession,
  markNotificationRead,
  placeOrder as placeOrderAction,
  refreshAppStore,
  rejectOrder,
  removeBannerImage,
  register as registerAction,
  resetDatabase,
  submitRefund as submitRefundAction,
  submitReview as submitReviewAction,
  subscribeAppStore,
  updateRefundDecision as updateRefundDecisionAction,
  updateRiderLocation as updateRiderLocationAction,
  upsertBannerImage,
  upsertDishRecord,
  type AppStoreTopic,
} from '../data/repository';
import type {
  AppNotification,
  BannerPayload,
  CartItem,
  LoginPayload,
  ManagerDishPayload,
  PlaceOrderPayload,
  RegisterPayload,
  SubmitRefundPayload,
  SubmitReviewPayload,
} from '../types';
import { orderTrackingSocket } from '../services/orderTrackingSocket';
import {
  registerDeviceForPushNotificationsAsync,
  syncPushTokenWithServer,
} from '../services/pushNotifications';

type AppActionsContextValue = {
  isReady: boolean;
  isBusy: boolean;
  errorMessage: string | null;
  cart: CartItem[];
  refresh: () => Promise<void>;
  clearError: () => void;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  placeOrder: (payload: PlaceOrderPayload) => Promise<void>;
  submitRefund: (payload: SubmitRefundPayload) => Promise<void>;
  submitReview: (payload: SubmitReviewPayload) => Promise<void>;
  upsertMenuDish: (payload: ManagerDishPayload) => Promise<void>;
  removeMenuDish: (dishId: number) => Promise<void>;
  moveOrderToNextStatus: (orderId: number) => Promise<void>;
  updateRefundDecision: (
    refundId: number,
    status: 'approved' | 'denied',
    resolutionNote: string
  ) => Promise<void>;
  assignRider: (orderId: number, riderId: number) => Promise<void>;
  confirmOrderCash: (orderId: number) => Promise<void>;
  rejectCustomerOrder: (orderId: number, reason: string) => Promise<void>;
  cancelMyOrder: (orderId: number) => Promise<void>;
  claimDeliveryOrder: (orderId: number, riderLatitude: number, riderLongitude: number) => Promise<void>;
  updateRiderLocation: (orderId: number, riderLatitude: number, riderLongitude: number) => Promise<void>;
  upsertBanner: (payload: BannerPayload) => Promise<void>;
  removeBanner: (bannerId: number) => Promise<void>;
  readNotification: (notificationId: number) => Promise<void>;
  readAllNotifications: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (jsonString: string) => Promise<void>;
  resetAllData: () => Promise<void>;
};

const AppActionsContext = createContext<AppActionsContextValue | null>(null);

function getActiveDiscountPercent(offers: Array<{ activeFrom: string; activeTo: string; discountPercent: number }>) {
  const now = new Date();
  const active = offers.find((offer) => {
    const start = new Date(offer.activeFrom);
    const end = new Date(offer.activeTo);
    return now >= start && now <= end;
  });
  return active?.discountPercent ?? 0;
}

function useStoreTopic<T extends AppStoreTopic>(topic: T) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeAppStore(topic, onStoreChange),
    () => getAppStoreSnapshot(topic)
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setReady] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const sessionState = useStoreTopic('session');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await initializeRepository();
        await refreshAppStore();
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load app');
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const session = sessionState.session;
    if (!isReady || !session) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const registration = await registerDeviceForPushNotificationsAsync();
        if (cancelled || !registration.token) {
          return;
        }

        await syncPushTokenWithServer(session, registration.token);
      } catch {
        // Push setup failures should not block the app lifecycle.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, sessionState.session]);

  const wrap = async (work: () => Promise<void>) => {
    setBusy(true);
    setErrorMessage(null);

    try {
      await work();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Operation failed');
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const value = useMemo<AppActionsContextValue>(
    () => ({
      isReady,
      isBusy,
      errorMessage,
      cart,
      refresh: () => refreshAppStore(),
      clearError: () => setErrorMessage(null),
      login: (payload) => wrap(async () => {
        await loginAction(payload);
        await refreshAppStore(['session', 'notifications']);
      }),
      register: (payload) => wrap(async () => {
        await registerAction(payload);
        await refreshAppStore(['session', 'notifications']);
      }),
      logout: () =>
        wrap(async () => {
          await logoutAction();
          await refreshAppStore(['session', 'notifications']);
          setCart([]);
        }),
      addToCart: (item) => setCart((current) => [...current, item]),
      updateCartQuantity: (id, quantity) =>
        setCart((current) =>
          current
            .map((item) => (item.id === id ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0)
        ),
      removeFromCart: (id) => setCart((current) => current.filter((item) => item.id !== id)),
      clearCart: () => setCart([]),
      placeOrder: (payload) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('You must be logged in to place an order');
          }
          const activeDiscountPercent = getActiveDiscountPercent(getAppStoreSnapshot('catalog').offers);
          await placeOrderAction(session.userId, cart, payload, activeDiscountPercent);
          setCart([]);
          await refreshAppStore(['orders', 'notifications', 'metrics', 'audit']);
        }),
      submitRefund: (payload) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('You must be logged in to submit a refund');
          }
          await submitRefundAction(session.userId, payload);
          await refreshAppStore(['orders']);
        }),
      submitReview: (payload) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('You must be logged in to leave a review');
          }
          await submitReviewAction(session.userId, payload);
          await refreshAppStore(['catalog']);
        }),
      upsertMenuDish: (payload) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Manager session missing');
          }
          await upsertDishRecord(session.userId, payload);
          await refreshAppStore(['catalog']);
        }),
      removeMenuDish: (dishId) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Manager session missing');
          }
          await deleteDishRecord(session.userId, dishId);
          await refreshAppStore(['catalog']);
        }),
      moveOrderToNextStatus: (orderId) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Session missing');
          }
          await advanceOrder(session.userId, orderId);
          await refreshAppStore(['orders', 'notifications', 'metrics', 'audit']);
          const nextOrder = getAppStoreSnapshot('orders').orders.find((entry) => entry.id === orderId);
          if (nextOrder) {
            orderTrackingSocket.publishOrderStatus({
              orderId,
              status: nextOrder.status,
              riderId: nextOrder.riderId,
              riderName: nextOrder.riderName,
              riderPhone: nextOrder.riderPhone,
              riderLatitude: nextOrder.riderLatitude,
              riderLongitude: nextOrder.riderLongitude,
            });
          }
        }),
      updateRefundDecision: (refundId, status, resolutionNote) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Session missing');
          }
          await updateRefundDecisionAction(session.userId, refundId, status, resolutionNote);
          await refreshAppStore(['orders', 'metrics', 'audit']);
        }),
      assignRider: (orderId, riderId) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Session missing');
          }
          await assignOrderRider(session.userId, orderId, riderId);
          await refreshAppStore(['orders', 'audit']);
          const nextOrder = getAppStoreSnapshot('orders').orders.find((entry) => entry.id === orderId);
          if (nextOrder) {
            orderTrackingSocket.publishOrderStatus({
              orderId,
              status: nextOrder.status,
              riderId: nextOrder.riderId,
              riderName: nextOrder.riderName,
              riderPhone: nextOrder.riderPhone,
              riderLatitude: nextOrder.riderLatitude,
              riderLongitude: nextOrder.riderLongitude,
            });
          }
        }),
      confirmOrderCash: (orderId) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Session missing');
          }
          await confirmCash(session.userId, orderId);
          await refreshAppStore(['orders', 'metrics', 'audit']);
        }),
      rejectCustomerOrder: (orderId, reason) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Session missing');
          }
          await rejectOrder(session.userId, orderId, reason);
          await refreshAppStore(['orders', 'notifications', 'metrics', 'audit']);
        }),
      cancelMyOrder: (orderId) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Session missing');
          }
          await cancelOrderByCustomer(session.userId, orderId);
          await refreshAppStore(['orders', 'notifications', 'metrics', 'audit']);
        }),
      claimDeliveryOrder: (orderId, riderLatitude, riderLongitude) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Session missing');
          }
          await claimOrderByRider(session.userId, orderId, riderLatitude, riderLongitude);
          await refreshAppStore(['orders', 'audit']);
          const nextOrder = getAppStoreSnapshot('orders').orders.find((entry) => entry.id === orderId);
          if (nextOrder) {
            orderTrackingSocket.publishOrderStatus({
              orderId,
              status: nextOrder.status,
              riderId: nextOrder.riderId,
              riderName: nextOrder.riderName,
              riderPhone: nextOrder.riderPhone,
              riderLatitude: nextOrder.riderLatitude,
              riderLongitude: nextOrder.riderLongitude,
            });
          }
        }),
      updateRiderLocation: (orderId, riderLatitude, riderLongitude) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          await updateRiderLocationAction(orderId, riderLatitude, riderLongitude);
          await refreshAppStore(['orders']);
          if (session) {
            orderTrackingSocket.publishRiderLocation({
              orderId,
              riderId: session.userId,
              riderLatitude,
              riderLongitude,
            });
          }
        }),
      upsertBanner: (payload) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Session missing');
          }
          await upsertBannerImage(session.userId, payload);
          await refreshAppStore(['catalog']);
        }),
      removeBanner: (bannerId) =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Session missing');
          }
          await removeBannerImage(session.userId, bannerId);
          await refreshAppStore(['catalog']);
        }),
      readNotification: (notificationId) =>
        wrap(async () => {
          await markNotificationRead(notificationId);
          await refreshAppStore(['notifications']);
        }),
      readAllNotifications: () =>
        wrap(async () => {
          const { session } = getAppStoreSnapshot('session');
          if (!session) {
            throw new Error('Session missing');
          }
          await markAllNotificationsReadForSession(session);
          await refreshAppStore(['notifications']);
        }),
      exportData: () => exportDatabaseJson(),
      importData: (jsonString) => wrap(() => importDatabaseJson(jsonString)),
      resetAllData: () =>
        wrap(async () => {
          await resetDatabase();
          setCart([]);
          await refreshAppStore();
        }),
    }),
    [cart, errorMessage, isBusy, isReady]
  );

  return <AppActionsContext.Provider value={value}>{children}</AppActionsContext.Provider>;
}

export function useAppActions() {
  const value = useContext(AppActionsContext);
  if (!value) {
    throw new Error('App context is unavailable');
  }
  return value;
}

export function useAppStatus() {
  const { clearError, errorMessage, isBusy, isReady, refresh } = useAppActions();
  return {
    clearError,
    errorMessage,
    isBusy,
    isReady,
    refresh,
  };
}

export function useSessionState() {
  return useStoreTopic('session');
}

export function useCatalogState() {
  const catalog = useStoreTopic('catalog');

  return useMemo(
    () => ({
      ...catalog,
      activeDiscountPercent: getActiveDiscountPercent(catalog.offers),
    }),
    [catalog]
  );
}

export function useOrdersState() {
  const { orders = [] } = useStoreTopic('orders');
  return orders;
}

export function useNotificationsState() {
  const { notifications = [] } = useStoreTopic('notifications') as {
    notifications: AppNotification[];
  };

  return useMemo(
    () => ({
      notifications,
      unreadNotificationCount: notifications.filter((notification) => !notification.isRead).length,
    }),
    [notifications]
  );
}

export function useMetricsState() {
  const { metrics } = useStoreTopic('metrics');
  return metrics;
}

export function useAuditState() {
  return useStoreTopic('audit');
}

export function useApp() {
  const actions = useAppActions();
  const sessionState = useSessionState();
  const catalogState = useCatalogState();
  const orders = useOrdersState();
  const notificationState = useNotificationsState();
  const metrics = useMetricsState();
  const auditLogs = useAuditState();

  return {
    ...actions,
    ...sessionState,
    ...catalogState,
    ...notificationState,
    auditLogs,
    metrics,
    orders,
  };
}
