import { BOITIERS, MICROS, NOMS_DEFAUT, NOMS_LIBELLES } from './data.js';
import { compute, prises, phantomDe, micro } from './route.js';
import { LEARN_HTML } from './learn.js';
import { renderBaies } from './baies.js';
import { renderDante, explain, cellKey } from './dante.js';
import { ZONES } from './diffusion.js';
const dui = { expTx: new Set(), expRx: new Set(), show: { sys: true, patch: true }, usedOnly: true, train: false, focus: null };
let danteCell = null, lastSubs = [];
let baie = 'nodal';

const KEY = 'patch-auditorium-v1';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);

const vide = () => ({ train: { add: [], off: [] }, show: { artist: '', date: new Date().toISOString().slice(0, 10) }, inputs: [], outputs: [], net: [], settings: { names: {}, dm7OutStart: 9 } });
let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || vide(); } catch { state = vide(); }
state.settings ||= { names: {}, dm7OutStart: 9 };
state.train ||= { add: [], off: [] };
let res = compute(state);
let openId = null;          // ligne affichée dans le panneau
const openSetup = new Set(); // lignes dont le « setup » est déplié

function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
// Rendu différé : on ne reconstruit pas la liste au milieu d'un événement (blur, clic),
// et on remet le curseur dans le champ qui l'avait (tabulation entre les champs).
let pending = false;
function update() {
  res = compute(state); save();
  if (pending) return; pending = true;
  setTimeout(() => {
    pending = false;
    const a = document.activeElement, row = a?.closest?.('.row'), f = a?.dataset?.f;
    const key = row && f ? `.row[${['i', 'o', 'x'].map(k => row.dataset[k] != null ? `data-${k}="${row.dataset[k]}"` : '').join('')}] [data-f="${f}"]` : null;
    renderAll();
    if (key) document.querySelector(key)?.focus();
  });
}
const names = () => ({ ...NOMS_DEFAUT, ...state.settings.names });

// ---------------------------------------------------------------- en-tête
function renderUsage() {
  const u = res.usage, N = names();
  const chip = (label, v, max) => `<span class="chip ${max && v >= max ? 'full' : ''}">${label} <b>${v}${max ? '/' + max : ''}</b></span>`;
  $('#usage').innerHTML = [
    chip(N.rio1, u.rio1, 16), u.rio2 ? chip(N.rio2, u.rio2, 16) : '',
    chip('Liaisons nodal→régie', u.liaisons, 24), chip(N.rioRegie, u.rioRegie, 16),
    u.dm7Local ? chip('DM7 local', u.dm7Local, 4) : '', chip('HF', u.hf, 4),
  ].join('');
}

// ---------------------------------------------------------------- entrées
const AUD = prises('AUD'), HP = prises('HP'), ETH = prises('ETH');

function priseOptions(list, current, usedIds) {
  const groups = {};
  for (const p of list) (groups[p.bav] ||= []).push(p);
  let h = `<option value="">Choisir une prise…</option>`;
  for (const [bav, ps] of Object.entries(groups)) {
    const b = BOITIERS[bav];
    h += `<optgroup label="${bav} · ${esc(b.loc)}${b.verifier ? ' (à vérifier)' : ''}">`;
    for (const p of ps) {
      const used = usedIds.has(p.id) && p.id !== current;
      h += `<option value="${p.id}" ${p.id === current ? 'selected' : ''} ${used ? 'disabled' : ''}>${bav} ${p.nom} · câble ${p.cable}${used ? ' (prise)' : ''}</option>`;
    }
    h += `</optgroup>`;
  }
  return h;
}

function micOptions(cur) {
  return `<option value="">Micro…</option>` + MICROS.map(m =>
    `<option value="${m.id}" ${m.id === cur ? 'selected' : ''}>${esc(m.nom)}${m.qte ? ' ×' + m.qte : ''}</option>`).join('');
}

