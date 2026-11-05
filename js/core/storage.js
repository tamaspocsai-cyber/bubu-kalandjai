/* Bubu kalandjai – mentés (localStorage) */
(function () {
  'use strict';
  const Bubu = (window.Bubu = window.Bubu || {});
  const KEY = 'bubu-kalandjai-v1';

  const fresh = () => ({
    v: 1,
    created: Date.now(),
    stars: {},        // { gameId: [l1, l2, l3] } – szintenkénti legjobb csillag (0–3)
    stickers: [],     // megszerzett matricák azonosítói (sorrendben)
    log: [],          // utolsó játékok: { g, l, s, m, ms, t }
    playMs: 0,        // összes játékidő
    days: {},         // { 'YYYY-MM-DD': perc }
    settings: { voiceName: null, rate: 0.92, sfx: true, speech: true, unlockAll: false, music: true },
  });

  let state = fresh();
  let memoryOnly = false;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        state = Object.assign(fresh(), s);
        state.settings = Object.assign(fresh().settings, s.settings || {});
      }
    } catch (e) { memoryOnly = true; }
  }
  function save() {
    if (memoryOnly) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { memoryOnly = true; }
  }

  load();

  const store = {
    get state() { return state; },
    save,
    reset() { state = fresh(); save(); },
    export() { return JSON.stringify(state); },
    import(json) { const s = JSON.parse(json); if (!s || s.v !== 1) throw new Error('rossz fájl'); state = Object.assign(fresh(), s); save(); },

    /** a játék adott szintjén elért legjobb csillag */
    best(gameId, level) { return ((state.stars[gameId] || [])[level - 1]) || 0; },
    /** játékonkénti összes csillag (max 9) */
    gameStars(gameId) { return (state.stars[gameId] || []).reduce((a, b) => a + (b || 0), 0); },
    totalStars() { let t = 0; for (const g in state.stars) t += store.gameStars(g); return t; },
    /** szint nyitva van-e: 1. mindig, a többi ha az előzőn van ≥1 csillag */
    isUnlocked(gameId, level) {
      if (level <= 1 || state.settings.unlockAll) return true;
      return store.best(gameId, level - 1) > 0;
    },
    /** eredmény rögzítése; visszaadja: { improved: bool, prev } */
    record(gameId, level, starsGot, mistakes, ms) {
      const arr = state.stars[gameId] || (state.stars[gameId] = [0, 0, 0]);
      while (arr.length < level) arr.push(0);
      const prev = arr[level - 1] || 0;
      if (starsGot > prev) arr[level - 1] = starsGot;
      state.log.unshift({ g: gameId, l: level, s: starsGot, m: mistakes, ms: Math.round(ms), t: Date.now() });
      if (state.log.length > 300) state.log.length = 300;
      store.addTime(ms);
      save();
      return { improved: starsGot > prev, prev };
    },
    addTime(ms) {
      state.playMs += ms;
      const d = new Date();
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      state.days[k] = (state.days[k] || 0) + ms / 60000;
    },
    addSticker(id) { if (!state.stickers.includes(id)) { state.stickers.push(id); save(); } },
    setting(k, v) { if (v === undefined) return state.settings[k]; state.settings[k] = v; save(); },
  };

  Bubu.store = store;
})();
