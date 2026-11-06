'use strict';

const SECONDES_PAR_UNITE = {
  s: 1,
  min: 60,
  h: 3600,
  j: 86400,
};

const MOTIF = /^\s*(\d+(?:[.,]\d+)?)\s*(s|min|h|j)\s*$/;

const EXEMPLES = '5 min, 30 s, 2h, 2 h, 1,5 min, 1 j';

/**
 * Convertit une durée écrite (ex. "5 min", "2h", "1,5 min") en secondes.
 * Unités reconnues: s, min, h, j. Lève une Error avec des exemples si la durée n'est pas reconnue.
 */
function enSecondes(texte) {
  const correspondance = MOTIF.exec(String(texte));
  if (!correspondance) {
    throw new Error(
      `Durée non reconnue: "${texte}". Exemples de durées valides: ${EXEMPLES}. Unités reconnues: s, min, h, j.`
    );
  }
  const nombre = Number(correspondance[1].replace(',', '.'));
  const secondes = nombre * SECONDES_PAR_UNITE[correspondance[2]];
  // Évite les artefacts de virgule flottante (ex. 360.00000000000006).
  return Math.round(secondes * 1e6) / 1e6;
}

module.exports = { enSecondes };
