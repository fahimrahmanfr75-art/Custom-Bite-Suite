# Setup Checklist - Track Your Progress

Print this page or check items off as you complete them.

---

## Phase 1: Installation (Do These First)

### ☐ Step 1: Install Node.js LTS
- [ ] Go to https://nodejs.org/
- [ ] Download **LTS version** (18.x or newer)
- [ ] Run the `.msi` installer
- [ ] Accept all defaults
- [ ] **IMPORTANT:** Close VS Code and PowerShell completely
- [ ] Reopen PowerShell and run: `node -v`
- [ ] **Confirm:** Output shows v18.x (or higher)
- [ ] **Confirm:** `npm -v` works (shows 9.x or higher)

**⏱️ Time: 5 minutes**

---

### ☐ Step 2: Upgrade Java to Version 17
- [ ] Go to https://adoptium.net/temurin/releases/?version=17
- [ ] Download **Windows x64 `.msi` file**
- [ ] Run the `.msi` installer
- [ ] Accept all defaults
- [ ] When asked for installation location, keep: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`
- [ ] **IMPORTANT:** Close PowerShell completely
- [ ] Reopen PowerShell and run: `java -version`
- [ ] **Confirm:** Output shows version 17.x (not 11.x)

**⏱️ Time: 5 minutes**

---

### ☐ Step 3: Install Android Studio
- [ ] Go to https://developer.android.com/studio
- [ ] Download and run the installer
- [ ] Run the `.exe` installer
- [ ] Accept all defaults
- [ ] Let the installer download components (this takes 10-15 minutes)
- [ ] When complete, Android Studio will open
- [ ] **IMPORTANT:** Let the setup wizard run completely
- [ ] Close Android Studio when done

**⏱️ Time: 15-30 minutes** (mostly waiting)

---

### ☐ Step 4: Install Android SDK Components
- [ ] Open Android Studio (run it from Start Menu or desktop)
- [ ] Go to: **Tools** → **SDK Manager** (top menu bar)
- [ ] Look for these packages:
  - [ ] Android SDK Build-Tools (latest version, e.g., 34+) - **Install if not checked**
  - [ ] Android Emulator - **Install if not checked**
  - [ ] Android SDK Platform-Tools - **Install if not checked**
  - [ ] Android 14 or 15 (API level 34+) - **Install if not checked**
- [ ] Click **Apply** button
- [ ] Accept license agreements
- [ ] Wait for installation (5-10 minutes)
- [ ] Click **OK** when done
- [ ] **IMPORTANT:** Close Android Studio
- [ ] **IMPORTANT:** Close PowerShell and reopen it

**⏱️ Time: 10 minutes** (mostly waiting)

---

### ☐ Step 5: Create Android Virtual Device (AVD)
- [ ] Open Android Studio again
- [ ] Go to: **Tools** → **Device Manager** (top menu bar)
- [ ] Click **Create Virtual Device** button
- [ ] Select a phone (e.g., "Pixel 4a")
- [ ] Click **Next**
- [ ] Select operating system: **API 34 or higher** (Android 14+)
- [ ] Click **Next**
- [ ] Under "AVD Name", change the name to: **`Medium_Phone`**
  - ⚠️ **EXACT spelling:** M capital, underscore, P capital, rest lowercase
- [ ] Accept all other defaults
- [ ] Click **Finish**
- [ ] Close Android Studio

**⏱️ Time: 10 minutes**

**Verify:** Open PowerShell and run:
```powershell
emulator -list-avds
```
**Look for:** `Medium_Phone` in the output

---

### ☐ Step 6: Install Project Dependencies
- [ ] Open PowerShell (or use VS Code's built-in terminal)
- [ ] Navigate to the project:
  ```powershell
  cd e:\FOA1\Custom-Bite-Suite
  ```
- [ ] Run the installation:
  ```powershell
  npm ci
  ```
- [ ] **Wait 3-5 minutes** for packages to install
- [ ] **Confirm:** Completes without errors (should end with output like "added XXX packages")

**⏱️ Time: 5 minutes** (mostly download/install)

---

## Phase 2: Verification (Verify Everything Works)

### ☐ Step 7: Run Validation Script
- [ ] Open PowerShell
- [ ] Run the validation script:
  ```powershell
  powershell -ExecutionPolicy Bypass -File e:\FOA1\validate-setup.ps1
  ```
- [ ] Review the output:
  - ✅ Node.js - should be GREEN
  - ✅ npm - should be GREEN
  - ✅ Java 17 - should be GREEN
  - ✅ Android SDK - should be GREEN
  - ✅ Emulator - should be GREEN
  - ✅ Medium_Phone AVD - should be GREEN
  - ✅ node_modules - should be GREEN
  - ✅ local.properties - can be YELLOW (auto-created on first build)

**If anything is RED or YELLOW:** Go back and check that step

---

## Phase 3: Run the Project (The Big Moment!)

### ☐ Step 8: Launch the App
- [ ] Open PowerShell or VS Code terminal
- [ ] Navigate to project:
  ```powershell
  cd e:\FOA1\Custom-Bite-Suite
  ```
- [ ] Start the app:
  ```powershell
  npm run android
  ```
- [ ] **Wait 2-3 minutes** for first build (it's normal, takes a while first time)
- [ ] Watch for:
  - [ ] Gradle starts building
  - [ ] Metro server starts (JavaScript bundler)
  - [ ] Emulator loads (virtual phone window opens)
  - [ ] App installs on emulator
  - [ ] App launches!

**Expected:** You see the Custom Bite Suite app running on the virtual Android phone

---

## Phase 4: Test Functionality

### ☐ Step 9: Basic Testing
- [ ] App launches without crashing ✅
- [ ] Navigate through tabs (if it has tabs) ✅
- [ ] Type something or tap buttons ✅
- [ ] App responds ✅
- [ ] No error messages in terminal ✅

---

## 🎉 You're Done!

### ✅ Everything Works!
You can now:
- [ ] Run `npm run android` to launch the app anytime
- [ ] Make code changes and see them live (hot reload)
- [ ] Build APK with `npm run build:apk`
- [ ] Run tests with `npm test`
- [ ] Build production release with `npm run build:apk:release`

---

## 🆘 Troubleshooting Checklist

### If Node.js says "command not found"
- [ ] Close VS Code completely
- [ ] Close PowerShell completely
- [ ] Reopen PowerShell fresh
- [ ] Try again: `node -v`

### If Java wrong version
- [ ] Uninstall Java 11 from Control Panel
- [ ] Reinstall JDK 17 from adoptium.net
- [ ] Close PowerShell
- [ ] Open fresh PowerShell
- [ ] Try: `java -version`

### If Android SDK not found
- [ ] Make sure Android Studio finished installing
- [ ] Go to SDK Manager: **Tools** → **SDK Manager**
- [ ] Install: Build-Tools, Emulator, Platform-Tools, Android 14
- [ ] Close PowerShell after install

### If AVD not found
- [ ] Open Android Studio
- [ ] Go to: **Tools** → **Device Manager**
- [ ] Look for "Medium_Phone"
- [ ] If not there, click **Create Virtual Device**
- [ ] Name it exactly: `Medium_Phone`

### If npm ci fails
- [ ] Delete `node_modules` folder completely
- [ ] Run: `npm install` (instead of `npm ci`)
- [ ] Or delete both `node_modules/` and try `npm ci` again

### If app won't launch
- [ ] Make sure emulator "Medium_Phone" is running
- [ ] Run: `npm run android:clean-native` to clean build
- [ ] Then: `npm run android` again

---

## 📞 Reference Files

- 📄 [QUICK_START.md](./QUICK_START.md) - Quick reference guide
- 📄 [ENVIRONMENT_SETUP_GUIDE.md](./ENVIRONMENT_SETUP_GUIDE.md) - Detailed setup guide
- 📄 [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) - Full project analysis
- 📄 [transfer-manifest.md](./transfer-manifest.md) - Transfer requirements

---

**Total Estimated Time: 60-90 minutes** (mostly waiting for downloads/installations)

**Status:** Ready to begin ✅
**Last Updated:** April 16, 2026

---

## Progress Log

Use this space to record when you complete phases:

- **Phase 1 (Installation) completed:** _______________
- **Phase 2 (Verification) completed:** _______________  
- **Phase 3 (First run) completed:** _______________
- **Notes:** _____________________________________

