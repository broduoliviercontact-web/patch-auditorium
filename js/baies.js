// Onglet « Baies » : les racks du nodal et de la régie, et chaque patch dessiné point par point,
// avec les cordons du patch en cours. Sources : synoptique (indice 0), photo de la baie nodal
// (ordre des modules), tableau « Régies Auditorium » (positions en U de la baie régie).
import { BOITIERS, RIO_PLATEAU } from './data.js';
import { rackFace, RACKS } from './racks.js';

const range = (a, n) => Array.from({ length: n }, (_, i) => a + i);
const pad = i => String(i).padStart(2, '0');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- étiquettes des câbles
const LABEL = {};
for (const [bav, b] of Object.entries(BOITIERS)) {
  (b.aud || []).forEach((c, i) => (LABEL[c] = `${bav} AUD-${pad(i + (b.audStart || 1))}`));
  (b.eth || []).forEach((c, i) => (LABEL[c] = `${bav} ETH-${pad(i + 1)}`));
}
range(6001, 12).forEach(c => (LABEL[c] = 'Liaison nodal ↔ régie'));
range(6049, 12).forEach(c => (LABEL[c] = 'Liaison nodal ↔ régie'));
LABEL[6073] = 'Biamp MA120 entrée 1 (RG INPUT 1)';
Object.assign(LABEL, { 6105: 'Tascam sortie L', 6106: 'Tascam sortie R', 6125: 'Micro plafond AT897 avant-scène',
  6126: 'Micro plafond AT897 arrière salle', 6127: 'DM7 sortie 14', 6144: 'Tascam sortie AES', 6169: 'Tascam entrée L',
  6170: 'Tascam entrée R', 6175: 'Émetteur HF Rondson (entrée)', 6192: 'Tascam entrée AES' });
range(6117, 8).forEach((c, i) => (LABEL[c] = `Rio régie sortie ${i + 1}`));
range(6149, 16).forEach((c, i) => (LABEL[c] = `Rio régie entrée ${i + 1}`));
range(6171, 4).forEach((c, i) => (LABEL[c] = `DM7 entrée locale ${13 + i}`));
range(6145, 4).forEach((c, i) => (LABEL[c] = `RedNet D16R sortie AES ${2 * i + 1}/${2 * i + 2}`));
range(6193, 4).forEach((c, i) => (LABEL[c] = `RedNet D16R entrée AES ${2 * i + 9}/${2 * i + 10}`));
Object.assign(LABEL, { 6165: 'BAV-02 AUD-03 (sortie)', 6166: 'BAV-02 AUD-04 (sortie)', 6167: 'BAV-03 AUD-03 (sortie)', 6168: 'BAV-03 AUD-04 (sortie)' });
range(4001, 12).forEach(c => (LABEL[c] = 'Liaison RJ45 nodal ↔ régie'));
const ethPairs = { 'BAV-06': 4013, 'BAV-07': 4015, 'BAV-08': 4017, 'BAV-09': 4019, 'BAV-10': 4021, 'BAV-11': 4023,
  'BAV-12': 4025, 'BAV-13': 4027, 'BAV-14': 4029, 'BAV-16': 4035, 'BAV-17': 4037, 'BAV-18': 4039, 'BAV-19': 4041, 'BAV-25': 4077 };
for (const [bav, c] of Object.entries(ethPairs)) { LABEL[c] = `${bav} ETH-01`; LABEL[c + 1] = `${bav} ETH-02`; }
range(4031, 4).forEach((c, i) => (LABEL[c] = `BAV-15 ETH-${pad(i + 1)}`));
range(4145, 8).forEach((c, i) => (LABEL[c] = `BAV-03 Vidéo ETH-${pad(i + 1)}`));
range(4153, 6).forEach((c, i) => (LABEL[c] = `BAV-04 FdsC ETH-${pad(i + 1)}`));
range(4159, 4).forEach((c, i) => (LABEL[c] = `BAV-05 Vidéoprojecteur ETH-${pad(i + 1)}`));
range(4139, 6).forEach((c, i) => (LABEL[c] = `BAV-02 ETH-${pad(i + 1)}`));
range(4169, 10).forEach((c, i) => (LABEL[c] = `BAV-PMS-02 ETH-${pad(i + 1)}`));
range(4501, 8).forEach((c, i) => (LABEL[c] = `Enceinte façade Fohhn DLI (${4501 + i})`));
export const labelCable = c => LABEL[c] || '';

