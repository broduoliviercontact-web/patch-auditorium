import test from 'node:test';
import assert from 'node:assert/strict';
import { compute, prises } from '../js/route.js';
import { PATCHES, rj45Nodal, cordonsParPatch } from '../js/baies.js';
import { NOMS_DEFAUT } from '../js/data.js';
import { subscriptions } from '../js/dante.js';

const base = (inputs = [], outputs = [], net = []) => ({ inputs, outputs, net, settings: { names: {}, dm7OutStart: 9 } });

test('kick sur BAV-20 AUD-01 : nodal A21 → B1, régie A29 → B1, Rio régie 1', () => {
  const r = compute(base([{ id: 'a', n: 1, source: 'Kick', route: 'bav', prise: 'BAV-20:AUD-01' }])).inputs[0];
  assert.equal(r.ok, true);
  assert.equal(r.prise.cable, 6021);
  assert.equal(r.g1, 'A21');
  assert.deepEqual([r.liaison.cable, r.liaison.g1, r.liaison.g2], [6049, 'B1', 'A29']);
  assert.equal(r.regieIn.ch, 1); assert.equal(r.regieIn.g2, 'B1');
  assert.deepEqual(r.dante[0], { rxDev: 'Y001-Yamaha-DM7C', rxCh: 5, txDev: 'Y003-Yamaha-Rio1608-D3-REGIE', txCh: 1, label: 'Kick' });
  assert.equal(r.phantom.on, false);
});

test('Rio du plateau : entrées attribuées dans l\'ordre, choix manuel respecté', () => {
  const res = compute(base([
    { id: 'a', n: 1, source: 'Kick', route: 'rio', rioCh: 3 },
    { id: 'b', n: 2, source: 'Snare', route: 'rio' },
    { id: 'c', n: 3, source: 'Tom', route: 'rio', rioCh: 3 },
  ]));
  assert.deepEqual(res.inputs.map(r => r.rioCh), [3, 1, 2]);
  assert.ok(res.inputs[2].warnings.some(w => /déjà prise/.test(w)));
  assert.equal(res.usage.rio1, 3);
});

test('micro HF : route forcée en HF, 4 canaux max', () => {
  const ins = Array.from({ length: 5 }, (_, i) => ({ id: 'h' + i, n: i + 1, source: 'Voix', mic: 'ulxd2', route: 'bav' }));
  const res = compute(base(ins));
  assert.deepEqual(res.inputs.map(r => r.hfCh ?? null), [1, 2, 3, 4, null]);
  assert.equal(res.inputs[4].ok, false);
});

test('fantôme : micro > devinette par le nom', () => {
  const res = compute(base([
    { id: 'a', n: 1, source: 'OH L', route: 'rio' },
    { id: 'b', n: 2, source: 'Kick', route: 'rio', mic: 'c414' },
    { id: 'c', n: 3, source: 'Truc', route: 'rio' },
    { id: 'd', n: 4, source: 'OH R', route: 'rio', phantom: false },
  ]));
  assert.deepEqual(res.inputs.map(r => r.phantom.on), [true, true, false, false]);
  assert.ok(res.inputs[2].warnings.some(w => /inconnue/.test(w)));
});

test('boîtier direct régie (BAV-PMS-01) : pas de liaison', () => {
  const r = compute(base([{ id: 'a', n: 1, source: 'Talk', route: 'bav', prise: 'BAV-PMS-01:AUD-01' }])).inputs[0];
  assert.equal(r.liaison, undefined); assert.equal(r.regieIn.ch, 1);
});

test('17e ligne boîtier : débordement sur les entrées locales DM7', () => {
  const aud = prises('AUD').filter(p => p.zone === 'plateau').slice(0, 17);
  const res = compute(base(aud.map((p, i) => ({ id: 'x' + i, n: i + 1, source: 'L' + i, route: 'bav', prise: p.id }))));
  assert.equal(res.usage.rioRegie, 16);
  assert.equal(res.inputs[16].dm7Local.ch, 13);
  assert.equal(res.inputs[16].dm7Local.g2, 'B23');
});

