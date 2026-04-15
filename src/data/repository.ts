import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

import type {
  AppSnapshot,
  AuditLog,
  BannerImage,
  BannerPayload,
  Category,
  Dish,
  DishIngredient,
  IngredientAction,
  Ingredient,
  IngredientCategory,
  LoginPayload,
  ManagerDishPayload,
  Offer,
  Order,
  OrderItem,
  OrderItemCustomization,
  OrderItemIngredientSnapshot,
  PaymentMethod,
  PaymentStatus,
  PlaceOrderPayload,
  RefundRequest,
  RegisterPayload,
  Review,
  Role,
  Session,
  SubmitRefundPayload,
  SubmitReviewPayload,
  User,
} from '../types';
import { buildManagerMetrics, calculateOrderTotals, nextOrderStatus } from '../utils/orderMath';
import { validateLogin, validateRegistration } from '../utils/validation';
import {
  CURATED_BANNERS,
  CURATED_MENU_CATEGORIES,
  CURATED_MENU_DISHES,
  CURATED_OFFERS,
  LEGACY_SAMPLE_DISH_NAMES,
  type CuratedDishInput,
} from './curatedMenu';

const db = SQLite.openDatabaseSync('custom_bite_suite.db');

type SqlRunner = Pick<
  SQLite.SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getFirstAsync' | 'getAllAsync'
>;

type UserRow = {
  id: number;
  role: Role;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  date_of_birth: string;
  password_hash: string;
  address_line: string;
  latitude: number;
  longitude: number;
  notes: string;
  created_at: string;
};

type CategoryRow = {
  id: number;
  name: string;
  description: string;
  sort_order: number;
};

type DishRow = {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  description: string;
  price: number;
  prep_time_minutes: number;
  calories: number;
  spice_level: string;
  is_available: number;
  image_url: string;
  average_rating: number | null;
  review_count: number;
};

type DishIngredientRow = {
  id: number;
  dish_id: number;
  ingredient_id: number;
  ingredient_category_id: number;
  ingredient_category_name: string;
  ingredient_name: string;
  is_mandatory: number;
  is_default: number;
  extra_price: number;
  can_add: number;
  can_remove: number;
  sort_order: number;
};

type IngredientCategoryRow = {
  id: number;
  dish_id: number;
  name: string;
  description: string;
  sort_order: number;
};

type BannerImageRow = {
  id: number;
  image_url: string;
  title: string;
  description: string;
  is_active: number;
  sort_order: number;
  created_at: string;
};

type ReviewRow = {
  id: number;
  dish_id: number;
  customer_id: number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

type OrderRow = {
  id: number;
  customer_id: number;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  rider_id: number | null;
  rider_name: string | null;
  rider_phone: string | null;
  rider_latitude: number | null;
  rider_longitude: number | null;
  address_line: string;
  latitude: number;
  longitude: number;
  delivery_notes: string;
  status: Order['status'];
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  accepted_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  rejected_at: string | null;
  canceled_at: string | null;
  cash_collected_at: string | null;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  dish_id: number;
  dish_name: string;
  quantity: number;
  unit_price: number;
  instructions: string;
};

type CustomizationRow = {
  order_item_id: number;
  ingredient_id: number;
  ingredient_name: string;
  action: 'add' | 'remove';
  price_delta: number;
};

type OrderItemIngredientSnapshotRow = {
  order_item_id: number;
  ingredient_id: number;
  ingredient_name_snapshot: string;
  ingredient_category_name_snapshot: string;
  ingredient_price_snapshot: number;
};

type RefundRow = {
  id: number;
  order_id: number;
  customer_id: number;
  reason: string;
  details: string;
  status: RefundRequest['status'];
  resolution_note: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
};

type AuditRow = {
  id: number;
  actor_user_id: number;
  actor_name: string;
  actor_role: Role;
  entity_type: string;
  entity_id: number;
  action: string;
  details: string;
  created_at: string;
};

function nowIso() {
  return new Date().toISOString();
}

async function hashPassword(value: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

async function countRows(table: string) {
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM ${table}`);
  return row?.count ?? 0;
}

async function logAudit(
  runner: SqlRunner,
  actorUserId: number,
  entityType: string,
  entityId: number,
  action: string,
  details: string
) {
  await runner.runAsync(
    `INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    actorUserId,
    entityType,
    entityId,
    action,
    details,
    nowIso()
  );
}

async function migrateSchema() {
  try {
    // Check if dish_ingredients table exists and has the old schema
    try {
      const tableInfo = await db.getAllAsync<{ name: string }>(
        `PRAGMA table_info(dish_ingredients)`
      );
      const columnNames = tableInfo.map((col) => col.name);

      // Check if we need to migrate - if the new columns don't exist
      if (!columnNames.includes('ingredient_category_id')) {
        // Drop old tables in dependency order (drop dependent tables first)
        await db.execAsync(`
          DROP TABLE IF EXISTS refund_requests;
          DROP TABLE IF EXISTS order_item_ingredients;
          DROP TABLE IF EXISTS order_item_customizations;
          DROP TABLE IF EXISTS order_items;
          DROP TABLE IF EXISTS orders;
          DROP TABLE IF EXISTS audit_logs;
          DROP TABLE IF EXISTS reviews;
          DROP TABLE IF EXISTS dish_ingredients;
          DROP TABLE IF EXISTS ingredients;
          DROP TABLE IF EXISTS ingredient_categories;
          DROP TABLE IF EXISTS banner_images;
          DROP TABLE IF EXISTS offers;
          DROP TABLE IF EXISTS dishes;
          DROP TABLE IF EXISTS categories;
        `);
      }
    } catch {
      // PRAGMA table_info failed because table doesn't exist, which is fine
      // Tables will be created by execSchema()
    }
  } catch (e) {
    console.warn('Schema migration check failed (non-fatal):', e);
    // Migration check failed but we'll let execSchema handle it
  }
}

async function getTableColumnNames(tableName: string) {
  try {
    const tableInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
    return tableInfo.map((column) => column.name);
  } catch {
    return [] as string[];
  }
}

async function rebuildIngredientsTableIfNeeded() {
  const columnNames = await getTableColumnNames('ingredients');
  if (columnNames.length === 0 || !columnNames.includes('is_allergen')) {
    return;
  }

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(`PRAGMA foreign_keys = OFF;`);
    await txn.execAsync(`
      CREATE TABLE IF NOT EXISTS ingredients_next (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      INSERT INTO ingredients_next (id, name)
      SELECT id, name
      FROM ingredients;

      DROP TABLE ingredients;
      ALTER TABLE ingredients_next RENAME TO ingredients;
    `);
    await txn.execAsync(`PRAGMA foreign_keys = ON;`);
  });
}

