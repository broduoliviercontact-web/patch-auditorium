// Onglet « Comprendre » : le système de l'auditorium et les bases du Dante.
const box = (x, y, w, h, t, sub, c) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#1f232b" stroke="${c}"/>
<text x="${x + w / 2}" y="${y + (sub ? h / 2 - 3 : h / 2 + 4)}" fill="#e6e8ec" font-size="13" font-weight="600" text-anchor="middle">${t}</text>
${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 13}" fill="#9aa3b2" font-size="11" text-anchor="middle">${sub}</text>` : ''}</g>`;
const line = (x1, y1, x2, y2, c, dash) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="2" ${dash ? 'stroke-dasharray="5 4"' : ''}/>`;
const lbl = (x, y, t, c = '#9aa3b2', a = 'middle') => `<text x="${x}" y="${y}" fill="${c}" font-size="11" text-anchor="${a}">${t}</text>`;

const A = '#f0a53a', R = '#5aa9ff', D = '#4cc38a', Y = '#ffcb6b', B = '#82aaff', H = '#c792ea';
const SCHEMA = `<svg viewBox="0 0 760 400" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
${lbl(110, 22, 'PLATEAU', '#e6e8ec')}${lbl(380, 22, 'NODAL (baie son)', '#e6e8ec')}${lbl(640, 22, 'RÉGIE', '#e6e8ec')}
${box(20, 40, 180, 56, 'Boîtiers BAV', 'prises XLR AUD-01…04', A)}
${box(20, 150, 180, 56, 'Rio rack 1 et 2', '16 entrées / 8 sorties', R)}
${box(20, 250, 180, 50, 'Micros HF', 'ULXD4Q (4 canaux)', H)}
${box(20, 330, 180, 50, 'Prises HP Speakon', 'retours XT22, XT1', A)}
${box(290, 40, 180, 56, 'Ghielmetti 1', 'patch analogique', Y)}
${box(290, 150, 180, 56, 'Switchs Dante P1 / S1', 'primaire / secondaire', D)}
${box(290, 330, 180, 50, 'Matrices Fohhn', 'MA-4.600 ×3', D)}
${box(560, 40, 180, 56, 'Ghielmetti 2', 'patch analogique', B)}
${box(560, 120, 180, 50, 'Rio régie', '16 entrées / 8 sorties', R)}
${box(560, 200, 180, 50, 'Switchs Dante P2 / S2', '', D)}
${box(560, 290, 180, 56, 'Console DM7', 'mixe tout en Dante', R)}
${line(200, 68, 290, 68, A)}${lbl(245, 60, 'câbles 60xx')}
${line(470, 68, 560, 68, Y)}${lbl(515, 60, '24 liaisons')}
${line(650, 96, 650, 120, B)}
${line(200, 178, 290, 178, D)}${lbl(245, 170, 'via BAV-24')}
${line(200, 275, 560, 235, H, 1)}${lbl(330, 268, 'radio → récepteur ULXD4Q, en Dante', H, 'start')}
${line(470, 178, 560, 225, D)}${lbl(515, 190, 'fibre/réseau')}
${line(650, 170, 650, 200, D)}${line(650, 250, 650, 290, D)}
${line(560, 318, 470, 355, D)}${lbl(515, 352, 'Dante')}
${line(290, 355, 200, 355, A)}${lbl(245, 347, 'câbles 50xx')}
</svg>`;

export const LEARN_HTML = `
<h2>Le système en un coup d'œil</h2>
<div class="box">${SCHEMA}</div>
<p>Un micro peut arriver à la console par trois chemins :</p>
<ul>
  <li><b style="color:${R}">Par une Rio du plateau.</b> Le micro est branché dans la Rio, qui le convertit en Dante tout de suite. C'est le plus simple : un seul câble réseau (déjà en place sur le BAV-24).</li>
  <li><b style="color:${A}">Par un boîtier du mur.</b> Le signal reste analogique : boîtier → Ghielmetti 1 au nodal → une des 24 liaisons → Ghielmetti 2 en régie → Rio de la régie, qui le passe en Dante. Il faut poser deux cordons, un à chaque patch.</li>
  <li><b style="color:${H}">Par un micro HF.</b> Le récepteur ULXD4Q envoie directement ses 4 canaux en Dante.</li>
</ul>

