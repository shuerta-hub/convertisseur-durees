'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const racine = path.join(__dirname, '..');
const cli = path.join(racine, 'src', 'cli.js');

function lancer(...args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: racine });
}

// BACAS-2: interface en ligne de commande avec sem

test('node src/cli.js 1 sem (deux arguments) affiche 604800 s', () => {
  const r = lancer('1', 'sem');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '604800 s');
});

test('node src/cli.js "1 sem" (un argument) affiche 604800 s', () => {
  const r = lancer('1 sem');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '604800 s');
});

test('node src/cli.js 2sem affiche 1209600 s', () => {
  const r = lancer('2sem');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '1209600 s');
});

test('node src/cli.js 2 sem affiche 1209600 s', () => {
  const r = lancer('2', 'sem');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '1209600 s');
});

test('node src/cli.js 0,5 sem affiche 302400 s', () => {
  const r = lancer('0,5', 'sem');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '302400 s');
});

test('node src/cli.js 5 min affiche toujours 300 s', () => {
  const r = lancer('5', 'min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('npm run verifier existe dans package.json, lance seulement node, sans dépendance', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts && pkg.scripts.verifier, 'script verifier manquant');
  assert.match(pkg.scripts.verifier, /^node\s/);
  assert.doesNotMatch(pkg.scripts.verifier, /&&|;|\|/);
  assert.ok(!pkg.dependencies && !pkg.devDependencies, 'aucune dépendance permise');
});
