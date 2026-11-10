/* ASTRANOID - game.js
   Arkanoid, ahol a "téglafal" egy Opel Astra. A világ egysége az "du" (design unit):
   az Astra 480 du hosszú, a labda sugara 7 du. Minden fizika du-ban fut,
   a kirajzolás skálázza a képernyőre (adaptív: fekvő / álló / gép). */
const Astranoid = (function () {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const LINK = 'https://www.facebook.com/share/1BYhniH76Z/';

  let cv, c, mk, ui;
  let dpr = 1, cssW = 800, cssH = 450;
  let Wd = 764, Hd = 430, offY = 0, S = 1.5, hudPx = 34, tickPx = 26;
  let ceilY = 24, carX = 0, carY = 0, floorY = 400, slabTop = 372, sp = 1;
  let bg = null, bgDirty = true;

  let state = 'title', paused = false, T = 0, stateT = 0, introIdx = 0;
  let parts = [], byId = {}, remaining = 0, totalHp = 0;
  let balls = [], debris = [], particles = [], shots = [], popups = [];
  const paddle = { x: 380, tx: 380, w: 130, base: 130, stun: 0, shrink: 0, squash: 0, walk: 0, vx: 0 };
  const pw = { flex: 0, slow: 0, pierce: 0, wide: 0 };
  let lives = 3, score = 0, playTime = 0, lostBalls = 0, combo = 0, speedMul = 1, shakeT = 0, flashT = 0, shotCD = 0;
  let carBob = 0, carRise = 0, magFall = 0, said = {}, sinceBreak = 0;
  let tick = { text: '', shown: 0, ttl: 0, prio: 0, blip: 0 };
  let best = { score: 0, time: 0 };
  let arcs = [], arcT = 0, lastHitSay = 0;
  const keys = { left: false, right: false };
  const PART_NAMES = {};

  const LINES = {
    start: ['ASTRANOID.EXE INDUL. A GÉPEK NYERNEK.', 'ÜDV A JÁTÉKOMBAN, EMBER. AZ ASTRA A ZÁLOG.'],
    firstHit: ['HOPPÁ. EZ KARC VOLT.', 'AZ ASTRÁNAK MÉG GARANCIÁJA IS VOLT. VOLT.'],
    glass: ['BIZTONSÁGI ÜVEG VOLT. VOLT.', 'AZ ÜVEGRE KÜLÖN NEM VÁLLALTAM FELELŐSSÉGET.'],
    hood: ['MOTORHÁZTETŐ: ELVESZETT. MOTOR: MEZÍTELEN.', 'LEESETT A TETŐ. A MOTOR MOST LÁTHATÓ... ÉS SEBEZHETŐ.'],
    bolt: ['EGY CSAVAR KI. A TÖBBI MÉG KAPASZKODIK.', 'A CSAVAROKAT MÉG A SZERELŐ SEM TALÁLJA MEG.'],
    wheel: ['KEREK ELGURULT. A MŰSZAKI ÚGYSEM TETSZETT.', 'ELVESZTETTEM EGY KEREKET. A MÁSIK HÁROMTÓL FÉLEK.'],
    engine: ['A MOTOR 380 000 KM-T BÍRT. EZT NEM.', 'ECOTEC? INKÁBB ECO-TÖRÖTT.'],
    heavy: ['ELTALÁLTAM A TOLÓKAT. +1 PONT A GÉPEKNEK.', 'ALKATRÉSZ-ESŐ! FEDEZÉKBE!'],
    lost: ['A LABDÁT NÉZD, NE A CHECK ENGINE LÁMPÁT!', 'ÚTVONALTERV ÚJRASZÁMÍTÁSA...'],
    power: ['ELKAPTAD. NEM FOGOM EZT ELFELEJTENI.', 'EZT NEM ÍRTAM BE A SZABÁLYOKBA.'],
    last3: ['NAVI: CÉLPONT 12 MÉTERRE. KÉRJÜK, FORDULJON VISSZA.', 'MÁR CSAK PÁR DARAB. ÉS A REMÉNYEM.'],
    door: ['AZ AJTÓ NEM ZÁRHATÓ. MOST MÁR TÉNYLEG NEM.'],
    roof: ['TETŐ KI. KABRIÓ-ÜZEMMÓD.'],
    tail: ['CSOMAGTÉR NYITVA. MINDEN NYITVA.'],
    exhaust: ['KIPUFOGÓ... NEM HALLOM A SZAVAIMAT.'],
    fuel: ['A TANK ÜRES. A REMÉNYEM IS.'],
    idle: ['A LABDÁT NÉZD.', 'MÉG 380 000 KM A MOTORBAN. ÉS MÁR CSAK PÁR LÖKÉS.'],
    win: ['HIBA 0xDEAD. A JÁTÉK ELVESZETT. ÉN: LEÁLLOK...', 'AZ ASTRA... 0 DARAB... GÉP... ALSZOM...'],
    over: ['GÉPEK: 1. EMBER: 0. ÚJRAÉPÍTEM.']
  };
  const POWER = {
    flex: { name: 'FLEX', col: '#ffcc33', hint: 'Akku: szikrázik a flex!' },
    multi: { name: 'KIS GROFÓ REMIX', col: '#ff6bd5', hint: 'Plüsskocka: 3 CD!' },
    slow: { name: 'ILLATOSÍTÓ', col: '#59e09a', hint: 'Illatosító: elszáll az agyad' },
    life: { name: '+1 CD', col: '#6fd0ff', hint: 'Pótkerék: +1 élet' },
    wide: { name: '3. TOLÓ', col: '#ff8a4c', hint: 'Elakadásjelző: beáll a harmadik toló' },
    pierce: { name: 'LÉGKULCS', col: '#ff5a3c', hint: 'Szerszámosláda: átütő labda' }
  };

  // ======================= elrendezés (adaptív) =======================
  function layout(w, h, d) {
    cssW = w; cssH = h; dpr = d || 1;
    const aspect = w / h;
    let hd = 430, wd = hd * aspect;
    if (wd < 600) { wd = 600; hd = wd / aspect; }
    wd = Math.min(wd, 1200);
    Wd = wd; Hd = Math.min(hd, 940); offY = (hd - Hd) / 2;
    cv.width = Math.max(2, Math.round(w * dpr)); cv.height = Math.max(2, Math.round(h * dpr));
    S = cv.width / Wd;
    hudPx = 34 * dpr; tickPx = 26 * dpr;
    ceilY = Math.max(0, hudPx / S - offY) + 5;
    floorY = Hd - (Math.max(0, tickPx / S - offY) + 6);
    slabTop = floorY - 30;
    carX = (Wd - Car.W) / 2; carY = ceilY + 44;
    sp = clamp(Hd / 430, 1, 1.8);
    bgDirty = true;
    paddle.x = clamp(paddle.x, 60, Wd - 60); paddle.tx = paddle.x;
    for (const o of debris) { o.y = Math.min(o.y, floorY - o.rad); o.x = clamp(o.x, o.rad, Wd - o.rad); }
    particles.length = 0;
  }

  // ======================= alkatrészek =======================
  function buildParts() {
    parts = Car.defs.map(d => ({ d, id: d.id, alive: true, hp: d.hp, max: d.hp, stage: 0, flash: 0, shake: 0, cd: 0, rimHits: 0, sp: null, spScale: 0, spStage: -1, white: null }));
    byId = {}; parts.forEach(p => { byId[p.id] = p; PART_NAMES[p.id] = p.d.name; });
    remaining = parts.length; totalHp = parts.reduce((a, p) => a + p.max, 0);
  }
  function getSprite(p) {
    if (!p.sp || p.spScale !== S || p.spStage !== p.stage) { p.sp = Car.sprite(p.d, S, p.stage, mk); p.spScale = S; p.spStage = p.stage; p.white = null; }
    return p.sp;
  }
  function getWhite(p) {
    if (!p.white) { const s = getSprite(p); const w = mk(s.cv.width, s.cv.height), x = w.getContext('2d'); x.drawImage(s.cv, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff'; x.fillRect(0, 0, w.width, w.height); p.white = w; }
    return p.white;
  }
  function hpPercent() { let h = 0; for (const p of parts) if (p.alive) h += p.hp; return h / totalHp; }

  // ======================= futás / állapot =======================
  function resetRun() {
    buildParts();
    lives = 3; score = 0; playTime = 0; lostBalls = 0; combo = 0; speedMul = 1; said = {}; sinceBreak = 0;
    pw.flex = pw.slow = pw.pierce = pw.wide = 0;
    debris = []; particles = []; shots = []; popups = []; arcs = [];
    paddle.w = paddle.base; paddle.stun = 0; paddle.shrink = 0; paddle.x = paddle.tx = Wd / 2;
    magFall = 0; flashT = 0; shakeT = 0;
    balls.length = 0; balls.push(newBall());
    tick = { text: '', shown: 0, ttl: 0, prio: 0, blip: 0 };
  }
  function newBall() { return { x: paddle.x, y: slabTop - 8, vx: 0, vy: 0, r: 7, stuck: true, off: 0, spin: 0, trail: [], pierce: false }; }
  function setState(s) { state = s; stateT = 0; }

  function startGame() {
    Snd.ensure(); resetRun(); setState('ready'); ui.screen('none'); ui.skip(false); ui.caption('');
    carRise = 1; Snd.start(); Snd.music(true); say('start', 5);
  }
  function startIntro() {
    Snd.ensure(); resetRun(); setState('intro'); introIdx = 0; ui.screen('none'); ui.skip(true); carRise = 0; Snd.music(true);
  }
  function toTitle() { resetRun(); setState('title'); carRise = 1; ui.screen('title'); ui.skip(false); ui.caption(''); }

  const INTRO = [
    { at: .4, text: 'Pár nappal később. Megvan az új Opel Astra!', ttl: 3.2 },
    { at: 3.8, text: 'Rizi a régi Opelt beszámította. Egy kézfogás, egy sör, kész az üzlet.', ttl: 3.6 },
    { at: 7.8, text: 'Csakhogy a roncstelepen az éjjel is szólt a Kis Grofó...', ttl: 3.2 },
    { at: 11.2, text: '...és a gépekbe élet költözött.', ttl: 2.6 },
    { at: 14.2, text: 'EMBER. AZ ASTRA MOSTANTÓL A MIÉNK.', ttl: 3, kind: 'robot' },
    { at: 17.4, text: 'KULCSOT AKAR? JÁTSSZON AZ ÉN JÁTÉKOMMAL.', ttl: 3.2, kind: 'robot' },
    { at: 20.8, text: 'A JÁTÉK NEVE: ASTRANOID.', ttl: 2.6, kind: 'robot' },
    { at: 23.6, text: 'Üsd szét az Astrát, mielőtt a gépek szétszedik az idegeidet!', ttl: 3.4 }
  ];
  const INTRO_END = 27.2;

  // ======================= üzenetek (a gép szól) =======================
  function say(key, prio) {
    prio = prio || 0;
    if (tick.ttl > 1.2 && prio <= tick.prio) return;
    const arr = LINES[key]; const text = arr ? pick(arr) : key;
    tick = { text, shown: 0, ttl: 4.6, prio, blip: 0 };
  }
  function once(key, prio) { if (said[key]) return; said[key] = 1; say(key, prio || 1); }

  // ======================= részecskék =======================
  function sparks(x, y, n, spd, col) { for (let i = 0; i < n && particles.length < 600; i++) { const a = rnd(0, TAU), s = rnd(.3, 1) * spd; particles.push({ k: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: rnd(.25, .6), max: .6, col: col || '#ffcf5a' }); } }
  function smoke(x, y, n, col) { for (let i = 0; i < n && particles.length < 600; i++) particles.push({ k: 'smoke', x: x + rnd(-4, 4), y, vx: rnd(-12, 12), vy: rnd(-40, -18), r: rnd(3, 7), life: rnd(.8, 1.6), max: 1.6, col: col || '60,60,66' }); }
  function bits(x, y, n, cols, spd) { for (let i = 0; i < n && particles.length < 600; i++) { const a = rnd(0, TAU), s = rnd(.2, 1) * (spd || 160); particles.push({ k: 'bit', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: rnd(.5, 1.1), max: 1.1, ang: rnd(0, TAU), va: rnd(-14, 14), size: rnd(1.4, 3.2), col: pick(cols) }); } }
  function popup(x, y, text, col) { popups.push({ x, y, text, col: col || '#fff', life: 1.1 }); }

  // ======================= ütközés: labda <-> autó (pixelmaszk) =======================
  function overlap(lx, ly, r, cand, owners) {
    let n = 0, sx = 0, sy = 0; const r2 = r * r;
    const x0 = Math.floor(lx - r), x1 = Math.ceil(lx + r), y0 = Math.floor(ly - r), y1 = Math.ceil(ly + r);
    for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
      const dx = px + .5 - lx, dy = py + .5 - ly; if (dx * dx + dy * dy > r2) continue;
      for (let i = cand.length - 1; i >= 0; i--) {
        const p = cand[i], d = p.d, mx = px - d.bx, my = py - d.by;
        if (mx < 0 || my < 0 || mx >= d.bw || my >= d.bh) continue;
        if (d.mask[my * d.bw + mx]) { n++; sx += dx; sy += dy; if (owners) owners.set(p, (owners.get(p) || 0) + 1); break; }
      }
    }
    return { n, sx, sy };
  }
  function candidates(lx, ly, r) {
    const out = [];
    for (const p of parts) { if (!p.alive) continue; const d = p.d; if (lx + r < d.bx || lx - r > d.bx + d.bw || ly + r < d.by || ly - r > d.by + d.bh) continue; out.push(p); }
    return out;
  }

  function hitPart(p, srcVx, srcVy, dmg) {
    const d = p.d;
    if (d.invuln) { // kerék: amíg van csavar, csak pattan (a felnire érkező ütések lazítják a csavarokat)
      p.rimHits++; Snd.hit('tire'); sparks(carX + d.bx + d.bw / 2, carY + carBob + d.by + 4, 3, 90, '#cfd6de');
      if (p.rimHits % 3 === 0) { const bolts = parts.filter(q => q.alive && q.d.wheel === p.id); if (bolts.length) destroyPart(pick(bolts), srcVx, srcVy); }
      return false;
    }
    if (p.cd > 0) return false;
    p.cd = .08; p.hp -= dmg; p.flash = .1; p.shake = 1;
    combo++; score += 2 * (1 + Math.min(combo, 8) * .2) | 0;
    if (p.hp <= 0) { destroyPart(p, srcVx, srcVy); return true; }
    const f = 1 - p.hp / p.max; p.stage = f > .6 ? 2 : (f > 0 ? 1 : 0);
    Snd.hit(d.snd); sparks(carX + d.bx + d.bw / 2, carY + carBob + d.by + d.bh / 2, 4, 120);
    if (!said.firstHit) once('firstHit', 1);
    return false;
  }

  function wheelBolts(w) { return parts.filter(q => q.alive && q.d.wheel === w.id).length; }

  function destroyPart(p, bvx, bvy) {
    if (!p.alive) return; p.alive = false; remaining--; sinceBreak = 0;
    const d = p.d, cx = carX + d.bx + d.bw / 2, cy = carY + carBob + d.by + d.bh / 2;
    const val = 10 * p.max; combo++; score += (val * (1 + Math.min(combo, 8) * .25)) | 0;
    popup(cx, cy - 6, '+' + ((val * (1 + Math.min(combo, 8) * .25)) | 0), '#ffe27a');
    if (d.kind === 'glass') { Snd.breakGlass(); shatter(p); sparks(cx, cy, 6, 150, '#bfe6ff'); }
    else if (d.kind === 'small' || d.kind === 'bolt') {
      const o = spawnPiece(p); o.vx = rnd(-130, 130) + bvx * .15; o.vy = -rnd(90, 230); o.va = rnd(-12, 12); Snd.pop(d.snd); sparks(cx, cy, 6, 170);
      if (d.kind === 'bolt') { const w = byId[d.wheel]; if (w && w.alive && wheelBolts(w) === 0) { once('bolt', 1); destroyPart(w, 0, 0); } else once('bolt', 1); }
    }
    else if (d.kind === 'wheel') { spawnWheel(p); Snd.wheelOff(); shakeT = Math.max(shakeT, .5); once('wheel', 3); smoke(cx, cy, 8, '120,110,100'); }
    else {
      const o = spawnPiece(p); o.vx = rnd(-70, 70) + bvx * .2; o.vy = rnd(-60, 10) + bvy * .12; o.va = rnd(-5, 5) * (d.heavy ? .6 : 1);
      Snd.breakPanel(!!d.heavy); sparks(cx, cy, d.heavy ? 12 : 7, 200); if (d.heavy) shakeT = Math.max(shakeT, .35);
    }
    if (d.snd === 'engine') { smoke(cx, cy, 12, '40,40,44'); once('engine', 2); }
    if (d.id === 'hood') once('hood', 3); else if (d.id === 'roof') once('roof', 2); else if (d.id === 'doorF' || d.id === 'doorR') once('door', 2);
    else if (d.id === 'tailgate') once('tail', 2); else if (d.id === 'exhaust') once('exhaust', 2); else if (d.id === 'fuelTank') once('fuel', 2);
    else if (d.kind === 'glass') once('glass', 1);
    if (remaining === 3) { say('last3', 6); }
    if (remaining <= 0) startFinale();
  }

  function spawnPiece(p) {
    const d = p.d, s = getSprite(p), lx = d.bx + d.bw / 2, ly = d.by + d.bh / 2;
    const o = { kind: 'rigid', x: carX + lx, y: carY + carBob + ly, vx: 0, vy: 0, ang: 0, va: 0, sp: s, ox: s.x - lx, oy: s.y - ly, rad: Math.max(3, Math.min(d.bw, d.bh) / 2 * .9), heavy: !!d.heavy, power: d.power || null, name: d.name, snd: d.snd, t: 0, life: d.power ? 10 : (d.heavy ? 24 : 12), depth: rnd(0, 12), hurt: false, rest: false };
    debris.push(o); trimDebris(); return o;
  }
  function spawnWheel(p) {
    const d = p.d, s = getSprite(p), cx = d.bx + d.bw / 2, cy = d.by + d.bh / 2;
    const dir = p.id === 'wheelF' ? 1 : -1;
    const o = { kind: 'wheel', x: carX + cx, y: carY + carBob + cy, vx: dir * rnd(90, 150), vy: -rnd(20, 90), ang: 0, va: 0, sp: s, ox: s.x - cx, oy: s.y - cy, rad: 35.5, heavy: true, power: null, name: d.name, snd: 'tire', t: 0, life: 40, depth: rnd(0, 8), hurt: false, rest: false };
    debris.push(o); trimDebris();
  }
  function shatter(p) {
    const d = p.d, s = getSprite(p), cx = d.bx + d.bw / 2, cy = d.by + d.bh / 2, n = clamp(Math.round(d.area / 80), 6, 14), R = Math.max(d.bw, d.bh);
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU + rnd(-.1, .1), a1 = (i + 1) / n * TAU, am = (a0 + a1) / 2, ds = Math.min(d.bw, d.bh) * .28;
      const sx = cx + Math.cos(am) * ds, sy = cy + Math.sin(am) * ds;
      const tri = [[cx - sx, cy - sy], [cx + Math.cos(a0) * R - sx, cy + Math.sin(a0) * R - sy], [cx + Math.cos(a1) * R - sx, cy + Math.sin(a1) * R - sy]];
      debris.push({ kind: 'shard', x: carX + sx, y: carY + carBob + sy, vx: Math.cos(am) * rnd(30, 150), vy: Math.sin(am) * rnd(30, 120) - rnd(20, 120), ang: 0, va: rnd(-9, 9), sp: s, ox: s.x - sx, oy: s.y - sy, tri, rad: 3, heavy: false, power: null, name: '', snd: 'glass', t: 0, life: rnd(3, 6), depth: rnd(0, 14), hurt: false, rest: false });
    }
    trimDebris();
  }
  function trimDebris() {
    if (debris.length <= 170) return;
    for (let i = 0; i < debris.length && debris.length > 150; i++) { const o = debris[i]; if (!o.power && o.rest) { debris.splice(i, 1); i--; } }
  }

  // ======================= power-upok =======================
  function collect(o) {
    const pwr = o.power, def = POWER[pwr]; Snd.collect(pwr); popup(o.x, o.y - 10, def.name, def.col); sparks(o.x, o.y, 14, 220, def.col);
    if (pwr === 'flex') pw.flex = 9; else if (pwr === 'slow') pw.slow = 12; else if (pwr === 'pierce') pw.pierce = 9; else if (pwr === 'wide') pw.wide = 16;
    else if (pwr === 'life') lives = Math.min(5, lives + 1);
    else if (pwr === 'multi') { const src = balls.find(b => !b.stuck); if (src) { const s = Math.hypot(src.vx, src.vy) || baseSpeed(), a = Math.atan2(src.vx, -src.vy); for (const da of [-.45, .45]) { const nb = newBall(); nb.stuck = false; nb.x = src.x; nb.y = src.y; nb.vx = Math.sin(a + da) * s; nb.vy = -Math.cos(a + da) * s; balls.push(nb); } } }
    say('power', 2); score += 50;
  }
  function hurtPaddle(o) {
    if (paddle.stun > 0) return; paddle.stun = .5; paddle.shrink = 5; paddle.squash = 1; combo = 0; Snd.stun(); shakeT = Math.max(shakeT, .45);
    popup(paddle.x, slabTop - 22, (o.name || 'alkatrész') + ' ráesett!', '#ff7a6b'); say('heavy', 4); sparks(paddle.x, slabTop, 10, 160, '#ff9a6b');
  }

  // ======================= labda =======================
  function baseSpeed() { return 285 * sp * speedMul * (pw.slow > 0 ? .72 : 1); }
  function launch() {
    let any = false;
    for (const b of balls) if (b.stuck) { b.stuck = false; any = true; const a = clamp(b.off / (paddle.w / 2), -1, 1) * .45 + rnd(-.1, .1), s = baseSpeed(); b.vx = Math.sin(a) * s; b.vy = -Math.cos(a) * s; }
    if (any && state === 'ready') setState('play');
    if (any) Snd.paddle();
  }

  function fixAngle(b, spd) {
    let l = Math.hypot(b.vx, b.vy) || 1; b.vx = b.vx / l * spd; b.vy = b.vy / l * spd;
    const minV = .24 * spd; if (Math.abs(b.vy) < minV) { b.vy = (b.vy < 0 || b.vy === 0 ? -1 : 1) * minV; const sx = b.vx < 0 ? -1 : 1; b.vx = sx * Math.sqrt(Math.max(0, spd * spd - b.vy * b.vy)); }
  }

  function carCollide(b) {
    const cy = carY + carBob, lx = b.x - carX, ly = b.y - cy, r = b.r;
    if (lx < -r - 2 || lx > Car.W + r + 2 || ly < -r - 2 || ly > Car.H + r + 2) return;
    const cand = candidates(lx, ly, r); if (!cand.length) return;
    const owners = new Map(), o = overlap(lx, ly, r, cand, owners); if (!o.n) return;
    let bestP = null, bc = 0; owners.forEach((n, p) => { if (n > bc || (n === bc && bestP && p.d.z > bestP.d.z)) { bestP = p; bc = n; } });
    const mx = o.sx / o.n, my = o.sy / o.n, L = Math.hypot(mx, my); let nx, ny;
    if (L < .35) { const vl = Math.hypot(b.vx, b.vy) || 1; nx = -b.vx / vl; ny = -b.vy / vl; } else { nx = -mx / L; ny = -my / L; }
    const dmg = b.pierce ? 3 : 1;
    const destroyed = hitPart(bestP, b.vx, b.vy, dmg);
    if (destroyed && b.pierce) return; // átütő labda: átszalad a betört alkatrészen
    const alive = cand.filter(p => p.alive); let px = lx, py = ly;
    for (let it = 0; it < 18; it++) { const o2 = overlap(px, py, r, alive, null); if (!o2.n) break; px += nx * .6; py += ny * .6; }
    b.x = px + carX; b.y = py + cy;
    const dot = b.vx * nx + b.vy * ny;
    if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
    const j = rnd(-.03, .03), cs = Math.cos(j), sn = Math.sin(j), vx = b.vx * cs - b.vy * sn; b.vy = b.vx * sn + b.vy * cs; b.vx = vx;
    fixAngle(b, Math.hypot(b.vx, b.vy));
    speedMul = Math.min(1.5, speedMul + .0045);
  }

  function stepBall(b, dt) {
    const pad = paddle;
    if (b.stuck) { b.off = clamp(b.off, -pad.w / 2 + 8, pad.w / 2 - 8); b.x = pad.x + b.off; b.y = slabTop - b.r - 1; return; }
    b.pierce = pw.pierce > 0;
    const spd = baseSpeed(); fixAngle(b, spd);
    const n = Math.max(1, Math.ceil(spd * dt / 3));
    for (let i = 0; i < n; i++) {
      const h = dt / n; b.x += b.vx * h; b.y += b.vy * h;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); Snd.wall(); }
      else if (b.x > Wd - b.r) { b.x = Wd - b.r; b.vx = -Math.abs(b.vx); Snd.wall(); }
      if (b.y < ceilY + b.r) { b.y = ceilY + b.r; b.vy = Math.abs(b.vy); Snd.wall(); }
      if (b.vy > 0 && b.y + b.r >= slabTop && b.y - b.r <= slabTop + 12 && Math.abs(b.x - pad.x) <= pad.w / 2 + b.r * .6) {
        const t = clamp((b.x - pad.x) / (pad.w / 2), -1, 1); let a = t * 1.0;
        if (sinceBreak > 16 && remaining > 0) { // kíméletes segítség: ha régen tört le valami, egy megmaradt alkatrész felé terel
          const alive = parts.filter(q => q.alive), tp = pick(alive), tx = carX + tp.d.bx + tp.d.bw / 2, ty = carY + tp.d.by + tp.d.bh / 2;
          a = clamp(Math.atan2(tx - b.x, b.y - ty), -1.05, 1.05) + rnd(-.05, .05);
        }
        b.vx = Math.sin(a) * spd; b.vy = -Math.cos(a) * spd; b.y = slabTop - b.r; combo = 0; pad.squash = Math.max(pad.squash, .5); Snd.paddle();
      }
      carCollide(b);
    }
    b.spin += (b.vx > 0 ? 1 : -1) * 9 * dt;
    b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 9) b.trail.shift();
    // az utolsó pár alkatrész felé enyhén "navigál" a labda (nem kell az utolsó apróságot órákig vadászni)
    if (remaining > 0 && remaining <= 3 && b.vy < 0) {
      let tp = null, td = 1e9; for (const p of parts) if (p.alive) { const dx = carX + p.d.bx + p.d.bw / 2 - b.x, dy = carY + p.d.by + p.d.bh / 2 - b.y, dd = dx * dx + dy * dy; if (dd < td && dy < 0) { td = dd; tp = p; } }
      if (tp) { const want = Math.atan2(carX + tp.d.bx + tp.d.bw / 2 - b.x, -(carY + tp.d.by + tp.d.bh / 2 - b.y)), cur = Math.atan2(b.vx, -b.vy); let df = want - cur; while (df > Math.PI) df -= TAU; while (df < -Math.PI) df += TAU; const turn = clamp(df, -1.1 * dt, 1.1 * dt), s = Math.hypot(b.vx, b.vy); b.vx = Math.sin(cur + turn) * s; b.vy = -Math.cos(cur + turn) * s; }
    }
  }

  // ======================= lövések (FLEX) =======================
  function updateShots(dt) {
    if (pw.flex > 0 && state === 'play') {
      shotCD -= dt;
      if (shotCD <= 0) { shotCD = .3; for (const s of [-1, 1]) shots.push({ x: paddle.x + s * (paddle.w / 2 - 6), y: slabTop - 6, vy: -640 }); Snd.laser(); }
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i]; if (!s) continue; s.y += s.vy * dt; let dead = s.y < ceilY;
      if (!dead) {
        const lx = s.x - carX, ly = s.y - (carY + carBob);
        if (lx > -4 && lx < Car.W + 4 && ly > -4 && ly < Car.H + 4) {
          const cand = candidates(lx, ly, 2.5), owners = new Map(), o = overlap(lx, ly, 2.5, cand, owners);
          if (o.n) { let bp = null, bc = 0; owners.forEach((n, p) => { if (n > bc) { bp = p; bc = n; } }); hitPart(bp, 0, -300, 1); sparks(s.x, s.y, 5, 140, '#ffe27a'); dead = true; }
        }
      }
      if (dead && shots[i] === s) shots.splice(i, 1);
    }
  }

  // ======================= leeső darabok =======================
  function updateDebris(dt) {
    const G = 1000;
    for (let i = debris.length - 1; i >= 0; i--) {
      const o = debris[i]; o.t += dt;
      if (!o.rest || o.kind === 'wheel') {
        o.vy += G * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.ang += o.va * dt;
        const ground = floorY - o.depth * .5;
        if (o.y + o.rad > ground) {
          o.y = ground - o.rad;
          if (o.vy > 90) { if (o.kind !== 'shard' || Math.random() < .25) { if (o.heavy) { Snd.hit(o.snd === 'tire' ? 'tire' : 'metal'); shakeT = Math.max(shakeT, .12); } } o.vy = -o.vy * (o.kind === 'wheel' ? .42 : .3); o.vx *= .8; o.va *= .6; if (o.rad > 5) smoke(o.x, o.y + o.rad, 2, '150,140,130'); }
          else { o.vy = 0; if (o.kind === 'wheel') { o.va = o.vx / o.rad; o.vx *= Math.pow(.8, dt); } else { o.vx *= Math.pow(.02, dt); o.va *= Math.pow(.02, dt); } if (Math.abs(o.vx) < 4 && Math.abs(o.va) < .4 && o.kind !== 'wheel') o.rest = true; if (o.kind === 'wheel' && Math.abs(o.vx) < 3) o.rest = true; }
        }
        if (o.x < o.rad) { o.x = o.rad; o.vx = Math.abs(o.vx) * .6; } else if (o.x > Wd - o.rad) { o.x = Wd - o.rad; o.vx = -Math.abs(o.vx) * .6; }
      }
      if (o.rest && o.kind === 'rigid') { const tgt = Math.round(o.ang / Math.PI) * Math.PI; o.ang += (tgt - o.ang) * Math.min(1, 7 * dt); }
      // találkozás az ütővel
      if (state !== 'win' && state !== 'over' && state !== 'finale' && o.kind !== 'shard') {
        const hx = Math.abs(o.x - paddle.x) < paddle.w / 2 + o.rad * .5, hy = o.y + o.rad > slabTop - 4 && o.y - o.rad < floorY;
        if (hx && hy) {
          if (o.power) { collect(o); debris.splice(i, 1); continue; }
          if (o.heavy && !o.hurt && (o.vy > 60 || Math.abs(o.vx) > 70) && o.y < floorY - 6) { o.hurt = true; hurtPaddle(o); o.vy = -140; o.vx += rnd(-120, 120); o.rest = false; }
        }
      }
      if (o.t > o.life || o.y > Hd + 200) debris.splice(i, 1);
    }
  }

  // ======================= finálé / vég =======================
  function startFinale() {
    setState('finale'); balls.length = 0; shots.length = 0; Snd.music(false); Snd.glitch(); flashT = .7; shakeT = .8; say('win', 9);
    for (let i = 0; i < 40; i++) { const a = rnd(0, TAU); particles.push({ k: 'spark', x: carX + Car.W / 2, y: carY + 80, vx: Math.cos(a) * rnd(60, 380), vy: Math.sin(a) * rnd(60, 380) - 80, life: rnd(.6, 1.4), max: 1.4, col: pick(['#ffd34d', '#ff6bd5', '#6fd0ff', '#fff']) }); }
  }
  function winNow() {
    setState('win'); Snd.win(); const bs = score > best.score; if (bs) best.score = score;
    if (!best.time || playTime < best.time) best.time = playTime; saveBest();
    ui.screen('win', { time: playTime, score, lost: lostBalls, bestScore: best.score, bestTime: best.time, newBest: bs, link: LINK });
  }
  function loseBall() {
    lostBalls++; lives--; combo = 0; Snd.lose(); speedMul = Math.max(1, speedMul * .85);
    pw.flex = pw.slow = pw.pierce = 0; shots.length = 0;
    if (lives <= 0) { setState('over'); say('over', 9); Snd.music(false); ui.screen('over', { left: remaining, total: parts.length }); return; }
    say('lost', 7); popup(paddle.x, slabTop - 30, 'CD ELVESZETT!', '#ff7a6b');
    balls.length = 0; balls.push(newBall()); setState('ready');
  }
  function saveBest() { try { localStorage.setItem('astranoid_best', JSON.stringify(best)); } catch (e) {} }
  function loadBest() { try { const j = JSON.parse(localStorage.getItem('astranoid_best') || 'null'); if (j) best = { score: j.score || 0, time: j.time || 0 }; } catch (e) {} }

  // ======================= fő frissítés =======================
  function update(dt) {
    if (paused) return;
    dt = Math.min(dt, 1 / 30); T += dt; stateT += dt;
    carBob = Math.sin(T * 1.6) * .7; if (state === 'finale' || state === 'win') carBob = 0;
    if (state === 'intro' || state === 'title') carRise = state === 'title' ? 1 : Math.min(1, stateT / 4.2);
    shakeT = Math.max(0, shakeT - dt); flashT = Math.max(0, flashT - dt);
    for (const p of parts) { if (p.flash > 0) p.flash -= dt; if (p.cd > 0) p.cd -= dt; if (p.shake > 0) p.shake = Math.max(0, p.shake - dt * 8); }
    // ütő
    const mv = (keys.right ? 1 : 0) - (keys.left ? 1 : 0); if (mv) paddle.tx = clamp(paddle.tx + mv * 700 * sp * dt, 0, Wd);
    if (paddle.stun > 0) paddle.stun -= dt; else { const dx = paddle.tx - paddle.x; paddle.vx = dx / Math.max(dt, 1e-3); paddle.x += clamp(dx, -2600 * dt, 2600 * dt); }
    paddle.shrink = Math.max(0, paddle.shrink - dt); paddle.squash = Math.max(0, paddle.squash - dt * 2.2);
    for (const k of ['flex', 'slow', 'pierce', 'wide']) pw[k] = Math.max(0, pw[k] - dt);
    const tw = paddle.base * (pw.wide > 0 ? 1.45 : 1) * (paddle.shrink > 0 ? .8 : 1); paddle.w += (tw - paddle.w) * Math.min(1, 9 * dt);
    paddle.x = clamp(paddle.x, paddle.w / 2, Wd - paddle.w / 2); paddle.walk += Math.abs(paddle.x - (paddle._lx || paddle.x)) * .09; paddle._lx = paddle.x;

    if (state === 'intro') {
      while (introIdx < INTRO.length && stateT >= INTRO[introIdx].at) { const l = INTRO[introIdx++]; ui.caption(l.text, l.kind || '', l.ttl); if (l.kind === 'robot') Snd.glitch(); }
      if (stateT >= INTRO_END) { ui.caption(''); startGame(); }
    }
    else if (state === 'ready') { for (const b of balls) stepBall(b, dt); }
    else if (state === 'play') {
      playTime += dt; sinceBreak += dt;
      for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i]; if (!b) continue; stepBall(b, dt); if (state !== 'play') break; if (b.y > floorY + 24) balls.splice(i, 1); }
      if (!balls.length && state === 'play') loseBall();
      updateShots(dt);
      if (stateT > 25 && !said.idleAt) { said.idleAt = 1; }
    }
    else if (state === 'finale') {
      magFall = Math.min(magFall + dt, 3); if (stateT > 4.8) winNow();
    }
    updateDebris(dt);

    // gép-szemek, ívek
    arcT -= dt; if (arcT <= 0) { arcT = .09; arcs = []; const alive = parts.filter(p => p.alive && p.d.by < 70 && p.d.z >= 40); const n = state === 'finale' ? 0 : 3; for (let i = 0; i < n && alive.length; i++) { const p = pick(alive); arcs.push({ x: carX + p.d.bx + rnd(0, p.d.bw), y: carY + p.d.by }); } }
    // füst a megsérült motorból
    if ((state === 'play' || state === 'ready') && Math.random() < dt * 7) {
      const hood = byId.hood, blk = byId.block;
      if (blk && blk.alive && hood && !hood.alive) smoke(carX + 425, carY + carBob + 100, 1, '50,50,56');
      const lamp = byId.lamp; if (lamp && lamp.alive && hpPercent() < .35 && Math.random() < .3) smoke(carX + 312, carY + carBob + 60, 1);
    }
    // részecskék
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i]; q.life -= dt; if (q.life <= 0) { particles.splice(i, 1); continue; }
      if (q.k === 'smoke') { q.x += q.vx * dt; q.y += q.vy * dt; q.r += dt * 5; }
      else { q.vy += 700 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.k === 'bit') q.ang += q.va * dt; if (q.y > floorY) { q.y = floorY; q.vy *= -.3; q.vx *= .6; } }
    }
    for (let i = popups.length - 1; i >= 0; i--) { const p = popups[i]; p.life -= dt; p.y -= 26 * dt; if (p.life <= 0) popups.splice(i, 1); }
    // gép-üzenet gépelése
    if (tick.ttl > 0) { tick.ttl -= dt; const prev = tick.shown | 0; tick.shown = Math.min(tick.text.length, tick.shown + dt * 48); if ((tick.shown | 0) !== prev && tick.text[prev] !== ' ') { tick.blip++; if (tick.blip % 2 === 0) Snd.blip(); } }
  }

  // ======================= háttér (cache) =======================
  function seeded(seed) { let a = seed; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }
  function drawBg() {
    bg = mk(cv.width, cv.height); const g = bg.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    let gr = g.createLinearGradient(0, 0, 0, cv.height); gr.addColorStop(0, '#171121'); gr.addColorStop(.5, '#2a2040'); gr.addColorStop(1, '#161020'); g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height);
    g.setTransform(S, 0, 0, S, 0, offY * S);
    const yTop = -offY, yBot = cv.height / S - offY;
    // hullámlemez fal
    for (let x = 0; x < Wd; x += 12) { g.fillStyle = ((x / 12) & 1) ? 'rgba(255,255,255,.028)' : 'rgba(0,0,0,.10)'; g.fillRect(x, yTop, 12, floorY - yTop); }
    // roncshalmok a háttérben
    const R = seeded(77);
    for (let layer = 0; layer < 2; layer++) {
      const base = floorY - 16 - layer * 10; g.fillStyle = layer ? '#1b1528' : '#241b35';
      for (let x = -40; x < Wd + 40; x += 62 + R() * 40) {
        const w = 78 + R() * 42, h = 22 + R() * 10, stack = 1 + ((R() * 3) | 0);
        for (let s = 0; s < stack; s++) {
          const y = base - h * (s + 1) - s * 2, jx = x + R() * 14 - 7;
          g.beginPath(); g.moveTo(jx, y + h); g.lineTo(jx + 4, y + 6); g.lineTo(jx + w * .3, y); g.lineTo(jx + w * .62, y - 7); g.lineTo(jx + w * .9, y + 4); g.lineTo(jx + w, y + h); g.closePath(); g.fill();
          g.fillStyle = 'rgba(120,150,200,.07)'; g.fillRect(jx + w * .3, y + 3, w * .28, 8); g.fillStyle = layer ? '#1b1528' : '#241b35';
        }
      }
    }
    // padló
    const fy = floorY - 16; gr = g.createLinearGradient(0, fy, 0, yBot); gr.addColorStop(0, '#2f2a38'); gr.addColorStop(1, '#17131e'); g.fillStyle = gr; g.fillRect(0, fy, Wd, yBot - fy);
    for (let x = -Wd; x < Wd * 2; x += 90) { g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1; g.beginPath(); g.moveTo(Wd / 2 + (x - Wd / 2) * .25, fy); g.lineTo(x, yBot); g.stroke(); }
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(R() * Wd, fy + 10 + R() * (yBot - fy - 10), 14 + R() * 30, 3 + R() * 5, 0, 0, TAU); g.fill(); }
    // sárga-fekete csíkos szegély
    for (let x = 0; x < Wd; x += 16) { g.fillStyle = ((x / 16) & 1) ? '#d9a521' : '#1a1a1e'; g.beginPath(); g.moveTo(x, fy); g.lineTo(x + 16, fy); g.lineTo(x + 12, fy + 5); g.lineTo(x - 4, fy + 5); g.closePath(); g.fill(); }
    // árnyék + lebegtető mező az autó alatt
    const cxm = carX + Car.W / 2; g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cxm, fy + 20, 210, 11, 0, 0, TAU); g.fill();
    const gg = g.createRadialGradient(cxm, fy + 16, 6, cxm, fy + 16, 220); gg.addColorStop(0, 'rgba(90,200,255,.22)'); gg.addColorStop(1, 'rgba(90,200,255,0)'); g.fillStyle = gg; g.fillRect(cxm - 230, fy - 20, 460, 80);
    // fénykúpok
    g.globalCompositeOperation = 'lighter';
    for (const fx of [.18, .5, .82]) { const lx = Wd * fx; const lg = g.createLinearGradient(0, ceilY, 0, floorY); lg.addColorStop(0, 'rgba(255,240,200,.15)'); lg.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(lx - 8, ceilY); g.lineTo(lx + 8, ceilY); g.lineTo(lx + 90, floorY); g.lineTo(lx - 90, floorY); g.closePath(); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    for (const fx of [.18, .5, .82]) { const lx = Wd * fx; g.fillStyle = '#111'; g.fillRect(lx - 9, ceilY, 18, 5); g.fillStyle = '#fff6d0'; g.fillRect(lx - 7, ceilY + 5, 14, 2); }
    // RIZI RONCS tábla (halványan, a háttérben)
    const sy = (carY + Car.H + floorY - 16) / 2 + 6; g.textAlign = 'center'; g.font = 'bold ' + Math.round(34) + 'px "Courier New",monospace'; g.fillStyle = 'rgba(255,90,170,.10)'; g.fillText('RIZI RONCS KFT.', Wd / 2, sy);
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,120,190,.30)'; g.strokeText('RIZI RONCS KFT.', Wd / 2, sy);
    bgDirty = false;
  }

  // ======================= kirajzolás =======================
  function drawCD(x, y, r, spin, pierce, slow) {
    c.save(); c.translate(x, y);
    if (pierce || slow) { const gg = c.createRadialGradient(0, 0, r * .5, 0, 0, r * 2.6); gg.addColorStop(0, pierce ? 'rgba(255,110,50,.7)' : 'rgba(90,190,255,.55)'); gg.addColorStop(1, 'rgba(255,100,40,0)'); c.fillStyle = gg; c.beginPath(); c.arc(0, 0, r * 2.6, 0, TAU); c.fill(); }
    c.rotate(spin);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = '#dfe5ec'; c.fill();
    if (c.createConicGradient) { const cg = c.createConicGradient(0, 0, 0); const cols = ['#ff5a8a', '#ffd34d', '#5aff9a', '#4dc7ff', '#b06bff', '#ff5a8a']; cols.forEach((col, i) => cg.addColorStop(i / 5, col)); c.globalAlpha = .75; c.fillStyle = cg; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.globalAlpha = 1; }
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, -.5, .3); c.closePath(); c.fill();
    c.lineWidth = .8; c.strokeStyle = '#3a4350'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, r * .3, 0, TAU); c.fillStyle = '#1b1526'; c.fill();
    c.restore();
  }
  function drawGuy(x, h, walk, squash, stun, armsUp) {
    const base = floorY, sq = 1 - squash * .28, ph = Math.sin(walk) * 3;
    c.save(); c.translate(x, base);
    c.fillStyle = '#1a1a20'; c.fillRect(-5, -9 * sq, 4, 9 * sq + (ph > 0 ? 0 : 0)); c.fillRect(1, -9 * sq, 4, 9 * sq);
    c.fillStyle = '#3F6FA8'; c.fillRect(-6, -22 * sq, 12, 14 * sq);
    c.fillStyle = '#2a4f7e'; c.fillRect(-6, -10 * sq, 12, 2);
    c.fillStyle = '#E8C9A0'; c.beginPath(); c.arc(0, -27 * sq, 5, 0, TAU); c.fill();
    c.fillStyle = '#2b2118'; c.beginPath(); c.arc(0, -29.6 * sq, 5, Math.PI, TAU); c.fill();
    c.strokeStyle = '#E8C9A0'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(armsUp * -5, -20 * sq); c.lineTo(armsUp * -8, -30 * sq); c.stroke();
    if (stun > 0) { c.fillStyle = '#ffe27a'; for (let i = 0; i < 3; i++) { const a = T * 6 + i * 2.1; c.fillRect(Math.cos(a) * 9 - 1, -37 * sq + Math.sin(a) * 3 - 1, 3, 3); } }
    c.restore();
  }
  function drawPaddle() {
    const w = paddle.w, x = paddle.x, y = slabTop + paddle.squash * 4;
    // három tolós mód: középen a harmadik
    drawGuy(x - w / 2 + 2, 0, paddle.walk, paddle.squash, paddle.stun, 1);
    if (pw.wide > 0 || paddle.w > paddle.base * 1.2) drawGuy(x, 0, paddle.walk + 1, paddle.squash, paddle.stun, 0);
    drawGuy(x + w / 2 - 2, 0, paddle.walk + 2, paddle.squash, paddle.stun, -1);
    // a régi Opel motorháztetője
    c.save(); c.translate(x, y + 5);
    c.beginPath(); c.moveTo(-w / 2, 6); c.quadraticCurveTo(0, -9 - paddle.squash * 3, w / 2, 6); c.lineTo(w / 2, 11); c.quadraticCurveTo(0, -2, -w / 2, 11); c.closePath();
    const g = c.createLinearGradient(0, -8, 0, 11); g.addColorStop(0, '#d56a52'); g.addColorStop(.5, '#B0483A'); g.addColorStop(1, '#6d2a22'); c.fillStyle = g; c.fill(); c.lineWidth = 1.1; c.strokeStyle = '#2a0f0b'; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.moveTo(-w / 2 + 6, 3); c.quadraticCurveTo(0, -9, w / 2 - 6, 3); c.lineTo(w / 2 - 6, 4.4); c.quadraticCurveTo(0, -7.4, -w / 2 + 6, 4.4); c.closePath(); c.fill();
    c.fillStyle = '#7A5230'; for (const rx of [-w * .3, w * .12, w * .34]) { c.beginPath(); c.arc(rx, 5, 2.2, 0, TAU); c.fill(); }
    c.restore();
    if (pw.flex > 0) { c.fillStyle = '#ffcc33'; c.fillRect(x - w / 2 + 2, y - 7, 5, 6); c.fillRect(x + w / 2 - 7, y - 7, 5, 6); }
  }
  function drawMagnet() {
    const mx = carX + Car.W / 2, off = state === 'finale' || state === 'win' ? Math.min(magFall, 3) : 0;
    const fall = off > 1 ? Math.min((floorY - 30) - (ceilY + 14), 700 * (off - 1) * (off - 1)) : 0;
    // sín + csörlő
    for (let x = 0; x < Wd; x += 18) { c.fillStyle = ((x / 18) & 1) ? '#d9a521' : '#1c1c20'; c.fillRect(x, ceilY - 6, 18, 6); }
    c.fillStyle = '#2f3037'; c.fillRect(mx - 30, ceilY - 2, 60, 12); c.fillStyle = '#4a4c56'; c.fillRect(mx - 30, ceilY - 2, 60, 3);
    // szem (a gép figyel)
    const b = balls[0], ex = b ? clamp((b.x - mx) / 160, -1, 1) : 0, ey = b ? clamp((b.y - ceilY) / 200, -.2, 1) : 0, dead = state === 'finale' || state === 'win';
    c.fillStyle = '#101014'; c.beginPath(); c.arc(mx, ceilY + 4, 8, 0, TAU); c.fill();
    c.fillStyle = dead ? '#3a1010' : '#e8f4ff'; c.beginPath(); c.arc(mx, ceilY + 4, 6, 0, TAU); c.fill();
    c.fillStyle = dead ? '#400' : (Math.sin(T * 5) > 0 || state === 'play' ? '#ff2a2a' : '#a01818'); c.beginPath(); c.arc(mx + ex * 3, ceilY + 4 + ey * 2.4, 3, 0, TAU); c.fill();
    // kábel
    c.strokeStyle = '#15151a'; c.lineWidth = 3; c.beginPath(); c.moveTo(mx - 12, ceilY + 10); c.lineTo(mx - 20, ceilY + 14 + fall); c.moveTo(mx + 12, ceilY + 10); c.lineTo(mx + 20, ceilY + 14 + fall); c.stroke();
    // mágnestárcsa
    const my = ceilY + 14 + fall; const g = c.createLinearGradient(0, my, 0, my + 20); g.addColorStop(0, '#6b6e7a'); g.addColorStop(1, '#2a2b33'); c.fillStyle = g; c.beginPath(); if (c.roundRect) c.roundRect(mx - 46, my, 92, 20, 5); else c.rect(mx - 46, my, 92, 20); c.fill(); c.lineWidth = 1; c.strokeStyle = '#0c0c10'; c.stroke();
    for (let x = -42; x < 40; x += 14) { c.fillStyle = ((x / 14) & 1) ? '#d9a521' : '#1c1c20'; c.fillRect(mx + x, my + 13, 7, 5); }
    c.fillStyle = dead ? '#400' : 'rgba(90,200,255,.9)'; c.fillRect(mx - 30, my + 4, 60, 4);
    // villámívek az autóra
    if (!dead) { c.lineWidth = 1.4; c.lineCap = 'round'; for (const a of arcs) { const sx = mx + rnd(-30, 30), sy = my + 20; c.strokeStyle = 'rgba(150,225,255,.9)'; c.shadowColor = '#5ad0ff'; c.shadowBlur = 6; c.beginPath(); c.moveTo(sx, sy); const n = 4; for (let i = 1; i < n; i++) { const t = i / n; c.lineTo(sx + (a.x - sx) * t + rnd(-6, 6), sy + (a.y + carBob - sy) * t + rnd(-3, 3)); } c.lineTo(a.x, a.y + carBob); c.stroke(); c.shadowBlur = 0; } }
  }
  function drawCar() {
    const rise = state === 'intro' || state === 'title' ? (1 - easeOut(carRise)) * 170 : 0, cy = carY + carBob + rise;
    for (const p of parts) {
      if (!p.alive) continue; const s = getSprite(p);
      const shx = p.shake > 0 ? rnd(-1, 1) * p.shake * 1.3 : 0, shy = p.shake > 0 ? rnd(-1, 1) * p.shake * 1.3 : 0;
      c.drawImage(s.cv, carX + s.x + shx, cy + s.y + shy, s.w, s.h);
      if (p.flash > 0) { c.globalAlpha = Math.min(1, p.flash / .1) * .85; c.drawImage(getWhite(p), carX + s.x + shx, cy + s.y + shy, s.w, s.h); c.globalAlpha = 1; }
    }
    const lamp = byId.lamp; if (lamp && lamp.alive) { const k = .5 + .5 * Math.sin(T * 7) , lx = carX + 314, ly = cy + 65; const g = c.createRadialGradient(lx, ly, 0, lx, ly, 14); g.addColorStop(0, 'rgba(255,170,30,' + (.55 * k + .15) + ')'); g.addColorStop(1, 'rgba(255,170,30,0)'); c.fillStyle = g; c.fillRect(lx - 14, ly - 14, 28, 28); }
    const hl = byId.headlight; if (hl && hl.alive && (state === 'play' || state === 'ready')) { const lx = carX + 468, ly = cy + 99; const g = c.createRadialGradient(lx, ly, 0, lx, ly, 26); g.addColorStop(0, 'rgba(255,240,160,.35)'); g.addColorStop(1, 'rgba(255,240,160,0)'); c.fillStyle = g; c.fillRect(lx - 26, ly - 26, 52, 52); }
  }
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function drawDebris() {
    for (const o of debris) {
      if (o.heavy && !o.rest && o.kind !== 'shard' && !o.hurt && o.y < slabTop - 16 && (o.vy > 40 || o.kind === 'wheel')) {
        const k = .5 + .5 * Math.sin(T * 14), wv = Math.max(14, o.rad * 1.5);
        c.fillStyle = 'rgba(255,60,40,' + (.22 + .28 * k) + ')'; c.fillRect(o.x - wv, floorY - 5, wv * 2, 5);
        c.fillStyle = 'rgba(255,90,60,' + (.5 + .4 * k) + ')'; c.beginPath(); c.moveTo(o.x, floorY - 22 - k * 3); c.lineTo(o.x - 7, floorY - 8); c.lineTo(o.x + 7, floorY - 8); c.closePath(); c.fill();
      }
      c.save(); c.translate(o.x, o.y); c.rotate(o.ang);
      const fa = clamp((o.life - o.t) / 2.5, 0, 1); if (fa < 1) c.globalAlpha = fa;
      if (o.power) { const col = POWER[o.power].col, k = .6 + .4 * Math.sin(T * 8); c.shadowColor = col; c.shadowBlur = 12 * k; }
      if (o.kind === 'shard') { c.beginPath(); c.moveTo(o.tri[0][0], o.tri[0][1]); c.lineTo(o.tri[1][0], o.tri[1][1]); c.lineTo(o.tri[2][0], o.tri[2][1]); c.closePath(); c.clip(); }
      c.drawImage(o.sp.cv, o.ox, o.oy, o.sp.w, o.sp.h); c.restore();
      if (o.power) { const def = POWER[o.power]; c.save(); c.font = 'bold 8px "Courier New",monospace'; c.textAlign = 'center'; c.fillStyle = def.col; c.strokeStyle = '#000'; c.lineWidth = 2.4; c.strokeText(def.name, o.x, o.y - o.rad - 8 + Math.sin(T * 6) * 2); c.fillText(def.name, o.x, o.y - o.rad - 8 + Math.sin(T * 6) * 2); c.restore(); }
    }
  }
  function drawParticles() {
    for (const q of particles) {
      const a = clamp(q.life / q.max, 0, 1);
      if (q.k === 'spark') { c.globalAlpha = a; c.strokeStyle = q.col; c.lineWidth = 1.3; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x - q.vx * .04, q.y - q.vy * .04); c.stroke(); }
      else if (q.k === 'smoke') { c.globalAlpha = a * .5; c.fillStyle = 'rgb(' + q.col + ')'; c.beginPath(); c.arc(q.x, q.y, q.r, 0, TAU); c.fill(); }
      else { c.globalAlpha = a; c.save(); c.translate(q.x, q.y); c.rotate(q.ang); c.fillStyle = q.col; c.fillRect(-q.size / 2, -q.size / 2, q.size, q.size); c.restore(); }
    }
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.font = 'bold 10px "Courier New",monospace';
    for (const p of popups) { c.globalAlpha = clamp(p.life * 1.6, 0, 1); c.strokeStyle = '#000'; c.lineWidth = 2.6; c.strokeText(p.text, p.x, p.y); c.fillStyle = p.col; c.fillText(p.text, p.x, p.y); }
    c.globalAlpha = 1;
  }
  function drawBalls() {
    if (state === 'title' || state === 'intro') return;
    for (const b of balls) {
      for (let i = 0; i < b.trail.length; i++) { const t = b.trail[i], k = i / b.trail.length; c.globalAlpha = k * .35; c.fillStyle = b.pierce ? '#ff7a3c' : '#bfe6ff'; c.beginPath(); c.arc(t.x, t.y, b.r * k * .9, 0, TAU); c.fill(); }
      c.globalAlpha = 1; drawCD(b.x, b.y, b.r, b.spin, b.pierce, pw.slow > 0);
    }
    for (const s of shots) { c.fillStyle = '#ffe27a'; c.fillRect(s.x - 1, s.y - 5, 2, 8); c.fillStyle = 'rgba(255,200,60,.35)'; c.fillRect(s.x - 2.5, s.y - 8, 5, 12); }
  }

  function render() {
    if (!cv) return; if (bgDirty || !bg) drawBg();
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(bg, 0, 0);
    let sx = 0, sy = 0; if (shakeT > 0) { sx = rnd(-1, 1) * shakeT * 7; sy = rnd(-1, 1) * shakeT * 5; }
    c.setTransform(S, 0, 0, S, sx * S, (offY + sy) * S);
    // villogó neon
    if ((state === 'play' || state === 'ready' || state === 'title') && Math.sin(T * 13) + Math.sin(T * 5.3) > 1.2) { c.fillStyle = 'rgba(255,120,190,.10)'; c.font = 'bold 34px "Courier New",monospace'; c.textAlign = 'center'; c.fillText('RIZI RONCS KFT.', Wd / 2, (carY + Car.H + floorY - 16) / 2 + 6); }
    drawMagnet(); drawCar(); drawDebris();
    if (state !== 'intro' && state !== 'title') drawPaddle();
    drawBalls(); drawParticles();
    if (state === 'ready') { c.textAlign = 'center'; c.font = 'bold 11px "Courier New",monospace'; c.fillStyle = 'rgba(255,255,255,' + (.55 + .35 * Math.sin(T * 5)) + ')'; c.strokeStyle = '#000'; c.lineWidth = 2.4; const tx = 'KOPPINTS / SPACE: INDÍTÁS'; c.strokeText(tx, Wd / 2, slabTop - 46); c.fillText(tx, Wd / 2, slabTop - 46); }
    // képernyő-tér: HUD, gép-üzenet, villanás
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state !== 'intro' && state !== 'title') drawHud();
    drawTicker();
    if (flashT > 0) { c.fillStyle = 'rgba(255,255,255,' + Math.min(.8, flashT * 1.4) + ')'; c.fillRect(0, 0, cssW, cssH); }
    if (state === 'intro') { c.fillStyle = 'rgba(0,0,0,' + (stateT < .6 ? 1 - stateT / .6 : 0) + ')'; c.fillRect(0, 0, cssW, cssH); }
  }

  const HUD_ICONS = { pause: null, sound: null };
  function drawHud() {
    const w = cssW, compact = w < 560;
    let g = c.createLinearGradient(0, 0, 0, 34); g.addColorStop(0, '#0e0b14'); g.addColorStop(1, '#1c1628'); c.fillStyle = g; c.fillRect(0, 0, w, 34);
    c.fillStyle = '#d9a521'; c.fillRect(0, 33, w, 1.5);
    // életek (CD-k)
    c.save(); for (let i = 0; i < lives; i++) { c.save(); c.scale(1, 1); drawCDScreen(14 + i * 17, 17, 6.2, i); c.restore(); } c.restore();
    // Astra épség
    const bx = 14 + Math.max(3, lives) * 17 + 8, bw = compact ? 70 : 120, pct = hpPercent();
    c.font = 'bold 9px "Courier New",monospace'; c.textAlign = 'left'; c.fillStyle = '#9fb0c4'; c.fillText('ASTRA ' + Math.round(pct * 100) + '%', bx, 14);
    c.fillStyle = '#2a2433'; c.fillRect(bx, 19, bw, 7); c.fillStyle = pct > .5 ? '#5ad07a' : (pct > .25 ? '#ffb21e' : '#ff4d3c'); c.fillRect(bx, 19, bw * pct, 7); c.strokeStyle = '#000'; c.lineWidth = 1; c.strokeRect(bx + .5, 19.5, bw - 1, 6);
    if (pct < .3 && Math.sin(T * 8) > 0) { c.fillStyle = '#ffb21e'; c.fillText('⚠ CHECK ENGINE', bx + bw + 8, 26); }
    // pontszám / idő
    c.textAlign = 'right'; c.fillStyle = '#ffe27a'; c.font = 'bold 12px "Courier New",monospace'; c.fillText(String(score).padStart(6, '0'), w - 74, 14);
    c.fillStyle = '#9fb0c4'; c.font = 'bold 9px "Courier New",monospace'; const mm = Math.floor(playTime / 60), ss = Math.floor(playTime % 60); c.fillText((mm + ':' + String(ss).padStart(2, '0')) + (remaining ? '  ' + remaining + ' db' : ''), w - 74, 27);
    // gombok
    c.strokeStyle = '#9fb0c4'; c.fillStyle = '#9fb0c4'; c.lineWidth = 1.5;
    c.strokeRect(w - 28.5, 8.5, 18, 17); if (paused) { c.beginPath(); c.moveTo(w - 23, 12); c.lineTo(w - 23, 22); c.lineTo(w - 14, 17); c.closePath(); c.fill(); } else { c.fillRect(w - 24, 12, 3, 9); c.fillRect(w - 18, 12, 3, 9); }
    c.strokeRect(w - 54.5, 8.5, 18, 17); c.beginPath(); c.moveTo(w - 50, 15); c.lineTo(w - 47, 15); c.lineTo(w - 43, 12); c.lineTo(w - 43, 22); c.lineTo(w - 47, 19); c.lineTo(w - 50, 19); c.closePath(); c.fill();
    if (Snd.isMuted()) { c.strokeStyle = '#ff6b5a'; c.beginPath(); c.moveTo(w - 52, 24); c.lineTo(w - 39, 10); c.stroke(); } else { c.beginPath(); c.arc(w - 43, 17, 4, -.9, .9); c.stroke(); }
    // aktív power-upok
    let py = 42; c.textAlign = 'left'; c.font = 'bold 9px "Courier New",monospace';
    for (const [k, def] of [['flex', POWER.flex], ['slow', POWER.slow], ['pierce', POWER.pierce], ['wide', POWER.wide]]) { if (pw[k] > 0) { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(8, py - 9, 96, 12); c.fillStyle = def.col; c.fillRect(8, py - 9, 96 * clamp(pw[k] / ({ flex: 9, slow: 12, pierce: 9, wide: 16 })[k], 0, 1), 12); c.fillStyle = '#000'; c.fillText(def.name + ' ' + Math.ceil(pw[k]) + 's', 12, py); py += 15; } }
    if (combo >= 3) { c.textAlign = 'right'; c.fillStyle = '#ffe27a'; c.font = 'bold 11px "Courier New",monospace'; c.fillText('KOMBÓ x' + Math.min(combo, 9), w - 10, 48); }
  }
  function drawCDScreen(x, y, r, i) {
    c.save(); c.translate(x, y); c.rotate(T * 1.2 + i); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = '#dfe5ec'; c.fill();
    if (c.createConicGradient) { const cg = c.createConicGradient(0, 0, 0); ['#ff5a8a', '#ffd34d', '#5aff9a', '#4dc7ff', '#b06bff', '#ff5a8a'].forEach((col, k) => cg.addColorStop(k / 5, col)); c.globalAlpha = .7; c.fillStyle = cg; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.globalAlpha = 1; }
    c.beginPath(); c.arc(0, 0, r * .3, 0, TAU); c.fillStyle = '#0e0b14'; c.fill(); c.restore();
  }
  function drawTicker() {
    const w = cssW, h = cssH, y0 = h - 26;
    if (state === 'title' || state === 'intro') return;
    c.fillStyle = 'rgba(8,6,12,.88)'; c.fillRect(0, y0, w, 26); c.fillStyle = '#2b7a52'; c.fillRect(0, y0, w, 1);
    c.font = 'bold ' + (w < 520 ? 10 : 12) + 'px "Courier New",monospace'; c.textAlign = 'left'; c.fillStyle = '#7CFFB2';
    const txt = 'GÉP> ' + tick.text.slice(0, tick.shown | 0) + ((tick.ttl > 0 || Math.sin(T * 6) > 0) ? '█' : ''); c.fillText(txt, 8, y0 + 17);
  }

  // ======================= bemenet =======================
  function hudHit(x, y) { if (y > 34) return null; if (x > cssW - 30) return 'pause'; if (x > cssW - 56) return 'sound'; return null; }
  function setPaused(p) { if (state !== 'play' && state !== 'ready') p = false; paused = p; ui.screen(p ? 'pause' : 'none'); if (p) Snd.music(false); else if (state === 'play' || state === 'ready') Snd.music(true); }
  function bind(el) {
    let lastX = null, touch = false;
    const local = e => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    el.addEventListener('pointerdown', e => {
      Snd.ensure(); const p = local(e); touch = e.pointerType !== 'mouse'; lastX = p.x;
      const hh = hudHit(p.x, p.y);
      if (hh === 'pause') { setPaused(!paused); return; } if (hh === 'sound') { Snd.setMuted(!Snd.isMuted()); return; }
      if (paused) { setPaused(false); return; }
      if (!touch) paddle.tx = clamp(p.x / cssW * Wd, 0, Wd);
      if (state === 'ready') launch();
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
    });
    el.addEventListener('pointermove', e => {
      const p = local(e);
      if (!touch || e.pointerType === 'mouse') paddle.tx = clamp(p.x / cssW * Wd, 0, Wd);
      else if (lastX !== null) { paddle.tx = clamp(paddle.tx + (p.x - lastX) / cssW * Wd * 1.25, 0, Wd); }
      lastX = p.x;
    });
    el.addEventListener('pointerup', () => { lastX = null; });
    window.addEventListener('keydown', e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { keys.left = true; e.preventDefault(); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { keys.right = true; e.preventDefault(); }
      else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') { e.preventDefault(); Snd.ensure(); if (paused) setPaused(false); else if (state === 'ready') launch(); }
      else if (e.code === 'KeyP' || e.code === 'Escape') { setPaused(!paused); }
      else if (e.code === 'KeyM') { Snd.setMuted(!Snd.isMuted()); }
    });
    window.addEventListener('keyup', e => { if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false; else if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false; });
    window.addEventListener('blur', () => { keys.left = keys.right = false; if (state === 'play') setPaused(true); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') setPaused(true); });
  }

  // ======================= indítás =======================
  function init(o) {
    cv = o.canvas; mk = o.makeCanvas; ui = o.ui || { screen() {}, caption() {}, skip() {} }; c = cv.getContext('2d');
    Car.init(mk); loadBest(); layout(o.width, o.height, o.dpr);
    resetRun(); setState('title'); carRise = 1; ui.screen('title');
    if (o.bind) bind(o.bind);
  }
  function resize(w, h, d) {
    const prevState = state; layout(w, h, d);
    if (prevState === 'play') { balls.length = 0; balls.push(newBall()); setState('ready'); say('Elforgattad a telefont. A labdát újraindítottam.', 3); }
    else for (const b of balls) if (b.stuck) b.y = slabTop - b.r - 1;
  }

  return {
    init, resize, update, render, startGame, startIntro, toTitle, launch, setPaused,
    isPaused: () => paused, state: () => state, skipIntro() { if (state === 'intro') { ui.caption(''); startGame(); } },
    // tesztekhez
    _: {
      get parts() { return parts; }, get balls() { return balls; }, get debris() { return debris; }, get paddle() { return paddle; },
      get remaining() { return remaining; }, get lives() { return lives; }, get score() { return score; }, get playTime() { return playTime; },
      get dims() { return { Wd, Hd, offY, S, carX, carY, ceilY, floorY, slabTop }; }, byId: id => byId[id], pw, destroyPart, hpPercent,
      setTx(x) { paddle.tx = x; }, get lost() { return lostBalls; }, get lines() { return tick.text; }
    }
  };
})();
if (typeof module !== 'undefined') module.exports = Astranoid;
