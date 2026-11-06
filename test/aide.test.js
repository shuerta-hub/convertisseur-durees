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

const UNITES_ATTENDUES = ['s', 'min', 'h', 'j', 'sem'];

// BACAS-4, critère 1: --aide affiche l'usage, les unités et un exemple, code 0

test('--aide se termine avec le code de sortie 0 et écrit sur la sortie standard, rien sur stderr', () => {
  const r = lancer('--aide');
  assert.strictEqual(r.status, 0);
  assert.ok(r.stdout.trim().length > 0, 'la sortie standard est vide');
  assert.strictEqual(r.stderr.trim(), '');
});

test('--aide affiche l\'usage du programme', () => {
  const r = lancer('--aide');
  assert.match(r.stdout, /usage/i);
  assert.match(r.stdout, /convertir/);
});

test('--aide liste chacune des unités reconnues: s, min, h, j, sem', () => {
  const r = lancer('--aide');
  const lesMots = mots(r.stdout);
  for (const unite of UNITES_ATTENDUES) {
    assert.ok(lesMots.includes(unite), `l'unité "${unite}" n'apparaît pas dans l'aide`);
  }
});

test('--aide affiche un exemple de durée', () => {
  const r = lancer('--aide');
  assert.match(r.stdout, /exemple/i);
  assert.match(r.stdout, /\d+(?:[.,]\d+)?\s*(?:sem|min|s|h|j)\b/);
});

// BACAS-4, critère 2: -h donne la même aide

test('-h se termine avec le code 0 et liste les unités et un exemple', () => {
  const r = lancer('-h');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
  assert.match(r.stdout, /usage/i);
  assert.match(r.stdout, /exemple/i);
  const lesMots = mots(r.stdout);
  for (const unite of UNITES_ATTENDUES) {
    assert.ok(lesMots.includes(unite), `l'unité "${unite}" n'apparaît pas dans l'aide (-h)`);
  }
});

test('-h et --aide affichent le même texte', () => {
  assert.strictEqual(lancer('-h').stdout, lancer('--aide').stdout);
});

// BACAS-4, conception: la liste des unités de l'aide vient de la même source que la conversion

test('la source des unités est exportée par duree.js et l\'aide affiche chacune de ses unités', () => {
  const { UNITES } = require('../src/duree.js');
  assert.ok(UNITES && typeof UNITES === 'object', 'duree.js doit exporter UNITES');
  assert.deepStrictEqual(Object.keys(UNITES).sort(), [...UNITES_ATTENDUES].sort());
  const lesMots = mots(lancer('--aide').stdout);
  for (const unite of Object.keys(UNITES)) {
    assert.ok(lesMots.includes(unite), `l'unité "${unite}" de la source n'est pas dans l'aide`);
  }
});

test('la fonction de conversion est toujours exportée par duree.js', () => {
  const { enSecondes } = require('../src/duree.js');
  assert.strictEqual(typeof enSecondes, 'function');
  assert.strictEqual(enSecondes('5 min'), 300);
});

// BACAS-4, critère 3: les conversions existantes ne changent pas

test('5 min donne toujours 300 s (deux arguments et un argument)', () => {
  const deux = lancer('5', 'min');
  assert.strictEqual(deux.status, 0);
  assert.strictEqual(deux.stdout.trim(), '300 s');
  const un = lancer('5 min');
  assert.strictEqual(un.status, 0);
  assert.strictEqual(un.stdout.trim(), '300 s');
});

test('une durée non reconnue échoue toujours avec un code différent de 0', () => {
  const r = lancer('beaucoup');
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
});

// BACAS-4, critère 4: npm run verifier existe et lance les tests avec node seulement

test('le script verifier de package.json lance seulement node --test, sans dépendance', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts && pkg.scripts.verifier, 'script verifier manquant');
  assert.match(pkg.scripts.verifier, /^node\s+--test/);
  assert.doesNotMatch(pkg.scripts.verifier, /&&|;|\|/);
  assert.ok(!pkg.dependencies && !pkg.devDependencies, 'aucune dépendance permise');
});
