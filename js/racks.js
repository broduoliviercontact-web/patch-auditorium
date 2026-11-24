// Façades des baies, dessinées d'après les photos du 24/11/2026 (nodal et régie) et le tableau
// « Régies Auditorium » (positions en U de la régie). Chaque port / colonne porte data-rk
// (module:point) pour l'interaction.
import { PATCHES, labelCable } from './baies.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const range = (a, n) => Array.from({ length: n }, (_, i) => a + i);
const p2 = i => String(i).padStart(2, '0');

// Groupes d'étiquettes : [['BAV-20', ['ETH-01', …]], …] -> tableau de 24/48 étiquettes + entêtes
const grp = (...g) => g; // lisibilité
const eth = n => range(1, n).map(i => 'ETH-' + p2(i));
const aud = (a, n) => range(a, n).map(i => 'AUD-' + p2(i));

// ---------------------------------------------------------------- étiquettes réelles (photos)
export const LABELS = {
  'N-DANTE': grp(['Façade (enceintes DLI, Dante P/S)', range(4501, 8).map(c => String(c))]),
  'N-A': grp(['Régie Spectacle', eth(12)], ['BAV-06', eth(2)], ['BAV-07', eth(2)], ['BAV-08', eth(2)], ['BAV-09', eth(2)], ['BAV-10', eth(2)], ['BAV-11', eth(2)]),
  'N-B': grp(['BAV-12', eth(2)], ['BAV-13', eth(2)], ['BAV-14', eth(2)], ['BAV-15', eth(4)], ['BAV-16', eth(2)], ['BAV-17', eth(2)], ['BAV-18', eth(2)], ['BAV-19', eth(2)]),
  'N-C': grp(['BAV-20', eth(8)], ['BAV-21', eth(4)], ['BAV-22', eth(4)], ['BAV-23', eth(8)]),
  'N-D': grp(['BAV-24', eth(4)], ['BAV-25', eth(2)], ['BAV-26', eth(6)], ['BAV-27', eth(4)], ['BAV-28', eth(6)]),
  'R-A': grp(['Nodal', eth(12)], ['', range(13, 6).map(() => '')], ['BAV-02 Son', eth(6)]),
  'R-B': grp(['BAV-03 Vidéo', eth(8)], ['BAV-04 FdsC', eth(6)], ['BAV-05 Vidéoprojecteur', eth(4)]),
  'R-C': grp(['PMS-02', eth(10)]),
  G1top: grp(['Régie Spectacle', aud(13, 12)], ['BAV-06 R2FC', aud(1, 4)], ['BAV-15 Salle de Musique', aud(1, 4)], ['BAV-20', aud(1, 4)], ['BAV-28', aud(1, 4)]),
  G1bot: grp(['Régie Spectacle', aud(1, 12)], ['BAV-21', aud(3, 2)], ['BAV-22', aud(3, 2)], ['BAV-23', aud(1, 4)], ['BAV-26', aud(1, 4)], ['RG', ['INPUT 1']]),
  // Ghielmetti régie : relevé complet sur les photos du 24/11 (colonnes 1 à 48)
  G2top: grp(['BAV-02 Son', aud(1, 2)], ['BAV-03 Vidéo', aud(1, 2)], ['OUT TASCAM', ['L', 'R']], ['BAV-01 FdsJ', aud(1, 2)], ['BAV-04 FdsC', aud(1, 2)],
    ['PMS-01', aud(1, 4)], ['', ['', '']], ['RIO 16/8', range(1, 8).map(i => 'OUT ' + i)], ['Micro ambiance', ['Salle', 'Scène']], ['Con. Aud', ['Out 14']], ['', ['']],
    ['NODAL', aud(1, 12)], ['BAV-05 VP', aud(1, 2)], ['', ['']], ['Tascam', ['OUT AES']], ['OUT AES FOCUSRITE', ['1/2', '3/4', '5/6', '7/8']]),
  G2bot: grp(['RIO 16/8', range(1, 16).map(i => 'IN ' + i)], ['BAV-02 Son', aud(3, 2)], ['BAV-03 Vidéo', aud(3, 2)], ['IN TASCAM', ['L', 'R']], ['Console audio', range(13, 4).map(i => 'IN-' + i)],
    ['ME', ['IN']], ['', ['']], ['NODAL', aud(13, 12)], ['', ['', '', '']], ['Tascam', ['IN AES']], ['AES FOCUSRITE', ['9/10', '11/12', '13/14', '15/16']]),
  'V-A': grp(['Nodal - Matrice vidéo', [...range(1, 8).map(i => 'IN ' + p2(i)), ...range(1, 8).map(i => 'OUT ' + p2(i))]]),
  'V-B': grp(['BAV-01 FdsJ', ['VID-01', 'VID-02']], ['BAV-02 Son', ['VID-01', 'VID-02']], ['BAV-03 Vidéo', range(1, 6).map(i => 'VID-' + p2(i))], ['BAV-04 FdsC', ['VID-01', 'VID-02', 'VID-03']], ['BAV-05 VP', ['VID-01', 'VID-02']]),
};
const flat = g => g.flatMap(([gn, l]) => l.map(t => [gn, t].filter(Boolean).join(' ')));

