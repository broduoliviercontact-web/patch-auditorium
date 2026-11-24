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
  nodal: { nom: 'Nodal · baie son', source: "Ordre d'après les photos du 24/11 (hauteurs approximatives).", mods: [
    { t: 'rj45', id: 'N-DANTE', nom: 'Patch RJ45 « Dante » (façade)' }, { t: 'brush' },
    { t: 'switch', nom: 'Primaire 1', role: 'Switch Dante P1', fibre: 7021, col: '#4cc38a' }, { t: 'brush' },
    { t: 'switch', nom: 'Secondaire 1', role: 'Switch Dante S1', fibre: 7022, col: '#82aaff' }, { t: 'brush' },
    { t: 'switch', nom: 'Contrôle 1', role: 'Switch de contrôle (RTP MIDI, limiteur)', fibre: 7023, col: '#9aa3b2', note: 'port 1 → 4098 limiteur' }, { t: 'brush' },
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
    { u: 35, t: 'switch', nom: 'Primaire 2', role: 'Switch Dante P2', col: '#4cc38a', fibre: 7021 },
    { u: 34, t: 'switch', nom: 'Secondaire 2', role: 'Switch Dante S2', col: '#82aaff', fibre: 7022 },
    { u: 33, t: 'switch', nom: 'Contrôle 2', role: 'Switch de contrôle', col: '#9aa3b2', fibre: 7023 },
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
const W = 1000, EAR = 26, IN = W - 2 * EAR, UH = 44;
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 9}" fill="${o.c || '#c9ced6'}" text-anchor="${o.a || 'middle'}" ${o.w ? `font-weight="${o.w}"` : ''} ${o.ff ? `font-family="${o.ff}"` : ''}>${esc(s)}</text>`;

const short = t => String(t).replace(/^AUD-0?/, '').replace(/^ETH-0?/, '').replace(/^IN (\d)/, '$1').replace(/^OUT (\d)/, '$1');
function strip(x, y, w, groups, n, h = 22, compact = false) {
  // bandeau d'étiquettes : ligne d'entêtes de groupes + ligne d'étiquettes (texte réduit pour tenir)
  const cw = w / n; let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#dfe3e8" rx="2"/>`;
  let i = 0;
  for (const [g, l] of groups) {
    const gx = x + i * cw, gw = l.length * cw;
    if (g) { const fs = Math.min(7.5, (gw - 2) / (g.length * .55)); s += T(gx + gw / 2, y + 8, g, { fs: Math.max(fs, 4.2), c: '#333', w: 600 }); }
    s += `<line x1="${gx}" y1="${y + 1}" x2="${gx}" y2="${y + h - 1}" stroke="#9aa0a8" stroke-width=".7"/>`;
    l.forEach((t, k) => { const tt = compact ? short(t) : t; const fs = Math.min(6.8, (cw - 1.5) / (Math.max(tt.length, 1) * .56)); s += T(gx + (k + .5) * cw, y + 18.5, tt, { fs: Math.max(fs, 4.2), c: '#222' }); });
    i += l.length;
  }
  return s;
}

function rj45(m, y, used, today) {
  const n = 24, x0 = EAR + 40, w = IN - 80, cw = w / n, pts = PATCHES[m.id]?.points || {};
  let s = strip(x0, y + 2, w, LABELS[m.id], n, 18);
  for (let i = 1; i <= n; i++) {
    const pt = (PATCHES[m.id]?.rows[0] || '') + i, cable = pts[pt], x = x0 + (i - .5) * cw, yy = y + 22;
    const on = today.get(`${m.id}:${pt}`), occ = (ETAT.ports[m.id] || []).includes(i);
    const fill = cable ? '#c8b27e' : '#0c0d10';
    s += `<g data-rk="${m.id}:${pt}" class="rk"><title>${esc(`${m.nom} · port ${i}${cable ? ' · câble ' + cable : ' · vide'}${labelCable(cable) ? ' · ' + labelCable(cable) : ''}${on ? ' · AUJOURD\'HUI : ' + on : ''}`)}</title>
      <rect x="${x - cw * .36}" y="${yy}" width="${cw * .72}" height="12" rx="1.5" fill="${fill}" stroke="${on ? '#f0a53a' : '#555'}" stroke-width="${on ? 2.5 : .6}"/>
      ${cable ? `<rect x="${x - cw * .2}" y="${yy + 6}" width="${cw * .4}" height="5" fill="#2a2a2a"/>` : ''}
      ${occ ? `<rect x="${x - cw * .26}" y="${yy - 1}" width="${cw * .52}" height="14" rx="2" fill="#15171a" opacity=".9"/><line x1="${x}" y1="${yy + 13}" x2="${x}" y2="${yy + 20}" stroke="#15171a" stroke-width="4"/>` : ''}
      ${T(x, y + UH - 3, i, { fs: 8, c: '#e6e8ec' })}</g>`;
  }
  return s;
}

function sw(m, y) {
  const x = EAR + 12;
  let s = `<rect x="${EAR + 4}" y="${y + 3}" width="${IN - 8}" height="${UH - 6}" rx="3" fill="#dfe2e6"/>`;
  s += T(x + 30, y + 16, 'cisco', { fs: 10, c: '#2b6ca3', w: 700 }) + T(x + 30, y + 30, 'Catalyst 1300', { fs: 7, c: '#666' });
  s += `<rect x="${x + 110}" y="${y + 8}" width="88" height="28" fill="#fff9c4" transform="rotate(-1 ${x + 150} ${y + 22})"/>` + T(x + 154, y + 26, m.nom, { fs: 11, c: '#333', ff: 'cursive' });
  const px = x + 300;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) {
    const bx = px + (i % 12) * 26 + (i >= 6 ? 14 : 0) + Math.floor(i / 12);
    s += `<rect x="${bx}" y="${y + 8 + r * 15}" width="20" height="12" rx="1.5" fill="#2c2f33"/>`;
  }
  for (let i = 0; i < 4; i++) s += `<rect x="${px + 340 + i * 30}" y="${y + 14}" width="24" height="14" rx="1.5" fill="#9aa0a8"/>`;
  if (m.fibre) s += `<rect x="${px + 336}" y="${y + 12}" width="32" height="18" rx="3" fill="none" stroke="#4fd1c5" stroke-width="2"/>` + T(px + 352, y + 41, 'fibre ' + m.fibre, { fs: 7.5, c: '#2a8f86', w: 600 });
  s += `<rect x="${EAR + 4}" y="${y + 3}" width="6" height="${UH - 6}" fill="${m.col}"/>`;
  s += T(px + 470, y + 20, m.role, { fs: 8, c: '#333', a: 'start', w: 600 }) + (m.note ? T(px + 470, y + 32, m.note, { fs: 7, c: '#555', a: 'start' }) : '');
  return s;
}

