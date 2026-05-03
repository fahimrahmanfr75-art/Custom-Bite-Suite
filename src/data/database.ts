import { db } from './schema';

const tableNames = [
  'users',
  'app_session',
  'categories',
  'ingredient_categories',
  'dishes',
  'ingredients',
  'dish_ingredients',
  'offers',
  'orders',
  'order_items',
  'order_item_customizations',
  'reviews',
  'refund_requests',
  'audit_logs',
  'banner_images',
  'app_notifications',
] as const;

type TableName = (typeof tableNames)[number];
type DatabaseJson = Partial<Record<TableName, unknown[]>> & { exportedAt?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateDatabaseJson(value: unknown): asserts value is DatabaseJson {
  if (!isRecord(value)) {
    throw new Error('Database import payload must be a JSON object');
  }

  for (const tableName of tableNames) {
    const rows = value[tableName];
    if (rows !== undefined && !Array.isArray(rows)) {
      throw new Error(`Database import payload contains invalid rows for ${tableName}`);
    }
  }
}

function toSqliteValue(value: unknown) {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    value instanceof Uint8Array
  ) {
    return value;
  }
  return JSON.stringify(value);
}

async function clearAllTables() {
  await db.execAsync('PRAGMA foreign_keys = OFF');
  try {
    for (const tableName of [...tableNames].reverse()) {
      await db.execAsync(`DELETE FROM ${tableName}`);
    }
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON');
  }
}

async function insertTableRows(tableName: TableName, rows: unknown[]) {
  for (const row of rows) {
    if (!isRecord(row)) {
      throw new Error(`Database import row for ${tableName} must be an object`);
    }

    const entries = Object.entries(row);
    if (entries.length === 0) {
      continue;
    }

    const columns = entries.map(([column]) => column).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    await db.runAsync(
      `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
      ...entries.map(([, value]) => toSqliteValue(value))
    );
  }
}

export async function exportDatabaseJson(): Promise<string> {
  const tableEntries = await Promise.all(
    tableNames.map(async (tableName) => [tableName, await db.getAllAsync(`SELECT * FROM ${tableName}`)] as const)
  );

  return JSON.stringify(
    {
      ...Object.fromEntries(tableEntries),
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

export async function importDatabaseJson(jsonString: string): Promise<void> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Database import payload is not valid JSON');
  }

  validateDatabaseJson(parsed);
  await clearAllTables();

  for (const tableName of tableNames) {
    await insertTableRows(tableName, parsed[tableName] ?? []);
  }
}

export async function resetDatabase(): Promise<void> {
  await clearAllTables();

  const { seedDatabase } = await import('./seed');
  await seedDatabase();
}
