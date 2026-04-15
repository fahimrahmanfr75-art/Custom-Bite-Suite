/**
 * Removes native/CMake caches so the next Gradle build regenerates prefab paths
 * (needed after GRADLE_USER_HOME / New Architecture changes or Windows MAX_PATH errors).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const relPaths = [
  'android/.gradle',
  'android/build',
  'android/app/.cxx',
  'android/app/build',
  'node_modules/expo-modules-core/android/.cxx',
  'node_modules/expo-modules-core/android/build',
  'node_modules/react-native-screens/android/.cxx',
  'node_modules/react-native-screens/android/build',
  'node_modules/react-native-worklets/android/.cxx',
  'node_modules/react-native-worklets/android/build',
  'node_modules/react-native-reanimated/android/.cxx',
  'node_modules/react-native-gesture-handler/android/.cxx',
];

for (const rel of relPaths) {
  const target = path.join(root, rel);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    process.stdout.write(`removed ${rel}\n`);
  }
}
