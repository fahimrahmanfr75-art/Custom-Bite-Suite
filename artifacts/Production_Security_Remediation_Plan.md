## Solution

### Scope
Replace the current client-authoritative security model with a server-authoritative architecture. The mobile app may keep local cache and offline UX state, but it must no longer be the source of truth for:

- authentication
- user roles and privileges
- order lifecycle transitions
- refund approval state
- payment state
- audit logs

### Why the current design is not production-safe
The current repository makes the device database authoritative:

- [`src/data/repository.ts:241`](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:241>) hashes passwords with plain unsalted SHA-256.
- [`src/data/repository.ts:1366`](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1366>) loads `password_hash` back into the app `User` model.
- [`src/data/repository.ts:1798`](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1798>) loads all users, orders, and other privileged data from local SQLite into app state.
- [`src/data/repository.ts:1826`](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1826>) performs login by comparing a client-computed hash to a local DB row.
- [`src/types.ts:20`](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/types.ts:20>) defines `User.passwordHash` in the shared app type, which guarantees credential material is part of normal app state.

With device access, an attacker can modify SQLite rows and become manager/rider, mark orders paid, alter refunds, or rewrite audit history. This is a trust-boundary failure, not a hashing-only bug.

### Best solution
Implement a real backend and demote SQLite to a non-authoritative cache.

#### 1. Move authority to a backend
Create a backend service with a server-side database such as PostgreSQL. All privileged reads and writes must go through authenticated APIs:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `GET /orders`
- `POST /orders`
- `POST /orders/:id/advance`
- `POST /orders/:id/reject`
- `POST /orders/:id/cancel`
- `POST /refunds`
- `POST /refunds/:id/resolve`
- `POST /orders/:id/assign-rider`
- `POST /orders/:id/confirm-cash`

Every mutation must be validated and authorized on the server using the server-side user identity and role, never from client-submitted role claims.

#### 2. Replace password handling
Do not store or compare passwords in the client at all.

Minimum acceptable backend password model:

- Argon2id preferred, bcrypt acceptable if operational constraints require it
- unique random salt per password
- optional server-side pepper stored in secrets management
- rate limiting and lockout on login endpoints
- password reset flow with short-lived signed tokens

The client should send the password only over TLS to the backend login endpoint and never persist it or its derived hash.

#### 3. Remove credential material from app state
Delete `passwordHash` from the shared `User` type and from all repository/app snapshot payloads. The client should only receive a minimal profile object such as:

- `id`
- `role`
- `displayName`
- `email`
- feature flags or tenant metadata if needed

Session state should contain only tokens or opaque session identifiers stored in platform secure storage, not SQLite.

#### 4. Move payment truth out of the app
The app must not be able to mark card payments as paid by local state mutation. Payment truth must come from the payment processor or backend reconciliation.

Required model:

- card payments created and confirmed through a PSP such as Stripe
- backend verifies webhooks and updates order payment state
- COD confirmation is a privileged server mutation with audit attribution

#### 5. Make SQLite cache-only
If offline capability is required, SQLite can remain but only as:

- cached catalog data
- cached user-visible order history
- queued offline intents pending server sync

Rules for offline mode:

- local records are marked `pending_sync`, `synced`, or `conflicted`
- server version wins for all privileged entities
- signed-in identity is still backend-issued
- no local-only role elevation or payment/refund finalization

#### 6. Make audit logging server-side and append-only
Audit logs must be generated on the backend from authenticated requests and stored append-only. The client may display them, but never author them as the source of truth.

### Recommended migration path

#### Phase 1: Contain the immediate security flaw

- remove `passwordHash` from [`src/types.ts`](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/types.ts:20>)
- stop loading `password_hash` into app models in [`src/data/repository.ts`](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1356>)
- stop returning the full `users` table in the general app snapshot from [`src/data/repository.ts`](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1798>)
- move session persistence from SQLite to secure storage

This does not make the app production-safe, but it reduces credential exposure while backend work is underway.

#### Phase 2: Introduce backend auth and profile APIs

- implement backend login and token refresh
- replace [`login()` in `repository.ts`](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1826>) with API calls
- fetch `GET /me` after login instead of reading local users
- remove local user table as an auth dependency

#### Phase 3: Move business mutations server-side

- all order transitions
- rider assignment
- refund submission and resolution
- payment confirmation
- audit logging

#### Phase 4: Convert local DB to cache/sync layer

- catalog cache
- order read cache
- offline intent queue
- conflict handling

### Minimal target interfaces

```ts
type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

type CurrentUser = {
  id: string;
  role: 'customer' | 'manager' | 'rider';
  firstName: string;
  lastName: string;
  email: string;
};
```

The client should not have any field resembling `passwordHash`, `passwordSalt`, `isPaidOverride`, or role-asserting mutable local authority.

### Validation and test cases

#### Security tests

1. Modify local SQLite `orders.payment_status` to `paid`.
Expected: backend state remains unchanged and next sync restores server value.

2. Modify local SQLite `users.role` from `customer` to `manager`.
Expected: privileged API calls fail with `403`; UI privilege cache is corrected from `/me`.

3. Insert a fake refund approval row locally.
Expected: refund state from backend overwrites cache; no payout/reconciliation occurs.

4. Replay an expired access token.
Expected: backend returns `401`; client must refresh or re-authenticate.

5. Attempt repeated password guesses.
Expected: rate limiting, alerting, and lockout controls engage server-side.

#### Integration tests

```ts
it('rejects manager-only mutation for customer token', async () => {
  const token = await loginAsCustomer();
  const res = await api.post(
    `/orders/123/reject`,
    { reason: 'test' },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  expect(res.status).toBe(403);
});

it('never returns password fields from auth/profile APIs', async () => {
  const token = await loginAsManager();
  const me = await api.get(`/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(me.data.passwordHash).toBeUndefined();
  expect(me.data.passwordSalt).toBeUndefined();
});
```

#### Static validation

Use these checks to keep credential material out of the client:

```powershell
rg -n "passwordHash|password_hash|SHA256|digestStringAsync" src
rg -n "SELECT \\* FROM users|getUsers\\(|users:" src
```

The target end state is:

- no password hash fields in client types
- no client-side password verification
- no privileged business truth stored only on-device
- no local-only payment/refund finalization

## Explanations

### Why hashing upgrades alone are not enough
Even if SHA-256 is replaced with Argon2id on-device, the app is still broken because the attacker controls the verifier, the database, and the business state machine. The root issue is misplaced trust, not only weak password storage.

### Why encrypted SQLite is not enough
SQLCipher or OS file encryption helps against casual file theft, but not against a compromised/rooted device, debugging hooks, repackaged clients, or users extracting keys from the app runtime. Encryption improves resistance, not authority.

### If a backend is considered too large
Then the correct answer is that the app is not suitable for production handling of real auth, orders, refunds, or payments. A local-only architecture can be acceptable for demo, kiosk, or fully offline single-tenant tools, but not for a multi-role commerce workflow with financial state.
