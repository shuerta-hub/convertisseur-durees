#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { enSecondes, UNITES } = require('./duree.js');

// Les trois durées montrées par --exemples. Les résultats ne sont pas écrits ici: ils viennent de enSecondes.
const DUREES_EXEMPLES = ['5 min', '2 h', '1 j'];

// Options affichées dans l'aide: [libellé, description]. La colonne des descriptions se calcule sur le libellé le plus long.
const OPTIONS = [
  ['--aide, -h', 'affiche cette aide'],
  ['--version, -v', 'affiche la version du programme'],
  ['--exemples, -e', 'affiche trois conversions types'],
];

// Lit la version dans package.json au moment de l'appel (le numéro n'est jamais recopié dans le code).
function versionDuProgramme() {
  const chemin = path.join(__dirname, '..', 'package.json');
  return JSON.parse(fs.readFileSync(chemin, 'utf8')).version;
}

// Une ligne par exemple, au format « 5 min = 300 s », calculée par le convertisseur.
function texteExemples() {
  return DUREES_EXEMPLES.map((duree) => `${duree} = ${enSecondes(duree)} s`).join('\n');
}

function texteAide() {
  const unites = Object.entries(UNITES)
    .map(([unite, secondes]) => `  ${unite}  (${secondes} s)`)
    .join('\n');
  const largeur = Math.max(...OPTIONS.map(([libelle]) => libelle.length));
  const options = OPTIONS.map(
    ([libelle, description]) => `  ${libelle.padEnd(largeur)}  ${description}`
  );
  return [
    'Usage: npm run convertir -- <durée>',
    '       node src/cli.js <durée>',
    '',
    'Convertit une durée en secondes.',
    '',
    'Unités reconnues:',
    unites,
    '',
    'Exemple: npm run convertir -- "5 min"  affiche  300 s',
    '',
    'Options:',
    ...options,
  ].join('\n');
}

function principal(args) {
  if (args.includes('--aide') || args.includes('-h')) {
    console.log(texteAide());
    return 0;
  }
  if (args.includes('--version') || args.includes('-v')) {
    console.log(versionDuProgramme());
    return 0;
  }
  if (args.includes('--exemples') || args.includes('-e')) {
    console.log(texteExemples());
    return 0;
  }
  const texte = args.join(' ').trim();
  try {
    if (texte === '') {
      throw new Error(
        'Aucune durée fournie. Exemples: npm run convertir -- "5 min", npm run convertir -- "2h", npm run convertir -- "1,5 min".'
      );
    }
    console.log(`${enSecondes(texte)} s`);
    return 0;
  } catch (erreur) {
    console.error(erreur.message);
    return 1;
  }
}

process.exitCode = principal(process.argv.slice(2));
