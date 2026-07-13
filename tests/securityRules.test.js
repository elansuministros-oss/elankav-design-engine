'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
]);

function walk(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  const files = [];

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

test('el repositorio no contiene archivos de secretos', () => {
  const forbiddenNames = [
    '.env',
    'id_rsa',
    'id_ed25519',
  ];

  const forbiddenExtensions = [
    '.pem',
    '.key',
    '.p12',
    '.pfx',
  ];

  const violations = walk(ROOT).filter((file) => {
    const name = path.basename(file);
    const extension = path.extname(file);

    return (
      forbiddenNames.includes(name) ||
      forbiddenExtensions.includes(extension)
    );
  });

  assert.deepEqual(violations, []);
});

test('el código no contiene credenciales GitHub ni Supabase', () => {
  const textFiles = walk(ROOT).filter((file) =>
    [
      '.js',
      '.json',
      '.md',
      '.txt',
      '.yml',
      '.yaml',
    ].includes(path.extname(file))
  );

  const forbiddenPatterns = [
    /ghp_[A-Za-z0-9_]+/,
    /github_pat_[A-Za-z0-9_]+/,
    /SUPABASE_SERVICE_ROLE_KEY\s*=/,
    /SUPABASE_SERVICE_KEY\s*=/,
    /sk-[A-Za-z0-9_-]{20,}/,
  ];

  const violations = [];

  for (const file of textFiles) {
    const content = fs.readFileSync(file, 'utf8');

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        violations.push({
          file: path.relative(ROOT, file),
          pattern: pattern.toString(),
        });
      }
    }
  }

  assert.deepEqual(violations, []);
});

test('Git no contiene rutas para renders generados', () => {
  const forbiddenDirectories = [
    'renders',
    'assets/generated',
    'temp',
    'tmp',
  ];

  const violations = forbiddenDirectories.filter((directory) =>
    fs.existsSync(path.join(ROOT, directory))
  );

  assert.deepEqual(violations, []);
});

test('la configuración mantiene proveedores externos deshabilitados', () => {
  const config = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'config/default.json'),
      'utf8'
    )
  );

  assert.equal(
    config.engine.externalProvidersEnabled,
    false
  );

  assert.equal(
    config.engine.realImageGenerationEnabled,
    false
  );

  assert.equal(
    config.engine.videoGenerationEnabled,
    false
  );

  assert.equal(
    config.engine.productionSupabaseEnabled,
    false
  );
});
