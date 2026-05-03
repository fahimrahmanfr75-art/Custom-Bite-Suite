let mockDefaultDb: {
  execAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  runAsync: jest.Mock;
  withExclusiveTransactionAsync: jest.Mock;
};

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  digestStringAsync: jest.fn(async () => 'hash'),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => {
    let insertId = 100;
    mockDefaultDb = {
      execAsync: jest.fn(async () => undefined),
      getAllAsync: jest.fn(async (sql: string) => {
        if (sql.includes('SELECT version FROM schema_migrations')) {
          return [];
        }
        if (sql.includes('PRAGMA table_info')) {
          return [];
        }
        return [];
      }),
      getFirstAsync: jest.fn(async () => null),
      runAsync: jest.fn(async () => ({ changes: 1, lastInsertRowId: ++insertId })),
      withExclusiveTransactionAsync: jest.fn(async (callback: (txn: unknown) => Promise<void>) => {
        await callback(mockDefaultDb);
      }),
    };

    return mockDefaultDb;
  }),
}));

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
}));

import { importCuratedContent, initializeRepository } from '../src/data/repository';

function getWriteSql() {
  return [
    ...mockDefaultDb.execAsync.mock.calls.map(([sql]) => String(sql)),
    ...mockDefaultDb.runAsync.mock.calls.map(([sql]) => String(sql)),
  ].join('\n');
}

describe('repository initialization and curated import', () => {
  beforeEach(() => {
    mockDefaultDb.execAsync.mockClear();
    mockDefaultDb.getAllAsync.mockClear();
    mockDefaultDb.getFirstAsync.mockClear();
    mockDefaultDb.runAsync.mockClear();
    mockDefaultDb.withExclusiveTransactionAsync.mockClear();
  });

  it('initializes without running destructive curated sync on startup', async () => {
    mockDefaultDb.getFirstAsync.mockImplementation(async (sql: string) => {
      if (sql.includes('SELECT COUNT(*) as count FROM order_item_ingredients')) {
        return { count: 1 };
      }
      if (sql.includes('SELECT COUNT(*) as count FROM')) {
        return { count: 0 };
      }
      return null;
    });

    await initializeRepository();

    const sql = getWriteSql();

    expect(sql).toContain('system_seed');
    expect(sql).not.toContain("INSERT INTO banner_images\n      (image_url, title, description, is_active, sort_order, created_at, source, external_key)\n     VALUES (?, ?, ?, ?, ?, ?, 'curated_import', ?)");
    expect(sql).not.toContain("INSERT INTO offers\n      (title, description, discount_percent, active_from, active_to, banner_color, source, external_key)\n     VALUES (?, ?, ?, ?, ?, ?, 'curated_import', ?)");
    expect(sql).not.toContain('DELETE FROM banner_images');
    expect(sql).not.toContain('DELETE FROM offers');
  });

  it('skips operator-owned curated matches during merge import', async () => {
    mockDefaultDb.getFirstAsync.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM categories')) {
        return { id: 1, source: 'operator' };
      }
      if (sql.includes('FROM dishes')) {
        return { id: 2, source: 'operator', external_key: null };
      }
      if (sql.includes('FROM banner_images')) {
        return { id: 3, source: 'operator' };
      }
      if (sql.includes('FROM offers')) {
        return { id: 4, source: 'operator' };
      }
      return null;
    });

    await importCuratedContent({ mode: 'merge_curated_owned' });

    const sql = getWriteSql();

    expect(sql).not.toContain('DELETE FROM banner_images');
    expect(sql).not.toContain('DELETE FROM offers');
    expect(sql).not.toContain('UPDATE banner_images');
    expect(sql).not.toContain('INSERT INTO banner_images');
    expect(sql).not.toContain('UPDATE offers');
    expect(sql).not.toContain('INSERT INTO offers');
    expect(sql).not.toContain("source = 'curated_import', external_key");
  });

  it('updates managed curated rows by key without global deletes', async () => {
    mockDefaultDb.getFirstAsync.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM categories')) {
        return { id: 11, source: 'system_seed' };
      }
      if (sql.includes('FROM dishes')) {
        return { id: 12, source: 'system_seed', external_key: 'dish:legacy' };
      }
      if (sql.includes('FROM banner_images')) {
        return { id: 13, source: 'system_seed' };
      }
      if (sql.includes('FROM offers')) {
        return { id: 14, source: 'system_seed' };
      }
      return null;
    });

    await importCuratedContent({ mode: 'merge_curated_owned' });

    const sql = getWriteSql();

    expect(sql).toContain('UPDATE dishes');
    expect(sql).toContain('UPDATE banner_images');
    expect(sql).toContain('UPDATE offers');
    expect(sql).not.toContain('DELETE FROM banner_images');
    expect(sql).not.toContain('DELETE FROM offers');
  });
});