// État relevé sur les photos (24/11) : bouchons du Ghielmetti nodal, ports occupés par un cordon
export const ETAT = {
  G1plugs: new Set(range(1, 48).filter(i => i !== 25)), // bouchon partout sauf colonne 25 (BAV-28 AUD-01 / RG INPUT 1)
  G2plugs: new Set([41, 42, 43]), // photo du 24/11 : bouchons seulement sous les colonnes vides 41-43 ; les autres colonnes sont patchées au cordon
  ports: { 'N-C': [1, 2], 'N-D': [3, 4, 17], 'N-DANTE': range(1, 8), 'R-A': [5, 17, 18, 19, 20, 21, 22, 23], 'R-B': [1, 10, 11, 12, 13], 'R-C': [1, 2, 5, 13, 24] },
};

// ---------------------------------------------------------------- baies
// h = hauteur en U ; t = type de façade
export const RACKS = {
  nodal: { nom: 'Nodal · baie son', source: "Ordre d'après la photo de la baie entière du 24/11.", mods: [
    { t: 'dev', h: 1, nom: 'Patch fibre optique 1', sub: 'Liaisons fibre (dont 7021-7023 vers la régie)', col: '#1d1f24', style: 'lc' }, { t: 'brush' },
    { t: 'dev', h: 1, nom: 'Patch fibre optique 2', col: '#1d1f24', style: 'lc' }, { t: 'brush' },
    { t: 'rj45', id: 'N-DANTE', nom: 'Patch RJ45 « Dante » (façade)' }, { t: 'brush' },
    { t: 'switch', nom: 'Primaire 1', sid: 'S-P1', role: 'Switch Dante P1', fibre: 7021, col: '#4cc38a' }, { t: 'brush' },
    { t: 'switch', nom: 'Secondaire 1', sid: 'S-S1', role: 'Switch Dante S1', fibre: 7022, col: '#82aaff' }, { t: 'brush' },
    { t: 'switch', nom: 'Contrôle 1', sid: 'S-C1', role: 'Switch de contrôle (RTP MIDI, limiteur)', fibre: 7023, col: '#9aa3b2', note: 'port 1 → 4098 limiteur' }, { t: 'brush' },
    { t: 'rj45', id: 'N-A', nom: 'Patch RJ45 A' }, { t: 'brush' },
    { t: 'rj45', id: 'N-B', nom: 'Patch RJ45 B' }, { t: 'brush' },
    { t: 'rj45', id: 'N-C', nom: 'Patch RJ45 C' }, { t: 'brush' },
    { t: 'rj45', id: 'N-D', nom: 'Patch RJ45 D' }, { t: 'brush' },
    { t: 'ghiel', id: 'G1', nom: 'Ghielmetti CSF 1×48 AV · nodal', top: 'G1top', bot: 'G1bot', plugs: 'G1plugs' }, { t: 'blank' },
    { t: 'dev', h: 1, nom: 'Audiopole SPL-ONE', sub: 'Limiteur de niveau · IP 192.168.0.122', col: '#1d2633', style: 'spl' }, { t: 'brush' },
    { t: 'dev', h: 2, nom: 'Biamp MA120', sub: 'Ampli-mélangeur (entrée 1 ← Ghielmetti col. 25 « RG INPUT 1 »)', col: '#22262d', style: 'biamp' }, { t: 'vent' },
    { t: 'dev', h: 1, nom: 'Fohhn MA-4.600', sub: 'MA-Nez-Scene-1 · XT1 1-4 (BAV-20)', col: '#1b1d21', style: 'fohhn' }, { t: 'vent' },
    { t: 'dev', h: 1, nom: 'Fohhn MA-4.600', sub: 'MA-Nez-Scene-2 · XT1 5-8 (BAV-23)', col: '#1b1d21', style: 'fohhn' }, { t: 'vent' },
    { t: 'dev', h: 1, nom: 'Fohhn MA-4.600', sub: 'MA-Retour-Scene · XT22 (BAV-26, BAV-28)', col: '#1b1d21', style: 'fohhn' }, { t: 'vent' },
    { t: 'dev', h: 2, nom: 'Fohhn DI-4.2000', sub: 'DI-4-2000-SUB · 4 subs AS40', col: '#1b1d21', style: 'fohhn' }, { t: 'vent' },
    { t: 'dev', h: 2, nom: 'Fohhn DI-2.2000', sub: 'DI-2-2000-Centre · AT40', col: '#1b1d21', style: 'fohhn' },
  ] },
  regie: { nom: 'Régie spectacle · baie son / vidéo', source: 'Positions en U du tableau « Régies Auditorium » et photos du 24/11.', top: 47, mods: [
    { u: 47, t: 'dev', h: 1, nom: 'Éclairage', col: '#22262d' },
    { u: 45, t: 'dev', h: 1, nom: 'Patch FO SM', col: '#22262d', style: 'fo' },
    { u: 44, t: 'dev', h: 1, nom: 'Patch FO MM', col: '#22262d', style: 'fo' },
    { u: 43, t: 'dev', h: 1, nom: 'Patch FO MM', col: '#22262d', style: 'fo' },
    { u: 41, t: 'dev', h: 1, nom: 'Shure ULXD4Q', sub: 'Récepteur HF 4 canaux → DM7 entrées Dante 1-4', col: '#20242a', style: 'shure' },
    { u: 39, t: 'dev', h: 3, nom: 'Blackmagic SmartView', sub: 'Écrans de contrôle vidéo', col: '#15171b', style: 'screen' },
    { u: 35, t: 'switch', nom: 'Primaire 2', sid: 'S-P2', role: 'Switch Dante P2', col: '#4cc38a', fibre: 7021 },
    { u: 34, t: 'switch', nom: 'Secondaire 2', sid: 'S-S2', role: 'Switch Dante S2', col: '#82aaff', fibre: 7022 },
    { u: 33, t: 'switch', nom: 'Contrôle 2', sid: 'S-C2', role: 'Switch de contrôle', col: '#9aa3b2', fibre: 7023 },
    { u: 32, t: 'rj45', id: 'R-A', nom: 'Patch RJ45 A' },
    { u: 31, t: 'rj45', id: 'R-B', nom: 'Patch RJ45 B' },
    { u: 30, t: 'rj45', id: 'R-C', nom: 'Patch RJ45 C' },
    { u: 28, t: 'bnc', id: 'V-A', nom: 'Patch vidéo BNC 12G A' },
    { u: 27, t: 'bnc', id: 'V-B', nom: 'Patch vidéo BNC 12G B' },
    { u: 25, t: 'ghiel', id: 'G2', nom: 'Ghielmetti CSF 1×48 AV · régie', top: 'G2top', bot: 'G2bot', plugs: 'G2plugs' },
    { u: 23, t: 'dev', h: 1, nom: 'Focusrite RedNet D16R MkII', sub: 'AES ↔ Dante · RN-D16R2-2dd670', col: '#b3262d', style: 'rednet' },
    { u: 22, t: 'dev', h: 1, nom: 'Tascam SS-R250N', sub: 'Enregistreur', col: '#1b1d21', style: 'tascam' },
    { u: 20, t: 'dev', h: 1, nom: 'Émetteur HF Rondson EJ-770T', sub: 'Stationary transmitter UHF-PLL', col: '#2a2c30' },
    { u: 18, t: 'rio', h: 3, nom: 'Yamaha Rio1608-D3', sub: 'Y003-Yamaha-Rio1608-D3-REGIE · IN 1-16 ← Ghielmetti B1-B16' },
    { u: 14, t: 'dev', h: 3, nom: 'Tiroir', col: '#1d1f24' },
  ] },
};

