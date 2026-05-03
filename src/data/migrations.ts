import type { SqlRunner } from './schema';

type MigrationRunner = SqlRunner & {
  withExclusiveTransactionAsync: (callback: (txn: SqlRunner) => Promise<void>) => Promise<void>;
};

function hasColumn(columns: string[], columnName: string) {
  return columns.includes(columnName);
}

export function needsIngredientsTableRebuild(columns: string[]) {
  return columns.length > 0 && !hasColumn(columns, 'is_allergen');
}

export function needsDishIngredientsTableRebuild(columns: string[]) {
  return (
    !hasColumn(columns, 'ingredient_category_id') ||
    !hasColumn(columns, 'is_mandatory') ||
    !hasColumn(columns, 'can_add') ||
    !hasColumn(columns, 'can_remove') ||
    !hasColumn(columns, 'sort_order')
  );
}

export function needsOrdersTableRebuild(columns: string[]) {
  return (
    hasColumn(columns, 'cancelled_at') ||
    !hasColumn(columns, 'rejected_at') ||
    !hasColumn(columns, 'canceled_at') ||
    !hasColumn(columns, 'rider_latitude') ||
    !hasColumn(columns, 'rider_longitude') ||
    !hasColumn(columns, 'last_location_update') ||
    !hasColumn(columns, 'updated_at')
  );
}

type Migration = {
  version: number;
  apply: (txn: SqlRunner) => Promise<void>;
};

