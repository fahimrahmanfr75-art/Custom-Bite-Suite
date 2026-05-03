**Push Notifications** doesn't work because placeholder config blocks real device delivery
**Real-Time Order Tracking (WebSocket)**  doesn't work because placeholder config disables the socket

> [!IMPORTANT]
> Both features are **architecturally correct and well-coded**, but they are **inoperable on real devices** because `app.json` contains placeholder values that the runtime config deliberately rejects.

---

## 1. Push Notifications

### 1.2 What Doesn't Work

#### Problem 1: Placeholder `projectId` kills token retrieval

In [app.json:49](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/app.json#L49):
```json
"projectId": "YOUR_EAS_PROJECT_ID"
```

The [runtime config](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/config/runtime.ts#L25) has a `sanitizeUrl()` function that rejects any value starting with `"YOUR_"`:
```typescript
if (trimmed.startsWith('YOUR_')) {
    return null;
}
```

Result: `runtimeConfig.expoProjectId` is `null` → `registerDeviceForPushNotificationsAsync()` returns `{ token: null, error: 'Expo projectId is missing...' }` → no push token ever obtained → no push notifications.

#### Problem 2: Placeholder `pushApiBaseUrl` silently no-ops server sync

In [app.json:51](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/app.json#L51):
```json
"pushApiBaseUrl": "https://api.custombite.example"
```

This domain doesn't exist, so `syncPushTokenWithServer()` will fail with a network error. The error is swallowed in AppContext (line 155-157), so this is invisible.

#### Problem 3: Listener exports are dead code

[addPushNotificationReceivedListener()](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/services/pushNotifications.ts#L109-L113) and [addPushNotificationResponseListener()](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/src/services/pushNotifications.ts#L116-L121) are exported but **never imported anywhere** in the codebase. No component listens for incoming push notifications or user taps on notifications.

This means even if push tokens were obtained, the app would:
- Show the notification in the system tray (via the handler)
- But **not react** to the user tapping on it
- And **not refresh** local state when a push arrives

### 1.3 Verdict

| Aspect | Status |
|---|---|
| Code correctness | ✅ Well-structured, no bugs |
| Permission handling | ✅ Correct |
| Android channel config | ✅ Correct |
| `app.json` plugin setup | ✅ Correct |
| **Token actually obtained** | ❌ **No — placeholder `projectId`** |
| **Token synced to server** | ❌ **No — placeholder URL** |
| **Incoming push handled** | ❌ **No — listener exports never used** |
| In-app notifications | ✅ Fully working |

---

## 2. Real-Time Order Tracking

### 2.2 What Doesn't Work

#### Problem 1: Placeholder `webSocketUrl` disables the entire system

In [app.json:53](file:///c:/Users/User/Desktop/FOA/custom-bite-suite/app.json#L53):
```json
"webSocketUrl": "wss://api.custombite.example/orders/realtime"
```

`api.custombite.example` is not a real domain → `sanitizeUrl()` does NOT reject it (it doesn't start with `YOUR_`) → `runtimeConfig.realtimeWebSocketUrl` is set to this string → WebSocket **tries to connect** → fails with connection error → enters reconnect loop (every 3 seconds, forever).

> [!WARNING]
> Unlike the push notification config which gracefully disables, the WebSocket config causes a **silent infinite reconnect loop** consuming battery and network resources.

#### Problem 2: No real backend WebSocket server exists

This is a local-first app (expo-sqlite). There is no server-side WebSocket implementation. The socket client, while well-coded, has nothing to connect to.

#### Problem 3: Local-only architecture makes the socket conceptually unnecessary

Since all users (customer, manager, rider) share the same local SQLite database on a single device, the "real-time" updates are already happening via the `refreshAppStore()` calls after every mutation. The WebSocket would only be useful in a multi-device scenario with a remote backend.

### 2.3 What Actually Works: The Fallback

The **local fallback** pipeline works correctly:

```
Rider updates location via GPS → updateRiderLocation() writes to SQLite
→ refreshAppStore(['orders']) notifies subscribers
→ useRealtimeOrderTracking builds fallback snapshot from local Order
→ LiveTrackingScreen renders ETA, distance, rider info
```

This means live tracking **works within the same device** (e.g., switching between rider and customer roles in the same app instance), but not across devices.

### 2.4 Verdict

| Aspect | Status |
|---|---|
| WebSocket client code quality | ✅ Production-grade |
| React hook correctness | ✅ Correct |
| UI screen | ✅ Polished, handles all states |
| Publisher integration | ✅ All key events publish |
| Rider location updates to DB | ✅ Working |
| **WebSocket actually connects** | **❌ No — fake URL** |
| **Backend server exists** | **❌ No — local-only app** |
| Local fallback tracking | ✅ Working |

---

## 3. Do Both Features Work Together?

### Push Notification + WebSocket Tracking: ❌ No

These server-dependent features do not function because:
- No real EAS project ID → no push tokens
- No real push API server → tokens can't be synced
- No real WebSocket server → socket connection fails
- Push received/response listeners are never registered → even if pushes came, app wouldn't react

---

## 4. Recommendations

### To make push notifications work:

1. **Register an EAS project**: Run `eas init` to get a real project ID, update `app.json`
2. **Set up a push API server** (or use Expo's Push API directly from client for testing)
3. **Wire up the listeners**: Import and use `addPushNotificationReceivedListener` and `addPushNotificationResponseListener` in `AppContext` or `App.tsx` to handle incoming pushes and user taps

### To make real-time WebSocket tracking work:

1. **Build a WebSocket server** matching the message protocol defined in `orderTrackingSocket.ts`
2. **Update `app.json`** with the real WebSocket URL
3. **OR** remove the WebSocket config entirely if this remains a local-only app (stop the silent reconnect loop)

### Quick win — stop the reconnect loop:

Replace the placeholder URL with a `YOUR_` prefix so `sanitizeUrl` rejects it:
```json
"webSocketUrl": "YOUR_WEBSOCKET_URL"
```

This would set `realtimeWebSocketUrl` to `null` and the socket client would correctly enter the `'disabled'` state with no connection attempts.
