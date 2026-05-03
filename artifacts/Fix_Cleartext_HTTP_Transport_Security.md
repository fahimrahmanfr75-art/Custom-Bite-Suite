## Solution

Remove the Android cleartext override from [app.json](/c:/Users/User/Desktop/FOA/custom-bite-suite/app.json:34) and enforce HTTPS-only network paths across all environments.

Current insecure configuration:

```json
"plugins": [
  "expo-sqlite",
  [
    "expo-build-properties",
    {
      "android": {
        "usesCleartextTraffic": true
      }
    }
  ]
]
```

Target secure configuration:

```json
"plugins": [
  "expo-sqlite"
]
```

If `expo-build-properties` is required for unrelated settings, keep the plugin but remove `usesCleartextTraffic`:

```json
"plugins": [
  "expo-sqlite",
  [
    "expo-build-properties",
    {
      "android": {}
    }
  ]
]
```

## Best Practice

1. Use HTTPS for every backend, asset host, callback endpoint, and telemetry sink.
2. Fail builds or CI checks when `http://` URLs or `usesCleartextTraffic: true` appear in tracked config.
3. For local mobile development, use a secure tunnel or HTTPS-enabled dev endpoint instead of weakening Android transport policy.

Recommended dev options:

1. Expo tunnel for app-to-local-service access.
2. Reverse proxy with TLS termination.
3. Temporary debug-only native network security exceptions, never committed as the default app policy.

## Scope

This finding is configuration-level transport hardening for Android. It does not by itself verify:

1. Whether application code still references `http://` endpoints.
2. Whether third-party SDKs emit plaintext traffic.
3. Whether certificate validation or pinning is implemented where required.

## Validation

Static checks:

```powershell
rg "usesCleartextTraffic|http://" -n .
```

Expected result after remediation:

1. No `usesCleartextTraffic: true` in repository config.
2. No production or staging service URLs using `http://`.

Runtime checks:

1. Build Android app and verify API calls succeed against HTTPS endpoints.
2. Exercise auth, API, image upload, analytics, and location-backed flows.
3. Inspect Android network traffic with a proxy or backend access logs to confirm TLS-only requests.

## Risk Rationale

Leaving cleartext enabled as a default creates three persistent problems:

1. Plaintext traffic can be introduced accidentally without platform resistance.
2. Staging and developer infrastructure tends to drift into insecure dependency patterns.
3. Security review becomes configuration-fragile because policy is permissive by default.
