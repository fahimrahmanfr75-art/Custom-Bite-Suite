## 1. New Regressions Introduced 🔴

### 1.1 🔴 CRITICAL: Notifications System is Completely Broken

The `app_notifications` table **does not exist** in the schema ([schema.ts](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/schema.ts)). It was likely removed during the refactoring. Yet:

- [notifications.ts](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/notifications.ts) queries `SELECT * FROM app_notifications` (line 7)
- [notifications.ts](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/notifications.ts) writes `UPDATE app_notifications` (lines 31, 38)
- [appStoreImpl.ts](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/state/appStoreImpl.ts) returns hardcoded `{ notifications: [] }` (line 76) — it **never calls** `getNotifications()`
- **No code in the entire codebase ever `INSERT`s into `app_notifications`**

**Impact:** The in-app notification toasts in [App.tsx](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/App.tsx) (lines 21–46) will never fire. The notification bell count will always be 0. If `getNotifications()` were ever called, it would crash with a SQL error.

### 1.2 🟡 `importDatabaseJson()` is a Dead Function

The function exists in the export list and is wired into AppContext via `importData`, but calling it will **always throw an error**:

```typescript
export async function importDatabaseJson(jsonString: string): Promise<void> {
  throw new Error('Database import not fully implemented');
}
```

### 1.3 Line Ending Standards Established

A [.gitattributes](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/.gitattributes) file was added enforcing `eol=lf` for all text files. This addresses the old audit's mixed CRLF/LF concern.

> [!WARNING]
> Despite `.gitattributes`, many source files **still have CRLF** line endings on disk (e.g., `schema.ts`, `orders.ts`, `auth.ts`). The `.gitattributes` only normalizes on git operations — existing files were not converted.
---

## 2. Remaining Database Issues (Carried Over)

### 2.1 🟡 `exportDatabaseJson()` is Incomplete

- Only exports 6 of 14 tables. Missing: `order_items`, `order_item_customizations`, `dish_ingredients`, `ingredients`, `reviews`, `refund_requests`, `banner_images`, `app_session`.
- An export/re-import would lose most relational data.

---

## 3. Recommended Improvement Approach

### Fix Critical Regressions & Stabilize (Priority: Immediate)

| # | Task | Impact |
|:---:|---|:---:|
| 1 | **Add `app_notifications` CREATE TABLE** back to `schema.ts` | 🔴 Fixes crash |
| 2 | **Wire `getNotifications()` into `appStoreImpl.ts`** (currently hardcoded `[]`) | 🔴 Restores feature |
| 3 | **Add notification INSERT logic** in order lifecycle (`advanceOrder`, `placeOrder`, etc.) | 🔴 Feature completeness |
| 4 | **Implement `importDatabaseJson()`** or remove the dead function | 🟡 Remove dead code |
| 5 | **Complete `exportDatabaseJson()`** to include all 14 tables | 🟡 Data integrity |
| 6 | **Normalize CRLF → LF** on existing source files | 🟢 Code hygiene |

---