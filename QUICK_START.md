# QUICK START CHECKLIST

> **TL;DR** - Your device is missing all required tools. Follow steps 1-6 below, then run the project.

## Required Components Status

| Component | Status | Action |
|-----------|--------|--------|
| Node.js (18+) | ❌ MISSING | [Install](https://nodejs.org/) |
| npm (with Node) | ❌ MISSING | [Comes with Node.js](https://nodejs.org/) |
| JDK 17 | ❌ NEED UPGRADE (have 11) | [Install Adoptium JDK 17](https://adoptium.net/temurin/releases/?version=17) |
| Android SDK | ❌ MISSING | [Install Android Studio](https://developer.android.com/studio) |
| Project Dependencies | ❌ MISSING | `npm ci` after Node.js install |
| AVD "Medium_Phone" | ❌ MISSING | Create in Android Studio → Device Manager |

---

## Installation Steps (In Order)

### 1️⃣ Install Node.js LTS
- Go to: https://nodejs.org/
- Download **LTS** version (18.x or 20.x)
- Run `.msi` installer
- Accept defaults
- **Restart terminal/VS Code**
- Verify: `node -v` and `npm -v`

⏱️ 5 minutes

---

### 2️⃣ Install JDK 17 (Upgrade from Java 11)
- Go to: https://adoptium.net/temurin/releases/?version=17
- Download **Windows x64 `.msi`**
- Run installer
- Accept defaults (installs to `C:\Program Files\Eclipse Adoptium\jdk-17.x-hotspot`)
- **Restart terminal**
- Verify: `java -version` → should show `17.x`

⏱️ 5 minutes

---

### 3️⃣ Install Android Studio + SDK
- Go to: https://developer.android.com/studio
- Download and run installer
- Accept defaults
- **First launch:** Let it download components (may take 10-15 min)
- Finish setup wizard

⏱️ 15-30 minutes (mostly auto setup)

---

### 4️⃣ Configure Android SDK in Android Studio
- Open Android Studio
- Go to: **Tools** → **SDK Manager**
- Install these (if not already installed):
  - ✅ Android SDK Build-Tools (latest)
  - ✅ Android Emulator
  - ✅ Android SDK Platform-Tools
  - ✅ Android 14 (or API 34)
- Click **Apply** and **OK**
- **Restart terminal after completion**

⏱️ 5-10 minutes

---

### 5️⃣ Create Android Virtual Device (AVD)
- Open Android Studio
- Go to: **Tools** → **Device Manager**
- Click **Create Virtual Device**
- Select **Phone** → **Pixel 4a** (or similar)
- Select **API 34** (Android 14)
- **Name it: `Medium_Phone`** (⚠️ exact spelling!)
- Click **Next** → **Finish**

⏱️ 10 minutes

---

### 6️⃣ Install Project Dependencies
Run in PowerShell:
```powershell
cd e:\FOA1\Custom-Bite-Suite
npm ci
```

This will install all packages from `package-lock.json` (~600+ packages)

⏱️ 3-5 minutes

---

## Verify Everything Works

```powershell
# Run this validation script
powershell -ExecutionPolicy Bypass -File e:\FOA1\validate-setup.ps1
```

Or manually check:
```powershell
node -v          # ✅ v18+
npm -v            # ✅ 9+
java -version     # ✅ 17+
adb version       # ✅ works
emulator -list-avds  # ✅ shows Medium_Phone
```

---

## Build and Run

Once validation passes:

```powershell
cd e:\FOA1\Custom-Bite-Suite

# Run project in development mode
npm start

# Build and launch on emulator
npm run android

# Build release APK
npm run build:apk:release
```

---

## Total Time Estimate: ~60 minutes
- 5 min: Node.js
- 5 min: JDK 17  
- 30 min: Android Studio + SDK (mostly downloading)
- 10 min: AVD setup
- 5 min: npm ci
- 5 min: Verify & test

---

## If Something Goes Wrong

| Error | Solution |
|-------|----------|
| `node: command not found` | Restart terminal after Node install, or add to PATH |
| `java: wrong version` | Install JDK 17 from Adoptium, not Oracle or default JRE |
| `adb: command not found` | Android SDK not in PATH - verify ANDROID_HOME set |
| `emulator: not found` | Emulator not installed via Android Studio SDK Manager |
| `npm ci` fails | Delete `node_modules`, run `npm install` instead |
| `Medium_Phone` not found | Create new AVD with exact name in Android Studio Device Manager |

---

## Reference Files

- 📄 [ENVIRONMENT_SETUP_GUIDE.md](./ENVIRONMENT_SETUP_GUIDE.md) - Detailed instructions
- 📄 [transfer-manifest.md](./transfer-manifest.md) - Project transfer analysis
- 🔧 [validate-setup.ps1](./validate-setup.ps1) - Automated verification script
- 📋 [IMPLEMENTATION_GUIDE.md](./Custom-Bite-Suite/IMPLEMENTATION_GUIDE.md) - Project-specific details

---

**Last Updated:** April 16, 2026