// ---------------------------------------------------------------- patchs
// points : { 'A21': câble }. rows : rangées dessinées de haut en bas.
const g = (rows, n, map) => ({ rows, n, points: map });
const G1pts = {}; range(1, 28).forEach(i => (G1pts['A' + i] = 6000 + i)); range(1, 25).forEach(i => (G1pts['B' + i] = 6048 + i));
const G2pts = {};
[[1, 14, 6101], [17, 11, 6117], [29, 12, 6049], [41, 2, 6141], [44, 5, 6144]].forEach(([a, n, c]) => range(0, n).forEach(k => (G2pts['A' + (a + k)] = c + k)));
[[1, 27, 6149], [29, 12, 6001], [44, 5, 6192]].forEach(([a, n, c]) => range(0, n).forEach(k => (G2pts['B' + (a + k)] = c + k)));
const rj = (letter, first, n) => { const p = {}; range(1, n).forEach(i => (p[letter + i] = first + i - 1)); return p; };

export const PATCHES = {
  G1: { nom: 'Ghielmetti 1 · nodal', type: 'audio', ...g(['A', 'B'], 48, G1pts) },
  G2: { nom: 'Ghielmetti 2 · régie', type: 'audio', ...g(['A', 'B'], 48, G2pts) },
  'N-DANTE': { nom: 'Patch RJ45 Dante · nodal', type: 'rj45', ...g([''], 24, Object.fromEntries(range(1, 8).map(i => ['' + i, 4500 + i]))) },
  'N-A': { nom: 'Patch RJ45 A · nodal', type: 'rj45', ...g(['A'], 24, rj('A', 4001, 24)) },
  'N-B': { nom: 'Patch RJ45 B · nodal', type: 'rj45', ...g(['B'], 24, rj('B', 4025, 18)) },
  'N-C': { nom: 'Patch RJ45 C · nodal', type: 'rj45', ...g(['C'], 24, rj('C', 4049, 24)) },
  'N-D': { nom: 'Patch RJ45 D · nodal', type: 'rj45', ...g(['D'], 24, rj('D', 4073, 22)) },
  'R-A': { nom: 'Patch RJ45 A · régie', type: 'rj45', ...g(['A'], 24, { ...rj('A', 4001, 12), ...Object.fromEntries(range(13, 12).map(i => ['A' + i, 4120 + i])) }) },
  'R-B': { nom: 'Patch RJ45 B · régie', type: 'rj45', ...g(['B'], 24, rj('B', 4145, 18)) },
  'R-C': { nom: 'Patch RJ45 C · régie', type: 'rj45', ...g(['C'], 24, rj('C', 4169, 10)) },
};

// Où arrive un câble RJ45 au nodal : { patch, point }
export function rj45Nodal(cable) {
  for (const id of ['N-A', 'N-B', 'N-C', 'N-D', 'N-DANTE'])
    for (const [pt, c] of Object.entries(PATCHES[id].points)) if (c === cable) return { patch: id, point: pt };
  return null;
}

