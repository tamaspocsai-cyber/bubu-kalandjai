/* Bubu kalandjai – alkalmazás: képernyők, játékfuttató, jutalmak, szülői sarok */
(function () {
  'use strict';
  const S = Bubu.store;
  const app = document.getElementById('app');
  const el = U.el;

  /* =========================================================
   * Beállítások alkalmazása
   * ========================================================= */
  function applySettings() {
    const st = S.state.settings;
    Bubu.speech.rate = st.rate || 0.92;
    Bubu.speech.enabled = st.speech !== false;
    Bubu.sfxState.enabled = st.sfx !== false;
    if (st.voiceName !== Bubu.speech.preferredName) {
      Bubu.speech.preferredName = st.voiceName;
      Bubu.speech.reload();
    }
  }
  applySettings();

  /* =========================================================
   * Bubu, a kis sárkány (kabala)
   * ========================================================= */
  const MASCOT_SVG = `
<svg viewBox="0 0 200 215" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g class="m-tail"><path d="M140 165 C175 170 190 150 185 125 C195 140 200 175 160 185 Z" fill="#46C08A" stroke="#2E8F63" stroke-width="4" stroke-linejoin="round"/>
    <path d="M183 122 l12 -6 -4 14 z" fill="#FFB547" stroke="#E08A1E" stroke-width="3" stroke-linejoin="round"/></g>
  <g class="m-wing m-wing-l"><path d="M58 120 C25 95 15 120 22 140 C35 132 45 140 55 145 Z" fill="#A98BFF" stroke="#7A5BD6" stroke-width="4" stroke-linejoin="round"/></g>
  <g class="m-wing m-wing-r"><path d="M142 120 C175 95 185 120 178 140 C165 132 155 140 145 145 Z" fill="#A98BFF" stroke="#7A5BD6" stroke-width="4" stroke-linejoin="round"/></g>
  <ellipse cx="78" cy="198" rx="20" ry="11" fill="#46C08A" stroke="#2E8F63" stroke-width="4"/>
  <ellipse cx="122" cy="198" rx="20" ry="11" fill="#46C08A" stroke="#2E8F63" stroke-width="4"/>
  <ellipse cx="100" cy="150" rx="55" ry="50" fill="#5ED39C" stroke="#2E8F63" stroke-width="4"/>
  <ellipse cx="100" cy="158" rx="34" ry="34" fill="#FFF0B3"/>
  <path d="M80 140 h40 M78 156 h44 M82 172 h36" stroke="#F2D477" stroke-width="3" stroke-linecap="round"/>
  <g class="m-arm m-arm-l"><ellipse cx="50" cy="150" rx="12" ry="18" fill="#5ED39C" stroke="#2E8F63" stroke-width="4" transform="rotate(25 50 150)"/></g>
  <g class="m-arm m-arm-r"><ellipse cx="150" cy="150" rx="12" ry="18" fill="#5ED39C" stroke="#2E8F63" stroke-width="4" transform="rotate(-25 150 150)"/></g>
  <g class="m-head">
    <path d="M70 42 L62 14 L86 34 Z" fill="#FFD166" stroke="#E0A526" stroke-width="4" stroke-linejoin="round"/>
    <path d="M130 42 L138 14 L114 34 Z" fill="#FFD166" stroke="#E0A526" stroke-width="4" stroke-linejoin="round"/>
    <path d="M92 30 l8 -14 8 14 z" fill="#FF9F43" stroke="#E07B1E" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="100" cy="78" rx="56" ry="50" fill="#5ED39C" stroke="#2E8F63" stroke-width="4"/>
    <g class="m-eyes">
      <ellipse cx="78" cy="72" rx="15" ry="17" fill="#fff" stroke="#2E8F63" stroke-width="3"/>
      <ellipse cx="122" cy="72" rx="15" ry="17" fill="#fff" stroke="#2E8F63" stroke-width="3"/>
      <circle class="m-pupil" cx="80" cy="75" r="8" fill="#2B2D42"/>
      <circle class="m-pupil" cx="120" cy="75" r="8" fill="#2B2D42"/>
      <circle cx="83" cy="71" r="3" fill="#fff"/><circle cx="123" cy="71" r="3" fill="#fff"/>
    </g>
    <ellipse cx="62" cy="96" rx="10" ry="6" fill="#FF8FA3" opacity=".7"/>
    <ellipse cx="138" cy="96" rx="10" ry="6" fill="#FF8FA3" opacity=".7"/>
    <circle cx="92" cy="92" r="2.5" fill="#2E8F63"/><circle cx="108" cy="92" r="2.5" fill="#2E8F63"/>
    <path class="m-mouth m-smile" d="M82 102 Q100 120 118 102" fill="none" stroke="#2B2D42" stroke-width="4.5" stroke-linecap="round"/>
    <path class="m-mouth m-grin" d="M80 100 Q100 128 120 100 Z" fill="#C2185B" stroke="#2B2D42" stroke-width="4" stroke-linejoin="round"/>
    <ellipse class="m-mouth m-open" cx="100" cy="108" rx="10" ry="8" fill="#C2185B" stroke="#2B2D42" stroke-width="4"/>
    <path class="m-mouth m-sad" d="M86 112 Q100 100 114 112" fill="none" stroke="#2B2D42" stroke-width="4.5" stroke-linecap="round"/>
  </g>
</svg>`;

  function mascot(cls) { return el('div', { class: 'mascot ' + (cls || ''), html: MASCOT_SVG }); }
  let moodTimer = null;
  function mood(m, ms) {
    document.querySelectorAll('.mascot').forEach((x) => {
      x.classList.remove('happy', 'sad', 'cheer', 'think');
      if (m) { void x.offsetWidth; x.classList.add(m); }
    });
    clearTimeout(moodTimer);
    if (m && ms !== 0) moodTimer = setTimeout(() => mood(null, 0), ms || 1500);
  }
  Bubu.onSay = () => document.querySelectorAll('.mascot').forEach((m) => m.classList.add('talk'));
  Bubu.onSayEnd = () => document.querySelectorAll('.mascot').forEach((m) => m.classList.remove('talk'));
  // A kabalára koppintva Bubu megismétli, amit utoljára mondott / a feladatot
  let lastPrompt = '';

  /* =========================================================
   * Effektek
   * ========================================================= */
  const CONF_COLORS = ['#FF6B6B', '#FFD166', '#06D6A0', '#4D96FF', '#C77DFF', '#FF9F1C'];
  function confetti(target, n) {
    n = n || 26;
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    if (target && target.getBoundingClientRect) {
      const r = target.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    }
    for (let i = 0; i < n; i++) {
      const c = el('div', { class: 'confetti' + (i % 3 === 0 ? ' round' : '') });
      c.style.left = x + 'px'; c.style.top = y + 'px';
      c.style.background = CONF_COLORS[i % CONF_COLORS.length];
      c.style.setProperty('--dx', U.rand(-170, 170) + 'px');
      c.style.setProperty('--dy', U.rand(-240, -60) + 'px');
      c.style.setProperty('--r', U.rand(-540, 540) + 'deg');
      c.style.animationDelay = Math.random() * 0.08 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 1500);
    }
  }
  function confettiRain(n) {
    for (let i = 0; i < (n || 60); i++) {
      const c = el('div', { class: 'confetti rain' + (i % 3 === 0 ? ' round' : '') });
      c.style.left = Math.random() * 100 + 'vw';
      c.style.top = '-20px';
      c.style.background = CONF_COLORS[i % CONF_COLORS.length];
      c.style.setProperty('--r', U.rand(-720, 720) + 'deg');
      c.style.animationDelay = Math.random() * 1.2 + 's';
      c.style.animationDuration = 2 + Math.random() * 1.5 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5000);
    }
  }
  Bubu.confetti = confetti;

  /* =========================================================
   * Képernyőkezelés
   * ========================================================= */
  let cleanup = null;
  function show(node) {
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    U.clearSelection();
    document.querySelectorAll('.overlay').forEach((o) => o.remove());
    U.clear(app);
    app.appendChild(node);
    node.classList.add('enter');
    window.scrollTo(0, 0);
  }
  function iconBtn(icon, label, onClick, cls) {
    return el('button', { class: 'icon-btn ' + (cls || ''), 'aria-label': label, title: label, onclick: (e) => { Bubu.sfx('tap'); onClick(e); } }, [
      el('span', { class: 'ib-icon', text: icon }),
    ]);
  }
  function starRow(n, max, cls) {
    const r = el('span', { class: 'star-row ' + (cls || '') });
    for (let i = 0; i < max; i++) r.appendChild(el('span', { class: 'st' + (i < n ? ' on' : ''), text: '★' }));
    return r;
  }
  function worldStars(w) {
    const games = Bubu.gamesOf(w.id);
    return {
      got: games.reduce((a, g) => a + S.gameStars(g.id), 0),
      max: games.reduce((a, g) => a + g.levels.length * 3, 0),
    };
  }
  function maybeFullscreen() {
    const touch = matchMedia('(pointer: coarse)').matches;
    const de = document.documentElement;
    if (touch && !document.fullscreenElement && de.requestFullscreen) de.requestFullscreen().catch(() => {});
  }

  /* =========================================================
   * 1) Kezdőképernyő
   * ========================================================= */
  function startScreen() {
    const warn = el('div', { class: 'voice-warn hidden' });
    const play = el('button', { class: 'big-play', 'aria-label': 'Indítás' }, [el('span', { text: '▶' })]);
    const scr = el('div', { class: 'screen start-screen' }, [
      el('div', { class: 'clouds' }, [el('i'), el('i'), el('i')]),
      el('h1', { class: 'title' }, [el('span', { class: 't1', text: 'Bubu' }), el('span', { class: 't2', text: 'kalandjai' })]),
      mascot('big'),
      play,
      warn,
      el('button', { class: 'parent-link', onclick: () => parentGate() }, '👨‍👩‍👦 Szülőknek'),
    ]);
    play.addEventListener('click', () => {
      Bubu.unlockAudio();
      Bubu.sfx('pop');
      maybeFullscreen();
      const first = S.totalStars() === 0 && S.state.log.length === 0;
      mapScreen(first
        ? 'Szia! Én Bubu vagyok, a kis sárkány. Gyere, játsszunk és tanuljunk együtt! Minden játékért csillagot kapsz, a csillagokért pedig matricákat. Válassz egy szigetet!'
        : U.pick(['Szia! De jó, hogy újra itt vagy! Hová menjünk ma?', 'Hurrá, megjöttél! Válassz egy szigetet!', 'Szia, kis barátom! Hová repüljünk ma?']));
    });
    const checkVoice = () => {
      if (!Bubu.speech.supported) {
        warn.innerHTML = '⚠️ Ez a böngésző nem tud felolvasni. Nyisd meg <b>Microsoft Edge</b>-ben vagy Chrome-ban!';
        warn.classList.remove('hidden');
      } else if (!Bubu.speech.hasHu) {
        warn.innerHTML = '⚠️ Nem találok <b>magyar felolvasó hangot</b>. Legjobb: nyisd meg <b>Microsoft Edge</b>-ben (gyönyörű magyar hangja van). Részletek: Szülőknek → Hang.';
        warn.classList.remove('hidden');
      } else warn.classList.add('hidden');
    };
    setTimeout(checkVoice, 1800);
    Bubu.onVoicesChanged = checkVoice;
    show(scr);
    cleanup = () => { Bubu.onVoicesChanged = null; };
  }

  /* =========================================================
   * 2) Térkép – a négy sziget
   * ========================================================= */
  function mapScreen(greeting) {
    const total = S.totalStars();
    const islands = Bubu.worlds.map((w, i) => {
      const ws = worldStars(w);
      const pct = ws.max ? Math.round((ws.got / ws.max) * 100) : 0;
      const empty = Bubu.gamesOf(w.id).length === 0;
      const card = el('button', {
        class: 'island' + (empty ? ' empty' : ''),
        style: { '--c': w.color, '--d': w.dark, background: w.bg, animationDelay: i * 0.08 + 's' },
        'aria-label': w.name,
        onclick: () => {
          if (empty) { Bubu.sfx('wrong'); Bubu.say('Ez a sziget még épül!'); return; }
          Bubu.sfx('pop');
          worldScreen(w.id);
        },
      }, [
        el('div', { class: 'island-deco' }, w.deco.map((d, k) => el('span', { class: 'd' + k, text: d }))),
        el('div', { class: 'island-icon', text: w.icon }),
        el('div', { class: 'island-name', text: w.name }),
        el('div', { class: 'island-progress' }, [
          el('div', { class: 'bar' }, [el('div', { class: 'fill', style: { width: pct + '%' } })]),
          el('span', { class: 'cnt', text: '⭐ ' + ws.got }),
        ]),
      ]);
      return card;
    });

    const nextSt = nextStickerInfo();
    const scr = el('div', { class: 'screen map-screen' }, [
      el('div', { class: 'topbar' }, [
        el('button', { class: 'pill star-pill', onclick: () => { Bubu.sfx('star'); Bubu.say(total === 0 ? 'Még nincs csillagod. Játssz, és gyűjts sokat!' : 'Összesen ' + U.numWord(Math.min(total, 100)) + ' csillagod van!' ); } }, [el('span', { class: 'big-star', text: '⭐' }), el('b', { text: String(total) })]),
        el('h1', { class: 'map-title', text: 'Bubu kalandjai' }),
        el('button', { class: 'pill album-pill', onclick: () => { Bubu.sfx('pop'); albumScreen(); } }, [
          el('span', { class: 'big-star', text: '📒' }),
          el('b', { text: S.state.stickers.length + '/' + Bubu.STICKERS.length }),
          nextSt ? el('span', { class: 'mini-bar' }, [el('span', { style: { width: nextSt.pct + '%' } })]) : null,
        ]),
      ]),
      el('div', { class: 'islands' }, islands),
      el('div', { class: 'map-bottom' }, [
        mascot('corner'),
        el('button', { class: 'gear', 'aria-label': 'Szülőknek', onclick: () => parentGate() }, '⚙️'),
      ]),
    ]);
    show(scr);
    const m = scr.querySelector('.mascot');
    m.addEventListener('click', () => { mood('happy'); Bubu.say(U.pick(['Válassz egy szigetet!', 'Koppints egy szigetre!', 'Hová menjünk?'])); });
    lastPrompt = 'Válassz egy szigetet!';
    Bubu.say(greeting || U.pick(['Hová menjünk most?', 'Válassz egy szigetet!', 'Melyik szigetre repüljünk?']));
  }

  /* =========================================================
   * 3) Sziget – játékok listája
   * ========================================================= */
  function worldScreen(worldId, silent) {
    const w = Bubu.world(worldId);
    const games = Bubu.gamesOf(worldId);
    const ws = worldStars(w);
    const cards = games.map((g, i) => {
      const lv = el('div', { class: 'gc-levels' }, g.levels.map((_, li) => {
        const best = S.best(g.id, li + 1);
        return el('span', { class: 'gc-lv' + (S.isUnlocked(g.id, li + 1) ? '' : ' locked') }, [starRow(best, 3)]);
      }));
      const done = g.levels.every((_, li) => S.best(g.id, li + 1) === 3);
      const isNew = S.gameStars(g.id) === 0;
      return el('button', {
        class: 'game-card' + (done ? ' done' : '') + (isNew ? ' new' : ''),
        style: { '--c': w.color, '--d': w.dark, animationDelay: i * 0.05 + 's' },
        'aria-label': g.name,
        onclick: () => { Bubu.sfx('pop'); levelPicker(g); },
      }, [
        done ? el('span', { class: 'gc-crown', text: '👑' }) : null,
        el('div', { class: 'gc-icon', text: g.icon }),
        el('div', { class: 'gc-name', text: g.name }),
        lv,
      ]);
    });
    const scr = el('div', { class: 'screen world-screen', style: { background: w.bg, '--c': w.color, '--d': w.dark } }, [
      el('div', { class: 'topbar' }, [
        iconBtn('⬅️', 'Vissza a térképre', () => mapScreen(), 'back'),
        el('h1', { class: 'world-title' }, [el('span', { text: w.icon + ' ' }), w.name]),
        el('div', { class: 'pill' }, [el('span', { class: 'big-star', text: '⭐' }), el('b', { text: ws.got + '/' + ws.max })]),
      ]),
      el('div', { class: 'game-grid' }, cards),
      mascot('corner'),
    ]);
    show(scr);
    scr.querySelector('.mascot').addEventListener('click', () => { mood('happy'); Bubu.say('Koppints egy játékra!'); });
    if (!silent) Bubu.say(w.say + '! Válassz egy játékot!');
  }

  /* =========================================================
   * 4) Szintválasztó
   * ========================================================= */
  function levelPicker(g) {
    if (g.levels.length === 1) { playGame(g, 1); return; }
    // ajánlott szint: az első nyitott, ami még nincs 3 csillagos
    let rec = 1;
    for (let l = 1; l <= g.levels.length; l++) { if (S.isUnlocked(g.id, l)) rec = l; if (S.isUnlocked(g.id, l) && S.best(g.id, l) < 3) { rec = l; break; } }
    const close = () => { ov.remove(); Bubu.stopSpeech(); };
    const btns = g.levels.map((label, i) => {
      const l = i + 1;
      const open = S.isUnlocked(g.id, l);
      const info = Bubu.LEVEL_INFO[i];
      return el('button', {
        class: 'level-btn lv' + l + (open ? '' : ' locked') + (l === rec ? ' rec' : ''),
        'aria-label': info.say,
        onclick: () => {
          if (!open) { Bubu.sfx('wrong'); U.anim(btns[i], 'shake'); Bubu.say('Ez még zárva van. Előbb a ' + Bubu.LEVEL_INFO[i - 1].say.toLowerCase() + ' szintet csináld meg!'); return; }
          Bubu.sfx('pop'); ov.remove(); playGame(g, l);
        },
      }, [
        el('span', { class: 'lb-icon', text: open ? info.icon : '🔒' }),
        starRow(S.best(g.id, l), 3),
        el('span', { class: 'lb-label', text: label }),
      ]);
    });
    const ov = el('div', { class: 'overlay', onclick: (e) => { if (e.target === ov) close(); } }, [
      el('div', { class: 'panel level-panel pop-in' }, [
        el('button', { class: 'close-x', 'aria-label': 'Bezár', onclick: close }, '✖'),
        el('div', { class: 'lp-icon', text: g.icon }),
        el('h2', { text: g.name }),
        el('div', { class: 'level-row' }, btns),
      ]),
    ]);
    document.body.appendChild(ov);
    Bubu.say(g.name + ' Melyik legyen? Könnyű, közepes, vagy nehéz?');
  }

  /* =========================================================
   * 5) Játékfuttató
   * ========================================================= */
  function playGame(game, level) {
    const w = Bubu.world(game.world);
    const total = game.rounds;
    let roundIdx = 0, mistakes = 0, roundWrongs = 0, roundDone = true, alive = true, repeatText = '', repeatOpts = null;
    const timers = new Set();
    const t0 = Date.now();

    const dots = el('div', { class: 'progress-dots' }, U.range(1, total).map(() => el('span', { class: 'pd' })));
    const repeatBtn = el('button', { class: 'repeat-btn', 'aria-label': 'Mondd újra', onclick: () => { Bubu.sfx('tap'); if (repeatText) Bubu.say(repeatText, repeatOpts); } }, '🔊');
    const stage = el('div', { class: 'stage' });
    const m = mascot('corner game');
    m.addEventListener('click', () => { if (repeatText) Bubu.say(repeatText, repeatOpts); });
    const scr = el('div', { class: 'screen game-screen', style: { background: w.bg, '--c': w.color, '--d': w.dark } }, [
      el('div', { class: 'topbar' }, [
        iconBtn('⬅️', 'Vissza', () => worldScreen(w.id, true), 'back'),
        dots,
        repeatBtn,
      ]),
      el('div', { class: 'stage-wrap' }, [stage]),
      m,
    ]);

    const clearTimers = () => { timers.forEach((t) => clearTimeout(t)); timers.clear(); };
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };
    const updateDots = () => {
      [...dots.children].forEach((d, i) => {
        d.className = 'pd' + (i < roundIdx ? ' done' : '') + (i === roundIdx ? ' cur' : '');
        d.textContent = i < roundIdx ? '⭐' : '';
      });
    };

    const ctx = {
      U, game, level, rounds: total, stage, world: w,
      get round() { return roundIdx; },
      get mistakes() { return mistakes; },
      get roundWrongs() { return roundWrongs; },
      get done() { return roundDone || !alive; },
      get alive() { return alive; },
      /** feladat kimondása (és elmentése az ismétlés gombhoz) */
      ask(text, opts) {
        repeatText = text; lastPrompt = text; repeatOpts = opts || null;
        const prefix = roundIdx === 0 && game.intro && !ctx._introDone ? game.intro + ' ' : '';
        ctx._introDone = true;
        U.anim(repeatBtn, 'wiggle', 800);
        return Bubu.say(prefix + text, opts);
      },
      say: (text, opts) => Bubu.say(text, opts),
      setRepeat(text) { repeatText = text; },
      sfx: (n) => Bubu.sfx(n),
      tone: (f, d, t) => Bubu.tone(f, d, t),
      later,
      wait: (ms) => new Promise((res) => later(res, ms)),
      mascot: (md, ms) => mood(md, ms),
      confetti: (target, n) => confetti(target, n),
      /** jó válasz → dicséret, majd következő feladat */
      correct(target, opts) {
        if (roundDone || !alive) return;
        opts = opts || {};
        roundDone = true;
        stage.classList.add('locked');
        Bubu.sfx('correct');
        if (target) { target.classList.add('ok'); confetti(target); }
        mood('happy');
        const dot = dots.children[roundIdx]; if (dot) { dot.textContent = '⭐'; dot.classList.add('done', 'pop'); }
        const words = (opts.say ? opts.say + ' ' : '') + (opts.praise === false ? '' : U.pick(Bubu.PRAISE));
        const started = Date.now();
        Bubu.say(words).then(() => {
          const wait = Math.max(0, 700 - (Date.now() - started));
          later(() => { roundIdx++; nextRound(); }, wait + 250);
        });
      },
      /** rossz válasz → kedves bátorítás; visszaadja, hányadik hiba ebben a körben */
      wrong(target, opts) {
        if (roundDone || !alive) return roundWrongs;
        opts = opts || {};
        roundWrongs++;
        if (roundWrongs <= 3) mistakes++;
        Bubu.sfx('wrong');
        if (target) { U.anim(target, 'shake', 600); }
        mood('sad', 1200);
        if (opts.silent !== true) Bubu.say((opts.say ? opts.say + ' ' : '') + U.pick(Bubu.ENCOURAGE));
        return roundWrongs;
      },
      /** apró siker egy többlépéses feladaton belül (nem lép tovább) */
      good(target, opts) {
        if (!alive) return;
        Bubu.sfx(opts && opts.sfx || 'pop');
        if (target) { U.anim(target, 'bounce', 600); confetti(target, 10); }
        if (opts && opts.say) Bubu.say(opts.say);
      },
      /** segítség: kiemeli a helyes elemet */
      hint(target, opts) {
        if (!target || !alive) return;
        target.classList.add('hint');
        if (!(opts && opts.silent)) Bubu.say(U.pick(Bubu.HINT));
      },
      /**
       * Választós feladat gombokkal.
       * ctx.choose({ items, correct (érték | fn(item)→bool), render(item)→string|Node, sayOnTap(item)→string,
       *              cls: 'grid-2'|'grid-3'|'grid-4'|'row'|'letters'|'pics'|'numbers', container, hintAfter: 2 })
       */
      choose(opts) {
        const isOk = typeof opts.correct === 'function' ? opts.correct : (it) => it === opts.correct;
        const box = el('div', { class: 'choices ' + (opts.cls || '') });
        let okBtn = null;
        opts.items.forEach((item, i) => {
          const b = el('button', { class: 'choice', style: { animationDelay: i * 0.06 + 's' } });
          const c = opts.render ? opts.render(item, b) : String(item);
          if (typeof c === 'string' || typeof c === 'number') b.appendChild(el('span', { class: 'ch-txt', text: String(c) }));
          else if (c) b.appendChild(c);
          if (isOk(item)) okBtn = b;
          b.addEventListener('click', () => {
            if (roundDone || b.classList.contains('used')) return;
            const spoken = opts.sayOnTap ? opts.sayOnTap(item) : '';
            if (isOk(item)) ctx.correct(b, { say: spoken });
            else {
              b.classList.add('used');
              const wrongSay = opts.sayOnWrong ? opts.sayOnWrong(item) : (spoken ? 'Ez ' + spoken.replace(/[.!?]+$/, '') + '.' : '');
              const n = ctx.wrong(b, { say: wrongSay });
              if (n >= (opts.hintAfter || 2) && okBtn) ctx.hint(okBtn, { silent: true });
            }
          });
          box.appendChild(b);
        });
        (opts.container || stage).appendChild(box);
        return box;
      },
      /** elem, ami koppintásra kimond egy szöveget (pl. képek meghallgatása) */
      speakable(node, text, sayOpts) {
        node.classList.add('speakable');
        node.addEventListener('click', () => { Bubu.sfx('tap'); Bubu.say(typeof text === 'function' ? text() : text, sayOpts); });
        return node;
      },
      /** nagy instrukciós sor a feladat tetején (ikonok, kép) */
      header(content) {
        const h = el('div', { class: 'task-head' }, content);
        stage.appendChild(h);
        return h;
      },
    };

    /* A feladatot a rendelkezésre álló helyhez igazítjuk: nagy képernyőn nagyítunk, kicsin kicsinyítünk (ne kelljen görgetni). */
    const wrap = scr.querySelector('.stage-wrap');
    const topbarEl = scr.querySelector('.topbar');
    function fit() {
      if (!alive || !stage.isConnected) return;
      stage.style.zoom = '';
      stage.style.maxWidth = '';
      const cs = getComputedStyle(wrap);
      const availH = window.innerHeight - topbarEl.offsetHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 4;
      const availW = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const h = stage.scrollHeight;
      if (!h || availH <= 0) return;
      stage.classList.add('measuring'); // animációk nélkül mérünk (pl. beguruló vonat)
      let z = Math.min(1.6, availH / h);
      for (let i = 0; i < 4; i++) {
        stage.style.zoom = String(z);
        stage.style.maxWidth = Math.min(1150, availW / z) + 'px';
        let ratio = 1;
        const real = stage.scrollHeight * z;
        if (real > availH + 2) ratio = Math.min(ratio, availH / real);
        // szélesség: egyik elem se lógjon ki oldalt
        const wr = wrap.getBoundingClientRect();
        const left = wr.left + parseFloat(cs.paddingLeft), right = wr.right - parseFloat(cs.paddingRight);
        let minL = Infinity, maxR = -Infinity;
        stage.querySelectorAll(':scope > *, :scope > * > *').forEach((c) => {
          const r = c.getBoundingClientRect();
          if (r.width > 0) { minL = Math.min(minL, r.left); maxR = Math.max(maxR, r.right); }
        });
        if (minL < left - 2 || maxR > right + 2) ratio = Math.min(ratio, (right - left) / (maxR - minL));
        if (ratio >= 0.999) break;
        z = z * ratio * 0.98;
      }
      stage.classList.remove('measuring');
      z = Math.max(0.55, z);
      stage.style.zoom = String(z);
      stage.style.maxWidth = Math.min(1150, availW / z) + 'px';
      stage.style.setProperty('--zoom', z);
    }
    const onResize = () => fit();
    window.addEventListener('resize', onResize);

    function nextRound() {
      if (!alive) return;
      clearTimers();
      U.clearSelection();
      if (roundIdx >= total) { finish(); return; }
      roundDone = false; roundWrongs = 0;
      U.clear(stage);
      stage.className = 'stage round-in';
      updateDots();
      try {
        const r = game.round(ctx);
        if (r && typeof r.catch === 'function') r.catch((e) => roundError(e));
      } catch (e) { roundError(e); }
      fit();
      requestAnimationFrame(fit);
    }
    function roundError(e) {
      console.error('[Bubu] Hiba a játékban:', game.id, e);
      if (!alive) return;
      roundDone = true; roundIdx++;
      later(nextRound, 300);
    }
    function finish() {
      alive = false;
      window.removeEventListener('resize', onResize);
      const ms = Date.now() - t0;
      const stars = mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1;
      const rec = S.record(game.id, level, stars, mistakes, ms);
      const newStickers = awardStickers();
      resultScreen(game, level, stars, rec, newStickers);
    }

    show(scr);
    cleanup = () => { alive = false; clearTimers(); Bubu.stopSpeech(); window.removeEventListener('resize', onResize); };
    roundIdx = 0;
    nextRound();
  }

  /* =========================================================
   * Matricák
   * ========================================================= */
  function awardStickers() {
    const got = [];
    const total = S.totalStars();
    let guard = 0;
    while (S.state.stickers.length < Bubu.STICKERS.length && total >= Bubu.stickerThreshold(S.state.stickers.length) && guard++ < 50) {
      const remaining = Bubu.STICKERS.filter((s) => !S.state.stickers.includes(s.id));
      const s = U.pick(remaining);
      S.addSticker(s.id);
      got.push(s);
    }
    return got;
  }
  function nextStickerInfo() {
    const k = S.state.stickers.length;
    if (k >= Bubu.STICKERS.length) return null;
    const need = Bubu.stickerThreshold(k), prev = k === 0 ? 0 : Bubu.stickerThreshold(k - 1);
    const total = S.totalStars();
    return { need, left: Math.max(0, need - total), pct: Math.max(0, Math.min(100, Math.round(((total - prev) / (need - prev)) * 100))) };
  }

  /* =========================================================
   * 6) Eredmény
   * ========================================================= */
  function resultScreen(game, level, stars, rec, newStickers) {
    const w = Bubu.world(game.world);
    const starEls = [0, 1, 2].map(() => el('span', { class: 'rs-star', text: '★' }));
    const hasNext = level < game.levels.length;
    const btnAgain = el('button', { class: 'round-btn again', 'aria-label': 'Újra', onclick: () => { Bubu.sfx('pop'); playGame(game, level); } }, [el('span', { text: '🔁' })]);
    const btnNext = hasNext ? el('button', { class: 'round-btn next', 'aria-label': 'Tovább', onclick: () => { Bubu.sfx('pop'); playGame(game, level + 1); } }, [el('span', { text: '⏩' })]) : null;
    const btnBack = el('button', { class: 'round-btn back', 'aria-label': 'Vissza', onclick: () => { Bubu.sfx('pop'); worldScreen(w.id, true); } }, [el('span', { text: '🏝️' })]);
    const scr = el('div', { class: 'screen result-screen', style: { background: w.bg, '--c': w.color, '--d': w.dark } }, [
      el('div', { class: 'panel result-panel pop-in' }, [
        el('div', { class: 'rs-game', text: game.icon }),
        el('div', { class: 'rs-stars' }, starEls),
        mascot('result'),
        el('div', { class: 'rs-buttons' }, [btnBack, btnAgain, btnNext]),
      ]),
    ]);
    show(scr);
    let alive = true;
    cleanup = () => { alive = false; };

    (async () => {
      await U.wait(400);
      for (let i = 0; i < stars; i++) {
        if (!alive) return;
        starEls[i].classList.add('on');
        Bubu.sfx('star');
        await U.wait(420);
      }
      if (!alive) return;
      if (stars === 3) { confettiRain(70); Bubu.sfx('win'); mood('cheer', 3000); }
      else mood('happy', 2000);
      const msg = stars === 3
        ? U.pick(['Hibátlan! Három csillag!', 'Hű, ez tökéletes volt! Három csillag!', 'Szuper vagy! Mind a három csillag a tiéd!'])
        : stars === 2 ? U.pick(['Szép munka! Két csillag!', 'Nagyon ügyes! Két csillagot kaptál!'])
          : U.pick(['Megcsináltad! Egy csillag. Gyakoroljunk még, és legközelebb több lesz!', 'Ügyes voltál! Egy csillag. Próbáld újra, menni fog!']);
      let extra = '';
      if (hasNext && level === 1 && rec.prev === 0) extra = ' Kinyílt a közepes szint!';
      else if (hasNext && level === 2 && rec.prev === 0) extra = ' Kinyílt a nehéz szint!';
      if (extra) { Bubu.sfx('unlock'); U.anim(btnNext, 'bounce', 900); btnNext.classList.add('glow'); }
      await Bubu.say(msg + extra);
      if (!alive) return;
      for (const s of newStickers) {
        if (!alive) return;
        await stickerReveal(s);
      }
    })();
  }

  function stickerReveal(s) {
    return new Promise((resolve) => {
      const ov = el('div', { class: 'overlay sticker-overlay' }, [
        el('div', { class: 'rays' }),
        el('div', { class: 'sticker-big', text: s.emoji }),
        el('button', { class: 'round-btn ok-btn', 'aria-label': 'Rendben' }, [el('span', { text: '👍' })]),
      ]);
      const done = () => { ov.remove(); Bubu.stopSpeech(); resolve(); };
      ov.querySelector('.ok-btn').addEventListener('click', () => { Bubu.sfx('pop'); done(); });
      document.body.appendChild(ov);
      Bubu.sfx('sticker');
      confetti(ov.querySelector('.sticker-big'), 40);
      Bubu.say('Új matricát kaptál! Ez egy ' + s.name + '! Megtalálod a matricagyűjteményedben.');
    });
  }

  /* =========================================================
   * 7) Matricaalbum
   * ========================================================= */
  function albumScreen() {
    const owned = new Set(S.state.stickers);
    const info = nextStickerInfo();
    const grid = el('div', { class: 'album-grid' }, Bubu.STICKERS.map((s) => {
      const has = owned.has(s.id);
      return el('button', {
        class: 'sticker' + (has ? ' has' : ''),
        'aria-label': has ? s.name : 'még titok',
        onclick: (e) => {
          if (has) { Bubu.sfx('pop'); U.anim(e.currentTarget, 'bounce'); Bubu.say(s.name.charAt(0).toUpperCase() + s.name.slice(1) + '!'); }
          else { Bubu.sfx('tap'); Bubu.say('Ez még titok! Gyűjts csillagokat!'); }
        },
      }, has ? s.emoji : '❔');
    }));
    const scr = el('div', { class: 'screen album-screen' }, [
      el('div', { class: 'topbar' }, [
        iconBtn('⬅️', 'Vissza', () => mapScreen(), 'back'),
        el('h1', { class: 'world-title', text: '📒 Matricáim' }),
        el('div', { class: 'pill' }, [el('b', { text: owned.size + '/' + Bubu.STICKERS.length })]),
      ]),
      info ? el('div', { class: 'next-sticker' }, [
        el('span', { class: 'ns-q', text: '🎁' }),
        el('div', { class: 'bar' }, [el('div', { class: 'fill', style: { width: info.pct + '%' } })]),
        el('span', { class: 'ns-left', text: '⭐ ' + info.left }),
      ]) : null,
      grid,
      mascot('corner'),
    ]);
    show(scr);
    const left = info ? info.left : 0;
    Bubu.say(owned.size === 0
      ? 'Ez a matricagyűjteményed. Még üres, de minden csillaggal közelebb kerülsz egy új matricához!'
      : info ? 'Ezek a matricáid! Még ' + U.numWord(Math.min(left, 100)) + ' csillag, és kapsz egy újat!' : 'Hű! Az összes matricát összegyűjtötted!');
  }

  /* =========================================================
   * 8) Szülői sarok
   * ========================================================= */
  function parentGate() {
    const a = U.rand(6, 9), b = U.rand(6, 9);
    const correct = a * b;
    const opts = U.shuffle([correct, correct + a, correct - b, correct + 10].filter((v, i, arr) => arr.indexOf(v) === i));
    const ov = el('div', { class: 'overlay', onclick: (e) => { if (e.target === ov) ov.remove(); } }, [
      el('div', { class: 'panel gate-panel pop-in' }, [
        el('button', { class: 'close-x', onclick: () => ov.remove() }, '✖'),
        el('h2', { text: '👨‍👩‍👦 Szülői sarok' }),
        el('p', { text: 'Ellenőrző kérdés felnőtteknek:' }),
        el('div', { class: 'gate-q', text: a + ' × ' + b + ' = ?' }),
        el('div', { class: 'gate-opts' }, opts.map((v) => el('button', {
          class: 'gate-opt', text: String(v),
          onclick: () => { ov.remove(); if (v === correct) parentScreen(); else Bubu.sfx('wrong'); },
        }))),
      ]),
    ]);
    document.body.appendChild(ov);
  }

  function fmtMin(ms) {
    const m = Math.round(ms / 60000);
    return m < 60 ? m + ' perc' : Math.floor(m / 60) + ' óra ' + (m % 60) + ' perc';
  }

  function parentScreen() {
    const st = S.state;
    const sp = Bubu.speech;

    // --- hang ---
    const voiceSel = el('select', { class: 'p-select' });
    const fillVoices = () => {
      U.clear(voiceSel);
      const hu = sp.huVoices();
      voiceSel.appendChild(el('option', { value: '', text: 'Automatikus (' + (sp.voice ? sp.voice.name : 'nincs magyar hang') + ')' }));
      hu.forEach((v) => voiceSel.appendChild(el('option', { value: v.name, text: '🇭🇺 ' + v.name, selected: st.settings.voiceName === v.name })));
      const others = sp.voices.filter((v) => !hu.includes(v));
      if (others.length) {
        const g = el('optgroup', { label: 'Egyéb (nem magyar) hangok' });
        others.forEach((v) => g.appendChild(el('option', { value: v.name, text: v.name + ' (' + v.lang + ')', selected: st.settings.voiceName === v.name })));
        voiceSel.appendChild(g);
      }
      voiceStatus.innerHTML = !sp.supported
        ? '❌ Ez a böngésző nem támogatja a felolvasást.'
        : sp.hasHu ? '✅ Magyar hang elérhető: <b>' + (sp.voice ? sp.voice.name : '') + '</b>'
          : '⚠️ <b>Nincs magyar hang.</b> A gyerek nem tud olvasni, ezért a felolvasás nagyon fontos!';
    };
    const voiceStatus = el('p', { class: 'p-status' });
    voiceSel.addEventListener('change', () => { S.setting('voiceName', voiceSel.value || null); applySettings(); fillVoices(); Bubu.say('Szia! Én Bubu vagyok.'); });
    const rate = el('input', { type: 'range', min: '0.6', max: '1.3', step: '0.05', value: String(st.settings.rate) });
    const rateVal = el('span', { text: Math.round(st.settings.rate * 100) + '%' });
    rate.addEventListener('input', () => { rateVal.textContent = Math.round(rate.value * 100) + '%'; });
    rate.addEventListener('change', () => { S.setting('rate', parseFloat(rate.value)); applySettings(); Bubu.say('Ilyen gyorsan beszélek.'); });
    const toggle = (key, label) => {
      const cb = el('input', { type: 'checkbox', checked: st.settings[key] !== false && !!(key !== 'unlockAll' || st.settings[key]) });
      cb.addEventListener('change', () => { S.setting(key, cb.checked); applySettings(); });
      return el('label', { class: 'p-toggle' }, [cb, el('span', { text: label })]);
    };

    // --- statisztika ---
    const today = new Date();
    const dayKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const last7 = U.range(0, 6).map((i) => { const d = new Date(today); d.setDate(d.getDate() - (6 - i)); return { d, min: st.days[dayKey(d)] || 0 }; });
    const maxMin = Math.max(10, ...last7.map((x) => x.min));
    const DAYS = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];
    const chart = el('div', { class: 'p-chart' }, last7.map((x) => el('div', { class: 'p-col' }, [
      el('span', { class: 'p-v', text: x.min >= 1 ? Math.round(x.min) + "'" : '' }),
      el('div', { class: 'p-bar', style: { height: Math.max(2, (x.min / maxMin) * 100) + '%' } }),
      el('span', { class: 'p-d', text: DAYS[x.d.getDay()] }),
    ])));

    const playCount = {}, mistakesSum = {};
    st.log.forEach((r) => { playCount[r.g] = (playCount[r.g] || 0) + 1; mistakesSum[r.g] = (mistakesSum[r.g] || 0) + r.m; });

    const worldTables = Bubu.worlds.map((w) => {
      const ws = worldStars(w);
      const rows = Bubu.gamesOf(w.id).map((g) => el('tr', {}, [
        el('td', {}, [el('span', { class: 'p-gi', text: g.icon }), ' ', el('b', { text: g.name }), el('div', { class: 'p-topic', text: g.topic || '' })]),
        ...[0, 1, 2].map((i) => el('td', { class: 'p-lv' }, i < g.levels.length ? [starRow(S.best(g.id, i + 1), 3, 'small'), el('div', { class: 'p-topic', text: g.levels[i] })] : '–')),
        el('td', { class: 'p-num', text: String(playCount[g.id] || 0) }),
      ]));
      return el('details', { class: 'p-world', open: true }, [
        el('summary', {}, [w.icon + ' ' + w.name + ' – ' + w.subject + '  ', el('b', { text: '⭐ ' + ws.got + '/' + ws.max })]),
        el('table', { class: 'p-table' }, [
          el('thead', {}, el('tr', {}, [el('th', { text: 'Játék / tananyag' }), el('th', { text: '🌱 Könnyű' }), el('th', { text: '🌿 Közepes' }), el('th', { text: '🌳 Nehéz' }), el('th', { text: 'Játszva' })])),
          el('tbody', {}, rows),
        ]),
      ]);
    });

    const recent = st.log.slice(0, 12).map((r) => {
      const g = Bubu.game(r.g); const d = new Date(r.t);
      return el('li', {}, [
        el('span', { class: 'p-when', text: d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }) }),
        ' ', (g ? g.icon + ' ' + g.name : r.g) + ' – ' + Bubu.LEVEL_INFO[r.l - 1].say.toLowerCase() + ' – ' + '★'.repeat(r.s) + ' (' + r.m + ' hiba, ' + Math.max(1, Math.round(r.ms / 1000)) + ' mp)',
      ]);
    });

    // --- mentés ---
    const fileIn = el('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    fileIn.addEventListener('change', () => {
      const f = fileIn.files[0]; if (!f) return;
      f.text().then((t) => { try { S.import(t); parentScreen(); alert('Betöltve!'); } catch (e) { alert('Hibás mentésfájl.'); } });
    });
    const resetBtn = el('button', { class: 'p-btn danger', text: '🗑️ Haladás törlése' });
    let resetArmed = false;
    resetBtn.addEventListener('click', () => {
      if (!resetArmed) { resetArmed = true; resetBtn.textContent = '⚠️ Biztosan? Kattints újra a törléshez'; setTimeout(() => { resetArmed = false; resetBtn.textContent = '🗑️ Haladás törlése'; }, 4000); return; }
      S.reset(); applySettings(); parentScreen();
    });

    const scr = el('div', { class: 'screen parent-screen' }, [
      el('div', { class: 'topbar' }, [
        iconBtn('⬅️', 'Vissza', () => startScreen(), 'back'),
        el('h1', { class: 'world-title', text: '👨‍👩‍👦 Szülői sarok' }),
        el('div'),
      ]),
      el('div', { class: 'p-wrap' }, [
        el('section', { class: 'p-card' }, [
          el('h2', { text: '📊 Összesítés' }),
          el('div', { class: 'p-kpis' }, [
            kpi('⭐', S.totalStars(), 'csillag'),
            kpi('📒', st.stickers.length + '/' + Bubu.STICKERS.length, 'matrica'),
            kpi('🎮', st.log.length, 'lejátszott kör'),
            kpi('⏱️', fmtMin(st.playMs), 'összes játékidő'),
          ]),
          el('h3', { text: 'Játékidő az elmúlt 7 napban (perc)' }),
          chart,
        ]),
        el('section', { class: 'p-card' }, [
          el('h2', { text: '🔊 Hang és felolvasás' }),
          voiceStatus,
          el('div', { class: 'p-row' }, [el('span', { text: 'Felolvasó hang:' }), voiceSel, el('button', { class: 'p-btn', text: '▶ Próba', onclick: () => Bubu.say('Szia! Én Bubu vagyok, a kis sárkány. Számoljunk: egy, kettő, három!') })]),
          el('div', { class: 'p-row' }, [el('span', { text: 'Beszéd sebessége:' }), rate, rateVal]),
          el('div', { class: 'p-row' }, [toggle('speech', 'Felolvasás bekapcsolva'), toggle('sfx', 'Hangeffektek')]),
          el('div', { class: 'p-help', html: `
            <b>Tipp a legjobb hanghoz:</b> nyisd meg a játékot a <b>Microsoft Edge</b> böngészőben. Az Edge-ben van egy nagyon természetes magyar hang: <i>Microsoft Noémi</i> vagy <i>Tamás (Online, Natural)</i>. Ehhez internet kell.<br>
            <b>Internet nélkül:</b> Windows Gépház → Idő és nyelv → Nyelv és régió → Nyelv hozzáadása → <i>Magyar</i>, és pipáld be a <i>Szövegfelolvasás</i> lehetőséget. Ezután a „Microsoft Szabolcs” hang bármelyik böngészőben működik.<br>
            <b>Androidos tableten:</b> Beállítások → Kisegítő lehetőségek → Szövegfelolvasás → Google beszédszolgáltatás → Magyar hangadatok letöltése.<br>
            <b>iPaden:</b> Beállítások → Kisegítő lehetőségek → Felolvasott tartalom → Hangok → Magyar.` }),
        ]),
        el('section', { class: 'p-card' }, [
          el('h2', { text: '🎯 Haladás tantárgyanként' }),
          el('p', { class: 'p-help', text: 'Minden játéknak 3 szintje van (🌱 könnyű, 🌿 közepes, 🌳 nehéz). A következő szint akkor nyílik meg, ha az előzőn legalább 1 csillagot szerzett. Csillagok: 0–1 hiba = ★★★, 2–4 hiba = ★★, több = ★.' }),
          ...worldTables,
        ]),
        el('section', { class: 'p-card' }, [
          el('h2', { text: '🕘 Legutóbbi játékok' }),
          recent.length ? el('ul', { class: 'p-recent' }, recent) : el('p', { text: 'Még nem játszott.' }),
        ]),
        el('section', { class: 'p-card' }, [
          el('h2', { text: '⚙️ Beállítások és mentés' }),
          el('div', { class: 'p-row' }, [toggle('unlockAll', 'Minden szint legyen nyitva (pl. ha egy konkrét témát kell gyakorolni)')]),
          el('div', { class: 'p-row' }, [
            el('button', { class: 'p-btn', text: '💾 Mentés letöltése', onclick: () => {
              const blob = new Blob([S.export()], { type: 'application/json' });
              const a = el('a', { href: URL.createObjectURL(blob), download: 'bubu-mentes-' + dayKey(new Date()) + '.json' });
              document.body.appendChild(a); a.click(); a.remove();
            } }),
            el('button', { class: 'p-btn', text: '📂 Mentés betöltése', onclick: () => fileIn.click() }),
            fileIn,
            resetBtn,
          ]),
          el('p', { class: 'p-help', text: 'A haladás ebben a böngészőben tárolódik. Ha másik böngészőben vagy gépen folytatnád, töltsd le a mentést, és ott töltsd vissza.' }),
        ]),
        el('section', { class: 'p-card' }, [
          el('h2', { text: '💡 Hogyan játsszon?' }),
          el('ul', { class: 'p-tips' }, [
            el('li', { text: 'Minden feladatot Bubu, a kis sárkány mond el. A 🔊 gombbal vagy Bubura koppintva újra elmondja.' }),
            el('li', { text: 'Hibázni szabad: kedves bátorítást kap, második hibánál a játék megmutatja a jó megoldást.' }),
            el('li', { text: 'Egy kör 5–6 feladat, kb. 2–4 perc. Napi 15–20 perc bőven elég, legjobb, ha együtt kezditek.' }),
            el('li', { text: 'A Betűerdő a betűk tanulásához igazodik: hangok, szótagolás, szóolvasás. Érdemes a nehezebb szinteket akkor nyitni, amikor az iskolában már ott tartanak.' }),
            el('li', { text: 'Tableten a legkényelmesebb, teljes képernyőn. Egérrel és érintéssel is működik.' }),
          ]),
        ]),
      ]),
    ]);
    show(scr);
    fillVoices();
    Bubu.onVoicesChanged = fillVoices;
    cleanup = () => { Bubu.onVoicesChanged = null; };
  }
  function kpi(icon, val, label) {
    return el('div', { class: 'p-kpi' }, [el('span', { class: 'k-i', text: icon }), el('b', { text: String(val) }), el('span', { class: 'k-l', text: label })]);
  }

  /* =========================================================
   * Indítás
   * ========================================================= */
  // fejlesztéshez: index.html#game=math-count&level=2 – közvetlenül indít egy játékot
  Bubu.dev = { playGame, worldScreen, mapScreen, albumScreen, parentScreen, startScreen };
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get('game') && Bubu.game(hash.get('game'))) playGame(Bubu.game(hash.get('game')), parseInt(hash.get('level') || '1', 10));
  else startScreen();
})();