test('prise utilisée deux fois = erreur', () => {
  const res = compute(base([
    { id: 'a', n: 1, route: 'bav', prise: 'BAV-23:AUD-02', source: 'a' },
    { id: 'b', n: 2, route: 'bav', prise: 'BAV-23:AUD-02', source: 'b' },
  ]));
  assert.equal(res.inputs[1].ok, false);
});

test('sorties : retour XT22 sur BAV-26 HP-01 → diffusion fixe (Dante Out 4) ; enceinte active sur Rio → Out 9', () => {
  const res = compute(base([], [
    { id: 'o1', nom: 'Retour chant', type: 'xt22', route: 'hp', prise: 'BAV-26:HP-01' },
    { id: 'o2', nom: 'Sub artiste', type: 'actif', route: 'rio' },
    { id: 'o3', nom: 'Front', type: 'xt1', qte: 4, route: 'hp', prise: 'BAV-23:HP-01' },
  ]));
  assert.deepEqual(res.dante.map(d => [d.rxDev, d.rxCh, d.txCh]), [['MA-Retour-Scene', 1, 4], ['Rio-Rack-1', 1, 9], ['MA-Nez-Scene-2', 1, 16]]);
  assert.equal(res.outputs[0].zone.bus, 'Mix Retours');
  assert.ok(res.outputs[2].warnings.some(w => /impédance/.test(w)));
});

test('RTP MIDI : BAV-24 réservé aux Rio', () => {
  assert.ok(!prises('ETH').some(p => p.bav === 'BAV-24'));
  const r = compute(base([], [], [{ id: 'n', nom: 'MIDI', prise: 'BAV-20:ETH-01' }])).net[0];
  assert.ok(r.steps.some(s => /switch Contrôle 1/.test(s.txt)));
  assert.deepEqual(r.nodal, { patch: 'N-C', point: 'C1' });
});

test('baies : Ghielmetti 2 conforme au synoptique', () => {
  const p = PATCHES.G2.points;
  assert.equal(p.A29, 6049); assert.equal(p.B29, 6001); assert.equal(p.B1, 6149); assert.equal(p.B23, 6171);
  assert.equal(p.A17, 6117); assert.equal(p.B48, 6196); assert.equal(p.A15, undefined);
  assert.deepEqual(rj45Nodal(4073), { patch: 'N-D', point: 'D1' });
});

test('baies : cordons du kick sur G1 et G2', () => {
  const res = compute(base([{ id: 'a', n: 1, source: 'Kick', route: 'bav', prise: 'BAV-20:AUD-01' }]));
  const c = cordonsParPatch(res, NOMS_DEFAUT);
  assert.deepEqual([c.G1[0].a, c.G1[0].b], ['A21', 'B1']);
  assert.deepEqual([c.G2[0].a, c.G2[0].b], ['A29', 'B1']);
});

test('dante : diffusion système + patch, conflit détecté en entraînement', () => {
  const res = compute(base([{ id: 'a', n: 1, source: 'Kick', route: 'rio' }], [{ id: 'o', nom: 'Retour', type: 'xt22', route: 'hp', prise: 'BAV-26:HP-01' }]));
  const subs = subscriptions(res, NOMS_DEFAUT);
  assert.equal(subs.filter(s => s.src === 'sys').length, 23); // 2+2+2+8+1+4 + 4 HF
  assert.ok(subs.some(s => s.src === 'patch' && s.tx === 'rio1' && s.rx === 'dm7' && s.rxCh === 5));
  assert.ok(!subs.some(s => s.conflict));
  const t = subscriptions(res, NOMS_DEFAUT, { add: ['rio1:5>dm7:5'], off: ['dm7:15>di4:1'] });
  assert.equal(t.filter(s => s.conflict).length, 2);
  assert.ok(!t.some(s => s.key === 'dm7:15>di4:1'));
});
