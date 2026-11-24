// Installation audio de l'auditorium des Grandes Serres (Pantin).
// Source : synoptique audio/réseau LGS2-INE-EXE-22-SCH-AUD-TN-8001, indice 0 (02/10/2025)
// + carnet des boîtiers (photos dans /boitiers, positions reprises de Salle 3D / terminaux_au.json).
// « verifier: true » = lu sur le plan mais pas encore confirmé sur place.

const range = (a, n) => Array.from({ length: n }, (_, i) => a + i);

// ---- Patch Ghielmetti 1 : nodal (baie son) ----------------------------------------------
// Rangée A : A1..A28 = câbles 6001..6028 ; rangée B : B1..B25 = câbles 6049..6073.
export const G1 = {};
range(1, 28).forEach(i => (G1[6000 + i] = 'A' + i));
range(1, 25).forEach(i => (G1[6048 + i] = 'B' + i));

// ---- Patch Ghielmetti 2 : régie --------------------------------------------------------
export const G2 = {};
range(1, 14).forEach(i => (G2[6100 + i] = 'A' + i));          // boîtiers régie, salle, gradins
range(1, 12).forEach(i => (G2[6048 + i] = 'A' + (28 + i)));    // liaisons 6049..6060 -> A29..A40
range(1, 12).forEach(i => (G2[6000 + i] = 'B' + (28 + i)));    // liaisons 6001..6012 -> B29..B40

// 24 lignes entre le nodal et la régie. Ordre d'attribution : B1.. d'abord, puis A1..
export const LIAISONS = [
  ...range(6049, 12).map(c => ({ cable: c, g1: G1[c], g2: G2[c] })),
  ...range(6001, 12).map(c => ({ cable: c, g1: G1[c], g2: G2[c] })),
];

// Entrées de la Rio régie : Ghielmetti 2, B1..B16 = câbles 6149..6164
export const RIO_REGIE_IN = range(1, 16).map(i => ({ ch: i, g2: 'B' + i, cable: 6148 + i }));
// Sorties de la Rio régie : Ghielmetti 2, A17..A24 = câbles 6117..6124
export const RIO_REGIE_OUT = range(1, 8).map(i => ({ ch: i, g2: 'A' + (16 + i), cable: 6116 + i }));
// Entrées locales 13..16 de la DM7 : Ghielmetti 2, B23..B26 = câbles 6171..6174 (débordement)
export const DM7_LOCAL_IN = range(13, 4).map(i => ({ ch: i, g2: 'B' + (10 + i), cable: 6158 + i }));

