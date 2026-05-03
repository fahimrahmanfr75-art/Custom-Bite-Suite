# Repository Authorization Remediation

## Scope

This document covers repository-layer authorization for the following mutating operations in [src/data/repository.ts](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts):

- `markNotificationRead` at line 2142
- `upsertDishRecord` at line 2451
- `deleteDishRecord` at line 2566
- `updateRefundDecision` at line 2758
- `assignOrderRider` at line 2779
- `confirmCash` at line 2785

Existing repository methods already demonstrate the intended pattern:

- `advanceOrder` at line 2572
- `rejectOrder` at line 2643
- `cancelOrderByCustomer` at line 2689
- `claimOrderByRider` at line 2722

## Best Solution

Move authorization to the repository boundary and make every sensitive write operation validate:

1. actor identity exists
2. actor role is allowed for the action
3. target resource exists
4. ownership or assignment matches when action is not purely role-based
5. domain-state preconditions are satisfied before update

Do not rely on `AppContext` or screen visibility for authorization. Those are UX gates, not trust boundaries.

## Recommended Design

Introduce small repository-local authorization helpers and require every mutating function to call them before any `UPDATE`, `INSERT`, or `DELETE`.

Suggested helpers:

```ts
async function requireActor(actorUserId: number) {
  const actor = await db.getFirstAsync<Pick<UserRow, 'id' | 'role'>>(
    `SELECT id, role FROM users WHERE id = ?`,
    actorUserId
  );
  if (!actor) {
    throw new Error('Actor user not found');
  }
  return actor;
}

function requireRole(actor: Pick<UserRow, 'role'>, ...roles: Role[]) {
  if (!roles.includes(actor.role)) {
    throw new Error(`Only ${roles.join(' or ')} can perform this action`);
  }
}
```

Use resource-specific helpers where ownership matters:

```ts
async function requireNotificationRecipient(actorUserId: number, notificationId: number) {
  const notification = await db.getFirstAsync<Pick<NotificationRow, 'id' | 'audience' | 'recipient_user_id' | 'recipient_role'>>(
    `SELECT id, audience, recipient_user_id, recipient_role FROM notifications WHERE id = ?`,
    notificationId
  );
  if (!notification) {
    throw new Error('Notification not found');
  }

  const actor = await requireActor(actorUserId);
  const allowed =
    (notification.audience === 'user' && notification.recipient_user_id === actorUserId) ||
    (notification.audience === 'role' && notification.recipient_role === actor.role);

  if (!allowed) {
    throw new Error('Notification does not belong to this actor');
  }

  return { actor, notification };
}
```

## Authorization Matrix

`upsertDishRecord`
- allow: `manager`
- deny: `customer`, `rider`
- additional checks: `payload.id` exists before update; category exists; fail closed if update affects 0 rows

`deleteDishRecord`
- allow: `manager`
- deny: `customer`, `rider`
- additional checks: dish exists before delete; optionally block delete if active orders reference it unless cascade semantics are intentional

`updateRefundDecision`
- allow: `manager`
- deny: `customer`, `rider`
- additional checks: refund exists; refund status must still be `requested`; reject second review; optionally require non-empty resolution note for denial

`assignOrderRider`
- allow: `manager`
- deny: `customer`, `rider`
- additional checks: order exists; rider exists and has role `rider`; order state must allow assignment, preferably `ready` or `on_the_way`; if already assigned, decide whether reassignment is allowed and enforce it explicitly

`confirmCash`
- allow: `manager`, or assigned `rider` if business flow permits rider cash confirmation
- deny: all others
- additional checks: order exists; payment method must be `cod`; payment status must be `cod_pending`; if rider is allowed, `order.rider_id === actorUserId`

`markNotificationRead`
- signature should become `markNotificationRead(actorUserId: number, notificationId: number)`
- allow: only the addressed user or members of the addressed role audience
- deny: anyone else
- additional checks: notification exists; update should include authorization predicate in SQL

## Implementation Pattern

Preferred approach: authorization and mutation inside one transaction or one conditional SQL statement so the checked state cannot drift before update.

Examples:

