**Solution**

Scope: remove destructive curated-content mutation from repository startup, add ownership-aware catalog metadata, and provide regression coverage.

Implemented changes:

1. `initializeRepository()` now performs only schema setup, empty-database seeding, and non-destructive repairs.
2. Curated catalog sync was removed from startup and replaced with explicit `importCuratedContent({ mode })`.
3. Added `source` and `external_key` columns to `categories`, `dishes`, `banner_images`, and `offers`.
4. Added migration `version = 4` to backfill ownership columns and external-key indexes safely.
5. Curated import now updates only `system_seed` and `curated_import` rows, and it no longer wipes `banner_images` or `offers`.
6. Manager edits to dishes and banners now transfer ownership to `operator` so later curated imports do not overwrite them.
7. Dish price normalization now runs only on managed catalog rows, not operator-owned rows.

Validation:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
```

Added regression tests:

- startup does not run destructive curated sync
- curated merge skips operator-owned rows
- curated merge updates managed rows without global deletes
- migration v4 adds ownership columns and external-key indexes

**Explanations**

The root defect was startup acting as catalog authority. That made repository initialization unsafe because launching the app could overwrite or delete manager-maintained data. The fix is to separate lifecycle-safe work from business-authoritative imports and to make ownership explicit at the row level.

The ownership model is the critical control:

- `system_seed`: bootstrap/demo rows owned by the repository
- `curated_import`: rows owned by explicit curated imports
- `operator`: rows owned by admin actions and therefore protected from automatic sync

This is the smallest change that prevents destructive restarts while preserving future import capability.
