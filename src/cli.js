#!/usr/bin/env node
'use strict';

const { enSecondes } = require('./duree.js');

function principal(args) {
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