async function rebuildOrdersTableIfNeeded() {
  const columnNames = await getTableColumnNames('orders');
  if (columnNames.length === 0) {
    return;
  }

  const needsRebuild =
    !columnNames.includes('rejected_at') ||
    !columnNames.includes('canceled_at') ||
    columnNames.includes('cancelled_at');

  if (!needsRebuild) {
    return;
  }

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(`
      CREATE TABLE IF NOT EXISTS orders_next (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        customer_email TEXT NOT NULL DEFAULT '',
        rider_id INTEGER,
        rider_latitude REAL,
        rider_longitude REAL,
        address_line TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        delivery_notes TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'preparing', 'ready', 'on_the_way', 'delivered', 'rejected', 'canceled')),
        payment_method TEXT NOT NULL CHECK(payment_method IN ('card', 'cod')),
        payment_status TEXT NOT NULL CHECK(payment_status IN ('paid', 'cod_pending', 'cod_collected')),
        subtotal REAL NOT NULL,
        discount REAL NOT NULL,
        delivery_fee REAL NOT NULL,
        total REAL NOT NULL,
        created_at TEXT NOT NULL,
        accepted_at TEXT,
        preparing_at TEXT,
        ready_at TEXT,
        picked_up_at TEXT,
        delivered_at TEXT,
        rejected_at TEXT,
        canceled_at TEXT,
        cash_collected_at TEXT,
        FOREIGN KEY(customer_id) REFERENCES users(id),
        FOREIGN KEY(rider_id) REFERENCES users(id)
      );
    `);

    const legacyCancelledColumn = columnNames.includes('cancelled_at') ? 'cancelled_at' : 'NULL';

    await txn.execAsync(`
      INSERT INTO orders_next (
        id, customer_id, customer_email, rider_id, rider_latitude, rider_longitude,
        address_line, latitude, longitude, delivery_notes, status, payment_method,
        payment_status, subtotal, discount, delivery_fee, total, created_at,
        accepted_at, preparing_at, ready_at, picked_up_at, delivered_at,
        rejected_at, canceled_at, cash_collected_at
      )
      SELECT
        o.id,
        o.customer_id,
        o.customer_email,
        o.rider_id,
        o.rider_latitude,
        o.rider_longitude,
        o.address_line,
        o.latitude,
        o.longitude,
        o.delivery_notes,
        CASE
          WHEN o.status = 'cancelled' AND EXISTS (
            SELECT 1 FROM audit_logs a
            WHERE a.entity_type = 'order' AND a.entity_id = o.id AND a.action = 'rejected'
          ) THEN 'rejected'
          WHEN o.status = 'cancelled' THEN 'canceled'
          ELSE o.status
        END,
        o.payment_method,
        o.payment_status,
        o.subtotal,
        o.discount,
        o.delivery_fee,
        o.total,
        o.created_at,
        o.accepted_at,
        o.preparing_at,
        o.ready_at,
        o.picked_up_at,
        o.delivered_at,
        CASE
          WHEN o.status = 'cancelled' AND EXISTS (
            SELECT 1 FROM audit_logs a
            WHERE a.entity_type = 'order' AND a.entity_id = o.id AND a.action = 'rejected'
          ) THEN COALESCE(${legacyCancelledColumn}, o.created_at)
          ELSE NULL
        END,
        CASE
          WHEN o.status = 'cancelled' AND NOT EXISTS (
            SELECT 1 FROM audit_logs a
            WHERE a.entity_type = 'order' AND a.entity_id = o.id AND a.action = 'rejected'
          ) THEN COALESCE(${legacyCancelledColumn}, o.created_at)
          ELSE NULL
        END,
        o.cash_collected_at
      FROM orders o;

      DROP TABLE orders;
      ALTER TABLE orders_next RENAME TO orders;
    `);
  });
}

async function execSchema() {
  // Run migration first to handle schema updates
  await migrateSchema();
  await rebuildIngredientsTableIfNeeded();
  await rebuildOrdersTableIfNeeded();

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK(role IN ('customer', 'manager', 'rider')),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL UNIQUE,
      date_of_birth TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      address_line TEXT NOT NULL,
      latitude REAL NOT NULL DEFAULT 23.8103,
      longitude REAL NOT NULL DEFAULT 90.4125,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_session (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      user_id INTEGER,
      role TEXT,
      last_login_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      prep_time_minutes INTEGER NOT NULL,
      calories INTEGER NOT NULL,
      spice_level TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      image_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS ingredient_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dish_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
      UNIQUE(dish_id, name)
    );

    CREATE TABLE IF NOT EXISTS dish_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dish_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      ingredient_category_id INTEGER NOT NULL,
      is_mandatory INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      extra_price REAL NOT NULL DEFAULT 0,
      can_add INTEGER NOT NULL DEFAULT 1,
      can_remove INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE(dish_id, ingredient_id),
      FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
      FOREIGN KEY(ingredient_id) REFERENCES ingredients(id),
      FOREIGN KEY(ingredient_category_id) REFERENCES ingredient_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      discount_percent REAL NOT NULL,
      active_from TEXT NOT NULL,
      active_to TEXT NOT NULL,
      banner_color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banner_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      customer_email TEXT NOT NULL DEFAULT '',
      rider_id INTEGER,
      rider_latitude REAL,
      rider_longitude REAL,
      address_line TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      delivery_notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'preparing', 'ready', 'on_the_way', 'delivered', 'rejected', 'canceled')),
      payment_method TEXT NOT NULL CHECK(payment_method IN ('card', 'cod')),
      payment_status TEXT NOT NULL CHECK(payment_status IN ('paid', 'cod_pending', 'cod_collected')),
      subtotal REAL NOT NULL,
      discount REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      total REAL NOT NULL,
      created_at TEXT NOT NULL,
      accepted_at TEXT,
      preparing_at TEXT,
      ready_at TEXT,
      picked_up_at TEXT,
      delivered_at TEXT,
      rejected_at TEXT,
      canceled_at TEXT,
      cash_collected_at TEXT,
      FOREIGN KEY(customer_id) REFERENCES users(id),
      FOREIGN KEY(rider_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      dish_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      instructions TEXT NOT NULL DEFAULT '',
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY(dish_id) REFERENCES dishes(id)
    );

    CREATE TABLE IF NOT EXISTS order_item_customizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_item_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('add', 'remove')),
      price_delta REAL NOT NULL DEFAULT 0,
      FOREIGN KEY(order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
      FOREIGN KEY(ingredient_id) REFERENCES ingredients(id)
    );

    CREATE TABLE IF NOT EXISTS order_item_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_item_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      ingredient_name_snapshot TEXT NOT NULL,
      ingredient_category_name_snapshot TEXT NOT NULL,
      ingredient_price_snapshot REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
      FOREIGN KEY(ingredient_id) REFERENCES ingredients(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dish_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(dish_id, customer_id),
      FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
      FOREIGN KEY(customer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS refund_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('requested', 'approved', 'denied')),
      resolution_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by INTEGER,
      FOREIGN KEY(order_id) REFERENCES orders(id),
      FOREIGN KEY(customer_id) REFERENCES users(id),
      FOREIGN KEY(reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(actor_user_id) REFERENCES users(id)
    );
  `);
}

type SnapshotIngredientSourceRow = {
  dish_id: number;
  ingredient_id: number;
  ingredient_name: string;
  ingredient_category_name: string;
  is_mandatory: number;
  is_default: number;
  extra_price: number;
};

function buildSelectedIngredientSnapshots(
  ingredientRows: SnapshotIngredientSourceRow[],
  customizations: OrderItemCustomization[]
): OrderItemIngredientSnapshot[] {
  const customizationMap = customizations.reduce<Record<number, IngredientAction>>((acc, item) => {
    acc[item.ingredientId] = item.action;
    return acc;
  }, {});

  return ingredientRows
    .filter((row) => {
      if (row.is_mandatory) {
        return true;
      }
      const action = customizationMap[row.ingredient_id];
      if (row.is_default) {
        return action !== 'remove';
      }
      return action === 'add';
    })
    .map<OrderItemIngredientSnapshot>((row) => ({
      ingredientId: row.ingredient_id,
      ingredientName: row.ingredient_name,
      ingredientCategoryName: row.ingredient_category_name,
      price: row.extra_price,
    }));
}

async function writeOrderItemIngredientSnapshots(
  runner: SqlRunner,
  orderItemId: number,
  ingredientSnapshots: OrderItemIngredientSnapshot[]
) {
  for (const ingredient of ingredientSnapshots) {
    await runner.runAsync(
      `INSERT INTO order_item_ingredients
        (order_item_id, ingredient_id, ingredient_name_snapshot, ingredient_category_name_snapshot, ingredient_price_snapshot, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      orderItemId,
      ingredient.ingredientId,
      ingredient.ingredientName,
      ingredient.ingredientCategoryName,
      ingredient.price,
      nowIso()
    );
  }
}

async function ensureIngredientRecord(
  runner: SqlRunner,
  name: string
) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Ingredient name is required');
  }

  const existing = await runner.getFirstAsync<{ id: number }>(
    `SELECT id FROM ingredients WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    trimmedName
  );

  if (existing) {
    return existing.id;
  }

  const result = await runner.runAsync(`INSERT INTO ingredients (name) VALUES (?)`, trimmedName);

  return Number(result.lastInsertRowId);
}

async function ensureCategoryRecord(
  runner: SqlRunner,
  name: string,
  description: string,
  sortOrder: number
) {
  const existing = await runner.getFirstAsync<{ id: number }>(
    `SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    name.trim()
  );

  if (existing) {
    await runner.runAsync(
      `UPDATE categories SET description = ?, sort_order = ? WHERE id = ?`,
      description.trim(),
      sortOrder,
      existing.id
    );
    return existing.id;
  }

  const result = await runner.runAsync(
    `INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)`,
    name.trim(),
    description.trim(),
    sortOrder
  );

  return Number(result.lastInsertRowId);
}

