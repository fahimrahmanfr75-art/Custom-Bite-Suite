# Repository Partition

## Scope

This partition separates the repository into:

1. `mandatory`:
Files and folders that should be kept in Git because they define the application, tests, build logic, or documentation you want to preserve.
2. `generated`:
Files and folders created by dependency install, Expo prebuild, Android/Gradle compilation, packaging, emulator runs, IDEs, or local machine state.

The live project structure was kept intact so the application entry points and toolchain do not break. Generated content is centralized where it can be moved safely, and the rest is documented through manifests and `.gitignore`.

## Regeneration

Typical regeneration flow on a new machine:

```powershell
npm install
npx expo start
```

Android native folder regeneration, if needed:

```powershell
npx expo prebuild -p android
```

Release/debug APK regeneration:

```powershell
npm run build:apk
npm run build:apk:release
```
