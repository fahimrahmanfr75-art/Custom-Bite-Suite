import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  advanceOrder,
  assignOrderRider,
  cancelOrderByCustomer,
  claimOrderByRider,
  confirmCash,
  deleteDishRecord,
  initializeRepository,
  loadSnapshot,
  login as loginAction,
  logout as logoutAction,
  placeOrder as placeOrderAction,
  rejectOrder,
  removeBannerImage,
  register as registerAction,
  submitRefund as submitRefundAction,
  submitReview as submitReviewAction,
  updateRefundDecision as updateRefundDecisionAction,
  upsertBannerImage,
  upsertDishRecord,
} from '../data/repository';
import type {
  AppSnapshot,
  BannerPayload,
  CartItem,
  LoginPayload,
  ManagerDishPayload,
  PlaceOrderPayload,
  RegisterPayload,
  SubmitRefundPayload,
  SubmitReviewPayload,
} from '../types';

type AppContextValue = AppSnapshot & {
  isReady: boolean;
  isBusy: boolean;
  errorMessage: string | null;
  cart: CartItem[];
  activeDiscountPercent: number;
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
  claimDeliveryOrder: (orderId: number) => Promise<void>;
  upsertBanner: (payload: BannerPayload) => Promise<void>;
  removeBanner: (bannerId: number) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const emptySnapshot: AppSnapshot = {
  users: [],
  offers: [],
  banners: [],
  categories: [],
  ingredientCategories: [],
  ingredients: [],
  dishes: [],
  orders: [],
  auditLogs: [],
  metrics: {
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    deliveredOrders: 0,
    averageOrderValue: 0,
    pendingRefunds: 0,
    outstandingCod: 0,
  },
  session: null,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot);
  const [isReady, setReady] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const refresh = async () => {
    const next = await loadSnapshot();
    setSnapshot(next);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initializeRepository();
        if (!mounted) {
          return;
        }
        await refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load app');
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

  const wrap = async (work: () => Promise<void>) => {
    setBusy(true);
    setErrorMessage(null);
    try {
      await work();
      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Operation failed');
      throw error;
    } finally {
      setBusy(false);
    }
  };

  const activeDiscountPercent = useMemo(() => {
    const now = new Date();
    const active = snapshot.offers.find((offer) => {
      const start = new Date(offer.activeFrom);
      const end = new Date(offer.activeTo);
      return now >= start && now <= end;
    });
    return active?.discountPercent ?? 0;
  }, [snapshot.offers]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...snapshot,
      isReady,
      isBusy,
      errorMessage,
      cart,
      activeDiscountPercent,
      refresh,
      clearError: () => setErrorMessage(null),
      login: (payload) => wrap(() => loginAction(payload)),
      register: (payload) => wrap(() => registerAction(payload)),
      logout: () =>
        wrap(async () => {
          await logoutAction();
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
          if (!snapshot.session) {
            throw new Error('You must be logged in to place an order');
          }
          await placeOrderAction(snapshot.session.userId, cart, payload, activeDiscountPercent);
          setCart([]);
        }),
      submitRefund: (payload) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('You must be logged in to submit a refund');
          }
          await submitRefundAction(snapshot.session.userId, payload);
        }),
      submitReview: (payload) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('You must be logged in to leave a review');
          }
          await submitReviewAction(snapshot.session.userId, payload);
        }),
      upsertMenuDish: (payload) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Manager session missing');
          }
          await upsertDishRecord(snapshot.session.userId, payload);
        }),
      removeMenuDish: (dishId) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Manager session missing');
          }
          await deleteDishRecord(snapshot.session.userId, dishId);
        }),
      moveOrderToNextStatus: (orderId) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Session missing');
          }
          await advanceOrder(snapshot.session.userId, orderId);
        }),
      updateRefundDecision: (refundId, status, resolutionNote) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Session missing');
          }
          await updateRefundDecisionAction(
            snapshot.session.userId,
            refundId,
            status,
            resolutionNote
          );
        }),
      assignRider: (orderId, riderId) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Session missing');
          }
          await assignOrderRider(snapshot.session.userId, orderId, riderId);
        }),
      confirmOrderCash: (orderId) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Session missing');
          }
          await confirmCash(snapshot.session.userId, orderId);
        }),
      rejectCustomerOrder: (orderId, reason) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Session missing');
          }
          await rejectOrder(snapshot.session.userId, orderId, reason);
        }),
      cancelMyOrder: (orderId) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Session missing');
          }
          await cancelOrderByCustomer(snapshot.session.userId, orderId);
        }),
      claimDeliveryOrder: (orderId) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Session missing');
          }
          await claimOrderByRider(snapshot.session.userId, orderId);
        }),
      upsertBanner: (payload) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Session missing');
          }
          await upsertBannerImage(snapshot.session.userId, payload);
        }),
      removeBanner: (bannerId) =>
        wrap(async () => {
          if (!snapshot.session) {
            throw new Error('Session missing');
          }
          await removeBannerImage(snapshot.session.userId, bannerId);
        }),
    }),
    [snapshot, isReady, isBusy, errorMessage, cart, activeDiscountPercent]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('App context is unavailable');
  }
  return value;
}
