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

function versionDuPackage() {
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  return pkg.version;
}

// BACAS-9, critère 1: --version affiche la version de package.json, code 0

test('--version affiche le numéro de version de package.json', () => {
  const r = lancer('--version');
  assert.strictEqual(r.stdout.trim(), versionDuPackage());
});

test('--version se termine avec le code de sortie 0 et ne écrit rien sur stderr', () => {
  const r = lancer('--version');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
});

test('--version affiche un numéro de version de la forme x.y.z', () => {
  const r = lancer('--version');
  assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+/);
});

// BACAS-9, conception: la version est lue dans package.json au moment de l'appel

test('--version lit package.json au moment de l\'appel, sans recopier le numéro dans le code', () => {
  const chemin = path.join(racine, 'package.json');
  const original = fs.readFileSync(chemin, 'utf8');
  try {
    const pkg = JSON.parse(original);
    pkg.version = '9.8.7-essai';
    fs.writeFileSync(chemin, JSON.stringify(pkg, null, 2) + '\n');
    const r = lancer('--version');
    assert.strictEqual(r.status, 0);
    assert.strictEqual(r.stdout.trim(), '9.8.7-essai');
  } finally {
    fs.writeFileSync(chemin, original);
  }
});

// BACAS-9, critère 2: les conversions existantes ne changent pas

test('5 min donne 300 s', () => {
  const r = lancer('5', 'min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('5 min (un seul argument) donne 300 s', () => {
  const r = lancer('5 min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('une durée non reconnue échoue toujours avec un code différent de 0', () => {
  const r = lancer('beaucoup');
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
});

// BACAS-9, critère 3: l'aide mentionne --version

test('--aide mentionne --version', () => {
  const r = lancer('--aide');
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /--version/);
});

test('-h mentionne aussi --version', () => {
  const r = lancer('-h');
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /--version/);
});

test('la ligne de --version se trouve dans la liste des options de l\'aide', () => {
  const sortie = lancer('--aide').stdout;
  const apresOptions = sortie.split(/^Options:\s*$/m)[1];
  assert.ok(apresOptions !== undefined, 'la section Options est absente');
  assert.match(apresOptions, /--version/);
});
