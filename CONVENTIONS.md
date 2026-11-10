# Conventions du projet

Le robot développeur lit ce fichier avant de coder. Ces règles priment sur ses habitudes.

## Langue
- Tout est en français: commentaires, messages d'erreur, noms de tests, noms de fonctions (`enSecondes`, `principal`).

## Code
- Node.js 20 ou plus, aucune dépendance externe (ni `dependencies`, ni `devDependencies`).
- Modules CommonJS (`require`, `module.exports`), avec `'use strict';` en première ligne de chaque fichier.
- Le code vit dans `src/`: `duree.js` convertit (logique pure), `cli.js` lit les arguments et affiche. Une nouvelle logique de conversion va dans `duree.js`, pas dans `cli.js`.
- Les unités se déclarent dans la table `SECONDES_PAR_UNITE` et dans le motif `MOTIF` de `duree.js`. Dans le motif, une unité qui commence par une autre vient en premier (`sem` avant `s`).
- Une durée non reconnue lève une `Error` dont le message cite le texte reçu et donne des exemples valides. La liste des exemples est la constante `EXEMPLES`.
- Les résultats sont arrondis à 6 décimales pour éviter les artefacts de virgule flottante.
- Le CLI affiche le résultat suivi de ` s` sur la sortie standard. Une erreur va sur la sortie d'erreur, avec le code de sortie 1.

## Tests
- Le lanceur intégré de Node (`node:test` et `node:assert`), un fichier par sujet dans `test/`, nommé `<sujet>.test.js`. Les tests du CLI s'appellent `<sujet>.cli.test.js`.
- Un test au moins par critère d'acceptation, avec un nom qui dit le comportement attendu (`5 min donne 300 s`).
- `npm run verifier` doit passer avant toute demande de fusion.

## package.json
- Les scripts lancent seulement `node`, sans enchaînement. Un nouveau script ne s'ajoute que si le récit le nomme.
