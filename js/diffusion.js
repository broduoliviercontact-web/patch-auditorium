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
  { key: 'digiface', tx: 16, rx: 16, lieu: 'Régie (ordinateur, si branché)', role: 'ordi' },
  { key: 'adp', tx: 2, rx: 2, lieu: 'Régie (ordinateur, si branché)', role: 'ordi' },
  { key: 'dli1', tx: 0, rx: 2, lieu: 'Façade jardin', role: 'hp' },
  { key: 'dli2', tx: 0, rx: 2, lieu: 'Façade jardin', role: 'hp' },
  { key: 'dli3', tx: 0, rx: 2, lieu: 'Façade cour', role: 'hp' },
  { key: 'dli4', tx: 0, rx: 2, lieu: 'Façade cour', role: 'hp' },
  { key: 'di4', tx: 0, rx: 4, lieu: 'Baie nodal', role: 'ampli' },
  { key: 'di2', tx: 0, rx: 4, lieu: 'Baie nodal', role: 'ampli' },
  { key: 'ma1', tx: 0, rx: 4, lieu: 'Baie nodal', role: 'ampli' },
  { key: 'ma2', tx: 0, rx: 4, lieu: 'Baie nodal', role: 'ampli' },
  { key: 'ma3', tx: 0, rx: 4, lieu: 'Baie nodal', role: 'ampli' },
];

// Ce qui est branché derrière chaque canal de réception des amplis / enceintes
export const RX_LABELS = {
  di4: ['Input 1 · subs (← gauche)', 'Input 2 · subs (← droite)', 'NC', 'NC'],
  di2: ['IN CTR · AT40 centre (EPC-01) · câble 5005', 'NC', 'NC', 'NC'],
  dli1: ['INPUT 1', 'NC'], dli2: ['INPUT 1', 'NC'], dli3: ['INPUT 1', 'NC'], dli4: ['INPUT 1', 'NC'],
  ma1: ['XT1 n°1 · BAV-20 HP-01 · 5007', 'XT1 n°2 · BAV-20 HP-02 · 5008', 'XT1 n°3 · BAV-20 HP-03 · 5009', 'XT1 n°4 · BAV-20 HP-04 · 5010'],
  ma2: ['XT1 n°5 · BAV-23 HP-01 · 5011', 'XT1 n°6 · BAV-23 HP-02 · 5012', 'XT1 n°7 · BAV-23 HP-03 · 5013', 'XT1 n°8 · BAV-23 HP-04 · 5014'],
  ma3: ['XT22 retour 1 · BAV-26 HP-01 · 5015', 'XT22 retour 2 · BAV-26 HP-02 · 5016', 'XT22 retour 3 · BAV-28 HP-01 · 5017', 'XT22 retour 4 · BAV-28 HP-02 · 5018'],
};

// Diffusion RÉELLE, relevée dans Dante Controller le 24/11/2026 (abonnements posés par l'installateur,
// stockés dans les amplis / enceintes : ils ne changent pas quand on charge une mémoire sur la DM7).
// Chaque récepteur : [appareil, canal, Dante Out de la DM7, bus conseillé].
export const ZONES = [
  { id: 'facadeL', nom: 'Façade jardin', bus: 'ST L', src: 'Stereo', out: 15, couleur: '#5aa9ff',
    rx: [['dli1', 1, 15, 'ST L'], ['dli2', 1, 15, 'ST L']], hp: 'Facade-J-Haut + Facade-J-Bas, devant le cadre côté jardin',
    role: "Le son principal côté jardin. Les enceintes s'amplifient elles-mêmes et reçoivent le Dante directement." },
  { id: 'facadeR', nom: 'Façade cour', bus: 'ST R', src: 'Stereo', out: 16, couleur: '#82aaff',
    rx: [['dli3', 1, 16, 'ST R'], ['dli4', 1, 16, 'ST R']], hp: 'Facade-C-Haut + Facade-C-Bas, devant le cadre côté cour',
    role: 'Le son principal côté cour.' },
  { id: 'subs', nom: 'Subs', bus: 'ST L / ST R', src: 'Stereo', out: '15 / 16', couleur: '#c792ea',
    rx: [['di4', 1, 15, 'ST L'], ['di4', 2, 16, 'ST R']], hp: '4 subs AS40 suspendus devant le cadre, ampli DI-4.2000',
    role: "Les subs reçoivent eux aussi le Stereo (L et R) : pas de bus sub séparé. Le filtrage et le niveau sont réglés dans l'ampli Fohhn. Pour des subs en aux, il faudrait réabonner DI-4-2000-SUB à un autre Dante Out." },
  { id: 'fill', nom: 'Front fills', bus: 'ST L / ST R', src: 'Stereo', out: '15 / 16', couleur: '#4cc38a',
    rx: [1, 2, 3, 4].map(c => ['ma1', c, 15, 'ST L']).concat([1, 2, 3, 4].map(c => ['ma2', c, 16, 'ST R'])),
    hp: '8 XT1 au nez de scène : MA-Nez-Scene-1 (jardin, ← ST L) et MA-Nez-Scene-2 (cour, ← ST R)',
    role: "Les front fills reçoivent aussi le Stereo ; leur niveau et leur délai sont dans les matrices Fohhn. Les Matrix « Front L/R » de la console n'arrivent donc nulle part tant qu'on ne réabonne pas les MA-Nez-Scene." },
  { id: 'centre', nom: 'Centre', bus: 'à choisir (ex. MONO ou une Matrix « Centre »)', src: 'Stereo / voix', out: 11, couleur: '#ffcb6b',
    rx: [['di2', 1, 11, 'Matrix Centre']], hp: 'AT40 au plafond, dans l\'axe (≈ 8,6 m), ampli DI-2.2000',
    role: "Un point central, surtout pour la voix. Il écoute le Dante Out 11 de la DM7 : c'est à toi de choisir ce que tu y envoies." },
  { id: 'retours', nom: 'Retours (×4)', bus: 'un Mix « Retours »', src: 'mix de retour', out: 4, couleur: '#f78c6c', retour: true,
    rx: [1, 2, 3, 4].map(c => ['ma3', c, 4, 'Mix Retours']), hp: '4 XT22 sur les BAV-26 et BAV-28 (MA-Retour-Scene)',
    role: "Attention : les 4 entrées de MA-Retour-Scene écoutent toutes le Dante Out 4. Les 4 retours reçoivent donc le MÊME mix. Pour 4 mix différents, réabonne Input 2, 3, 4 à d'autres Dante Out (ex. 5, 6, 7)." },
];

// Entrées Dante de la DM7 posées par l'installateur
export const DM7_RX_FIXE = [1, 2, 3, 4].map(c => ({ rx: c, tx: 'ulxd', txCh: c }));

// Récepteur système -> zone (pour réutiliser le même Dante Out dans l'onglet Sorties)
export const SYS_RX = {};
for (const z of ZONES) for (const [dev, ch, out, bus] of z.rx) SYS_RX[`${dev}:${ch}`] = { ...z, out, bus };
export const SYS_OUTS = new Set(Object.values(SYS_RX).map(z => z.out));

// Libellé d'un canal d'émission de la DM7 selon la diffusion
const OUT_LBL = { 4: 'Retours', 11: 'Centre', 15: 'Gauche (façade J, subs, fills J)', 16: 'Droite (façade C, subs, fills C)' };
export const dm7OutLabel = n => OUT_LBL[n];
