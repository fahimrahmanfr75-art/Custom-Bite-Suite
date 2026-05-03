const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const ignoredDirectories = new Set([
  '.cursor',
  '.expo',
  '.git',
  '.gradle-local',
  '.idea',
  '.vscode',
  'android',
  'artifacts',
  'dist',
  'node_modules',
]);

const textFileExtensions = new Set([
  '.bat',
  '.cjs',
  '.css',
  '.gradle',
  '.java',
  '.js',
  '.json',
  '.kt',
  '.md',
  '.mjs',
  '.properties',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
]);

const violations = [];

function getLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function recordViolations(relativePath, content, pattern, message) {
  let match;
  pattern.lastIndex = 0;

  while ((match = pattern.exec(content)) !== null) {
    violations.push({
      file: relativePath,
      line: getLineNumber(content, match.index),
      message,
    });
  }
}

function scanFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (!textFileExtensions.has(extension)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(rootDir, filePath);

  recordViolations(
    relativePath,
    content,
    /usesCleartextTraffic\s*[:=]\s*true/g,
    'Cleartext Android transport override is enabled.',
  );
  recordViolations(
    relativePath,
    content,
    /http:\/\//g,
    'Plain HTTP URL detected.',
  );
}

function walkDirectory(directoryPath) {
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }

      walkDirectory(path.join(directoryPath, entry.name));
      continue;
    }

    if (entry.isFile()) {
      scanFile(path.join(directoryPath, entry.name));
    }
  }
}

walkDirectory(rootDir);

if (violations.length > 0) {
  console.error('Transport security policy check failed:');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} ${violation.message}`);
  }
  process.exit(1);
}

console.log('Transport security policy check passed.');
