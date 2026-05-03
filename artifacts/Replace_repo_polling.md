**Solution**

Scope: replace the global `loadSnapshot()` polling loop in [AppContext.tsx](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/context/AppContext.tsx:111) and [AppContext.tsx](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/context/AppContext.tsx:139) with an event-driven store that supports domain-level subscriptions.

Best solution: introduce a small application store on top of the repository, then publish targeted invalidation events after each mutation.

1. Split the monolithic `AppSnapshot` into domains: `session`, `catalog`, `orders`, `notifications`, `metrics`.
2. Expose repository subscriptions:
   `subscribe(topic, listener)`, `emit(topic)`, `getSnapshot(topic, session?)`.
3. After each write operation, emit only the affected topics.
   `placeOrder` => `orders`, `notifications`, `metrics`
   `submitReview` => `catalog`
   `markNotificationRead` => `notifications`
4. In React, replace the single context snapshot with per-domain hooks using `useSyncExternalStore`.
   `useOrders()`, `useCatalog()`, `useNotifications()`, `useSession()`
5. Keep `refresh()` only for bootstrap, manual retry, and a bounded fallback for local-only demos.
6. If you later move to a server API, map the same topic model to query invalidation plus push transport:
   HTTP writes + React Query cache invalidation
   SSE/WebSocket for `orders` and `notifications`

This is materially better than “poll less often” because the current problem is not just frequency. The real defect is that every refresh reloads all sections in [repository.ts](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1910) and republishes one large context value, which forces broad rerenders.

**Explanations**

Why the current model is brittle:

- [AppContext.tsx](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/context/AppContext.tsx:144) polls every 5 seconds after login whether data changed or not.
- [repository.ts](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1921) reloads offers, banners, categories, ingredients, dishes, orders, session, user, notifications, audit logs, and recomputes metrics on every poll.
- [AppContext.tsx](/c:/Users/User/Desktop/FOA/custom-bite-suite/src/context/AppContext.tsx:175) rebuilds one context object from the full snapshot, so consumers that only need `notifications` or `orders` still rerender when unrelated sections change.
- This is acceptable for a local SQLite demo, but it scales poorly in three dimensions: database reads, React work, and network/API cost.

Why an evented store is the right target:

- It preserves the local repository model. No backend is required to get the benefit.
- It is deterministic. Writes already go through repository functions, so that is the correct place to emit invalidations.
- It avoids stale UI without background churn.
- It gives a clean migration path to a real API. “topic invalidation” becomes “cache invalidation + push updates”, not a second rewrite.

Recommended design shape:

```ts
type StoreTopic =
  | 'session'
  | 'catalog'
  | 'orders'
  | 'notifications'
  | 'metrics';

type AppStore = {
  getSnapshot<T>(topic: StoreTopic): T;
  subscribe(topic: StoreTopic, listener: () => void): () => void;
  invalidate(topics: StoreTopic[]): Promise<void>;
};
```

Mutation pattern:

```ts
export async function placeOrder(...) {
  await db.withExclusiveTransactionAsync(async (txn) => {
    // write order, items, notifications, audit
  });

  await appStore.invalidate(['orders', 'notifications', 'metrics']);
}
```

React hook pattern:

```ts
export function useOrders() {
  return useSyncExternalStore(
    (onStoreChange) => appStore.subscribe('orders', onStoreChange),
    () => appStore.getSnapshot<Order[]>('orders')
  );
}
```

What not to do:

- Do not keep the giant `AppSnapshot` context and just increase the interval.
- Do not trigger full `loadSnapshot()` after every mutation forever.
- Do not move polling down into multiple screens; that only hides the same problem in more places.

**Validation**

Test cases:

- `placeOrder` updates customer order list without reloading banners/categories.
- `markNotificationRead` updates unread count without rerendering order screens.
- `submitReview` updates dish ratings without reloading orders.
- idle logged-in session performs zero periodic repository reads.
- manager advancing an order updates rider/customer order views and notifications only.

Validation code direction:

```ts
it('does not reload unrelated domains on notification read', async () => {
  const getOrders = vi.spyOn(repo, 'getOrders');
  const getNotifications = vi.spyOn(repo, 'getNotifications');

  await markNotificationRead(1);

  expect(getNotifications).toHaveBeenCalled();
  expect(getOrders).not.toHaveBeenCalled();
});
```

```ts
it('notifies only subscribed consumers', async () => {
  const ordersListener = vi.fn();
  const catalogListener = vi.fn();

  const off1 = appStore.subscribe('orders', ordersListener);
  const off2 = appStore.subscribe('catalog', catalogListener);

  await placeOrder(...);

  expect(ordersListener).toHaveBeenCalled();
  expect(catalogListener).not.toHaveBeenCalled();

  off1();
  off2();
});
```

Lint/checks:

```bash
npm test
npm run lint
npx tsc --noEmit
```