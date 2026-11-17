'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { enSecondes, UNITES } = require('../src/duree.js');

// BACAS-33: l'unité ms (milliseconde = 0.001 s)

test('500 ms donne 0.5 s', () => {
  assert.strictEqual(enSecondes('500 ms'), 0.5);
});

test('sans espace: 1500ms donne 1.5 s', () => {
  assert.strictEqual(enSecondes('1500ms'), 1.5);
});

test('la virgule décimale fonctionne avec ms: 2,5 ms donne 0.0025 s', () => {
  assert.strictEqual(enSecondes('2,5 ms'), 0.0025);
});

test('ms est déclarée dans la table des unités avec la valeur 0.001', () => {
  assert.strictEqual(UNITES.ms, 0.001);
});

test('ms n\'est pas confondue avec s: 2 s donne 2 s', () => {
  assert.strictEqual(enSecondes('2 s'), 2);
});

// Non-régression: les autres unités donnent les mêmes résultats qu'avant

test('non-régression: 5 min donne 300 s', () => {
  assert.strictEqual(enSecondes('5 min'), 300);
});

test('non-régression: s, min, h, j, sem donnent les mêmes valeurs qu\'avant', () => {
  assert.strictEqual(enSecondes('30 s'), 30);
  assert.strictEqual(enSecondes('2 min'), 120);
  assert.strictEqual(enSecondes('2h'), 7200);
  assert.strictEqual(enSecondes('2 j'), 172800);
  assert.strictEqual(enSecondes('1 sem'), 604800);
  assert.strictEqual(enSecondes('1,5 min'), 90);
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
  for (const entree of ['', 'ms', '5', '5 xyz', '5 mss']) {
    assert.throws(() => enSecondes(entree), Error, `devrait refuser: "${entree}"`);
  }
});
