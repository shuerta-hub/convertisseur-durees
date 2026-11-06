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

test('package.json définit les scripts convertir et verifier, qui lancent seulement node', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts, 'scripts manquants');
  for (const nom of ['convertir', 'verifier']) {
    assert.ok(pkg.scripts[nom], `script ${nom} manquant`);
    assert.match(pkg.scripts[nom], /^node\s/);
    assert.doesNotMatch(pkg.scripts[nom], /&&|;|\|/);
  }
  assert.ok(!pkg.dependencies && !pkg.devDependencies, 'aucune dépendance permise');
});

test('convertir "5 min" affiche 300 s et termine avec le code 0', () => {
  const r = lancer('5 min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '300 s');
});

test('2h et 2 h affichent 7200 s', () => {
  assert.strictEqual(lancer('2h').stdout.trim(), '7200 s');
  assert.strictEqual(lancer('2 h').stdout.trim(), '7200 s');
});

test('1,5 min affiche 90 s', () => {
  const r = lancer('1,5 min');
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout.trim(), '90 s');
});

test('une durée non reconnue (beaucoup) affiche une erreur avec exemples et un code de sortie différent de 0', () => {
  const r = lancer('beaucoup');
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
  assert.match(r.stderr, /5 min/);
  assert.strictEqual(r.stdout.trim(), '');
});

test('sans argument, le programme termine avec un code différent de 0', () => {
  const r = lancer();
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /exemple/i);
});
