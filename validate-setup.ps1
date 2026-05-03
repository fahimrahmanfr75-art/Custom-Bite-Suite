# Automated Setup Validation Script
# Run this after installing Node.js, JDK 17, and Android SDK
# Usage: powershell -ExecutionPolicy Bypass -File validate-setup.ps1

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Custom Bite Suite - Setup Validator" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check Node.js
Write-Host "[1/7] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js NOT found. Please install Node.js LTS from https://nodejs.org/" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check npm
Write-Host "[2/7] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm NOT found. npm comes with Node.js - reinstall Node.js" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check Java
Write-Host "[3/7] Checking Java 17..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1
    if ($javaVersion -match "17\.|11\.") {
        if ($javaVersion -match "17\.") {
            Write-Host "✅ Java 17 found" -ForegroundColor Green
            Write-Host "   $($javaVersion[0])" -ForegroundColor Gray
        } else {
            Write-Host "⚠️  Java 11 found (should be 17)" -ForegroundColor Yellow
            Write-Host "   Upgrade from: https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Yellow
            $allGood = $false
        }
    }
} catch {
    Write-Host "❌ Java NOT found. Install JDK 17 from https://adoptium.net/temurin/releases/?version=17" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check Android SDK
Write-Host "[4/7] Checking Android SDK..." -ForegroundColor Yellow
$androidHome = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $androidHome) {
    Write-Host "✅ Android SDK found at: $androidHome" -ForegroundColor Green
    
    # Check for platform-tools
    if (Test-Path "$androidHome\platform-tools\adb.exe") {
        Write-Host "   ✅ ADB (platform-tools) found" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  ADB not found. Reinstall via Android Studio SDK Manager" -ForegroundColor Yellow
    }
    
    # Check for emulator
    if (Test-Path "$androidHome\emulator\emulator.exe") {
        Write-Host "   ✅ Emulator found" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Emulator not found. Install via Android Studio SDK Manager" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Android SDK NOT found at: $androidHome" -ForegroundColor Red
    Write-Host "   Install Android Studio from: https://developer.android.com/studio" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Check for AVD
Write-Host "[5/7] Checking Android Virtual Device (Medium_Phone)..." -ForegroundColor Yellow
try {
    $avds = emulator -list-avds 2>&1
    if ($avds -match "Medium_Phone") {
        Write-Host "✅ AVD 'Medium_Phone' found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  AVD 'Medium_Phone' NOT found" -ForegroundColor Yellow
        Write-Host "   Create via: Android Studio → Device Manager → Create Virtual Device" -ForegroundColor Yellow
        Write-Host "   Must be named exactly: Medium_Phone" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not list AVDs. Emulator may not be in PATH." -ForegroundColor Yellow
}
Write-Host ""

# Check project dependencies
Write-Host "[6/7] Checking project dependencies..." -ForegroundColor Yellow
$projectPath = "e:\FOA1\Custom-Bite-Suite"
if (Test-Path "$projectPath\node_modules") {
    Write-Host "✅ node_modules exists" -ForegroundColor Green
    $pkgCount = (Get-ChildItem "$projectPath\node_modules" -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "   Packages found: $pkgCount" -ForegroundColor Gray
} else {
    Write-Host "❌ node_modules NOT found" -ForegroundColor Red
    Write-Host "   Run: cd $projectPath && npm ci" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# Check android/local.properties
Write-Host "[7/7] Checking Android local.properties..." -ForegroundColor Yellow
if (Test-Path "$projectPath\android\local.properties") {
    Write-Host "✅ local.properties exists" -ForegroundColor Green
    $content = Get-Content "$projectPath\android\local.properties" | Select-Object -First 2
    Write-Host "   Content: $content" -ForegroundColor Gray
} else {
    Write-Host "⚠️  local.properties NOT found" -ForegroundColor Yellow
    Write-Host "   Will be auto-generated on first build" -ForegroundColor Gray
}
Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ Setup appears READY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. cd $projectPath" -ForegroundColor White
    Write-Host "2. npm run android" -ForegroundColor White
} else {
    Write-Host "⚠️  Some components are missing" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Follow ENVIRONMENT_SETUP_GUIDE.md for installation instructions" -ForegroundColor Cyan
}
Write-Host "================================" -ForegroundColor Cyan