function summaryIn(r) {
  const N = names(), k = s => `<span class="k">${esc(s)}</span>`, a = `<span class="arr">→</span>`;
  if (!r.ok && !r.dante.length && !r.dm7Local) return '';
  const end = r.dm7Local ? k(`DM7 local ${r.dm7Local.ch}`) + a + k(`canal ${r.n}`) : k(`${N.dm7} canal ${r.n}`);
  if (r.route === 'hf') return [k(`${N.ulxd} canal ${r.hfCh}`), a, k('Dante'), a, end].join('');
  if (r.route === 'rio') return [k(`${N['rio' + r.rio]} entrée ${r.rioCh}`), a, k('Dante'), a, end].join('');
  const p = r.prise, parts = [k(`${p.bav} ${p.nom}`)];
  if (r.liaison) parts.push(a, k(`nodal ${r.g1}→${r.liaison.g1}`), a, k(`liaison ${r.liaison.cable}`));
  if (r.regieIn) parts.push(a, k(`régie ${r.liaison ? r.liaison.g2 : ''}→${r.regieIn.g2}`), a, k(`${N.rioRegie} ${r.regieIn.ch}`), a, k('Dante'), a, end);
  else if (r.dm7Local) parts.push(a, end);
  return parts.join('');
}

function renderInputs() {
  const usedAud = new Set(state.inputs.filter(e => e.route === 'bav' && e.prise).map(e => e.prise));
  const N = names();
  $('#inputs').innerHTML = state.inputs.length ? state.inputs.map((e, i) => {
    const r = res.inputs[i], m = micro(e.mic), hfLock = m?.phantom === 'hf';
    const route = hfLock ? 'hf' : (e.route || 'rio');
    const ph = phantomDe(e);
    let where = '';
    if (route === 'rio') where = `<select data-f="rio">${[1, 2].map(x => `<option value="${x}" ${(+e.rio || 1) === x ? 'selected' : ''}>${esc(N['rio' + x])}</option>`).join('')}</select>
      <select data-f="rioCh"><option value="">entrée auto${r?.rioCh ? ' (' + r.rioCh + ')' : ''}</option>${Array.from({ length: 16 }, (_, j) => `<option ${+e.rioCh === j + 1 ? 'selected' : ''}>${j + 1}</option>`).join('')}</select>`;
    if (route === 'bav') where = `<select data-f="prise" class="src">${priseOptions(AUD, e.prise, usedAud)}</select>`;
    if (route === 'hf') where = `<select data-f="hfCh"><option value="">canal auto${r?.hfCh ? ' (' + r.hfCh + ')' : ''}</option>${[1, 2, 3, 4].map(j => `<option ${+e.hfCh === j ? 'selected' : ''}>${j}</option>`).join('')}</select>`;
    const phCls = ph.on ? 'on' : '', phAuto = e.phantom == null ? 'auto' : '';
    return `<div class="row ${r && !r.ok ? 'bad' : ''}" data-i="${i}">
      <div class="main">
        <input class="n" data-f="n" value="${esc(e.n)}" inputmode="numeric" title="Numéro de ligne = canal de la DM7">
        <input class="src" data-f="source" value="${esc(e.source)}" placeholder="Source (kick, voix…)">
        <span class="seg">${[['rio', 'Rio'], ['bav', 'Boîtier'], ['hf', 'HF']].map(([v, l]) =>
          `<button data-route="${v}" data-v="${v}" class="${route === v ? 'on' : ''}" ${hfLock && v !== 'hf' ? 'disabled' : ''}>${l}</button>`).join('')}</span>
        ${where}
        ${route !== 'hf' ? `<button class="ph ${phCls} ${phAuto}" data-act="ph" title="Fantôme : clic pour forcer oui / non / auto">48 V</button>` : ''}
        <button class="icon" data-act="setup" title="Micro et réglages">⚙</button>
        <button class="icon" data-act="open" title="Voir le chemin complet">Chemin ›</button>
        <button class="icon" data-act="del" title="Supprimer">✕</button>
      </div>
      ${openSetup.has(e.id) ? `<div class="setup">
        <label>Micro <select data-f="mic">${micOptions(e.mic)}</select></label>
        <label>Note <input data-f="note" value="${esc(e.note)}" placeholder="pied, pince…"></label>
        ${m?.type ? `<span class="hint">${esc(m.type)}${m.phantom === true ? ' · fantôme 48 V' : m.phantom === false ? ' · pas de fantôme' : ''}</span>` : ''}
      </div>` : ''}
      <div class="sum">${r ? summaryIn(r) : ''}</div>
      ${r ? r.warnings.map(w => `<div class="w">⚠ ${esc(w)}</div>`).join('') : ''}
    </div>`;
  }).join('') : `<p class="hint">Aucune ligne. Ajoute une ligne ou colle la liste de la fiche technique.</p>`;
  $('#warnings').innerHTML = res.warnings.map(w => `<div class="w err">⚠ ${esc(w)}</div>`).join('');
}

