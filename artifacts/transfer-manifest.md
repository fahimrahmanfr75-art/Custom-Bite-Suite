# Custom Bite Suite Transfer Manifest

## Scope
Transfer this project to another Windows device with:
- app source intact
- Android emulator usable
- `npm run android` working
- APK builds working
- no dependency on this device's transient build caches unless explicitly chosen

## Findings
Top-level size drivers in the current workspace:
- `node_modules/` ~= 10.9 GB
- `.gradle-local/` ~= 3.6 GB
- `android/` ~= 2.16 GB

Inside `android/`, most size is generated output:
- `android/app/build/` ~= 1.76 GB
- `android/app/.cxx/` ~= 388 MB

This means most of the 17 GB is rebuildable cache/build output, not source-of-truth project data.

## Must Copy
Copy these from the project folder:
- `src/`
- `assets/`
- `scripts/`
- `__tests__/`
- `android/`
  - Keep source/config files
  - Keep `android/app/debug.keystore`
  - Keep `android/gradle/wrapper/`
- `App.tsx`
- `index.ts`
- `app.json`
- `package.json`
- `package-lock.json`
- `babel.config.js`
- `tsconfig.json`
- `eslint.config.js`
- `jest.config.js`
- `run_emulator.bat`
- `.gitignore`

## Must Keep Inside `android/`
These are relevant project files:
- `android/build.gradle`
- `android/settings.gradle`
- `android/gradle.properties`
- `android/gradlew`
- `android/gradlew.bat`
- `android/gradle/wrapper/gradle-wrapper.jar`
- `android/gradle/wrapper/gradle-wrapper.properties`
- `android/app/build.gradle`
- `android/app/proguard-rules.pro`
- `android/app/debug.keystore`
- `android/app/src/**`

## Do Not Copy
These are rebuildable or machine-specific:
- `node_modules/`
- `.expo/`
- `dist/`
- `.gradle-local/`
- `android/.gradle/`
- `android/build/`
- `android/app/build/`
- `android/app/.cxx/`
- `.idea/`
- `.vscode/`
- `.cursor/`

Also do not rely on this file being portable:
- `android/local.properties`
  - machine-specific SDK path
  - your script regenerates it

## Optional Copy
Copy only if you want convenience, not correctness:
- `.git/`
  - keep full commit history
- `artifacts/`
  - notes/docs only
- `.github/`
  - CI/workflow metadata only

## Required Outside The Repo
To get identical behavior on the new device, the repo alone is not enough. You also need:

1. Node.js + npm
   - versions should be compatible with the lockfile and Expo/React Native toolchain

2. JDK 17
   - current launcher uses:
   - `C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot`

3. Android SDK
   - current launcher uses:
   - `C:\Users\User\AppData\Local\Android\Sdk`
   - required components include:
   - platform-tools
   - emulator
   - build-tools
   - platform for your compile SDK
   - NDK version required by Gradle/Expo
   - CMake if native rebuilds require it

4. AVD emulator definition
   - current launcher expects AVD name:
   - `Medium_Phone`

5. User Gradle cache
   - not required to copy
   - can be rebuilt on first build
   - copying it can save download/build time, but increases transfer size substantially

## Critical Non-Repo State
If by "exactly as it now" you also mean preserving current emulator/device state, you must separately copy:
- the AVD directory and config for `Medium_Phone`
- emulator app data
- app runtime data stored inside the emulator

Without that, the project code will behave the same, but the emulator will be a fresh device and app data such as SQLite contents, permissions, and installed state may differ.

Typical Windows locations to consider:
- `%USERPROFILE%\\.android\\avd\\`
- `%LOCALAPPDATA%\\Android\\Sdk\\`
- `%USERPROFILE%\\.gradle\\`

## Two Transfer Options

### Option A: Lean Transfer
Best if the new device has internet and you can reinstall SDK/tooling.

Copy:
- the repo source/config files listed in `Must Copy`

Do not copy:
- `node_modules/`
- Gradle caches
- Android build output

Then on the new machine:
1. install Node.js
2. install JDK 17
3. install Android Studio SDK + emulator packages
4. create/import AVD named `Medium_Phone`
5. run `npm ci`
6. run `npm run android`
7. run `npm run build:apk`

Expected benefit:
- smallest transfer size
- clean rebuild

Expected cost:
- dependency and SDK downloads
- first build is slower

### Option B: Exact Environment Transfer
Best if the new device may be offline or you want minimal setup drift.

Copy:
- repo files from `Must Copy`
- `node_modules/`
- `%LOCALAPPDATA%\\Android\\Sdk\\`
- `%USERPROFILE%\\.android\\avd\\`
- `%USERPROFILE%\\.gradle\\`

Expected benefit:
- closest to current machine behavior
- fewer downloads

Expected cost:
- much larger transfer
- paths may still need adjustment
- AVD and SDK are still machine-level assets, not repo assets

## Recommended Practical Strategy
Use a hybrid:
- copy the lean repo set
- also copy `%LOCALAPPDATA%\\Android\\Sdk\\`
- also copy `%USERPROFILE%\\.android\\avd\\`
- do not copy `node_modules/`
- do not copy repo build outputs
- do not copy `.gradle-local/`
- optionally copy `%USERPROFILE%\\.gradle\\` only if you want to avoid redownloading Gradle artifacts

This keeps the transfer much smaller than 17 GB while preserving emulator capability and Android build tooling.

## Validation On New Device
Run these after transfer/setup:

```powershell
node -v
npm -v
java -version
adb version
emulator -list-avds
```

Expected:
- Java is 17.x
- `Medium_Phone` appears in the AVD list

Project validation:

```powershell
cd C:\path\to\custom-bite-suite
npm ci
npm run typecheck
npm run lint
npm test
npm run android
npm run build:apk
```

APK validation:

```powershell
Get-ChildItem android\app\build\outputs\apk\debug
Get-ChildItem android\app\build\outputs\apk\release
```

## Current Repo-Specific Conclusions
- `android/local.properties` is safe to regenerate and should not be treated as portable
- `android/app/debug.keystore` must be copied if you want the same debug/release signing behavior currently configured
- current `release` build uses the debug keystore, so there is no hidden release keystore dependency in this repo
- no `.env`, Firebase config, or extra keystore files were found in the repo
- the bulk of current size is cache/build output and can be excluded
