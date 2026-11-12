'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { enSecondes } = require('../src/duree.js');

const racine = path.join(__dirname, '..');
const cli = path.join(racine, 'src', 'cli.js');

function lancer(...args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: racine });
}

const LIGNES_ATTENDUES = ['5 min = 300 s', '2 h = 7200 s', '1 j = 86400 s'];

// BACAS-14, critère 1: --exemples affiche trois lignes au bon format, code 0

test('--exemples affiche trois lignes: 5 min = 300 s, 2 h = 7200 s, 1 j = 86400 s', () => {
  const r = lancer('--exemples');
  const lignes = r.stdout.trim().split(/\r?\n/);
  assert.strictEqual(lignes.length, 3);
  assert.deepStrictEqual(lignes, LIGNES_ATTENDUES);
});

test('--exemples se termine avec le code de sortie 0 et n\'écrit rien sur stderr', () => {
  const r = lancer('--exemples');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stderr.trim(), '');
});

// BACAS-14, critère 2: -e donne exactement le même résultat que --exemples

test('-e affiche les trois mêmes lignes et se termine avec le code 0', () => {
  const r = lancer('-e');
  assert.strictEqual(r.status, 0);
  assert.deepStrictEqual(r.stdout.trim().split(/\r?\n/), LIGNES_ATTENDUES);
});

test('-e et --exemples donnent exactement la même sortie standard, la même sortie d\'erreur et le même code', () => {
  const court = lancer('-e');
  const long = lancer('--exemples');
  assert.strictEqual(court.stdout, long.stdout);
  assert.strictEqual(court.stderr, long.stderr);
  assert.strictEqual(court.status, long.status);
});

// BACAS-14, critère 3: les valeurs viennent du convertisseur, pas écrites en dur

test('les valeurs affichées sont celles que enSecondes calcule pour 5 min, 2 h et 1 j', () => {
  const attendu = ['5 min', '2 h', '1 j'].map((d) => `${d} = ${enSecondes(d)} s`);
  assert.deepStrictEqual(lancer('--exemples').stdout.trim().split(/\r?\n/), attendu);
});

test('si le convertisseur change de résultat, --exemples affiche le nouveau résultat (valeurs non écrites en dur)', () => {
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'exemples-'));
  const prechargement = path.join(dossier, 'precharger.js');
  const cheminDuree = path.join(racine, 'src', 'duree.js');
  fs.writeFileSync(
    prechargement,
    [
      "'use strict';",
      `const duree = require(${JSON.stringify(cheminDuree)});`,
      'const original = duree.enSecondes;',
      'duree.enSecondes = (texte) => original(texte) + 1;',
      '',
    ].join('\n')
  );
  try {
    const r = spawnSync(process.execPath, ['--require', prechargement, cli, '--exemples'], {
      encoding: 'utf8',
      cwd: racine,
    });
    assert.strictEqual(r.status, 0);
    assert.deepStrictEqual(r.stdout.trim().split(/\r?\n/), [
      '5 min = 301 s',
      '2 h = 7201 s',
      '1 j = 86401 s',
    ]);
  } finally {
    fs.rmSync(dossier, { recursive: true, force: true });
  }
});

// BACAS-14, critère 4: l'aide mentionne --exemples, -e dans « Options », alignée sur les autres

function lignesOptions() {
  const sortie = lancer('--aide').stdout;
  const apresOptions = sortie.split(/^Options:\s*$/m)[1];
  assert.ok(apresOptions !== undefined, 'la section Options est absente');
  return apresOptions.split(/\r?\n/).filter((l) => /^\s*--/.test(l));
}

test('--aide mentionne --exemples, -e dans la section Options', () => {
  const r = lancer('--aide');
  assert.strictEqual(r.status, 0);
  const apresOptions = r.stdout.split(/^Options:\s*$/m)[1];
  assert.ok(apresOptions !== undefined, 'la section Options est absente');
  assert.match(apresOptions, /^\s*--exemples, -e\s+\S/m);
});

test('-h affiche la même aide, avec --exemples, -e', () => {
  const r = lancer('-h');
  assert.strictEqual(r.status, 0);
  assert.match(r.stdout, /^\s*--exemples, -e\s+\S/m);
});

test('la ligne de --exemples, -e est alignée sur les autres options: les descriptions commencent à la même colonne', () => {
  const lignes = lignesOptions();
  assert.ok(lignes.some((l) => l.includes('--exemples')), 'la ligne --exemples est absente');
  assert.ok(lignes.some((l) => l.includes('--aide')), 'la ligne --aide est absente');
  assert.ok(lignes.some((l) => l.includes('--version')), 'la ligne --version est absente');
  const colonnes = lignes.map((l) => {
    const m = /^(\s*--[a-z]+(?:, -[a-z])?\s+)\S/.exec(l);
    assert.ok(m, `ligne d'option mal formée: "${l}"`);
    return m[1].length;
  });
  assert.strictEqual(new Set(colonnes).size, 1, `colonnes de description différentes: ${colonnes.join(', ')}`);
});

test('l\'aide garde les lignes de --aide, -h et de --version, -v', () => {
  const r = lancer('--aide');
  assert.match(r.stdout, /^\s*--aide, -h\s+\S/m);
  assert.match(r.stdout, /^\s*--version, -v\s+\S/m);
});

// BACAS-14, critère 5: les conversions existantes ne changent pas

test('BACAS-14: 5 min donne 300 s (deux arguments)', () => {
  const r = lancer('5', 'min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('BACAS-14: 5 min donne 300 s (un seul argument)', () => {
  const r = lancer('5 min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('BACAS-14: une durée non reconnue échoue toujours avec un code différent de 0', () => {
  const r = lancer('beaucoup');
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
});