// ---------------------------------------------------------------- baies
// u : hauteur ; patch : id du patch détaillé ; kind : couleur
export const BAIES = {
  nodal: { nom: 'Nodal · baie son', note: "Ordre d'après la photo ; hauteurs approximatives, panneaux à brosse omis.", modules: [
    { nom: 'Patch RJ45 Dante (façade)', u: 1, patch: 'N-DANTE', kind: 'rj45' },
    { nom: 'Switch Dante P1 (primaire)', u: 1, kind: 'switch' },
    { nom: 'Switch Dante S1 (secondaire)', u: 1, kind: 'switch' },
    { nom: 'Switch Contrôle 1', u: 1, kind: 'switch' },
    { nom: 'Patch RJ45 A', u: 1, patch: 'N-A', kind: 'rj45' },
    { nom: 'Patch RJ45 B', u: 1, patch: 'N-B', kind: 'rj45' },
    { nom: 'Patch RJ45 C', u: 1, patch: 'N-C', kind: 'rj45' },
    { nom: 'Patch RJ45 D', u: 1, patch: 'N-D', kind: 'rj45' },
    { nom: 'Ghielmetti 1 (patch audio)', u: 1, patch: 'G1', kind: 'audio' },
    { nom: 'Limiteur Audiopole SPL-ONE', u: 1, kind: 'device' },
    { nom: 'Ampli-mélangeur Biamp MA120', u: 2, kind: 'device' },
    { nom: 'Matrice Fohhn MA-4.600 n°1', u: 1, kind: 'amp' },
    { nom: 'Matrice Fohhn MA-4.600 n°2', u: 1, kind: 'amp' },
    { nom: 'Matrice Fohhn MA-4.600 n°3', u: 1, kind: 'amp' },
    { nom: 'Ampli Fohhn DI-4.2000 (subs)', u: 2, kind: 'amp' },
    { nom: 'Ampli Fohhn DI-2.2000', u: 2, kind: 'amp' },
  ] },
  regie: { nom: 'Régie spectacle · baie son / vidéo', note: 'Positions en U du tableau « Régies Auditorium ».', top: 47, modules: [
    { nom: 'Éclairage', at: 47, u: 1, kind: 'other' },
    { nom: 'Patch FO SM', at: 45, u: 1, kind: 'other' },
    { nom: 'Patch FO MM', at: 44, u: 1, kind: 'other' },
    { nom: 'Patch FO MM', at: 43, u: 1, kind: 'other' },
    { nom: 'Récepteur HF Shure ULXD4Q', at: 41, u: 1, kind: 'device' },
    { nom: 'SmartView', at: 39, u: 3, kind: 'other' },
    { nom: 'Switch Dante P2 (primaire)', at: 35, u: 1, kind: 'switch' },
    { nom: 'Switch Dante S2 (secondaire)', at: 34, u: 1, kind: 'switch' },
    { nom: 'Switch Contrôle 2', at: 33, u: 1, kind: 'switch' },
    { nom: 'Patch RJ45 A', at: 32, u: 1, patch: 'R-A', kind: 'rj45' },
    { nom: 'Patch RJ45 B', at: 31, u: 1, patch: 'R-B', kind: 'rj45' },
    { nom: 'Patch RJ45 C', at: 30, u: 1, patch: 'R-C', kind: 'rj45' },
    { nom: 'Patch vidéo BNC 12G A (matrice nodal)', at: 28, u: 1, kind: 'other' },
    { nom: 'Patch vidéo BNC 12G B (boîtiers)', at: 27, u: 1, kind: 'other' },
    { nom: 'Ghielmetti 2 (patch audio)', at: 25, u: 1, patch: 'G2', kind: 'audio' },
    { nom: 'Focusrite RedNet D16R (AES ↔ Dante)', at: 23, u: 1, kind: 'device' },
    { nom: 'Enregistreur Tascam SS-R250N', at: 22, u: 1, kind: 'device' },
    { nom: 'Émetteur HF Rondson EJ-770T', at: 20, u: 1, kind: 'device' },
    { nom: 'Rio1608-D3 régie', at: 18, u: 3, kind: 'device' },
    { nom: 'Tiroir 3U', at: 14, u: 3, kind: 'other' },
  ] },
};

const KCOL = { rj45: '#3b4a5e', switch: '#2f4a3c', audio: '#5a4a2a', device: '#2c3a55', amp: '#333', other: '#2a2d33' };
const CORD = ['#f0a53a', '#5aa9ff', '#4cc38a', '#ff7b72', '#c792ea', '#ffcb6b', '#82aaff', '#f78c6c', '#89ddff', '#c3e88d'];

// ---------------------------------------------------------------- cordons du patch en cours
export function cordonsParPatch(res, names) {
  const out = {}; const add = (id, c) => (out[id] ||= []).push(c);
  res.cordons.nodal.forEach(c => add('G1', { a: c.de, b: c.vers, n: c.n, txt: `${c.n} · ${c.source}` }));
  res.cordons.regie.forEach(c => add('G2', { a: c.de, b: c.vers, n: c.n, txt: `${c.n} · ${c.source}` }));
  // Rio du plateau : cordons fixes D1..D4 → P1 / S1
  const rios = new Set(res.inputs.filter(r => r.route === 'rio' && r.rioCh).map(r => r.rio));
  res.outputs.forEach(o => o.steps.some(s => /Rio-Rack|Rio rack/i.test(s.txt)) && rios.add(1));
  for (const [r, R] of Object.entries(RIO_PLATEAU)) for (const x of [R.prim, R.sec])
    add('N-D', { a: x.patch, ext: `switch ${x.switch}`, fixe: true, actif: rios.has(+r), txt: `${names['rio' + r]} → ${x.switch}${R.aPoser ? ' (à poser)' : ' (déjà posé)'}` });
  res.net.forEach(n => { if (n.nodal) add(n.nodal.patch, { a: n.nodal.point, ext: 'Switch Contrôle 1', txt: n.nom }); });
  return out;
}

