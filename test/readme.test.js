'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const racine = path.join(__dirname, '..');
const LIGNE_VERSION = 'Version: 1.0.0';

// BACAS-30: la version du projet est affichée dans le README.

// Lecture seule: aucun test ne modifie README.md ni package.json.
function lignesDuReadme() {
  const contenu = fs.readFileSync(path.join(racine, 'README.md'), 'utf8');
  return contenu.split(/\r?\n/);
}

function indexDuTitre(lignes) {
  return lignes.findIndex((l) => /^# \S/.test(l));
}

// Critère 1: la ligne « Version: 1.0.0 » est sous le titre de premier niveau, directement ou après une ligne vide

test('le README contient un titre de premier niveau', () => {
  assert.ok(indexDuTitre(lignesDuReadme()) >= 0, 'aucun titre de premier niveau (# ...) dans README.md');
});

test('le README affiche la ligne Version: 1.0.0', () => {
  const lignes = lignesDuReadme().map((l) => l.trimEnd());
  assert.ok(lignes.includes(LIGNE_VERSION), `la ligne "${LIGNE_VERSION}" est absente de README.md`);
});

test('la ligne Version: 1.0.0 est directement sous le titre de premier niveau ou après une ligne vide', () => {
  const lignes = lignesDuReadme();
  const titre = indexDuTitre(lignes);
  assert.ok(titre >= 0, 'aucun titre de premier niveau (# ...) dans README.md');
  const directe = (lignes[titre + 1] || '').trimEnd() === LIGNE_VERSION;
  const apresLigneVide =
    (lignes[titre + 1] || '').trim() === '' && (lignes[titre + 2] || '').trimEnd() === LIGNE_VERSION;
  assert.ok(
    directe || apresLigneVide,
    `la ligne "${LIGNE_VERSION}" doit suivre le titre, directement ou après une ligne vide; lignes lues: ${JSON.stringify(lignes.slice(titre, titre + 3))}`
  );
});

test('la ligne de version est la valeur en dur 1.0.0, celle de package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.version, '1.0.0');
  assert.strictEqual(LIGNE_VERSION, `Version: ${pkg.version}`);
});

// Critère 2: le test est lancé par npm run verifier, comme les autres

test('npm run verifier lance le dossier test/, donc ce fichier, avec node seulement', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts && pkg.scripts.verifier, 'script verifier manquant');
  assert.match(pkg.scripts.verifier, /^node\s+--test\s+test\/?$/);
  assert.doesNotMatch(pkg.scripts.verifier, /&&|;|\|/);
});
