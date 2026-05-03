@echo off
REM ============================================================
REM  Custom-Bite Suite — Release APK Builder
REM  Run this script to produce a standalone APK for real devices.
REM  The resulting APK does NOT need a dev server to run.
REM ============================================================

echo Setting up environment...
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_SDK_ROOT=C:\Users\User\AppData\Local\Android\Sdk"
set "ANDROID_HOME=%ANDROID_SDK_ROOT%"
set "PATH=%ANDROID_SDK_ROOT%\platform-tools;%ANDROID_SDK_ROOT%\emulator;%PATH%"
if not defined GRADLE_USER_HOME set "GRADLE_USER_HOME=%USERPROFILE%\.gradle"

echo.
echo ============================================================
echo  Building RELEASE APK  (this takes a few minutes)...
echo ============================================================
cd /d C:\Users\User\Desktop\FOA\custom-bite-suite\android
call gradlew.bat assembleRelease

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Build FAILED. Check the output above for details.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Build SUCCESSFUL!
echo ============================================================

REM Copy the APK to the project root for easy access
set "APK_SRC=C:\Users\User\Desktop\FOA\custom-bite-suite\android\app\build\outputs\apk\release\app-release.apk"
set "APK_DST=C:\Users\User\Desktop\FOA\custom-bite-suite\CustomBiteSuite-release.apk"

if exist "%APK_SRC%" (
    copy /Y "%APK_SRC%" "%APK_DST%"
    echo.
    echo  APK copied to:
    echo  %APK_DST%
    echo.
    echo  Transfer this file to your phone and install it.
    echo  (Enable "Install from unknown sources" in Settings if prompted.)
) else (
    echo [WARNING] Could not find APK at expected path: %APK_SRC%
)

echo.
pause