<h2>Le Dante, en cinq idées</h2>
<div class="box"><b>1. C'est de l'audio dans un câble réseau.</b> Des dizaines de canaux passent dans un seul câble RJ45, comme internet.</div>
<div class="box"><b>2. Émetteurs et récepteurs.</b> Chaque appareil émet des canaux et en reçoit. La Rio émet ses 16 entrées micro et reçoit 8 canaux pour ses sorties. La DM7 reçoit les micros et émet ses mix.</div>
<div class="box"><b>3. Brancher ne suffit pas : il faut s'abonner.</b> Dans Dante Controller, la grille montre les émetteurs en haut et les récepteurs à gauche. Cocher la case « DM7 canal 1 » × « Rio-Rack-1 canal 1 » veut dire : le canal 1 de la console écoute l'entrée 1 de la Rio. C'est ce que l'onglet Fiches liste pour toi.</div>
<div class="box"><b>4. Primaire et secondaire.</b> Tout est câblé en double : un réseau primaire (switchs P1 au nodal, P2 en régie) et un secondaire (S1, S2). Si un côté lâche, le son continue par l'autre. Règle d'or : ne jamais relier P et S ensemble, et ne jamais brancher autre chose que du Dante dessus (le RTP MIDI va sur les switchs de contrôle).</div>
<div class="box"><b>5. L'horloge.</b> Un seul appareil donne le tempo à tous : le « Leader ». Dans Dante Controller, onglet <i>Clock Status</i>, vérifie qui l'est. Ici, c'est la <b>DM7</b> (Y001-Yamaha-DM7C) qui est leader : laisse-la ainsi, avec <i>Preferred Leader</i> coché. Des clics dans le son = souvent un souci d'horloge.</div>

<h2>La diffusion de la salle</h2>
<p>La DM7 n'est reliée à aucune enceinte par un câble : tout part en Dante. Tu mixes sur le <b>Stereo</b> ; chaque zone de la salle reçoit le Stereo par son propre bus <b>Matrix</b>, avec son niveau à elle. Chaque Matrix sort sur un <b>Dante Out</b> fixe, auquel s'abonnent les amplis ou les enceintes.</p>
<ul>
  <li><b>Façade</b> (Matrix 1 et 2) : deux colonnes Fohhn DLI de chaque côté du cadre. Elles s'amplifient elles-mêmes et reçoivent le Dante directement.</li>
  <li><b>Subs</b> (Matrix 3) : 4 AS40 suspendus devant le cadre, alimentés par l'ampli DI-4.2000 du nodal.</li>
  <li><b>Front fills</b> (Matrix 4) : 8 XT1 au nez de scène pour les premiers rangs, alimentés par les matrices MA-4.600 n°1 et n°2.</li>
  <li><b>Centre</b> (Matrix 5) : une AT40 au plafond, dans l'axe, alimentée par la DI-2.2000.</li>
  <li><b>Retours</b> (Mix 1 à 4) : 4 XT22 sur les BAV-26 et BAV-28, alimentés par la MA-4.600 n°3.</li>
</ul>
<p>Les égalisations, délais et protections sont dans les amplis Fohhn (réglés par l'installateur avec Fohhn Audio Soft) : on n'y touche pas. L'onglet <b>Dante</b> montre toute cette diffusion dans une grille de Dante Controller simulée. Ce plan est une proposition : compare-le avec la config réelle (capture de Dante Controller) avant de l'appliquer, et sauvegarde d'abord l'existant (File → Save Preset).</p>

<h2>La fantôme (+48 V)</h2>
<p>Elle s'active sur l'entrée qui reçoit le micro : la Rio du plateau, ou la Rio de la régie quand on passe par un boîtier. Dans ce cas, la tension remonte les câbles et les deux patchs jusqu'au micro. Pose d'abord tes cordons, active la fantôme ensuite, et coupe-la avant de débrancher un cordon au Ghielmetti.</p>
<p>Besoin de fantôme : micros statiques (C414, C451, KM184, MX418, DPA avec adaptateur XLR) et DI actives. Pas besoin : dynamiques (SM58, e906), DI passives, lignes. Les HF n'en ont jamais besoin.</p>

<h2>À vérifier sur place</h2>
<p>Les numéros de câbles viennent du synoptique (indice 0, octobre 2025). Ceux marqués « à vérifier » n'ont pas encore été confirmés. Avant un accueil d'artiste, teste chaque ligne, avec un générateur ou en grattant le micro.</p>
`;
