**Findings**

<!-- 1. The app is not production-safe from a security model perspective because the entire business backend lives on the client device in SQLite, passwords are stored as plain unsalted SHA-256 hashes, and user password hashes are loaded back into app state. See [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:242>), [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1356>), [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1826>), and [types.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/types.ts:20>). Anyone with device/database access effectively owns auth, orders, refunds, and payment state. -->

2. Privilege escalation is built in: registration allows `manager` and `rider` roles, the login screen advertises demo manager/rider credentials, and the seed step creates known privileged accounts. See [validation.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/utils/validation.ts:13>), [AuthScreen.tsx](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/screens/AuthScreen.tsx:42>), and [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:1194>). In real terms, any user can self-create staff access.

<!-- 3. Several write operations lack repository-level authorization checks. `upsertDishRecord`, `deleteDishRecord`, `updateRefundDecision`, `assignOrderRider`, `confirmCash`, and `markNotificationRead` mutate sensitive state without verifying actor role or ownership. See [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts>). The UI hides some of this, but the data layer does not enforce it. -->

<!-- 4. Transport security is weakened by configuration: Android cleartext HTTP is explicitly enabled. See [app.json](</c:/Users/User/Desktop/FOA/custom-bite-suite/app.json>). That is a bad default even for staging, because it normalizes insecure dependencies and accidental plaintext traffic. -->

<!-- 5. Initialization is destructive and can overwrite operator-managed data on startup. `initializeRepository()` always seeds, syncs curated menu content, normalizes pricing, and backfills snapshots; the curated sync also deletes all banners and offers before recreating them. See [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts>). That means admin edits are not trustworthy long-term. -->

<!-- 6. Migration strategy is unsafe because schema drift can trigger broad table drops instead of versioned migrations. See [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts>). This is acceptable for a demo, but not for an app expected to preserve orders, refunds, reviews, and audit history. -->

7. Business rules are too weak for critical flows. A customer can review any dish without proving they bought it or received it, and refunds are allowed for orders that are still active as long as they are not already rejected/canceled. See [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:2144>) and [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts:2106>). That invites abuse and corrupt reporting.

8. State loading hides failures instead of surfacing them. `loadSnapshot()` catches section errors, logs them, and returns partial fallbacks, so the UI can silently operate on incomplete data. See [repository.ts](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/data/repository.ts>). This makes debugging and trust in displayed metrics much worse.

<!-- 9. The runtime model is inefficient and brittle: the app polls the whole repository every 5 seconds once logged in. See [AppContext.tsx](</c:/Users/User/Desktop/FOA/custom-bite-suite/src/context/AppContext.tsx>). For a local DB demo this works, but it is wasteful, causes needless rerenders, and would not scale if moved to a real API. -->

10. Maintainability is poor because core screens are monoliths and the repository is oversized. `CustomerDashboard.tsx` is 1432 lines, `ManagerDashboard.tsx` is 1405 lines, `DishTab.tsx` is 711 lines, and `repository.ts` is ~2500+ lines. This is already beyond comfortable review/test boundaries and will get harder to change safely.

11. Testing is too narrow. The current suite only covers a few pure utility/data helpers, and Jest is configured only for `*.test.ts`, not component tests. See [jest.config.js](</c:/Users/User/Desktop/FOA/custom-bite-suite/jest.config.js:3>) and the `__tests__` contents. There is no coverage for auth, repository permissions, migrations, dashboards, or end-to-end order flows.

12. Repo and build hygiene are weak. The repo currently contains generated/native artifacts like `android/`, `node_modules/`, `dist/`, and a release APK even though [`.gitignore`](</c:/Users/User/Desktop/FOA/custom-bite-suite/.gitignore:4>) and [`.gitignore`](</c:/Users/User/Desktop/FOA/custom-bite-suite/.gitignore:41>) say they should be ignored. The Windows batch scripts hard-code machine-specific paths and JDK/SDK locations, which makes onboarding and CI parity poor. See [run_emulator.bat](</c:/Users/User/Desktop/FOA/custom-bite-suite/run_emulator.bat:7>) and [build_release_apk.bat](</c:/Users/User/Desktop/FOA/custom-bite-suite/build_release_apk.bat:9>).

13. CI is incomplete. The GitHub workflow builds only a debug APK and does not run lint, typecheck, or tests before publishing the artifact. See [build-apk.yml](</c:/Users/User/Desktop/FOA/custom-bite-suite/.github/workflows/build-apk.yml:11>) and [build-apk.yml](</c:/Users/User/Desktop/FOA/custom-bite-suite/.github/workflows/build-apk.yml:38>). That means basic regressions can ship unnoticed.

**Explanations**

Scope: static audit of security, architecture, business rules, build/repo hygiene, and testability. No code changes were made.

What is good: `strict` TypeScript is enabled, lint/typecheck pass, and the existing pure-function tests pass. Validation run:
```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
```

What this project looks like today: a solid demo/prototype with a lot of functional surface area, but not yet a trustworthy product foundation. The biggest inside problems are trust boundaries, authorization, and data ownership. The biggest outside problems are repo hygiene, portability, and lack of delivery-grade CI.

If you want, the next useful step is a ranked remediation plan in three buckets:
1. `Must fix before real users`
2. `Should fix for maintainability`
3. `Nice to improve for polish and product quality`