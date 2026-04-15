# Runbook

## Local app
1. `npm.cmd install`
2. `npm.cmd run typecheck`
3. `npm.cmd run lint`
4. `npm.cmd run test`
5. `npx.cmd expo start`

## Android emulator
1. Install Android Studio with Android SDK, platform tools, and an emulator image.
2. Install JDK 17 and set `JAVA_HOME` to that JDK.
3. Add `platform-tools` to `PATH` so `adb` is available.
4. Launch an emulator from Android Studio.
5. Run `npm.cmd run android`

### Working setup used here
- Android SDK: `C:\Users\User\AppData\Local\Android\Sdk`
- AVD used: `Medium_Phone`
- JDK used for Gradle build: `C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot`
- The initial emulator had insufficient free `/data` space for the universal debug APK, so it was relaunched with a wiped data partition before installation.

## APK build
1. Ensure JDK 21 is active.
2. From [`android`](/c:/Users/User/Desktop/FOA/custom-bite-suite/android), run `.\gradlew.bat assembleDebug`
3. APK output target:
   `android/app/build/outputs/apk/debug/app-debug.apk`

### Verified output
- Built APK: [`app-debug.apk`](/c:/Users/User/Desktop/FOA/custom-bite-suite/android/app/build/outputs/apk/debug/app-debug.apk)
- Installed package on emulator: `com.custombite.suite`

## Notes
- The machine defaulted to JDK 25, which broke Android/Gradle compatibility. Installing and using JDK 17 resolved the native build.
- `adb` and emulator binaries existed locally, but they required explicit Android SDK and Android user-home environment variables when executed from Codex.