function ghiel(m, y, today, h) {
  const n = 48, x0 = EAR + 34, w = IN - 68, cw = w / n, top = LABELS[m.top], bot = LABELS[m.bot], plugs = ETAT[m.plugs];
  const ft = flat(top), fb = flat(bot), pts = PATCHES[m.id].points;
  let s = `<rect x="${EAR + 2}" y="${y + 2}" width="${IN - 4}" height="${h - 4}" rx="3" fill="#2d3440"/>`;
  s += strip(x0, y + 4, w, top, n, 22, true);
  s += strip(x0, y + h - 26, w, bot, n, 22, true);
  s += T(EAR + 16, y + h / 2 + 3, 'G', { fs: 12, c: '#fff', w: 700 });
  for (let i = 1; i <= n; i++) {
    const x = x0 + (i - .5) * cw, ya = y + 32, yb = y + h - 46, a = 'A' + i, b = 'B' + i;
    const onA = today.get(`${m.id}:${a}`), onB = today.get(`${m.id}:${b}`);
    const dots = (cx, cy, on, light) => `<rect x="${cx - cw * .44}" y="${cy - 9}" width="${cw * .88}" height="18" fill="${light ? '#e9ecef' : '#3b4350'}" stroke="${on ? '#f0a53a' : 'none'}" stroke-width="2.5"/>
      <circle cx="${cx - cw * .18}" cy="${cy - 4}" r="1.8" fill="${light ? '#222' : '#0b0c0e'}"/><circle cx="${cx}" cy="${cy + 3}" r="1.8" fill="${light ? '#222' : '#0b0c0e'}"/><circle cx="${cx + cw * .2}" cy="${cy + 3}" r="1.8" fill="${light ? '#222' : '#0b0c0e'}"/>`;
    s += `<g data-rk="${m.id}:${a}" class="rk"><title>${esc(`Colonne ${i} · haut (A${i}) : ${ft[i - 1] || '—'}${pts[a] ? ' · câble ' + pts[a] : ''}${onA ? ' · AUJOURD\'HUI : ' + onA : ''}`)}</title>${dots(x, ya, onA, false)}</g>`;
    s += `<g data-rk="${m.id}:${b}" class="rk"><title>${esc(`Colonne ${i} · bas (B${i}) : ${fb[i - 1] || '—'}${pts[b] ? ' · câble ' + pts[b] : ''}${onB ? ' · AUJOURD\'HUI : ' + onB : ''}${plugs?.has(i) ? ' · bouchon en place' : ''}`)}</title>${dots(x, yb, onB, true)}
      ${plugs?.has(i) ? `<rect x="${x - cw * .42}" y="${yb - 2}" width="${cw * .84}" height="15" rx="2.5" fill="#111"/><rect x="${x - cw * .36}" y="${yb - 1}" width="${cw * .72}" height="4" rx="1" fill="#2b2b2b"/>` : ''}</g>`;
  }
  return s;
}