// ---------------------------------------------------------------- dessin
function rackSvg(baie, used) {
  const W = 300, UH = 20, mods = baie.modules;
  let y = 10, items = [];
  if (baie.top) {
    for (const m of mods) items.push({ m, y: 10 + (baie.top - m.at) * UH });
  } else for (const m of mods) { items.push({ m, y }); y += m.u * UH; }
  const H = Math.max(...items.map(i => i.y + i.m.u * UH)) + 10;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="rack" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="4" width="${W - 36}" height="${H - 8}" rx="4" fill="#0f1115" stroke="#333a46"/>`;
  for (const { m, y } of items) {
    const h = m.u * UH - 2, n = m.patch ? (used[m.patch] || []).filter(c => !c.fixe || c.actif).length : 0;
    s += `<g ${m.patch ? `data-goto="${m.patch}" style="cursor:pointer"` : ''}>
      <rect x="26" y="${y + 1}" width="${W - 52}" height="${h}" rx="2" fill="${KCOL[m.kind]}" stroke="${n ? '#f0a53a' : '#454c59'}" stroke-width="${n ? 2 : 1}"/>
      ${m.at ? `<text x="12" y="${y + 14}" fill="#6b7383" font-size="9" text-anchor="middle">${m.at}</text>` : ''}
      <text x="34" y="${y + h / 2 + 5}" fill="#e6e8ec" font-size="11.5">${esc(m.nom)}</text>
      ${n ? `<text x="${W - 34}" y="${y + h / 2 + 5}" fill="#f0a53a" font-size="11" font-weight="700" text-anchor="end">${n} cordon${n > 1 ? 's' : ''} ›</text>` : m.patch ? `<text x="${W - 34}" y="${y + h / 2 + 5}" fill="#6b7383" font-size="11" text-anchor="end">›</text>` : ''}
    </g>`;
  }
  return s + `</svg>`;
}

export function patchSvg(id, cords) {
  const P = PATCHES[id], step = P.type === 'audio' ? 24 : 40, x0 = 40, rowH = 46, top = 34;
  const W = x0 + P.n * step + 20;
  const pos = pt => {
    const r = P.rows.length > 1 ? P.rows.indexOf(pt[0]) : 0, num = +(P.rows[0] === '' ? pt : pt.slice(1));
    return [x0 + (num - 1) * step + step / 2, top + r * rowH + 12];
  };
  const active = cords.filter(c => !c.fixe || c.actif);
  const bottom = top + (P.rows.length - 1) * rowH + 12;
  let ext = 0; const extY = new Map();
  active.forEach(c => { if (!c.b) extY.set(c, bottom + 34 + 16 * ext++); });
  const lows = active.map(c => c.b ? bottom + 40 + Math.abs(pos(c.a)[0] - pos(c.b)[0]) * 0.12 : extY.get(c) + 6);
  const H = active.length ? Math.max(...lows) + 18 : top + P.rows.length * rowH - 4;
  const usedPts = new Map(); cords.forEach((c, i) => { usedPts.set(c.a, i); if (c.b) usedPts.set(c.b, i); });
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,sans-serif">
    <rect x="${x0 - 8}" y="${top - 18}" width="${P.n * step + 16}" height="${P.rows.length * rowH + 8}" rx="4" fill="#0f1115" stroke="#333a46"/>`;
  P.rows.forEach((r, ri) => { if (r) s += `<text x="${x0 - 14}" y="${top + ri * rowH + 16}" fill="#9aa3b2" font-size="13" font-weight="700" text-anchor="end">${r}</text>`; });
  P.rows.forEach((r, ri) => range(1, P.n).forEach(i => {
    const pt = r + i, cable = P.points[pt], [x, y] = pos(pt), ci = usedPts.get(pt), c = ci != null ? cords[ci] : null;
    const col = c && (!c.fixe || c.actif) ? CORD[ci % CORD.length] : null;
    const tip = `${id.startsWith('G') ? '' : ''}${pt}${cable ? ' · câble ' + cable : ' · libre'}${labelCable(cable) ? ' · ' + labelCable(cable) : ''}${c ? ' · ' + c.txt : ''}`;
    s += `<g><title>${esc(tip)}</title>`;
    if (P.type === 'audio') s += `<circle cx="${x}" cy="${y}" r="7" fill="${col || (cable ? '#2a2f3a' : '#15181d')}" stroke="${cable ? '#6b7383' : '#2a2f3a'}"/>`;
    else s += `<rect x="${x - 12}" y="${y - 9}" width="24" height="18" rx="2" fill="${col || (cable ? '#2a2f3a' : '#15181d')}" stroke="${cable ? '#6b7383' : '#2a2f3a'}"/>`;
    s += `<text x="${x}" y="${y - 12}" fill="${col || '#6b7383'}" font-size="9" text-anchor="middle" ${col ? 'font-weight="700"' : ''}>${i}</text></g>`;
  }));
  cords.forEach((c, i) => {
    if (c.fixe && !c.actif) return;
    const col = CORD[i % CORD.length], [x1, y1] = pos(c.a);
    if (c.b) {
      const [x2, y2] = pos(c.b), sg = bottom + 40 + Math.abs(x1 - x2) * 0.12;
      s += `<path d="M${x1} ${y1} C${x1} ${sg} ${x2} ${sg} ${x2} ${y2}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" opacity=".9"/>`;
      s += `<text x="${(x1 + x2) / 2}" y="${sg - 6}" fill="${col}" font-size="11" font-weight="700" text-anchor="middle">${esc(c.n ?? '')}</text>`;
    } else {
      const ly = extY.get(c);
      s += `<path d="M${x1} ${y1} L${x1} ${ly - 6} Q${x1} ${ly} ${x1 + 8} ${ly}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
      s += `<text x="${x1 + 12}" y="${ly + 4}" fill="${col}" font-size="11" font-weight="600">→ ${esc(c.ext)}</text>`;
    }
  });
  return s + `</svg>`;
}

export function todayMap(res, names) {
  const used = cordonsParPatch(res, names), m = new Map();
  for (const [id, cords] of Object.entries(used)) for (const c of cords) {
    if (c.fixe && !c.actif) continue;
    m.set(`${id}:${c.a}`, c.txt + (c.b ? ` (cordon ${c.a} → ${c.b})` : ` (→ ${c.ext})`));
    if (c.b) m.set(`${id}:${c.b}`, c.txt + ` (cordon ${c.a} → ${c.b})`);
  }
  return m;
}

export function renderBaies(el, res, names, which, zoom = 1) {
  const used = cordonsParPatch(res, names), baie = BAIES[which], today = todayMap(res, names);
  const patchIds = baie.modules.filter(m => m.patch).map(m => m.patch);
  const actifs = id => (used[id] || []).filter(c => !c.fixe || c.actif).length;
  el.innerHTML = `
    <div class="bar"><span class="seg">${Object.entries(BAIES).map(([k, b]) => `<button data-baie="${k}" class="${k === which ? 'on' : ''}" data-v="bav">${k === 'nodal' ? 'Nodal' : 'Régie'}</button>`).join('')}</span>
      <span class="seg"><button data-zoom-r="-1" title="Dézoomer">−</button><button data-zoom-r="0" title="Taille normale">${Math.round(zoom * 100)} %</button><button data-zoom-r="1" title="Zoomer">+</button></span>
      <span class="hint">${esc(RACKS[which].source)} Touche un port ou une colonne pour lire son étiquette et son câble ; les points à brancher aujourd'hui sont entourés en orange.</span></div>
    <h3 style="margin:4px 0 8px">${esc(RACKS[which].nom)}</h3>
    <div class="rackwrap"><div style="width:${Math.round(1000 * zoom)}px;max-width:${zoom <= 1 ? '100%' : 'none'}">${rackFace(which, today)}</div></div>
    <h3 style="margin:18px 0 8px">Patchs en détail</h3>
    <div class="patchcol">${[...patchIds].sort((a, b) => actifs(b) - actifs(a)).map(id => {
        const cords = used[id] || [], act = cords.filter(c => !c.fixe || c.actif);
        if (!act.length) return `<details class="patchcard" id="patch-${id}"><summary><b>${esc(PATCHES[id].nom)}</b> <span class="hint">· rien à poser, clic pour voir le patch</span></summary><div class="scroll">${patchSvg(id, cords)}</div></details>`;
        return `<div class="patchcard" id="patch-${id}"><h3>${esc(PATCHES[id].nom)}${act.length ? ` <span class="chip">${act.length} cordon${act.length > 1 ? 's' : ''}</span>` : ''}</h3>
          <div class="scroll">${patchSvg(id, cords)}</div>
          ${act.length ? `<table class="cordlist">${act.map(c => { const i = cords.indexOf(c); return `<tr><td><span class="dot" style="background:${CORD[i % CORD.length]}"></span></td><td><b>${esc(c.a)}</b> → <b>${esc(c.b || c.ext)}</b></td><td>${esc(c.txt)}</td><td class="hint">câble ${PATCHES[id].points[c.a] ?? '?'}${labelCable(PATCHES[id].points[c.a]) ? ' · ' + esc(labelCable(PATCHES[id].points[c.a])) : ''}</td></tr>`; }).join('')}</table>` : ''}
        </div>`;
      }).join('')}</div>`;
}