// ---------------------------------------------------------------- sorties
function renderOutputs() {
  const usedHP = new Set(state.outputs.filter(o => (o.route || 'hp') === 'hp' && o.prise).map(o => o.prise));
  const N = names();
  $('#outputs').innerHTML = state.outputs.length ? state.outputs.map((o, i) => {
    const r = res.outputs[i], route = o.route || 'hp';
    const where = route === 'hp'
      ? `<select data-f="prise" class="src">${priseOptions(HP, o.prise, usedHP)}</select>`
      : `<select data-f="rio">${[1, 2].map(x => `<option value="${x}" ${(+o.rio || 1) === x ? 'selected' : ''}>${esc(N['rio' + x])}</option>`).join('')}</select>
         <select data-f="rioOut"><option value="">sortie auto</option>${Array.from({ length: 8 }, (_, j) => `<option ${+o.rioOut === j + 1 ? 'selected' : ''}>${j + 1}</option>`).join('')}</select>`;
    return `<div class="row ${r && !r.ok ? 'bad' : ''}" data-o="${i}">
      <div class="main">
        <input class="src" data-f="nom" value="${esc(o.nom)}" placeholder="Retour chanteur, front fill…">
        <select data-f="type">${[['xt22', 'Retour XT22'], ['xt1', 'Front fill XT1'], ['actif', 'Enceinte active / ligne']].map(([v, l]) => `<option value="${v}" ${o.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        ${o.type === 'xt1' ? `<label class="hint">×<input data-f="qte" type="number" min="1" max="8" value="${esc(o.qte || 1)}" style="width:52px"></label>` : ''}
        <span class="seg">${[['hp', 'Prise HP'], ['rio', 'Rio']].map(([v, l]) => `<button data-route="${v}" data-v="${v === 'rio' ? 'rio' : 'hp'}" class="${route === v ? 'on' : ''}" ${o.type === 'actif' && v === 'hp' ? 'disabled' : ''}>${l}</button>`).join('')}</span>
        ${where}
        <input data-f="mix" value="${esc(o.mix)}" placeholder="Mix DM7 (ex. Mix 1)" style="width:130px">
        <button class="icon" data-act="open">Chemin ›</button>
        <button class="icon" data-act="del">✕</button>
      </div>
      ${r ? `<div class="sum"><span class="k">${esc(N.dm7)} Dante Out ${r.dm7Out}</span></div>` + r.warnings.map(w => `<div class="w">⚠ ${esc(w)}</div>`).join('') : ''}
    </div>`;
  }).join('') : `<p class="hint">Aucune sortie.</p>`;
}

// ---------------------------------------------------------------- réseau
function renderNet() {
  const used = new Set(state.net.filter(x => x.prise).map(x => x.prise));
  $('#net').innerHTML = state.net.length ? state.net.map((x, i) => {
    const r = res.net[i];
    return `<div class="row ${r && !r.ok ? 'bad' : ''}" data-x="${i}">
      <div class="main">
        <input class="src" data-f="nom" value="${esc(x.nom)}" placeholder="RTP MIDI artiste">
        <select data-f="prise" class="src">${priseOptions(ETH, x.prise, used)}</select>
        <button class="icon" data-act="open">Chemin ›</button>
        <button class="icon" data-act="del">✕</button>
      </div>
      ${r ? r.warnings.filter(w => !/confirmer/.test(w)).map(w => `<div class="w">⚠ ${esc(w)}</div>`).join('') : ''}
    </div>`;
  }).join('') : `<p class="hint">Aucune liaison réseau. Le BAV-24 est réservé aux Rio du plateau.</p>`;
}

// ---------------------------------------------------------------- panneau « chemin »
const LBL = { 'BAV-20': [-10, 4, 'end'], 'BAV-27': [-10, 0, 'end'], 'BAV-28': [9, 10, 'start'], 'BAV-26': [9, 4, 'start'] };
function miniPlan(bav) {
  const W = 300, H = 170, k = 14, ox = 12 * k + 10, oy = 90.2;
  const P = ([x, z]) => [ox - z * k + 0, (x + oy) * k + 6];
  let s = `<svg class="plan" viewBox="0 0 ${W + 30} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  const [x1, y1] = P([-90, 11]), [x2, y2] = P([-81.6, -9.5]);
  s += `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" fill="none" stroke="#333a46" rx="4"/>`;
  s += `<text x="${(x1 + x2) / 2}" y="${y1 + 12}" fill="#9aa3b2" font-size="10" text-anchor="middle">LOINTAIN</text>`;
  s += `<text x="${(x1 + x2) / 2}" y="${y2 + 12}" fill="#9aa3b2" font-size="10" text-anchor="middle">FACE · public</text>`;
  s += `<text x="${x1 + 4}" y="${(y1 + y2) / 2}" fill="#9aa3b2" font-size="10">JARDIN</text>`;
  s += `<text x="${x2 - 4}" y="${(y1 + y2) / 2}" fill="#9aa3b2" font-size="10" text-anchor="end">COUR</text>`;
  for (const [id, b] of Object.entries(BOITIERS)) {
    if (b.zone !== 'plateau' || id === 'BAV-06') continue;
    const [x, y] = P(b.pos), on = id === bav;
    s += `<circle cx="${x}" cy="${y}" r="${on ? 7 : 4}" fill="${on ? '#f0a53a' : '#4a5262'}"/>`;
    const [dx, dy, an] = LBL[id] || [9, 4, 'start'];
    s += `<text x="${x + dx}" y="${y + dy}" text-anchor="${an}" fill="${on ? '#f0a53a' : '#9aa3b2'}" font-size="${on ? 11 : 9}" font-weight="${on ? 700 : 400}">${id.replace('BAV-', '')}</text>`;
  }
  return s + `</svg>`;
}

function renderDanteTab() { lastSubs = renderDante(document.getElementById('tab-dante'), res, names(), dui, state.train); }
function renderPanel() {
  if (!openId && danteCell) { $('#panelBody').innerHTML = explain(danteCell, lastSubs, res, names()); $('#panel').hidden = false; return; }
  if (!openId) { $('#panel').hidden = true; return; }
  const all = [...res.inputs.map(r => ({ r, kind: 'in' })), ...res.outputs.map(r => ({ r, kind: 'out' })), ...res.net.map(r => ({ r, kind: 'net' }))];
  const f = all.find(x => x.r.id === openId);
  if (!f) { openId = null; $('#panel').hidden = true; return; }
  const r = f.r, title = f.kind === 'in' ? `${r.n} · ${r.source}` : r.nom;
  const bav = r.steps.find(s => s.bav)?.bav || (f.kind === 'in' && r.route === 'rio' ? 'BAV-24' : null);
  const b = bav && BOITIERS[bav];
  $('#panelBody').innerHTML = `<h2>${esc(title)}</h2>
    ${f.kind === 'in' ? `<div class="hint">${r.phantom.on ? '<b style="color:var(--err)">Fantôme 48 V</b>' : 'Pas de fantôme'}${r.phantom.src === 'devine' ? ' (devinée d\'après le nom)' : ''}</div>` : ''}
    <ol class="steps">${r.steps.map(s => `<li class="${s.fixe ? 'fixe' : ''}"><span class="lieu ${s.lieu}">${esc(s.lieu)}</span>${esc(s.txt)}</li>`).join('')}</ol>
    ${r.warnings.map(w => `<div class="w">⚠ ${esc(w)}</div>`).join('')}
    ${b ? `<h3 style="margin:16px 0 0;font-size:14px">${bav} · ${esc(b.loc)}</h3>${b.zone === 'plateau' ? miniPlan(bav) : ''}
      <div class="thumbs"><img src="boitiers/${b.plaque}" data-zoom alt="Plaque ${bav}"><img src="boitiers/${bav}.png" data-zoom alt="Circuits ${bav}"></div>` : ''}`;
  $('#panel').hidden = false;
}

// ---------------------------------------------------------------- fiches
function table(head, rows) {
  if (!rows.length) return `<p class="empty">Rien à faire.</p>`;
  return `<table><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`;
}
function renderFiches() {
  const N = names();
  const plateau = res.inputs.filter(r => r.ok).map(r => [r.n, r.source,
    r.route === 'hf' ? `HF canal ${r.hfCh}` : r.route === 'rio' ? `${N['rio' + r.rio]} entrée ${r.rioCh}` : `${r.prise.bav} ${r.prise.nom}`,
    micro(state.inputs.find(e => e.id === r.id)?.mic)?.nom || '', r.phantom.on && r.route !== 'hf' ? '48 V' : '']);
  $('#fiches').innerHTML = `<div class="print-head">${esc(state.show.artist || 'Patch')} · ${esc(state.show.date || '')}</div>
    <h3>Plateau : où brancher</h3>${table(['N°', 'Source', 'Prise', 'Micro', 'Fantôme'], plateau)}
    <h3>Nodal : cordons Ghielmetti 1</h3>${table(['N°', 'Source', 'De', 'Vers', ''], res.cordons.nodal.map(c => [c.n, c.source, c.de, c.vers, c.txt]))}
    <h3>Régie : cordons Ghielmetti 2</h3>${table(['N°', 'Source', 'De', 'Vers', ''], res.cordons.regie.map(c => [c.n, c.source, c.de, c.vers, c.txt]))}
    <h3>Abonnements Dante (Dante Controller)</h3>${table(['Récepteur', 'Canal', '←', 'Émetteur', 'Canal', 'Pour'], res.dante.map(d => [d.rxDev, d.rxCh, '←', d.txDev, d.txCh, d.label]))}
    <h3>Diffusion système (fixe)</h3>${table(['Zone', 'Bus DM7', 'Dante Out', 'Récepteurs', 'Enceintes'], ZONES.map(z => [z.nom, `${z.src} → ${z.bus}`, z.out, z.rx.map(([d, c]) => `${N[d]} ${c}`).join(', '), z.hp]))}
    <h3>DM7 : patch</h3>${table(['N°', 'Source', 'Patch'], res.dm7.map(d => [d.n, d.source, d.txt]))}
    <h3>Fantôme 48 V</h3>${table(['N°', 'Source', 'Où l\'activer'], res.phantom.map(p => [p.n, p.source, p.ou]))}
    <h3>Sorties</h3>${table(['Sortie', 'Branchement'], res.outputs.map(o => [o.nom, o.steps.find(s => s.lieu === 'Plateau')?.txt || '']))}
    <h3>Réseau (RTP MIDI)</h3>${table(['Nom', 'Patch RJ45 nodal'], res.cordons.rj45.map(c => [c.source, c.txt]))}`;
}

function renderAll() {
  $('#artist').value = state.show.artist || ''; $('#date').value = state.show.date || '';
  renderUsage(); renderInputs(); renderOutputs(); renderNet(); renderFiches(); renderPanel();
  renderBaies(document.getElementById('tab-baies'), res, names(), baie);
  renderDanteTab();
}

// ---------------------------------------------------------------- événements
function listOf(el) {
  const row = el.closest('.row'); if (!row) return [];
  if (row.dataset.i != null) return [state.inputs, +row.dataset.i];
  if (row.dataset.o != null) return [state.outputs, +row.dataset.o];
  return [state.net, +row.dataset.x];
}
document.addEventListener('change', ev => {
  const f = ev.target.dataset.f; if (!f) return;
  const [list, i] = listOf(ev.target); if (!list) return;
  const item = list[i];
  item[f] = ev.target.value === '' ? null : ev.target.value;
  if (f === 'rio') item.rioCh = item.rioOut = null;
  if (f === 'mic' && micro(item.mic)?.phantom === 'hf') item.route = 'hf';
  if (f === 'mic') item.phantom = null;
  if (f === 'type' && item.type === 'actif') item.route = 'rio';
  update();
});
document.addEventListener('click', ev => {
  const t = ev.target;
  if (t.matches('[data-zoom]')) { $('#imgEl').src = t.src; $('#img').showModal(); return; }
  if (danteClick(t)) return;
  const bb = t.closest('[data-baie]'); if (bb) { baie = bb.dataset.baie; renderBaies(document.getElementById('tab-baies'), res, names(), baie); return; }
  const go = t.closest('[data-goto]'); if (go) { const el = document.getElementById('patch-' + go.dataset.goto); if (el) { if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
  const [list, i] = listOf(t); if (!list) return;
  const item = list[i];
  if (t.dataset.route) { item.route = t.dataset.route; if (item.route === 'hf' && item.mic && micro(item.mic)?.phantom !== 'hf') item.mic = null; update(); return; }
  const act = t.dataset.act;
  if (act === 'ph') { item.phantom = item.phantom == null ? !phantomDe(item).on : item.phantom === true ? false : null; update(); }
  if (act === 'setup') { openSetup.has(item.id) ? openSetup.delete(item.id) : openSetup.add(item.id); renderInputs(); }
  if (act === 'open') { openId = item.id; danteCell = null; renderPanel(); }
  if (act === 'del') { list.splice(i, 1); if (openId === item.id) openId = null; update(); }
});
$('#panelClose').onclick = () => { openId = null; danteCell = null; renderPanel(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { openId = null; danteCell = null; renderPanel(); } });

function danteClick(t) {
  const tx = t.closest('[data-tx]'), rx = t.closest('[data-rx]');
  if (tx) { const k = tx.dataset.tx; dui.expTx.has(k) ? dui.expTx.delete(k) : dui.expTx.add(k); renderDanteTab(); return true; }
  if (rx) { const k = rx.dataset.rx; dui.expRx.has(k) ? dui.expRx.delete(k) : dui.expRx.add(k); renderDanteTab(); return true; }
  const z = t.closest('[data-zone]');
  if (z) {
    dui.focus = dui.focus === z.dataset.zone ? null : z.dataset.zone;
    if (dui.focus) { dui.expTx.add('dm7'); ZONES.filter(x => x.id === dui.focus || (dui.focus === 'retours' && x.retour)).forEach(x => x.rx.forEach(([d]) => dui.expRx.add(d))); }
    renderDanteTab(); return true;
  }
  if (t.closest('[data-dreset]')) { state.train = { add: [], off: [] }; save(); renderDanteTab(); return true; }
  const c = t.closest('[data-cell]');
  if (!c) return false;
  const [txd, txc, rxd, rxc] = c.dataset.cell.split('|');
  const cell = [txd, +txc, rxd, +rxc], k = cellKey(...cell);
  if (dui.train) {
    const T = state.train, ex = lastSubs.find(s => s.key === k);
    if (ex?.src === 'train') T.add = T.add.filter(x => x !== k);
    else if (ex) T.off.push(k);
    else if (T.off.includes(k)) T.off = T.off.filter(x => x !== k);
    else T.add.push(k);
    save(); renderDanteTab();
  }
  danteCell = cell; openId = null; renderPanel();
  return true;
}
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.dshow) { dui.show[t.dataset.dshow] = t.checked; renderDanteTab(); }
  if (t.dataset.dopt) { dui[t.dataset.dopt] = t.checked; renderDanteTab(); }
});

const nextN = () => Math.max(0, ...state.inputs.map(e => +e.n || 0)) + 1;
$('#addIn').onclick = () => { state.inputs.push({ id: uid(), n: nextN(), source: '', route: 'rio' }); update(); document.querySelector('#inputs .row:last-child .src')?.focus(); };
$('#addOut').onclick = () => { state.outputs.push({ id: uid(), nom: '', type: 'xt22', route: 'hp' }); update(); };
$('#addNet').onclick = () => { state.net.push({ id: uid(), nom: 'RTP MIDI' }); update(); };
$('#pasteBtn').onclick = () => { $('#paste').hidden = false; $('#pasteTxt').focus(); };
$('#pasteCancel').onclick = () => { $('#paste').hidden = true; };
$('#pasteOk').onclick = () => {
  for (const line of $('#pasteTxt').value.split(/\r?\n/)) {
    const s = line.trim(); if (!s) continue;
    const m = s.match(/^(\d+)[\s.;,:\t-]+(.*)$/);
    const src = (m ? m[2] : s).split(/[;\t]/)[0].trim();
    state.inputs.push({ id: uid(), n: m ? +m[1] : nextN(), source: src, route: 'rio' });
  }
  $('#pasteTxt').value = ''; $('#paste').hidden = true; update();
};
$('#artist').oninput = e => { state.show.artist = e.target.value; save(); };
$('#date').onchange = e => { state.show.date = e.target.value; save(); renderFiches(); };
$('#bNew').onclick = () => { if (confirmNew()) { state = vide(); openId = null; update(); } };
function confirmNew() { return !state.inputs.length || window.confirm('Effacer le patch en cours ? Pense à l\'exporter avant.'); }
$('#bExport').onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `patch-${(state.show.artist || 'auditorium').replace(/[^\w-]+/g, '_')}-${state.show.date || ''}.json`; a.click();
};
$('#bImport').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try { const s = JSON.parse(await f.text()); state = { ...vide(), ...s }; update(); } catch { alert('Fichier illisible.'); }
  e.target.value = '';
};
$('#print').onclick = () => window.print();
$('#bSettings').onclick = () => {
  const N = names(), labels = NOMS_LIBELLES;
  $('#settingsFields').innerHTML = Object.keys(NOMS_DEFAUT).map(k => `<label>${labels[k]}<input data-name="${k}" value="${esc(N[k])}"></label>`).join('');
  $('#dm7OutStart').value = state.settings.dm7OutStart || 9;
  $('#settings').showModal();
};
$('#settings').addEventListener('close', () => {
  document.querySelectorAll('[data-name]').forEach(i => { const v = i.value.trim(); if (v && v !== NOMS_DEFAUT[i.dataset.name]) state.settings.names[i.dataset.name] = v; else delete state.settings.names[i.dataset.name]; });
  state.settings.dm7OutStart = +$('#dm7OutStart').value || 9; update();
});
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.id === 'tab-' + b.dataset.tab));
});
document.getElementById('tab-learn').innerHTML = LEARN_HTML;
renderAll();