function bnc(m, y) {
  const n = 16, x0 = EAR + 40, w = IN - 80, cw = w / n;
  let s = strip(x0, y + 2, w, LABELS[m.id], n, 18);
  for (let i = 0; i < n; i++) { const x = x0 + (i + .5) * cw; s += `<circle cx="${x}" cy="${y + 32}" r="9" fill="#55504a"/><circle cx="${x}" cy="${y + 32}" r="5" fill="#c9c3b8"/><circle cx="${x}" cy="${y + 32}" r="1.6" fill="#b8860b"/>`; }
  return s;
}

function rio(m, y, h) {
  let s = `<rect x="${EAR + 4}" y="${y + 3}" width="${IN - 8}" height="${h - 6}" rx="3" fill="#2f3338"/>`;
  s += T(EAR + 60, y + 18, 'YAMAHA', { fs: 11, c: '#fff', w: 700 }) + T(IN - 40, y + 18, 'Rio1608-D3', { fs: 11, c: '#fff', w: 700, a: 'end' });
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const x = EAR + 50 + i * 46, yy = y + 46 + r * 44; s += `<circle cx="${x}" cy="${yy}" r="13" fill="#15171a"/>` + T(x, yy - 17, r * 8 + i + 1, { fs: 8 }); }
  for (let i = 0; i < 8; i++) { const x = EAR + 560 + i * 44; s += `<circle cx="${x}" cy="${y + 90}" r="13" fill="#15171a"/>` + T(x, y + 73, i + 1, { fs: 8 }); }
  s += T(EAR + 210, y + h - 8, 'INPUT 1-16 (← Ghielmetti régie B1-B16)', { fs: 8, c: '#9aa3b2' }) + T(EAR + 714, y + h - 8, 'OUTPUT 1-8', { fs: 8, c: '#9aa3b2' });
  s += `<rect x="${EAR + 560}" y="${y + 28}" width="250" height="34" rx="3" fill="#1d2024"/>` + T(EAR + 685, y + 50, m.sub, { fs: 7.5, c: '#4cc38a' });
  return s;
}

