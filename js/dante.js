// Onglet « Dante » : un Dante Controller simulé. Grille émetteurs (en haut) × récepteurs (à gauche),
// remplie avec la diffusion système et le patch du jour ; mode entraînement pour cocher / décocher.
import { DEVICES, RX_LABELS, ZONES, SYS_RX, DM7_RX_FIXE, dm7OutLabel } from './diffusion.js';
import { NOMS_LIBELLES } from './data.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SRC = { sys: { nom: 'Diffusion fixe (installateur)', col: '#5aa9ff' }, patch: { nom: 'Patch du jour', col: '#f0a53a' }, train: { nom: 'Entraînement', col: '#c792ea' } };
export const cellKey = (tx, txCh, rx, rxCh) => `${tx}:${txCh}>${rx}:${rxCh}`;

// ---------------------------------------------------------------- abonnements
export function subscriptions(res, names, train = { add: [], off: [] }, show = { sys: true, patch: true }) {
  const byName = Object.fromEntries(Object.entries(names).map(([k, v]) => [v, k]));
  const list = [], seen = new Set();
  const push = s => { const k = cellKey(s.tx, s.txCh, s.rx, s.rxCh); if (seen.has(k) || train.off.includes(k)) return; seen.add(k); list.push({ ...s, key: k }); };
  if (show.sys) {
    for (const z of ZONES) for (const [rx, rxCh] of z.rx) { const zz = SYS_RX[`${rx}:${rxCh}`]; push({ tx: 'dm7', txCh: zz.out, rx, rxCh, src: 'sys', zone: zz }); }
    for (const f of DM7_RX_FIXE) push({ tx: f.tx, txCh: f.txCh, rx: 'dm7', rxCh: f.rx, src: 'sys', fixeHF: true });
  }
  if (show.patch) for (const d of res.dante) {
    const tx = byName[d.txDev], rx = byName[d.rxDev]; if (!tx || !rx) continue;
    push({ tx, txCh: d.txCh, rx, rxCh: d.rxCh, src: d.sys ? 'sys' : 'patch', label: d.label,
      zone: d.sys ? SYS_RX[`${rx}:${d.rxCh}`] : null });
  }
  for (const k of train.add) {
    const m = k.match(/^(\w+):(\d+)>(\w+):(\d+)$/); if (m) push({ tx: m[1], txCh: +m[2], rx: m[3], rxCh: +m[4], src: 'train' });
  }
  // conflits : un canal de réception n'écoute qu'un seul émetteur
  const perRx = {};
  list.forEach(s => (perRx[`${s.rx}:${s.rxCh}`] ||= []).push(s));
  list.forEach(s => (s.conflict = perRx[`${s.rx}:${s.rxCh}`].length > 1));
  return list;
}

// ---------------------------------------------------------------- libellés des canaux
export function txLabel(dev, ch, res) {
  if (dev === 'dm7') return dm7OutLabel(ch) || res.outputs.find(o => o.dm7Out === ch)?.nom || '';
  if (dev === 'rio1' || dev === 'rio2') return res.inputs.find(r => r.route === 'rio' && 'rio' + r.rio === dev && r.rioCh === ch)?.source || '';
  if (dev === 'rioRegie') return res.inputs.find(r => r.regieIn?.ch === ch)?.source || '';
  if (dev === 'ulxd') return res.inputs.find(r => r.hfCh === ch)?.source || `HF ${ch}`;
  return '';
}
export function rxLabel(dev, ch, res) {
  if (dev === 'dm7') { const r = res.inputs.find(x => x.dm7In === ch); return r ? r.source : ch <= 4 ? `HF ${ch}` : ''; }
  if (RX_LABELS[dev]) return RX_LABELS[dev][ch - 1] || '';
  return '';
}

