// Calcul des chemins : à partir du patch saisi, attribue Rio, liaisons nodal-régie,
// entrées de la Rio régie, abonnements Dante et sorties. Fonction pure (testée par npm test).
import {
  BOITIERS, G1, G2, LIAISONS, RIO_REGIE_IN, DM7_LOCAL_IN, RIO_PLATEAU, MATRICES, matriceDe,
  MICROS, devinePhantom, NOMS_DEFAUT,
} from './data.js';
import { rj45Nodal } from './baies.js';
import { SYS_RX, SYS_OUTS } from './diffusion.js';

export const priseId = (bav, kind, i) => `${bav}:${kind}-${String(i + 1).padStart(2, '0')}`;

// Liste des prises d'un type : [{ id, bav, nom, cable, verifier }]
export function prises(kind) {
  const key = { AUD: 'aud', HP: 'hp', ETH: 'eth' }[kind];
  const out = [];
  for (const [bav, b] of Object.entries(BOITIERS)) {
    if (kind === 'ETH' && b.reserveRio) continue;
    const off = kind === 'AUD' ? (b.audStart || 1) - 1 : 0;
    (b[key] || []).forEach((cable, j) => { const i = j + off; out.push({
      id: priseId(bav, kind, i), bav, nom: `${kind}-${String(i + 1).padStart(2, '0')}`, cable,
      loc: b.loc, zone: b.zone, verifier: !!b.verifier,
    }); });
  }
  return out;
}
export const priseParId = (kind, id) => prises(kind).find(p => p.id === id);

export function micro(id) { return MICROS.find(m => m.id === id); }

// Fantôme effective d'une entrée : choix manuel > micro > devinette par le nom
export function phantomDe(e) {
  if (e.phantom === true || e.phantom === false) return { on: e.phantom, src: 'manuel' };
  const m = micro(e.mic);
  if (m && (m.phantom === true || m.phantom === false)) return { on: m.phantom, src: 'micro' };
  const g = devinePhantom(e.source);
  return { on: !!g, src: g === null ? 'inconnu' : 'devine' };
}

