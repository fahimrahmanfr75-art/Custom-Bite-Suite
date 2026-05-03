# Custom Bite Suite - Environment Setup Guide

## Current Status Analysis

### ✅ Already Available
- Project source code
- Android project configuration  
- package.json and package-lock.json
- All project files

### ❌ Missing (Required)
| Component | Current | Required | Status |
|-----------|---------|----------|--------|
| **Node.js** | Not installed | LTS (18+) | **MISSING** |
| **npm** | Not installed | Comes with Node | **MISSING** |
| **JDK** | Version 11 | Version 17 | **NEEDS UPGRADE** |
| **Android SDK** | Not installed | Full SDK with tools | **MISSING** |
| **project dependencies** | node_modules/ missing | npm ci needed | **MISSING** |
| **AVD Emulator** | Not set up | Medium_Phone | **MISSING** |

---

## Installation Instructions

### Step 1: Install Node.js (with npm)
**Downloads:**
- [Node.js LTS (18+)](https://nodejs.org/) - Download and run installer
  - Choose "LTS" version
  - Run the `.msi` installer
  - Accept defaults (includes npm)
  - Restart your terminal/VS Code after installation

**Verify:**
```powershell
node -v
npm -v
```

---

### Step 2: Upgrade Java to JDK 17
Since you have Java 11 but need version 17:

**Option A: Adoptium JDK 17 (Recommended)**
- [Download Eclipse Adoptium JDK 17](https://adoptium.net/temurin/releases/?version=17)
  - Select Windows x64 `.msi` file
  - Run installer
  - Use default installation path: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
  - Restart terminal after install

**Option B: Oracle JDK 17**
- [Download from Oracle](https://www.oracle.com/java/technologies/downloads/#java17)

**Verify:**
```powershell
java -version
```
Should show `17.x.x` or higher

---

### Step 3: Install Android SDK & Tools

**Via Android Studio (Recommended - handles most setup):**
1. Download [Android Studio](https://developer.android.com/studio)
2. Run installer with defaults
3. Open Android Studio → "More Actions" → "SDK Manager"
4. Install these components:
   - **SDK Platforms:**
     - Android 14 (API level 34) - or your project's target API
   - **SDK Tools:**
     - Android SDK Build-Tools (latest)
     - Android Emulator
     - Android SDK Platform-Tools
     - Google Play services
     - NDK (if needed by your build)
     - CMake (if needed by your build)

**Environment Variable Setup:**
1. Press `Win + X` → "System" → "Advanced system settings"
2. Click "Environment Variables" → "New" (User variables)
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
3. Click OK, then restart terminal

**Verify:**
```powershell
adb version
```

---

### Step 4: Create Android Virtual Device (AVD) "Medium_Phone"

1. Open Android Studio
2. Menu → "Tools" → "Device Manager" → "Create Virtual Device"
3. Select "Phone" category → Choose "Pixel 4a" (or similar medium phone)
4. Select API Level 34 (or matching your project)
5. **Name it exactly: `Medium_Phone`** (case-sensitive)
6. Allocate:
   - RAM: 2048 MB (minimum)
   - VM heap: 512 MB
7. Click "Finish"

**Verify from PowerShell:**
```powershell
emulator -list-avds
```
Should show: `Medium_Phone`

---

### Step 5: Install Project Dependencies

Once Node.js is installed, run:

```powershell
cd e:\FOA1\Custom-Bite-Suite
npm ci
```

This uses `package-lock.json` for exact versions (not `npm install`).

**Verify:**
```powershell
Test-Path node_modules
```
Should return `True`

---

### Step 6: Set Up Android local.properties

The project needs to know where your Android SDK is:

```powershell
cd e:\FOA1\Custom-Bite-Suite\android
```

Create `local.properties` file with:
```properties
sdk.dir=C:\\Users\<YourUsername>\\AppData\\Local\\Android\\Sdk
ndk.dir=C:\\Users\<YourUsername>\\AppData\\Local\\Android\\Sdk\\ndk\\<version>
```

Replace `<YourUsername>` with your actual Windows username.

**Or use this one-liner (PowerShell):**
```powershell
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
"sdk.dir=$sdkPath".Replace('\', '\\') | Out-File -FilePath local.properties -Encoding utf8
```

---

## Validation Checklist

After completing all steps, verify everything works:

```powershell
# Check tools
node -v          # Should be v18+
npm -v            # Should be 9+
java -version     # Should show version 17+
adb version       # Should list version number
emulator -list-avds  # Should show Medium_Phone

# Navigate to project
cd e:\FOA1\Custom-Bite-Suite

# Verify dependencies
npm ci

# Check project integrity
npm run typecheck    # TypeScript check
npm run lint         # Linting check
npm test             # Run tests
```

Expected result: All commands complete without errors.

---

## Build & Run Commands

Once setup is complete:

```powershell
cd e:\FOA1\Custom-Bite-Suite

# Start dev server
npm start

# Build and run on Android emulator
npm run android

# Build APK (debug)
npm run build:apk

# Build APK (release)
npm run build:apk:release
```

---

## Troubleshooting

### "node: command not found"
- Restart terminal/VS Code after Node.js installation
- Check PATH: `$env:Path` should include Node.js directories

### "java: command not found" or wrong version
- Verify JDK 17 installation in `Program Files\Eclipse Adoptium`
- Restart terminal after install
- Set JAVA_HOME environment variable if needed:
  - Variable name: `JAVA_HOME`
  - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`

### "emulator: command not found"
- Android SDK not properly set in `ANDROID_HOME`
- Verify Android SDK installed via Android Studio SDK Manager
- Restart terminal after setting environment variable

### AVD not found
- Run Android Studio → Device Manager → Create Virtual Device
- Name it **exactly** `Medium_Phone`
- Ensure plenty of free disk space (4GB+ for AVD)

### npm ci fails
- Delete `node_modules` and `package-lock.json`
- Run `npm install` instead
- Check internet connection

---

## Quick Reference: Expected Installation Time

- Node.js: 5 minutes
- JDK 17: 5 minutes  
- Android Studio & SDK: 15-30 minutes (depends on internet)
- AVD Creation: 10 minutes
- npm ci: 3-5 minutes
- **Total: ~45-60 minutes**

---

## Files You Have

✅ Project source (`src/`, `assets/`, etc.)
✅ package.json & package-lock.json
✅ Android native project (`android/` folder)
✅ Build scripts and configs
✅ Transfer manifest documentation
✅ ESLint, Jest, TypeScript configs

## Next Steps After Setup

1. Complete all installation steps above
2. Run validation checklist
3. Execute `npm run android` to build and launch on emulator
4. If issues arise, check specific troubleshooting section
5. Read [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for project-specific details

---

**Last updated:** April 16, 2026 | Based on transfer-manifest.md analysis
