'use strict';

// Source unique des unités reconnues (valeur: nombre de secondes). Utilisée par la conversion, par l'aide et par la liste des unités de la CLI.
// Une année vaut 365 jours (les années bissextiles ne sont pas prises en compte).
const UNITES = {
  ms: 0.001,
  s: 1,
  min: 60,
  h: 3600,
  j: 86400,
  sem: 604800,
  an: 365 * 86400,
};

// Les unités les plus longues d'abord (« ms » avant « s », « sem » avant « s »); le « $ » final impose de toute façon une correspondance complète.
const ALTERNANCE = Object.keys(UNITES)
  .sort((a, b) => b.length - a.length)
  .join('|');
const MOTIF = new RegExp(`^\\s*(\\d+(?:[.,]\\d+)?)\\s*(${ALTERNANCE})\\s*$`);

const EXEMPLES = '5 min, 30 s, 2h, 2 h, 1,5 min, 1 j, 2 sem';

/**
 * Convertit une durée écrite (ex. "5 min", "2h", "1,5 min", "2 sem", "500 ms", "1 an") en secondes.
 * Unités reconnues: ms, s, min, h, j, sem, an. Lève une Error avec des exemples si la durée n'est pas reconnue.
 */
function enSecondes(texte) {
  const correspondance = MOTIF.exec(String(texte));
  if (!correspondance) {
    throw new Error(
      `Durée non reconnue: "${texte}". Exemples de durées valides: ${EXEMPLES}. Unités reconnues: ${Object.keys(UNITES).join(', ')}.`
    );
  }
  const nombre = Number(correspondance[1].replace(',', '.'));
  const secondes = nombre * UNITES[correspondance[2]];
  // Évite les artefacts de virgule flottante (ex. 360.00000000000006).
  return Math.round(secondes * 1e6) / 1e6;
}

module.exports = { enSecondes, UNITES };