async function upsertCuratedDishRecord(
  runner: SqlRunner,
  dish: CuratedDishInput,
  categoryId: number,
  createdAt: string
) {
  const existing = await runner.getFirstAsync<{ id: number; created_at: string }>(
    `SELECT id, created_at FROM dishes WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    dish.name
  );

  if (existing) {
    await runner.runAsync(
      `UPDATE dishes
       SET category_id = ?, description = ?, price = ?, prep_time_minutes = ?, calories = ?,
           spice_level = ?, is_available = 1, image_url = ?
       WHERE id = ?`,
      categoryId,
      dish.description,
      dish.price,
      dish.prepTimeMinutes,
      dish.calories,
      dish.spiceLevel,
      dish.imageUrl,
      existing.id
    );
    return existing.id;
  }

  const result = await runner.runAsync(
    `INSERT INTO dishes
      (category_id, name, description, price, prep_time_minutes, calories, spice_level, is_available, image_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    categoryId,
    dish.name,
    dish.description,
    dish.price,
    dish.prepTimeMinutes,
    dish.calories,
    dish.spiceLevel,
    dish.imageUrl,
    createdAt
  );

  return Number(result.lastInsertRowId);
}

async function replaceDishIngredients(
  runner: SqlRunner,
  dishId: number,
  ingredientCategories: CuratedDishInput['ingredientCategories']
) {
  await runner.runAsync(`DELETE FROM ingredient_categories WHERE dish_id = ?`, dishId);

  for (let categoryIndex = 0; categoryIndex < ingredientCategories.length; categoryIndex += 1) {
    const category = ingredientCategories[categoryIndex];
    const categoryResult = await runner.runAsync(
      `INSERT INTO ingredient_categories (dish_id, name, description, sort_order)
       VALUES (?, ?, ?, ?)`,
      dishId,
      category.name,
      category.description,
      categoryIndex
    );

    const ingredientCategoryId = Number(categoryResult.lastInsertRowId);

    for (let ingredientIndex = 0; ingredientIndex < category.ingredients.length; ingredientIndex += 1) {
      const item = category.ingredients[ingredientIndex];
      const ingredientId = await ensureIngredientRecord(runner, item.name);
      const isMandatory = item.isMandatory ?? false;
      const isDefault = item.isDefault ?? false;

      await runner.runAsync(
        `INSERT INTO dish_ingredients
          (dish_id, ingredient_id, ingredient_category_id, is_mandatory, is_default, extra_price, can_add, can_remove, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        dishId,
        ingredientId,
        ingredientCategoryId,
        isMandatory ? 1 : 0,
        isDefault ? 1 : 0,
        item.extraPrice ?? 0,
        isMandatory ? 0 : 1,
        isMandatory ? 0 : 1,
        ingredientIndex
      );
    }
  }
}

async function syncCuratedRestaurantMenu() {
  const syncedAt = nowIso();

  await db.withExclusiveTransactionAsync(async (txn) => {
    const legacyPlaceholders = LEGACY_SAMPLE_DISH_NAMES.map(() => '?').join(', ');
    const curatedPlaceholders = CURATED_MENU_DISHES.map(() => '?').join(', ');
    const legacyVisible = await txn.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM dishes
       WHERE is_available = 1
         AND LOWER(name) IN (${legacyPlaceholders})`,
      ...LEGACY_SAMPLE_DISH_NAMES.map((name) => name.toLowerCase())
    );
    const curatedVisible = await txn.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM dishes
       WHERE is_available = 1
         AND LOWER(name) IN (${curatedPlaceholders})`,
      ...CURATED_MENU_DISHES.map((dish) => dish.name.toLowerCase())
    );

    if (
      (legacyVisible?.count ?? 0) === 0 &&
      (curatedVisible?.count ?? 0) === CURATED_MENU_DISHES.length
    ) {
      return;
    }

    for (const category of CURATED_MENU_CATEGORIES) {
      await ensureCategoryRecord(txn, category.name, category.description, category.sortOrder);
    }

    const categoryIdMap = new Map<string, number>();
    const categoryRows = await txn.getAllAsync<{ id: number; name: string }>(
      `SELECT id, name FROM categories`
    );
    categoryRows.forEach((row) => categoryIdMap.set(row.name, row.id));

    for (const dishName of LEGACY_SAMPLE_DISH_NAMES) {
      await txn.runAsync(`UPDATE dishes SET is_available = 0 WHERE LOWER(name) = LOWER(?)`, dishName);
    }

    for (const dish of CURATED_MENU_DISHES) {
      const categoryId = categoryIdMap.get(dish.categoryName);
      if (!categoryId) {
        throw new Error(`Missing category for curated dish: ${dish.categoryName}`);
      }

      const dishId = await upsertCuratedDishRecord(txn, dish, categoryId, syncedAt);
      await replaceDishIngredients(txn, dishId, dish.ingredientCategories);
    }

    await txn.execAsync(`
      DELETE FROM banner_images;
      DELETE FROM offers;
    `);

    for (const banner of CURATED_BANNERS) {
      await txn.runAsync(
        `INSERT INTO banner_images (image_url, title, description, is_active, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        banner.imageUrl,
        banner.title,
        banner.description,
        banner.isActive ? 1 : 0,
        banner.sortOrder,
        syncedAt
      );
    }

    for (const offer of CURATED_OFFERS) {
      await txn.runAsync(
        `INSERT INTO offers (title, description, discount_percent, active_from, active_to, banner_color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        offer.title,
        offer.description,
        offer.discountPercent,
        offer.activeFrom,
        offer.activeTo,
        offer.bannerColor
      );
    }
  });
}

async function backfillOrderItemIngredientSnapshots() {
  const snapshotCount = await countRows('order_item_ingredients');
  if (snapshotCount > 0) {
    return;
  }

  const [itemRows, ingredientRows, customizationRows] = await Promise.all([
    db.getAllAsync<{ id: number; dish_id: number }>(`SELECT id, dish_id FROM order_items ORDER BY id`),
    db.getAllAsync<SnapshotIngredientSourceRow>(
      `SELECT
         di.dish_id,
         di.ingredient_id,
         i.name AS ingredient_name,
         ic.name AS ingredient_category_name,
         di.is_mandatory,
         di.is_default,
         di.extra_price
       FROM dish_ingredients di
       JOIN ingredients i ON i.id = di.ingredient_id
       JOIN ingredient_categories ic ON ic.id = di.ingredient_category_id
       ORDER BY di.dish_id, ic.sort_order, di.sort_order, di.id`
    ),
    db.getAllAsync<CustomizationRow>(
      `SELECT
         order_item_id,
         ingredient_id,
         '' AS ingredient_name,
         action,
         price_delta
       FROM order_item_customizations`
    ),
  ]);

  if (itemRows.length === 0) {
    return;
  }

  const ingredientMap = ingredientRows.reduce<Record<number, SnapshotIngredientSourceRow[]>>((acc, row) => {
    const current = acc[row.dish_id] ?? [];
    current.push(row);
    acc[row.dish_id] = current;
    return acc;
  }, {});

  const customizationMap = customizationRows.reduce<Record<number, OrderItemCustomization[]>>((acc, row) => {
    const current = acc[row.order_item_id] ?? [];
    current.push({
      ingredientId: row.ingredient_id,
      name: row.ingredient_name,
      action: row.action,
      priceDelta: row.price_delta,
    });
    acc[row.order_item_id] = current;
    return acc;
  }, {});

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const item of itemRows) {
      const snapshots = buildSelectedIngredientSnapshots(
        ingredientMap[item.dish_id] ?? [],
        customizationMap[item.id] ?? []
      );
      await writeOrderItemIngredientSnapshots(txn, item.id, snapshots);
    }
  });
}

async function seedDatabase() {
  const existingUsers = await countRows('users');
  if (existingUsers > 0) {
    return;
  }

  const [customerHash, managerHash, riderHash] = await Promise.all([
    hashPassword('Customer123'),
    hashPassword('Manager123'),
    hashPassword('Rider123'),
  ]);

  const seededAt = nowIso();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT INTO users
        (role, first_name, last_name, username, email, phone, date_of_birth, password_hash, address_line, latitude, longitude, notes, created_at)
       VALUES
        ('customer', 'Sara', 'Ahmed', 'sara', 'sara@custombite.app', '01710000001', '1998-05-14', ?, 'House 14, Dhanmondi, Dhaka', 23.7465, 90.3760, 'Ring the blue gate bell.', ?),
        ('manager', 'Nadia', 'Rahman', 'manager', 'manager@custombite.app', '01710000002', '1991-08-10', ?, 'Custom-Bite Kitchen HQ', 23.7508, 90.3906, 'Manager control room', ?),
        ('rider', 'Arif', 'Hasan', 'rider1', 'rider@custombite.app', '01710000003', '1996-11-23', ?, 'Rider Bay, Mirpur', 23.8069, 90.3687, 'Primary rider', ?)`,
      customerHash,
      seededAt,
      managerHash,
      seededAt,
      riderHash,
      seededAt
    );

    await txn.execAsync(`
      INSERT INTO categories (name, description, sort_order) VALUES
      ('Signature Burgers', 'High-protein burgers with ingredient transparency.', 1),
      ('Rice Bowls', 'Balanced bowls for lunch and dinner.', 2),
      ('Sides', 'Quick add-ons and snacks.', 3),
      ('Drinks', 'Fresh beverages and shakes.', 4);

      INSERT INTO ingredients (name) VALUES
      ('Brioche Bun'),
      ('Chicken Patty'),
      ('Beef Patty'),
      ('Lettuce'),
      ('Tomato'),
      ('Cheddar'),
      ('Caramelized Onion'),
      ('Jalapeno'),
      ('Garlic Mayo'),
      ('Basmati Rice'),
      ('Grilled Chicken'),
      ('Cucumber'),
      ('House Pickle'),
      ('Loaded Fries'),
      ('Cola'),
      ('Greek Yogurt Sauce'),
      ('Avocado');
    `);

    // Create ingredient categories for all dishes
    await txn.execAsync(`
      INSERT INTO ingredient_categories (dish_id, name, description, sort_order) VALUES
      (1, 'Bases', 'Choose your base', 1),
      (1, 'Toppings', 'Add or remove toppings', 2),
      (1, 'Sauces', 'Choose your sauce', 3),
      (2, 'Bases', 'Choose your base', 1),
      (2, 'Toppings', 'Add or remove toppings', 2),
      (2, 'Add-ons', 'Extra items', 3),
      (3, 'Bases', 'Rice base', 1),
      (3, 'Proteins', 'Protein selection', 2),
      (3, 'Vegetables', 'Fresh vegetables', 3),
      (3, 'Sauce', 'Dressing', 4),
      (4, 'Extras', 'Add extra toppings', 1),
      (5, 'Base', 'Beverage base', 1);
    `);;

    await txn.runAsync(
      `INSERT INTO dishes
        (category_id, name, description, price, prep_time_minutes, calories, spice_level, is_available, image_url, created_at)
       VALUES
        (1, 'Fireline Chicken Burger', 'Smoky grilled chicken, cheddar, jalapeno, and garlic mayo.', 8.9, 18, 650, 'Medium', 1, '', ?),
        (1, 'Stackhouse Beef Burger', 'Double beef with caramelized onion and house pickle.', 10.5, 20, 790, 'Mild', 1, '', ?),
        (2, 'Power Bowl', 'Basmati rice with grilled chicken, cucumber, yogurt sauce, and herbs.', 9.6, 16, 560, 'Mild', 1, '', ?),
        (3, 'Loaded Fries', 'Crisp fries with cheddar, onion, and sauce drizzle.', 4.8, 10, 420, 'Medium', 1, '', ?),
        (4, 'Citrus Cola Cooler', 'Citrus-spiked cola over ice.', 2.9, 4, 120, 'None', 1, '', ?)`,
      seededAt,
      seededAt,
      seededAt,
      seededAt,
      seededAt
    );

    await txn.execAsync(`
      INSERT INTO dish_ingredients (dish_id, ingredient_id, ingredient_category_id, is_mandatory, is_default, extra_price, can_add, can_remove, sort_order) VALUES
      (1, 1, 1, 1, 1, 0, 0, 0, 1),
      (1, 2, 1, 1, 1, 0, 0, 0, 1),
      (1, 4, 2, 0, 1, 0, 1, 1, 1),
      (1, 5, 2, 0, 1, 0, 1, 1, 2),
      (1, 6, 2, 0, 1, 1.20, 1, 1, 3),
      (1, 8, 2, 0, 1, 0.75, 1, 1, 4),
      (1, 9, 3, 0, 1, 0.50, 1, 1, 1),
      (1, 17, 2, 0, 0, 1.50, 1, 0, 5),
      (2, 1, 4, 1, 1, 0, 0, 0, 1),
      (2, 3, 4, 1, 1, 0, 0, 0, 1),
      (2, 4, 5, 0, 1, 0, 1, 1, 1),
      (2, 7, 5, 0, 1, 0.60, 1, 1, 2),
      (2, 13, 5, 0, 1, 0.40, 1, 1, 3),
      (2, 6, 6, 0, 0, 1.20, 1, 0, 1),
      (3, 10, 7, 1, 1, 0, 0, 0, 1),
      (3, 11, 8, 1, 1, 0, 0, 0, 1),
      (3, 12, 9, 0, 1, 0, 1, 1, 1),
      (3, 16, 10, 0, 1, 0.60, 1, 1, 1),
      (3, 17, 9, 0, 0, 1.50, 1, 0, 2),
      (4, 6, 11, 0, 1, 0.80, 1, 1, 1),
      (4, 7, 11, 0, 1, 0.50, 1, 1, 2),
      (4, 9, 11, 0, 1, 0.50, 1, 1, 3),
      (5, 15, 12, 1, 1, 0, 0, 0, 1);

      INSERT INTO banner_images (image_url, title, description, is_active, sort_order, created_at) VALUES
      ('https://via.placeholder.com/1200x300?text=Burger+Promotion', 'Special Burger Feast', 'Enjoy our signature burgers with 15% off', 1, 1, '${seededAt}'),
      ('https://via.placeholder.com/1200x300?text=Bowl+Special', 'Healthy Bowls', 'Nutritious rice bowls delivered fresh', 1, 2, '${seededAt}');

      INSERT INTO offers (title, description, discount_percent, active_from, active_to, banner_color) VALUES
      ('Weekday Lunch Saver', '12% off bowls before 3 PM.', 12, '2026-01-01T00:00:00.000Z', '2027-01-01T00:00:00.000Z', '#D45D31'),
      ('Burger Night', 'Free loaded fries on two burger combos.', 8, '2026-01-01T00:00:00.000Z', '2027-01-01T00:00:00.000Z', '#174C4F');

      INSERT INTO reviews (dish_id, customer_id, rating, comment, created_at) VALUES
      (1, 1, 5, 'Excellent balance of heat and freshness.', '${seededAt}'),
      (3, 1, 4, 'Great portion size for lunch.', '${seededAt}');
    `);

    await txn.runAsync(
      `INSERT INTO orders
        (customer_id, customer_email, rider_id, address_line, latitude, longitude, delivery_notes, status, payment_method, payment_status, subtotal, discount, delivery_fee, total, created_at, accepted_at, preparing_at, ready_at, picked_up_at, delivered_at, rejected_at, canceled_at, cash_collected_at)
       VALUES
        (1, 'sara@custombite.app', 3, 'House 14, Dhanmondi, Dhaka', 23.7465, 90.3760, 'Call when arriving at lane entry.', 'delivered', 'cod', 'cod_collected', 18.50, 1.48, 3.50, 20.52, '2026-04-10T06:30:00.000Z', '2026-04-10T06:33:00.000Z', '2026-04-10T06:40:00.000Z', '2026-04-10T06:56:00.000Z', '2026-04-10T07:02:00.000Z', '2026-04-10T07:19:00.000Z', NULL, NULL, '2026-04-10T07:21:00.000Z'),
        (1, 'sara@custombite.app', 3, 'House 14, Dhanmondi, Dhaka', 23.7465, 90.3760, 'Please avoid knocking loudly.', 'on_the_way', 'card', 'paid', 9.60, 1.15, 3.50, 11.95, '2026-04-11T00:20:00.000Z', '2026-04-11T00:22:00.000Z', '2026-04-11T00:28:00.000Z', '2026-04-11T00:40:00.000Z', '2026-04-11T00:47:00.000Z', NULL, NULL, NULL, NULL),
        (1, 'sara@custombite.app', NULL, 'House 14, Dhanmondi, Dhaka', 23.7465, 90.3760, 'No onions in the bag.', 'rejected', 'card', 'paid', 8.90, 1.07, 3.50, 11.33, '2026-04-09T18:10:00.000Z', NULL, NULL, NULL, NULL, NULL, '2026-04-09T18:14:00.000Z', NULL, NULL),
        (1, 'sara@custombite.app', NULL, 'House 14, Dhanmondi, Dhaka', 23.7465, 90.3760, 'Leave at security desk.', 'canceled', 'cod', 'cod_pending', 10.50, 1.26, 3.50, 12.74, '2026-04-08T12:05:00.000Z', '2026-04-08T12:07:00.000Z', NULL, NULL, NULL, NULL, NULL, '2026-04-08T12:12:00.000Z', NULL)`
    );

    await txn.execAsync(`
      INSERT INTO order_items (order_id, dish_id, quantity, unit_price, instructions) VALUES
      (1, 1, 1, 9.65, 'Extra jalapeno'),
      (1, 4, 1, 4.80, 'Keep fries crisp'),
      (2, 3, 1, 9.60, 'No cucumber'),
      (3, 1, 1, 8.90, 'Cut the burger in half'),
      (4, 2, 1, 10.50, 'Pack sauce separately');

      INSERT INTO order_item_customizations (order_item_id, ingredient_id, action, price_delta) VALUES
      (1, 8, 'add', 0.75), (2, 7, 'add', 0.50), (3, 12, 'remove', 0), (4, 5, 'remove', 0), (5, 6, 'add', 1.20);

      INSERT INTO refund_requests (order_id, customer_id, reason, details, status, resolution_note, created_at)
      VALUES (1, 1, 'Missing sauce', 'Loaded fries arrived without the requested sauce.', 'approved', 'Refund approved as wallet credit equivalent.', '2026-04-10T08:00:00.000Z');
    `);

    await logAudit(txn, 2, 'dish', 1, 'seed', 'Initial sample data created');
    await logAudit(txn, 2, 'order', 1, 'delivered', 'Historical delivered order seeded');
    await logAudit(txn, 3, 'order', 2, 'picked_up', 'Seed active delivery assigned to rider');
    await logAudit(txn, 2, 'order', 3, 'rejected', 'Historical rejected order seeded');
    await logAudit(txn, 1, 'order', 4, 'canceled', 'Historical customer canceled order seeded');
  });
}

async function getUsers() {
  const rows = await db.getAllAsync<UserRow>(`SELECT * FROM users ORDER BY id`);
  return rows.map<User>((row) => ({
    id: row.id,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    passwordHash: row.password_hash,
    addressLine: row.address_line,
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

async function getOffers() {
  return db.getAllAsync<Offer>(`SELECT * FROM offers ORDER BY id`);
}

async function getCategories() {
  const rows = await db.getAllAsync<CategoryRow>(
    `SELECT *
     FROM categories c
     WHERE EXISTS (
       SELECT 1
       FROM dishes d
       WHERE d.category_id = c.id
         AND d.is_available = 1
     )
     ORDER BY sort_order, id`
  );
  return rows.map<Category>((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

async function getBanners() {
  const rows = await db.getAllAsync<BannerImageRow>(
    `SELECT * FROM banner_images WHERE is_active = 1 ORDER BY sort_order, id`
  );
  return rows.map<BannerImage>((row) => ({
    id: row.id,
    imageUrl: row.image_url,
    title: row.title,
    description: row.description,
    isActive: !!row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));
}

async function getIngredientCategories() {
  const rows = await db.getAllAsync<IngredientCategoryRow>(
    `SELECT * FROM ingredient_categories ORDER BY dish_id, sort_order, id`
  );
  return rows.map<IngredientCategory>((row) => ({
    id: row.id,
    dishId: row.dish_id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

async function getIngredients() {
  const rows = await db.getAllAsync<Ingredient>(
    `SELECT id, name FROM ingredients ORDER BY name`
  );
  return rows.map<Ingredient>((row) => ({
    id: row.id,
    name: row.name,
  }));
}

async function getDishes() {
  try {
    const [dishRows, ingredientRows, reviewRows] = await Promise.all([
      db.getAllAsync<DishRow>(
        `SELECT
            d.id,
            d.category_id,
            c.name AS category_name,
            d.name,
            d.description,
            d.price,
            d.prep_time_minutes,
            d.calories,
            d.spice_level,
            d.is_available,
            d.image_url,
            AVG(r.rating) AS average_rating,
            COUNT(r.id) AS review_count
          FROM dishes d
          JOIN categories c ON c.id = d.category_id
          LEFT JOIN reviews r ON r.dish_id = d.id
          WHERE d.is_available = 1
          GROUP BY d.id
          ORDER BY c.sort_order, d.name`
      ).catch((e) => {
        console.warn('Failed to load dishes (non-fatal):', e);
        return [];
      }),
      db.getAllAsync<DishIngredientRow>(
        `SELECT
           di.id,
           di.dish_id,
           di.ingredient_id,
           di.ingredient_category_id,
           ic.name AS ingredient_category_name,
           i.name AS ingredient_name,
           di.is_mandatory,
           di.is_default,
           di.extra_price,
           di.can_add,
           di.can_remove,
           di.sort_order
         FROM dish_ingredients di
         JOIN ingredients i ON i.id = di.ingredient_id
         JOIN ingredient_categories ic ON ic.id = di.ingredient_category_id
         ORDER BY di.dish_id, ic.sort_order, di.sort_order`
      ).catch((e) => {
        console.warn('Failed to load dish ingredients (non-fatal):', e);
        return [];
      }),
      db.getAllAsync<ReviewRow>(
        `SELECT
           r.id,
           r.dish_id,
           r.customer_id,
           u.first_name || ' ' || u.last_name AS customer_name,
           r.rating,
           r.comment,
           r.created_at
         FROM reviews r
         JOIN users u ON u.id = r.customer_id
         ORDER BY r.created_at DESC`
      ).catch((e) => {
        console.warn('Failed to load reviews (non-fatal):', e);
        return [];
      }),
    ]);

    const ingredientMap = ingredientRows.reduce<Record<number, DishIngredient[]>>((acc, row) => {
      const current = acc[row.dish_id] ?? [];
      current.push({
        ingredientId: row.ingredient_id,
        ingredientCategoryId: row.ingredient_category_id,
        ingredientCategoryName: row.ingredient_category_name,
        name: row.ingredient_name,
        isMandatory: !!row.is_mandatory,
        isDefault: !!row.is_default,
        extraPrice: row.extra_price,
        canAdd: !!row.can_add,
        canRemove: !!row.can_remove,
      });
      acc[row.dish_id] = current;
      return acc;
    }, {});

    const reviewMap = reviewRows.reduce<Record<number, Review[]>>((acc, row) => {
      const current = acc[row.dish_id] ?? [];
      current.push({
        id: row.id,
        dishId: row.dish_id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.created_at,
      });
      acc[row.dish_id] = current;
      return acc;
    }, {});

    return dishRows.map<Dish>((row) => ({
      id: row.id,
      categoryId: row.category_id,
      categoryName: row.category_name,
      name: row.name,
      description: row.description,
      price: row.price,
      prepTimeMinutes: row.prep_time_minutes,
      calories: row.calories,
      spiceLevel: row.spice_level,
      isAvailable: !!row.is_available,
      imageUrl: row.image_url,
      ingredients: ingredientMap[row.id] ?? [],
      reviews: reviewMap[row.id] ?? [],
      averageRating: Number((row.average_rating ?? 0).toFixed(1)),
      reviewCount: row.review_count ?? 0,
    }));
  } catch (error) {
    console.error('getDishes failed:', error);
    return [];
  }
}

async function getOrders() {
  const [orderRows, itemRows, customizationRows, ingredientSnapshotRows, refundRows] = await Promise.all([
    db.getAllAsync<OrderRow>(
      `SELECT
         o.*,
         customer.first_name || ' ' || customer.last_name AS customer_name,
         customer.phone AS customer_phone,
         rider.first_name || ' ' || rider.last_name AS rider_name,
         rider.phone AS rider_phone
       FROM orders o
       JOIN users customer ON customer.id = o.customer_id
       LEFT JOIN users rider ON rider.id = o.rider_id
       ORDER BY o.created_at DESC`
    ),
    db.getAllAsync<OrderItemRow>(
      `SELECT
         oi.id,
         oi.order_id,
         oi.dish_id,
         d.name AS dish_name,
         oi.quantity,
         oi.unit_price,
         oi.instructions
       FROM order_items oi
       JOIN dishes d ON d.id = oi.dish_id
       ORDER BY oi.id`
    ),
    db.getAllAsync<CustomizationRow>(
      `SELECT
         oic.order_item_id,
         oic.ingredient_id,
         i.name AS ingredient_name,
         oic.action,
         oic.price_delta
       FROM order_item_customizations oic
       JOIN ingredients i ON i.id = oic.ingredient_id
       ORDER BY oic.id`
    ),
    db.getAllAsync<OrderItemIngredientSnapshotRow>(
      `SELECT
         order_item_id,
         ingredient_id,
         ingredient_name_snapshot,
         ingredient_category_name_snapshot,
         ingredient_price_snapshot
       FROM order_item_ingredients
       ORDER BY id`
    ),
    db.getAllAsync<RefundRow>(`SELECT * FROM refund_requests ORDER BY created_at DESC`),
  ]);

  const customizationMap = customizationRows.reduce<Record<number, OrderItemCustomization[]>>(
    (acc, row) => {
      const current = acc[row.order_item_id] ?? [];
      current.push({
        ingredientId: row.ingredient_id,
        name: row.ingredient_name,
        action: row.action,
        priceDelta: row.price_delta,
      });
      acc[row.order_item_id] = current;
      return acc;
    },
    {}
  );

  const ingredientSnapshotMap = ingredientSnapshotRows.reduce<Record<number, OrderItemIngredientSnapshot[]>>(
    (acc, row) => {
      const current = acc[row.order_item_id] ?? [];
      current.push({
        ingredientId: row.ingredient_id,
        ingredientName: row.ingredient_name_snapshot,
        ingredientCategoryName: row.ingredient_category_name_snapshot,
        price: row.ingredient_price_snapshot,
      });
      acc[row.order_item_id] = current;
      return acc;
    },
    {}
  );

  const itemMap = itemRows.reduce<Record<number, OrderItem[]>>((acc, row) => {
    const current = acc[row.order_id] ?? [];
    current.push({
      id: row.id,
      orderId: row.order_id,
      dishId: row.dish_id,
      dishName: row.dish_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      instructions: row.instructions,
      customizations: customizationMap[row.id] ?? [],
      ingredientSnapshots: ingredientSnapshotMap[row.id] ?? [],
    });
    acc[row.order_id] = current;
    return acc;
  }, {});

  const refundMap = refundRows.reduce<Record<number, RefundRequest>>((acc, row) => {
    acc[row.order_id] = {
      id: row.id,
      orderId: row.order_id,
      customerId: row.customer_id,
      reason: row.reason,
      details: row.details,
      status: row.status,
      resolutionNote: row.resolution_note,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
    };
    return acc;
  }, {});

  return orderRows.map<Order>((row) => ({
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    riderId: row.rider_id,
    riderName: row.rider_name,
    riderPhone: row.rider_phone,
    riderLatitude: row.rider_latitude,
    riderLongitude: row.rider_longitude,
    addressLine: row.address_line,
    latitude: row.latitude,
    longitude: row.longitude,
    deliveryNotes: row.delivery_notes,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotal: row.subtotal,
    discount: row.discount,
    deliveryFee: row.delivery_fee,
    total: row.total,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    preparingAt: row.preparing_at,
    readyAt: row.ready_at,
    pickedUpAt: row.picked_up_at,
    deliveredAt: row.delivered_at,
    rejectedAt: row.rejected_at,
    canceledAt: row.canceled_at,
    cashCollectedAt: row.cash_collected_at,
    items: itemMap[row.id] ?? [],
    refundRequest: refundMap[row.id] ?? null,
  }));
}

async function getAuditLogs() {
  const rows = await db.getAllAsync<AuditRow>(
    `SELECT
       a.id,
       a.actor_user_id,
       u.first_name || ' ' || u.last_name AS actor_name,
       u.role AS actor_role,
       a.entity_type,
       a.entity_id,
       a.action,
       a.details,
       a.created_at
     FROM audit_logs a
     JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.created_at DESC, a.id DESC`
  );

  return rows.map<AuditLog>((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    details: row.details,
    createdAt: row.created_at,
  }));
}

async function getSession() {
  const row = await db.getFirstAsync<{ user_id: number | null; role: Role | null }>(
    `SELECT user_id, role FROM app_session WHERE id = 1`
  );
  if (!row?.user_id || !row.role) {
    return null;
  }
  return { userId: row.user_id, role: row.role } satisfies Session;
}

export async function initializeRepository() {
  await execSchema();
  await seedDatabase();
  await syncCuratedRestaurantMenu();
  await backfillOrderItemIngredientSnapshots();
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  async function loadSection<T>(label: string, loader: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await loader();
    } catch (error) {
      console.error(`${label} error:`, error);
      return fallback;
    }
  }

  // Expo SQLite can fail when many async reads share one database handle at once.
  const users = await loadSection('getUsers', getUsers, []);
  const offers = await loadSection('getOffers', getOffers, []);
  const banners = await loadSection('getBanners', getBanners, []);
  const categories = await loadSection('getCategories', getCategories, []);
  const ingredientCategories = await loadSection('getIngredientCategories', getIngredientCategories, []);
  const ingredients = await loadSection('getIngredients', getIngredients, []);
  const dishes = await loadSection('getDishes', getDishes, []);
  const orders = await loadSection('getOrders', getOrders, []);
  const auditLogs = await loadSection('getAuditLogs', getAuditLogs, []);
  const session = await loadSection('getSession', getSession, null);

  return {
    users,
    offers,
    banners,
    categories,
    ingredientCategories,
    ingredients,
    dishes,
    orders,
    auditLogs,
    metrics: buildManagerMetrics(orders, nowIso()),
    session,
  };
}

export async function login(payload: LoginPayload) {
  const validated = validateLogin(payload);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? 'Invalid login details');
  }

  const user = await db.getFirstAsync<UserRow>(
    `SELECT * FROM users
     WHERE role = ?
       AND (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) OR phone = ?)
     LIMIT 1`,
    payload.role,
    payload.identifier,
    payload.identifier,
    payload.identifier
  );

  if (!user) {
    throw new Error('No user matched that role and identity');
  }

  const passwordHash = await hashPassword(payload.password);
  if (passwordHash !== user.password_hash) {
    throw new Error('Password is incorrect');
  }

  await db.runAsync(
    `INSERT INTO app_session (id, user_id, role, last_login_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, role = excluded.role, last_login_at = excluded.last_login_at`,
    user.id,
    user.role,
    nowIso()
  );

  await logAudit(db, user.id, 'session', user.id, 'login', `${user.role} logged in`);
}

export async function logout() {
  const session = await getSession();
  if (session) {
    await logAudit(db, session.userId, 'session', session.userId, 'logout', 'User logged out');
  }
  await db.runAsync(`DELETE FROM app_session WHERE id = 1`);
}

export async function register(payload: RegisterPayload) {
  const validated = validateRegistration(payload);
  if (!validated.success) {
    throw new Error(validated.error.issues[0]?.message ?? 'Registration failed validation');
  }

  const duplicate = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM users
     WHERE LOWER(email) = LOWER(?)
        OR LOWER(username) = LOWER(?)
        OR phone = ?
     LIMIT 1`,
    payload.email,
    payload.username,
    payload.phone
  );

  if (duplicate) {
    throw new Error('Email, username, or phone already exists');
  }

  const passwordHash = await hashPassword(payload.password);
  const createdAt = nowIso();
  const result = await db.runAsync(
    `INSERT INTO users
      (role, first_name, last_name, username, email, phone, date_of_birth, password_hash, address_line, latitude, longitude, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 23.7806, 90.4070, ?, ?)`,
    payload.role,
    payload.firstName.trim(),
    payload.lastName.trim(),
    payload.username.trim(),
    payload.email.trim(),
    payload.phone.trim(),
    payload.dateOfBirth,
    passwordHash,
    '',
    '',
    createdAt
  );

  await db.runAsync(
    `INSERT INTO app_session (id, user_id, role, last_login_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id, role = excluded.role, last_login_at = excluded.last_login_at`,
    result.lastInsertRowId,
    payload.role,
    createdAt
  );

  await logAudit(
    db,
    Number(result.lastInsertRowId),
    'user',
    Number(result.lastInsertRowId),
    'register',
    `${payload.role} registered`
  );
}

export async function placeOrder(
  customerId: number,
  cartItems: Array<{
    dishId: number;
    quantity: number;
    basePrice: number;
    instructions: string;
    customizations: OrderItemCustomization[];
  }>,
  payload: PlaceOrderPayload,
  discountPercent: number
) {
  if (cartItems.length === 0) {
    throw new Error('Cart is empty');
  }
  if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
    throw new Error('Delivery location is required');
  }

  const customer = await db.getFirstAsync<UserRow>(`SELECT * FROM users WHERE id = ?`, customerId);
  if (!customer) {
    throw new Error('Customer account not found');
  }

  const dishIds = [...new Set(cartItems.map((item) => item.dishId))];
  const ingredientRows =
    dishIds.length > 0
      ? await db.getAllAsync<SnapshotIngredientSourceRow>(
          `SELECT
             di.dish_id,
             di.ingredient_id,
             i.name AS ingredient_name,
             ic.name AS ingredient_category_name,
             di.is_mandatory,
             di.is_default,
             di.extra_price
           FROM dish_ingredients di
           JOIN ingredients i ON i.id = di.ingredient_id
           JOIN ingredient_categories ic ON ic.id = di.ingredient_category_id
           WHERE di.dish_id IN (${dishIds.map(() => '?').join(', ')})
           ORDER BY di.dish_id, ic.sort_order, di.sort_order, di.id`,
          ...dishIds
        )
      : [];

  const ingredientMap = ingredientRows.reduce<Record<number, SnapshotIngredientSourceRow[]>>((acc, row) => {
    const current = acc[row.dish_id] ?? [];
    current.push(row);
    acc[row.dish_id] = current;
    return acc;
  }, {});

  const totals = calculateOrderTotals(
    cartItems.map((item, index) => ({
      id: String(index),
      dishId: item.dishId,
      dishName: '',
      quantity: item.quantity,
      basePrice: item.basePrice,
      instructions: item.instructions,
      customizations: item.customizations,
    })),
    discountPercent
  );

  const createdAt = nowIso();
  await db.withExclusiveTransactionAsync(async (txn) => {
    const trimmedAddressLine = payload.deliveryAddressLine?.trim();
    const resolvedAddressLine =
      trimmedAddressLine && trimmedAddressLine.length > 0
        ? trimmedAddressLine
        : `Pinned location (${payload.latitude.toFixed(5)}, ${payload.longitude.toFixed(5)})`;

    const orderResult = await txn.runAsync(
      `INSERT INTO orders
        (customer_id, customer_email, rider_id, address_line, latitude, longitude, delivery_notes, status, payment_method, payment_status, subtotal, discount, delivery_fee, total, created_at)
       VALUES (?, ?, NULL, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      customerId,
      customer.email,
      resolvedAddressLine,
      payload.latitude,
      payload.longitude,
      payload.deliveryNotes.trim(),
      payload.paymentMethod,
      payload.paymentMethod === 'cod' ? 'cod_pending' : 'paid',
      totals.subtotal,
      totals.discount,
      totals.deliveryFee,
      totals.total,
      createdAt
    );

    const orderId = Number(orderResult.lastInsertRowId);
    for (const cartItem of cartItems) {
      const customDelta = cartItem.customizations.reduce(
        (sum, customization) => sum + customization.priceDelta,
        0
      );
      const orderItemResult = await txn.runAsync(
        `INSERT INTO order_items (order_id, dish_id, quantity, unit_price, instructions)
         VALUES (?, ?, ?, ?, ?)`,
        orderId,
        cartItem.dishId,
        cartItem.quantity,
        Number((cartItem.basePrice + customDelta).toFixed(2)),
        cartItem.instructions.trim()
      );

      const orderItemId = Number(orderItemResult.lastInsertRowId);
      for (const customization of cartItem.customizations) {
        await txn.runAsync(
          `INSERT INTO order_item_customizations (order_item_id, ingredient_id, action, price_delta)
           VALUES (?, ?, ?, ?)`,
          orderItemId,
          customization.ingredientId,
          customization.action,
          customization.priceDelta
        );
      }

      const ingredientSnapshots = buildSelectedIngredientSnapshots(
        ingredientMap[cartItem.dishId] ?? [],
        cartItem.customizations
      );
      await writeOrderItemIngredientSnapshots(txn, orderItemId, ingredientSnapshots);
    }

    await logAudit(
      txn,
      customerId,
      'order',
      orderId,
      'create',
      `Order submitted with ${payload.paymentMethod.toUpperCase()} payment`
    );
  });
}

export async function submitRefund(customerId: number, payload: SubmitRefundPayload) {
  // Check if order exists and belongs to the customer
  const order = await db.getFirstAsync<OrderRow>(
    `SELECT id, customer_id, status FROM orders WHERE id = ?`,
    payload.orderId
  );
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.customer_id !== customerId) {
    throw new Error('Order does not belong to this customer');
  }
  // Prevent refund requests for non-fulfilled terminal orders
  if (order.status === 'rejected' || order.status === 'canceled') {
    throw new Error('Cannot request refund for rejected or canceled orders');
  }

  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM refund_requests WHERE order_id = ?`,
    payload.orderId
  );
  if (existing) {
    throw new Error('Refund request already exists for this order');
  }

  await db.runAsync(
    `INSERT INTO refund_requests (order_id, customer_id, reason, details, status, resolution_note, created_at)
     VALUES (?, ?, ?, ?, 'requested', '', ?)`,
    payload.orderId,
    customerId,
    payload.reason.trim(),
    payload.details.trim(),
    nowIso()
  );

  await logAudit(db, customerId, 'refund_request', payload.orderId, 'create', payload.reason.trim());
}

export async function submitReview(customerId: number, payload: SubmitReviewPayload) {
  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM reviews WHERE dish_id = ? AND customer_id = ?`,
    payload.dishId,
    customerId
  );
  if (existing) {
    await db.runAsync(
      `UPDATE reviews SET rating = ?, comment = ?, created_at = ? WHERE id = ?`,
      payload.rating,
      payload.comment.trim(),
      nowIso(),
      existing.id
    );
  } else {
    await db.runAsync(
      `INSERT INTO reviews (dish_id, customer_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      payload.dishId,
      customerId,
      payload.rating,
      payload.comment.trim(),
      nowIso()
    );
  }

  await logAudit(db, customerId, 'review', payload.dishId, 'upsert', `Dish ${payload.dishId} rated ${payload.rating}`);
}

export async function upsertDishRecord(actorUserId: number, payload: ManagerDishPayload) {
  const trimmedName = payload.name.trim();
  if (!trimmedName) {
    throw new Error('Dish name is required');
  }

  await db.withExclusiveTransactionAsync(async (txn) => {
    let dishId = payload.id;

    if (dishId) {
      await txn.runAsync(
        `UPDATE dishes
         SET category_id = ?, name = ?, description = ?, price = ?, prep_time_minutes = ?, calories = ?, spice_level = ?, is_available = ?, image_url = ?
         WHERE id = ?`,
        payload.categoryId,
        trimmedName,
        payload.description.trim(),
        payload.price,
        payload.prepTimeMinutes,
        payload.calories,
        payload.spiceLevel.trim(),
        payload.isAvailable ? 1 : 0,
        payload.imageUrl.trim(),
        dishId
      );

      await txn.runAsync(`DELETE FROM dish_ingredients WHERE dish_id = ?`, dishId);
      await txn.runAsync(`DELETE FROM ingredient_categories WHERE dish_id = ?`, dishId);
    } else {
      const result = await txn.runAsync(
        `INSERT INTO dishes
          (category_id, name, description, price, prep_time_minutes, calories, spice_level, is_available, image_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        payload.categoryId,
        trimmedName,
        payload.description.trim(),
        payload.price,
        payload.prepTimeMinutes,
        payload.calories,
        payload.spiceLevel.trim(),
        payload.isAvailable ? 1 : 0,
        payload.imageUrl.trim(),
        nowIso()
      );
      dishId = Number(result.lastInsertRowId);
    }

    if (!dishId) {
      throw new Error('Dish could not be saved');
    }

    const normalizedCategories = payload.ingredientCategories
      .map((category, categoryIndex) => ({
        ...category,
        name: category.name.trim(),
        description: category.description.trim(),
        sortOrder: category.sortOrder ?? categoryIndex,
        ingredients: category.ingredients
          .map((ingredient, ingredientIndex) => ({
            ...ingredient,
            name: ingredient.name.trim(),
            sortOrder: ingredient.sortOrder ?? ingredientIndex,
          }))
          .filter((ingredient) => ingredient.name.length > 0),
      }))
      .filter((category) => category.name.length > 0);

    for (let categoryIndex = 0; categoryIndex < normalizedCategories.length; categoryIndex += 1) {
      const category = normalizedCategories[categoryIndex];
      const categoryResult = await txn.runAsync(
        `INSERT INTO ingredient_categories (dish_id, name, description, sort_order)
         VALUES (?, ?, ?, ?)`,
        dishId,
        category.name,
        category.description,
        category.sortOrder ?? categoryIndex
      );
      const ingredientCategoryId = Number(categoryResult.lastInsertRowId);

      for (let ingredientIndex = 0; ingredientIndex < category.ingredients.length; ingredientIndex += 1) {
        const ingredient = category.ingredients[ingredientIndex];
        const ingredientId = await ensureIngredientRecord(txn, ingredient.name);

        await txn.runAsync(
          `INSERT INTO dish_ingredients
            (dish_id, ingredient_id, ingredient_category_id, is_mandatory, is_default, extra_price, can_add, can_remove, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          dishId,
          ingredientId,
          ingredientCategoryId,
          ingredient.isMandatory ? 1 : 0,
          ingredient.isDefault ? 1 : 0,
          ingredient.extraPrice,
          ingredient.canAdd ? 1 : 0,
          ingredient.canRemove ? 1 : 0,
          ingredient.sortOrder ?? ingredientIndex
        );
      }
    }

    await logAudit(
      txn,
      actorUserId,
      'dish',
      dishId,
      payload.id ? 'update' : 'create',
      trimmedName
    );
  });
}

export async function deleteDishRecord(actorUserId: number, dishId: number) {
  await db.runAsync(`DELETE FROM dishes WHERE id = ?`, dishId);
  await logAudit(db, actorUserId, 'dish', dishId, 'delete', 'Dish removed from menu');
}

export async function advanceOrder(actorUserId: number, orderId: number) {
  const actor = await db.getFirstAsync<Pick<UserRow, 'role'>>(
    `SELECT role FROM users WHERE id = ?`,
    actorUserId
  );
  if (!actor) {
    throw new Error('Actor user not found');
  }

  const order = await db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'rejected' || order.status === 'canceled') {
    throw new Error('Closed orders cannot be advanced');
  }

  const next = nextOrderStatus(order.status);
  if (!next) {
    throw new Error('Order is already at its final status');
  }
  if (actor.role === 'manager') {
    if (order.status === 'on_the_way' || next === 'delivered') {
      throw new Error('Manager cannot mark orders as delivered');
    }
  } else if (actor.role === 'rider') {
    if (order.status !== 'on_the_way' || next !== 'delivered') {
      throw new Error('Rider can only complete on-the-way orders');
    }
    if (order.rider_id !== actorUserId) {
      throw new Error('Order is not assigned to this rider');
    }
  } else {
    throw new Error('Only manager or rider can advance orders');
  }

  const timestamp = nowIso();
  const acceptedAt = next === 'accepted' ? timestamp : order.accepted_at;
  const preparingAt = next === 'preparing' ? timestamp : order.preparing_at;
  const readyAt = next === 'ready' ? timestamp : order.ready_at;
  const pickedUpAt = next === 'on_the_way' ? timestamp : order.picked_up_at;
  const deliveredAt = next === 'delivered' ? timestamp : order.delivered_at;

  await db.runAsync(
    `UPDATE orders
     SET status = ?, accepted_at = ?, preparing_at = ?, ready_at = ?, picked_up_at = ?, delivered_at = ?
     WHERE id = ?`,
    next,
    acceptedAt,
    preparingAt,
    readyAt,
    pickedUpAt,
    deliveredAt,
    orderId
  );

  await logAudit(db, actorUserId, 'order', orderId, next, `Order moved to ${next}`);
}

export async function rejectOrder(actorUserId: number, orderId: number, reason: string) {
  const actor = await db.getFirstAsync<Pick<UserRow, 'role'>>(
    `SELECT role FROM users WHERE id = ?`,
    actorUserId
  );
  if (!actor || actor.role !== 'manager') {
    throw new Error('Only manager can reject orders');
  }

  const order = await db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.status !== 'pending') {
    throw new Error('Only pending orders can be rejected');
  }

  const rejectedAt = nowIso();
  await db.runAsync(
    `UPDATE orders
     SET status = 'rejected', rejected_at = ?
     WHERE id = ?`,
    rejectedAt,
    orderId
  );
  await logAudit(
    db,
    actorUserId,
    'order',
    orderId,
    'rejected',
    reason.trim() || 'Rejected by manager'
  );
}

export async function cancelOrderByCustomer(customerId: number, orderId: number) {
  const order = await db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.customer_id !== customerId) {
    throw new Error('Order does not belong to this customer');
  }
  if (!['pending', 'accepted', 'preparing'].includes(order.status)) {
    throw new Error('Order cannot be canceled after it is ready');
  }

  await db.runAsync(
    `UPDATE orders
     SET status = 'canceled', canceled_at = ?
     WHERE id = ?`,
    nowIso(),
    orderId
  );
  await logAudit(db, customerId, 'order', orderId, 'canceled', 'Canceled by customer');
}

export async function claimOrderByRider(riderId: number, orderId: number) {
  const rider = await db.getFirstAsync<Pick<UserRow, 'role' | 'latitude' | 'longitude'>>(
    `SELECT role, latitude, longitude FROM users WHERE id = ?`,
    riderId
  );
  if (!rider || rider.role !== 'rider') {
    throw new Error('Only riders can claim delivery orders');
  }

  const order = await db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.status !== 'on_the_way') {
    throw new Error('Only on-the-way orders can be claimed');
  }

  const result = await db.runAsync(
    `UPDATE orders
     SET rider_id = ?, rider_latitude = ?, rider_longitude = ?
     WHERE id = ? AND status = 'on_the_way' AND (rider_id IS NULL OR rider_id = ?)`,
    riderId,
    rider.latitude,
    rider.longitude,
    orderId,
    riderId
  );

  if ((result.changes ?? 0) === 0) {
    throw new Error('Order already taken');
  }

  await logAudit(db, riderId, 'order', orderId, 'claim_delivery', 'Rider accepted delivery');
}

export async function updateRefundDecision(
  actorUserId: number,
  refundId: number,
  status: 'approved' | 'denied',
  resolutionNote: string
) {
  await db.runAsync(
    `UPDATE refund_requests
     SET status = ?, resolution_note = ?, reviewed_at = ?, reviewed_by = ?
     WHERE id = ?`,
    status,
    resolutionNote.trim(),
    nowIso(),
    actorUserId,
    refundId
  );

  await logAudit(db, actorUserId, 'refund_request', refundId, status, resolutionNote.trim());
}

export async function assignOrderRider(actorUserId: number, orderId: number, riderId: number) {
  await db.runAsync(`UPDATE orders SET rider_id = ? WHERE id = ?`, riderId, orderId);
  await logAudit(db, actorUserId, 'order', orderId, 'assign_rider', `Assigned rider ${riderId}`);
}

export async function confirmCash(actorUserId: number, orderId: number) {
  await db.runAsync(
    `UPDATE orders SET payment_status = 'cod_collected', cash_collected_at = ? WHERE id = ?`,
    nowIso(),
    orderId
  );
  await logAudit(
    db,
    actorUserId,
    'order',
    orderId,
    'cash_collected',
    'COD amount marked as collected'
  );
}

export async function upsertBannerImage(actorUserId: number, payload: BannerPayload) {
  const actor = await db.getFirstAsync<Pick<UserRow, 'role'>>(
    `SELECT role FROM users WHERE id = ?`,
    actorUserId
  );
  if (!actor || actor.role !== 'manager') {
    throw new Error('Only manager can update banners');
  }

  const imageUrl = payload.imageUrl.trim();
  if (!imageUrl) {
    throw new Error('Banner image URL is required');
  }

  if (payload.id) {
    await db.runAsync(
      `UPDATE banner_images
       SET image_url = ?, title = ?, description = ?, is_active = ?, sort_order = ?
       WHERE id = ?`,
      imageUrl,
      payload.title.trim() || 'Promotion',
      payload.description.trim(),
      payload.isActive ? 1 : 0,
      payload.sortOrder,
      payload.id
    );
    await logAudit(db, actorUserId, 'banner', payload.id, 'update', imageUrl);
    return;
  }

  const maxSort = await db.getFirstAsync<{ max_sort: number | null }>(
    `SELECT MAX(sort_order) as max_sort FROM banner_images`
  );
  const sortOrder = Number.isFinite(payload.sortOrder)
    ? payload.sortOrder
    : (maxSort?.max_sort ?? 0) + 1;

  const result = await db.runAsync(
    `INSERT INTO banner_images (image_url, title, description, is_active, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    imageUrl,
    payload.title.trim() || 'Promotion',
    payload.description.trim(),
    payload.isActive ? 1 : 0,
    sortOrder,
    nowIso()
  );
  await logAudit(
    db,
    actorUserId,
    'banner',
    Number(result.lastInsertRowId),
    'create',
    imageUrl
  );
}

export async function removeBannerImage(actorUserId: number, bannerId: number) {
  const actor = await db.getFirstAsync<Pick<UserRow, 'role'>>(
    `SELECT role FROM users WHERE id = ?`,
    actorUserId
  );
  if (!actor || actor.role !== 'manager') {
    throw new Error('Only manager can remove banners');
  }

  await db.runAsync(`DELETE FROM banner_images WHERE id = ?`, bannerId);
  await logAudit(db, actorUserId, 'banner', bannerId, 'delete', 'Banner removed');
}
