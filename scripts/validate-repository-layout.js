const fs = require('fs');
const path = require('path');

const root = process.cwd();

const mandatory = [
  '.github',
  'artifacts',
  'assets',
  'scripts',
  'src',
  '__tests__',
  '.gitattributes',
  '.gitignore',
  'app.json',
  'App.tsx',
  'babel.config.js',
  'build_release_apk.bat',
  'eslint.config.js',
  'index.ts',
  'jest.config.js',
  'package.json',
  'package-lock.json',
  'run_emulator.bat',
  'tsconfig.json',
];

const generatedShouldBeIgnored = [
  'node_modules',
  '.expo',
  'dist',
  'generated',
  '.cursor',
  '.gradle-local',
  '.idea',
  '.vscode',
  '.zed',
  'CustomBiteSuite-release.apk',
  path.join('android', '.gradle'),
  path.join('android', '.kotlin'),
  path.join('android', 'app', '.cxx'),
  path.join('android', 'app', 'build'),
  path.join('android', 'build'),
];

function missingMandatory() {
  return mandatory.filter((entry) => !fs.existsSync(path.join(root, entry)));
}

function presentGenerated() {
  return generatedShouldBeIgnored.filter((entry) => fs.existsSync(path.join(root, entry)));
}

const missing = missingMandatory();
const present = presentGenerated();

console.log('Mandatory paths missing:', missing.length ? missing : 'none');
console.log('Generated/local paths currently present:', present.length ? present : 'none');

if (missing.length > 0) {
  process.exitCode = 1;
}
