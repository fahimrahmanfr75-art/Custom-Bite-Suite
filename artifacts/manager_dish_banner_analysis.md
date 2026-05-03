# Why the Manager Can't Edit/Add Dishes and Banners

## Summary

The UI code for editing/adding dishes and banners is **fully implemented** in `ManagerDashboard.tsx`. The buttons, forms, modals, and context actions all exist. The issue is in the **data layer** — the `upsertDishRecord` function in `dishes.ts` is incomplete and will silently lose ingredient data, and the schema is missing a required table.

---

## Issue 1: `upsertDishRecord` Ignores Ingredients Entirely

**File:** [dishes.ts](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/dishes.ts#L168-L208)

The `ManagerDishPayload` type includes a rich `ingredientCategories` array with nested ingredients, but `upsertDishRecord` **only writes to the `dishes` table**. It completely ignores:

- `payload.ingredientCategories` — never processed
- The `ingredients` table — never receives INSERT/UPDATE
- The `dish_ingredients` junction table — never receives INSERT/UPDATE

```diff
 // Current: only updates the dish row
 await db.runAsync(
   `UPDATE dishes SET category_id = ?, name = ?, ... WHERE id = ?`,
   payload.categoryId, payload.name, ...
 );

-// MISSING: No code to handle ingredients
+// NEEDED: Delete old dish_ingredients, upsert ingredients, re-insert dish_ingredients
```

**Impact:** When the manager saves a dish, the dish row updates fine, but **all ingredient data is discarded**. Since the dish price is derived from default-selected ingredient prices (`calculateEditingDishPrice`), the dish effectively has price `$0.00` after save, or retains stale ingredient data from seed.

---

## Issue 2: No `ingredient_categories` Table in Schema

**File:** [schema.ts](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/schema.ts)

The `ManagerDishPayload` and `IngredientCategory` type both reference ingredient categories as a concept, but:

- There is **no `ingredient_categories` table** in the database schema
- The `dish_ingredients` table has no `category` concept — no `ingredient_category_id` column
- The snapshot hardcodes `ingredientCategories: []` in [appStoreImpl.ts:70](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/state/appStoreImpl.ts#L70)
- The `getDishes()` query sets `ingredientCategoryId: 0` and `ingredientCategoryName: ''` for every ingredient ([dishes.ts:121-122](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/dishes.ts#L121-L122))

**Impact:** The ingredient category feature in the dish editor UI is a dead form — the data has nowhere to be stored and nowhere to be loaded from.

---

## Issue 3: Banner Save Works, But Error Handling May Hide Failures

**File:** [ManagerDashboard.tsx:1154](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/screens/ManagerDashboard.tsx#L1154)

```typescript
onPress={() => void upsertBanner(editingBanner).then(() => setEditingBanner(null))}
```

The banner save path (`upsertBanner` → `upsertBannerImage`) is actually **correctly wired**:
- `AppContext.tsx` calls `upsertBannerImage(session.userId, payload)` ✅
- `banners.ts` runs the correct INSERT/UPDATE SQL ✅
- `refreshAppStore(['catalog'])` is called after ✅

However, the `.then()` chain has **no `.catch()`**, so if the `wrap()` throws (e.g. session missing, SQL error), the error is swallowed and the modal stays open with no feedback. The `wrap()` function in AppContext does set `errorMessage`, but the banner modal doesn't display it.

---

## Root Cause Summary

| Feature | UI | Context Action | Data Layer | Verdict |
|---------|-----|---------------|------------|---------|
| **Add/Edit Dish** | ✅ Full form | ✅ `upsertMenuDish` | ❌ Only saves `dishes` table, ignores ingredients | **Broken** — ingredients lost |
| **Add/Edit Banner** | ✅ Full modal | ✅ `upsertBanner` | ✅ Correct SQL | **Works** — but errors are hidden |

---

## Recommended Fixes

### Fix 1: Complete `upsertDishRecord` to Handle Ingredients

The function needs to:
1. INSERT-or-UPDATE into the `ingredients` table for each ingredient name
2. DELETE old `dish_ingredients` rows for the dish
3. INSERT new `dish_ingredients` rows linking the dish to its ingredients

### Fix 2: Add `ingredient_categories` Table to Schema

Add a new table and a foreign key in `dish_ingredients`:
```sql
CREATE TABLE IF NOT EXISTS ingredient_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dish_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE
);
```

And add an `ingredient_category_id` column to `dish_ingredients`.

### Fix 3: Display Error in Banner Modal

Show the `errorMessage` from the context inside the banner editing modal so the manager gets feedback on failures.
