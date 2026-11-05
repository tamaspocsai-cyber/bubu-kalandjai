/* Bubu kalandjai – Számország (matematika, 1. osztály, 20-as számkör) */
(function () {
  'use strict';
  const U = window.U;

  /* =========================================================
   * Közös segédek
   * ========================================================= */
  const W = (n) => U.numWord(n);            // 7 → "hét"
  const A = (n) => U.numAdj(n);             // 2 → "két" (főnév előtt)
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const VOWEL = /^[aáeéiíoóöőuúüű]/i;
  const art = (w) => (VOWEL.test(w) ? 'az' : 'a'); // névelő: "az öt", "a hét"
  const ACC_ONES = ['nullát', 'egyet', 'kettőt', 'hármat', 'négyet', 'ötöt', 'hatot', 'hetet', 'nyolcat', 'kilencet'];
  /** szám tárgyesetben (önállóan): 2 → "kettőt", 10 → "tízet", 13 → "tizenhármat" */
  const numAcc = (n) => {
    if (n < 10) return ACC_ONES[n];
    if (n === 10) return 'tízet';
    if (n === 20) return 'húszat';
    if (n < 20) return 'tizen' + ACC_ONES[n - 10];
    return W(n) + 'at';
  };
  const MINUS = '−';

  /** a kör eleje: stage-osztály + játékon belüli "már volt" memória */
  function begin(ctx, cls) {
    ctx.stage.classList.add('g-math', cls, 'm-lv' + ctx.level);
    if (ctx.round === 0 || !ctx._m) ctx._m = { seen: new Set(), used: new Set() };
    return ctx._m;
  }
  /** olyan feladat, ami ebben a játékban még nem volt (ha lehet) */
  function fresh(m, make) {
    let t = make();
    for (let i = 0; i < 80 && m.seen.has(t.key); i++) t = make();
    m.seen.add(t.key);
    return t;
  }
  /** listaelem, ami ebben a játékban még nem volt (ha van ilyen) */
  function pickFresh(m, list, keyFn) {
    const k = keyFn || ((x) => x[0]);
    const avail = list.filter((x) => !m.used.has(k(x)));
    const it = U.pick(avail.length ? avail : list);
    m.used.add(k(it));
    return it;
  }
  const chance = (p) => Math.random() < p;

  /** n különböző szám [min..max]-ból, benne a helyes; növekvő sorrendben */
  function numChoices(correct, n, min, max, extras) {
    const set = new Set([correct]);
    const ok = (v) => Number.isInteger(v) && v >= min && v <= max;
    U.shuffle(extras || []).forEach((v) => { if (set.size < n && ok(v)) set.add(v); });
    U.shuffle([1, -1, 2, -2]).concat([3, -3, 4, -4, 5, -5]).forEach((d) => {
      if (set.size < n && ok(correct + d)) set.add(correct + d);
    });
    for (let v = min; set.size < n && v <= max; v++) set.add(v);
    return [...set].sort((a, b) => a - b);
  }

  /**
   * Számválasztó: ctx.choose számokkal.
   * o: { answer, n, min, max, extras, okSay, onOk(), onWrong(v), hidden }
   */
  function chooseNumber(ctx, o) {
    const items = numChoices(o.answer, o.n || 3, o.min, o.max, o.extras);
    const box = ctx.choose({
      items,
      correct: o.answer,
      cls: 'numbers row m-nums',
      render: (v) => String(v),
      sayOnTap: (v) => {
        if (v === o.answer) { if (o.onOk) o.onOk(); return o.okSay || cap(W(v)) + '!'; }
        if (o.onWrong) o.onWrong(v);
        return W(v);
      },
    });
    if (o.hidden) box.classList.add('m-hidden');
    return box;
  }
  function reveal(ctx, node) {
    if (!node) return;
    node.classList.remove('m-hidden');
    node.classList.add('m-reveal');
  }

  /** emoji-kép a játék saját osztályával */
  function pic(emoji, cls) {
    const p = U.pic(emoji);
    p.classList.add('m-pic');
    if (cls) cls.split(' ').forEach((c) => c && p.classList.add(c));
    return p;
  }

  /** koppintásos számolás: minden elemre koppintva kimondja a következő számot */
  function tapCounter(ctx, nodes) {
    let c = 0;
    nodes.forEach((nd) => {
      nd.classList.add('m-tap');
      nd.addEventListener('click', () => {
        if (ctx.done || nd.classList.contains('m-counted')) return;
        c++;
        nd.classList.add('m-counted');
        nd.dataset.c = String(c);
        ctx.sfx('tap');
        ctx.say(cap(W(c)));
      });
    });
  }

  /**
   * Tízes keret(ek): total cella, ötösével sorban, tízesével keretben.
   * o: { red, blue, cross } – az első red cella piros pötty, utána blue kék; az utolsó "cross" piros áthúzva
   */
  function tenFrames(total, o) {
    o = o || {};
    const red = o.red || 0, blue = o.blue || 0, cross = o.cross || 0;
    const cells = [];
    const frames = [];
    for (let f = 0; f * 10 < total; f++) {
      const n = Math.min(10, total - f * 10);
      const fr = U.el('div', { class: 'm-frame' + (total <= 5 ? ' m-frame5' : '') });
      for (let i = 0; i < n; i++) {
        const idx = f * 10 + i;
        const cell = U.el('div', { class: 'm-cell' });
        if (idx < red) {
          const dot = U.el('span', { class: 'm-dot m-red' + (idx >= red - cross ? ' m-x' : '') });
          dot.style.animationDelay = idx * 0.04 + 's';
          cell.appendChild(dot);
          cell.classList.add('m-full');
        } else if (idx < red + blue) {
          const dot = U.el('span', { class: 'm-dot m-blue' });
          dot.style.animationDelay = idx * 0.04 + 's';
          cell.appendChild(dot);
          cell.classList.add('m-full');
        }
        cells.push(cell);
        fr.appendChild(cell);
      }
      frames.push(fr);
    }
    return { node: U.el('div', { class: 'm-frames' }, frames), cells };
  }
  /** az üres cellák kitöltése kék pöttyel (jó válasz után) */
  function fillEmpty(cells) {
    let k = 0;
    cells.forEach((c) => {
      if (c.classList.contains('m-full')) return;
      const dot = U.el('span', { class: 'm-dot m-blue' });
      dot.style.animationDelay = k++ * 0.08 + 's';
      c.appendChild(dot);
      c.classList.add('m-full');
    });
  }

  /** egyenlet sor: ['8', '+', '5', '=', '?'] – a számok koppintásra kimondódnak */
  function equation(ctx, parts) {
    let slot = null;
    const nodes = parts.map((p) => {
      if (p === '?') { slot = U.el('span', { class: 'm-eqslot', text: '?' }); return slot; }
      if (typeof p === 'number') return ctx.speakable(U.el('span', { class: 'm-eqnum', text: String(p) }), W(p));
      return U.el('span', { class: 'm-eqop', text: p });
    });
    const node = U.el('div', { class: 'm-eq' }, nodes);
    return { node, fill: (v) => { if (slot) { slot.textContent = String(v); slot.classList.add('m-filled'); } } };
  }

  /** segítség-gomb (💡) és rejtett segítség-panel */
  function helpPanel(ctx, content) {
    const panel = U.el('div', { class: 'm-help m-hidden' }, content);
    let shown = false;
    const show = () => { if (shown) return; shown = true; reveal(ctx, panel); btn.classList.add('m-used'); ctx.sfx('pop'); };
    const btn = U.el('button', { class: 'm-helpbtn', 'aria-label': 'Segítség', text: '💡', onclick: () => { if (!ctx.done) show(); } });
    return { btn, panel, show };
  }

  /* =========================================================
   * Képanyag
   * ========================================================= */
  // [emoji, alanyeset, tárgyeset]
  const THINGS = [
    ['🐞', 'katica', 'katicát'], ['🐟', 'hal', 'halat'], ['🐤', 'csibe', 'csibét'], ['🍎', 'alma', 'almát'],
    ['🍓', 'eper', 'epret'], ['⭐', 'csillag', 'csillagot'], ['🎈', 'lufi', 'lufit'], ['🐸', 'béka', 'békát'],
    ['🦋', 'pillangó', 'pillangót'], ['🐝', 'méhecske', 'méhecskét'], ['🚗', 'autó', 'autót'], ['🌸', 'virág', 'virágot'],
    ['🍌', 'banán', 'banánt'], ['🐢', 'teknős', 'teknőst'], ['🐌', 'csiga', 'csigát'], ['🦆', 'kacsa', 'kacsát'],
    ['🐱', 'cica', 'cicát'], ['🍐', 'körte', 'körtét'], ['🎁', 'ajándék', 'ajándékot'], ['🍄', 'gomba', 'gombát'],
    ['🐷', 'malac', 'malacot'], ['🐶', 'kutya', 'kutyát'], ['🐰', 'nyuszi', 'nyuszit'], ['🥕', 'répa', 'répát'],
    ['🍋', 'citrom', 'citromot'], ['⚽', 'labda', 'labdát'], ['🦀', 'rák', 'rákot'], ['🐙', 'polip', 'polipot'],
  ];

  /* =========================================================
   * 1. Számolj!
   * ========================================================= */
  Bubu.registerGame({
    id: 'math-count', world: 'math', name: 'Számolj!', icon: '🐞',
    levels: ['1–5', '1–10', '1–20'], rounds: 5,
    topic: 'Számlálás, mennyiségek megszámlálása 20-ig (ötös és tízes csoportokkal)',
    round(ctx) {
      const m = begin(ctx, 'g-math-count');
      const lv = ctx.level;
      const max = [5, 10, 20][lv - 1];
      const t = fresh(m, () => {
        let n;
        if (lv === 1) n = U.rand(1, 5);
        else if (lv === 2) n = U.rand(2, 10);
        else n = chance(0.75) ? U.rand(11, 20) : U.rand(6, 10);
        return { key: n, n };
      });
      const n = t.n;
      const [emoji, nom, acc] = pickFresh(m, THINGS);
      ctx._mTask = { game: 'count', n, max, answer: n };

      const pics = U.range(0, n - 1).map((i) => {
        const p = pic(emoji, 'm-in');
        p.style.animationDelay = i * 0.05 + 's';
        return p;
      });
      let scene;
      if (lv === 1) {
        scene = U.el('div', { class: 'm-count m-g1' }, pics);
      } else {
        // ötös csoportok; nehéz szinten keretben, két csoport (tíz) egy sorban
        const groups = [];
        for (let i = 0; i < n; i += 5) groups.push(U.el('div', { class: 'm-g5' + (lv === 3 ? ' m-framed' : '') }, pics.slice(i, i + 5)));
        const rows = [];
        if (lv === 2) groups.forEach((g) => rows.push(U.el('div', { class: 'm-crow' }, [g])));
        else for (let i = 0; i < groups.length; i += 2) rows.push(U.el('div', { class: 'm-crow' }, groups.slice(i, i + 2)));
        scene = U.el('div', { class: 'm-count m-g' + lv }, rows);
      }
      tapCounter(ctx, pics);
      ctx.header(scene);

      chooseNumber(ctx, {
        answer: n, n: lv === 1 ? 3 : 4, min: 1, max,
        extras: lv === 3 ? [n + 1, n - 1, n + 10, n - 10, n + 5, n - 5] : [n + 1, n - 1],
        okSay: cap(A(n)) + ' ' + nom + '!',
      });
      ctx.ask(ctx.round === 0
        ? 'Hány ' + acc + ' látsz? Koppints rájuk egyenként, úgy könnyebb számolni!'
        : U.pick(['Hány ' + acc + ' látsz?', 'Számold meg! Hány ' + acc + ' látsz?']));
    },
  });

  /* =========================================================
   * 2. Melyik több?
   * ========================================================= */
  const SIGN_NAME = { '<': 'a kisebb jel', '>': 'a nagyobb jel', '=': 'az egyenlőségjel' };
  const CROC_RULE = 'A krokodil szája mindig a nagyobb szám felé nyílik.';
  Bubu.registerGame({
    id: 'math-more', world: 'math', name: 'Melyik több?', icon: '🐊',
    levels: ['Több / kevesebb (képek)', 'Nagyobb / kisebb szám 10-ig', '<, >, = jel 20-ig'], rounds: 5,
    topic: 'Mennyiségek és számok összehasonlítása, a <, >, = jelek (krokodil-szabály)',
    round(ctx) {
      const m = begin(ctx, 'g-math-more');
      const lv = ctx.level;

      if (lv === 1) {
        const t = fresh(m, () => {
          const a = U.rand(1, 6);
          let b = a;
          while (b === a) b = U.rand(Math.max(1, a - 3), Math.min(6, a + 3));
          const mode = chance(0.6) ? 'több' : 'kevesebb';
          return { key: a + '-' + b + mode, a, b, mode };
        });
        const [emoji, nom] = pickFresh(m, THINGS);
        const target = t.mode === 'több' ? Math.max(t.a, t.b) : Math.min(t.a, t.b);
        ctx._mTask = { game: 'more1', a: t.a, b: t.b, mode: t.mode, answer: target };
        const items = [{ n: t.a, side: 'L' }, { n: t.b, side: 'R' }];
        ctx.choose({
          items,
          correct: (it) => it.n === target,
          cls: 'row m-grpch',
          render: (it) => U.el('div', { class: 'm-grp' }, U.range(1, it.n).map(() => pic(emoji))),
          sayOnTap: (it) => (it.n === target
            ? 'Igen, itt van ' + t.mode + '! ' + cap(A(it.n)) + ' ' + nom + '.'
            : A(it.n) + ' ' + nom),
        });
        ctx.ask('Hol van ' + t.mode + ' ' + nom + '?');
        return;
      }

      if (lv === 2) {
        const t = fresh(m, () => {
          const a = U.rand(1, 10);
          let b = a;
          while (b === a) b = U.rand(1, 10);
          const mode = chance(0.55) ? 'nagyobb' : 'kisebb';
          return { key: a + '-' + b + mode, a, b, mode };
        });
        const [emoji] = pickFresh(m, THINGS);
        const target = t.mode === 'nagyobb' ? Math.max(t.a, t.b) : Math.min(t.a, t.b);
        const other = target === t.a ? t.b : t.a;
        ctx._mTask = { game: 'more2', a: t.a, b: t.b, mode: t.mode, answer: target };
        ctx.choose({
          items: [t.a, t.b],
          correct: target,
          cls: 'row m-numcards',
          render: (v) => {
            const dots = [];
            for (let i = 0; i < v; i += 5) dots.push(U.el('div', { class: 'm-mrow' }, U.range(i + 1, Math.min(v, i + 5)).map(() => pic(emoji))));
            return U.el('div', { class: 'm-numcard' }, [U.el('span', { class: 'm-bignum', text: String(v) }), U.el('div', { class: 'm-minis' }, dots)]);
          },
          sayOnTap: (v) => (v === target
            ? 'Igen! ' + cap(W(target)) + ' ' + t.mode + ', mint ' + W(other) + '.'
            : W(v)),
        });
        ctx.ask('Melyik szám a ' + t.mode + ': ' + W(t.a) + ', vagy ' + W(t.b) + '?');
        return;
      }

      // 3. szint: <, >, =
      const t = fresh(m, () => {
        let a, b;
        const r = Math.random();
        if (r < 0.2) { a = b = U.rand(1, 20); }
        else if (r < 0.55) { a = U.rand(1, 20); do { b = a + U.pick([-3, -2, -1, 1, 2, 3]); } while (b < 0 || b > 20); }
        else { a = U.rand(10, 20); do { b = U.rand(1, 20); } while (b === a); }
        if (chance(0.5)) [a, b] = [b, a];
        return { key: a + '-' + b, a, b };
      });
      const { a, b } = t;
      const sign = a < b ? '<' : a > b ? '>' : '=';
      ctx._mTask = { game: 'more3', a, b, answer: sign };
      const slot = U.el('span', { class: 'm-signslot', text: '?' });
      const croc = ctx.speakable(U.el('span', { class: 'm-croc', text: '🐊' }), CROC_RULE);
      ctx.header(U.el('div', { class: 'm-cmp' }, [
        ctx.speakable(U.el('span', { class: 'm-cmpnum', text: String(a) }), W(a)),
        slot,
        ctx.speakable(U.el('span', { class: 'm-cmpnum', text: String(b) }), W(b)),
        croc,
      ]));
      ctx.choose({
        items: ['<', '=', '>'],
        correct: sign,
        cls: 'row m-signs',
        render: (s) => U.el('span', { class: 'm-sign', text: s }),
        sayOnTap: (s) => {
          if (s !== sign) return SIGN_NAME[s] + '. ' + CROC_RULE;
          slot.textContent = s; slot.classList.add('m-filled');
          if (s === '=') return cap(W(a)) + ' és ' + W(b) + ' egyenlő.';
          return cap(W(a)) + (s === '<' ? ' kisebb, mint ' : ' nagyobb, mint ') + W(b) + '.';
        },
      });
      ctx.ask('Melyik jel kell a két szám közé? ' + cap(W(a)) + ', és ' + W(b) + '.' + (ctx.round < 2 ? ' ' + CROC_RULE : ''));
    },
  });

  /* =========================================================
   * 3. Összeadás
   * ========================================================= */
  // jelenetek: story1(a, nom) – kezdet; story2(b) – mi történik; q(nom) – kérdés; anim – érkezés módja
  const ADD_SCENES = [
    {
      id: 'basket', anim: 'drop', items: [['🍎', 'alma'], ['🍐', 'körte'], ['🍊', 'narancs'], ['🍋', 'citrom'], ['🍓', 'eper']],
      s1: (a, nom) => cap(A(a)) + ' ' + nom + ' van a kosárban.',
      s2: (b) => 'Beleteszünk még ' + numAcc(b) + '.',
      q: (nom) => 'Hány ' + nom + ' van most a kosárban?',
    },
    {
      id: 'pond', anim: 'swim', items: [['🦆', 'kacsa']],
      s1: (a, nom) => cap(A(a)) + ' ' + nom + ' úszik a tavon.',
      s2: (b) => 'Odaúszik még ' + W(b) + '.',
      q: (nom) => 'Hány ' + nom + ' úszik most a tavon?',
    },
    {
      id: 'meadow', anim: 'fly', items: [['🦋', 'pillangó'], ['🐝', 'méhecske'], ['🐞', 'katica']],
      s1: (a, nom) => cap(A(a)) + ' ' + nom + ' van a réten.',
      s2: (b) => 'Odarepül még ' + W(b) + '.',
      q: (nom) => 'Hány ' + nom + ' van most a réten?',
    },
    {
      id: 'plate', anim: 'drop', items: [['🍪', 'keksz'], ['🍩', 'fánk']],
      s1: (a, nom) => cap(A(a)) + ' ' + nom + ' van a tányéron.',
      s2: (b) => 'Bubu tesz mellé még ' + numAcc(b) + '.',
      q: (nom) => 'Hány ' + nom + ' van most a tányéron?',
    },
  ];
  const SCENE_DECO = { basket: '🧺', pond: '', meadow: '', plate: '' };

  function addGen(lv) {
    if (lv === 1) { const s = U.rand(2, 5); const a = U.rand(1, s - 1); return { key: a + '+' + (s - a), a, b: s - a, s }; }
    if (lv === 2) { const s = U.rand(4, 10); const a = U.rand(1, s - 1); return { key: a + '+' + (s - a), a, b: s - a, s }; }
    let a, b;
    const r = Math.random();
    if (r < 0.5) { a = U.rand(3, 9); b = U.rand(11 - a, 9); if (chance(0.3)) [a, b] = [b, a]; }  // tízes átlépés: 8 + 5
    else if (r < 0.8) { a = U.rand(11, 19); b = U.rand(1, 20 - a); }                              // 13 + 4
    else { a = 10; b = U.rand(1, 10); if (chance(0.4)) [a, b] = [b, a]; }                          // 10 + 6
    return { key: a + '+' + b, a, b, s: a + b };
  }

  Bubu.registerGame({
    id: 'math-add', world: 'math', name: 'Összeadás', icon: '➕',
    levels: ['Összeg 5-ig, képekkel', 'Összeg 10-ig, kép + számok', 'Összeg 20-ig, tízes átlépéssel'], rounds: 5,
    topic: 'Összeadás 20-as számkörben: hozzáadás képekkel, majd számokkal, tízes átlépéssel',
    async round(ctx) {
      const m = begin(ctx, 'g-math-add');
      const lv = ctx.level;
      const t = fresh(m, () => addGen(lv));
      const { a, b, s } = t;
      ctx._mTask = { game: 'add', a, b, s, max: [5, 10, 20][lv - 1], answer: s };
      const okSay = cap(W(a)) + ' meg ' + W(b) + ', az ' + W(s) + '!';

      if (lv === 3) {
        const eq = equation(ctx, [a, '+', b, '=', '?']);
        const fr = tenFrames(s > 10 ? 20 : 10, { red: a, blue: b });
        const help = helpPanel(ctx, [fr.node]);
        ctx.header([eq.node, help.btn]);
        ctx.stage.appendChild(help.panel);
        chooseNumber(ctx, {
          answer: s, n: 4, min: 0, max: 20, extras: [s + 1, s - 1, s + 10, s - 10, s + 2],
          okSay, onOk: () => eq.fill(s), onWrong: () => help.show(),
        });
        ctx.ask('Mennyi ' + W(a) + ' meg ' + W(b) + '?' + (ctx.round === 0 ? ' Ha segítség kell, koppints a villanykörtére!' : ''));
        return;
      }

      const sc = U.pick(ADD_SCENES);
      const [emoji, nom] = pickFresh(m, sc.items);
      const first = U.range(1, a).map(() => pic(emoji));
      const groupA = U.el('div', { class: 'm-sgrp' }, first);
      const groupB = U.el('div', { class: 'm-sgrp m-new' });
      const kids = [U.el('div', { class: 'm-sitems' }, [groupA, groupB])];
      if (SCENE_DECO[sc.id]) kids.push(U.el('span', { class: 'm-deco', text: SCENE_DECO[sc.id] }));
      const scene = U.el('div', { class: 'm-scene m-sc-' + sc.id }, kids);
      const head = [scene];
      let eq = null;
      if (lv === 2) { eq = equation(ctx, [a, '+', b, '=', '?']); eq.node.classList.add('m-hidden'); head.push(eq.node); }
      ctx.header(head);
      const box = chooseNumber(ctx, {
        answer: s, n: lv === 1 ? 3 : 4, min: 1, max: lv === 1 ? 5 : 10, extras: [s + 1, s - 1, a, b],
        okSay, hidden: true, onOk: () => { if (eq) eq.fill(s); },
      });

      const s1 = sc.s1(a, nom), s2 = sc.s2(b), q = sc.q(nom);
      ctx.setRepeat(s1 + ' ' + s2 + ' ' + q);
      await ctx.say(s1);
      if (ctx.done) return;
      // megérkeznek az újak
      for (let i = 0; i < b; i++) {
        const p = pic(emoji, 'm-arrive m-arrive-' + sc.anim);
        p.style.animationDelay = i * 0.3 + 's';
        groupB.appendChild(p);
        ctx.later(() => ctx.sfx('pop'), 500 + i * 300);
      }
      ctx.sfx('whoosh');
      ctx.ask(s2 + ' ' + q);
      ctx.setRepeat(s1 + ' ' + s2 + ' ' + q);
      await ctx.wait(700 + b * 300);
      if (ctx.done) return;
      tapCounter(ctx, first.concat([...groupB.children]));
      if (eq) reveal(ctx, eq.node);
      reveal(ctx, box);
    },
  });

  /* =========================================================
   * 4. Kivonás
   * ========================================================= */
  const SUB_SCENES = [
    {
      id: 'tree', anim: 'fly', emoji: '🐦', nom: 'madár', w: 3,
      s1: (a) => cap(A(a)) + ' madár ül a fán.',
      s2: (b) => cap(W(b)) + ' elrepül.',
      q: 'Hány madár maradt a fán?',
    },
    {
      id: 'sky', anim: 'float', emoji: '🎈', nom: 'lufi', w: 1,
      s1: (a) => 'Bubunak ' + A(a) + ' lufija van.',
      s2: (b) => cap(W(b)) + ' elszáll.',
      q: 'Hány lufija maradt Bubunak?',
    },
    {
      id: 'pond', anim: 'swim', emoji: '🦆', nom: 'kacsa', w: 1,
      s1: (a) => cap(A(a)) + ' kacsa úszik a tavon.',
      s2: (b) => cap(W(b)) + ' elúszik.',
      q: 'Hány kacsa maradt a tavon?',
    },
    {
      id: 'plate', anim: 'eat', emoji: '🍪', nom: 'keksz', w: 1,
      s1: (a) => cap(A(a)) + ' keksz van a tányéron.',
      s2: (b) => 'Bubu megeszik ' + numAcc(b) + '.',
      q: 'Hány keksz maradt a tányéron?',
    },
  ];
  function subGen(lv) {
    if (lv === 1) { const a = U.rand(2, 5); const b = U.rand(1, a - 1); return { key: a + '-' + b, a, b, r: a - b }; }
    if (lv === 2) { const a = U.rand(4, 10); const b = U.rand(1, a - 1); return { key: a + '-' + b, a, b, r: a - b }; }
    let a, b;
    const r = Math.random();
    if (r < 0.45) { a = U.rand(11, 18); b = U.rand(a - 9, 9); }      // tízes átlépés: 13 − 5
    else if (r < 0.8) { a = U.rand(11, 19); b = U.rand(1, a - 10); } // 17 − 4, 16 − 6
    else { a = 20; b = U.rand(1, 10); }                              // 20 − 7
    return { key: a + '-' + b, a, b, r: a - b };
  }
  function weightedPick(list) {
    const tot = list.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * tot;
    for (const x of list) { r -= x.w; if (r < 0) return x; }
    return list[list.length - 1];
  }

  Bubu.registerGame({
    id: 'math-sub', world: 'math', name: 'Kivonás', icon: '🐦',
    levels: ['5-ig, képekkel', '10-ig, kép + számok', '20-ig, számokkal'], rounds: 5,
    topic: 'Kivonás (elvétel) 20-as számkörben: képekkel, majd számokkal, tízes átlépéssel',
    async round(ctx) {
      const m = begin(ctx, 'g-math-sub');
      const lv = ctx.level;
      const t = fresh(m, () => subGen(lv));
      const { a, b, r } = t;
      ctx._mTask = { game: 'sub', a, b, r, max: [5, 10, 20][lv - 1], answer: r };
      const okSay = cap(W(a)) + ' mínusz ' + W(b) + ', az ' + W(r) + '!';

      if (lv === 3) {
        const eq = equation(ctx, [a, MINUS, b, '=', '?']);
        const fr = tenFrames(20, { red: a, cross: b });
        const help = helpPanel(ctx, [fr.node]);
        ctx.header([eq.node, help.btn]);
        ctx.stage.appendChild(help.panel);
        chooseNumber(ctx, {
          answer: r, n: 4, min: 0, max: 20, extras: [r + 1, r - 1, r + 10, a + b > 20 ? r + 2 : a + b, r - 2],
          okSay, onOk: () => eq.fill(r), onWrong: () => help.show(),
        });
        ctx.ask('Mennyi ' + W(a) + ' mínusz ' + W(b) + '?' + (ctx.round === 0 ? ' Ha segítség kell, koppints a villanykörtére!' : ''));
        return;
      }

      const sc = lv === 1 && ctx.round === 0 ? SUB_SCENES[0] : weightedPick(SUB_SCENES);
      const all = U.range(1, a).map(() => pic(sc.emoji));
      const leaving = all.slice(a - b);
      const staying = all.slice(0, a - b);
      const kids = [U.el('div', { class: 'm-sitems' }, [U.el('div', { class: 'm-sgrp' }, all)])];
      if (sc.id === 'tree') kids.push(U.el('div', { class: 'm-branch' }));
      const scene = U.el('div', { class: 'm-scene m-sc-' + sc.id }, kids);
      const head = [scene];
      let eq = null;
      if (lv === 2) { eq = equation(ctx, [a, MINUS, b, '=', '?']); eq.node.classList.add('m-hidden'); head.push(eq.node); }
      ctx.header(head);
      const box = chooseNumber(ctx, {
        answer: r, n: lv === 1 ? 3 : 4, min: 0, max: lv === 1 ? 5 : 10, extras: [r + 1, r - 1, a, b],
        okSay, hidden: true, onOk: () => { if (eq) eq.fill(r); },
      });

      const s1 = sc.s1(a), s2 = sc.s2(b);
      ctx.setRepeat(s1 + ' ' + s2 + ' ' + sc.q);
      await ctx.say(s1);
      if (ctx.done) return;
      leaving.forEach((p, i) => {
        p.classList.add('m-leave', 'm-leave-' + sc.anim);
        p.style.animationDelay = i * 0.25 + 's';
      });
      ctx.sfx(sc.anim === 'eat' ? 'pop' : 'whoosh');
      ctx.ask(s2 + ' ' + sc.q);
      ctx.setRepeat(s1 + ' ' + s2 + ' ' + sc.q);
      await ctx.wait(1100 + b * 250);
      if (ctx.done) return;
      tapCounter(ctx, staying);
      if (eq) reveal(ctx, eq.node);
      reveal(ctx, box);
    },
  });

  /* =========================================================
   * 5. Számszomszédok (vonat)
   * ========================================================= */
  function train(ctx, vals, missIdx) {
    let missing = null;
    const wagons = vals.map((v, i) => {
      const num = U.el('span', { class: 'm-wnum', text: i === missIdx ? '?' : String(v) });
      const w = U.el('div', { class: 'm-wagon' + (i === missIdx ? ' m-missing' : '') }, [num, U.el('span', { class: 'm-wheels' })]);
      if (i === missIdx) missing = { w, num };
      else ctx.speakable(w, W(v));
      return w;
    });
    const loco = U.el('span', { class: 'm-loco', text: '🚂' });
    const node = U.el('div', { class: 'm-trainwrap' }, [U.el('div', { class: 'm-train' }, [loco].concat(wagons)), U.el('div', { class: 'm-rail' })]);
    return {
      node,
      fill: (v) => { if (missing) { missing.num.textContent = String(v); missing.w.classList.add('m-filled'); } },
    };
  }
  const SEQ_TYPES = [
    { id: 'up2', step: 2, say: 'Kettesével számolunk.' },
    { id: 'down2', step: -2, say: 'Kettesével számolunk visszafelé.' },
    { id: 'up5', step: 5, say: 'Ötösével számolunk.' },
    { id: 'down5', step: -5, say: 'Ötösével számolunk visszafelé.' },
    { id: 'down1', step: -1, say: 'Visszafelé számolunk, mint amikor indul a rakéta!' },
  ];
  function seqGen(lv) {
    if (lv === 1) {
      const s = U.rand(1, 6), miss = U.rand(1, 4);
      const vals = U.range(s, s + 4);
      return { key: 'g' + vals[miss], kind: 'gap', vals, miss, answer: vals[miss] };
    }
    if (lv === 2) {
      if (chance(0.55)) {
        const dir = chance(0.5) ? 'után' : 'előtt';
        const n = dir === 'után' ? U.rand(0, 19) : U.rand(1, 20);
        const answer = dir === 'után' ? n + 1 : n - 1;
        const vals = dir === 'után' ? [n, n + 1] : [n - 1, n];
        return { key: dir + n, kind: 'nb', dir, n, vals, miss: dir === 'után' ? 1 : 0, answer };
      }
      const s = U.rand(0, 16), miss = U.rand(1, 3);
      const vals = U.range(s, s + 4);
      return { key: 'g' + vals[miss], kind: 'gap', vals, miss, answer: vals[miss] };
    }
    const ty = U.pick(SEQ_TYPES);
    let start;
    if (ty.id === 'up2') start = U.rand(0, 12);
    else if (ty.id === 'down2') start = U.rand(8, 20);
    else if (ty.id === 'up5') start = 0;
    else if (ty.id === 'down5') start = 20;
    else start = U.rand(5, 20);
    const vals = [0, 1, 2, 3, 4].map((i) => start + i * ty.step);
    const miss = U.rand(1, 4);
    return { key: ty.id + start + '-' + miss, kind: 'seq', type: ty, vals, miss, answer: vals[miss] };
  }

  Bubu.registerGame({
    id: 'math-seq', world: 'math', name: 'Számszomszédok', icon: '🚂',
    levels: ['Hiányzó szám 1–10', 'Szomszédok 0–20', 'Kettesével, ötösével, visszafelé'], rounds: 5,
    topic: 'Számsorozatok, számszomszédok, hiányzó szám; számlálás kettesével, ötösével és visszafelé 20-ig',
    round(ctx) {
      const m = begin(ctx, 'g-math-seq');
      const lv = ctx.level;
      const t = fresh(m, () => seqGen(lv));
      ctx._mTask = Object.assign({ game: 'seq', lv }, t);
      const tr = train(ctx, t.vals, t.miss);
      ctx.header(tr.node);
      ctx.sfx('whoosh');

      let q, okSay, extras;
      if (t.kind === 'nb') {
        const other = t.dir === 'után' ? t.n - 1 : t.n + 1;
        extras = [t.n, other, t.answer + (t.answer - t.n)];
        if (t.dir === 'után') {
          q = 'Melyik szám jön ' + art(W(t.n)) + ' ' + W(t.n) + ' után?';
          okSay = 'Igen! ' + cap(art(W(t.n))) + ' ' + W(t.n) + ' után ' + art(W(t.answer)) + ' ' + W(t.answer) + ' jön.';
        } else {
          q = 'Melyik szám van ' + art(W(t.n)) + ' ' + W(t.n) + ' előtt?';
          okSay = 'Igen! ' + cap(art(W(t.n))) + ' ' + W(t.n) + ' előtt ' + art(W(t.answer)) + ' ' + W(t.answer) + ' van.';
        }
      } else if (t.kind === 'gap') {
        extras = [t.answer + 1, t.answer - 1, t.answer + 2];
        q = 'Melyik szám hiányzik a vonatról?' + (ctx.round === 0 ? ' Koppints a vagonokra, és meghallod a számokat!' : '');
        okSay = 'Igen, ' + W(t.answer) + '!';
      } else {
        const st = Math.abs(t.type.step);
        extras = [t.answer + 1, t.answer - 1, t.answer + st, t.answer - st];
        const heard = t.vals.map((v, i) => (i === t.miss ? '…' : W(v))).join(', ');
        q = t.type.say + ' Melyik szám hiányzik? Figyelj: ' + heard + '.';
        okSay = 'Igen! ' + cap(t.vals.map(W).join(', ')) + '.';
      }
      chooseNumber(ctx, {
        answer: t.answer, n: lv === 1 ? 3 : 4, min: lv === 1 ? 1 : 0, max: lv === 1 ? 10 : 20,
        extras, okSay, onOk: () => tr.fill(t.answer),
      });
      ctx.ask(q);
    },
  });

  /* =========================================================
   * 6. Tízes barátok (bontás, pótlás)
   * ========================================================= */
  function tensGen(lv) {
    if (lv === 1) {
      const a = U.rand(1, 4), form = U.pick(['fill', 'hide']);
      return { key: form + a, form, T: 5, a, b: 5 - a };
    }
    if (lv === 2) {
      if (chance(0.6)) { const a = U.rand(1, 9); return { key: 'f' + a, form: 'fill', T: 10, a, b: 10 - a }; }
      const T = U.rand(6, 10), a = U.rand(1, T - 1);
      return { key: 'h' + T + '-' + a, form: 'hide', T, a, b: T - a };
    }
    let T, a;
    const r = Math.random();
    if (r < 0.4) { T = U.rand(12, 20); a = U.rand(11, T - 1); }        // 13 + ? = 17
    else if (r < 0.65) { T = 20; a = U.rand(11, 19); }                 // pótlás húszra
    else if (r < 0.82) { T = U.rand(11, 19); a = 10; }                 // tíz meg mennyi?
    else { T = U.rand(11, 16); a = U.rand(T - 9, 9); }                 // 7 + ? = 13 (átlépés)
    return { key: 'f' + T + '-' + a, form: 'fill', T, a, b: T - a };
  }

  Bubu.registerGame({
    id: 'math-tens', world: 'math', name: 'Tízes barátok', icon: '🔟',
    levels: ['Az öt bontása', 'A tíz bontása, pótlás tízre', 'Bontás és pótlás 20-ig'], rounds: 5,
    topic: 'Számok bontása és pótlása tízes kerettel (5, 10, 20)',
    round(ctx) {
      const m = begin(ctx, 'g-math-tens');
      const lv = ctx.level;
      const t = fresh(m, () => tensGen(lv));
      const { T, a, b } = t;
      ctx._mTask = Object.assign({ game: 'tens', answer: b }, t);
      const okSay = cap(W(a)) + ' meg ' + W(b) + ', az ' + W(T) + '!';
      const opts = { answer: b, n: lv === 1 ? 3 : 4, min: 0, max: T, extras: [b + 1, b - 1, b + 2, lv === 3 ? 10 - (b % 10) : a] };

      if (t.form === 'fill') {
        const fr = tenFrames(T, { red: a });
        const eq = equation(ctx, [a, '+', '?', '=', T]);
        ctx.header([fr.node, eq.node]);
        tapCounter(ctx, fr.cells.filter((c) => !c.classList.contains('m-full')));
        chooseNumber(ctx, Object.assign(opts, { okSay, onOk: () => { fillEmpty(fr.cells); eq.fill(b); } }));
        ctx.ask(cap(A(a)) + ' piros pötty van ' + (T > 10 ? 'a keretekben' : 'a keretben') + '. Hány pötty kell még, hogy ' + W(T) + ' legyen?');
        return;
      }
      // elrejtve: a golyók egy része a dobozban
      const seen = U.el('div', { class: 'm-balls' }, U.range(1, a).map(() => U.el('span', { class: 'm-dot m-red m-ball' })));
      const lid = U.el('div', { class: 'm-box' }, [U.el('span', { class: 'm-boxpic', text: '📦' }), U.el('span', { class: 'm-boxq', text: '?' })]);
      const eq = equation(ctx, [T, '=', a, '+', '?']);
      ctx.header([U.el('div', { class: 'm-hide' }, [seen, lid]), eq.node]);
      chooseNumber(ctx, Object.assign(opts, {
        okSay,
        onOk: () => {
          U.clear(lid);
          lid.classList.add('m-open');
          lid.appendChild(U.el('div', { class: 'm-balls' }, U.range(1, b).map(() => U.el('span', { class: 'm-dot m-blue m-ball' }))));
          eq.fill(b);
        },
      }));
      ctx.ask(cap(W(T)) + ' golyó van összesen. ' + cap(A(a)) + ' golyót látsz, a többi a dobozban bújik. Hány golyó van a dobozban?');
    },
  });

  /* =========================================================
   * 7. Formák
   * ========================================================= */
  const SHAPES = {
    kor: { nom: 'kör', acc: 'kört' },
    negyzet: { nom: 'négyzet', acc: 'négyzetet' },
    haromszog: { nom: 'háromszög', acc: 'háromszöget' },
    teglalap: { nom: 'téglalap', acc: 'téglalapot' },
  };
  const SOLIDS = { gomb: 'gömb', kocka: 'kocka', henger: 'henger', kup: 'kúp' };
  const COLORS = ['#FF6B6B', '#4D96FF', '#FFC93C', '#3DBE6B', '#C77DFF', '#FF9F1C', '#2EC4B6', '#FF70A6'];
  const STROKE = 'stroke="#3A3A5C" stroke-width="4" stroke-linejoin="round"';

  function shapeSVG(kind, color) {
    const f = 'fill="' + color + '" ' + STROKE;
    const body = {
      kor: '<circle cx="50" cy="50" r="40" ' + f + '/>',
      negyzet: '<rect x="13" y="13" width="74" height="74" rx="3" ' + f + '/>',
      haromszog: '<polygon points="50,10 93,86 7,86" ' + f + '/>',
      teglalap: '<rect x="3" y="27" width="94" height="46" rx="3" ' + f + '/>',
    }[kind];
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + '</svg>';
  }
  let gradId = 0;
  function solidSVG(kind, color) {
    const s = STROKE;
    let body;
    if (kind === 'gomb') {
      const id = 'mgrad' + ++gradId;
      body = '<defs><radialGradient id="' + id + '" cx="35%" cy="32%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="' + color + '"/><stop offset="1" stop-color="' + color + '" stop-opacity=".75"/></radialGradient></defs>' +
        '<circle cx="50" cy="52" r="40" fill="url(#' + id + ')" ' + s + '/>' +
        '<ellipse cx="50" cy="52" rx="40" ry="11" fill="none" stroke="#3A3A5C" stroke-opacity=".35" stroke-width="2.5" stroke-dasharray="5 5"/>';
    } else if (kind === 'kocka') {
      body = '<rect x="12" y="34" width="54" height="54" fill="' + color + '" ' + s + '/>' +
        '<polygon points="12,34 34,14 88,14 66,34" fill="' + color + '" ' + s + '/>' +
        '<polygon points="12,34 34,14 88,14 66,34" fill="#fff" fill-opacity=".45"/>' +
        '<polygon points="66,34 88,14 88,68 66,88" fill="' + color + '" ' + s + '/>' +
        '<polygon points="66,34 88,14 88,68 66,88" fill="#000" fill-opacity=".2"/>';
    } else if (kind === 'henger') {
      body = '<path d="M24 22 V80 A26 9 0 0 0 76 80 V22 Z" fill="' + color + '" ' + s + '/>' +
        '<path d="M58 24 V84" stroke="#fff" stroke-opacity=".45" stroke-width="6" stroke-linecap="round"/>' +
        '<ellipse cx="50" cy="22" rx="26" ry="9" fill="' + color + '" ' + s + '/>' +
        '<ellipse cx="50" cy="22" rx="26" ry="9" fill="#fff" fill-opacity=".45"/>';
    } else {
      body = '<path d="M50 8 L84 80 A34 10 0 0 1 16 80 Z" fill="' + color + '" ' + s + '/>' +
        '<path d="M50 14 L62 78" stroke="#fff" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>';
    }
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + '</svg>';
  }
  const svgBox = (html, cls) => U.el('span', { class: 'm-svg ' + (cls || ''), html });

  // hétköznapi tárgyak síkformája
  const FLAT_OBJECTS = [
    ['🕐', 'az óra', 'kor'], ['🌕', 'a telihold', 'kor'], ['🍪', 'a keksz', 'kor'], ['💿', 'a CD-lemez', 'kor'],
    ['🍕', 'a pizzaszelet', 'haromszog'], ['⚠️', 'a figyelmeztető tábla', 'haromszog'], ['🧀', 'a sajtszelet', 'haromszog'],
    ['📺', 'a tévé', 'teglalap'], ['🚪', 'az ajtó', 'teglalap'], ['📱', 'a telefon', 'teglalap'], ['✉️', 'a boríték', 'teglalap'], ['🧱', 'a tégla', 'teglalap'],
  ];
  // testek
  const SOLID_OBJECTS = [
    ['⚽', 'a labda', 'gomb'], ['🏀', 'a kosárlabda', 'gomb'], ['🌍', 'a földgömb', 'gomb'], ['🍊', 'a narancs', 'gomb'],
    ['🎲', 'a dobókocka', 'kocka'], ['🧊', 'a jégkocka', 'kocka'], ['🎁', 'az ajándékdoboz', 'kocka'],
    ['🥫', 'a konzervdoboz', 'henger'], ['🥁', 'a dob', 'henger'], ['🕯️', 'a gyertya', 'henger'],
    ['🍦', 'a fagyitölcsér', 'kup'],
  ];
  // alakzatokból összerakott képek: [fajta, svg-elem, attribútumok, szín]
  const PICTURES = [
    { id: 'haz', shapes: [
      ['kor', 'circle', 'cx="168" cy="32" r="18"', '#FFD23F'],
      ['haromszog', 'polygon', 'points="30,92 100,30 170,92"', '#E4572E'],
      ['negyzet', 'rect', 'x="50" y="92" width="100" height="100"', '#F6D8AE'],
      ['negyzet', 'rect', 'x="62" y="106" width="24" height="24"', '#7FD3FF'],
      ['negyzet', 'rect', 'x="114" y="106" width="24" height="24"', '#7FD3FF'],
      ['teglalap', 'rect', 'x="88" y="142" width="24" height="50"', '#8D5A3B'],
    ] },
    { id: 'raketa', shapes: [
      ['kor', 'circle', 'cx="32" cy="40" r="13"', '#C77DFF'],
      ['kor', 'circle', 'cx="170" cy="62" r="9"', '#FFD23F'],
      ['haromszog', 'polygon', 'points="72,112 44,166 72,158"', '#FF6B6B'],
      ['haromszog', 'polygon', 'points="128,112 156,166 128,158"', '#FF6B6B'],
      ['haromszog', 'polygon', 'points="82,160 118,160 100,195"', '#FFC93C'],
      ['teglalap', 'rect', 'x="72" y="62" width="56" height="98"', '#E9EEF5'],
      ['haromszog', 'polygon', 'points="100,12 72,62 128,62"', '#FF6B6B'],
      ['kor', 'circle', 'cx="100" cy="88" r="12"', '#4D96FF'],
      ['kor', 'circle', 'cx="100" cy="124" r="12"', '#4D96FF'],
    ] },
    { id: 'fenyo', shapes: [
      ['haromszog', 'polygon', 'points="100,14 70,62 130,62"', '#5ED39C'],
      ['haromszog', 'polygon', 'points="100,62 58,112 142,112"', '#3DBE6B'],
      ['haromszog', 'polygon', 'points="100,112 44,160 156,160"', '#2E9E5B'],
      ['teglalap', 'rect', 'x="90" y="160" width="20" height="34"', '#8D5A3B'],
      ['kor', 'circle', 'cx="100" cy="46" r="6"', '#FF6B6B'],
      ['kor', 'circle', 'cx="84" cy="100" r="6"', '#FFD23F'],
      ['kor', 'circle', 'cx="116" cy="100" r="6"', '#4D96FF'],
      ['kor', 'circle', 'cx="100" cy="148" r="6"', '#FF6B6B'],
      ['negyzet', 'rect', 'x="30" y="164" width="28" height="28"', '#C77DFF'],
      ['negyzet', 'rect', 'x="142" y="164" width="28" height="28"', '#FF9F1C'],
    ] },
    { id: 'robot', shapes: [
      ['kor', 'circle', 'cx="100" cy="16" r="8"', '#FF6B6B'],
      ['negyzet', 'rect', 'x="66" y="26" width="68" height="68"', '#9AA5B8'],
      ['kor', 'circle', 'cx="86" cy="52" r="8"', '#FFD23F'],
      ['kor', 'circle', 'cx="114" cy="52" r="8"', '#FFD23F'],
      ['teglalap', 'rect', 'x="82" y="72" width="36" height="10"', '#FF6B6B'],
      ['teglalap', 'rect', 'x="56" y="100" width="88" height="54"', '#4D96FF'],
      ['haromszog', 'polygon', 'points="100,108 86,134 114,134"', '#FFC93C'],
      ['teglalap', 'rect', 'x="30" y="104" width="20" height="46"', '#9AA5B8'],
      ['teglalap', 'rect', 'x="150" y="104" width="20" height="46"', '#9AA5B8'],
      ['teglalap', 'rect', 'x="70" y="156" width="20" height="38"', '#9AA5B8'],
      ['teglalap', 'rect', 'x="110" y="156" width="20" height="38"', '#9AA5B8'],
    ] },
  ];
  const PATTERNS = ['AB', 'AAB', 'ABB', 'ABC', 'AABB'];
  function shapeChoice(ctx, kinds, correctKind, drawFn, nameFn, okSay, onOk) {
    return ctx.choose({
      items: kinds.map((k) => ({ k, color: U.pick(COLORS) })),
      correct: (it) => it.k === correctKind,
      cls: 'row m-shapes',
      render: (it) => svgBox(drawFn(it.k, it.color)),
      sayOnTap: (it) => {
        if (it.k === correctKind) { if (onOk) onOk(it); return okSay; }
        return 'egy ' + nameFn(it.k);
      },
    });
  }

  function shapesGen(lv) {
    if (lv === 1) {
      const target = U.pick(Object.keys(SHAPES));
      const n = chance(0.5) ? 3 : 4;
      return { key: target + n, mode: 'name', target, n };
    }
    if (lv === 2) {
      if (chance(0.5)) { const o = U.pick(FLAT_OBJECTS); return { key: o[0], mode: 'flat', obj: o, target: o[2] }; }
      const p = U.pick(PICTURES);
      const counts = {};
      p.shapes.forEach((s) => { counts[s[0]] = (counts[s[0]] || 0) + 1; });
      let kinds = Object.keys(counts).filter((k) => counts[k] >= 2);
      if (!kinds.length) kinds = Object.keys(counts);
      const target = U.pick(kinds);
      return { key: p.id + target, mode: 'count', pic: p, target, answer: counts[target] };
    }
    if (chance(0.5)) { const o = U.pick(SOLID_OBJECTS); return { key: o[0], mode: 'solid', obj: o, target: o[2] }; }
    const pat = U.pick(PATTERNS);
    const letters = [...new Set(pat.split(''))];
    const kinds = U.sample(Object.keys(SHAPES), letters.length);
    const colors = U.sample(COLORS, letters.length);
    const map = {};
    letters.forEach((L, i) => { map[L] = { k: kinds[i], color: colors[i] }; });
    const seq = U.range(0, 6).map((i) => map[pat[i % pat.length]]);
    return { key: pat + kinds.join(), mode: 'pattern', pat, seq, shown: seq.slice(0, 6), target: seq[6].k, kinds };
  }

  Bubu.registerGame({
    id: 'math-shapes', world: 'math', name: 'Formák', icon: '🔺',
    levels: ['Síkidomok: kör, négyzet, háromszög, téglalap', 'Tárgyak formája, formák számlálása', 'Testek, formaminták'], rounds: 5,
    topic: 'Síkidomok és testek felismerése, megnevezése; alakzatok számlálása; ismétlődő minták',
    round(ctx) {
      const m = begin(ctx, 'g-math-shapes');
      const lv = ctx.level;
      const t = fresh(m, () => shapesGen(lv));
      ctx._mTask = Object.assign({ game: 'shapes', lv }, t);
      const sn = (k) => SHAPES[k].nom;

      if (t.mode === 'name') {
        const others = U.sample(Object.keys(SHAPES).filter((k) => k !== t.target), t.n - 1);
        const kinds = U.shuffle([t.target].concat(others));
        ctx._mTask.options = kinds;
        shapeChoice(ctx, kinds, t.target, shapeSVG, sn, 'Igen, ez ' + art(sn(t.target)) + ' ' + sn(t.target) + '!');
        ctx.ask('Melyik ' + art(sn(t.target)) + ' ' + sn(t.target) + '?');
        return;
      }
      if (t.mode === 'flat' || t.mode === 'solid') {
        const [emoji, name, target] = t.obj;
        const pool = t.mode === 'flat' ? Object.keys(SHAPES) : Object.keys(SOLIDS);
        const nameFn = t.mode === 'flat' ? sn : (k) => SOLIDS[k];
        const draw = t.mode === 'flat' ? shapeSVG : solidSVG;
        const kinds = U.shuffle([target].concat(U.sample(pool.filter((k) => k !== target), lv === 3 ? 3 : 2)));
        ctx._mTask.options = kinds;
        ctx.header(ctx.speakable(U.el('span', { class: 'm-objpic', text: emoji }), cap(name) + '.'));
        shapeChoice(ctx, kinds, target, draw, nameFn, 'Igen, ' + name + ' ' + nameFn(target) + ' alakú!');
        ctx.ask(t.mode === 'flat'
          ? 'Melyik formára hasonlít ' + name + '?'
          : 'Melyik testre hasonlít ' + name + '?');
        return;
      }
      if (t.mode === 'count') {
        const sh = t.pic.shapes.map((s) => '<' + s[1] + ' ' + s[2] + ' data-k="' + s[0] + '" fill="' + s[3] + '" ' + STROKE + '/>').join('');
        const box = svgBox('<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">' + sh + '</svg>', 'm-picture');
        box.addEventListener('click', (e) => {
          const target = e.target && e.target.closest ? e.target.closest('[data-k]') : null;
          if (!target || ctx.done) return;
          const k = target.getAttribute('data-k');
          target.classList.toggle('m-mark');
          ctx.sfx('tap');
          ctx.say(cap(sn(k)) + '.');
        });
        ctx.header(box);
        chooseNumber(ctx, {
          answer: t.answer, n: 4, min: 0, max: 8, extras: [t.answer + 1, t.answer - 1],
          okSay: 'Igen, ' + A(t.answer) + ' ' + sn(t.target) + '!',
        });
        ctx.ask('Hány ' + SHAPES[t.target].acc + ' látsz a képen?' + (ctx.round < 2 ? ' Koppints a formákra, és megmondom a nevüket!' : ''));
        return;
      }
      // minta: mi jön a sorban?
      const slot = U.el('span', { class: 'm-pslot', text: '?' });
      const row = U.el('div', { class: 'm-pattern' }, t.shown.map((s) => svgBox(shapeSVG(s.k, s.color), 'm-pshape')).concat([slot]));
      ctx.header(row);
      const colorOf = {};
      t.shown.forEach((s) => { colorOf[s.k] = s.color; });
      let kinds = t.kinds.slice();
      if (kinds.length < 3) kinds = kinds.concat(U.sample(Object.keys(SHAPES).filter((k) => !kinds.includes(k)), 3 - kinds.length));
      kinds = U.shuffle(kinds);
      ctx._mTask.options = kinds;
      const target = t.target;
      ctx.choose({
        items: kinds.map((k) => ({ k, color: colorOf[k] || U.pick(COLORS) })),
        correct: (it) => it.k === target,
        cls: 'row m-shapes',
        render: (it) => svgBox(shapeSVG(it.k, it.color)),
        sayOnTap: (it) => {
          if (it.k !== target) return 'egy ' + sn(it.k);
          U.clear(slot); slot.classList.add('m-filled');
          slot.appendChild(svgBox(shapeSVG(it.k, it.color), 'm-pshape'));
          return 'Igen, ' + art(sn(target)) + ' ' + sn(target) + ' jön!';
        },
      });
      ctx.ask('Nézd meg a sort! Melyik forma jön a kérdőjel helyére?');
    },
  });
})();