```ts
export async function deleteDishRecord(actorUserId: number, dishId: number) {
  const actor = await requireActor(actorUserId);
  requireRole(actor, 'manager');

  const dish = await db.getFirstAsync<{ id: number }>(`SELECT id FROM dishes WHERE id = ?`, dishId);
  if (!dish) {
    throw new Error('Dish not found');
  }

  await db.runAsync(`DELETE FROM dishes WHERE id = ?`, dishId);
  await logAudit(db, actorUserId, 'dish', dishId, 'delete', 'Dish removed from menu');
  await invalidateAppStore(['catalog', 'audit']);
}
```

```ts
export async function markNotificationRead(actorUserId: number, notificationId: number) {
  const actor = await requireActor(actorUserId);

  const result = await db.runAsync(
    `UPDATE notifications
     SET is_read = 1
     WHERE id = ?
       AND (
         (audience = 'user' AND recipient_user_id = ?)
         OR (audience = 'role' AND recipient_role = ?)
       )`,
    notificationId,
    actorUserId,
    actor.role
  );

  if ((result.changes ?? 0) === 0) {
    throw new Error('Notification not found or not accessible');
  }

  await invalidateAppStore(['notifications']);
}
```

## Why This Is The Best Fit Here

- It matches the repository’s current responsibility. The file already owns domain validation and authorization in `advanceOrder`, `rejectOrder`, `cancelOrderByCustomer`, and `claimOrderByRider`.
- It is the smallest safe change. No new framework or policy engine is needed for this app size.
- It prevents bypass through alternate callers, tests, future screens, or direct context usage.
- It improves audit integrity because `actorUserId` will only be logged after authorization succeeds.

## Changes Required Outside The Repository

Update [src/context/AppContext.tsx](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/context/AppContext.tsx) so `readNotification` passes `session.userId` into `markNotificationRead`.

Suggested call shape:

```ts
const { session } = getAppStoreSnapshot('session');
if (!session) {
  throw new Error('Session missing');
}
await markNotificationRead(session.userId, notificationId);
```

## Validation Cases

Positive cases:

- manager can create, update, and delete dishes
- manager can approve or deny a requested refund exactly once
- manager can assign a rider to an eligible order
- assigned rider can confirm COD only if rider cash confirmation is allowed by policy
- notification recipient can mark own notification as read
- role-targeted recipient can mark role notification as read

Negative cases:

- customer cannot call `upsertDishRecord`
- rider cannot call `deleteDishRecord`
- customer cannot approve or deny refunds
- rider cannot assign a rider to an order
- customer cannot confirm COD for any order
- rider cannot confirm COD for another rider’s order
- user A cannot mark user B’s notification as read
- customer cannot mark manager-role notifications as read
- manager cannot re-review an already reviewed refund if idempotent second writes are disallowed

## Suggested Test Skeleton

```ts
describe('repository authorization', () => {
  it('rejects customer dish writes', async () => {
    await expect(upsertDishRecord(customerId, payload)).rejects.toThrow('Only manager');
  });

  it('rejects cross-user notification read', async () => {
    await expect(markNotificationRead(otherUserId, notificationId)).rejects.toThrow(
      'Notification not found or not accessible'
    );
  });

  it('rejects refund review by rider', async () => {
    await expect(updateRefundDecision(riderId, refundId, 'approved', 'ok')).rejects.toThrow(
      'Only manager'
    );
  });

  it('rejects COD confirmation for non-COD order', async () => {
    await expect(confirmCash(managerId, prepaidOrderId)).rejects.toThrow('Order is not COD');
  });
});
```

## Lint And Verification

Run:

```powershell
rg -n "export async function (upsertDishRecord|deleteDishRecord|updateRefundDecision|assignOrderRider|confirmCash|markNotificationRead)" src/data/repository.ts
```

Expected review rule:

- every repository write entrypoint must either call `requireActor` plus role/ownership helper, or encode the authorization predicate directly in SQL and check `result.changes`

## Recommended Priority

1. Change `markNotificationRead` signature and enforce recipient ownership.
2. Add `requireActor` and `requireRole`.
3. Apply manager-only checks to dish, refund, and rider-assignment writes.
4. Add state-aware checks to `confirmCash`.
5. Add regression tests for all unauthorized write attempts.

## Explanations

The root issue is not missing UI guards. The root issue is that the repository exposes privileged mutations without enforcing policy at the trust boundary. The best solution is therefore repository-level authorization with explicit role and ownership checks, aligned with the patterns already used in the same file. This keeps the code maintainable, closes the bypass path, and avoids introducing unnecessary architecture for a small local-first app.