// ---------------------------------------------------------------- explication d'une case
export function explain(cell, subs, res, names) {
  const [tx, txCh, rx, rxCh] = cell;
  const N = names, here = subs.filter(s => s.tx === tx && s.txCh === txCh && s.rx === rx && s.rxCh === rxCh);
  const others = subs.filter(s => s.rx === rx && s.rxCh === rxCh && !(s.tx === tx && s.txCh === txCh));
  const tl = txLabel(tx, txCh, res), rl = rxLabel(rx, rxCh, res);
  const li = (lieu, txt) => `<li><span class="lieu ${lieu}">${esc(lieu)}</span>${esc(txt)}</li>`;
  let h = `<h2>${esc(N[rx])} ${rxCh} ← ${esc(N[tx])} ${txCh}</h2>
    <p class="hint">Récepteur : <b>${esc(NOMS_LIBELLES[rx])}</b>, canal ${rxCh}${rl ? ' · ' + esc(rl) : ''}<br>Émetteur : <b>${esc(NOMS_LIBELLES[tx])}</b>, canal ${txCh}${tl ? ' · ' + esc(tl) : ''}</p>`;
  if (!here.length) {
    h += `<p>Case vide : ${esc(N[rx])} canal ${rxCh} n'écoute pas ${esc(N[tx])} canal ${txCh}.</p>`;
    if (others.length) h += `<p class="w">Ce canal de réception écoute déjà ${esc(N[others[0].tx])} canal ${others[0].txCh}. Cocher ici le remplacerait : un récepteur n'écoute qu'un seul émetteur.</p>`;
    if (tx !== 'dm7' && ['hp', 'ampli'].includes(DEVICES.find(d => d.key === rx)?.role))
      h += `<p class="w">Un micro envoyé directement dans un ampli ou une enceinte, sans passer par la console : ni EQ, ni fader, ni coupure. À éviter.</p>`;
    return h;
  }
  for (const s of here) {
    h += `<p><span class="chip" style="border-color:${SRC[s.src].col};color:${SRC[s.src].col}">${SRC[s.src].nom}</span></p>`;
    if (s.fixeHF) {
      h += `<p>Abonnement posé par l'installateur : les 4 canaux du récepteur HF ULXD4Q arrivent sur les entrées Dante 1 à 4 de la DM7. Ils ne passent par aucun câble ni patch.</p>`;
    } else if (s.zone) {
      const z = s.zone, amp = DEVICES.find(d => d.key === rx);
      h += `<p>${esc(z.role)}</p><ol class="steps">
        ${li('DM7', z.bus.startsWith('ST') ? `Ton mix principal sort sur le Stereo (${z.bus}).` : `Prépare le bus : ${z.bus}${z.retour ? " (le mix de retour de l'artiste)" : ''}.`)}
        ${li('DM7', `OUTPUT PATCH : ${z.bus} → Dante Out ${z.out}.`)}
        ${li('Dante', `Dante Controller : coche ${N[rx]} canal ${rxCh} (récepteur, à gauche) × ${N.dm7} canal ${z.out} (émetteur, en haut).`)}
        ${amp.role === 'hp'
          ? li('Plateau', `${NOMS_LIBELLES[rx]} : l'enceinte s'amplifie elle-même et reçoit le Dante directement (câble réseau, primaire et secondaire).`)
          : li('Nodal', `${NOMS_LIBELLES[rx]}, voie ${rxCh} → ${RX_LABELS[rx]?.[rxCh - 1] || ''}.`)}
        ${li('Plateau', `Enceinte : ${z.hp}.`)}
      </ol>`;
      if (z.retour) h += `<p class="hint">Pour brancher ce retour, ajoute-le dans l'onglet Sorties sur la bonne prise HP : le site reprendra ce bus et ce Dante Out.</p>`;
    } else if (s.src === 'patch') {
      const r = rx === 'dm7' ? res.inputs.find(x => x.dm7In === rxCh) : res.outputs.find(o => o.dm7Out === txCh);
      if (r) h += `<ol class="steps">${r.steps.map(st => li(st.lieu, st.txt)).join('')}</ol>`;
    } else {
      h += `<p>Abonnement ajouté en mode entraînement : ${esc(N[rx])} canal ${rxCh} écoute ${esc(N[tx])} canal ${txCh}. Dans le vrai Dante Controller, c'est exactement le clic sur cette case.</p>`;
    }
    if (s.conflict) h += `<p class="w err">Conflit : ce canal de réception est aussi abonné à ${others.map(o => `${esc(N[o.tx])} ${o.txCh}`).join(', ')}. Dans Dante, un récepteur n'écoute qu'un seul émetteur : seule la dernière case cochée resterait.</p>`;
  }
  return h;
}

