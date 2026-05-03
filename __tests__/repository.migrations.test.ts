jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  digestStringAsync: jest.fn(async () => 'hash'),
}));

jest.mock('expo-sqlite', () => {
  const defaultDb = {
    execAsync: jest.fn(async () => undefined),
    runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: 1 })),
    getFirstAsync: jest.fn(async () => null),
    getAllAsync: jest.fn(async () => []),
    withExclusiveTransactionAsync: jest.fn(async (callback: (txn: unknown) => Promise<void>) => {
      await callback(defaultDb);
    }),
  };

  return {
    openDatabaseSync: jest.fn(() => defaultDb),
  };
});

import { __migrationInternals } from '../src/data/repository';

type FakeRunner = {
  execAsync: jest.Mock<Promise<void>, [string]>;
  runAsync: jest.Mock<Promise<{ changes: number; lastInsertRowId: number }>, [string, ...unknown[]]>;
  getFirstAsync: jest.Mock<Promise<unknown>, [string]>;
  getAllAsync: jest.Mock<Promise<Array<{ name?: string; version?: number }>>, [string]>;
};

type FakeDatabase = FakeRunner & {
  withExclusiveTransactionAsync: jest.Mock<Promise<void>, [(txn: FakeRunner) => Promise<void>]>;
};

function createFakeDatabase(options?: {
  appliedVersions?: number[];
  ingredientsColumns?: string[];
  dishIngredientsColumns?: string[];
  ordersColumns?: string[];
  failOnSql?: string;
}) {
  const {
    appliedVersions = [],
    ingredientsColumns = ['id', 'name'],
    dishIngredientsColumns = [
      'id',
      'dish_id',
      'ingredient_id',
      'ingredient_category_id',
      'is_mandatory',
      'is_default',
      'extra_price',
      'can_add',
      'can_remove',
      'sort_order',
    ],
    ordersColumns = [
      'id',
      'status',
      'rejected_at',
      'canceled_at',
      'cash_collected_at',
      'customer_id',
      'customer_email',
      'rider_id',
      'rider_latitude',
      'rider_longitude',
      'address_line',
      'latitude',
      'longitude',
      'delivery_notes',
      'payment_method',
      'payment_status',
      'subtotal',
      'discount',
      'delivery_fee',
      'total',
      'created_at',
      'accepted_at',
      'preparing_at',
      'ready_at',
      'picked_up_at',
      'delivered_at',
    ],
    failOnSql,
  } = options ?? {};

  const execStatements: string[] = [];
  const runCalls: Array<{ sql: string; params: unknown[] }> = [];

  const runner: FakeRunner = {
    execAsync: jest.fn(async (sql: string) => {
      execStatements.push(sql);
      if (failOnSql && sql.includes(failOnSql)) {
        throw new Error(`forced failure for ${failOnSql}`);
      }
    }),
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      runCalls.push({ sql, params });
      return { changes: 1, lastInsertRowId: 1 };
    }),
    getFirstAsync: jest.fn(async (_sql: string) => null),
    getAllAsync: jest.fn(async (sql: string) => {
      if (sql.includes('SELECT version FROM schema_migrations')) {
        return appliedVersions.map((version) => ({ version }));
      }
      if (sql.includes('PRAGMA table_info(ingredients)')) {
        return ingredientsColumns.map((name) => ({ name }));
      }
      if (sql.includes('PRAGMA table_info(dish_ingredients)')) {
        return dishIngredientsColumns.map((name) => ({ name }));
      }
      if (sql.includes('PRAGMA table_info(orders)')) {
        return ordersColumns.map((name) => ({ name }));
      }
      return [];
    }),
  };

  const database: FakeDatabase = {
    ...runner,
    withExclusiveTransactionAsync: jest.fn(async (callback) => {
      await callback(runner);
    }),
  };

  return { database, execStatements, runCalls };
}

