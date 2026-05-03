# Migration Strategy Remediation

## Scope

Replace destructive schema drift handling in [repository.ts](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:272) with deterministic, versioned SQLite migrations that preserve orders, refunds, reviews, notifications, and audit history.

## Current Risk

The current `migrateSchema()` implementation inspects `dish_ingredients` and, if `ingredient_category_id` is missing, drops a broad set of operational tables including `orders`, `order_items`, `refund_requests`, `reviews`, and `audit_logs`. This behavior is acceptable only for disposable demo data.

Affected code:

- [repository.ts](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:272)
- [repository.ts](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:285)
- [repository.ts](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:458)

## Best Solution

Adopt explicit schema versioning with forward-only migrations.

Core design:

1. Create a `schema_migrations` table with a single monotonically increasing version.
2. Define migrations as ordered functions: `v1`, `v2`, `v3`, etc.
3. Run pending migrations inside an exclusive transaction.
4. For additive changes, use `ALTER TABLE ... ADD COLUMN`.
5. For incompatible table shape changes, use create-copy-swap:
   - create `*_next`
   - copy and transform data with `INSERT INTO ... SELECT ...`
   - recreate indexes and foreign keys
   - rename tables
6. Never infer destructive actions from column absence alone.
7. Reserve destructive resets for explicit developer-only flows such as `resetDemoDatabase()`.

## Recommended Migration Layout

```ts
type Migration = {
  version: number;
  name: string;
  up: (txn: SqlRunner) => Promise<void>;
};

const migrations: Migration[] = [
  {
    version: 1,
    name: 'baseline_schema',
    up: async (txn) => {
      await txn.execAsync(`CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );`);

      // create baseline tables here
    },
  },
  {
    version: 2,
    name: 'add_ingredient_categories',
    up: async (txn) => {
      // create-copy-swap only for affected tables
    },
  },
];

async function runMigrations() {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(`PRAGMA foreign_keys = OFF;`);

    const applied = await txn.getAllAsync<{ version: number }>(
      `SELECT version FROM schema_migrations ORDER BY version`
    ).catch(() => []);

    const appliedSet = new Set(applied.map((row) => row.version));
    for (const migration of migrations) {
      if (appliedSet.has(migration.version)) continue;
      await migration.up(txn);
      await txn.runAsync(
        `INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)`,
        migration.version,
        migration.name,
        new Date().toISOString()
      );
    }

    await txn.execAsync(`PRAGMA foreign_keys = ON;`);
  });
}
```

## Production Rollout

1. Freeze new schema edits in `execSchema()` until migration ownership is established.
2. Introduce `schema_migrations` and convert current `execSchema()` into baseline `v1`.
3. Move `rebuildIngredientsTableIfNeeded()` and `rebuildOrdersTableIfNeeded()` into named versioned migrations.
4. Delete the broad-drop logic from `migrateSchema()`.
5. Add a guarded developer reset path behind `__DEV__` or a build flag.
6. Add backup/export before first production migration if existing installs matter.
7. Add telemetry for migration start, success, failure, and version.

## Design Constraints

- Idempotent: rerunning startup must be safe.
- Atomic: partially applied migrations must roll back.
- Observable: record applied version and failure point.
- Narrow blast radius: only mutate tables touched by the migration.
- Backward-safe: preserve immutable business history tables.

## Validation

### Test cases

1. Fresh install:
   - Expect all tables created.
   - Expect latest schema version recorded.
2. Upgrade from legacy schema missing `ingredient_category_id`:
   - Expect `dish_ingredients` migrated.
   - Expect `orders`, `refund_requests`, `reviews`, and `audit_logs` row counts unchanged.
3. Upgrade from legacy `cancelled_at` schema:
   - Expect `orders.status` normalized to `rejected` or `canceled`.
   - Expect timestamps preserved.
4. Interrupted migration:
   - Simulate failure during copy.
   - Expect transaction rollback and old tables intact.
5. Re-entry:
   - Run startup twice.
   - Expect no duplicate columns, no duplicate migration records, no data loss.

### Verification queries

```sql
SELECT version, name, applied_at FROM schema_migrations ORDER BY version;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM refund_requests;
SELECT COUNT(*) FROM reviews;
SELECT COUNT(*) FROM audit_logs;
PRAGMA table_info(dish_ingredients);
PRAGMA foreign_key_check;
PRAGMA integrity_check;
```

### Repo checks

```bash
npm run lint
npm run typecheck
npm test
```

## Recommendation

The best solution is not to harden the current drift detector. Remove it and replace it with explicit versioned migrations plus a separate opt-in demo reset path. That gives deterministic upgrades, preserves customer and financial records, and scales as more schema changes are added.

## Explanations

Schema drift heuristics are brittle because they convert an observation about one table into a destructive assumption about the whole database. Versioned migrations move the decision from runtime guesswork into source-controlled intent, which is the correct control plane for regulated or business-critical records.
