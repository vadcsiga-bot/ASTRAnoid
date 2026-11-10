/* ASTRANOID - car.js
   Az Opel Astra minden alkatrésze külön rajzolva (oldalnézet, "cutaway" stílus).
   Ugyanabból a rajzból készül az ütközési maszk is (pixelpontos).
   Tervezési tér: 480 x 184 egység, az autó jobbra néz (orr = jobb oldal). */
const Car = (function () {
  'use strict';
  const W = 480, H = 184, TAU = Math.PI * 2;
  const FX = 381, RX = 86, WY = 142, TR = 35.5; // első/hátsó kerék középpontja, gumi sugara
  const defs = [];

  // ---------- rajzoló segédek ----------
  function poly(c, p) { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); }
  function bb(p) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of p) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); } return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }; }
  function lg(c, x0, y0, x1, y1, st) { const g = c.createLinearGradient(x0, y0, x1, y1); for (const s of st) g.addColorStop(s[0], s[1]); return g; }
  function rg(c, x, y, r0, r1, st) { const g = c.createRadialGradient(x, y, r0, x, y, r1); for (const s of st) g.addColorStop(s[0], s[1]); return g; }
  const SIL = [[0, '#f8fafc'], [.28, '#d6dde5'], [.62, '#a3adb9'], [1, '#6c7683']];
  const EDGE = '#2a303a';

  function metal(c, p, o) {
    o = o || {}; const b = bb(p);
    poly(c, p); c.fillStyle = lg(c, 0, b.y0, 0, b.y1, o.st || SIL); c.fill();
    c.save(); poly(c, p); c.clip();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(b.x0, b.y0, b.w, Math.min(2.4, b.h));
    c.fillStyle = 'rgba(0,0,0,.2)'; const sh = Math.min(3.2, b.h * .3); c.fillRect(b.x0, b.y1 - sh, b.w, sh);
    if (o.fx) o.fx(c, b);
    c.restore();
    poly(c, p); c.lineWidth = o.lw || 1.1; c.strokeStyle = o.edge || EDGE; c.lineJoin = 'round'; c.stroke();
  }
  function box(c, x, y, w, h, st, r, edge) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r || 0); else c.rect(x, y, w, h);
    c.fillStyle = Array.isArray(st) ? lg(c, 0, y, 0, y + h, st) : st; c.fill();
    if (edge !== false) { c.lineWidth = 1; c.strokeStyle = edge || '#15181d'; c.stroke(); }
  }
  function disc(c, x, y, r, fill, edge, lw) {
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = fill; c.fill();
    if (edge) { c.lineWidth = lw || 1; c.strokeStyle = edge; c.stroke(); }
  }
  function cutArch(c, cx, cy, r) { c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill(); c.restore(); }
  function lip(c, p, cx, cy, r) { c.save(); poly(c, p); c.clip(); c.beginPath(); c.arc(cx, cy, r + .5, 0, TAU); c.lineWidth = 1.8; c.strokeStyle = '#20252d'; c.stroke(); c.restore(); }
  function glassFill(c, p, tint) {
    const b = bb(p); poly(c, p);
    c.fillStyle = lg(c, b.x0, b.y0, b.x1, b.y1, tint || [[0, '#d4edfb'], [.45, '#7db6d8'], [1, '#3f7699']]); c.fill();
    c.save(); poly(c, p); c.clip();
    c.fillStyle = 'rgba(255,255,255,.28)';
    c.beginPath(); c.moveTo(b.x0 + b.w * .12, b.y1 + 2); c.lineTo(b.x0 + b.w * .32, b.y1 + 2); c.lineTo(b.x0 + b.w * .62, b.y0 - 2); c.lineTo(b.x0 + b.w * .42, b.y0 - 2); c.closePath(); c.fill();
    c.restore();
    poly(c, p); c.lineWidth = 1.1; c.strokeStyle = '#1f3442'; c.stroke();
  }
  function hex(c, x, y, r, fill) {
    c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .26; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath();
    c.fillStyle = fill || lg(c, x - r, y - r, x + r, y + r, [[0, '#ffffff'], [.5, '#b9c1cb'], [1, '#6a7480']]); c.fill();
    c.lineWidth = .7; c.strokeStyle = '#1b1f25'; c.stroke();
  }

  // ---------- alkatrész-regisztráció ----------
  // kind: panel (leesik) | glass (összetörik) | small (kirepül) | tough (sérthetetlen amíg ...)
  function P(id, name, z, hp, kind, o, draw) { defs.push(Object.assign({ id, name, z, hp, kind, draw }, o || {})); }

  // === ALVÁZ / SZERKEZET (z 0-9) ===
  P('floorpan', 'padlólemez', 2, 3, 'panel', { heavy: 1, snd: 'metal' }, c => {
    const p = [[40, 154], [440, 154], [445, 164], [36, 164]];
    poly(c, p); c.fillStyle = lg(c, 0, 154, 0, 164, [[0, '#454b55'], [1, '#1b1e24']]); c.fill();
    c.lineWidth = 1; c.strokeStyle = '#0d0f12'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.09)'; for (let x = 54; x < 430; x += 24) c.fillRect(x, 155, 2, 8);
    c.fillStyle = 'rgba(160,90,40,.35)'; c.fillRect(160, 160, 30, 3); c.fillRect(300, 158, 18, 4);
  });
  function liner(id, cx, name) {
    P(id, name, 20, 2, 'panel', { snd: 'plastic' }, c => {
      c.save(); c.beginPath(); c.rect(cx - 50, 92, 100, 60); c.clip();
      disc(c, cx, WY, 41.5, rg(c, cx, WY, 20, 42, [[0, '#0d0e11'], [1, '#262a31']]), '#0a0b0d', 1);
      c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1; for (let r = 38; r > 30; r -= 3) { c.beginPath(); c.arc(cx, WY, r, 3.4, 6.0); c.stroke(); }
      c.restore();
    });
  }
  liner('linerF', FX, 'első kerékjárat-burkolat');
  liner('linerR', RX, 'hátsó kerékjárat-burkolat');
  P('firewall', 'torpedólemez', 4, 3, 'panel', { snd: 'metal' }, c => {
    const p = [[336, 66], [350, 70], [350, 150], [336, 150]];
    poly(c, p); c.fillStyle = lg(c, 336, 0, 350, 0, [[0, '#4b525d'], [1, '#262a31']]); c.fill();
    c.lineWidth = 1; c.strokeStyle = '#101216'; c.stroke();
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(340, 90, 7, 3); c.fillRect(340, 110, 7, 3);
  });

  // === MECHANIKA (z 10-19) ===
  P('exhaust', 'kipufogó', 12, 2, 'panel', { snd: 'metal' }, c => {
    box(c, 70, 166, 275, 4.5, [[0, '#8a8f98'], [1, '#4c515a']], 2);
    box(c, 18, 156, 56, 17, [[0, '#b5bbc4'], [.5, '#767d88'], [1, '#444a54']], 8);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(26, 159, 40, 2);
    box(c, 4, 160, 18, 7, [[0, '#f4f6f8'], [1, '#79828d']], 3, '#2b3038');
    c.fillStyle = '#16181c'; c.fillRect(5, 162, 4, 3);
  });
  P('fuelTank', 'üzemanyagtartály', 13, 2, 'panel', { heavy: 1, snd: 'metal' }, c => {
    box(c, 150, 156, 84, 17, [[0, '#59606b'], [.5, '#3d434d'], [1, '#22262c']], 6);
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(156, 159, 70, 2);
    c.fillStyle = '#c9a227'; c.fillRect(176, 165, 32, 4);
  });
  function wishbone(id, cx, name, flip) {
    P(id, name, 26, 2, 'panel', { snd: 'metal' }, c => {
      const s = flip ? -1 : 1;
      const p = [[cx - 44 * s, 154], [cx, 134], [cx + 42 * s, 154], [cx + 42 * s, 160], [cx, 144], [cx - 44 * s, 161]];
      poly(c, p); c.fillStyle = lg(c, 0, 134, 0, 160, [[0, '#6a717c'], [1, '#2a2e35']]); c.fill();
      c.lineWidth = 1; c.strokeStyle = '#0f1114'; c.stroke();
      disc(c, cx, 140, 4, '#9aa3ae', '#1c1f24');
    });
  }
  wishbone('wishboneF', FX, 'első lengőkar'); wishbone('wishboneR', RX, 'hátsó lengőkar', true);

  // === MOTORTÉR (z 14-19) ===
  P('battery', 'akkumulátor', 17, 2, 'small', { power: 'flex', snd: 'plastic' }, c => {
    box(c, 354, 84, 27, 21, [[0, '#2b2f36'], [1, '#14161a']], 2);
    c.fillStyle = '#d33b2f'; c.fillRect(358, 81, 5, 4); c.fillStyle = '#222'; c.fillRect(371, 81, 5, 4);
    c.fillStyle = '#f2c230'; c.fillRect(358, 90, 19, 7);
    c.fillStyle = '#14161a'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.fillText('12V', 367.5, 96);
    c.strokeStyle = '#ffd34d'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(369, 86); c.lineTo(364, 91); c.lineTo(368, 91); c.lineTo(363, 96); c.stroke();
  });
  P('ecu', 'ECU (motorvezérlő)', 18, 1, 'small', { snd: 'plastic' }, c => {
    box(c, 383, 86, 17, 13, [[0, '#3b6a8f'], [1, '#1d3a52']], 1.5);
    c.fillStyle = '#e8eef3'; c.font = 'bold 5px sans-serif'; c.textAlign = 'center'; c.fillText('ECU', 391.5, 94.5);
    c.fillStyle = '#c8cdd3'; for (let i = 0; i < 4; i++) c.fillRect(385 + i * 4, 99, 2, 3);
  });
  P('washer', 'ablakmosó-tartály', 17, 1, 'small', { snd: 'plastic' }, c => {
    box(c, 354, 108, 22, 20, [[0, '#9fd2ec'], [1, '#3f86ad']], 4);
    c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(358, 112, 3, 11);
    box(c, 360, 105, 10, 5, '#2f6fa6', 1.5);
  });
  P('coolant', 'hűtőfolyadék-tartály', 17, 1, 'small', { snd: 'plastic' }, c => {
    box(c, 383, 104, 16, 19, [[0, '#f4efe0'], [1, '#c4bd9e']], 3);
    c.fillStyle = '#42b86a'; c.fillRect(384, 113, 14, 9);
    box(c, 386, 101, 10, 4, '#d33b2f', 1.5);
  });
  P('block', 'motorblokk', 16, 4, 'panel', { heavy: 1, snd: 'engine' }, c => {
    const p = [[402, 106], [446, 106], [450, 134], [398, 134]];
    poly(c, p); c.fillStyle = lg(c, 0, 98, 0, 128, [[0, '#a2a9b3'], [.4, '#68707b'], [1, '#2d3138']]); c.fill();
    c.lineWidth = 1.2; c.strokeStyle = '#14161a'; c.stroke();
    c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 4; i++) c.fillRect(406 + i * 10, 112, 4, 18);
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(402, 107, 44, 2);
    disc(c, 425, 124, 5, '#20242a', '#0c0d10');
  });
  P('intake', 'szívócső-burkolat', 17, 2, 'panel', { snd: 'plastic' }, c => {
    const p = [[400, 97], [448, 97], [446, 106], [402, 106]];
    poly(c, p); c.fillStyle = lg(c, 0, 90, 0, 99, [[0, '#4a5059'], [1, '#1b1e23']]); c.fill();
    c.lineWidth = 1; c.strokeStyle = '#0c0d10'; c.stroke();
    c.fillStyle = '#e1b12c'; c.font = 'bold 5.5px sans-serif'; c.textAlign = 'center'; c.fillText('ECOTEC', 424, 103.5);
  });
  for (let i = 0; i < 3; i++) {
    const x = 408 + i * 12;
    P('coil' + i, 'gyújtótekercs', 18, 1, 'small', { snd: 'small' }, c => {
      box(c, x, 90, 7, 9, [[0, '#d9dde2'], [1, '#7d8590']], 1.5);
      c.fillStyle = '#16181c'; c.fillRect(x + 2, 88.5, 3, 2.5);
    });
  }
  P('oilcap', 'olajbetöltő sapka', 18, 1, 'small', { snd: 'small' }, c => {
    disc(c, 441, 95, 4.6, rg(c, 441, 95, 0, 5, [[0, '#f3d36b'], [1, '#a47c12']]), '#4a3705', 1);
    c.fillStyle = '#4a3705'; c.fillRect(438.5, 94.5, 5, 1.2);
  });
  P('radiator', 'hűtő', 17, 3, 'panel', { heavy: 1, snd: 'metal' }, c => {
    box(c, 451, 100, 13, 38, [[0, '#2b2f36'], [1, '#14161a']], 1.5);
    c.strokeStyle = 'rgba(190,200,215,.55)'; c.lineWidth = .8; for (let y = 103; y < 136; y += 3) { c.beginPath(); c.moveTo(452, y); c.lineTo(463, y); c.stroke(); }
  });
  P('fan', 'hűtőventilátor', 19, 1, 'small', { snd: 'small' }, c => {
    disc(c, 441, 119, 12.5, '#15171b', '#050607', 1);
    for (let i = 0; i < 7; i++) { c.save(); c.translate(441, 119); c.rotate(i * TAU / 7); c.beginPath(); c.moveTo(0, 0); c.lineTo(11, -3); c.lineTo(11, 3); c.closePath(); c.fillStyle = '#3c424b'; c.fill(); c.restore(); }
    disc(c, 441, 119, 3, '#8a919b', '#0b0c0e', .8);
  });
  P('pulley', 'ékszíjtárcsa', 19, 1, 'small', { snd: 'small' }, c => {
    disc(c, 392, 118, 8, rg(c, 392, 118, 1, 8, [[0, '#9aa2ad'], [1, '#444a54']]), '#111317', 1);
    disc(c, 392, 118, 2.6, '#1a1c20');
  });
  P('hose', 'hűtőcső', 18, 1, 'small', { snd: 'plastic' }, c => {
    c.lineCap = 'round'; c.strokeStyle = '#101216'; c.lineWidth = 6; c.beginPath(); c.moveTo(430, 102); c.quadraticCurveTo(442, 98, 452, 110); c.stroke();
    c.strokeStyle = '#2e333b'; c.lineWidth = 3; c.stroke();
  });

  // === KERÉKAGGYAK / FÉKEK / KEREKEK ===
  function drawWheel(c, cx, cy) {
    c.save(); c.translate(cx, cy);
    disc(c, 0, 0, TR, '#17181c');
    c.fillStyle = '#08080a'; for (let i = 0; i < 30; i++) { c.save(); c.rotate(i / 30 * TAU); c.fillRect(-1.5, -TR, 3, 3.8); c.restore(); }
    disc(c, 0, 0, 31.8, rg(c, 0, 0, 22, 32, [[0, '#33363e'], [1, '#1f2126']]));
    c.strokeStyle = '#3d4048'; c.lineWidth = .8; c.beginPath(); c.arc(0, 0, 28, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 33.6, -2.7, -1.2); c.stroke();
    disc(c, 0, 0, 23.5, lg(c, -22, -22, 22, 22, [[0, '#f6f8fa'], [.5, '#adb6c1'], [1, '#6c7683']]), '#363c45', 1);
    disc(c, 0, 0, 19.2, '#1e2229');
    for (let i = 0; i < 5; i++) {
      c.save(); c.rotate(i * TAU / 5 - TAU / 4);
      c.beginPath(); c.moveTo(-3.4, -7); c.lineTo(-5, -19.4); c.lineTo(5, -19.4); c.lineTo(3.4, -7); c.closePath();
      c.fillStyle = lg(c, -5, 0, 5, 0, [[0, '#edf0f3'], [1, '#858f9c']]); c.fill(); c.lineWidth = .6; c.strokeStyle = '#444b55'; c.stroke(); c.restore();
    }
    disc(c, 0, 0, 7.6, lg(c, -6, -6, 6, 6, [[0, '#dbe1e7'], [1, '#59626e']]), '#2a2f36', .8);
    disc(c, 0, 0, 3.2, '#15181d');
    c.restore();
  }
  function wheelParts(tag, cx, nm) {
    P('disc' + tag, 'féktárcsa (' + nm + ')', 24, 2, 'panel', { snd: 'metal' }, c => {
      disc(c, cx, WY, 25, rg(c, cx, WY, 8, 25, [[0, '#7b828c'], [.7, '#aab1ba'], [1, '#575e68']]), '#23272d', 1);
      c.fillStyle = '#2a2e34'; for (let i = 0; i < 10; i++) { c.save(); c.translate(cx, WY); c.rotate(i / 10 * TAU); c.beginPath(); c.arc(16, 0, 1.7, 0, TAU); c.fill(); c.restore(); }
      disc(c, cx, WY, 7, '#2c3037', '#111');
    });
    P('caliper' + tag, 'féknyereg (' + nm + ')', 25, 1, 'small', { snd: 'metal' }, c => {
      box(c, cx + 7, WY - 27, 17, 22, [[0, '#f26a4b'], [1, '#a8281a']], 4, '#4a0f08');
      c.fillStyle = '#fff'; c.font = 'bold 5px sans-serif'; c.textAlign = 'center'; c.fillText('OPC', cx + 15.5, WY - 14);
    });
    P('wheel' + tag, 'kerék (' + nm + ')', 40, 1, 'wheel', { heavy: 1, snd: 'tire', invuln: 1, mass: 4 }, c => drawWheel(c, cx, WY));
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2, bx = cx + Math.cos(a) * 11.5, by = WY + Math.sin(a) * 11.5;
      P('bolt' + tag + k, 'kerékcsavar', 41, 1, 'bolt', { snd: 'ping', wheel: 'wheel' + tag, bigHit: 5.2 }, c => hex(c, bx, by, 3.5),
      );
    }
  }
  wheelParts('F', FX, 'első'); wheelParts('R', RX, 'hátsó');

  // === UTASTÉR (z 20-29) ===
  P('dash', 'műszerfal', 22, 2, 'panel', { snd: 'plastic' }, c => {
    const p = [[298, 60], [346, 66], [346, 90], [298, 90]];
    poly(c, p); c.fillStyle = lg(c, 0, 60, 0, 90, [[0, '#3c424b'], [1, '#14161a']]); c.fill(); c.lineWidth = 1; c.strokeStyle = '#0a0b0d'; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(300, 62); c.lineTo(344, 67); c.stroke();
    disc(c, 322, 76, 6, '#0b0c0f', '#555b66', .8); disc(c, 322, 76, 2, '#c73a2c');
  });
  P('lamp', 'Check Engine lámpa', 24, 1, 'small', { snd: 'ping', lamp: 1 }, c => {
    box(c, 308, 61, 12, 8, '#3a2a06', 1.5, '#0b0b0b');
    c.strokeStyle = '#ffb21e'; c.lineWidth = 1.1; c.strokeRect(311, 63.5, 6, 3.6); c.fillStyle = '#ffb21e'; c.fillRect(309.6, 64.6, 1.6, 1.6); c.fillRect(317.8, 64.6, 1.6, 1.6);
  });
  P('wheelcol', 'kormánykerék', 23, 1, 'small', { snd: 'plastic' }, c => {
    c.save(); c.translate(299, 71); c.rotate(.5); c.beginPath(); c.ellipse(0, 0, 3.4, 11, 0, 0, TAU); c.lineWidth = 3.4; c.strokeStyle = '#111317'; c.stroke(); c.lineWidth = .8; c.strokeStyle = '#6b727d'; c.stroke(); c.restore();
  });
  P('seatF', 'első ülés', 21, 2, 'panel', { snd: 'plastic' }, c => {
    const p = [[258, 36], [276, 34], [282, 78], [300, 80], [301, 92], [252, 92], [254, 80]];
    poly(c, p); c.fillStyle = lg(c, 250, 0, 300, 0, [[0, '#4a4f58'], [1, '#22252b']]); c.fill(); c.lineWidth = 1; c.strokeStyle = '#0e1013'; c.stroke();
    c.strokeStyle = '#b8352b'; c.lineWidth = 1; c.beginPath(); c.moveTo(262, 44); c.lineTo(276, 43); c.moveTo(260, 70); c.lineTo(278, 70); c.stroke();
  });
  P('headF', 'első fejtámla', 22, 1, 'small', { snd: 'plastic' }, c => { box(c, 262, 23, 15, 12, [[0, '#5a606a'], [1, '#2a2d33']], 3); });
  P('seatR', 'hátsó ülés', 21, 2, 'panel', { snd: 'plastic' }, c => {
    const p = [[166, 38], [184, 38], [186, 80], [220, 80], [220, 92], [162, 92], [164, 80]];
    poly(c, p); c.fillStyle = lg(c, 160, 0, 222, 0, [[0, '#4a4f58'], [1, '#22252b']]); c.fill(); c.lineWidth = 1; c.strokeStyle = '#0e1013'; c.stroke();
    c.strokeStyle = '#b8352b'; c.lineWidth = 1; c.beginPath(); c.moveTo(170, 48); c.lineTo(182, 48); c.stroke();
  });
  P('headR', 'hátsó fejtámla', 22, 1, 'small', { snd: 'plastic' }, c => { box(c, 168, 26, 15, 11, [[0, '#5a606a'], [1, '#2a2d33']], 3); });
  P('mirrorIn', 'visszapillantó', 24, 1, 'small', { snd: 'small' }, c => { box(c, 248, 22, 16, 7, [[0, '#cfd6de'], [1, '#6d7681']], 2); c.fillStyle = '#111'; c.fillRect(255, 18, 2, 4); });
  P('dice', 'plüss dobókocka', 25, 1, 'small', { power: 'multi', snd: 'small' }, c => {
    c.strokeStyle = '#d9d9d9'; c.lineWidth = .8; c.beginPath(); c.moveTo(251, 29); c.lineTo(246, 38); c.moveTo(251, 29); c.lineTo(252, 44); c.stroke();
    for (const [x, y] of [[241, 37], [248, 44]]) { box(c, x, y, 9, 9, [[0, '#ffffff'], [1, '#c5c9ce']], 2, '#555'); c.fillStyle = '#d33'; c.fillRect(x + 2, y + 2, 1.8, 1.8); c.fillRect(x + 5.2, y + 5.2, 1.8, 1.8); c.fillRect(x + 3.6, y + 3.6, 1.8, 1.8); }
  });
  P('fresh', 'illatosító fa', 25, 1, 'small', { power: 'slow', snd: 'small' }, c => {
    c.strokeStyle = '#ddd'; c.lineWidth = .8; c.beginPath(); c.moveTo(260, 29); c.lineTo(262, 36); c.stroke();
    c.beginPath(); c.moveTo(262, 34); c.lineTo(269, 48); c.lineTo(255, 48); c.closePath(); c.fillStyle = lg(c, 255, 0, 269, 0, [[0, '#46c27a'], [1, '#1b7a45']]); c.fill(); c.lineWidth = .8; c.strokeStyle = '#0d4426'; c.stroke();
    c.fillStyle = '#fff'; c.font = 'bold 4px sans-serif'; c.textAlign = 'center'; c.fillText('FRESH', 262, 45);
  });

  // === CSOMAGTÉR (z 20) ===
  P('spare', 'pótkerék', 20, 2, 'panel', { power: 'life', snd: 'tire' }, c => {
    disc(c, 50, 104, 21, '#17181c', '#050506', 1);
    c.strokeStyle = '#2b2d33'; c.lineWidth = 3; c.beginPath(); c.arc(50, 104, 16, 0, TAU); c.stroke();
    disc(c, 50, 104, 11, lg(c, 40, 94, 60, 114, [[0, '#e9edf1'], [1, '#78828f']]), '#2b3038', .8); disc(c, 50, 104, 3, '#15181d');
  });
  P('toolbox', 'szerszámosláda', 20, 1, 'small', { power: 'pierce', snd: 'metal' }, c => {
    box(c, 74, 108, 28, 16, [[0, '#e04a3a'], [1, '#8f2418']], 2, '#3b0b06');
    c.fillStyle = '#222'; c.fillRect(84, 105, 8, 4); c.fillStyle = '#f2c230'; c.fillRect(77, 114, 22, 2);
  });
  P('triangle', 'elakadásjelző háromszög', 20, 1, 'small', { power: 'wide', snd: 'plastic' }, c => {
    c.beginPath(); c.moveTo(82, 36); c.lineTo(98, 68); c.lineTo(66, 68); c.closePath(); c.fillStyle = '#d6352a'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#5a0d08'; c.stroke();
    c.beginPath(); c.moveTo(82, 46); c.lineTo(90, 62); c.lineTo(74, 62); c.closePath(); c.fillStyle = '#f4f1e8'; c.fill();
  });

  // === KÜLSŐ KAROSSZÉRIA (z 40+) ===
  P('roof', 'tető', 50, 4, 'panel', { heavy: 1, snd: 'metal' }, c => {
    const p = [[40, 17], [62, 11], [150, 8], [200, 7], [236, 9], [247, 14], [243, 24], [44, 24]];
    metal(c, p, { fx: (c, b) => { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(70, 9.6, 150, 1.6); } });
    c.strokeStyle = '#252a32'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(70, 13); c.lineTo(228, 13); c.stroke();
  });
  P('roofrail', 'tetősín', 52, 2, 'panel', { snd: 'metal' }, c => {
    box(c, 66, 2.5, 160, 4, [[0, '#f2f4f7'], [1, '#7c8591']], 2, '#2a303a');
    box(c, 74, 5, 5, 4, '#2b3038', 1, false); box(c, 212, 5, 5, 4, '#2b3038', 1, false);
  });
  P('antenna', 'antenna', 53, 1, 'small', { snd: 'ping' }, c => {
    const p = [[50, 10], [56, 2], [64, 2], [69, 8], [69, 11]];
    poly(c, p); c.fillStyle = lg(c, 0, 2, 0, 11, [[0, '#3a3f47'], [1, '#14161a']]); c.fill(); c.lineWidth = .8; c.strokeStyle = '#000'; c.stroke();
  });
  P('pillarB', 'B-oszlop', 48, 2, 'panel', { snd: 'metal' }, c => {
    const p = [[222, 23], [235, 23], [238, 72], [224, 72]];
    poly(c, p); c.fillStyle = lg(c, 222, 0, 238, 0, [[0, '#1d2026'], [1, '#383d46']]); c.fill(); c.lineWidth = 1; c.strokeStyle = '#08090b'; c.stroke();
  });
  P('pillarC', 'C-oszlop', 48, 2, 'panel', { snd: 'metal' }, c => {
    const p = [[131, 23], [143, 23], [129, 72], [117, 72]];
    poly(c, p); c.fillStyle = lg(c, 117, 0, 143, 0, [[0, '#1d2026'], [1, '#383d46']]); c.fill(); c.lineWidth = 1; c.strokeStyle = '#08090b'; c.stroke();
  });
  P('windshield', 'szélvédő', 55, 2, 'glass', { snd: 'glass' }, c => { glassFill(c, [[242, 13], [252, 12], [363, 70], [352, 73]]); });
  P('windowF', 'első oldalablak', 54, 2, 'glass', { snd: 'glass' }, c => { glassFill(c, [[236, 24], [253, 24], [339, 71], [236, 71]]); });
  P('windowR', 'hátsó oldalablak', 54, 2, 'glass', { snd: 'glass' }, c => { glassFill(c, [[144, 24], [220, 24], [220, 71], [130, 71]]); });
  P('windowQ', 'csomagtér-oldalablak', 54, 2, 'glass', { snd: 'glass' }, c => { glassFill(c, [[48, 24], [130, 24], [116, 71], [44, 71]]); });
  P('rearGlass', 'hátsó szélvédő', 55, 2, 'glass', { snd: 'glass' }, c => { glassFill(c, [[14, 20], [41, 13], [43, 72], [10, 72]], [[0, '#8fa9b8'], [.5, '#3d5666'], [1, '#1c2c38']]); });
  P('sill', 'küszöb', 60, 2, 'panel', { snd: 'metal' }, c => {
    metal(c, [[126, 146], [341, 146], [345, 157], [126, 157]], { st: [[0, '#cfd6de'], [1, '#5f6874']] });
  });
  function door(id, nm, x0, x1) {
    P(id, nm, 58, 4, 'panel', { heavy: 1, snd: 'metal' }, c => {
      metal(c, [[x0, 71], [x1, 71], [x1, 147], [x0, 147]], {
        fx: (c, b) => {
          c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0 + 3, 98); c.lineTo(x1 - 3, 98); c.stroke();
          c.strokeStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.moveTo(x0 + 3, 100.5); c.lineTo(x1 - 3, 100.5); c.stroke();
          c.strokeStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.moveTo(x0 + 4, 116); c.lineTo(x1 - 4, 116); c.stroke();
        }
      });
    });
  }
  door('doorF', 'első ajtó', 225, 340); door('doorR', 'hátsó ajtó', 128, 222);
  function handle(id, nm, x) { P(id, nm, 62, 1, 'small', { snd: 'small' }, c => { box(c, x, 79, 20, 5.5, [[0, '#f7f9fb'], [1, '#7e8895']], 2.5, '#2a303a'); }); }
  handle('handleF', 'első kilincs', 300); handle('handleR', 'hátsó kilincs', 196);
  P('mirror', 'külső tükör', 64, 1, 'small', { snd: 'small' }, c => {
    metal(c, [[326, 64], [343, 62], [346, 71], [332, 73]], { lw: 1 });
    c.fillStyle = '#243b4d'; c.fillRect(339, 63.6, 4, 6.4);
  });
  P('hood', 'motorháztető', 58, 4, 'panel', { heavy: 1, snd: 'metal' }, c => {
    metal(c, [[346, 73], [456, 89], [468, 98], [469, 107], [350, 107]], {
      fx: (c, b) => {
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(352, 80); c.lineTo(456, 94); c.stroke();
        c.strokeStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(352, 83.5); c.lineTo(458, 98); c.stroke();
        c.strokeStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(356, 100); c.lineTo(462, 102); c.stroke();
      }
    });
    cutArch(c, FX, WY, 42); lip(c, [[346, 73], [456, 89], [468, 98], [469, 107], [350, 107]], FX, WY, 42);
  });
  P('fenderF', 'első sárvédő', 57, 3, 'panel', { snd: 'metal' }, c => {
    const p = [[350, 107], [470, 107], [471, 138], [468, 152], [350, 152]];
    metal(c, p); cutArch(c, FX, WY, 42); lip(c, p, FX, WY, 42);
  });
  P('bumperF', 'első lökhárító', 60, 3, 'panel', { heavy: 1, snd: 'plastic' }, c => {
    const p = [[424, 128], [470, 121], [480, 131], [479, 151], [424, 153]];
    metal(c, p, { st: [[0, '#e2e7ed'], [.5, '#9aa4b0'], [1, '#4f5863']] });
    c.fillStyle = '#16181c'; c.fillRect(448, 142, 28, 5);
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(428, 131, 40, 1.4);
  });
  P('grille', 'hűtőrács', 61, 2, 'panel', { snd: 'plastic' }, c => {
    box(c, 462, 107, 15, 17, [[0, '#1d2025'], [1, '#08090b']], 2, '#6b727d');
    c.strokeStyle = '#7b828d'; c.lineWidth = .8; for (let y = 111; y < 123; y += 3) { c.beginPath(); c.moveTo(463, y); c.lineTo(476, y); c.stroke(); }
  });
  P('blitz', 'Opel Blitz-embléma', 62, 1, 'small', { snd: 'ping' }, c => {
    disc(c, 469, 116, 5.2, rg(c, 469, 115, 0, 6, [[0, '#ffffff'], [1, '#aab3bd']]), '#20252c', .9);
    c.strokeStyle = '#d4a017'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(464.6, 116); c.lineTo(473.4, 116); c.stroke();
    c.strokeStyle = '#111'; c.lineWidth = .8; c.stroke();
  });
  P('headlight', 'fényszóró', 61, 2, 'glass', { snd: 'glass' }, c => {
    const p = [[449, 91], [477, 98], [476, 108], [447, 105]];
    glassFill(c, p, [[0, '#fffbe0'], [.5, '#f3e6a0'], [1, '#b69f3c']]);
    disc(c, 460, 100, 3.4, '#fffef4', '#8b7a2b', .8);
  });
  P('fog', 'ködlámpa', 62, 1, 'glass', { snd: 'glass' }, c => { glassFill(c, [[438, 133], [458, 133], [458, 141], [438, 141]], [[0, '#fff6c9'], [1, '#b9a24a']]); });
  P('wiper', 'ablaktörlő', 59, 1, 'small', { snd: 'small' }, c => {
    c.lineCap = 'round'; c.strokeStyle = '#0b0c0e'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(318, 68); c.lineTo(354, 73); c.stroke();
  });
  P('tailgate', 'csomagtérajtó', 56, 4, 'panel', { heavy: 1, snd: 'metal' }, c => {
    const p = [[8, 73], [128, 73], [128, 152], [8, 152]];
    metal(c, p, { fx: (c, b) => { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(14, 98); c.lineTo(126, 98); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(14, 100.5); c.lineTo(126, 100.5); c.stroke(); } });
    cutArch(c, RX, WY, 42); lip(c, p, RX, WY, 42);
  });
  P('badge', 'ASTRA felirat', 63, 1, 'small', { snd: 'ping' }, c => {
    box(c, 52, 80, 38, 8, [[0, '#f2f4f7'], [1, '#8a94a1']], 2, '#2a303a'); c.fillStyle = '#1b2026'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.fillText('ASTRA', 71, 86.5);
  });
  P('tailLight', 'hátsó lámpa', 61, 2, 'glass', { snd: 'glass' }, c => {
    glassFill(c, [[6, 80], [20, 80], [20, 112], [8, 112]], [[0, '#ff7b6b'], [.5, '#d4221a'], [1, '#7a0d08']]);
  });
  P('bumperR', 'hátsó lökhárító', 60, 3, 'panel', { heavy: 1, snd: 'plastic' }, c => {
    const p = [[3, 116], [44, 118], [48, 153], [5, 151]];
    metal(c, p, { st: [[0, '#e2e7ed'], [.5, '#9aa4b0'], [1, '#4f5863']] });
    c.fillStyle = '#16181c'; c.fillRect(9, 132, 24, 4);
    c.fillStyle = '#ffd34d'; c.fillRect(33, 126, 8, 3);
  });

  // ---------- maszkok (ütközés) ----------
  const PAD = 3;
  function init(makeCanvas) {
    const cv = makeCanvas(W, H), c = cv.getContext('2d', { willReadFrequently: true });
    for (const d of defs) {
      c.clearRect(0, 0, W, H);
      if (d.bigHit) { c.beginPath(); const m = /bolt(.)(\d)/.exec(d.id); } // (a nagyobb találati zóna lent)
      d.draw(c, {});
      if (d.bigHit) {
        // a csavar találati zónáját megnöveljük (a rajz kicsi, de a játékos ne szenvedjen)
        const img0 = c.getImageData(0, 0, W, H).data; let sx = 0, sy = 0, n = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (img0[(y * W + x) * 4 + 3] > 40) { sx += x; sy += y; n++; }
        const mx = sx / n, my = sy / n; c.clearRect(0, 0, W, H); c.beginPath(); c.arc(mx, my, d.bigHit, 0, TAU); c.fillStyle = '#000'; c.fill();
        d.cx = mx; d.cy = my;
      }
      const img = c.getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (img[(y * W + x) * 4 + 3] > 50) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { d.bx = d.by = 0; d.bw = d.bh = 1; d.mask = new Uint8Array(1); continue; }
      d.bx = x0; d.by = y0; d.bw = x1 - x0 + 1; d.bh = y1 - y0 + 1; d.mask = new Uint8Array(d.bw * d.bh); let area = 0;
      for (let y = 0; y < d.bh; y++) for (let x = 0; x < d.bw; x++) if (img[((y + y0) * W + (x + x0)) * 4 + 3] > 50) { d.mask[y * d.bw + x] = 1; area++; }
      d.area = area;
    }
    defs.sort((a, b) => a.z - b.z);
  }

  // ---------- sprite (kirajzolt alkatrész adott méretarányban és sérülési szinten) ----------
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  function damageOverlay(c, d, stage, bx, by, bw, bh) {
    const r = rng(hash(d.id) + stage * 7);
    c.save(); c.globalCompositeOperation = 'source-atop';
    if (d.kind === 'glass') {
      const px = bx + bw * (.3 + r() * .4), py = by + bh * (.3 + r() * .4);
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = .8;
      const rays = 5 + stage * 3;
      for (let i = 0; i < rays; i++) { const a = r() * TAU, L = (8 + r() * 26) * (stage === 1 ? .8 : 1.3); c.beginPath(); c.moveTo(px, py); const mx = px + Math.cos(a) * L * .5 + (r() - .5) * 4, my = py + Math.sin(a) * L * .5 + (r() - .5) * 4; c.lineTo(mx, my); c.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); c.stroke(); }
      c.strokeStyle = 'rgba(255,255,255,.5)'; for (let k = 1; k <= 2; k++) { c.beginPath(); c.arc(px, py, k * 6, 0, TAU); c.stroke(); }
    } else {
      const n = 3 + stage * 5;
      for (let i = 0; i < n; i++) {
        const x = bx + r() * bw, y = by + r() * bh, L = 4 + r() * 12, a = r() * TAU;
        c.strokeStyle = r() < .5 ? 'rgba(20,20,25,.55)' : 'rgba(255,255,255,.35)'; c.lineWidth = .7 + r() * .6;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
      }
      if (stage >= 2) {
        for (let i = 0; i < 3; i++) { const x = bx + r() * bw, y = by + r() * bh, rr = 5 + r() * 9; const g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(0,0,0,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
        for (let i = 0; i < 6; i++) { const x = bx + r() * bw, y = by + r() * bh; c.fillStyle = 'rgba(150,80,30,.55)'; c.beginPath(); c.arc(x, y, .8 + r() * 1.8, 0, TAU); c.fill(); }
      }
    }
    c.restore();
  }

  function sprite(d, scale, stage, makeCanvas) {
    const x = d.bx - PAD, y = d.by - PAD, w = d.bw + PAD * 2, h = d.bh + PAD * 2;
    const cv = makeCanvas(Math.max(1, Math.ceil(w * scale)), Math.max(1, Math.ceil(h * scale)));
    const c = cv.getContext('2d'); c.scale(scale, scale); c.translate(-x, -y);
    d.draw(c, {});
    if (stage > 0) damageOverlay(c, d, stage, d.bx, d.by, d.bw, d.bh);
    return { cv, x, y, w, h, scale };
  }

  return { W, H, FX, RX, WY, TR, defs, init, sprite, drawWheel, rng };
})();
if (typeof module !== 'undefined') module.exports = Car;