function dev(m, y, h) {
  let s = `<rect x="${EAR + 4}" y="${y + 3}" width="${IN - 8}" height="${h - 6}" rx="3" fill="${m.col || '#22262d'}"/>`;
  if (m.style === 'fohhn') s += `<rect x="${EAR + 200}" y="${y + 8}" width="${IN - 260}" height="${h - 16}" fill="url(#perf)"/>` + `<circle cx="${EAR + 140}" cy="${y + h / 2}" r="3" fill="#5aa9ff"/>`;
  if (m.style === 'spl') s += `<rect x="${EAR + 420}" y="${y + 9}" width="150" height="${h - 18}" fill="#1f3fbf"/>` + T(EAR + 495, y + h / 2 + 3, 'SPL-ONE', { fs: 9, c: '#cfe0ff', ff: 'monospace' });
  if (m.style === 'biamp') s += `<circle cx="${EAR + 640}" cy="${y + h / 2}" r="${h / 2 - 12}" fill="none" stroke="#3d7bff" stroke-width="4"/>`;
  if (m.style === 'rednet') s += `<rect x="${EAR + 560}" y="${y + 7}" width="190" height="${h - 14}" rx="3" fill="#111"/>` + T(EAR + 655, y + h / 2 + 4, 'REDNET D16R', { fs: 10, c: '#fff', w: 700 });
  if (m.style === 'tascam') s += `<rect x="${EAR + 380}" y="${y + 8}" width="160" height="${h - 16}" fill="#2f4fd6"/>`;
  if (m.style === 'screen') s += `<rect x="${EAR + 40}" y="${y + 10}" width="${IN / 2 - 60}" height="${h - 20}" fill="#2b3a55"/><rect x="${EAR + IN / 2 + 20}" y="${y + 10}" width="${IN / 2 - 60}" height="${h - 20}" fill="#2b3a55"/>`;
  if (m.style === 'fo') for (let i = 0; i < 12; i++) s += `<rect x="${EAR + 300 + i * 40}" y="${y + 14}" width="26" height="16" rx="2" fill="#4fd1c5" opacity=".6"/>`;
  s += T(EAR + 18, y + (m.sub ? h / 2 - 2 : h / 2 + 4), m.nom, { fs: 11, c: '#fff', a: 'start', w: 700 });
  if (m.sub) s += T(EAR + 18, y + h / 2 + 12, m.sub, { fs: 8.5, c: '#aab3c0', a: 'start' });
  return s;
}

