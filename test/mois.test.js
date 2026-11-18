'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { enSecondes, UNITES } = require('../src/duree.js');

// BACAS-36: l'unité mois (un mois = 30 jours = 2592000 s)

test('1 mois donne 2592000 s', () => {
  assert.strictEqual(enSecondes('1 mois'), 2592000);
});

test('sans espace: 2mois donne 5184000 s', () => {
  assert.strictEqual(enSecondes('2mois'), 5184000);
});

test('avec espace: 2 mois donne 5184000 s', () => {
  assert.strictEqual(enSecondes('2 mois'), 5184000);
});

test('la virgule décimale fonctionne avec mois: 0,5 mois donne 1296000 s', () => {
  assert.strictEqual(enSecondes('0,5 mois'), 1296000);
});

test('mois est déclarée dans la table des unités et vaut 30 jours', () => {
  assert.strictEqual(UNITES.mois, 30 * UNITES.j);
  assert.strictEqual(UNITES.mois, 2592000);
});

test('mois est refusée sans nombre', () => {
  assert.throws(() => enSecondes('mois'), Error);
});

// Non-régression: les autres unités donnent les mêmes résultats qu'avant

test('2 sem donne toujours 1209600 s', () => {
  assert.strictEqual(enSecondes('2 sem'), 1209600);
});

test('5 min donne toujours 300 s', () => {
  assert.strictEqual(enSecondes('5 min'), 300);
});

test('non-régression: ms, s, h, j gardent leurs valeurs', () => {
  assert.strictEqual(enSecondes('500 ms'), 0.5);
  assert.strictEqual(enSecondes('30 s'), 30);
  assert.strictEqual(enSecondes('2 h'), 7200);
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
  for (const entree of ['', '5', '5 xyz', '5 moiss']) {
    assert.throws(() => enSecondes(entree), Error, `devrait refuser: "${entree}"`);
  }
});
