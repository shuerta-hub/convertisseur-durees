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

function mots(texte) {
  return texte.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// BACAS-36, critère 1: convertir "1 mois" affiche 2592000 s

test('convertir "1 mois" affiche 2592000 s et termine avec le code 0', () => {
  const r = lancer('1 mois');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '2592000 s');
  assert.strictEqual(r.stderr.trim(), '');
});

test('convertir 1 mois (deux arguments) affiche 2592000 s', () => {
  const r = lancer('1', 'mois');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '2592000 s');
});

// BACAS-36, critère 2: convertir "2mois" affiche 5184000 s

test('convertir "2mois" affiche 5184000 s et termine avec le code 0', () => {
  const r = lancer('2mois');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '5184000 s');
  assert.strictEqual(r.stderr.trim(), '');
});

// BACAS-36, critère 3: 2 sem et 5 min donnent toujours le même résultat

test('convertir "2 sem" affiche toujours 1209600 s', () => {
  const r = lancer('2 sem');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '1209600 s');
});

test('convertir "5 min" affiche toujours 300 s', () => {
  const r = lancer('5 min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('une durée non reconnue échoue toujours avec un code différent de 0', () => {
  const r = lancer('beaucoup');
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
  assert.strictEqual(r.stdout.trim(), '');
});

// BACAS-36, critère 4: l'aide liste l'unité mois

test('--aide liste l\'unité mois', () => {
  const r = lancer('--aide');
  assert.strictEqual(r.status, 0);
  assert.ok(mots(r.stdout).includes('mois'), 'l\'unité "mois" n\'apparaît pas dans l\'aide');
});

test('l\'unité mois apparaît dans la section « Unités reconnues » de l\'aide', () => {
  const sortie = lancer('--aide').stdout;
  const section = sortie.split(/^Unités reconnues:\s*$/m)[1];
  assert.ok(section !== undefined, 'la section Unités reconnues est absente');
  const avantExemple = section.split(/^Exemple/m)[0];
  assert.match(avantExemple, /^\s*mois\b/m);
});

test('-h liste aussi l\'unité mois', () => {
  const r = lancer('-h');
  assert.strictEqual(r.status, 0);
  assert.ok(mots(r.stdout).includes('mois'), 'l\'unité "mois" n\'apparaît pas dans l\'aide (-h)');
});

// BACAS-36, limites: pas de nouveau script, pas de dépendance

test('package.json garde le script convertir sur node, sans dépendance', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.scripts.convertir, 'node src/cli.js');
  assert.match(pkg.scripts.verifier, /^node\s+--test/);
  assert.ok(!pkg.dependencies && !pkg.devDependencies, 'aucune dépendance permise');
});