export function rackFace(which, today) {
  const R = RACKS[which];
  const height = m => (m.h || (m.t === 'ghiel' ? 2 : 1)) * UH;
  const items = []; let y = 10;
  if (R.top) {
    for (const m of R.mods) items.push({ m, y: 10 + (R.top - m.u) * UH });
  } else for (const m of R.mods) { items.push({ m, y }); y += height(m); }
  const H = Math.max(...items.map(i => i.y + height(i.m))) + 10;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="rackface" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
    <defs><pattern id="perf" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#1b1d21"/><circle cx="3" cy="3" r="1.4" fill="#000"/></pattern>
    <pattern id="brosse" width="3" height="10" patternUnits="userSpaceOnUse"><rect width="3" height="10" fill="#111"/><line x1="1.5" y1="0" x2="1.5" y2="10" stroke="#2a2a2a"/></pattern></defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="#0b0c0e" rx="6"/>
    <rect x="4" y="4" width="${EAR - 6}" height="${H - 8}" fill="#2a2d33"/><rect x="${W - EAR + 2}" y="4" width="${EAR - 6}" height="${H - 8}" fill="#2a2d33"/>`;
  if (R.top) for (let u = 1; u <= R.top; u++) { const uy = 10 + (R.top - u) * UH; s += T(EAR / 2 + 1, uy + UH / 2 + 3, u, { fs: 8, c: '#7a8190' }); }
  for (const { m, y } of items) {
    const h = height(m);
    s += `<g class="mod" ${m.id ? `data-goto="${m.id}"` : ''}>`;
    if (m.t === 'brush') s += `<rect x="${EAR + 2}" y="${y + 4}" width="${IN - 4}" height="${h - 8}" fill="url(#brosse)" rx="2"/>`;
    else if (m.t === 'vent') s += `<rect x="${EAR + 2}" y="${y + 4}" width="${IN - 4}" height="${h - 8}" fill="url(#perf)" rx="2"/>`;
    else if (m.t === 'blank') s += `<rect x="${EAR + 2}" y="${y + 4}" width="${IN - 4}" height="${h - 8}" fill="#16181c" rx="2"/>`;
    else if (m.t === 'rj45') s += `<rect x="${EAR + 2}" y="${y + 2}" width="${IN - 4}" height="${h - 4}" fill="#111316" rx="2"/>` + rj45(m, y, null, today) + T(EAR + 8, y + h / 2 + 3, m.id.split('-')[1] === 'DANTE' ? 'D' : m.id.split('-')[1], { fs: 12, c: '#f0a53a', a: 'start', w: 700 });
    else if (m.t === 'switch') s += sw(m, y);
    else if (m.t === 'ghiel') s += ghiel(m, y, today, h);
    else if (m.t === 'bnc') s += `<rect x="${EAR + 2}" y="${y + 2}" width="${IN - 4}" height="${h - 4}" fill="#111316" rx="2"/>` + bnc(m, y);
    else if (m.t === 'rio') s += rio(m, y, h);
    else s += dev(m, y, h);
    s += `</g>`;
  }
  return s + `</svg>`;
}

// Fiche d'un point (clic sur un port / une colonne)
export function rkInfo(key, today) {
  const [id, pt] = key.split(':'), P = PATCHES[id];
  const mod = [...RACKS.nodal.mods, ...RACKS.regie.mods].find(m => m.id === id);
  const cable = P?.points[pt], on = today.get(key);
  let lab = '';
  if (id === 'G1' || id === 'G2') {
    const col = +pt.slice(1), top = flat(LABELS[id + 'top']), bot = flat(LABELS[id + 'bot']);
    lab = `Colonne ${col} · ${pt[0] === 'A' ? 'haut' : 'bas'} : <b>${esc((pt[0] === 'A' ? top : bot)[col - 1] || '—')}</b><br>
      En face dans la même colonne : ${esc((pt[0] === 'A' ? bot : top)[col - 1] || '—')}
      ${id === 'G1' ? `<br>Bouchon : ${ETAT.G1plugs.has(col) ? 'oui (le haut et le bas de la colonne sont reliés)' : '<b>non</b> (colonne ouverte)'}` : ''}`;
  } else {
    const i = +(pt.replace(/^[A-Z]/, '')), l = flat(LABELS[id] || []);
    const g = (LABELS[id] || []).reduce((acc, [gn, ls]) => { if (acc.k <= i && i < acc.k + ls.length) acc.g = gn; acc.k += ls.length; return acc; }, { k: 1, g: '' }).g;
    lab = `Port ${i} · étiquette : <b>${esc([g, l[i - 1]].filter(Boolean).join(' ') || '—')}</b>
      ${(ETAT.ports[id] || []).includes(i) ? '<br>Un cordon y était branché le 24/11.' : ''}`;
  }
  return `<h2>${esc(mod?.nom || id)} · ${esc(pt)}</h2>
    <p>${lab}</p>
    ${cable ? `<p>Câble n° <b>${cable}</b>${labelCable(cable) ? ' · ' + esc(labelCable(cable)) : ''}</p>` : '<p class="hint">Aucun câble fixe derrière ce point d\'après le synoptique.</p>'}
    ${on ? `<p class="w">Aujourd'hui : ${esc(on)}</p>` : ''}`;
}
