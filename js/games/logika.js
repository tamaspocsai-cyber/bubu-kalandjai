/* Bubu kalandjai – Fejtörő-hegy (logika, figyelem, emlékezet, térbeli viszonyok) */
(function () {
  'use strict';
  const B = window.Bubu;
  const U = window.U;
  const W = 'logika';

  /* =========================================================
   * Közös segédek
   * ========================================================= */
  const VOWEL = /^[aáeéiíoóöőuúüű]/i;
  /** névelő: „a” vagy „az” (magánhangzó előtt) */
  const az = (w) => (VOWEL.test(w) ? 'az ' : 'a ') + w;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const Az = (w) => cap(az(w));
  /** igaz, amíg ez a kör él (nem ért véget, nem léptek ki, nem jött új kör) */
  const liveFn = (ctx) => { const r = ctx.round; return () => !ctx.done && ctx.round === r; };
  /** játékonkénti tároló (a ctx egy játék alatt ugyanaz) */
  const bag = (ctx) => ctx._logika || (ctx._logika = {});
  /** pakli: körönként a következő elem egy megkevert listából (így nincs ismétlődés) */
  function deck(ctx, key, list) {
    const b = bag(ctx);
    if (!b[key] || !b[key].length) b[key] = U.shuffle(list);
    return b[key].shift();
  }
  /** generálás ismétlődés nélkül (sig alapján) */
  function fresh(ctx, key, gen) {
    const b = bag(ctx);
    const used = b['used_' + key] || (b['used_' + key] = new Set());
    let t = null;
    for (let i = 0; i < 40; i++) { t = gen(); if (!used.has(t.sig)) break; }
    used.add(t.sig);
    return t;
  }
  function prep(ctx, cls) { ctx.stage.classList.add('g-logika', cls); }
  /** ctx.choose + utólagos hook a jó válaszra (a kérdőjel kitöltéséhez, árnyék „kivilágításához”) */
  function chooseThen(ctx, opts, onOk) {
    const box = ctx.choose(opts);
    let fired = false;
    box.addEventListener('click', () => {
      if (fired || !ctx.done || !ctx.alive) return;
      fired = true;
      if (onOk) onOk(box.querySelector('.choice.ok'));
    });
    return box;
  }
  /** saját, koppintható elemek (jelenetben): [{el, ok, say}] */
  function tapSet(ctx, list, isBusy) {
    const okEl = list.find((x) => x.ok).el;
    list.forEach((x) => {
      x.el.addEventListener('click', () => {
        if (ctx.done || x.el.classList.contains('used') || (isBusy && isBusy())) return;
        if (x.ok) ctx.correct(x.el, { say: x.say });
        else {
          x.el.classList.add('used');
          const n = ctx.wrong(x.el, { say: x.say });
          if (n >= 2) ctx.hint(okEl, { silent: true });
        }
      });
    });
  }
  const pic = (e, cls) => { const p = U.pic(e); if (cls) p.classList.add(cls); return p; };

  /* =========================================================
   * 1) MEMÓRIA
   * ========================================================= */
  const MEM_THEMES = {
    animals: { say: 'Most állatok bújtak el a lapok alatt.', items: [['🐶', 'kutya'], ['🐱', 'cica'], ['🐭', 'egér'], ['🐰', 'nyuszi'], ['🦊', 'róka'], ['🐻', 'maci'], ['🐼', 'panda'], ['🐸', 'béka'], ['🐵', 'majom'], ['🐷', 'malac'], ['🐮', 'tehén'], ['🦁', 'oroszlán']] },
    fruits: { say: 'Most gyümölcsök bújtak el a lapok alatt.', items: [['🍎', 'alma'], ['🍌', 'banán'], ['🍇', 'szőlő'], ['🍓', 'eper'], ['🍊', 'narancs'], ['🍐', 'körte'], ['🍒', 'cseresznye'], ['🍉', 'dinnye'], ['🍋', 'citrom'], ['🍍', 'ananász'], ['🥝', 'kivi'], ['🍑', 'barack']] },
    vehicles: { say: 'Most járművek bújtak el a lapok alatt.', items: [['🚗', 'autó'], ['🚌', 'busz'], ['🚓', 'rendőrautó'], ['🚑', 'mentőautó'], ['🚒', 'tűzoltóautó'], ['🚜', 'traktor'], ['🚲', 'bicikli'], ['🚀', 'rakéta'], ['🚁', 'helikopter'], ['⛵', 'hajó'], ['🚂', 'vonat'], ['✈️', 'repülő']] },
  };
  const MEM_LAYOUT = { 3: [3, 2], 4: [4, 2], 5: [5, 2], 6: [4, 3] };
  function memPairs(level, round) { return level === 1 ? 3 : level === 2 ? [4, 5, 5][round % 3] : 6; }
  /** hibaszámítás: csak akkor hiba, ha a második (párosítani próbált) lapot már korábban látta */
  function memIsMistake(seen, firstIdx, secondIdx) { return seen.has(secondIdx); }

  B.registerGame({
    id: 'logika-memory', world: W, name: 'Memória!', icon: '🃏',
    intro: 'Memóriajáték! Fordíts meg két lapot. Ha egyformák, megtaláltál egy párt.',
    levels: ['3 pár', '4–5 pár', '6 pár'], rounds: 3,
    topic: 'Vizuális emlékezet, figyelem, párosítás',
    _gen: { memPairs, memIsMistake, MEM_THEMES, MEM_LAYOUT },
    round(ctx) {
      prep(ctx, 'g-logika-memory');
      const live = liveFn(ctx);
      const themeKey = deck(ctx, 'theme', Object.keys(MEM_THEMES));
      const theme = MEM_THEMES[themeKey];
      const pairs = memPairs(ctx.level, ctx.round);
      const [cols, rows] = MEM_LAYOUT[pairs];
      const chosen = U.sample(theme.items, pairs);
      const cards = U.shuffle(chosen.concat(chosen)).map(([e, name], idx) => ({ e, name, idx, key: e, up: false, matched: false, el: null }));

      const grid = U.el('div', { class: 'lg-mgrid', style: { '--cols': cols, '--rows': rows } });
      grid.style.setProperty('--cols', cols);
      grid.style.setProperty('--rows', rows);
      ctx.stage.appendChild(grid);

      let first = null, busy = false, found = 0;
      const seen = new Set();
      const show = (c, up) => { c.up = up; c.el.classList.toggle('flipped', up); };

      cards.forEach((c, i) => {
        c.el = U.el('button', { class: 'lg-card', 'aria-label': 'Kártya', style: { animationDelay: i * 0.04 + 's' } }, [
          U.el('span', { class: 'lg-inner' }, [
            U.el('span', { class: 'lg-side lg-back' }, [U.el('span', { class: 'lg-q', text: '?' })]),
            U.el('span', { class: 'lg-side lg-face' }, [pic(c.e)]),
          ]),
        ]);
        c.el.addEventListener('click', () => tap(c));
        grid.appendChild(c.el);
      });

      function tap(c) {
        if (busy || ctx.done || c.up || c.matched) return;
        show(c, true);
        ctx.sfx('flip');
        if (!first) {
          first = c;
          // 2 hiba után segítünk: ha a párját már látta, finoman felvillan
          if (ctx.roundWrongs >= 2) {
            const mate = cards.find((o) => o !== c && o.key === c.key);
            if (mate && seen.has(mate.idx)) {
              mate.el.classList.add('hint');
              ctx.later(() => mate.el.classList.remove('hint'), 1500);
            }
          }
          return;
        }
        const a = first, b = c;
        first = null;
        busy = true;
        cards.forEach((o) => o.el.classList.remove('hint'));
        if (a.key === b.key) {
          a.matched = b.matched = true;
          found++;
          ctx.later(() => {
            if (!live()) return;
            a.el.classList.add('matched'); b.el.classList.add('matched');
            ctx.good(b.el, { sfx: 'pop', say: 'Két ' + a.name + '!' });
            busy = false;
            if (found === pairs) ctx.later(() => { if (live()) { ctx.confetti(grid, 40); ctx.correct(null, { say: 'Megtaláltad az összes párt!' }); } }, 900);
          }, 350);
        } else {
          const mistake = memIsMistake(seen, a.idx, b.idx);
          seen.add(a.idx); seen.add(b.idx);
          ctx.later(() => {
            if (!live()) return;
            if (mistake) {
              ctx.wrong(b.el, { silent: true });
              ctx.say('Nem pár! Ezt a lapot már láttad. Jól figyelj, mi hol volt!');
            } else {
              ctx.tone(260, 0.16, 'sine');
              ctx.say('Nem pár!');
            }
          }, 450);
          ctx.later(() => {
            if (!live()) return;
            show(a, false); show(b, false);
            busy = false;
          }, 1500);
        }
      }

      const askText = (ctx.round === 0 ? '' : theme.say + ' ') + 'Keresd meg a párokat!';
      if (ctx.level === 1) {
        // könnyű szinten egy pillanatra megmutatjuk a képeket
        busy = true;
        ctx.later(() => cards.forEach((c) => show(c, true)), 350);
        ctx.ask('Jól nézd meg a képeket! Aztán megfordulnak.').then(() => {
          ctx.later(() => {
            if (!live()) return;
            cards.forEach((c) => show(c, false));
            ctx.sfx('whoosh');
            busy = false;
            ctx.ask(askText);
          }, 1200);
        });
      } else {
        ctx.ask(askText);
      }
    },
  });

  /* =========================================================
   * 2) MI JÖN? – mintasor
   * ========================================================= */
  const PAT_POOLS = [
    ['🍎', '🍌', '🍇', '🍓', '🍊', '🍐'],
    ['🐶', '🐱', '🐰', '🐸', '🐵', '🐷'],
    ['❤️', '💛', '💚', '💙', '💜', '🧡'],
    ['⭐', '🌙', '☀️', '☁️', '⚡', '❄️'],
    ['🔺', '🔻', '🔷', '🔶', '⚫', '⚪'],
    ['🚗', '🚌', '🚲', '🚀', '⛵', '🚂'],
    ['⚽', '🏀', '🎈', '🎁', '🎲', '🔔'],
    ['🌸', '🌻', '🍄', '🌵', '🍁', '🌲'],
  ];
  const PAT_TYPES = { AB: [0, 1], ABC: [0, 1, 2], AAB: [0, 0, 1], ABB: [0, 1, 1], ABCD: [0, 1, 2, 3] };
  const GROW_DOTS = [['🔵', 'kék pötty'], ['🔴', 'piros pötty'], ['⭐', 'csillag'], ['🍎', 'alma'], ['❤️', 'szív']];

  function genPattern(level) {
    const type = level === 1 ? 'AB' : level === 2 ? U.pick(['ABC', 'AAB']) : U.pick(['ABB', 'ABCD', 'GROW']);
    if (type === 'GROW') {
      const dot = U.pick(GROW_DOTS);
      const start = U.rand(1, 2);
      const shown = U.rand(3, 4);
      const seq = U.range(0, shown - 1).map((i) => start + i);
      const answer = start + shown;
      const opts = [answer - 1, answer, answer + 1, answer - 2 >= 1 ? answer - 2 : answer + 2];
      return { type, grow: true, dot, seq, answer, options: U.shuffle(opts), sig: 'G' + start + shown + dot[0] };
    }
    const pat = PAT_TYPES[type];
    const p = pat.length;
    const distinct = new Set(pat).size;
    const pool = U.pick(PAT_POOLS);
    const els = U.sample(pool, distinct);
    const extra = level === 1 ? U.rand(0, 2) : p === 4 ? U.rand(0, 1) : U.rand(0, p - 1);
    const shown = 2 * p + extra; // legalább kétszer teljesen látszik a minta
    const seq = U.range(0, shown - 1).map((i) => els[pat[i % p]]);
    const answer = els[pat[shown % p]];
    const nOpt = level === 1 ? 3 : level === 2 ? U.pick([3, 4]) : 4;
    const others = U.shuffle(pool.filter((e) => !els.includes(e)));
    const options = U.shuffle(els.concat(others).slice(0, Math.max(nOpt, els.length)));
    return { type, grow: false, pat, els, seq, answer, options, sig: type + els.join('') };
  }
  function dotGroup(n, e) {
    return U.el('span', { class: 'lg-dots n' + n }, U.range(1, n).map(() => U.el('span', { class: 'lg-dot', text: e })));
  }

  B.registerGame({
    id: 'logika-pattern', world: W, name: 'Mi jön?', icon: '🔁',
    intro: 'Nézd meg jól a sort! Mindig ugyanúgy ismétlődik.',
    levels: ['AB AB', 'ABC, AAB', 'ABB, ABCD, növekvő'], rounds: 5,
    topic: 'Sorozatok, ismétlődő minták felismerése és folytatása',
    _gen: { genPattern },
    round(ctx) {
      prep(ctx, 'g-logika-pattern');
      const t = fresh(ctx, 'pat', () => genPattern(ctx.level));
      const n = t.seq.length + 1;
      const row = U.el('div', { class: 'lg-seq' + (t.grow ? ' grow' : '') });
      row.style.setProperty('--n', n);
      t.seq.forEach((v, i) => {
        const cell = U.el('div', { class: 'lg-cell', style: { animationDelay: i * 0.12 + 's' } }, [t.grow ? dotGroup(v, t.dot[0]) : pic(v)]);
        row.appendChild(cell);
      });
      const q = U.el('div', { class: 'lg-cell lg-qcell', style: { animationDelay: t.seq.length * 0.12 + 's' } }, [U.el('span', { class: 'lg-qmark', text: '?' })]);
      row.appendChild(q);
      ctx.header(row);

      chooseThen(ctx, {
        items: t.options,
        correct: t.answer,
        cls: 'pics row',
        render: (v) => (t.grow ? dotGroup(v, t.dot[0]) : pic(v)),
        sayOnTap: t.grow ? (v) => U.numWord(v) + ' ' + t.dot[1] : null,
        hintAfter: 2,
      }, () => {
        U.clear(q);
        q.classList.add('filled');
        q.appendChild(t.grow ? dotGroup(t.answer, t.dot[0]) : pic(t.answer));
        U.anim(q, 'pop', 600);
      });

      if (t.grow) ctx.ask('Nézd, mindig eggyel több lesz! Mi jön a kérdőjel helyére?');
      else if (ctx.round === 0) ctx.ask('Mi jön a kérdőjel helyére? Folytasd a sort!');
      else ctx.ask(U.pick(['Mi jön a kérdőjel helyére?', 'Folytasd a sort! Mi jön most?', 'Mi következik a sorban?']));
    },
  });

  /* =========================================================
   * 3) KAKUKKTOJÁS
   * ========================================================= */
  const CATS = {
    gyumolcs: { n: 'gyümölcs', items: [['🍎', 'alma'], ['🍌', 'banán'], ['🍇', 'szőlő'], ['🍓', 'eper'], ['🍊', 'narancs'], ['🍐', 'körte'], ['🍒', 'cseresznye'], ['🍋', 'citrom'], ['🍍', 'ananász'], ['🍉', 'dinnye']] },
    zoldseg: { n: 'zöldség', items: [['🥕', 'répa'], ['🥦', 'brokkoli'], ['🌽', 'kukorica'], ['🥒', 'uborka'], ['🍆', 'padlizsán'], ['🥔', 'krumpli']] },
    jarmu: { n: 'jármű', items: [['🚗', 'autó'], ['🚌', 'busz'], ['🚂', 'vonat'], ['✈️', 'repülő'], ['🚲', 'bicikli'], ['⛵', 'hajó'], ['🚜', 'traktor'], ['🚁', 'helikopter']] },
    allat: { n: 'állat', items: [['🐶', 'kutya'], ['🐱', 'cica'], ['🐴', 'ló'], ['🐮', 'tehén'], ['🐷', 'malac'], ['🐰', 'nyuszi'], ['🦁', 'oroszlán'], ['🐵', 'majom']] },
    ruha: { n: 'ruhadarab', items: [['👕', 'póló'], ['👖', 'nadrág'], ['👒', 'kalap'], ['🧦', 'zokni'], ['🧢', 'sapka'], ['🧣', 'sál'], ['🧤', 'kesztyű']] },
    hangszer: { n: 'hangszer', items: [['🎸', 'gitár'], ['🎺', 'trombita'], ['🥁', 'dob'], ['🎹', 'zongora'], ['🎻', 'hegedű']] },
  };
  // nehéz szint: finomabb szempontok
  const ODD_COLOR = {
    piros: [['🍎', 'alma'], ['🍓', 'eper'], ['🍒', 'cseresznye']],
    zöld: [['🍏', 'alma'], ['🍐', 'körte'], ['🥝', 'kivi']],
    sárga: [['🍌', 'banán'], ['🍋', 'citrom']],
  };
  const ODD_FLY = [
    { yes: [['🐦', 'madár'], ['🦋', 'pillangó'], ['🐝', 'méhecske'], ['🦅', 'sas'], ['🦉', 'bagoly']], no: [['🐘', 'elefánt'], ['🐢', 'teknős'], ['🐌', 'csiga'], ['🐷', 'malac'], ['🐶', 'kutya'], ['🐴', 'ló']], who: 'ki' },
    { yes: [['✈️', 'repülő'], ['🚁', 'helikopter'], ['🚀', 'rakéta']], no: [['🚗', 'autó'], ['🚂', 'vonat'], ['🚌', 'busz'], ['🚲', 'bicikli'], ['🚜', 'traktor']], who: 'mi' },
  ];
  const ODD_SWIM = { yes: [['🐟', 'hal'], ['🐬', 'delfin'], ['🐙', 'polip'], ['🐳', 'bálna'], ['🦈', 'cápa']], no: [['🐶', 'kutya'], ['🐱', 'cica'], ['🐴', 'ló'], ['🐘', 'elefánt'], ['🐔', 'tyúk'], ['🐰', 'nyuszi']] };
  const ODD_SIZE = [['🐻', 'maci'], ['🍎', 'alma'], ['⭐', 'csillag'], ['🎈', 'lufi'], ['🐢', 'teknős'], ['🌻', 'napraforgó'], ['🐱', 'cica'], ['🍄', 'gomba']];
  const ODD_DIR = [['🐌', 'csiga'], ['🐘', 'elefánt'], ['🐕', 'kutya'], ['🐟', 'hal'], ['🦒', 'zsiráf'], ['🐓', 'kakas'], ['🚜', 'traktor'], ['🦔', 'sün']];
  const ODD_ARROWS = [['➡️', '⬅️'], ['⬆️', '⬇️']];

  /** item: {e, name, odd, scale, flip, attr} – attr: a szempont szerinti érték (pontosan egy tér el) */
  function genOdd(level, crit) {
    const mk = (pair, attr, extra) => Object.assign({ e: pair[0], name: pair[1], attr, odd: false, scale: 1, flip: false }, extra || {});
    let items, odd, reason, clue = '', sig;
    if (level === 1) {
      let ka, kb;
      do { [ka, kb] = U.sample(Object.keys(CATS), 2); } while ([ka, kb].includes('gyumolcs') && [ka, kb].includes('zoldseg')); // „teljesen más” legyen

      const same = U.pick(CATS[ka].items);
      const other = U.pick(CATS[kb].items);
      items = [mk(same, same[0]), mk(same, same[0]), mk(same, same[0])];
      odd = mk(other, other[0]);
      reason = Az(other[1]) + ' nem ' + same[1] + '. A többi mind ' + same[1] + '.';
      sig = same[0] + other[0];
    } else if (level === 2) {
      const [ka, kb] = U.sample(Object.keys(CATS), 2);
      const nMaj = U.pick([3, 4]);
      const maj = U.sample(CATS[ka].items, nMaj);
      const other = U.pick(CATS[kb].items);
      items = maj.map((p) => mk(p, ka));
      odd = mk(other, kb);
      reason = Az(other[1]) + ' ' + CATS[kb].n + ', a többi mind ' + CATS[ka].n + '.';
      sig = ka + kb + other[0];
    } else {
      const nMaj = U.pick([3, 4]);
      if (crit === 'color') {
        const majC = U.pick(['piros', 'zöld']);
        const oddC = U.pick(Object.keys(ODD_COLOR).filter((c) => c !== majC));
        const o = U.pick(ODD_COLOR[oddC]);
        items = ODD_COLOR[majC].map((p) => mk(p, majC));
        odd = mk(o, oddC);
        reason = Az(o[1]) + ' ' + oddC + ', a többi mind ' + majC + '.';
        clue = 'Figyeld a színeket!';
        sig = 'c' + majC + o[0];
      } else if (crit === 'fly') {
        const set = U.pick(ODD_FLY);
        const o = U.pick(set.no);
        items = U.sample(set.yes, nMaj).map((p) => mk(p, 'fly'));
        odd = mk(o, 'nofly');
        reason = Az(o[1]) + ' nem tud repülni, a többi mind repül.';
        clue = 'Gondold végig, ' + set.who + ' tud repülni!';
        sig = 'f' + o[0];
      } else if (crit === 'swim') {
        const o = U.pick(ODD_SWIM.no);
        items = U.sample(ODD_SWIM.yes, nMaj).map((p) => mk(p, 'water'));
        odd = mk(o, 'land');
        reason = Az(o[1]) + ' nem a vízben él. A többi mind a vízben úszik.';
        clue = 'Gondold végig, ki él a vízben!';
        sig = 's' + o[0];
      } else if (crit === 'size') {
        const p = U.pick(ODD_SIZE);
        const oddSmall = Math.random() < 0.5;
        const majScale = oddSmall ? 1 : 0.6, oddScale = oddSmall ? 0.55 : 1;
        items = U.range(1, nMaj).map(() => mk(p, majScale, { scale: majScale }));
        odd = mk(p, oddScale, { scale: oddScale });
        reason = 'Ez ' + az(p[1]) + (oddSmall ? ' kicsi, a többi mind nagy.' : ' nagy, a többi mind kicsi.');
        clue = 'Figyeld a méretüket!';
        sig = 'z' + p[0];
      } else {
        // irány
        if (Math.random() < 0.3) {
          const [a, b] = U.pick(ODD_ARROWS);
          const swap = Math.random() < 0.5;
          const majE = swap ? b : a, oddE = swap ? a : b;
          items = U.range(1, nMaj).map(() => mk([majE, 'nyíl'], majE));
          odd = mk([oddE, 'nyíl'], oddE);
          reason = 'Ez a nyíl a másik irányba mutat.';
          clue = 'Figyeld, merre mutatnak!';
          sig = 'a' + majE;
        } else {
          const p = U.pick(ODD_DIR);
          const majFlip = Math.random() < 0.5;
          items = U.range(1, nMaj).map(() => mk(p, majFlip, { flip: majFlip }));
          odd = mk(p, !majFlip, { flip: !majFlip });
          reason = 'Ez ' + az(p[1]) + ' a másik irányba néz.';
          clue = 'Figyeld, merre néznek!';
          sig = 'd' + p[0];
        }
      }
    }
    odd.odd = true;
    return { items: U.shuffle(items.concat([odd])), odd, reason, clue, sig };
  }

  B.registerGame({
    id: 'logika-odd', world: W, name: 'Kakukktojás!', icon: '🥚',
    intro: 'Kakukktojás! Egy kép nem illik a többi közé. Keresd meg!',
    levels: ['3 egyforma + 1 más', 'fajták (gyümölcs, jármű…)', 'szín, méret, irány, repül, úszik'], rounds: 5,
    topic: 'Csoportosítás, közös tulajdonság felismerése, kakukktojás',
    _gen: { genOdd },
    round(ctx) {
      prep(ctx, 'g-logika-odd');
      const crit = ctx.level === 3 ? deck(ctx, 'crit', ['color', 'fly', 'swim', 'size', 'dir']) : null;
      const t = fresh(ctx, 'odd', () => genOdd(ctx.level, crit));
      chooseThen(ctx, {
        items: t.items,
        correct: (it) => it.odd,
        cls: 'pics row' + (t.items.length > 4 ? ' many' : ''),
        render: (it) => {
          const p = pic(it.e, 'lg-oddpic');
          const tr = [];
          if (it.flip) tr.push('scaleX(-1)');
          if (it.scale !== 1) tr.push('scale(' + it.scale + ')');
          if (tr.length) p.style.transform = tr.join(' ');
          return p;
        },
        sayOnTap: (it) => (it.odd ? t.reason : it.name + (t.clue ? '. ' + t.clue : '')),
        hintAfter: 2,
      });
      ctx.ask(ctx.round === 0 ? 'Melyik nem illik a többi közé? Koppints rá!' : U.pick(['Melyik nem illik a többi közé?', 'Melyik a kakukktojás?', 'Melyik lóg ki a sorból?']));
    },
  });

  /* =========================================================
   * 4) MERRE VAN? – térbeli viszonyok
   * ========================================================= */
  const THINGS = [
    ['🐱', 'cica', 'cicát'], ['🐶', 'kutya', 'kutyát'], ['⚽', 'labda', 'labdát'], ['🍎', 'alma', 'almát'],
    ['🐻', 'maci', 'macit'], ['🚗', 'autó', 'autót'], ['🐦', 'madár', 'madarat'], ['🦋', 'pillangó', 'pillangót'],
    ['🐌', 'csiga', 'csigát'], ['🍄', 'gomba', 'gombát'], ['🎈', 'lufi', 'lufit'], ['🐞', 'katica', 'katicát'],
    ['🐰', 'nyuszi', 'nyuszit'], ['🌸', 'virág', 'virágot'], ['🐸', 'béka', 'békát'], ['🎁', 'ajándék', 'ajándékot'],
    ['⭐', 'csillag', 'csillagot'], ['🐤', 'csibe', 'csibét'],
  ].map(([e, name, acc]) => ({ e, name, acc }));
  const ANIMALS_HIDE = THINGS.filter((t) => ['cica', 'kutya', 'nyuszi', 'maci', 'csibe', 'béka'].includes(t.name));
  const MOVABLE = THINGS.filter((t) => ['labda', 'maci', 'alma', 'cica', 'autó', 'lufi', 'csibe', 'ajándék'].includes(t.name));
  const ANCHORS = [['🌳', 'fa'], ['🏠', 'ház'], ['📦', 'doboz'], ['🛏️', 'ágy'], ['⛺', 'sátor'], ['☂️', 'esernyő']].map(([e, name]) => ({ e, name }));
  const HIDE_ANCHORS = ANCHORS.filter((a) => ['fa', 'ház', 'doboz'].includes(a.name));
  const REL = {
    above: { dr: -1, dc: 0, pos: 'fölött', lat: 'fölé' },
    below: { dr: 1, dc: 0, pos: 'alatt', lat: 'alá' },
    left: { dr: 0, dc: -1, pos: 'bal oldalán', lat: 'bal oldalára' },
    right: { dr: 0, dc: 1, pos: 'jobb oldalán', lat: 'jobb oldalára' },
  };
  const GLOVE_TIP = ' A bal oldal ott van, ahol a kesztyű.';

  /**
   * Jelenet-leírás (DOM nélkül, tesztelhető):
   * { kind, rows, cols, anchor:{r,c,e,name}|null, cells:[{r,c,thing,ok}], ask, sayOk, glove, ... }
   */
  function genWhere(kind) {
    const anchor = U.pick(ANCHORS);
    if (kind === 'col') {
      const [a, b] = U.sample(THINGS, 2);
      const relKey = U.pick(['above', 'below']);
      const cells = [{ r: 0, c: 0, thing: a, ok: relKey === 'above' }, { r: 2, c: 0, thing: b, ok: relKey === 'below' }];
      const okT = cells.find((x) => x.ok).thing;
      return { kind, rows: 3, cols: 1, relKey, anchor: Object.assign({ r: 1, c: 0 }, anchor), cells,
        ask: 'Mi van ' + az(anchor.name) + ' ' + REL[relKey].pos + '?',
        sayOk: Az(okT.name) + ' ' + az(anchor.name) + ' ' + REL[relKey].pos + ' van.',
        sig: kind + relKey + anchor.name };
    }
    if (kind === 'shelf') {
      const ts = U.sample(THINGS, 3);
      const top = Math.random() < 0.5;
      const cells = ts.map((t, i) => ({ r: i, c: 0, thing: t, ok: top ? i === 0 : i === 2 }));
      const okT = cells.find((x) => x.ok).thing;
      return { kind, rows: 3, cols: 1, anchor: null, cells, relKey: top ? 'top' : 'bottom',
        ask: top ? 'Mi van a legfelső polcon?' : 'Mi van a legalsó polcon?',
        sayOk: Az(okT.name) + (top ? ' van a legfelső polcon.' : ' van a legalsó polcon.'),
        sig: kind + (top ? 't' : 'b') + ts[0].name };
    }
    if (kind === 'plus') {
      const relKey = U.pick(['left', 'right']);
      const keys = ['left', 'right'].concat(U.sample(['above', 'below'], U.rand(1, 2)));
      const ts = U.sample(THINGS, keys.length);
      const cells = keys.map((k, i) => ({ r: 1 + REL[k].dr, c: 1 + REL[k].dc, thing: ts[i], ok: k === relKey }));
      const okT = cells.find((x) => x.ok).thing;
      return { kind, rows: 3, cols: 3, relKey, glove: true, anchor: Object.assign({ r: 1, c: 1 }, anchor), cells,
        ask: 'Mi van ' + az(anchor.name) + ' ' + REL[relKey].pos + '?',
        sayOk: Az(okT.name) + ' ' + az(anchor.name) + ' ' + REL[relKey].pos + ' van.',
        sig: kind + relKey + anchor.name };
    }
    if (kind === 'twins') {
      const relKey = U.pick(['left', 'right']);
      const t = U.pick(THINGS);
      const cells = [{ r: 0, c: 0, thing: t, ok: relKey === 'left' }, { r: 0, c: 2, thing: t, ok: relKey === 'right' }];
      return { kind, rows: 1, cols: 3, relKey, glove: true, anchor: Object.assign({ r: 0, c: 1 }, anchor), cells,
        ask: 'Melyik ' + t.name + ' van ' + az(anchor.name) + ' ' + REL[relKey].pos + '? Koppints rá!',
        sayOk: 'Ez ' + az(t.name) + ' van ' + az(anchor.name) + ' ' + REL[relKey].pos + '.',
        sig: kind + relKey + t.name };
    }
    if (kind === 'between' || kind === 'beside') {
      const n = U.rand(4, 5);
      const ts = U.sample(THINGS, n);
      const cells = ts.map((t, i) => ({ r: 0, c: i, thing: t, ok: false }));
      if (kind === 'between') {
        const i = U.rand(1, n - 2);
        cells[i].ok = true;
        const A = ts[i - 1], Bt = ts[i + 1];
        return { kind, rows: 1, cols: n, anchor: null, cells, refs: [i - 1, i + 1],
          ask: 'Mi van ' + az(A.name) + ' és ' + az(Bt.name) + ' között?',
          sayOk: Az(ts[i].name) + ' ' + az(A.name) + ' és ' + az(Bt.name) + ' között van.',
          sig: kind + ts[i].name };
      }
      const end = Math.random() < 0.5 ? 0 : n - 1;
      const nb = end === 0 ? 1 : n - 2;
      cells[nb].ok = true;
      return { kind, rows: 1, cols: n, anchor: null, cells, refs: [end],
        ask: 'Mi van ' + az(ts[end].name) + ' mellett?',
        sayOk: Az(ts[nb].name) + ' ' + az(ts[end].name) + ' mellett van.',
        sig: kind + ts[end].name };
    }
    if (kind === 'hide') {
      const anc = U.pick(HIDE_ANCHORS);
      const [behind, front, side] = U.sample(ANIMALS_HIDE, 3);
      const relKey = U.pick(['behind', 'front']);
      const pos = relKey === 'behind' ? 'mögött' : 'előtt';
      const cells = [{ slot: 'behind', thing: behind, ok: relKey === 'behind' }, { slot: 'front', thing: front, ok: relKey === 'front' }, { slot: 'side', thing: side, ok: false }];
      const okT = cells.find((x) => x.ok).thing;
      return { kind, anchor: anc, cells, relKey, mirror: Math.random() < 0.5,
        ask: 'Ki van ' + az(anc.name) + ' ' + pos + '?',
        sayOk: Az(okT.name) + ' ' + az(anc.name) + ' ' + pos + ' van.',
        sig: kind + relKey + anc.name };
    }
    // place: kétlépéses – válaszd ki a tárgyat, és tedd a jó helyre
    const relKey = U.pick(['above', 'below', 'left', 'right', 'below', 'beside']);
    const tray = U.sample(MOVABLE, 3);
    const want = tray[0];
    const lat = relKey === 'beside' ? 'mellé' : REL[relKey].lat;
    const accept = relKey === 'beside' ? ['left', 'right'] : [relKey];
    const slots = ['above', 'below', 'left', 'right'].map((k) => ({ r: 1 + REL[k].dr, c: 1 + REL[k].dc, key: k, ok: accept.includes(k) }));
    return { kind: 'place', rows: 3, cols: 3, relKey, accept, glove: relKey === 'left' || relKey === 'right', anchor: Object.assign({ r: 1, c: 1 }, anchor),
      tray: U.shuffle(tray), want, slots,
      ask: 'Tedd ' + az(want.acc) + ' ' + az(anchor.name) + ' ' + lat + '!',
      sayOk: Az(want.name) + ' ' + az(anchor.name) + ' ' + (relKey === 'beside' ? 'mellett' : REL[relKey].pos) + ' van.',
      sig: 'place' + relKey + want.name + anchor.name };
  }
  function whereKinds(level) {
    if (level === 1) return ['col', 'shelf', 'col', 'shelf', 'col'];
    if (level === 2) return ['plus', 'twins', 'plus', 'twins', 'plus'];
    return ['between', 'beside', 'hide', 'place', 'place'];
  }

  function glove() {
    return U.el('div', { class: 'lg-glove', 'aria-hidden': 'true' }, [pic('🧤'), U.el('span', { class: 'lg-glove-arrow', text: '⬅️' })]);
  }

  B.registerGame({
    id: 'logika-where', world: W, name: 'Merre van?', icon: '🧭',
    intro: 'Figyeld, mi hol van!',
    levels: ['fent, lent, fölött, alatt', 'bal és jobb oldal', 'között, mellett, mögött, tedd oda!'], rounds: 5,
    topic: 'Térbeli viszonyok: fent–lent, alatt–fölött, bal–jobb, előtt–mögött, között, mellett',
    _gen: { genWhere, whereKinds, REL },
    round(ctx) {
      prep(ctx, 'g-logika-where');
      const kind = deck(ctx, 'kind', whereKinds(ctx.level));
      const s = fresh(ctx, 'where-' + kind, () => genWhere(kind));
      const wrap = U.el('div', { class: 'lg-wwrap' + (s.glove ? ' with-glove' : '') });
      if (s.glove) wrap.appendChild(glove());
      ctx.stage.appendChild(wrap);
      let ask = s.ask + (s.glove && (ctx.level === 2 ? ctx.round < 2 : true) ? GLOVE_TIP : '');

      const thingBtn = (t) => U.el('button', { class: 'lg-thing', 'aria-label': t.name }, [pic(t.e)]);
      const wrongSay = (t) => 'Ez ' + az(t.name) + '.';

      if (s.kind === 'shelf') {
        const shelf = U.el('div', { class: 'lg-shelf' });
        const list = s.cells.map((c) => {
          const b = thingBtn(c.thing);
          shelf.appendChild(U.el('div', { class: 'lg-plank' }, [b]));
          return { el: b, ok: c.ok, say: c.ok ? s.sayOk : '' };
        });
        wrap.appendChild(shelf);
        list.forEach((x, i) => { if (!x.ok) x.say = wrongSay(s.cells[i].thing); });
        tapSet(ctx, list);
      } else if (s.kind === 'hide') {
        const scene = U.el('div', { class: 'lg-hide' + (s.mirror ? ' mirror' : '') });
        scene.appendChild(U.el('span', { class: 'lg-hanchor' }, [pic(s.anchor.e)]));
        const list = s.cells.map((c) => {
          const b = U.el('button', { class: 'lg-thing lg-h-' + c.slot, 'aria-label': c.thing.name }, [pic(c.thing.e)]);
          scene.appendChild(b);
          return { el: b, ok: c.ok, say: c.ok ? s.sayOk : wrongSay(c.thing) };
        });
        wrap.appendChild(scene);
        tapSet(ctx, list);
      } else if (s.kind === 'place') {
        const grid = U.el('div', { class: 'lg-wgrid' });
        grid.style.setProperty('--cols', 3); grid.style.setProperty('--rows', 3);
        const slotEls = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
          let cell;
          if (r === 1 && c === 1) cell = U.el('div', { class: 'lg-wcell lg-anchor' }, [pic(s.anchor.e)]);
          else {
            const sl = s.slots.find((x) => x.r === r && x.c === c);
            if (sl) { cell = U.el('div', { class: 'lg-wcell lg-slot' }); cell._slot = sl; slotEls.push(cell); U.dropTarget(cell); }
            else cell = U.el('div', { class: 'lg-wcell lg-empty' });
          }
          grid.appendChild(cell);
        }
        wrap.appendChild(grid);
        const tray = U.el('div', { class: 'lg-tray' });
        ctx.stage.appendChild(tray);
        const okSlots = slotEls.filter((x) => x._slot.ok);
        let wantEl = null;
        const hintNow = () => { if (wantEl) ctx.hint(wantEl, { silent: true }); okSlots.forEach((x) => ctx.hint(x, { silent: true })); };
        s.tray.forEach((t) => {
          const it = U.el('div', { class: 'lg-thing lg-mov', 'aria-label': t.name }, [pic(t.e)]);
          if (t === s.want) wantEl = it;
          tray.appendChild(it);
          U.draggable(it, {
            targets: () => slotEls,
            onDrop(target) {
              if (ctx.done) return false;
              if (t !== s.want) {
                const n = ctx.wrong(it, { say: 'Ez nem ' + az(s.want.name) + ', hanem ' + az(t.name) + '.' });
                if (n >= 2) hintNow();
                return false;
              }
              const sl = target._slot;
              if (!sl.ok) {
                const n = ctx.wrong(target, { say: 'Ez ' + az(s.anchor.name) + ' ' + REL[sl.key].pos + ' van.' });
                if (n >= 2) hintNow();
                return false;
              }
              it.classList.add('done');
              target.appendChild(it);
              U.anim(it, 'pop', 600);
              ctx.correct(target, { say: s.sayOk });
              return true;
            },
          });
        });
        if (!bag(ctx).placeTold) { bag(ctx).placeTold = true; ask += ' Húzd oda! Vagy koppints rá, aztán a helyére!'; }
      } else {
        // rács: col / plus / twins / between / beside
        const grid = U.el('div', { class: 'lg-wgrid kind-' + s.kind });
        grid.style.setProperty('--cols', s.cols); grid.style.setProperty('--rows', s.rows);
        const list = [];
        for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) {
          let cell;
          const it = s.cells.find((x) => x.r === r && x.c === c);
          if (s.anchor && s.anchor.r === r && s.anchor.c === c) cell = U.el('div', { class: 'lg-wcell lg-anchor' }, [pic(s.anchor.e)]);
          else if (it) {
            const b = thingBtn(it.thing);
            cell = U.el('div', { class: 'lg-wcell' }, [b]);
            list.push({ el: b, ok: it.ok, say: it.ok ? s.sayOk : (s.kind === 'twins' ? 'Ez ' + az(s.anchor.name) + ' ' + REL[s.relKey === 'left' ? 'right' : 'left'].pos + ' van.' : wrongSay(it.thing)) });
          } else cell = U.el('div', { class: 'lg-wcell lg-empty' });
          grid.appendChild(cell);
        }
        wrap.appendChild(grid);
        tapSet(ctx, list);
      }
      if (s.glove) {
        // a kesztyű legyen mindig a jelenet bal oldalán
        wrap.appendChild(U.el('div', { class: 'lg-glove-spacer' }));
      }
      ctx.ask(ask);
      ctx.setRepeat(s.ask + (s.glove ? GLOVE_TIP : ''));
    },
  });

  /* =========================================================
   * 5) ÁRNYÉKVADÁSZ
   * ========================================================= */
  const SH_DIFF = ['🐘', '🍌', '⭐', '🎈', '🏠', '✂️', '🔑', '☂️', '🐌', '🦒', '🍄', '🚀', '⛄', '🎸', '🐟', '🌙', '🦋', '🍐', '⚓', '🔔'];
  const SH_SIMILAR = [
    ['🐱', '🐰', '🐭', '🐻', '🐷', '🐸', '🐵', '🦁', '🐮'],
    ['🍎', '🍐', '🍌', '🍓', '🍒', '🍇', '🍋', '🍍'],
    ['🚗', '🚌', '🚜', '🚂', '🚲', '🛴', '🚁', '✈️'],
    ['🐦', '🐧', '🦉', '🦆', '🐓', '🦅', '🐤'],
  ];
  const SH_ASYM = ['🐌', '🐘', '🐕', '🐈', '🦒', '🐟', '🦔', '🦕', '🦖', '🐓', '🚜', '🛴', '🐊'];
  const ORIENT = { n: 'none', m: 'scaleX(-1)', u: 'rotate(180deg)', um: 'scaleY(-1)', r90: 'rotate(90deg)', r270: 'rotate(-90deg)' };
  const ORIENT_M = { n: [1, 0, 0, 1], m: [-1, 0, 0, 1], u: [-1, 0, 0, -1], um: [1, 0, 0, -1], r90: [0, -1, 1, 0], r270: [0, 1, -1, 0] };

  function genShadow(level, round) {
    if (level === 3) {
      const e = U.pick(SH_ASYM);
      const to = U.pick(['n', 'm']);
      const other = to === 'n' ? 'm' : 'n';
      const rest = U.sample(['u', 'um', 'r90', 'r270'], 2);
      const target = { e, o: to };
      const options = U.shuffle([target, { e, o: other }].concat(rest.map((o) => ({ e, o }))));
      return { mode: 'shadow', target, options, sig: e + to };
    }
    const es = level === 1 ? U.sample(SH_DIFF, 3) : U.sample(U.pick(SH_SIMILAR), 4);
    const options = es.map((e) => ({ e, o: 'n' }));
    const target = U.pick(options);
    return { mode: round % 2 === 0 ? 'shadow' : 'color', target, options: U.shuffle(options), sig: target.e };
  }
  function shadowPic(item, dark) {
    const p = pic(item.e, dark ? 'lg-shadow' : 'lg-color');
    if (item.o !== 'n') p.style.transform = ORIENT[item.o];
    return p;
  }

  B.registerGame({
    id: 'logika-shadow', world: W, name: 'Árnyékvadász!', icon: '👤',
    intro: 'Árnyékvadászat! Mindennek van árnyéka. Párosítsd őket!',
    levels: ['3 különböző forma', '4 hasonló forma', 'tükrözött, elforgatott árnyék'], rounds: 5,
    topic: 'Alakfelismerés, vizuális megkülönböztetés, tükrözés és elforgatás',
    _gen: { genShadow, ORIENT_M },
    round(ctx) {
      prep(ctx, 'g-logika-shadow');
      const t = fresh(ctx, 'sh', () => genShadow(ctx.level, ctx.round));
      const showShadow = t.mode === 'color'; // a fejben az árnyék, a gombokon a színes képek
      const headPic = shadowPic(t.target, showShadow);
      const head = ctx.header(U.el('div', { class: 'lg-shead' }, [headPic]));
      head.classList.add('lg-shead-wrap');
      chooseThen(ctx, {
        items: t.options,
        correct: t.target,
        cls: 'pics row',
        render: (it) => shadowPic(it, !showShadow),
        hintAfter: 2,
      }, (btn) => {
        const p = showShadow ? headPic : btn && btn.querySelector('.lg-shadow');
        if (p) p.classList.add('lit');
      });
      if (ctx.level === 3) ctx.ask(ctx.round === 0 ? 'Vigyázz, ezek az árnyékok forognak! Melyik árnyék illik pontosan a képhez? Figyeld, merre néz!' : 'Melyik árnyék illik pontosan? Figyeld, merre néz!');
      else if (showShadow) ctx.ask('Kié ez az árnyék? Koppints rá!');
      else ctx.ask('Melyik az ő árnyéka? Koppints rá!');
    },
  });

  /* =========================================================
   * 6) BUBU DOBOL – hallás utáni sorozat-emlékezet
   * ========================================================= */
  const PADS = [
    { e: '🥁', color: '#FF595E', f: 262, type: 'sine' },
    { e: '🎸', color: '#1982C4', f: 330, type: 'triangle' },
    { e: '🎺', color: '#FFB703', f: 392, type: 'square' },
    { e: '🔔', color: '#43AA8B', f: 523, type: 'sine' },
  ];
  const SIMON_LENS = [[2, 2, 3, 3, 3], [3, 3, 4, 4, 4], [4, 4, 5, 5, 5]];
  function genSeq(len, nPads) {
    const s = [];
    while (s.length < len) {
      const v = U.rand(0, nPads - 1);
      if (s.length >= 2 && s[s.length - 1] === v && s[s.length - 2] === v) continue; // 3 egyforma egymás után ne legyen
      s.push(v);
    }
    return s;
  }

  B.registerGame({
    id: 'logika-simon', world: W, name: 'Bubu dobol!', icon: '🥁',
    intro: 'Bubu zenél! Figyelj jól, aztán játszd el ugyanígy!',
    levels: ['3 hangszer, 2–3 hang', '4 hangszer, 3–4 hang', '4 hangszer, 4–5 hang'], rounds: 5,
    topic: 'Hallási és vizuális sorrend-emlékezet, figyelem',
    _gen: { genSeq, SIMON_LENS },
    round(ctx) {
      prep(ctx, 'g-logika-simon');
      const live = liveFn(ctx);
      const nP = ctx.level === 1 ? 3 : 4;
      const len = SIMON_LENS[ctx.level - 1][Math.min(ctx.round, 4)];
      const seq = genSeq(len, nP);
      const gap = [700, 620, 560][ctx.level - 1];
      let busy = true, pos = 0;

      const turn = U.el('div', { class: 'lg-turn', text: '👀' });
      const replay = U.el('button', { class: 'lg-replay', 'aria-label': 'Játszd újra' }, [pic('👂')]);
      ctx.header(U.el('div', { class: 'lg-sbar' }, [turn, replay]));
      const pads = U.el('div', { class: 'lg-pads busy n' + nP });
      const padEls = PADS.slice(0, nP).map((p, i) => {
        const b = U.el('button', { class: 'lg-pad', 'aria-label': 'Hangszer', style: { '--pc': p.color } }, [pic(p.e)]);
        b.style.setProperty('--pc', p.color);
        b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); tap(i); });
        pads.appendChild(b);
        return b;
      });
      ctx.stage.appendChild(pads);

      const clearHints = () => padEls.forEach((b) => b.classList.remove('hint'));
      const hintNext = () => { clearHints(); if (ctx.roundWrongs >= 2 && pos < len) padEls[seq[pos]].classList.add('hint'); };
      function setBusy(b) {
        busy = b;
        pads.classList.toggle('busy', b);
        replay.disabled = b;
        turn.textContent = b ? '👀' : '👆';
        U.anim(turn, 'pop', 500);
        if (b) clearHints(); else hintNext();
      }
      function flash(i) {
        const el = padEls[i];
        el.classList.remove('lit'); void el.offsetWidth; el.classList.add('lit');
        ctx.tone(PADS[i].f, 0.35, PADS[i].type);
        ctx.later(() => el.classList.remove('lit'), 360);
      }
      async function play() {
        if (!live()) return;
        setBusy(true);
        pos = 0;
        ctx.mascot('think');
        await ctx.wait(500);
        for (let k = 0; k < seq.length; k++) {
          if (!live()) return;
          flash(seq[k]);
          await ctx.wait(gap);
        }
        if (!live()) return;
        setBusy(false);
      }
      function tap(i) {
        if (busy || ctx.done) return;
        flash(i);
        if (i === seq[pos]) {
          pos++;
          if (pos === len) {
            busy = true; clearHints();
            ctx.later(() => { if (live()) { ctx.confetti(pads, 40); ctx.correct(null, { say: 'Pontosan így volt!' }); } }, 450);
          } else hintNext();
        } else {
          busy = true;
          pads.classList.add('busy');
          ctx.wrong(padEls[i], { silent: true });
          ctx.later(async () => {
            if (!live()) return;
            await ctx.say('Hoppá! Figyelj, újra eljátszom!');
            play();
          }, 500);
        }
      }
      replay.addEventListener('click', () => { if (!busy && !ctx.done) { ctx.sfx('tap'); play(); } });

      const ask = ctx.round === 0
        ? 'Figyelj! Én kezdem, aztán te jössz. Koppints ugyanígy a hangszerekre!'
        : 'Figyelj! Most ' + U.numAdj(len) + ' hangot játszom.';
      ctx.setRepeat(ask);
      ctx.ask(ask).then(() => { if (live()) play(); });
    },
  });

  /* =========================================================
   * 7) RAKD SORBA – méret, magasság, hosszúság szerint
   * ========================================================= */
  const SORT_EMOJI = [['🐻', 'maci'], ['🐟', 'hal'], ['🍎', 'alma'], ['⭐', 'csillag'], ['🎈', 'lufi'], ['🐢', 'teknős'], ['🌲', 'fenyő'], ['🐘', 'elefánt'], ['🍩', 'fánk'], ['🐞', 'katica']];
  const SORT_COLORS = ['#FF595E', '#FFB703', '#8AC926', '#1982C4', '#9B5DE5', '#F15BB5'];
  /** {kind:'size'|'tower'|'pencil', dir:'asc'|'desc', values:[...]} – values: méret (vmin) / blokkszám / hossz */
  function genSort(level, variant) {
    const v = variant || (level === 1 ? 'size3' : 'size4');
    if (v === 'tower' || v === 'pencil') {
      const n = U.rand(4, 5);
      const values = U.shuffle(U.sample(U.range(1, 6), n));
      return { kind: v, dir: 'asc', values, sig: v + values.join('') };
    }
    const n = v === 'size3' ? 3 : v === 'size5' ? 5 : 4;
    const min = n === 3 ? 8 : n === 4 ? 7 : 6.5, max = n === 3 ? 19 : n === 4 ? 20 : 18;
    const r = Math.pow(max / min, 1 / (n - 1));
    const sizes = U.range(0, n - 1).map((i) => Math.round(min * Math.pow(r, i) * 10) / 10);
    const em = U.pick(SORT_EMOJI);
    return { kind: 'size', dir: v === 'desc' ? 'desc' : 'asc', values: U.shuffle(sizes), emoji: em, sig: v + em[0] };
  }
  const SORT_TEXT = {
    size: { asc: ['Rakd sorba őket! Kezdd a legkisebbel, a végén jöjjön a legnagyobb!', 'Ez nem a legkisebb.'], desc: ['Most fordítva! Kezdd a legnagyobbal, a végén jöjjön a legkisebb!', 'Ez nem a legnagyobb.'] },
    tower: { asc: ['Rakd sorba a tornyokat! Kezdd a legalacsonyabbal, a végén jöjjön a legmagasabb!', 'Ez nem a legalacsonyabb.'] },
    pencil: { asc: ['Rakd sorba a ceruzákat! Kezdd a legrövidebbel, a végén jöjjön a leghosszabb!', 'Ez nem a legrövidebb.'] },
  };

  B.registerGame({
    id: 'logika-sort', world: W, name: 'Rakd sorba!', icon: '📏',
    intro: 'Sorba rakós játék! Koppints rájuk sorban, egymás után.',
    levels: ['3 méret', '4 méret', '5 méret, fordítva, tornyok, ceruzák'], rounds: 5,
    topic: 'Összehasonlítás, sorba rendezés méret, magasság és hosszúság szerint (kisebb–nagyobb, alacsonyabb–magasabb, rövidebb–hosszabb)',
    _gen: { genSort },
    round(ctx) {
      prep(ctx, 'g-logika-sort');
      const variant = ctx.level === 3 ? deck(ctx, 'v', ['size5', 'desc', 'tower', 'pencil', 'size5']) : null;
      const t = fresh(ctx, 'sort', () => genSort(ctx.level, variant));
      ctx.stage.classList.add('kind-' + t.kind);
      const order = t.values.slice().sort((a, b) => (t.dir === 'asc' ? a - b : b - a));
      const pile = U.el('div', { class: 'lg-pile' });
      const line = U.el('div', { class: 'lg-line' });
      const holders = order.map(() => U.el('div', { class: 'lg-hold' }));
      holders.forEach((h) => line.appendChild(h));
      const colors = U.shuffle(SORT_COLORS);
      let k = 0;

      const items = t.values.map((v, i) => {
        let vis;
        if (t.kind === 'size') vis = U.el('span', { class: 'pic lg-sz', text: t.emoji[0], style: { fontSize: 'min(' + v + 'vmin, ' + (v * 0.95).toFixed(1) + 'vh)' } });
        else if (t.kind === 'tower') vis = U.el('span', { class: 'lg-tower' }, U.range(1, v).map(() => U.el('span', { class: 'lg-block' })));
        else vis = U.el('span', { class: 'lg-pencil', style: { width: 'calc(' + v + ' * var(--pu))' } });
        const b = U.el('button', { class: 'lg-sitem', 'aria-label': 'Elem', style: { animationDelay: i * 0.08 + 's' } }, [vis]);
        b.style.setProperty('--pc', colors[i % colors.length]);
        b._v = v;
        b.addEventListener('click', () => tap(b));
        pile.appendChild(b);
        return b;
      });
      ctx.stage.appendChild(pile);
      ctx.stage.appendChild(line);

      function tap(b) {
        if (ctx.done || b.classList.contains('placed')) return;
        if (b._v === order[k]) {
          items.forEach((x) => x.classList.remove('hint'));
          b.classList.add('placed');
          holders[k].appendChild(b);
          holders[k].classList.add('full');
          ctx.tone(330 + k * 70, 0.2, 'triangle');
          ctx.good(b, { sfx: 'pop' });
          k++;
          if (k === order.length) ctx.later(() => { if (!ctx.done) { line.classList.add('lg-done'); ctx.confetti(line, 40); ctx.correct(null, { say: 'Kész a sor!' }); } }, 450);
        } else {
          const n = ctx.wrong(b, { say: SORT_TEXT[t.kind][t.dir][1] });
          if (n >= 2) { const nx = items.find((x) => x._v === order[k]); if (nx) ctx.hint(nx, { silent: true }); }
        }
      }
      ctx.ask(SORT_TEXT[t.kind][t.dir][0]);
    },
  });
})();
