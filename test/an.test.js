'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { enSecondes, UNITES } = require('../src/duree.js');

// BACAS-34: l'unité an (une année = 365 jours = 31536000 s)

test('1 an donne 31536000 s', () => {
  assert.strictEqual(enSecondes('1 an'), 31536000);
});

test('2 an donne 63072000 s', () => {
  assert.strictEqual(enSecondes('2 an'), 63072000);
});

test('la virgule décimale fonctionne avec an: 1,5 an donne 47304000 s', () => {
  assert.strictEqual(enSecondes('1,5 an'), 47304000);
});

test('an est reconnue sans espace: 1an donne 31536000 s', () => {
  assert.strictEqual(enSecondes('1an'), 31536000);
});

test('an est déclarée dans la table des unités et vaut 365 jours', () => {
  assert.strictEqual(UNITES.an, 365 * UNITES.j);
  assert.strictEqual(UNITES.an, 31536000);
});

test('an vient à la suite des autres unités dans la table, après sem', () => {
  assert.deepStrictEqual(Object.keys(UNITES), ['ms', 's', 'min', 'h', 'j', 'sem', 'an']);
});

// Limites: pas de pluriel

test('le pluriel « ans » n\'est pas reconnu', () => {
  assert.throws(() => enSecondes('2 ans'), Error);
});

// Non-régression: les unités existantes donnent les mêmes résultats

test('non-régression: 5 min donne toujours 300 s', () => {
  assert.strictEqual(enSecondes('5 min'), 300);
});

test('non-régression: ms, s, h, j, sem donnent les mêmes valeurs qu\'avant', () => {
  assert.strictEqual(enSecondes('500 ms'), 0.5);
  assert.strictEqual(enSecondes('30 s'), 30);
  assert.strictEqual(enSecondes('2h'), 7200);
  assert.strictEqual(enSecondes('2 j'), 172800);
  assert.strictEqual(enSecondes('1 sem'), 604800);
});

test('non-régression: une durée non reconnue lève toujours une erreur avec exemples', () => {
  assert.throws(
    () => enSecondes('beaucoup'),
    (erreur) => {
      assert.ok(erreur instanceof Error);
      assert.match(erreur.message, /exemple/i);
      return true;
    }
  );
});
