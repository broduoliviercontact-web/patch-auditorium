// Réseau Dante de l'auditorium et diffusion de salle (d'après le synoptique).
// La diffusion « système » est une proposition de configuration fixe : à comparer avec la
// config réelle de l'installateur (capture de Dante Controller) avant de la reprendre.

// Appareils Dante : tx = canaux émis, rx = canaux reçus. lieu = où se trouve l'appareil.
export const DEVICES = [
  { key: 'dm7', tx: 24, rx: 48, lieu: 'Régie (plan de travail)', role: 'console' },
  { key: 'rioRegie', tx: 16, rx: 8, lieu: 'Baie régie, U16-18', role: 'stagebox' },
  { key: 'rio1', tx: 16, rx: 8, lieu: 'Plateau (fly case), réseau par le BAV-24', role: 'stagebox' },
  { key: 'rio2', tx: 16, rx: 8, lieu: 'Plateau (fly case), réseau par le BAV-24', role: 'stagebox' },
  { key: 'ulxd', tx: 4, rx: 0, lieu: 'Baie régie, U41', role: 'hf' },
  { key: 'rednet', tx: 16, rx: 16, lieu: 'Baie régie, U23', role: 'convert' },
  { key: 'digiface', tx: 16, rx: 16, lieu: 'Régie (ordinateur)', role: 'ordi' },
  { key: 'adp', tx: 2, rx: 2, lieu: 'Régie (ordinateur)', role: 'ordi' },
  { key: 'dli1', tx: 0, rx: 2, lieu: 'Façade jardin', role: 'hp' },
  { key: 'dli2', tx: 0, rx: 2, lieu: 'Façade jardin', role: 'hp' },
  { key: 'dli3', tx: 0, rx: 2, lieu: 'Façade cour', role: 'hp' },
  { key: 'dli4', tx: 0, rx: 2, lieu: 'Façade cour', role: 'hp' },
  { key: 'di4', tx: 0, rx: 4, lieu: 'Baie nodal', role: 'ampli' },
  { key: 'di2', tx: 0, rx: 2, lieu: 'Baie nodal', role: 'ampli' },
  { key: 'ma1', tx: 0, rx: 4, lieu: 'Baie nodal', role: 'ampli' },
  { key: 'ma2', tx: 0, rx: 4, lieu: 'Baie nodal', role: 'ampli' },
  { key: 'ma3', tx: 0, rx: 4, lieu: 'Baie nodal', role: 'ampli' },
];

// Ce qui est branché derrière chaque canal de réception des amplis / enceintes
export const RX_LABELS = {
  dli1: ['HP-01 DLI-430 (jardin)'], dli2: ['HP-02 DLI-230 (jardin)'], dli3: ['HP-03 DLI-430 (cour)'], dli4: ['HP-04 DLI-230 (cour)'],
  di4: ['SUB-01 AS40 · câble 5001', 'SUB-02 AS40 · câble 5002', 'SUB-03 AS40 · câble 5003', 'SUB-04 AS40 · câble 5004'],
  di2: ['AT40 centre (EPC-01) · câble 5005', '(libre)'],
  ma1: ['XT1 n°1 · BAV-20 HP-01 · 5007', 'XT1 n°2 · BAV-20 HP-02 · 5008', 'XT1 n°3 · BAV-20 HP-03 · 5009', 'XT1 n°4 · BAV-20 HP-04 · 5010'],
  ma2: ['XT1 n°5 · BAV-23 HP-01 · 5011', 'XT1 n°6 · BAV-23 HP-02 · 5012', 'XT1 n°7 · BAV-23 HP-03 · 5013', 'XT1 n°8 · BAV-23 HP-04 · 5014'],
  ma3: ['XT22 retour 1 · BAV-26 HP-01 · 5015', 'XT22 retour 2 · BAV-26 HP-02 · 5016', 'XT22 retour 3 · BAV-28 HP-01 · 5017', 'XT22 retour 4 · BAV-28 HP-02 · 5018'],
};

// Zones de diffusion : bus DM7 -> Dante Out -> récepteurs
export const ZONES = [
  { id: 'facadeL', nom: 'Façade gauche (jardin)', bus: 'Matrix 1', src: 'Stereo L', out: 1, couleur: '#5aa9ff',
    rx: [['dli1', 1], ['dli2', 1]], hp: 'colonnes DLI-430 + DLI-230, façade jardin, devant le cadre',
    role: "Le son principal pour la salle, côté jardin. Les deux colonnes s'amplifient elles-mêmes : elles reçoivent le Dante directement, sans ampli au nodal." },
  { id: 'facadeR', nom: 'Façade droite (cour)', bus: 'Matrix 2', src: 'Stereo R', out: 2, couleur: '#82aaff',
    rx: [['dli3', 1], ['dli4', 1]], hp: 'colonnes DLI-430 + DLI-230, façade cour, devant le cadre',
    role: 'Le son principal côté cour.' },
  { id: 'subs', nom: 'Subs', bus: 'Matrix 3', src: 'Stereo L+R (mono)', out: 3, couleur: '#c792ea',
    rx: [['di4', 1], ['di4', 2], ['di4', 3], ['di4', 4]], hp: '4 subs AS40 suspendus devant le cadre (SUB-01/02 jardin, 03/04 cour)',
    role: "Les basses. Mono : les 4 voies de l'ampli DI-4.2000 reçoivent le même canal. Pour des subs envoyés en aux, remplace la source de la Matrix 3 par un Mix « Sub »." },
  { id: 'fill', nom: 'Front fills (nez de scène)', bus: 'Matrix 4', src: 'Stereo L+R (mono)', out: 4, couleur: '#4cc38a',
    rx: [['ma1', 1], ['ma1', 2], ['ma1', 3], ['ma1', 4], ['ma2', 1], ['ma2', 2], ['ma2', 3], ['ma2', 4]], hp: '8 XT1 le long du nez de scène, un par prise HP des BAV-20 et BAV-23',
    role: 'Les premiers rangs passent sous la façade : les XT1 leur rendent le son du centre de la scène. Souvent 6 à 10 dB sous la façade.' },
  { id: 'centre', nom: 'Centre (plafond)', bus: 'Matrix 5', src: 'Stereo L+R (mono)', out: 5, couleur: '#ffcb6b',
    rx: [['di2', 1]], hp: 'AT40 au plafond, dans l\'axe, dans le plan du cadre (≈ 8,6 m)',
    role: 'Un point central pour la voix et le milieu de la salle, entre les deux colonnes.' },
  ...[1, 2, 3, 4].map(i => ({ id: 'retour' + i, nom: `Retour ${i}`, bus: `Mix ${i}`, src: 'mix de retour', out: 8 + i, couleur: '#f78c6c',
    rx: [['ma3', i]], hp: RX_LABELS.ma3[i - 1], retour: true,
    role: `Un retour de scène XT22, avec son mix à lui (Mix ${i}) préparé pour l'artiste.` })),
];

// Récepteur système -> zone (pour réutiliser le même Dante Out dans l'onglet Sorties)
export const SYS_RX = {};
for (const z of ZONES) for (const [dev, ch] of z.rx) SYS_RX[`${dev}:${ch}`] = z;

// Libellé d'un canal d'émission de la DM7 selon le plan système
export const dm7OutLabel = n => ZONES.find(z => z.out === n)?.nom;
