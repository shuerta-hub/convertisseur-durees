'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { enSecondes, UNITES } = require('../src/duree.js');

// BACAS-37: l'unité trim (trimestre = 90 jours = 7776000 s)

test('1 trim donne 7776000 s', () => {
  assert.strictEqual(enSecondes('1 trim'), 7776000);
});

test('sans espace: 2trim donne 15552000 s', () => {
  assert.strictEqual(enSecondes('2trim'), 15552000);
});

test('avec espace: 2 trim donne 15552000 s', () => {
  assert.strictEqual(enSecondes('2 trim'), 15552000);
});

test('la virgule décimale fonctionne avec trim: 0,5 trim donne 3888000 s', () => {
  assert.strictEqual(enSecondes('0,5 trim'), 3888000);
});

test('trim est déclarée dans la table des unités avec la valeur 90 jours en secondes', () => {
  assert.strictEqual(UNITES.trim, 90 * 86400);
  assert.strictEqual(UNITES.trim, 7776000);
});

test('trim sans nombre est refusée avec une erreur', () => {
  assert.throws(() => enSecondes('trim'), Error);
});

// Non-régression: les autres unités donnent les mêmes résultats qu'avant

test('non-régression: 2 sem donne toujours 1209600 s', () => {
  assert.strictEqual(enSecondes('2 sem'), 1209600);
});

test('non-régression: 5 min donne toujours 300 s', () => {
  assert.strictEqual(enSecondes('5 min'), 300);
});

test('non-régression: ms, s, h, j gardent leurs valeurs', () => {
  assert.strictEqual(enSecondes('500 ms'), 0.5);
  assert.strictEqual(enSecondes('30 s'), 30);
  assert.strictEqual(enSecondes('2h'), 7200);
  assert.strictEqual(enSecondes('2 j'), 172800);
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