// ---- Boîtiers AV ------------------------------------------------------------------------
// pos : x (lointain négatif) / z (jardin positif), en mètres, repère de Salle 3D.
// aud : n° de câble de chaque prise AUD-xx ; arrivée = 'G1' (nodal) ou 'G2' (régie direct).
export const BOITIERS = {
  'BAV-20': { loc: 'Plateau face jardin', zone: 'plateau', pos: [-82.83, 9.24], plaque: 'plaque_14.png',
    aud: range(6021, 4), eth: range(4049, 8), hp: range(5007, 4) },
  'BAV-21': { loc: 'Plateau face jardin', zone: 'plateau', pos: [-82.82, 8.23], plaque: 'plaque_19.png',
    aud: [6061, 6062], audStart: 3, eth: range(4057, 4) },
  'BAV-22': { loc: 'Plateau face cour', zone: 'plateau', pos: [-83.74, -2.42], plaque: 'plaque_19.png',
    aud: [6063, 6064], audStart: 3, eth: range(4061, 4) },
  'BAV-23': { loc: 'Plateau face cour', zone: 'plateau', pos: [-82.81, -3.61], plaque: 'plaque_14.png',
    aud: range(6065, 4), eth: range(4065, 8), hp: range(5011, 4) },
  'BAV-24': { loc: 'Plateau milieu jardin', zone: 'plateau', pos: [-86.89, 9.96], plaque: 'plaque_15.png',
    eth: range(4073, 4), reserveRio: true },
  'BAV-26': { loc: 'Plateau lointain jardin', zone: 'plateau', pos: [-88.64, 9.76], plaque: 'plaque_16.png',
    aud: range(6069, 4), eth: range(4079, 6), hp: [5015, 5016] },
  'BAV-27': { loc: 'Plateau lointain cour', zone: 'plateau', pos: [-89.38, -3.93], plaque: 'plaque_15.png',
    eth: range(4085, 4) },
  'BAV-28': { loc: 'Plateau lointain cour', zone: 'plateau', pos: [-89.19, -3.58], plaque: 'plaque_16.png',
    aud: range(6025, 4), eth: range(4089, 6), hp: [5017, 5018] },
  'BAV-06': { loc: 'Lisse face scène (porteuse)', zone: 'plateau', pos: [-83.51, 2.73], plaque: 'plaque_25.png',
    aud: range(6013, 4), eth: [4013, 4014] },
  'BAV-15': { loc: 'Salle de musique', zone: 'autre', pos: [-70.44, -8.67], plaque: 'plaque_23.png',
    aud: range(6017, 4) },
  'BAV-01': { loc: 'Niveau R2, côté jardin', zone: 'autre', pos: [-66.81, 9.76], plaque: 'plaque_22.png',
    aud: [6107, 6108] },
  'BAV-04': { loc: 'Niveau R2, côté cour', zone: 'autre', pos: [-66.8, -3.9], plaque: 'plaque_22.png',
    aud: [6109, 6110] },
  'BAV-PMS-01': { loc: 'Gradins rang 8 (régie en salle)', zone: 'autre', pos: [-74.0, 3.22], plaque: 'plaque_11.png',
    aud: range(6111, 4) },
  'BAV-02': { loc: 'Régie, mur son', zone: 'autre', pos: [-66.13, 1.45], plaque: 'plaque_18.png',
    aud: [6101, 6102] },
  'BAV-03': { loc: 'Régie, mur vidéo', zone: 'autre', pos: [-64.54, 3.76], plaque: 'plaque_17.png',
    aud: [6103, 6104] },
};

// Prises réseau du BAV-24 pour les Rio du plateau (Rio rack 1 et 2).
export const RIO_PLATEAU = {
  // Photo du nodal : cordons posés sur D3 / D4 (BAV-24 ETH-03 / ETH-04). D1 / D2 restent libres pour la 2e Rio.
  1: { prim: { prise: 'ETH-03', cable: 4075, patch: 'D3', switch: 'P1' },
       sec:  { prise: 'ETH-04', cable: 4076, patch: 'D4', switch: 'S1' } },
  2: { prim: { prise: 'ETH-01', cable: 4073, patch: 'D1', switch: 'P1' },
       sec:  { prise: 'ETH-02', cable: 4074, patch: 'D2', switch: 'S1' }, aPoser: true },
};

// Prises HP (Speakon) des boîtiers -> matrices amplifiées Fohhn MA-4.600 (au nodal).
// Répartition par matrice lue sur le synoptique (MA-4.600 n°1 : 5007-5010, n°2 : 5011-5014, n°3 : 5015-5018).
export const MATRICES = [
  { id: 1, ip: 4533, cables: range(5007, 4) },
  { id: 2, ip: 4534, cables: range(5011, 4) },
  { id: 3, ip: 4535, cables: range(5015, 4) },
];
export function matriceDe(cable) {
  for (const m of MATRICES) { const i = m.cables.indexOf(cable); if (i >= 0) return { m: m.id, sortie: i + 1 }; }
  return null;
}