// ---------------------------------------------------------------- dessin
const W = 1400, EAR = 30, IN = W - 2 * EAR, UH = 60;
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 11}" fill="${o.c || '#c9ced6'}" text-anchor="${o.a || 'middle'}" ${o.w ? `font-weight="${o.w}"` : ''} ${o.ff ? `font-family="${o.ff}"` : ''} pointer-events="none">${esc(s)}</text>`;
export const JACKS = {}; // clé -> { x, y, type, rack, tip }
const ABBR = [[/Vidéoprojecteur/, 'VP'], [/Salle de Musique/, 'Salle mus.'], [/Micro ambiance/, 'Ambiance'], [/Console audio/, 'Console'], [/OUT AES FOCUSRITE|AES FOCUSRITE/, 'Focusrite'],
  [/OUT TASCAM|IN TASCAM/, 'Tascam'], [/ Vidéo$/, ' Vid'], [/ Son$/, ''], [/ FdsJ| FdsC/, ''], [/Con\. Aud/, 'Con.'], [/ R2FC/, '']];
const fit = (t, w, max, k = .58) => Math.min(max, (w - 3) / (Math.max(String(t).length, 1) * k));

const short = t => String(t).replace(/^AUD-0?/, '').replace(/^ETH-0?/, '').replace(/^IN[- ]?(\d)/, '$1').replace(/^OUT (\d)/, '$1');
function strip(x, y, w, groups, n, h, compact = false) {
  const cw = w / n, hh = h / 2;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e8ebef" rx="3"/>`;
  let i = 0;
  for (const [g, l] of groups) {
    const gx = x + i * cw, gw = l.length * cw;
    if (g) {
      let t = g, fs = fit(t, gw, 17);
      for (const [re, r] of ABBR) if (fs < 9 && re.test(t)) { t = t.replace(re, r); fs = fit(t, gw, 17); }
      s += T(gx + gw / 2, y + hh - 4, t, { fs: Math.max(Math.min(fs, hh - 3), 7.5), c: '#0e121a', w: 800 });
    }
    if (i) s += `<line x1="${gx}" y1="${y + 2}" x2="${gx}" y2="${y + h - 2}" stroke="#7d8593" stroke-width="1.2"/>`;
    l.forEach((t, k) => { const tt = compact ? short(t) : t; s += T(gx + (k + .5) * cw, y + h - 6, tt, { fs: Math.max(Math.min(fit(tt, cw, 16, .66), hh - 3), 7), c: '#1d2230', w: 600 }); });
    i += l.length;
  }
  return s + `<line x1="${x + 2}" y1="${y + hh + 1}" x2="${x + w - 2}" y2="${y + hh + 1}" stroke="#c3c8d0" stroke-width=".8"/>`;
}

