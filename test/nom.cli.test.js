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

// Lecture seule de package.json: aucun test de ce fichier ne le modifie.
function nomDuPackage() {
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  return pkg.name;
}

// Colonne où commence la description d'une ligne d'option (« --xxx, -x   description »).
function colonneDescription(ligne) {
  const m = /^(\s*--\S+, -\S\s+)\S/.exec(ligne);
  return m ? m[1].length : -1;
}

function ligneAvec(sortie, option) {
  return sortie.split('\n').find((l) => l.includes(option));
}

// BACAS-15, critère 1: --nom affiche le nom de package.json, code 0

test('--nom affiche le nom du programme lu dans package.json', () => {
  const r = lancer('--nom');
  assert.strictEqual(r.stdout.trim(), nomDuPackage());
});

test('--nom affiche convertisseur-durees, le nom actuel de package.json', () => {
  const r = lancer('--nom');
  assert.strictEqual(r.stdout.trim(), 'convertisseur-durees');
});

test('--nom se termine avec le code de sortie 0 et n\'écrit rien sur stderr', () => {
  const r = lancer('--nom');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
});

test('--nom n\'affiche pas la version à la place du nom', () => {
  const r = lancer('--nom');
  assert.doesNotMatch(r.stdout.trim(), /^\d+\.\d+\.\d+/);
});

// BACAS-15, critère 2: -n donne exactement le même résultat que --nom

test('-n affiche le nom du programme lu dans package.json', () => {
  const r = lancer('-n');
  assert.strictEqual(r.stdout.trim(), nomDuPackage());
});

test('-n se termine avec le code de sortie 0 et n\'écrit rien sur stderr', () => {
  const r = lancer('-n');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
});

test('-n et --nom donnent exactement la même sortie et le même code', () => {
  const court = lancer('-n');
  const long = lancer('--nom');
  assert.strictEqual(court.stdout, long.stdout);
  assert.strictEqual(court.stderr, long.stderr);
  assert.strictEqual(court.status, long.status);
});

// BACAS-15, critère 3: l'aide mentionne --nom, -n dans « Options », alignée

test('--aide mentionne --nom, -n', () => {
  const r = lancer('--aide');
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /--nom, -n/);
});

test('la ligne de --nom, -n se trouve dans la liste des options de l\'aide', () => {
  const sortie = lancer('--aide').stdout;
  const apresOptions = sortie.split(/^Options:\s*$/m)[1];
  assert.ok(apresOptions !== undefined, 'la section Options est absente');
  assert.match(apresOptions, /^\s*--nom, -n\s+\S/m);
});

test('la ligne de --nom, -n est alignée sur celles de --aide, -h et --version, -v', () => {
  const sortie = lancer('--aide').stdout;
  const ligneNom = ligneAvec(sortie, '--nom');
  const ligneAide = ligneAvec(sortie, '--aide, -h');
  const ligneVersion = ligneAvec(sortie, '--version, -v');
  assert.ok(ligneNom !== undefined, 'aucune ligne ne mentionne --nom');
  const colonne = colonneDescription(ligneNom);
  assert.ok(colonne > 0, `la ligne de --nom n'a pas la forme attendue: "${ligneNom}"`);
  assert.strictEqual(colonne, colonneDescription(ligneAide), 'description non alignée sur --aide, -h');
  assert.strictEqual(colonne, colonneDescription(ligneVersion), 'description non alignée sur --version, -v');
});

test('-h affiche la même aide, avec --nom, -n dans les options', () => {
  const r = lancer('-h');
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /^\s*--nom, -n\s+\S/m);
});

test('l\'aide garde les lignes de --aide, -h et de --version, -v', () => {
  const r = lancer('--aide');
  assert.match(r.stdout, /^\s*--aide, -h\s+\S/m);
  assert.match(r.stdout, /^\s*--version, -v\s+\S/m);
});

// BACAS-15, critère 4: les conversions existantes ne changent pas

test('BACAS-15: 5 min donne 300 s (deux arguments)', () => {
  const r = lancer('5', 'min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('BACAS-15: 5 min donne 300 s (un seul argument)', () => {
  const r = lancer('5 min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('BACAS-15: une durée non reconnue échoue toujours avec un code différent de 0', () => {
  const r = lancer('beaucoup');
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
});

test('BACAS-15: --version et -v affichent toujours la version', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  assert.strictEqual(lancer('--version').stdout.trim(), pkg.version);
  assert.strictEqual(lancer('-v').stdout.trim(), pkg.version);
});
