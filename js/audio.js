/* ASTRANOID - audio.js : Web Audio szintetizátor (külső hangfájl nélkül) */
const Snd = (function () {
  'use strict';
  let ctx = null, master = null, muted = false, musicOn = false, timer = null, step = 0, nextT = 0, nbuf = null;
  try { muted = (typeof localStorage !== 'undefined' && localStorage.getItem('astranoid_mute') === '1'); } catch (e) {}

  function ensure() {
    if (typeof window === 'undefined') return false;
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
        ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.85; master.connect(ctx.destination);
        const len = ctx.sampleRate * 1.2; nbuf = ctx.createBuffer(1, len, ctx.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { ctx = null; return false; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  function tone(f, dur, type, vol, delay, slide) {
    if (!ctx || muted) return; const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'square';
    o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol || 0.1, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function noise(dur, vol, delay, fc, ftype, q) {
    if (!ctx || muted || !nbuf) return; const t0 = ctx.currentTime + (delay || 0);
    const s = ctx.createBufferSource(); s.buffer = nbuf; s.playbackRate.value = 0.7 + Math.random() * 0.6;
    const f = ctx.createBiquadFilter(); f.type = ftype || 'lowpass'; f.frequency.value = fc || 1200; f.Q.value = q || 0.8;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol || 0.15, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.03);
  }

  const HIT = {
    metal: () => { noise(.09, .16, 0, 2200, 'bandpass', 2); tone(190, .09, 'square', .09, 0, 120); },
    plastic: () => { noise(.07, .14, 0, 900, 'lowpass'); tone(150, .07, 'triangle', .1, 0, 90); },
    glass: () => { noise(.12, .12, 0, 6000, 'highpass'); tone(2400, .1, 'sine', .06); tone(3300, .08, 'sine', .04, .02); },
    tire: () => { noise(.12, .2, 0, 380, 'lowpass'); tone(90, .12, 'sine', .16, 0, 55); },
    engine: () => { tone(70, .18, 'sawtooth', .13, 0, 48); noise(.12, .14, 0, 700, 'lowpass'); },
    ping: () => { tone(1900, .09, 'sine', .08); tone(2850, .06, 'sine', .04, .01); },
    small: () => { tone(880, .05, 'triangle', .09, 0, 600); noise(.04, .08, 0, 3000, 'highpass'); }
  };
  return {
    ensure,
    isMuted: () => muted,
    setMuted(m) { muted = m; try { localStorage.setItem('astranoid_mute', m ? '1' : '0'); } catch (e) {} if (master) master.gain.value = m ? 0 : 0.85; },
    hit(kind) { if (!ctx || muted) return; (HIT[kind] || HIT.metal)(); },
    paddle() { tone(300, .07, 'square', .08, 0, 520); },
    wall() { tone(560, .035, 'triangle', .05); },
    breakPanel(heavy) { noise(heavy ? .5 : .28, heavy ? .3 : .2, 0, heavy ? 500 : 1100, 'lowpass'); tone(heavy ? 60 : 110, heavy ? .4 : .22, 'sawtooth', .13, 0, 40); tone(heavy ? 420 : 640, .12, 'square', .06, .02, 160); },
    breakGlass() { noise(.35, .16, 0, 6500, 'highpass'); for (let i = 0; i < 6; i++) tone(2000 + Math.random() * 2500, .08, 'sine', .04, i * .035 + Math.random() * .02); },
    pop(kind) { (HIT[kind] || HIT.small)(); tone(500 + Math.random() * 400, .1, 'square', .05, .02, 1200); },
    wheelOff() { noise(.7, .22, 0, 300, 'lowpass'); tone(70, .5, 'sine', .2, 0, 38); for (let i = 0; i < 5; i++) tone(180 - i * 20, .08, 'square', .05, .12 + i * .09); },
    collect(power) { const b = [523, 659, 784, 1047]; b.forEach((f, i) => tone(f, .09, 'square', .07, i * .06)); if (power === 'life') tone(1568, .25, 'triangle', .1, .26); },
    stun() { tone(80, .35, 'sawtooth', .16, 0, 45); noise(.25, .2, 0, 400, 'lowpass'); tone(300, .08, 'square', .06, .05, 140); },
    laser() { tone(1500, .09, 'sawtooth', .05, 0, 500); },
    lose() { [400, 330, 262, 196].forEach((f, i) => tone(f, .2, 'sawtooth', .1, i * .15, f * .6)); },
    blip() { tone(740 + Math.random() * 240, .022, 'square', .035); },
    glitch() { noise(.2, .2, 0, 1800, 'bandpass', 4); tone(120, .2, 'sawtooth', .1, 0, 700); },
    win() { [392, 523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, .16, 'square', .09, i * .11)); tone(130, .9, 'sawtooth', .1, .1, 98); },
    start() { [196, 262, 330, 392].forEach((f, i) => tone(f, .12, 'square', .08, i * .08)); },
    // ---- háttérzene: ipari, nyomasztó-de-táncolható loop ----
    music(on) {
      musicOn = on; if (!ctx) return;
      if (timer) { clearInterval(timer); timer = null; }
      if (!on) return;
      step = 0; nextT = ctx.currentTime + 0.1;
      const BASS = [55, 0, 55, 0, 65.4, 0, 55, 82.4, 55, 0, 55, 0, 49, 0, 73.4, 65.4];
      const LEAD = [440, 0, 0, 523, 0, 0, 659, 0, 587, 0, 0, 523, 0, 440, 0, 0];
      timer = setInterval(() => {
        if (!ctx || muted) { nextT = ctx ? ctx.currentTime + 0.1 : 0; return; }
        const spb = 60 / 132 / 4;
        while (nextT < ctx.currentTime + 0.25) {
          const s = step % 16, d = nextT - ctx.currentTime;
          if (BASS[s]) tone(BASS[s], spb * 1.6, 'sawtooth', .05, d, BASS[s] * .97);
          if (s % 4 === 0) tone(120, .12, 'sine', .12, d, 40);
          if (s % 2 === 1) noise(.03, .035, d, 7000, 'highpass');
          if (s === 4 || s === 12) noise(.12, .07, d, 1800, 'bandpass', 1.2);
          if (step % 32 >= 16 && LEAD[s]) tone(LEAD[s], spb * 1.2, 'square', .018, d);
          nextT += spb; step++;
        }
      }, 40);
    }
  };
})();
if (typeof module !== 'undefined') module.exports = Snd;
