@echo off
REM Custom-Bite Suite Easy Launcher
REM Run this to start the emulator and app automatically

echo Setting up environment...
REM Quoted sets avoid trailing-space bugs and spaces inside JAVA_HOME (Gradle InvalidPathException).
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_SDK_ROOT=C:\Users\User\AppData\Local\Android\Sdk"
REM Gradle / React Native read ANDROID_HOME; ANDROID_SDK_ROOT alone is not enough.
set "ANDROID_HOME=%ANDROID_SDK_ROOT%"
set "PATH=%ANDROID_SDK_ROOT%\platform-tools;%ANDROID_SDK_ROOT%\emulator;%PATH%"
REM Keep Gradle caches in %USERPROFILE%\.gradle so native CMake paths stay under Windows MAX_PATH.
if not defined GRADLE_USER_HOME set "GRADLE_USER_HOME=%USERPROFILE%\.gradle"

echo Starting emulator (Medium_Phone)...
start "" emulator -avd Medium_Phone -no-snapshot-load

echo Waiting 45 seconds for emulator to boot...
timeout /t 45 /nobreak > nul

echo Checking if emulator is ready...
adb wait-for-device
REM Forward host debug ingest (127.0.0.1:7244 on device -> host) for agent NDJSON logs
adb reverse tcp:7244 tcp:7244

echo Starting the app...
cd /d C:\Users\User\Desktop\FOA\custom-bite-suite
npm.cmd run android

pause