// ---- Parc micros -----------------------------------------------------------------------
// phantom : true = 48 V, false = non, 'hf' = micro sans fil (arrive en Dante par l'ULXD4Q)
export const MICROS = [
  { id: 'ulxd2', nom: 'Shure ULXD2 / SM58 (HF main)', qte: 4, phantom: 'hf' },
  { id: 'ulxd1', nom: 'Shure ULXD1 + MKE40 (HF cravate)', qte: 2, phantom: 'hf' },
  { id: 'sm58', nom: 'Shure SM58', qte: 10, phantom: false, type: 'dynamique' },
  { id: 'e906', nom: 'Sennheiser e906', qte: 2, phantom: false, type: 'dynamique' },
  { id: 'mx418', nom: 'Shure MX418 (col de cygne)', qte: 6, phantom: true, type: 'statique' },
  { id: 'c414', nom: 'AKG C414', qte: 2, phantom: true, type: 'statique' },
  { id: 'c451', nom: 'AKG C451', qte: 10, phantom: true, type: 'statique' },
  { id: 'km184', nom: 'Neumann KM184', qte: 2, phantom: true, type: 'statique' },
  { id: 'dpa4099', nom: 'DPA 4099 (adaptateur XLR)', qte: 6, phantom: true, type: 'statique' },
  { id: 'dpa4088', nom: 'DPA 4088 (adaptateur XLR)', qte: 2, phantom: true, type: 'statique' },
  { id: 'di-active', nom: 'DI active', phantom: true, type: 'DI' },
  { id: 'di-passive', nom: 'DI passive', phantom: false, type: 'DI' },
  { id: 'ligne', nom: 'Ligne (sortie console, ordi, clavier…)', phantom: false, type: 'ligne' },
  { id: 'artiste', nom: "Micro de l'artiste", phantom: null },
];

// Devine la fantôme d'après le nom de la source quand aucun micro n'est choisi.
export function devinePhantom(source = '') {
  const s = source.toLowerCase();
  if (/\b(oh|over|overhead|hh|hi-?hat|charley|ride|acou|piano|violon|cordes?|choeur|ch[oœ]ur|ambiance|amb)\b/.test(s)) return true;
  if (/\b(di|dibox|di box)\b/.test(s)) return true;
  if (/\b(kick|bd|gc|grosse|snare|sn|caisse|tom|ft|guit|gtr|bass|basse|voix|vox|chant)\b/.test(s)) return false;
  return null;
}

export const NOMS_DEFAUT = {
  dm7: 'DM7', rioRegie: 'Rio-Regie', rio1: 'Rio-Rack-1', rio2: 'Rio-Rack-2',
  ulxd: 'ULXD4Q', ma1: 'MA4600-1', ma2: 'MA4600-2', ma3: 'MA4600-3',
  dli1: 'HP-01-DLI430', dli2: 'HP-02-DLI230', dli3: 'HP-03-DLI430', dli4: 'HP-04-DLI230',
  di4: 'DI-4-2000', di2: 'DI-2-2000', rednet: 'RedNet-D16R', adp: 'ADP-USB', digiface: 'Digiface-Dante',
};
export const NOMS_LIBELLES = {
  dm7: 'Console DM7', rioRegie: 'Rio1608-D3 de la régie', rio1: 'Rio rack 1 (plateau)', rio2: 'Rio rack 2 (plateau)', ulxd: 'Récepteur HF ULXD4Q',
  ma1: 'Matrice MA-4.600 n°1', ma2: 'Matrice MA-4.600 n°2', ma3: 'Matrice MA-4.600 n°3',
  dli1: 'HP-01 DLI-430 façade jardin', dli2: 'HP-02 DLI-230 façade jardin', dli3: 'HP-03 DLI-430 façade cour', dli4: 'HP-04 DLI-230 façade cour',
  di4: 'Ampli DI-4.2000 (subs)', di2: 'Ampli DI-2.2000 (centre)', rednet: 'Focusrite RedNet D16R', adp: 'Interface Audinate ADP-USB', digiface: 'Interface RME Digiface Dante',
};