export function compute(state) {
  const N = { ...NOMS_DEFAUT, ...(state.settings?.names || {}) };
  const res = { inputs: [], outputs: [], net: [], warnings: [],
    usage: { rio1: 0, rio2: 0, liaisons: 0, rioRegie: 0, dm7Local: 0, hf: 0 },
    cordons: { nodal: [], regie: [], rj45: [] }, dante: [], dm7: [], phantom: [] };

  // ---------- Entrées ----------
  const usedRio = { 1: new Set(), 2: new Set() }, usedHF = new Set(), usedPrise = new Set();
  const usedLiaison = new Set(), usedRegie = new Set(), usedLocal = new Set();
  const inputs = state.inputs || [];

  // 1re passe : réserver les choix explicites
  const conflit = new Set();
  const isHF = e => micro(e.mic)?.phantom === 'hf' || e.route === 'hf';
  for (const e of inputs) {
    if (isHF(e) && e.hfCh) { if (usedHF.has(+e.hfCh)) conflit.add(e); else usedHF.add(+e.hfCh); }
    else if (e.route === 'rio' && e.rioCh) {
      const s = usedRio[+e.rio === 2 ? 2 : 1];
      if (s.has(+e.rioCh)) conflit.add(e); else s.add(+e.rioCh);
    }
  }
  const firstFree = (set, max) => { for (let i = 1; i <= max; i++) if (!set.has(i)) { set.add(i); return i; } return null; };

  let dm7In = 5; const nextDm7In = () => dm7In++;
  inputs.forEach((e, idx) => {
    const n = +e.n || idx + 1;
    const r = { id: e.id, n, source: e.source || `Entrée ${n}`, steps: [], dante: [], warnings: [], ok: true };
    const ph = phantomDe(e); r.phantom = ph;
    const m = micro(e.mic);
    const route = m?.phantom === 'hf' ? 'hf' : (e.route || 'rio');
    r.route = route;
    let danteFrom = null; // { dev, ch }

    if (route === 'hf') {
      let ch = conflit.has(e) ? null : +e.hfCh;
      if (!ch || ch > 4) ch = firstFree(usedHF, 4);
      if (!ch) { r.ok = false; r.warnings.push("Plus de canal HF libre : l'ULXD4Q n'a que 4 canaux."); }
      else {
        res.usage.hf++; r.hfCh = ch;
        r.steps.push({ lieu: 'Plateau', txt: `Micro sans fil sur le canal ${ch} du récepteur ${N.ulxd}. Aucun câble à poser : il arrive déjà en Dante.` });
        danteFrom = { dev: N.ulxd, ch };
      }
    }

    if (route === 'rio') {
      const rio = +e.rio === 2 ? 2 : 1; r.rio = rio;
      let ch = conflit.has(e) ? null : +e.rioCh;
      if (conflit.has(e)) r.warnings.push(`L'entrée ${e.rioCh} de ${N['rio' + rio]} était déjà prise : nouvelle entrée attribuée.`);
      if (!ch || ch > 16) ch = firstFree(usedRio[rio], 16);
      if (!ch) { r.ok = false; r.warnings.push(`Les 16 entrées de ${N['rio' + rio]} sont prises : passe des lignes sur l'autre Rio ou sur un boîtier.`); }
      else {
        usedRio[rio].add(ch); res.usage['rio' + rio]++; r.rioCh = ch;
        const net = RIO_PLATEAU[rio];
        r.steps.push({ lieu: 'Plateau', txt: `Branche le micro sur ${N['rio' + rio]}, entrée ${ch}.` });
        r.steps.push({ lieu: 'Réseau', fixe: true, txt: `${N['rio' + rio]} est reliée au BAV-24 : ${net.prim.prise} (primaire, câble ${net.prim.cable}) et ${net.sec.prise} (secondaire, câble ${net.sec.cable}). Au nodal, ${net.aPoser ? 'pose les cordons' : 'cordons déjà posés'} : ${net.prim.patch} → switch ${net.prim.switch}, ${net.sec.patch} → switch ${net.sec.switch}.` });
        if (ph.on) r.steps.push({ lieu: '48 V', txt: `Active le +48 V de l'entrée ${ch} de ${N['rio' + rio]} (depuis la DM7, page des préamplis de la Rio).` });
        danteFrom = { dev: N['rio' + rio], ch };
      }
    }

    if (route === 'bav') {
      const p = e.prise && priseParId('AUD', e.prise);
      if (!p) { r.ok = false; r.warnings.push('Choisis une prise XLR sur un boîtier.'); }
      else if (usedPrise.has(p.id)) { r.ok = false; r.warnings.push(`La prise ${p.bav} ${p.nom} est déjà utilisée par une autre ligne.`); }
      else {
        usedPrise.add(p.id); r.prise = p;
        if (p.verifier) r.warnings.push(`Numéro de câble de ${p.bav} lu sur le plan mais pas encore vérifié sur place : teste la ligne.`);
        r.steps.push({ lieu: 'Plateau', bav: p.bav, txt: `${p.bav} (${p.loc}) : branche le micro sur la XLR femelle (bouton PUSH) de ${p.nom}. Câble n° ${p.cable}.` });
        let arrivee; // point du Ghielmetti 2
        if (G1[p.cable]) {
          const L = LIAISONS.find(l => !usedLiaison.has(l.cable));
          if (!L) { r.ok = false; r.warnings.push('Les 24 liaisons nodal → régie sont toutes prises.'); }
          else {
            usedLiaison.add(L.cable); res.usage.liaisons++; r.liaison = L; r.g1 = G1[p.cable];
            r.steps.push({ lieu: 'Nodal', txt: `Ghielmetti 1 : cordon de ${G1[p.cable]} (ligne ${p.cable}) vers ${L.g1} (liaison ${L.cable} vers la régie).` });
            res.cordons.nodal.push({ n, source: r.source, de: G1[p.cable], vers: L.g1, txt: `${p.bav} ${p.nom} → liaison ${L.cable}` });
            arrivee = { point: L.g2, via: `la liaison ${L.cable} arrive en ${L.g2}` };
          }
        } else if (G2[p.cable]) {
          arrivee = { point: G2[p.cable], via: `la ligne ${p.cable} arrive directement en ${G2[p.cable]}` };
        }
        if (arrivee) {
          const ri = RIO_REGIE_IN.find(x => !usedRegie.has(x.ch));
          if (ri) {
            usedRegie.add(ri.ch); res.usage.rioRegie++; r.regieIn = ri;
            r.steps.push({ lieu: 'Régie', txt: `Ghielmetti 2 : ${arrivee.via}. Cordon de ${arrivee.point} vers ${ri.g2} = ${N.rioRegie}, entrée ${ri.ch}.` });
            res.cordons.regie.push({ n, source: r.source, de: arrivee.point, vers: ri.g2, txt: `→ ${N.rioRegie} entrée ${ri.ch}` });
            if (ph.on) r.steps.push({ lieu: '48 V', txt: `Pose d'abord les cordons, puis active le +48 V de l'entrée ${ri.ch} de ${N.rioRegie}. La fantôme remonte les câbles jusqu'au micro. Coupe-la avant de retirer un cordon.` });
            danteFrom = { dev: N.rioRegie, ch: ri.ch };
          } else {
            const lo = DM7_LOCAL_IN.find(x => !usedLocal.has(x.ch));
            if (!lo) { r.ok = false; r.warnings.push(`Plus d'entrée libre en régie (${N.rioRegie} et entrées locales DM7 13-16 pleines).`); }
            else {
              usedLocal.add(lo.ch); res.usage.dm7Local++; r.dm7Local = lo;
              r.steps.push({ lieu: 'Régie', txt: `Ghielmetti 2 : ${arrivee.via}. ${N.rioRegie} pleine : cordon de ${arrivee.point} vers ${lo.g2} = entrée locale ${lo.ch} de la DM7.` });
              res.cordons.regie.push({ n, source: r.source, de: arrivee.point, vers: lo.g2, txt: `→ DM7 entrée locale ${lo.ch}` });
              if (ph.on) r.steps.push({ lieu: '48 V', txt: `Active le +48 V de l'entrée locale ${lo.ch} de la DM7, après avoir posé les cordons.` });
              r.steps.push({ lieu: 'DM7', txt: `Patch d'entrée : canal ${n} ← entrée locale ${lo.ch}.` });
              res.dm7.push({ n, source: r.source, txt: `Canal ${n} ← entrée locale ${lo.ch}` });
            }
          }
        }
      }
    }

    if (danteFrom) {
      // Entrées Dante de la DM7 : 1-4 = ULXD4Q (posé par l'installateur), les autres à partir de 5.
      const k = route === 'hf' ? danteFrom.ch : nextDm7In();
      r.dm7In = k;
      if (route === 'hf') {
        r.steps.push({ lieu: 'Dante', txt: `Déjà en place (installateur) : ${N.dm7} entrée Dante ${k} ← ${N.ulxd} canal ${k}. Rien à cocher.` });
      } else {
        const sub = { rxDev: N.dm7, rxCh: k, txDev: danteFrom.dev, txCh: danteFrom.ch, label: r.source };
        r.dante.push(sub); res.dante.push(sub);
        r.steps.push({ lieu: 'Dante', txt: `Dante Controller : coche la case entre ${N.dm7} canal ${k} (récepteur, à gauche) et ${danteFrom.dev} canal ${danteFrom.ch} (émetteur, en haut).` });
      }
      r.steps.push({ lieu: 'DM7', txt: `Patch d'entrée : canal ${n} ← Dante ${k}.` });
      res.dm7.push({ n, source: r.source, txt: `Canal ${n} ← Dante ${k}` });
    }
    if (ph.on && route !== 'hf') res.phantom.push({ n, source: r.source, ou: r.rioCh ? `${N['rio' + r.rio]} entrée ${r.rioCh}` : r.regieIn ? `${N.rioRegie} entrée ${r.regieIn.ch}` : r.dm7Local ? `DM7 entrée locale ${r.dm7Local.ch}` : '?' });
    if (ph.src === 'inconnu' && route !== 'hf') r.warnings.push('Fantôme inconnue : choisis le micro dans « setup ».');
    res.inputs.push(r);
  });

  // micros en trop
  const count = {};
  inputs.forEach(e => { if (e.mic) count[e.mic] = (count[e.mic] || 0) + 1; });
  for (const [id, c] of Object.entries(count)) {
    const m = micro(id); if (m?.qte && c > m.qte) res.warnings.push(`${m.nom} : ${c} demandés, ${m.qte} dans le parc.`);
  }

  // ---------- Sorties ----------
  // Une sortie branchée sur une prise HP déjà prévue par la diffusion système (front fills,
  // retours) reprend le bus et le Dante Out du système. Sinon : un Dante Out libre.
  const sysOuts = SYS_OUTS;
  let dOut = +(state.settings?.dm7OutStart) || 9;
  const nextOut = () => { while (sysOuts.has(dOut)) dOut++; return dOut++; };
  const usedHP = new Map(), usedRioOut = { 1: new Set(), 2: new Set() };
  (state.outputs || []).forEach((o, idx) => {
    const r = { id: o.id, nom: o.nom || `Sortie ${idx + 1}`, steps: [], warnings: [], ok: true };
    const qte = Math.max(1, +o.qte || 1);
    const p = (o.route || 'hp') === 'hp' && o.prise ? priseParId('HP', o.prise) : null;
    const mm = p && matriceDe(p.cable);
    const zone = mm && SYS_RX[`ma${mm.m}:${mm.sortie}`];
    const dmOut = zone ? zone.out : nextOut();
    const bus = zone ? zone.bus : (o.mix || 'le mix ' + r.nom);
    r.dm7Out = dmOut; r.zone = zone;
    r.steps.push({ lieu: 'DM7', txt: zone
      ? `Cette prise fait partie de la diffusion fixe « ${zone.nom} » : elle écoute le Dante Out ${dmOut} de la DM7 (bus conseillé : ${zone.bus})${zone.retour ? '. Les 4 retours partagent ce même mix' : ''}.`
      : `Patch de sortie : ${bus} → Dante Out ${dmOut}.` });
    if (!zone) res.dm7.push({ n: 'S' + (idx + 1), source: r.nom, txt: `${bus} → Dante Out ${dmOut}` });
    if ((o.route || 'hp') === 'hp') {
      if (!p) { r.ok = false; r.warnings.push('Choisis une prise HP (Speakon) sur un boîtier.'); }
      else {
        if (usedHP.has(p.id)) { r.ok = false; r.warnings.push(`La prise ${p.bav} ${p.nom} est déjà utilisée par « ${usedHP.get(p.id)} ».`); }
        usedHP.set(p.id, r.nom);
        const type = o.type === 'xt1' ? 'XT1' : o.type === 'xt22' ? 'XT22' : 'enceinte passive';
        r.steps.push({ lieu: 'Plateau', bav: p.bav, txt: `${p.bav} (${p.loc}) : branche ${qte > 1 ? qte + ' ' + type + ' chaînées (LOOP THRU) ' : 'la ' + type + ' '}en Speakon sur ${p.nom}. Câble n° ${p.cable}.` });
        if (o.type === 'xt1' && qte > 1) r.warnings.push(`Le synoptique prévoit un XT1 par prise HP (8 prises pour 8 XT1) : chaîner n'est utile que s'il manque des prises.${qte > 2 ? ` ${qte} XT1 (16 Ω) en parallèle = ${(16 / qte).toFixed(1)} Ω : vérifie l'impédance minimale de la MA-4.600.` : ''}`);
        if (mm) {
          const dev = N['ma' + mm.m];
          r.steps.push({ lieu: 'Nodal', txt: `Le câble ${p.cable} est alimenté par la matrice Fohhn MA-4.600 n°${mm.m}, sortie ${mm.sortie}.` });
          r.steps.push({ lieu: 'Dante', txt: `Dante Controller : coche ${dev} canal ${mm.sortie} (récepteur) × ${N.dm7} canal ${dmOut} (émetteur)${zone ? ' : case déjà cochée par la diffusion système' : ''}. Dans Fohhn Audio Soft, vérifie que l'entrée Dante ${mm.sortie} part bien sur la sortie ${mm.sortie}.` });
          res.dante.push({ rxDev: dev, rxCh: mm.sortie, txDev: N.dm7, txCh: dmOut, label: r.nom, sys: !!zone });
        }
      }
    } else {
      const rio = +o.rio === 2 ? 2 : 1;
      let ch = +o.rioOut;
      if (!ch || usedRioOut[rio].has(ch)) ch = firstFree(usedRioOut[rio], 8); else usedRioOut[rio].add(ch);
      if (!ch) { r.ok = false; r.warnings.push(`Les 8 sorties de ${N['rio' + rio]} sont prises.`); }
      else {
        r.steps.push({ lieu: 'Plateau', txt: `Branche l'enceinte active (ou la ligne) sur ${N['rio' + rio]}, sortie ${ch}, en XLR.` });
        r.steps.push({ lieu: 'Dante', txt: `Dante Controller : coche ${N['rio' + rio]} canal ${ch} (récepteur) × ${N.dm7} canal ${dmOut} (émetteur).` });
        res.dante.push({ rxDev: N['rio' + rio], rxCh: ch, txDev: N.dm7, txCh: dmOut, label: r.nom });
      }
    }
    res.outputs.push(r);
  });

  // ---------- Réseau (RTP MIDI) ----------
  const usedEth = new Set();
  (state.net || []).forEach((x, idx) => {
    const r = { id: x.id, nom: x.nom || `RTP MIDI ${idx + 1}`, steps: [], warnings: [], ok: true };
    const p = x.prise && priseParId('ETH', x.prise);
    if (!p) { r.ok = false; r.warnings.push('Choisis une prise réseau (RJ45) sur un boîtier.'); }
    else {
      if (usedEth.has(p.id)) { r.ok = false; r.warnings.push(`${p.bav} ${p.nom} est déjà utilisée.`); }
      usedEth.add(p.id);
      r.steps.push({ lieu: 'Plateau', bav: p.bav, txt: `${p.bav} (${p.loc}) : branche l'ordinateur de l'artiste sur ${p.nom}. Câble n° ${p.cable}.` });
      const nd = rj45Nodal(p.cable); r.nodal = nd;
      const ou = nd ? `patch RJ45 ${nd.patch.slice(2)}, port ${nd.point}` : `l'arrivée du câble ${p.cable}`;
      r.steps.push({ lieu: 'Nodal', txt: `Le câble ${p.cable} arrive sur le ${ou}. Pose un cordon de ce port vers un port libre du switch Contrôle 1. Jamais vers P1 ou S1 : ce sont les switchs Dante.` });
      r.steps.push({ lieu: 'Régie', txt: `Branche ton ordinateur sur un port libre du switch Contrôle 2 (baie régie, U33).` });
      r.steps.push({ lieu: 'Réglages', txt: `Mets les deux ordinateurs sur la même plage d'adresses IP. Sur Mac : Configuration audio et MIDI → fenêtre MIDI → Réseau, crée une session et connecte-toi à l'autre. Sur Windows : logiciel rtpMIDI.` });
      r.warnings.push('Liaison entre les switchs de contrôle du nodal et de la régie à confirmer.');
      res.cordons.rj45.push({ source: r.nom, txt: `${nd ? nd.point + ' (câble ' + p.cable + ')' : 'câble ' + p.cable} → switch Contrôle 1` });
    }
    res.net.push(r);
  });

  // Doublons de numéro d'entrée
  const seen = new Set();
  for (const r of res.inputs) { if (seen.has(r.n)) res.warnings.push(`Le numéro ${r.n} est utilisé deux fois.`); seen.add(r.n); }
  return res;
}