// ---------------------------------------------------------------- grille
export function renderDante(el, res, names, ui, train) {
  const subs = subscriptions(res, names, train, ui.show);
  const txDevs = DEVICES.filter(d => d.tx), rxDevs = DEVICES.filter(d => d.rx);
  const devHas = (k, side) => subs.some(s => s[side] === k);
  if (!ui.init) { ui.init = true; DEVICES.forEach(d => { if (devHas(d.key, 'tx')) ui.expTx.add(d.key); if (devHas(d.key, 'rx')) ui.expRx.add(d.key); }); }
  const chans = (d, side) => {
    const n = side === 'tx' ? d.tx : d.rx;
    const all = Array.from({ length: n }, (_, i) => i + 1);
    if (!ui.usedOnly || ui.train) return all;
    const used = new Set(subs.filter(s => s[side] === d.key).map(s => s[side + 'Ch']));
    return all.filter(c => used.has(c));
  };
  const cols = []; // { dev, ch|null }
  txDevs.forEach(d => { if (ui.expTx.has(d.key)) { const c = chans(d, 'tx'); (c.length ? c : [null]).forEach(ch => cols.push({ dev: d.key, ch })); } else cols.push({ dev: d.key, ch: null }); });
  const at = (tx, txCh, rx, rxCh) => subs.filter(s => s.tx === tx && s.rx === rx && (txCh == null || s.txCh === txCh) && (rxCh == null || s.rxCh === rxCh));

  const cell = (c, rx, rxCh) => {
    const ss = at(c.dev, c.ch, rx, rxCh);
    const exp = c.ch != null && rxCh != null;
    const focus = ui.focus && ss.some(s => s.zone && (s.zone.id === ui.focus || (ui.focus === 'retours' && s.zone.retour)));
    if (!ss.length) return `<td class="c ${exp ? 'e' : 'agg'}" ${exp ? `data-cell="${c.dev}|${c.ch}|${rx}|${rxCh}"` : ''}></td>`;
    const s = ss[0], col = SRC[s.src].col, bad = ss.some(x => x.conflict);
    return `<td class="c on ${focus ? 'focus' : ''}" ${exp ? `data-cell="${c.dev}|${c.ch}|${rx}|${rxCh}"` : ''} title="${esc(ss.map(x => SRC[x.src].nom + (x.label ? ' · ' + x.label : x.zone ? ' · ' + x.zone.nom : '')).join(' / '))}">
      ${exp ? `<span class="tick" style="background:${bad ? '#ff7b72' : col}">${bad ? '!' : '✓'}</span>` : `<span class="agg" style="color:${col}">${ss.length}</span>`}</td>`;
  };

  // en-têtes
  let head1 = '<tr><th class="corner" rowspan="2"><div>Récepteurs ↓</div><div>Émetteurs →</div></th>', head2 = '<tr>';
  for (const d of txDevs) {
    const span = cols.filter(c => c.dev === d.key).length, open = ui.expTx.has(d.key);
    head1 += `<th colspan="${span}" class="dev" data-tx="${d.key}" title="${esc(NOMS_LIBELLES[d.key])} · ${esc(d.lieu)}">${open ? '−' : '+'} ${esc(names[d.key])}</th>`;
    cols.filter(c => c.dev === d.key).forEach(c => {
      const l = c.ch ? txLabel(d.key, c.ch, res) : '';
      head2 += `<th class="ch" title="${esc(names[d.key])} canal ${c.ch ?? ''}${l ? ' · ' + esc(l) : ''}"><div>${c.ch ?? '…'}${l ? `<span>${esc(l)}</span>` : ''}</div></th>`;
    });
  }
  let body = '';
  for (const d of rxDevs) {
    const open = ui.expRx.has(d.key);
    body += `<tr class="devrow"><th class="dev" data-rx="${d.key}" title="${esc(NOMS_LIBELLES[d.key])} · ${esc(d.lieu)}">${open ? '−' : '+'} ${esc(names[d.key])} <span class="hint">${esc(d.lieu)}</span></th>${cols.map(c => cell(c, d.key, null)).join('')}</tr>`;
    if (open) for (const ch of chans(d, 'rx')) {
      const l = rxLabel(d.key, ch, res);
      body += `<tr><th class="chr">${ch}${l ? ` <span>${esc(l)}</span>` : ''}</th>${cols.map(c => cell(c, d.key, ch)).join('')}</tr>`;
    }
  }
  const nConf = subs.filter(s => s.conflict).length;
  el.innerHTML = `
    <div class="bar">
      <label class="tog"><input type="checkbox" data-dshow="sys" ${ui.show.sys ? 'checked' : ''}> <span style="color:${SRC.sys.col}">■</span> Diffusion fixe (installateur)</label>
      <label class="tog"><input type="checkbox" data-dshow="patch" ${ui.show.patch ? 'checked' : ''}> <span style="color:${SRC.patch.col}">■</span> Patch du jour</label>
      <label class="tog"><input type="checkbox" data-dopt="usedOnly" ${ui.usedOnly ? 'checked' : ''}> Seulement les canaux utilisés</label>
      <label class="tog"><input type="checkbox" data-dopt="train" ${ui.train ? 'checked' : ''}> <span style="color:${SRC.train.col}">■</span> Mode entraînement</label>
      ${train.add.length || train.off.length ? `<button data-dreset>Annuler l'entraînement</button>` : ''}
      ${nConf ? `<span class="w err">⚠ ${new Set(subs.filter(s => s.conflict).map(s => s.rx + s.rxCh)).size} conflit(s) : un récepteur abonné à deux émetteurs</span>` : ''}
    </div>
    <p class="hint">Comme dans Dante Controller : les émetteurs en haut, les récepteurs à gauche, une coche = « ce récepteur écoute cet émetteur ». + / − ouvre ou ferme un appareil. Clique sur une case pour voir toute la chaîne${ui.train ? ' ; en mode entraînement, le clic coche ou décoche' : ''}.</p>
    <div class="zones">${ZONES.map(z =>
      `<button class="zone ${ui.focus === z.id ? 'on' : ''}" data-zone="${z.id}" style="--zc:${z.couleur}"><b>${esc(z.nom)}</b><span>${esc(z.bus)} → Dante Out ${z.out}</span><span class="hint">${esc(z.hp)}</span></button>`).join('')}</div>
    <div class="dgrid"><table class="dc">${head1}</tr>${head2}</tr>${body}</table></div>`;
  return subs;
}
