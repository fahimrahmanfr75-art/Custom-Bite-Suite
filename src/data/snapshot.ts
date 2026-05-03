import { getUsers } from './auth';
import { getOffers, getCategories, getDishes, getIngredientCategories } from './dishes';
import { getOrders } from './orders';
import { getAuditLogs } from './audit';
import { getSession } from './auth';
import { getBannerImages } from './banners';
import type { AppSnapshot } from '../types';
import { buildManagerMetrics } from '../utils/orderMath';

function nowIso() {
  return new Date().toISOString();
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  const [users, offers, categories, dishes, orders, auditLogs, session, banners, ingredientCategories] = await Promise.all([
    getUsers(),
    getOffers(),
    getCategories(),
    getDishes(),
    getOrders(),
    getAuditLogs(),
    getSession(),
    getBannerImages(),
    getIngredientCategories(),
  ]);

  return {
    currentUser: null,
    restaurantLocation: null,
    users,
    offers,
    banners,
    categories,
    ingredientCategories,
    ingredients: [],
    dishes,
    orders,
    notifications: [],
    auditLogs,
    metrics: buildManagerMetrics(orders, nowIso()),
    session,
  };
}