const jack = (key, x, y, type, rack, tip) => { JACKS[key] = { x, y, type, rack, tip }; };

function rj45(m, y, o, rack) {
  const n = 24, x0 = EAR + 46, w = IN - 92, cw = w / n, P = PATCHES[m.id], pts = P?.points || {};
  let s = strip(x0, y + 3, w, LABELS[m.id], n, 44);
  const L = flat(LABELS[m.id]);
  for (let i = 1; i <= n; i++) {
    const pt = (P?.rows[0] || '') + i, key = `${m.id}:${pt}`, cable = pts[pt], x = x0 + (i - .5) * cw, yy = y + 54;
    const on = o.today.get(key);
    const tip = `${m.nom} · port ${i} · ${L[i - 1] || 'sans étiquette'}${cable ? ' · câble ' + cable : ''}${labelCable(cable) && !L[i - 1] ? ' · ' + labelCable(cable) : ''}${on ? '\nAujourd\'hui : ' + on : ''}`;
    jack(key, x, yy + 11, 'eth', rack, tip);
    s += `<g data-rk="${key}" class="rk" data-tip="${esc(tip)}">
      <rect x="${x - cw * .42}" y="${yy - 1}" width="${cw * .84}" height="24" rx="2" fill="${cable ? '#cbb67f' : '#1a1c21'}" stroke="${on ? '#f0a53a' : '#000'}" stroke-width="${on ? 3 : 1}"/>
      <rect x="${x - cw * .27}" y="${yy + 7}" width="${cw * .54}" height="12" fill="#24262a"/>
      ${T(x, yy + 42, i, { fs: 15, c: '#fff', w: 700 })}</g>`;
  }
  return s;
}

function sw(m, y, o, rack) {
  const x = EAR + 14;
  let s = `<rect x="${EAR + 4}" y="${y + 3}" width="${IN - 8}" height="${UH - 6}" rx="3" fill="#dfe2e6"/><rect x="${EAR + 4}" y="${y + 3}" width="8" height="${UH - 6}" fill="${m.col}"/>`;
  s += T(x + 46, y + 25, 'cisco', { fs: 19, c: '#2b6ca3', w: 700 }) + T(x + 46, y + 44, 'Catalyst 1300', { fs: 11, c: '#555' });
  s += `<rect x="${x + 104}" y="${y + 9}" width="150" height="40" fill="#fff6b0" transform="rotate(-1 ${x + 179} ${y + 29})"/>` + T(x + 179, y + 36, m.nom, { fs: 20, c: '#222', ff: 'cursive' });
  const px = x + 290, pw = 32;
  for (let i = 0; i < 24; i++) {
    const col = Math.floor(i / 2), row = i % 2, n = i + 1, key = `${m.sid}:${n}`;
    const bx = px + col * pw + (col >= 6 ? 14 : 0), by = y + 10 + row * 22, on = o.today.get(key);
    const tip = `${m.role} (« ${m.nom} ») · port ${n}`;
    jack(key, bx + 12, by + 8, 'eth', rack, tip);
    s += `<g data-rk="${key}" class="rk" data-tip="${esc(tip)}"><rect x="${bx}" y="${by}" width="26" height="19" rx="2" fill="#2c2f33" stroke="${on ? '#f0a53a' : '#000'}" stroke-width="${on ? 3 : .8}"/>
      ${T(bx + 12, by + 13, n, { fs: 10, c: '#c0c6cf', w: 600 })}</g>`;
  }
  const fx = px + 12 * pw + 40;
  for (let i = 0; i < 4; i++) s += `<rect x="${fx + i * 34}" y="${y + 15}" width="28" height="18" rx="2" fill="#9aa0a8"/>`;
  if (m.fibre) s += `<rect x="${fx - 3}" y="${y + 12}" width="34" height="24" rx="3" fill="none" stroke="#2fb3a7" stroke-width="2.5"/>` + T(fx + 14, y + UH - 5, 'fibre ' + m.fibre, { fs: 10, c: '#1f8a80', w: 700 });
  s += T(fx + 150, y + 26, m.role, { fs: 17, c: '#222', a: 'start', w: 700 }) + (m.note ? T(fx + 150, y + 46, m.note, { fs: 13, c: '#555', a: 'start' }) : '');
  return s;
}

