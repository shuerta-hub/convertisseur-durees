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

const LIGNES_ATTENDUES = [
  's = 1 s',
  'min = 60 s',
  'h = 3600 s',
  'j = 86400 s',
  'sem = 604800 s',
];

function lignesNonVides(texte) {
  return texte.split('\n').filter((l) => l.trim() !== '');
}

// BACAS-13, critère 1: --unites affiche une ligne par unité, code 0

test('--unites se termine avec le code de sortie 0 et n\'écrit rien sur stderr', () => {
  const r = lancer('--unites');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
  assert.ok(r.stdout.trim().length > 0, 'la sortie standard est vide');
});

test('--unites affiche une ligne par unité reconnue, au format « unité = valeur s »', () => {
  const r = lancer('--unites');
  assert.deepStrictEqual(lignesNonVides(r.stdout).map((l) => l.trim()), LIGNES_ATTENDUES);
});

test('--unites affiche s = 1 s, min = 60 s, h = 3600 s, j = 86400 s, sem = 604800 s', () => {
  const r = lancer('--unites');
  for (const ligne of LIGNES_ATTENDUES) {
    assert.ok(
      lignesNonVides(r.stdout).some((l) => l.trim() === ligne),
      `la ligne "${ligne}" est absente`
    );
  }
});

test('--unites ne liste que les unités: pas d\'usage ni d\'aide', () => {
  const r = lancer('--unites');
  assert.doesNotMatch(r.stdout, /usage/i);
  assert.doesNotMatch(r.stdout, /options/i);
  assert.strictEqual(lignesNonVides(r.stdout).length, LIGNES_ATTENDUES.length);
});

// BACAS-13, conception: la liste vient de la même table que les conversions

test('la liste affichée correspond exactement à la table UNITES de duree.js', () => {
  const { UNITES } = require('../src/duree.js');
  const attendues = Object.entries(UNITES).map(([unite, secondes]) => `${unite} = ${secondes} s`);
  const r = lancer('--unites');
  assert.deepStrictEqual(lignesNonVides(r.stdout).map((l) => l.trim()), attendues);
});

// BACAS-13, critère 2: -u donne exactement le même résultat que --unites

test('-u se termine avec le code 0 et n\'écrit rien sur stderr', () => {
  const r = lancer('-u');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
});

test('-u et --unites donnent exactement la même sortie et le même code', () => {
  const court = lancer('-u');
  const long = lancer('--unites');
  assert.strictEqual(court.stdout, long.stdout);
  assert.strictEqual(court.stderr, long.stderr);
  assert.strictEqual(court.status, long.status);
});

test('-u affiche une ligne par unité reconnue', () => {
  const r = lancer('-u');
  assert.deepStrictEqual(lignesNonVides(r.stdout).map((l) => l.trim()), LIGNES_ATTENDUES);
});

// BACAS-13, critère 3: l'aide mentionne --unites, -u dans la section Options, alignée

test('--aide mentionne --unites, -u dans la section Options', () => {
  const r = lancer('--aide');
  assert.strictEqual(r.status, 0);
  const apresOptions = r.stdout.split(/^Options:\s*$/m)[1];
  assert.ok(apresOptions !== undefined, 'la section Options est absente');
  assert.match(apresOptions, /^\s*--unites, -u\s+\S/m);
});

test('-h affiche la même aide, avec --unites, -u', () => {
  const r = lancer('-h');
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /^\s*--unites, -u\s+\S/m);
});

test('la ligne --unites, -u est alignée sur les autres options de l\'aide', () => {
  const sortie = lancer('--aide').stdout;
  const apresOptions = sortie.split(/^Options:\s*$/m)[1];
  assert.ok(apresOptions !== undefined, 'la section Options est absente');
  const lignes = apresOptions.split('\n').filter((l) => /^\s*-/.test(l));
  const colonne = (l) => {
    const m = /^(\s*--\S+, -\S\s+)\S/.exec(l);
    assert.ok(m, `ligne d'option inattendue: "${l}"`);
    return m[1].length;
  };
  const ligneUnites = lignes.find((l) => l.includes('--unites'));
  const ligneAide = lignes.find((l) => l.includes('--aide'));
  const ligneVersion = lignes.find((l) => l.includes('--version'));
  assert.ok(ligneUnites, 'la ligne --unites est absente');
  assert.strictEqual(colonne(ligneUnites), colonne(ligneAide));
  assert.strictEqual(colonne(ligneUnites), colonne(ligneVersion));
});

test('l\'aide garde les lignes de --aide, -h et de --version, -v', () => {
  const r = lancer('--aide');
  assert.match(r.stdout, /^\s*--aide, -h\s+\S/m);
  assert.match(r.stdout, /^\s*--version, -v\s+\S/m);
});

// BACAS-13, critère 4: les conversions existantes ne changent pas

test('BACAS-13: 5 min donne 300 s (deux arguments)', () => {
  const r = lancer('5', 'min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('BACAS-13: 5 min donne 300 s (un seul argument)', () => {
  const r = lancer('5 min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('BACAS-13: une durée non reconnue échoue toujours avec un code différent de 0', () => {
  const r = lancer('beaucoup');
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
});
