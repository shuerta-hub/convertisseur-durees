'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const racine = path.join(__dirname, '..');
const cli = path.join(racine, 'src', 'cli.js');

function lancer(...args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: racine });
}

function lignes(sortie) {
  return sortie.replace(/\r?\n$/, '').split(/\r?\n/).map((l) => l.trim());
}

// BACAS-34, critère 1: "1 an" affiche 31536000 s, code 0

test('convertir "1 an" affiche 31536000 s et termine avec le code 0', () => {
  const r = lancer('1 an');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '31536000 s');
  assert.strictEqual(r.stderr.trim(), '');
});

// BACAS-34, critère 2: "2 an" affiche 63072000 s

test('convertir "2 an" affiche 63072000 s', () => {
  const r = lancer('2 an');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '63072000 s');
});

// BACAS-34, critère 3: "1,5 an" affiche 47304000 s

test('convertir "1,5 an" affiche 47304000 s', () => {
  const r = lancer('1,5 an');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '47304000 s');
});

test('convertir 1 an (deux arguments) affiche 31536000 s', () => {
  const r = lancer('1', 'an');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '31536000 s');
});

// BACAS-34, critère 4: --unites liste aussi an, à la suite des autres, une par ligne

test('--unites liste an à la suite des autres unités, une par ligne', () => {
  const r = lancer('--unites');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
  assert.deepStrictEqual(lignes(r.stdout), ['ms', 's', 'min', 'h', 'j', 'sem', 'an']);
});

test('-u liste aussi an', () => {
  const r = lancer('-u');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(lignes(r.stdout).at(-1), 'an');
});

// BACAS-34, critère 5: "5 min" affiche toujours 300 s

test('convertir "5 min" affiche toujours 300 s', () => {
  const r = lancer('5 min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('une durée non reconnue échoue toujours avec un code différent de 0', () => {
  const r = lancer('beaucoup');
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
});
