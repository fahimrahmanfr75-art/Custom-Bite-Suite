/**
 * Wrapper for `expo run:android` that trims ANDROID_HOME / ANDROID_SDK_ROOT.
 * Trailing spaces in those env vars cause Gradle:
 * InvalidPathException: Trailing char < > at index ... : C:\...\Sdk␠
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Windows: Gradle caches under the repo (e.g. android/.gradle-user) can make CMake/ninja paths exceed MAX_PATH (~260).
if (process.platform === 'win32' && process.env.CUSTOM_BITE_SKIP_HOME_GRADLE !== '1') {
  process.env.GRADLE_USER_HOME = path.join(os.homedir(), '.gradle');
}

const rawHome = process.env.ANDROID_HOME || '';
const rawSdk = process.env.ANDROID_SDK_ROOT || '';
const trimmedHome = rawHome.trim();
const trimmedSdk = rawSdk.trim() || trimmedHome;

if (trimmedSdk) {
  process.env.ANDROID_HOME = trimmedHome || trimmedSdk;
  process.env.ANDROID_SDK_ROOT = trimmedSdk;
}

const androidDir = path.join(__dirname, '..', 'android');
if (trimmedSdk && fs.existsSync(androidDir)) {
  const sdkDir = trimmedSdk.replace(/\\/g, '/');
  fs.writeFileSync(path.join(androidDir, 'local.properties'), `sdk.dir=${sdkDir}\n`, 'utf8');
}

const args = process.argv.slice(2);
const result = spawnSync('npx', ['expo', 'run:android', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
