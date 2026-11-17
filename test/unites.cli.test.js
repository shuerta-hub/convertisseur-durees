'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const racine = path.join(__dirname, '..');
const cli = path.join(racine, 'src', 'cli.js');
const { UNITES } = require('../src/duree.js');

function lancer(...args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: racine });
}

// Les unités attendues viennent de la table UNITES de duree.js, dans son ordre.
const LISTE_ATTENDUE = Object.keys(UNITES);

function lignes(sortie) {
  return sortie.replace(/\r?\n$/, '').split(/\r?\n/);
}

// BACAS-32, critère 1: --unites affiche une unité par ligne, dans l'ordre de la table, code 0

test('--unites se termine avec le code de sortie 0 et n\'écrit rien sur stderr', () => {
  const r = lancer('--unites');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
});

test('--unites affiche une unité par ligne, dans l\'ordre de la table des unités', () => {
  const r = lancer('--unites');
  assert.deepStrictEqual(lignes(r.stdout).map((l) => l.trim()), LISTE_ATTENDUE);
});

test('--unites affiche exactement une ligne par unité de la table, sans ligne en trop', () => {
  const r = lancer('--unites');
  assert.strictEqual(lignes(r.stdout).length, LISTE_ATTENDUE.length);
  assert.ok(LISTE_ATTENDUE.length > 0, 'la table des unités est vide');
});

// BACAS-32, conception: la liste vient de UNITES, sans être recopiée dans cli.js

test('la liste des unités n\'est pas recopiée dans src/cli.js', () => {
  const source = fs.readFileSync(cli, 'utf8');
  assert.ok(source.includes('UNITES'), 'cli.js doit utiliser la table UNITES');
  assert.ok(
    !/['"]s['"]\s*,\s*['"]min['"]\s*,\s*['"]h['"]/.test(source),
    'la liste des unités semble recopiée dans cli.js'
  );
});

// BACAS-32, critère 2: -u donne exactement la même sortie que --unites

test('-u se termine avec le code 0 et affiche la liste des unités', () => {
  const r = lancer('-u');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
  assert.deepStrictEqual(lignes(r.stdout).map((l) => l.trim()), LISTE_ATTENDUE);
});

test('-u et --unites donnent exactement la même sortie et le même code', () => {
  const court = lancer('-u');
  const long = lancer('--unites');
  assert.strictEqual(court.stdout, long.stdout);
  assert.strictEqual(court.stderr, long.stderr);
  assert.strictEqual(court.status, long.status);
});

// BACAS-32, critère 3: --unites 5 affiche la même liste, sans convertir

test('--unites 5 affiche la même liste que --unites, avec le code 0', () => {
  const seul = lancer('--unites');
  const avec = lancer('--unites', '5');
  assert.strictEqual(avec.status, 0);
  assert.strictEqual(avec.stdout, seul.stdout);
  assert.strictEqual(avec.stderr.trim(), '');
});

test('--unites 5 ne convertit pas la durée: aucune ligne "s" de résultat', () => {
  const r = lancer('--unites', '5');
  assert.deepStrictEqual(lignes(r.stdout).map((l) => l.trim()), LISTE_ATTENDUE);
  assert.doesNotMatch(r.stdout, /\d/);
});

// BACAS-32, critère 4: les conversions existantes ne changent pas

test('5 min donne 300 s (un seul argument)', () => {
  const r = lancer('5 min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('5 min donne 300 s (deux arguments)', () => {
  const r = lancer('5', 'min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('une durée non reconnue échoue toujours avec un code différent de 0', () => {
  const r = lancer('beaucoup');
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
});
