/**
 * Repository Module - Re-exports all data modules for backward compatibility
 * 
 * This file now serves as a facade that re-exports all modular data access functions.
 * The implementation has been split into the following modules:
 * - schema.ts: Database DDL and connection
 * - seed.ts: Seed data
 * - audit.ts: Audit logging
 * - auth.ts: Authentication (login, register, logout)
 * - orders.ts: Order CRUD
 * - reviews.ts: Review CRUD
 * - refunds.ts: Refund CRUD
 * - dishes.ts: Dish CRUD and menu data
 * - snapshot.ts: App snapshot building
 * - appStoreImpl.ts: App state store with sync snapshot and subscription
 */

// Schema and initialization
export { execSchema, db, SqlRunner } from './schema';
export { seedDatabase } from './seed';
import { execSchema } from './schema';
import { seedDatabase } from './seed';

// Audit
export { logAudit, getAuditLogs } from './audit';

// Auth
export { getUsers, getSession, login, logout, register } from './auth';

// Orders
export { getOrders, placeOrder, advanceOrder, assignOrderRider, confirmCash, cancelOrderByCustomer, claimOrderByRider, rejectOrder, updateRiderLocation } from './orders';

// Reviews
export { getReviews, submitReview } from './reviews';

// Refunds
export { getRefunds, submitRefund, updateRefundDecision } from './refunds';

// Dishes and Menu
export { getOffers, getCategories, getIngredientCategories, getDishes, upsertDishRecord, deleteDishRecord } from './dishes';

// Database operations
export { exportDatabaseJson, importDatabaseJson, resetDatabase } from './database';

// Notifications
export { getNotifications } from './notifications';
import {
  markAllNotificationsReadForSession as markAllNotificationsReadForSessionRecord,
  markNotificationRead as markNotificationReadRecord,
} from './notifications';

// Banners
export { getBannerImages, upsertBannerImage, removeBannerImage } from './banners';
export { CURATED_MENU_CATEGORIES, CURATED_MENU_DISHES } from './curatedMenu';
export { importCuratedContent } from './curatedImport';
export { migrationInternals as __migrationInternals } from './migrations';

// Snapshot
export { loadSnapshot } from './snapshot';

// App Store - sync snapshot and subscription
export {
  getAppStoreSnapshot,
  subscribeAppStore,
  refreshAppStore,
  resetAppStore,
  type AppStoreTopic,
} from '../state/appStoreImpl';
import { refreshAppStore, resetAppStore } from '../state/appStoreImpl';

export const __appStoreInternals = {
  resetAppStore,
};

export async function markNotificationRead(notificationId: number) {
  await markNotificationReadRecord(notificationId);
  await refreshAppStore(['notifications']);
}

export async function markAllNotificationsReadForSession(session: Parameters<typeof markAllNotificationsReadForSessionRecord>[0]) {
  await markAllNotificationsReadForSessionRecord(session);
  await refreshAppStore(['notifications']);
}

// Combined initialization
export async function initializeRepository() {
  await execSchema();
  await seedDatabase();
}
