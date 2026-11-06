'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { enSecondes } = require('../src/duree.js');

test('5 min donne 300 s', () => {
  assert.strictEqual(enSecondes('5 min'), 300);
});

test('l\'unité s est reconnue', () => {
  assert.strictEqual(enSecondes('30 s'), 30);
});

test('l\'unité min est reconnue', () => {
  assert.strictEqual(enSecondes('2 min'), 120);
});

test('l\'unité h est reconnue', () => {
  assert.strictEqual(enSecondes('1 h'), 3600);
});

test('l\'unité j est reconnue', () => {
  assert.strictEqual(enSecondes('2 j'), 172800);
});

test('sans espace entre le nombre et l\'unité: 2h donne 7200 s', () => {
  assert.strictEqual(enSecondes('2h'), 7200);
});

test('avec espace entre le nombre et l\'unité: 2 h donne 7200 s', () => {
  assert.strictEqual(enSecondes('2 h'), 7200);
});

test('sans espace, toutes les unités: 45s, 5min, 1j', () => {
  assert.strictEqual(enSecondes('45s'), 45);
  assert.strictEqual(enSecondes('5min'), 300);
  assert.strictEqual(enSecondes('1j'), 86400);
});

test('la virgule décimale est acceptée: 1,5 min donne 90 s', () => {
  assert.strictEqual(enSecondes('1,5 min'), 90);
});

test('une durée non reconnue lève une erreur qui donne des exemples', () => {
  assert.throws(
    () => enSecondes('beaucoup'),
    (erreur) => {
      assert.ok(erreur instanceof Error);
      assert.match(erreur.message, /exemple/i);
      assert.match(erreur.message, /5 min/);
      return true;
    }
  );
});

test('d\'autres entrées non reconnues lèvent une erreur', () => {
  for (const entree of ['', 'min', '5', '5 xyz', 'abc 5 min']) {
    assert.throws(() => enSecondes(entree), Error, `devrait refuser: "${entree}"`);
  }
});
