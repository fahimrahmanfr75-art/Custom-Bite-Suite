**Solution**

The best solution is to make initialization strictly non-destructive and split it into three separate concerns in [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:2079>):

1. `initializeRepository()` should do only:
   - schema creation/migrations
   - one-time bootstrap if the database is empty
   - safe data repairs that preserve operator edits

2. curated content sync from [syncCuratedRestaurantMenu()](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1075>) must be removed from startup and turned into an explicit admin/import operation

3. curated rows must become ownership-aware:
   - add `managed_by` or `source` columns on `categories`, `dishes`, `banner_images`, `offers`
   - values: `system_seed`, `curated_import`, `operator`
   - only rows owned by `curated_import` may be updated by a curated sync job
   - operator rows are never deleted or overwritten automatically

Recommended target behavior:

```ts
export async function initializeRepository() {
  await execSchema();
  await seedDatabaseIfEmpty();
  await runNonDestructiveRepairs();
}
```

```ts
async function runNonDestructiveRepairs() {
  await normalizeStoredDishPricesSafely();
  await backfillOrderItemIngredientSnapshots();
}
```

```ts
export async function importCuratedContent(options: {
  mode: 'initial_only' | 'merge_curated_owned';
}) {
  // explicit operation, not startup behavior
}
```

For banners/offers specifically, stop doing global deletes. The current `DELETE FROM banner_images; DELETE FROM offers;` is the highest-risk behavior in the file. Replace it with keyed upserts against curated-owned records only.

Recommended schema additions:

```sql
ALTER TABLE dishes ADD COLUMN source TEXT NOT NULL DEFAULT 'operator';
ALTER TABLE banner_images ADD COLUMN source TEXT NOT NULL DEFAULT 'operator';
ALTER TABLE offers ADD COLUMN source TEXT NOT NULL DEFAULT 'operator';
ALTER TABLE categories ADD COLUMN source TEXT NOT NULL DEFAULT 'operator';

CREATE UNIQUE INDEX IF NOT EXISTS idx_dishes_curated_key ON dishes(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_banners_curated_key ON banner_images(title);
CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_curated_key ON offers(title);
```

Better than title/name if possible: add stable external keys:

```sql
ALTER TABLE dishes ADD COLUMN external_key TEXT;
ALTER TABLE banner_images ADD COLUMN external_key TEXT;
ALTER TABLE offers ADD COLUMN external_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_dishes_external_key ON dishes(external_key);
```

Then curated import becomes:

- upsert rows by `external_key`
- update only where `source IN ('system_seed', 'curated_import')`
- never touch `source = 'operator'`
- optionally soft-disable curated rows no longer present in the bundle instead of deleting them

Suggested policy:

- `seedDatabaseIfEmpty()` from [seedDatabase()](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1309>) is allowed only when core tables are empty
- curated import is manual, versioned, and auditable
- price normalization from [normalizeStoredDishPrices()](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1169>) must not rewrite manager-entered dish prices unless it is recomputing a declared derived field
- snapshot backfill from [backfillOrderItemIngredientSnapshots()](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1242>) is acceptable on startup because it is restorative, not authoritative

Validation cases:

```ts
it('does not overwrite operator-created banner on app restart', async () => {}
it('does not delete operator-created offer during curated import', async () => {}
it('updates curated-owned dish when external_key matches', async () => {}
it('skips operator-owned dish even if name matches curated content', async () => {}
it('runs seed only on empty database', async () => {}
it('allows snapshot backfill without mutating live catalog content', async () => {}
```

Minimal lint/verification pass after refactor:

```powershell
rg -n "initializeRepository|syncCuratedRestaurantMenu|DELETE FROM banner_images|DELETE FROM offers|source|external_key" src/data/repository.ts
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
```

**Explanations**

The root problem is not just “startup does too much.” It is that [initializeRepository()](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:2079>) mixes lifecycle-safe work with business-authoritative writes. Schema setup and repair are startup-safe. Catalog imports are not. Once startup owns menu, banner, and offer state, admin edits become cache, not source of truth.

The safest design is ownership-based reconciliation. “Curated” and “operator” content must be distinguishable at the row level. Without that, any sync logic eventually falls back to brittle heuristics like matching by name and deleting whole tables. That is exactly what the current banner/offer path does.

Why this is the best fit here:

- It is the smallest architecture change that actually restores trust in admin data.
- It preserves demo/bootstrap capability without sacrificing live operability.
- It creates a clean future path to server-backed sync, because `external_key` and `source` map naturally to real import pipelines.
- It avoids hidden destructive behavior during app launch, which is the wrong time to perform catalog authority decisions.

What not to do:

- Do not keep curated sync on startup behind a boolean like `if (!hasSyncedBefore)`. That only hides the issue and still couples startup to content authority.
- Do not match curated/operator rows by display name alone.
- Do not delete/recreate banners/offers wholesale under any production-like workflow.