const migrations: Migration[] = [
  {
    version: 1,
    apply: async (txn) => {
      await txn.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          role TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          phone TEXT NOT NULL UNIQUE,
          date_of_birth TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          address_line TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: 2,
    apply: async (txn) => {
      await txn.execAsync(`
        CREATE TABLE IF NOT EXISTS app_session (
          id INTEGER PRIMARY KEY CHECK(id = 1),
          user_id INTEGER,
          role TEXT,
          last_login_at TEXT
        );
        CREATE TABLE IF NOT EXISTS app_notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          audience TEXT NOT NULL,
          recipient_user_id INTEGER,
          recipient_role TEXT,
          order_id INTEGER,
          kind TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: 3,
    apply: async (txn) => {
      const ingredientColumns = (
        await txn.getAllAsync<{ name?: string }>('PRAGMA table_info(ingredients)')
      )
        .map((row) => row.name)
        .filter((name): name is string => typeof name === 'string');
      const dishIngredientColumns = (
        await txn.getAllAsync<{ name?: string }>('PRAGMA table_info(dish_ingredients)')
      )
        .map((row) => row.name)
        .filter((name): name is string => typeof name === 'string');
      const orderColumns = (
        await txn.getAllAsync<{ name?: string }>('PRAGMA table_info(orders)')
      )
        .map((row) => row.name)
        .filter((name): name is string => typeof name === 'string');

      if (needsIngredientsTableRebuild(ingredientColumns)) {
        await txn.execAsync(`
          CREATE TABLE IF NOT EXISTS ingredients_next (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            is_allergen INTEGER NOT NULL DEFAULT 0
          );
          INSERT INTO ingredients_next (id, name, is_allergen)
          SELECT id, name, 0 FROM ingredients;
          DROP TABLE ingredients;
          ALTER TABLE ingredients_next RENAME TO ingredients;
        `);
      }

      if (needsDishIngredientsTableRebuild(dishIngredientColumns)) {
        await txn.execAsync(`
          CREATE TABLE IF NOT EXISTS dish_ingredients_next (
            dish_id INTEGER NOT NULL,
            ingredient_id INTEGER NOT NULL,
            ingredient_category_id INTEGER,
            is_mandatory INTEGER NOT NULL DEFAULT 0,
            is_default INTEGER NOT NULL DEFAULT 1,
            extra_price REAL NOT NULL DEFAULT 0,
            can_add INTEGER NOT NULL DEFAULT 1,
            can_remove INTEGER NOT NULL DEFAULT 1,
            sort_order INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY(dish_id, ingredient_id)
          );
          INSERT INTO dish_ingredients_next (
            dish_id,
            ingredient_id,
            ingredient_category_id,
            is_mandatory,
            is_default,
            extra_price,
            can_add,
            can_remove,
            sort_order
          )
          SELECT
            dish_id,
            ingredient_id,
            NULL,
            0,
            COALESCE(is_default, 1),
            COALESCE(extra_price, 0),
            1,
            1,
            0
          FROM dish_ingredients;
          DROP TABLE dish_ingredients;
          ALTER TABLE dish_ingredients_next RENAME TO dish_ingredients;
        `);
      }

      if (needsOrdersTableRebuild(orderColumns)) {
        await txn.execAsync(`
          CREATE TABLE IF NOT EXISTS orders_next (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            status TEXT NOT NULL,
            rejected_at TEXT,
            canceled_at TEXT,
            created_at TEXT NOT NULL
          );
          INSERT INTO orders_next (id, status, rejected_at, canceled_at, created_at)
          SELECT
            id,
            status,
            rejected_at,
            COALESCE(canceled_at, cancelled_at),
            created_at
          FROM orders;
          DROP TABLE orders;
          ALTER TABLE orders_next RENAME TO orders;
        `);
      }
    },
  },
  {
    version: 4,
    apply: async (txn) => {
      await txn.execAsync(`
        ALTER TABLE categories ADD COLUMN source TEXT NOT NULL DEFAULT 'operator';
        ALTER TABLE categories ADD COLUMN external_key TEXT;
        ALTER TABLE dishes ADD COLUMN source TEXT NOT NULL DEFAULT 'operator';
        ALTER TABLE dishes ADD COLUMN external_key TEXT;
        ALTER TABLE offers ADD COLUMN source TEXT NOT NULL DEFAULT 'operator';
        ALTER TABLE offers ADD COLUMN external_key TEXT;
        ALTER TABLE banner_images ADD COLUMN source TEXT NOT NULL DEFAULT 'operator';
        ALTER TABLE banner_images ADD COLUMN external_key TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_banner_images_external_key ON banner_images(external_key);
      `);
    },
  },
  {
    version: 5,
    apply: async (txn) => {
      const ingredientColumns = (
        await txn.getAllAsync<{ name?: string }>('PRAGMA table_info(ingredients)')
      )
        .map((row) => row.name)
        .filter((name): name is string => typeof name === 'string');

      if (!hasColumn(ingredientColumns, 'is_allergen')) {
        await txn.execAsync(
          'ALTER TABLE ingredients ADD COLUMN is_allergen INTEGER NOT NULL DEFAULT 0'
        );
      }
    },
  },
  {
    version: 6,
    apply: async (txn) => {
      const orderColumns = (
        await txn.getAllAsync<{ name?: string }>('PRAGMA table_info(orders)')
      )
        .map((row) => row.name)
        .filter((name): name is string => typeof name === 'string');

      if (!hasColumn(orderColumns, 'rider_latitude')) {
        await txn.execAsync('ALTER TABLE orders ADD COLUMN rider_latitude REAL');
      }
      if (!hasColumn(orderColumns, 'rider_longitude')) {
        await txn.execAsync('ALTER TABLE orders ADD COLUMN rider_longitude REAL');
      }
      if (!hasColumn(orderColumns, 'last_location_update')) {
        await txn.execAsync('ALTER TABLE orders ADD COLUMN last_location_update TEXT');
      }
      if (!hasColumn(orderColumns, 'updated_at')) {
        await txn.execAsync('ALTER TABLE orders ADD COLUMN updated_at TEXT');
      }
    },
  },
  {
    version: 7,
    apply: async (txn) => {
      await txn.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_rider_id ON orders(rider_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_reviews_dish_id ON reviews(dish_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      `);
    },
  },
];

export async function runMigrations(database: MigrationRunner) {
  await database.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('PRAGMA foreign_keys = OFF');
    try {
      await txn.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL
        );
      `);

      const rows = await txn.getAllAsync<{ version?: number }>(
        'SELECT version FROM schema_migrations ORDER BY version'
      );
      const appliedVersions = new Set(
        rows.map((row) => row.version).filter((version): version is number => typeof version === 'number')
      );

      for (const migration of migrations) {
        if (appliedVersions.has(migration.version)) {
          continue;
        }

        await migration.apply(txn);
        await txn.runAsync(
          'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
          migration.version,
          new Date().toISOString()
        );
      }
    } finally {
      await txn.execAsync('PRAGMA foreign_keys = ON');
    }
  });
}

export const migrationInternals = {
  needsIngredientsTableRebuild,
  needsDishIngredientsTableRebuild,
  needsOrdersTableRebuild,
  runMigrations,
};
