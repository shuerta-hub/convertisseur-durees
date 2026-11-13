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

// Lecture seule: aucun test ne modifie package.json.
function descriptionDuPackage() {
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  return pkg.description;
}

function sectionOptions() {
  const sortie = lancer('--aide').stdout;
  const apres = sortie.split(/^Options:\s*$/m)[1];
  assert.ok(apres !== undefined, 'la section Options est absente');
  return apres;
}

// BACAS-24, critère 1: --description affiche une seule ligne, code 0

test('--description se termine avec le code de sortie 0 et n\'écrit rien sur stderr', () => {
  const r = lancer('--description');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
});

test('--description affiche une seule ligne non vide', () => {
  const r = lancer('--description');
  const lignes = r.stdout.replace(/\r?\n$/, '').split(/\r?\n/);
  assert.strictEqual(lignes.length, 1, `plusieurs lignes affichées: ${JSON.stringify(r.stdout)}`);
  assert.ok(lignes[0].trim().length > 0, 'la ligne est vide');
});

test('--description affiche une ligne qui contient la description du programme', () => {
  const r = lancer('--description');
  assert.ok(r.stdout.includes(descriptionDuPackage()), 'la description est absente de la sortie');
});

// BACAS-24, critère 2: -d donne exactement le même résultat que --description

test('-d se termine avec le code 0 et affiche une seule ligne', () => {
  const r = lancer('-d');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
  const lignes = r.stdout.replace(/\r?\n$/, '').split(/\r?\n/);
  assert.strictEqual(lignes.length, 1);
  assert.ok(lignes[0].trim().length > 0);
});

test('-d et --description donnent exactement la même sortie et le même code', () => {
  const court = lancer('-d');
  const long = lancer('--description');
  assert.strictEqual(court.stdout, long.stdout);
  assert.strictEqual(court.stderr, long.stderr);
  assert.strictEqual(court.status, long.status);
});

// BACAS-24, critère 3: la description affichée est celle de package.json

test('--description affiche exactement la description de package.json', () => {
  const r = lancer('--description');
  assert.strictEqual(r.stdout.trim(), descriptionDuPackage());
});

test('-d affiche exactement la description de package.json', () => {
  const r = lancer('-d');
  assert.strictEqual(r.stdout.trim(), descriptionDuPackage());
});

// BACAS-24, conception: la description n'est pas recopiée dans le code

test('la description de package.json n\'est pas recopiée dans src/cli.js', () => {
  const source = fs.readFileSync(cli, 'utf8');
  assert.ok(!source.includes(descriptionDuPackage()), 'la description est recopiée dans cli.js');
});

// BACAS-24, critère 4: l'aide mentionne --description, -d dans « Options », alignée

test('--aide mentionne --description, -d dans la section Options', () => {
  const r = lancer('--aide');
  assert.strictEqual(r.status, 0);
  assert.match(sectionOptions(), /^\s*--description, -d\s+\S/m);
});

test('-h affiche aussi --description, -d dans l\'aide', () => {
  const r = lancer('-h');
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /^\s*--description, -d\s+\S/m);
});

test('l\'aide garde les lignes de --aide, -h et de --version, -v', () => {
  const options = sectionOptions();
  assert.match(options, /^\s*--aide, -h\s+\S/m);
  assert.match(options, /^\s*--version, -v\s+\S/m);
});

test('les textes des options de l\'aide sont alignés dans la même colonne', () => {
  const lignes = sectionOptions().split(/\r?\n/).filter((l) => /^\s*-/.test(l));
  assert.ok(lignes.length >= 3, 'au moins trois options attendues dans la section Options');
  const colonnes = lignes.map((l) => {
    const m = /^(\s*--\S+, -\S+\s+)\S/.exec(l);
    assert.ok(m, `ligne d'option au format inattendu: "${l}"`);
    return m[1].length;
  });
  for (const c of colonnes) {
    assert.strictEqual(c, colonnes[0], `options non alignées: ${JSON.stringify(lignes)}`);
  }
});

// BACAS-24, critère 5: les conversions existantes ne changent pas

test('BACAS-24: 5 min donne 300 s (deux arguments)', () => {
  const r = lancer('5', 'min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('BACAS-24: 5 min donne 300 s (un seul argument)', () => {
  const r = lancer('5 min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('BACAS-24: une durée non reconnue échoue toujours avec un code différent de 0', () => {
  const r = lancer('beaucoup');
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
});