function ghiel(m, y, o, h, rack) {
  const n = 48, x0 = EAR + 40, w = IN - 80, cw = w / n, top = LABELS[m.top], bot = LABELS[m.bot];
  const plugs = plugsOf(m.id, o.plugs), ft = flat(top), fb = flat(bot), pts = PATCHES[m.id].points;
  let s = `<rect x="${EAR + 2}" y="${y + 2}" width="${IN - 4}" height="${h - 4}" rx="4" fill="#2d3440"/>`;
  s += strip(x0, y + 5, w, top, n, 44, true);
  s += strip(x0, y + h - 49, w, bot, n, 44, true);
  s += T(EAR + 20, y + h / 2 + 5, 'G', { fs: 16, c: '#fff', w: 700 });
  const ya = y + 72, yb = y + h - 72;
  for (let i = 1; i <= n; i++) {
    const x = x0 + (i - .5) * cw;
    s += `<rect x="${x0 + (i - 1) * cw + 1}" y="${ya - 15}" width="${cw - 2}" height="${yb - ya + 30}" fill="${i % 2 ? '#353d4b' : '#303745'}" pointer-events="none"/>`;
    s += T(x, (ya + yb) / 2 + 5, i, { fs: 14, c: '#c7d3e4', w: 700 });
    for (const [pt, cy, light, lab] of [['A' + i, ya, false, ft[i - 1]], ['B' + i, yb, true, fb[i - 1]]]) {
      const key = `${m.id}:${pt}`, on = o.today.get(key), cable = pts[pt], plug = pt[0] === 'B' && plugs.has(i);
      const tip = `Colonne ${i} · ${pt[0] === 'A' ? 'HAUT (source)' : 'BAS (destination)'} · ${lab || 'sans étiquette'}${cable ? ' · câble ' + cable : ''}${plug ? '\nBouchon en place : relié à « ' + (ft[i - 1] || '—') + ' »' : ''}${on ? '\nAujourd\'hui : ' + on : ''}`;
      jack(key, x, cy, 'audio', rack, tip);
      const dc = light ? '#1c1f24' : '#06070a';
      s += `<g data-rk="${key}" class="rk" data-tip="${esc(tip)}">
        <rect x="${x - cw * .45}" y="${cy - 14}" width="${cw * .9}" height="28" rx="2" fill="${light ? '#eef0f2' : '#444d5c'}" stroke="${on ? '#f0a53a' : 'none'}" stroke-width="3"/>
        <circle cx="${x - cw * .2}" cy="${cy - 7}" r="2.6" fill="${dc}"/><circle cx="${x}" cy="${cy + 1}" r="2.6" fill="${dc}"/><circle cx="${x - cw * .02}" cy="${cy + 8}" r="2.6" fill="${dc}"/><circle cx="${x + cw * .22}" cy="${cy + 8}" r="2.6" fill="${dc}"/>
        ${plug ? `<rect x="${x - cw * .44}" y="${cy - 12}" width="${cw * .88}" height="24" rx="4" fill="#101114"/><rect x="${x - cw * .36}" y="${cy - 10}" width="${cw * .72}" height="6" rx="2" fill="#2e2f33"/>` : ''}</g>`;
    }
  }
  return s;
}