describe('repository migrations', () => {
  it('detects the legacy schemas that require rebuilds', () => {
    expect(__migrationInternals.needsIngredientsTableRebuild(['id', 'name', 'is_allergen'])).toBe(
      true
    );
    expect(
      __migrationInternals.needsDishIngredientsTableRebuild([
        'id',
        'dish_id',
        'ingredient_id',
        'is_default',
      ])
    ).toBe(true);
    expect(
      __migrationInternals.needsOrdersTableRebuild(['id', 'status', 'cancelled_at', 'created_at'])
    ).toBe(true);
    expect(
      __migrationInternals.needsOrdersTableRebuild([
        'id',
        'status',
        'rejected_at',
        'canceled_at',
        'created_at',
      ])
    ).toBe(false);
  });

  it('applies all migration versions on a fresh install', async () => {
    const { database, execStatements, runCalls } = createFakeDatabase();

    await __migrationInternals.runMigrations(database as never);

    expect(database.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(execStatements[0]).toContain('PRAGMA foreign_keys = OFF');
    expect(execStatements).toEqual(
      expect.arrayContaining([
        expect.stringContaining('CREATE TABLE IF NOT EXISTS schema_migrations'),
        expect.stringContaining('CREATE TABLE IF NOT EXISTS users'),
      ])
    );
    expect(runCalls.map((call) => call.params[0])).toEqual([1, 2, 3, 4]);
    expect(execStatements.at(-1)).toContain('PRAGMA foreign_keys = ON');
  });

  it('skips already applied versions and records only pending migrations', async () => {
    const { database, execStatements, runCalls } = createFakeDatabase({
      appliedVersions: [1, 2],
    });

    await __migrationInternals.runMigrations(database as never);

    expect(runCalls.map((call) => call.params[0])).toEqual([3, 4]);
    const baselineExec = execStatements.filter((sql) =>
      sql.includes('CREATE TABLE IF NOT EXISTS users')
    );
    expect(baselineExec).toHaveLength(0);
  });

  it('adds catalog ownership columns and external-key indexes', async () => {
    const { database, execStatements } = createFakeDatabase({
      appliedVersions: [1, 2, 3],
      ingredientsColumns: ['id', 'name'],
      dishIngredientsColumns: [
        'id',
        'dish_id',
        'ingredient_id',
        'ingredient_category_id',
        'is_mandatory',
        'is_default',
        'extra_price',
        'can_add',
        'can_remove',
        'sort_order',
      ],
      ordersColumns: [
        'id',
        'status',
        'rejected_at',
        'canceled_at',
        'cash_collected_at',
        'customer_id',
        'customer_email',
        'rider_id',
        'rider_latitude',
        'rider_longitude',
        'address_line',
        'latitude',
        'longitude',
        'delivery_notes',
        'payment_method',
        'payment_status',
        'subtotal',
        'discount',
        'delivery_fee',
        'total',
        'created_at',
        'accepted_at',
        'preparing_at',
        'ready_at',
        'picked_up_at',
        'delivered_at',
      ],
    });

    await __migrationInternals.runMigrations(database as never);

    expect(execStatements.join('\n')).toContain('ALTER TABLE categories ADD COLUMN source');
    expect(execStatements.join('\n')).toContain('ALTER TABLE dishes ADD COLUMN external_key');
    expect(execStatements.join('\n')).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_banner_images_external_key'
    );
  });

  it('re-enables foreign keys when a migration fails', async () => {
    const { database, execStatements } = createFakeDatabase({
      dishIngredientsColumns: ['id', 'dish_id', 'ingredient_id'],
      failOnSql: 'INSERT INTO dish_ingredients_next',
    });

    await expect(__migrationInternals.runMigrations(database as never)).rejects.toThrow(
      'forced failure for INSERT INTO dish_ingredients_next'
    );

    expect(execStatements[0]).toContain('PRAGMA foreign_keys = OFF');
    expect(execStatements.at(-1)).toContain('PRAGMA foreign_keys = ON');
  });
});
