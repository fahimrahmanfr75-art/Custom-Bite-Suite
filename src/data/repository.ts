import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

import type {
  AppSnapshot,
  AuditLog,
  Category,
  Dish,
  DishIngredient,
  LoginPayload,
  ManagerDishPayload,
  Offer,
  Order,
  OrderItem,
  OrderItemCustomization,
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
  dish_id: number;
  ingredient_id: number;
  ingredient_name: string;
  is_allergen: number;
  is_default: number;
  extra_price: number;
  can_add: number;
  can_remove: number;
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
  customer_name: string;
  customer_phone: string;
  rider_id: number | null;
  rider_name: string | null;
  rider_phone: string | null;
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

async function execSchema() {
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
      name TEXT NOT NULL UNIQUE,
      is_allergen INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS dish_ingredients (
      dish_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 1,
      extra_price REAL NOT NULL DEFAULT 0,
      can_add INTEGER NOT NULL DEFAULT 1,
      can_remove INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY(dish_id, ingredient_id),
      FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
      FOREIGN KEY(ingredient_id) REFERENCES ingredients(id)
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

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      rider_id INTEGER,
      address_line TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      delivery_notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled')),
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

      INSERT INTO ingredients (name, is_allergen) VALUES
      ('Brioche Bun', 1),
      ('Chicken Patty', 0),
      ('Beef Patty', 0),
      ('Lettuce', 0),
      ('Tomato', 0),
      ('Cheddar', 1),
      ('Caramelized Onion', 0),
      ('Jalapeno', 0),
      ('Garlic Mayo', 1),
      ('Basmati Rice', 0),
      ('Grilled Chicken', 0),
      ('Cucumber', 0),
      ('House Pickle', 0),
      ('Loaded Fries', 0),
      ('Cola', 0),
      ('Greek Yogurt Sauce', 1),
      ('Avocado', 0);
    `);

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
      INSERT INTO dish_ingredients (dish_id, ingredient_id, is_default, extra_price, can_add, can_remove) VALUES
      (1, 1, 1, 0, 0, 0), (1, 2, 1, 0, 0, 0), (1, 4, 1, 0, 1, 1), (1, 5, 1, 0, 1, 1),
      (1, 6, 1, 1.20, 1, 1), (1, 8, 1, 0.75, 1, 1), (1, 9, 1, 0.50, 1, 1), (1, 17, 0, 1.50, 1, 0),
      (2, 1, 1, 0, 0, 0), (2, 3, 1, 0, 0, 0), (2, 4, 1, 0, 1, 1), (2, 7, 1, 0.60, 1, 1),
      (2, 13, 1, 0.40, 1, 1), (2, 6, 0, 1.20, 1, 0),
      (3, 10, 1, 0, 0, 0), (3, 11, 1, 0, 0, 0), (3, 12, 1, 0, 1, 1), (3, 16, 1, 0.60, 1, 1),
      (3, 17, 0, 1.50, 1, 0), (4, 6, 1, 0.80, 1, 1), (4, 7, 1, 0.50, 1, 1), (4, 9, 1, 0.50, 1, 1),
      (5, 15, 1, 0, 0, 0);

      INSERT INTO offers (title, description, discount_percent, active_from, active_to, banner_color) VALUES
      ('Weekday Lunch Saver', '12% off bowls before 3 PM.', 12, '2026-01-01T00:00:00.000Z', '2027-01-01T00:00:00.000Z', '#D45D31'),
      ('Burger Night', 'Free loaded fries on two burger combos.', 8, '2026-01-01T00:00:00.000Z', '2027-01-01T00:00:00.000Z', '#174C4F');

      INSERT INTO reviews (dish_id, customer_id, rating, comment, created_at) VALUES
      (1, 1, 5, 'Excellent balance of heat and freshness.', '${seededAt}'),
      (3, 1, 4, 'Great portion size for lunch.', '${seededAt}');
    `);

    await txn.runAsync(
      `INSERT INTO orders
        (customer_id, rider_id, address_line, latitude, longitude, delivery_notes, status, payment_method, payment_status, subtotal, discount, delivery_fee, total, created_at, accepted_at, preparing_at, ready_at, picked_up_at, delivered_at, cash_collected_at)
       VALUES
        (1, 3, 'House 14, Dhanmondi, Dhaka', 23.7465, 90.3760, 'Call when arriving at lane entry.', 'delivered', 'cod', 'cod_collected', 18.50, 1.48, 3.50, 20.52, '2026-04-10T06:30:00.000Z', '2026-04-10T06:33:00.000Z', '2026-04-10T06:40:00.000Z', '2026-04-10T06:56:00.000Z', '2026-04-10T07:02:00.000Z', '2026-04-10T07:19:00.000Z', '2026-04-10T07:21:00.000Z'),
        (1, 3, 'House 14, Dhanmondi, Dhaka', 23.7465, 90.3760, 'Please avoid knocking loudly.', 'on_the_way', 'card', 'paid', 9.60, 1.15, 3.50, 11.95, '2026-04-11T00:20:00.000Z', '2026-04-11T00:22:00.000Z', '2026-04-11T00:28:00.000Z', '2026-04-11T00:40:00.000Z', '2026-04-11T00:47:00.000Z', NULL, NULL)`
    );

    await txn.execAsync(`
      INSERT INTO order_items (order_id, dish_id, quantity, unit_price, instructions) VALUES
      (1, 1, 1, 9.65, 'Extra jalapeno'), (1, 4, 1, 4.80, 'Keep fries crisp'), (2, 3, 1, 9.60, 'No cucumber');

      INSERT INTO order_item_customizations (order_item_id, ingredient_id, action, price_delta) VALUES
      (1, 8, 'add', 0.75), (2, 7, 'add', 0.50), (3, 12, 'remove', 0);

      INSERT INTO refund_requests (order_id, customer_id, reason, details, status, resolution_note, created_at)
      VALUES (1, 1, 'Missing sauce', 'Loaded fries arrived without the requested sauce.', 'approved', 'Refund approved as wallet credit equivalent.', '2026-04-10T08:00:00.000Z');
    `);

    await logAudit(txn, 2, 'dish', 1, 'seed', 'Initial sample data created');
    await logAudit(txn, 2, 'order', 1, 'delivered', 'Historical delivered order seeded');
    await logAudit(txn, 3, 'order', 2, 'picked_up', 'Seed active delivery assigned to rider');
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
    `SELECT * FROM categories ORDER BY sort_order, id`
  );
  return rows.map<Category>((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

async function getDishes() {
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
        GROUP BY d.id
        ORDER BY c.sort_order, d.name`
    ),
    db.getAllAsync<DishIngredientRow>(
      `SELECT
         di.dish_id,
         di.ingredient_id,
         i.name AS ingredient_name,
         i.is_allergen,
         di.is_default,
         di.extra_price,
         di.can_add,
         di.can_remove
       FROM dish_ingredients di
       JOIN ingredients i ON i.id = di.ingredient_id
       ORDER BY di.dish_id, i.name`
    ),
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
    ),
  ]);

  const ingredientMap = ingredientRows.reduce<Record<number, DishIngredient[]>>((acc, row) => {
    const current = acc[row.dish_id] ?? [];
    current.push({
      ingredientId: row.ingredient_id,
      name: row.ingredient_name,
      isAllergen: !!row.is_allergen,
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
    reviewCount: row.review_count,
  }));
}

async function getOrders() {
  const [orderRows, itemRows, customizationRows, refundRows] = await Promise.all([
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
    riderId: row.rider_id,
    riderName: row.rider_name,
    riderPhone: row.rider_phone,
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
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  const [users, offers, categories, dishes, orders, auditLogs, session] = await Promise.all([
    getUsers(),
    getOffers(),
    getCategories(),
    getDishes(),
    getOrders(),
    getAuditLogs(),
    getSession(),
  ]);

  return {
    users,
    offers,
    categories,
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
    payload.addressLine.trim(),
    payload.notes.trim(),
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

  const customer = await db.getFirstAsync<UserRow>(`SELECT * FROM users WHERE id = ?`, customerId);
  if (!customer) {
    throw new Error('Customer account not found');
  }

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
    const orderResult = await txn.runAsync(
      `INSERT INTO orders
        (customer_id, rider_id, address_line, latitude, longitude, delivery_notes, status, payment_method, payment_status, subtotal, discount, delivery_fee, total, created_at)
       VALUES (?, 3, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      customerId,
      customer.address_line,
      customer.latitude,
      customer.longitude,
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
  if (payload.id) {
    await db.runAsync(
      `UPDATE dishes
       SET category_id = ?, name = ?, description = ?, price = ?, prep_time_minutes = ?, calories = ?, spice_level = ?, is_available = ?
       WHERE id = ?`,
      payload.categoryId,
      payload.name.trim(),
      payload.description.trim(),
      payload.price,
      payload.prepTimeMinutes,
      payload.calories,
      payload.spiceLevel.trim(),
      payload.isAvailable ? 1 : 0,
      payload.id
    );
    await logAudit(db, actorUserId, 'dish', payload.id, 'update', payload.name.trim());
  } else {
    const result = await db.runAsync(
      `INSERT INTO dishes
        (category_id, name, description, price, prep_time_minutes, calories, spice_level, is_available, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', ?)`,
      payload.categoryId,
      payload.name.trim(),
      payload.description.trim(),
      payload.price,
      payload.prepTimeMinutes,
      payload.calories,
      payload.spiceLevel.trim(),
      payload.isAvailable ? 1 : 0,
      nowIso()
    );
    await logAudit(
      db,
      actorUserId,
      'dish',
      Number(result.lastInsertRowId),
      'create',
      payload.name.trim()
    );
  }
}

export async function deleteDishRecord(actorUserId: number, dishId: number) {
  await db.runAsync(`DELETE FROM dishes WHERE id = ?`, dishId);
  await logAudit(db, actorUserId, 'dish', dishId, 'delete', 'Dish removed from menu');
}

export async function advanceOrder(actorUserId: number, orderId: number) {
  const order = await db.getFirstAsync<OrderRow>(`SELECT * FROM orders WHERE id = ?`, orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  const next = nextOrderStatus(order.status);
  if (!next) {
    throw new Error('Order is already at its final status');
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