function bnc(m, y, o, rack) {
  const n = 16, x0 = EAR + 46, w = IN - 92, cw = w / n, L = flat(LABELS[m.id]);
  let s = strip(x0, y + 3, w, LABELS[m.id], n, 44);
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + .5) * cw, key = `${m.id}:${i + 1}`, tip = `${m.nom} · ${L[i] || 'BNC ' + (i + 1)}`;
    jack(key, x, y + 64, 'bnc', rack, tip);
    s += `<g data-rk="${key}" class="rk" data-tip="${esc(tip)}"><circle cx="${x}" cy="${y + 64}" r="10" fill="#5a554e"/><circle cx="${x}" cy="${y + 64}" r="6" fill="#cfc9bd"/><circle cx="${x}" cy="${y + 64}" r="1.8" fill="#b8860b"/></g>`;
  }
  return s;
}

function rio(m, y, h) {
  let s = `<rect x="${EAR + 4}" y="${y + 3}" width="${IN - 8}" height="${h - 6}" rx="3" fill="#2f3338"/>`;
  s += T(EAR + 70, y + 22, 'YAMAHA', { fs: 15, c: '#fff', w: 700 }) + T(IN - 20, y + 22, 'Rio1608-D3', { fs: 15, c: '#fff', w: 700, a: 'end' });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const x = EAR + 60 + i * 58, yy = y + 58 + r * 52; s += `<circle cx="${x}" cy="${yy}" r="16" fill="#15171a"/>` + T(x, yy - 20, r * 8 + i + 1, { fs: 11 }); }
  for (let i = 0; i < 8; i++) { const x = EAR + 760 + i * 56; s += `<circle cx="${x}" cy="${y + 110}" r="16" fill="#15171a"/>` + T(x, y + 90, i + 1, { fs: 11 }); }
  s += T(EAR + 263, y + h - 6, 'INPUT 1-16 (← Ghielmetti régie, bas des colonnes 1-16)', { fs: 11, c: '#9aa3b2' }) + T(EAR + 956, y + h - 6, 'OUTPUT 1-8 (→ haut des colonnes 17-24)', { fs: 11, c: '#9aa3b2' });
  s += `<rect x="${EAR + 740}" y="${y + 32}" width="420" height="34" rx="3" fill="#1d2024"/>` + T(EAR + 950, y + 54, m.sub, { fs: 11, c: '#4cc38a' });
  return s;
}

function dev(m, y, h) {
  let s = `<rect x="${EAR + 4}" y="${y + 3}" width="${IN - 8}" height="${h - 6}" rx="3" fill="${m.col || '#22262d'}"/>`;
  const mx = EAR + IN * .45;
  if (m.style === 'fohhn') s += `<rect x="${mx}" y="${y + 9}" width="${IN * .5}" height="${h - 18}" fill="url(#perf)"/>` + `<circle cx="${mx - 30}" cy="${y + h / 2}" r="4" fill="#5aa9ff"/>`;
  if (m.style === 'spl') s += `<rect x="${mx}" y="${y + 9}" width="200" height="${h - 18}" fill="#1f3fbf"/>` + T(mx + 100, y + h / 2 + 4, 'SPL-ONE', { fs: 12, c: '#cfe0ff', ff: 'monospace' });
  if (m.style === 'biamp') s += `<circle cx="${mx + 200}" cy="${y + h / 2}" r="${h / 2 - 14}" fill="none" stroke="#3d7bff" stroke-width="5"/>`;
  if (m.style === 'rednet') s += `<rect x="${mx}" y="${y + 8}" width="260" height="${h - 16}" rx="3" fill="#111"/>` + T(mx + 130, y + h / 2 + 5, 'REDNET D16R', { fs: 13, c: '#fff', w: 700 });
  if (m.style === 'tascam') s += `<rect x="${mx}" y="${y + 9}" width="220" height="${h - 18}" fill="#2f4fd6"/>`;
  if (m.style === 'screen') s += `<rect x="${EAR + 300}" y="${y + 12}" width="${IN / 2 - 200}" height="${h - 24}" fill="#2b3a55"/><rect x="${EAR + IN / 2 + 120}" y="${y + 12}" width="${IN / 2 - 200}" height="${h - 24}" fill="#2b3a55"/>`;
  if (m.style === 'lc') for (let i = 0; i < 24; i++) s += `<rect x="${mx - 120 + i * 30}" y="${y + 14}" width="22" height="${h - 28}" rx="3" fill="#7a2a55"/><rect x="${mx - 115 + i * 30}" y="${y + 20}" width="12" height="${h - 40}" rx="2" fill="#c9b38a"/>`;
  if (m.style === 'fo') for (let i = 0; i < 12; i++) s += `<rect x="${mx + i * 52}" y="${y + 15}" width="34" height="20" rx="2" fill="#4fd1c5" opacity=".6"/>`;
  s += T(EAR + 24, y + (m.sub ? h / 2 - 3 : h / 2 + 6), m.nom, { fs: 19, c: '#fff', a: 'start', w: 700 });
  if (m.sub) s += T(EAR + 24, y + h / 2 + 18, m.sub, { fs: 14, c: '#b9c1cd', a: 'start' });
  return s;
}

