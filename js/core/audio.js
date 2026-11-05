/* Bubu kalandjai – hang: magyar felolvasás (Web Speech API) + hangeffektek (WebAudio) */
(function () {
  'use strict';
  const Bubu = (window.Bubu = window.Bubu || {});

  /* =========================================================
   * FELOLVASÁS
   * ========================================================= */
  const synth = window.speechSynthesis || null;
  const speech = {
    supported: !!synth,
    voices: [],
    voice: null,
    hasHu: false,
    rate: 0.92,
    enabled: true,
    preferredName: null,
    speaking: false,
  };
  Bubu.speech = speech;

  function scoreVoice(v) {
    let s = 0;
    const lang = (v.lang || '').toLowerCase();
    if (lang.startsWith('hu')) s += 100;
    const n = v.name.toLowerCase();
    if (n.includes('natural') || n.includes('online')) s += 20; // Edge: Microsoft Noémi / Tamás Online (Natural)
    if (n.includes('noémi') || n.includes('noemi')) s += 5;      // kellemes női hang
    if (n.includes('google')) s += 10;
    if (v.localService) s += 1;
    return s;
  }

  function loadVoices() {
    if (!synth) return;
    speech.voices = synth.getVoices() || [];
    const hu = speech.voices.filter((v) => (v.lang || '').toLowerCase().startsWith('hu'));
    speech.hasHu = hu.length > 0;
    let chosen = null;
    if (speech.preferredName) chosen = speech.voices.find((v) => v.name === speech.preferredName) || null;
    if (!chosen && hu.length) chosen = hu.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
    speech.voice = chosen;
    if (Bubu.onVoicesChanged) Bubu.onVoicesChanged();
  }
  if (synth) {
    loadVoices();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', loadVoices);
    else synth.onvoiceschanged = loadVoices;
    // néhány böngésző késve tölti be a hangokat
    setTimeout(loadVoices, 300);
    setTimeout(loadVoices, 1500);
  }
  speech.reload = loadVoices;
  speech.huVoices = () => speech.voices.filter((v) => (v.lang || '').toLowerCase().startsWith('hu'));

  let speakToken = 0;
  let keepAlive = null;

  /**
   * Bubu.say(text, opts) -> Promise (akkor oldódik fel, ha végzett a beszéd, vagy biztonsági időkorlát után)
   * opts.interrupt (alap: true) – megszakítja az aktuális beszédet
   * opts.rate – sebesség szorzó
   */
  Bubu.say = function (text, opts) {
    opts = opts || {};
    if (!text) return Promise.resolve();
    if (Bubu.onSay) Bubu.onSay(text);
    if (!synth || !speech.enabled) return U.wait(Math.min(1500, 300 + text.length * 30));
    const token = ++speakToken;
    if (opts.interrupt !== false) synth.cancel();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (token === speakToken) { speech.speaking = false; clearInterval(keepAlive); if (Bubu.onSayEnd) Bubu.onSayEnd(); }
        resolve();
      };
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'hu-HU';
      if (speech.voice) u.voice = speech.voice;
      u.rate = (opts.rate || 1) * speech.rate;
      u.pitch = opts.pitch || 1.08;
      u.onend = finish;
      u.onerror = finish;
      // biztonsági időkorlát (néhány böngésző nem küld onend-et)
      const maxMs = 2500 + text.length * 110 / (u.rate || 1);
      setTimeout(finish, maxMs);
      setTimeout(() => {
        if (token !== speakToken) { finish(); return; }
        speech.speaking = true;
        try { synth.speak(u); } catch (e) { finish(); }
        // Chrome: hosszú szövegnél elakadhat – időnként "megbökjük"
        clearInterval(keepAlive);
        keepAlive = setInterval(() => { if (!synth.speaking) return; synth.pause(); synth.resume(); }, 10000);
      }, opts.interrupt !== false ? 60 : 0);
    });
  };

  /** több mondat egymás után */
  Bubu.sayAll = async function (parts) {
    for (let i = 0; i < parts.length; i++) {
      await Bubu.say(parts[i], { interrupt: i === 0 });
    }
  };

  Bubu.stopSpeech = function () {
    speakToken++;
    if (synth) synth.cancel();
    speech.speaking = false;
    clearInterval(keepAlive);
    if (Bubu.onSayEnd) Bubu.onSayEnd();
  };

  /* =========================================================
   * HANGEFFEKTEK (szintetizált, nincs szükség hangfájlra)
   * ========================================================= */
  let ctx = null;
  const sfxState = { enabled: true, volume: 0.5 };
  Bubu.sfxState = sfxState;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol, slideTo) {
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    const v = (vol == null ? 0.3 : vol) * sfxState.volume;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(start, dur, vol, freq) {
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + start;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = 0.8;
    const g = c.createGain(); g.gain.value = (vol || 0.2) * sfxState.volume;
    s.connect(f); f.connect(g); g.connect(c.destination);
    s.start(t0);
  }

  const SFX = {
    tap: () => tone(660, 0, 0.08, 'triangle', 0.25),
    pop: () => tone(400, 0, 0.12, 'sine', 0.35, 900),
    correct: () => { tone(523, 0, 0.14, 'triangle', 0.3); tone(659, 0.09, 0.14, 'triangle', 0.3); tone(784, 0.18, 0.28, 'triangle', 0.32); },
    wrong: () => { tone(300, 0, 0.18, 'sine', 0.3, 220); tone(220, 0.16, 0.25, 'sine', 0.25, 180); },
    star: () => { tone(1046, 0, 0.12, 'sine', 0.25); tone(1318, 0.07, 0.12, 'sine', 0.25); tone(1568, 0.14, 0.3, 'sine', 0.25); },
    win: () => {
      const notes = [523, 659, 784, 1046, 784, 1046];
      notes.forEach((n, i) => tone(n, i * 0.12, i === notes.length - 1 ? 0.6 : 0.16, 'triangle', 0.3));
      noise(0.75, 0.4, 0.08, 3000);
    },
    whoosh: () => noise(0, 0.3, 0.15, 800),
    unlock: () => { tone(392, 0, 0.1, 'square', 0.12); tone(523, 0.1, 0.1, 'square', 0.12); tone(784, 0.2, 0.35, 'triangle', 0.25); },
    drum: () => { tone(160, 0, 0.18, 'sine', 0.6, 60); noise(0, 0.08, 0.12, 400); },
    clap: () => noise(0, 0.12, 0.45, 1500),
    flip: () => tone(500, 0, 0.07, 'sine', 0.2, 800),
    sticker: () => { [784, 988, 1175, 1568].forEach((n, i) => tone(n, i * 0.08, 0.2, 'sine', 0.25)); noise(0.3, 0.3, 0.06, 4000); },
  };

  /** Bubu.sfx('correct' | 'wrong' | 'tap' | 'pop' | 'star' | 'win' | 'whoosh' | 'unlock' | 'drum' | 'clap' | 'flip' | 'sticker') */
  Bubu.sfx = function (name) {
    if (!sfxState.enabled) return;
    try { (SFX[name] || SFX.tap)(); } catch (e) { /* néma */ }
  };
  /** egy adott hangmagasság (pl. zenei játékhoz) */
  Bubu.tone = function (freq, dur, type) { if (sfxState.enabled) tone(freq, 0, dur || 0.4, type || 'triangle', 0.35); };
  Bubu.unlockAudio = function () { ac(); };
})();
