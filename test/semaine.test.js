'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { enSecondes } = require('../src/duree.js');

// BACAS-2: l'unité sem (semaine = 604800 s)

test('1 sem donne 604800 s', () => {
  assert.strictEqual(enSecondes('1 sem'), 604800);
});

test('sem est reconnue sans espace: 2sem donne 1209600 s', () => {
  assert.strictEqual(enSecondes('2sem'), 1209600);
});

test('sem est reconnue avec espace: 2 sem donne 1209600 s', () => {
  assert.strictEqual(enSecondes('2 sem'), 1209600);
});

test('la virgule décimale fonctionne avec sem: 0,5 sem donne 302400 s', () => {
  assert.strictEqual(enSecondes('0,5 sem'), 302400);
});

test('la virgule décimale fonctionne avec sem sans espace: 0,5sem donne 302400 s', () => {
  assert.strictEqual(enSecondes('0,5sem'), 302400);
});

// Non-régression: les unités déjà reconnues donnent les mêmes résultats qu'avant

test('non-régression: s, min, h, j donnent les mêmes valeurs qu\'avant', () => {
  assert.strictEqual(enSecondes('30 s'), 30);
  assert.strictEqual(enSecondes('5 min'), 300);
  assert.strictEqual(enSecondes('2 h'), 7200);
  assert.strictEqual(enSecondes('2 j'), 172800);
});

test('non-régression: sans espace et avec virgule pour les unités existantes', () => {
  assert.strictEqual(enSecondes('45s'), 45);
  assert.strictEqual(enSecondes('5min'), 300);
  assert.strictEqual(enSecondes('2h'), 7200);
  assert.strictEqual(enSecondes('1j'), 86400);
  assert.strictEqual(enSecondes('1,5 min'), 90);
});

test('non-régression: une durée non reconnue lève toujours une erreur', () => {
  for (const entree of ['', 'sem', '5', '5 xyz', 'beaucoup']) {
    assert.throws(() => enSecondes(entree), Error, `devrait refuser: "${entree}"`);
  }
});