// Bouchons : état relevé + modifications de l'utilisateur ({ G1: { 21: false } })
export function plugsOf(id, over = {}) {
  const base = new Set(ETAT[id + 'plugs'] || []);
  for (const [c, v] of Object.entries(over[id] || {})) v ? base.add(+c) : base.delete(+c);
  return base;
}

export const CORD_COLORS = ['#f0a53a', '#e8544e', '#4cc38a', '#5aa9ff', '#c792ea', '#ffd84d', '#ff8fc8', '#7fe0e0'];
export function cordPath(a, b) {
  const dx = Math.abs(a.x - b.x), sag = 36 + dx * .16 + Math.abs(a.y - b.y) * .15;
  return `M${a.x} ${a.y} C${a.x} ${a.y + sag} ${b.x} ${b.y + sag} ${b.x} ${b.y}`;
}

export function rackFace(which, o) {
  for (const k of Object.keys(JACKS)) if (JACKS[k].rack === which) delete JACKS[k];
  const R = RACKS[which];
  const height = m => (m.h || (m.t === 'ghiel' ? 4 : m.t === 'rj45' ? 1.6 : m.t === 'bnc' ? 1.35 : 1)) * UH;
  const items = []; let y = 12;
  if (R.top) {
    // Régie : ordre et position en U réels ; les U vides sont rétrécis, et le Ghielmetti est agrandi pour être lisible
    let prevU = R.top + 1;
    for (const m of [...R.mods].sort((a, b) => b.u - a.u)) {
      y += Math.max(0, prevU - 1 - m.u) * UH * .45;
      items.push({ m, y, ulab: (m.h || 1) > 1 ? `U${m.u}-${m.u - m.h + 1}` : `U${m.u}` });
      y += height(m); prevU = m.u - (m.h || 1) + 1;
    }
  } else for (const m of R.mods) { items.push({ m, y }); y += height(m); }
  const top0 = Math.min(...items.map(i => i.y)) - 12;
  const H = Math.max(...items.map(i => i.y + height(i.m))) + 14 - top0;
  let s = `<svg viewBox="0 ${top0} ${W} ${H}" class="rackface" data-rack="${which}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
    <defs><pattern id="perf" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#1b1d21"/><circle cx="3.5" cy="3.5" r="1.6" fill="#000"/></pattern>
    <pattern id="brosse" width="3" height="10" patternUnits="userSpaceOnUse"><rect width="3" height="10" fill="#111"/><line x1="1.5" y1="0" x2="1.5" y2="10" stroke="#2a2a2a"/></pattern></defs>
    <rect x="0" y="${top0}" width="${W}" height="${H}" fill="#0b0c0e" rx="6"/>
    <rect x="4" y="${top0 + 4}" width="${EAR - 6}" height="${H - 8}" fill="#2a2d33"/><rect x="${W - EAR + 2}" y="${top0 + 4}" width="${EAR - 6}" height="${H - 8}" fill="#2a2d33"/>`;
  for (const { m, y, ulab } of items) {
    const h = height(m);
    s += `<g class="mod">`;
    if (ulab) s += `<text x="${EAR / 2 + 1}" y="${y + h / 2}" font-size="13" font-weight="600" fill="#9aa3b2" text-anchor="middle" transform="rotate(-90 ${EAR / 2 + 1} ${y + h / 2})" pointer-events="none">${ulab}</text>`;
    if (m.t === 'brush') s += `<rect x="${EAR + 2}" y="${y + 5}" width="${IN - 4}" height="${h - 10}" fill="url(#brosse)" rx="2"/>`;
    else if (m.t === 'vent') s += `<rect x="${EAR + 2}" y="${y + 5}" width="${IN - 4}" height="${h - 10}" fill="url(#perf)" rx="2"/>`;
    else if (m.t === 'blank') s += `<rect x="${EAR + 2}" y="${y + 5}" width="${IN - 4}" height="${h - 10}" fill="#16181c" rx="2"/>`;
    else if (m.t === 'rj45') s += `<rect x="${EAR + 2}" y="${y + 2}" width="${IN - 4}" height="${h - 4}" fill="#111316" rx="2"/>` + rj45(m, y, o, which) + T(EAR + 12, y + h / 2 + 8, m.id.split('-')[1] === 'DANTE' ? 'D' : m.id.split('-')[1], { fs: 22, c: '#f0a53a', a: 'start', w: 700 });
    else if (m.t === 'switch') s += sw(m, y, o, which);
    else if (m.t === 'ghiel') s += ghiel(m, y, o, h, which);
    else if (m.t === 'bnc') s += `<rect x="${EAR + 2}" y="${y + 2}" width="${IN - 4}" height="${h - 4}" fill="#111316" rx="2"/>` + bnc(m, y, o, which);
    else if (m.t === 'rio') s += rio(m, y, h);
    else s += dev(m, y, h);
    s += `</g>`;
  }
  // cordons
  s += `<g class="cords">`;
  for (const g of o.ghosts || []) {
    const a = JACKS[g.a], b = JACKS[g.b]; if (!a || !b || a.rack !== which) continue;
    s += `<path d="${cordPath(a, b)}" fill="none" stroke="#f0a53a" stroke-width="3" stroke-dasharray="8 7" opacity=".85" pointer-events="none"/>`;
  }
  (o.cords || []).forEach(c => {
    const a = JACKS[c.a], b = JACKS[c.b]; if (!a || !b || a.rack !== which) return;
    const d = cordPath(a, b), sel = o.sel === c.id;
    s += `<g class="cord ${sel ? 'sel' : ''}" data-cord="${c.id}">
      <path d="${d}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="11" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="${c.color}" stroke-width="${sel ? 8 : 6.5}" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2" stroke-linecap="round" transform="translate(-1.5 -1.5)"/>
      ${[a, b].map(p => `<circle cx="${p.x}" cy="${p.y}" r="9" fill="${c.color}" stroke="#000" stroke-width="2"/><circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#000" opacity=".5"/>`).join('')}
      ${sel ? `<path d="${d}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 6"/>` : ''}</g>`;
  });
  s += `<path id="cordtmp" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8" pointer-events="none"/></g>`;
  return s + `</svg>`;
}

// Fiche d'un point (clic sur un port / une colonne)
export function rkInfo(key, o) {
  const [id, pt] = key.split(':'), P = PATCHES[id], J = JACKS[key];
  const mod = [...RACKS.nodal.mods, ...RACKS.regie.mods].find(m => m.id === id || m.sid === id);
  const cable = P?.points[pt], on = o.today.get(key);
  let lab = '', plugBtn = '';
  if (id === 'G1' || id === 'G2') {
    const col = +pt.slice(1), top = flat(LABELS[id + 'top']), bot = flat(LABELS[id + 'bot']), plugs = plugsOf(id, o.plugs);
    lab = `Colonne ${col} · ${pt[0] === 'A' ? 'HAUT (source)' : 'BAS (destination)'} : <b>${esc((pt[0] === 'A' ? top : bot)[col - 1] || '—')}</b><br>
      En face dans la même colonne : ${esc((pt[0] === 'A' ? bot : top)[col - 1] || '—')}<br>
      Bouchon : ${plugs.has(col) ? '<b>oui</b> : le haut et le bas de la colonne sont reliés' : 'non : colonne ouverte'}`;
    plugBtn = `<button data-plug="${id}:${col}">${plugs.has(col) ? 'Retirer le bouchon' : 'Remettre le bouchon'}</button>`;
  } else {
    lab = esc(J?.tip?.split('\n')[0] || key);
  }
  const mine = (o.cords || []).filter(c => c.a === key || c.b === key);
  return `<h2>${esc(mod?.nom || id)} · ${esc(pt)}</h2>
    <p>${lab}</p>
    ${cable ? `<p>Câble fixe n° <b>${cable}</b>${labelCable(cable) ? ' · ' + esc(labelCable(cable)) : ''}</p>` : ''}
    ${on ? `<p class="w">Aujourd'hui : ${esc(on)}</p>` : ''}
    ${mine.map(c => { const other = c.a === key ? c.b : c.a; return `<p><span class="dot" style="background:${c.color}"></span> Cordon vers <b>${esc(JACKS[other]?.tip?.split('\n')[0] || other)}</b> <button data-delcord="${c.id}">Retirer</button></p>`; }).join('')}
    <p class="hint">Pour poser un cordon : appuie sur ce point et glisse jusqu'à un autre point du même type.</p>
    ${plugBtn}`;
}

export function cordInfo(c) {
  const A = JACKS[c.a], B = JACKS[c.b];
  return `<h2><span class="dot" style="background:${c.color}"></span> Cordon</h2>
    <p><b>${esc(A?.tip?.split('\n')[0] || c.a)}</b></p><p>↕</p><p><b>${esc(B?.tip?.split('\n')[0] || c.b)}</b></p>
    <p><button data-delcord="${c.id}" class="primary">Retirer ce cordon</button> <button data-cordcolor="${c.id}">Changer la couleur</button></p>
    <p class="hint">Raccourcis : double-clic sur le cordon, ou sélection puis touche Suppr.</p>`;
}
