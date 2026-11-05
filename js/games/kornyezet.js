/* Bubu kalandjai – Természet-völgy (környezetismeret, 1. osztály)
 * Játékok: évszakok, állatok, testem, egészséges tányér, napirend, közlekedés, időjárás
 */
(function () {
  'use strict';

  /* =========================================================
   * Közös segédek
   * ========================================================= */
  const VOWEL = /^[aáeéiíoóöőuúüű]/i;
  /** névelő: 'alma' → 'az alma', 'kutya' → 'a kutya' */
  const art = (w) => (VOWEL.test(w) ? 'az ' : 'a ') + w;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const Art = (w) => cap(art(w));

  /** a játék osztályai a stage-en (a motor minden körben visszaállítja a className-t) */
  function setup(ctx, game) {
    ctx.stage.classList.add('g-kornyezet', 'g-kornyezet-' + game);
  }

  /** egy játékon belül lehetőleg ne ismétlődjön ugyanaz a feladat */
  function usedSet(ctx) { return ctx._kzUsed || (ctx._kzUsed = new Set()); }
  function fresh(ctx, list, key) {
    const U = ctx.U, used = usedSet(ctx);
    let cand = list.filter((x) => !used.has(key(x)));
    if (!cand.length) cand = list;
    const p = U.pick(cand);
    used.add(key(p));
    return p;
  }
  /** n elem, a még nem használtakat előnyben részesítve */
  function freshSample(ctx, list, n, key) {
    const U = ctx.U, used = usedSet(ctx);
    const a = U.shuffle(list.filter((x) => !used.has(key(x))));
    const b = U.shuffle(list.filter((x) => used.has(key(x))));
    const res = a.concat(b).slice(0, n);
    res.forEach((x) => used.add(key(x)));
    return res;
  }
  /** feladattípusok vegyes, kiegyensúlyozott sorrendje a játékon belül */
  function plan(ctx, kinds) {
    if (!ctx._kzPlan) {
      const arr = [];
      for (let i = 0; i < ctx.rounds; i++) arr.push(kinds[i % kinds.length]);
      ctx._kzPlan = ctx.U.shuffle(arr);
    }
    const v = ctx._kzPlan[ctx.round];
    return v === undefined ? kinds[0] : v;
  }

  /** gombtartalom: nagy emoji + apró felirat (díszítés a szülőnek) */
  function opt(U, e, label, extraCls) {
    return U.el('div', { class: 'kz-opt' + (extraCls ? ' ' + extraCls : '') }, [
      U.pic(e),
      label ? U.el('span', { class: 'kz-cap', text: label }) : null,
    ]);
  }

  /** feladatfej nagy képekkel; koppintásra kimondja a nevét */
  function headPics(ctx, pics, speak) {
    const U = ctx.U;
    const row = U.el('div', { class: 'kz-head-pics' }, pics.map((p, i) => {
      if (p && p.nodeType) return p;
      return U.el('span', { class: 'pic kz-float', style: { animationDelay: (i * 0.4) + 's' }, text: p });
    }));
    const h = ctx.header(row);
    if (speak) ctx.speakable(h, speak);
    return h;
  }

  /**
   * Választós feladat (a ctx.choose mintájára, de saját jó/rossz mondatokkal).
   * o: { items, isOk(item), render(item)→Node, right(item)→szöveg, wrongSay(item)→szöveg, cls, btnCls(item), hintAfter }
   */
  function pick(ctx, o) {
    const U = ctx.U;
    const box = U.el('div', { class: 'choices kz-choices ' + (o.cls || '') });
    let okBtn = null;
    o.items.forEach((it, i) => {
      const b = U.el('button', { class: 'choice' + (o.btnCls ? ' ' + o.btnCls(it) : ''), type: 'button', style: { animationDelay: i * 0.07 + 's' } });
      b.appendChild(o.render(it));
      const ok = !!o.isOk(it);
      if (ok) { okBtn = b; b.dataset.ok = '1'; }
      b.addEventListener('click', () => {
        if (ctx.done || b.classList.contains('used')) return;
        if (ok) ctx.correct(b, { say: o.right ? o.right(it) : '' });
        else {
          b.classList.add('used');
          const n = ctx.wrong(b, { say: o.wrongSay ? o.wrongSay(it) : '' });
          if (n >= (o.hintAfter || 2) && okBtn) ctx.hint(okBtn, { silent: true });
        }
      });
      box.appendChild(b);
    });
    (o.container || ctx.stage).appendChild(box);
    return box;
  }

  /**
   * Csoportosítás „házakba”: húzással vagy koppintással (elem, majd ház).
   * o: { bins: [{k, e, n, say, cls}], items: [{e, n, k}], goodSay(item), wrongSay(item, binDef), doneSay }
   */
  function sortTask(ctx, o) {
    const U = ctx.U;
    const binEls = [];
    const binsBox = U.el('div', { class: 'kz-bins kz-bins-' + o.bins.length });
    o.bins.forEach((b, i) => {
      const inner = U.el('div', { class: 'kz-bin-in' });
      const el = U.el('div', { class: 'kz-bin ' + (b.cls || ''), style: { animationDelay: i * 0.1 + 's' }, dataset: { k: b.k } }, [
        U.el('div', { class: 'kz-bin-head' }, [U.pic(b.e), U.el('span', { class: 'kz-cap', text: b.n })]),
        inner,
      ]);
      el._inner = inner; el._def = b;
      // ha nincs kijelölt elem, a házra koppintás kimondja a nevét (a dropTarget előtt fut le)
      el.addEventListener('click', () => {
        if (ctx.done || ctx.stage.querySelector('.kz-item.selected')) return;
        ctx.sfx('tap');
        ctx.say(b.say || Art(b.n) + '.');
        U.anim(el, 'wiggle', 700);
      });
      U.dropTarget(el);
      binEls.push(el);
      binsBox.appendChild(el);
    });
    const binOf = (k) => binEls.find((x) => x._def.k === k);

    const itemsBox = U.el('div', { class: 'kz-items' });
    let left = o.items.length;
    o.items.forEach((it, i) => {
      const el = U.el('div', { class: 'kz-item', style: { animationDelay: 0.2 + i * 0.08 + 's' }, dataset: { k: it.k } }, [U.pic(it.e)]);
      let miss = 0;
      U.draggable(el, {
        targets: () => binEls,
        onTap: (sel) => { if (sel && !ctx.done) ctx.say(Art(it.n) + '.'); },
        onDrop: (t) => {
          if (ctx.done || el.classList.contains('done')) return;
          const right = binOf(it.k);
          if (t === right) {
            el.classList.add('done');
            binEls.forEach((b) => b.classList.remove('hint'));
            t._inner.appendChild(U.el('span', { class: 'kz-mini', text: it.e }));
            left--;
            if (left === 0) ctx.correct(t, { say: o.doneSay || '' });
            else ctx.good(t, { say: o.goodSay ? o.goodSay(it, right._def) : Art(it.n) + '.' });
          } else {
            miss++;
            ctx.wrong(el, { say: o.wrongSay ? o.wrongSay(it, t._def) : '' });
            if (miss >= 2) ctx.hint(right, { silent: true });
          }
        },
      });
      itemsBox.appendChild(el);
    });
    ctx.stage.appendChild(binsBox);
    ctx.stage.appendChild(itemsBox);
    return { binsBox, itemsBox };
  }

  /** 6 elem a kategóriákból: mindegyikből legalább egy (ha van elég), a többi véletlen */
  function mixItems(ctx, groups, n) {
    const U = ctx.U;
    const keys = U.shuffle(Object.keys(groups));
    const chosen = [];
    keys.forEach((k) => { chosen.push(fresh(ctx, groups[k], (x) => 'it:' + x.e)); });
    const rest = [];
    keys.forEach((k) => groups[k].forEach((x) => { if (!chosen.includes(x)) rest.push(x); }));
    const more = freshSample(ctx, rest, Math.max(0, n - chosen.length), (x) => 'it:' + x.e);
    return U.shuffle(chosen.concat(more)).slice(0, Math.max(n, chosen.length));
  }

  /** igaz / nem igaz feladat 👍 / 👎 gombokkal. s: {e:[emojik], t:'állítás', ok:bool, fix:'magyarázat'} */
  function tfTask(ctx, s) {
    const U = ctx.U;
    headPics(ctx, s.e, s.t);
    pick(ctx, {
      items: [true, false],
      isOk: (v) => v === s.ok,
      render: (v) => opt(U, v ? '👍' : '👎', v ? 'jó' : 'nem jó'),
      btnCls: (v) => (v ? 'kz-yes' : 'kz-no'),
      right: () => (s.ok ? 'Igen, ez így jó! ' : 'Így van, ez nem jó! ') + (s.fix || ''),
      wrongSay: () => '',
      cls: 'row kz-tf',
      hintAfter: 1,
    });
    const how = ctx._kzTfHow ? '' : ' Ha jó, koppints a felfelé mutató hüvelykujjra! Ha nem jó, a lefelé mutatóra!';
    ctx._kzTfHow = true;
    ctx.ask(s.t + ' Jó ez így?' + how);
    ctx.setRepeat(s.t + ' Jó ez így? Ha jó: felfelé mutató ujj. Ha nem jó: lefelé mutató ujj.');
  }

  /** sorba rendezés koppintással. o: {steps:[{e,n}] (helyes sorrend), finalSay} */
  function orderTask(ctx, o) {
    const U = ctx.U;
    const steps = o.steps;
    const slots = steps.map((s, i) => U.el('div', { class: 'kz-slot' }, [
      U.el('span', { class: 'kz-slot-num', text: String(i + 1) }),
    ]));
    const track = U.el('div', { class: 'kz-track' }, slots.reduce((acc, s, i) => {
      if (i) acc.push(U.el('span', { class: 'kz-arrow', text: '➜' }));
      acc.push(s);
      return acc;
    }, []));
    ctx.stage.appendChild(track);

    let order = U.shuffle(steps.map((s, i) => i));
    let guard = 0;
    while (order.every((v, i) => v === i) && guard++ < 20) order = U.shuffle(order);
    let next = 0, miss = 0;
    const cards = [];
    const box = U.el('div', { class: 'kz-cards' });
    order.forEach((idx, j) => {
      const s = steps[idx];
      const c = U.el('button', { class: 'choice kz-card', type: 'button', style: { animationDelay: j * 0.08 + 's' }, dataset: { idx: String(idx) } }, [opt(U, s.e, s.n)]);
      cards[idx] = c;
      c.addEventListener('click', () => {
        if (ctx.done || c.classList.contains('done')) return;
        if (idx === next) {
          c.classList.add('done');
          cards.forEach((x) => x && x.classList.remove('hint'));
          const slot = slots[next];
          slot.classList.add('filled');
          slot.appendChild(U.el('span', { class: 'pic kz-slot-pic', text: s.e }));
          next++; miss = 0;
          if (next === steps.length) ctx.correct(slot, { say: o.finalSay || '' });
          else ctx.good(slot, { say: cap(s.n) + '.' });
        } else {
          miss++;
          ctx.wrong(c, { say: Art(s.n) + ' még nem jön.' });
          if (miss >= 2) ctx.hint(cards[next], { silent: true });
        }
      });
      box.appendChild(c);
    });
    ctx.stage.appendChild(box);
  }

  /** több helyes válasz kiválasztása. o: {items:[{e,n,ok}], need, goodSay, badSay(item), doneSay} */
  function multiTask(ctx, o) {
    const U = ctx.U;
    let found = 0, miss = 0;
    const btns = [];
    const box = U.el('div', { class: 'choices kz-choices kz-multi grid-3' });
    o.items.forEach((it, i) => {
      const b = U.el('button', { class: 'choice', type: 'button', style: { animationDelay: i * 0.07 + 's' } }, [opt(U, it.e, it.n)]);
      if (it.ok) b.dataset.ok = '1';
      btns.push(b);
      b.addEventListener('click', () => {
        if (ctx.done || b.classList.contains('used') || b.classList.contains('ok')) return;
        if (it.ok) {
          found++;
          b.classList.remove('hint');
          b.classList.add('ok');
          if (found === o.need) ctx.correct(b, { say: o.doneSay || '' });
          else ctx.good(b, { say: Art(it.n) + '. ' + (o.need - found === 1 ? 'Még egy!' : 'Keresd a többit!') });
        } else {
          miss++;
          b.classList.add('used');
          ctx.wrong(b, { say: o.badSay ? o.badSay(it) : '' });
          if (miss >= 2) {
            const nb = btns.find((x) => x.dataset.ok && !x.classList.contains('ok'));
            if (nb) ctx.hint(nb, { silent: true });
          }
        }
      });
      box.appendChild(b);
    });
    ctx.stage.appendChild(box);
  }

  /* =========================================================
   * 1) ÉVSZAKOK
   * ========================================================= */
  const SEASONS = [
    { k: 'tavasz', n: 'tavasz', e: '🌷', adj: 'tavaszi' },
    { k: 'nyar', n: 'nyár', e: '☀️', adj: 'nyári' },
    { k: 'osz', n: 'ősz', e: '🍂', adj: 'őszi' },
    { k: 'tel', n: 'tél', e: '❄️', adj: 'téli' },
  ];
  const seasonOf = (k) => SEASONS.find((s) => s.k === k);
  const SEASON_PICS = [ // könnyű: természet, időjárás, játék
    { e: '⛄', s: 'tel', n: 'hóember', q: 'Melyik évszakban építünk hóembert?' },
    { e: '🛷', s: 'tel', n: 'szánkó', q: 'Melyik évszakban szánkózunk a havas dombon?' },
    { e: '⛸️', s: 'tel', n: 'korcsolya', q: 'Melyik évszakban korcsolyázunk a befagyott tavon?' },
    { e: '🎿', s: 'tel', n: 'síléc', q: 'Melyik évszakban síelünk?' },
    { e: '🌸', s: 'tavasz', n: 'virágzó fa', q: 'Melyik évszakban virágoznak ki a fák?' },
    { e: '🌱', s: 'tavasz', n: 'kis növény', q: 'Melyik évszakban bújnak ki a földből az első kis növények?' },
    { e: '🏖️', s: 'nyar', n: 'strand', q: 'Melyik évszakban megyünk strandra fürödni?' },
    { e: '🍉', s: 'nyar', n: 'görögdinnye', q: 'Melyik évszakban érik a görögdinnye?' },
    { e: '🌻', s: 'nyar', n: 'napraforgó', q: 'Melyik évszakban virágzik a napraforgó?' },
    { e: '🍁', s: 'osz', n: 'színes falevél', q: 'Melyik évszakban lesznek sárgák és pirosak a falevelek?' },
    { e: '🌰', s: 'osz', n: 'gesztenye', q: 'Melyik évszakban gyűjtünk gesztenyét?' },
  ];
  const SEASON_LIFE = [ // közepes: ruházat, tevékenység, ünnep
    { e: '🎄', s: 'tel', n: 'karácsonyfa', q: 'Melyik évszakban van karácsony?' },
    { e: '🧤', s: 'tel', n: 'kesztyű', q: 'Melyik évszakban kell vastag kesztyű, hogy ne fázzon a kezünk?' },
    { e: '🧣', s: 'tel', n: 'sál', q: 'Melyik évszakban tekerünk meleg sálat a nyakunkba a nagy hidegben?' },
    { e: '🐣', s: 'tavasz', n: 'húsvéti csibe', q: 'Melyik évszakban van húsvét?' },
    { e: '💐', s: 'tavasz', n: 'virágcsokor', q: 'Melyik évszakban van anyák napja, amikor virágot viszünk anyának?' },
    { e: '🕶️', s: 'nyar', n: 'napszemüveg', q: 'Melyik évszakban van a legnagyobb meleg, amikor napszemüveget hordunk?' },
    { e: '🏊', s: 'nyar', n: 'úszás', q: 'Melyik évszakban úszunk a Balatonban?' },
    { e: '🏕️', s: 'nyar', n: 'nyári tábor', q: 'Melyik évszakban van a hosszú szünidő és a nyári tábor?' },
    { e: '🍇', s: 'osz', n: 'szőlő', q: 'Melyik évszakban van a szüret, amikor leszedik a szőlőt?' },
    { e: '🎒', s: 'osz', n: 'iskolatáska', q: 'Melyik évszakban kezdődik az iskola?' },
  ];
  const MONTHS = [
    ['január', 'tel'], ['február', 'tel'], ['március', 'tavasz'], ['április', 'tavasz'], ['május', 'tavasz'],
    ['június', 'nyar'], ['július', 'nyar'], ['augusztus', 'nyar'], ['szeptember', 'osz'], ['október', 'osz'],
    ['november', 'osz'], ['december', 'tel'],
  ];

  function seasonButtons(ctx, isOk, right) {
    const U = ctx.U;
    return pick(ctx, {
      items: SEASONS, // mindig ugyanabban a sorrendben: tavasz, nyár, ősz, tél
      isOk,
      render: (s) => opt(U, s.e, s.n),
      btnCls: (s) => 'kz-season kz-s-' + s.k,
      right: (s) => right(s),
      wrongSay: (s) => 'Ez ' + art(s.n) + '.',
      cls: 'grid-4 kz-seasons',
    });
  }

  Bubu.registerGame({
    id: 'kornyezet-seasons', world: 'kornyezet', name: 'Évszakok!', icon: '🍁',
    intro: 'Négy évszak van: tavasz, nyár, ősz és tél.',
    levels: ['Képek és évszakok', 'Ruhák, ünnepek', 'Sorrend, hónapok'],
    rounds: 5,
    topic: 'Az évszakok jellemzői (időjárás, növények, ruházat, ünnepek), az évszakok sorrendje, a hónapok évszakonként.',
    round(ctx) {
      setup(ctx, 'seasons');
      const U = ctx.U;
      if (ctx.level <= 2) {
        const it = fresh(ctx, ctx.level === 1 ? SEASON_PICS : SEASON_LIFE, (x) => x.e);
        headPics(ctx, [it.e], Art(it.n) + '.');
        seasonButtons(ctx, (s) => s.k === it.s, (s) => 'Igen, ' + art(s.n) + '!');
        ctx.ask(it.q);
        return;
      }
      const kind = plan(ctx, ['seq', 'month']);
      if (kind === 'seq') {
        const t = fresh(ctx, SEASONS.flatMap((s) => [[s, 'after'], [s, 'before']]), (x) => 'seq:' + x[0].k + x[1]);
        const [given, dir] = t;
        const gi = SEASONS.indexOf(given);
        const ans = SEASONS[dir === 'after' ? (gi + 1) % 4 : (gi + 3) % 4];
        const gp = U.el('span', { class: 'pic kz-float', text: given.e });
        const q = U.el('span', { class: 'pic kz-q', text: '❓' });
        const arrow = U.el('span', { class: 'pic kz-arrow-pic', text: '➡️' });
        headPics(ctx, dir === 'after' ? [gp, arrow, q] : [q, arrow, gp], cap(given.n) + '.');
        seasonButtons(ctx, (s) => s === ans, (s) => dir === 'after'
          ? 'Igen! ' + Art(given.n) + ' után ' + art(s.n) + ' jön.'
          : 'Igen! ' + Art(given.n) + ' előtt ' + art(s.n) + ' van.');
        ctx.ask(dir === 'after' ? 'Melyik évszak jön ' + art(given.n) + ' után?' : 'Melyik évszak van ' + art(given.n) + ' előtt?');
      } else {
        const [m, sk] = fresh(ctx, MONTHS, (x) => 'm:' + x[0]);
        const s = seasonOf(sk);
        headPics(ctx, ['📅', U.el('span', { class: 'big-word kz-month', text: m })], cap(m) + '.');
        seasonButtons(ctx, (x) => x.k === sk, () => 'Igen! ' + Art(m) + ' ' + s.adj + ' hónap.');
        ctx.ask(Art(m) + ' melyik évszak hónapja?');
      }
    },
  });

  /* =========================================================
   * 2) ÁLLATOK
   * ========================================================= */
  const SOUNDS = [ // [emoji, név, hang, csoport (azonos csoportból csak egy lehet a lehetőségek között)]
    ['🐶', 'kutya', 'vau-vau', 'kutya'], ['🐱', 'cica', 'miaú', 'cica'], ['🐄', 'tehén', 'mú', 'tehén'],
    ['🐐', 'kecske', 'mek-mek', 'kecske'], ['🐓', 'kakas', 'kukurikú', 'baromfi'], ['🐔', 'tyúk', 'kotkodács', 'baromfi'],
    ['🦆', 'kacsa', 'háp-háp', 'kacsa'], ['🐷', 'malac', 'röf-röf', 'malac'], ['🐸', 'béka', 'brekeke', 'béka'],
    ['🐴', 'ló', 'nyihaha', 'ló'], ['🦉', 'bagoly', 'huhú', 'bagoly'], ['🐝', 'méhecske', 'zümm-zümm', 'méh'],
    ['🐭', 'egér', 'cin-cin', 'egér'],
  ].map(([e, n, s, g]) => ({ e, n, s, g }));
  const FARM = [
    ['🐄', 'tehén'], ['🐷', 'malac'], ['🐔', 'tyúk'], ['🐴', 'ló'], ['🐑', 'bárány'], ['🐐', 'kecske'],
    ['🐶', 'kutya'], ['🐱', 'cica'], ['🦃', 'pulyka'],
  ].map(([e, n]) => ({ e, n, k: 'farm' }));
  const FOREST = [
    ['🦊', 'róka'], ['🐻', 'medve'], ['🦌', 'szarvas'], ['🐗', 'vaddisznó'], ['🐺', 'farkas'], ['🦔', 'sün'],
    ['🐿️', 'mókus'], ['🦉', 'bagoly'],
  ].map(([e, n]) => ({ e, n, k: 'forest' }));
  const WATER = [
    ['🐟', 'hal'], ['🐬', 'delfin'], ['🐳', 'bálna'], ['🐙', 'polip'], ['🦀', 'rák'], ['🦈', 'cápa'],
  ].map(([e, n]) => ({ e, n, k: 'water' }));
  const HOME = {
    farm: { k: 'farm', e: '🏡', n: 'tanya', loc: 'a tanyán', cls: 'kz-bin-farm' },
    forest: { k: 'forest', e: '🌲', n: 'erdő', loc: 'az erdőben', cls: 'kz-bin-forest' },
    water: { k: 'water', e: '🌊', n: 'víz', loc: 'a vízben', cls: 'kz-bin-water' },
  };
  const MOTHERS = [ // kicsinye → anyja
    { baby: 'borjú', m: '🐄', mn: 'tehén', ex: ['🦌'] },
    { baby: 'csikó', m: '🐴', mn: 'ló', ex: [] },
    { baby: 'gida', m: '🐐', mn: 'kecske', ex: ['🦌'] },
    { baby: 'csibe', m: '🐔', mn: 'tyúk', ex: [], pic: '🐤' },
    { baby: 'medvebocs', m: '🐻', mn: 'medve', ex: [] },
    { baby: 'ebihal', m: '🐸', mn: 'béka', ex: [] },
  ];
  const MOTHER_OPTS = MOTHERS.map((x) => ({ e: x.m, n: x.mn })).concat([{ e: '🦊', n: 'róka' }, { e: '🐶', n: 'kutya' }, { e: '🐱', n: 'cica' }, { e: '🦌', n: 'szarvas' }]);

  Bubu.registerGame({
    id: 'kornyezet-animals', world: 'kornyezet', name: 'Állatok!', icon: '🐮',
    intro: 'Gyere, látogassuk meg az állatokat!',
    levels: ['Állathangok', 'Háziállat vagy vadállat', 'Ki hol él? Anya és kicsinye'],
    rounds: 5,
    topic: 'Állatok felismerése és hangjuk; háziállatok és vadállatok; élőhelyek (víz, erdő, tanya); állatok és kicsinyeik.',
    round(ctx) {
      setup(ctx, 'animals');
      const U = ctx.U;
      if (ctx.level === 1) {
        const a = fresh(ctx, SOUNDS, (x) => x.e);
        const others = U.sample(SOUNDS.filter((x) => x.g !== a.g), 30);
        const opts = [a];
        others.forEach((x) => { if (opts.length < 3 && !opts.some((y) => y.g === x.g)) opts.push(x); });
        const bubble = U.el('div', { class: 'kz-bubble', text: '„' + a.s + '”' });
        headPics(ctx, ['🔊', bubble], cap(a.s) + '!');
        pick(ctx, {
          items: U.shuffle(opts), isOk: (x) => x === a,
          render: (x) => opt(U, x.e, x.n),
          right: (x) => 'Igen! ' + Art(x.n) + ' mondja: ' + x.s + '!',
          wrongSay: (x) => 'Ez ' + art(x.n) + '. ' + Art(x.n) + ' azt mondja: ' + x.s + '.',
          cls: 'row pics',
        });
        ctx.ask('Ki mondja, hogy ' + a.s + '?');
        return;
      }
      if (ctx.level === 2) {
        const items = mixItems(ctx, { farm: FARM, forest: FOREST }, 6);
        sortTask(ctx, {
          bins: [
            Object.assign({}, HOME.farm, { say: 'Ez a tanya. Itt élnek a háziállatok.' }),
            Object.assign({}, HOME.forest, { say: 'Ez az erdő. Itt élnek a vadállatok.' }),
          ],
          items,
          goodSay: (it) => Art(it.n) + (it.k === 'farm' ? ' háziállat.' : ' vadállat.'),
          wrongSay: (it) => Art(it.n) + (it.k === 'farm' ? ' nem vadállat.' : ' nem háziállat.'),
          doneSay: 'Minden állat hazaért!',
        });
        ctx.ask('Vidd haza az állatokat! A háziállatok a tanyára mennek, a vadállatok az erdőbe. Húzd vagy koppintsd őket a helyükre!');
        return;
      }
      // nehéz: élőhelyek vagy anya és kicsinye
      const kind = plan(ctx, ['home', 'mother', 'home', 'mother', 'home']);
      if (kind === 'home') {
        const items = mixItems(ctx, { farm: FARM, forest: FOREST, water: WATER }, 6);
        sortTask(ctx, {
          bins: [HOME.water, HOME.forest, HOME.farm].map((b) => Object.assign({}, b, { say: Art(b.n) + '.' })),
          items,
          goodSay: (it) => Art(it.n) + ' ' + HOME[it.k].loc + ' él.',
          wrongSay: (it, bin) => Art(it.n) + ' nem ' + bin.loc + ' él.',
          doneSay: 'Mindenki hazatalált!',
        });
        ctx.ask('Ki hol él? Vidd mindegyik állatot az otthonába: a vízbe, az erdőbe vagy a tanyára!');
      } else {
        const m = fresh(ctx, MOTHERS, (x) => 'mo:' + x.baby);
        const pool = MOTHER_OPTS.filter((x) => x.e !== m.m && !m.ex.includes(x.e));
        const items = U.shuffle([{ e: m.m, n: m.mn }].concat(U.sample(pool, 3)));
        headPics(ctx, [m.pic || '🍼', '💞', U.el('span', { class: 'pic kz-q', text: '❓' })], Art(m.baby) + '.');
        pick(ctx, {
          items, isOk: (x) => x.e === m.m,
          render: (x) => opt(U, x.e, x.n),
          right: (x) => 'Igen! ' + Art(x.n) + ' kicsinye ' + art(m.baby) + '.',
          wrongSay: (x) => 'Ez ' + art(x.n) + '.',
          cls: 'grid-4 pics',
        });
        ctx.ask('Ki ' + art(m.baby) + ' anyukája?');
      }
    },
  });

  /* =========================================================
   * 3) TESTEM
   * ========================================================= */
  const PART = {
    szem: { e: '👁️', n: 'szem', acc: 'szemet' },
    ful: { e: '👂', n: 'fül', acc: 'fület' },
    orr: { e: '👃', n: 'orr', acc: 'orrot' },
    nyelv: { e: '👅', n: 'nyelv', acc: 'nyelvet' },
    kez: { e: '✋', n: 'kéz', acc: 'kezet' },
    szaj: { e: '👄', n: 'száj', acc: 'szájat' },
    fog: { e: '🦷', n: 'fog', acc: 'fogat' },
    lab: { e: '🦶', n: 'láb', acc: 'lábat' },
    kar: { e: '💪', n: 'kar', acc: 'kart' },
    agy: { e: '🧠', n: 'agy', acc: 'agyat' },
  };
  const SENSE_KEYS = ['szem', 'ful', 'orr', 'nyelv', 'kez'];
  const SENSE_Q = [
    { a: 'szem', q: 'Mivel látunk?', h: '🌄', why: 'A szemünkkel látunk.' },
    { a: 'ful', q: 'Mivel hallunk?', h: '🎵', why: 'A fülünkkel hallunk.' },
    { a: 'orr', q: 'Mivel szagolunk?', h: '💐', why: 'Az orrunkkal szagolunk.' },
    { a: 'nyelv', q: 'Mivel ízlelünk?', h: '🍓', why: 'A nyelvünkkel ízlelünk.' },
    { a: 'kez', q: 'Mivel tapintunk?', h: '🧊', why: 'A kezünkkel tapintunk.' },
    { a: 'orr', q: 'Mivel érezzük a virág illatát?', h: '🌸', why: 'Az orrunkkal érezzük az illatokat.' },
    { a: 'ful', q: 'Mivel halljuk a csengő hangját?', h: '🔔', why: 'A fülünkkel halljuk a hangokat.' },
    { a: 'szem', q: 'Mivel látjuk a szivárvány színeit?', h: '🌈', why: 'A szemünkkel látjuk a színeket.' },
    { a: 'nyelv', q: 'Mivel érezzük, hogy savanyú a citrom?', h: '🍋', why: 'A nyelvünkkel érezzük az ízeket.' },
    { a: 'kez', q: 'Mivel érezzük, hogy puha a maci?', h: '🧸', why: 'A kezünkkel megtapintjuk, hogy puha.' },
    { a: 'nyelv', q: 'Mivel érezzük, hogy édes a sütemény?', h: '🍰', why: 'A nyelvünkkel érezzük az ízeket.' },
  ];
  const BODY_DO = [ // mit csinálunk vele (ex: ezek ne legyenek a lehetőségek között, mert vitatható)
    { a: 'lab', q: 'Mivel rúgod a labdát?', h: '⚽', why: 'A lábaddal rúgod a labdát.' },
    { a: 'fog', q: 'Mivel rágod meg az almát?', h: '🍎', why: 'A fogaddal rágod meg az almát.', ex: ['szaj', 'nyelv'] },
    { a: 'kez', q: 'Mivel fogod a ceruzát, amikor rajzolsz?', h: '✏️', why: 'A kezeddel fogod a ceruzát.', ex: ['kar'] },
    { a: 'agy', q: 'Mivel gondolkodsz, amikor kirakod a kirakóst?', h: '🧩', why: 'Az agyaddal gondolkodsz.' },
    { a: 'kar', q: 'Mivel öleled meg a barátodat?', h: '🤗', why: 'A karoddal ölelsz.', ex: ['kez'] },
    { a: 'szaj', q: 'Mivel adsz puszit anyának?', h: '😘', why: 'A száddal adsz puszit.', ex: ['nyelv', 'fog'] },
    { a: 'szem', q: 'Mivel nézed a mesét?', h: '📺', why: 'A szemeddel nézed a mesét.', ex: ['ful'] },
    { a: 'lab', q: 'Mivel szaladsz a játszótéren?', h: '🏃', why: 'A lábaddal szaladsz.' },
  ];
  const HEALTH = [
    { e: ['🦷', '✨'], t: 'Reggel és este fogat mosunk.', ok: true },
    { e: ['🧼', '🍽️'], t: 'Evés előtt kezet mosunk.', ok: true },
    { e: ['🚽', '🧼'], t: 'Ha a vécét használtuk, utána kezet mosunk.', ok: true },
    { e: ['🛏️', '🌙'], t: 'Este időben lefekszünk aludni, hogy kipihenjük magunkat.', ok: true },
    { e: ['🍎', '🥕'], t: 'A gyümölcs és a zöldség egészséges.', ok: true },
    { e: ['🤧'], t: 'Ha tüsszentünk, eltakarjuk az orrunkat és a szánkat.', ok: true },
    { e: ['🚿'], t: 'Rendszeresen fürdünk vagy zuhanyozunk.', ok: true },
    { e: ['⚽', '🌳'], t: 'A szabadban játszani és mozogni egészséges.', ok: true },
    { e: ['🍬', '🌙'], t: 'Este, fogmosás után még cukorkát eszünk.', ok: false, fix: 'Fogmosás után már nem eszünk semmit.' },
    { e: ['🍔', '🖐️'], t: 'Piszkos kézzel is nyugodtan ehetünk.', ok: false, fix: 'Evés előtt mindig kezet mosunk.' },
    { e: ['📺', '🌙'], t: 'Egész éjjel mesét nézünk alvás helyett.', ok: false, fix: 'Éjjel alszunk, hogy kipihenjük magunkat.' },
    { e: ['🧦'], t: 'Ugyanazt a zoknit egy hétig hordjuk.', ok: false, fix: 'Minden nap tiszta zoknit veszünk.' },
    { e: ['🍭', '🍫'], t: 'Reggelire csak cukorkát és csokit eszünk.', ok: false, fix: 'Reggelire egészséges ételt eszünk.' },
    { e: ['🦷'], t: 'Elég egy héten egyszer fogat mosni.', ok: false, fix: 'Minden reggel és este fogat mosunk.' },
  ];

  Bubu.registerGame({
    id: 'kornyezet-body', world: 'kornyezet', name: 'A testem!', icon: '👂',
    intro: 'Fedezzük fel együtt a testünket!',
    levels: ['Érzékszervek', 'Testrészek', 'Tisztaság, egészség'],
    rounds: 5,
    topic: 'Az öt érzékszerv és szerepük; testrészek megnevezése és feladatuk; tisztálkodás, egészséges életmód.',
    round(ctx) {
      setup(ctx, 'body');
      const U = ctx.U;
      if (ctx.level === 1) {
        const q = fresh(ctx, SENSE_Q, (x) => x.q);
        const others = U.sample(SENSE_KEYS.filter((k) => k !== q.a), 2);
        headPics(ctx, [q.h]);
        pick(ctx, {
          items: U.shuffle([q.a].concat(others)), isOk: (k) => k === q.a,
          render: (k) => opt(U, PART[k].e, PART[k].n),
          right: () => 'Igen! ' + q.why,
          wrongSay: (k) => 'Ez ' + art(PART[k].n) + '.',
          cls: 'row pics',
        });
        ctx.ask(q.q);
        return;
      }
      if (ctx.level === 2) {
        const kind = plan(ctx, ['do', 'name']);
        if (kind === 'do') {
          const q = fresh(ctx, BODY_DO, (x) => x.q);
          const pool = Object.keys(PART).filter((k) => k !== q.a && !(q.ex || []).includes(k));
          headPics(ctx, [q.h]);
          pick(ctx, {
            items: U.shuffle([q.a].concat(U.sample(pool, 3))), isOk: (k) => k === q.a,
            render: (k) => opt(U, PART[k].e, PART[k].n),
            right: () => 'Igen! ' + q.why,
            wrongSay: (k) => 'Ez ' + art(PART[k].n) + '.',
            cls: 'grid-4 pics',
          });
          ctx.ask(q.q);
        } else {
          const a = fresh(ctx, Object.keys(PART), (k) => 'name:' + k);
          const items = U.shuffle([a].concat(U.sample(Object.keys(PART).filter((k) => k !== a), 3)));
          headPics(ctx, ['🧒', U.el('span', { class: 'pic kz-q', text: '❓' })]);
          pick(ctx, {
            items, isOk: (k) => k === a,
            render: (k) => opt(U, PART[k].e, ''),
            right: () => 'Igen, ez ' + art(PART[a].n) + '!',
            wrongSay: (k) => 'Ez ' + art(PART[k].n) + '.',
            cls: 'grid-4 pics',
          });
          ctx.ask('Keresd meg ' + art(PART[a].acc) + '!');
        }
        return;
      }
      // nehéz: igaz vagy nem igaz – fele-fele arányban
      const want = plan(ctx, [true, false]);
      tfTask(ctx, fresh(ctx, HEALTH.filter((s) => s.ok === want), (x) => x.t));
    },
  });

  /* =========================================================
   * 4) EGÉSZSÉGES TÁNYÉR
   * ========================================================= */
  const HEALTHY = [
    ['🍎', 'alma'], ['🥕', 'répa'], ['🥦', 'brokkoli'], ['🍌', 'banán'], ['🍐', 'körte'], ['🥛', 'tej'],
    ['🥒', 'uborka'], ['🍇', 'szőlő'], ['🍓', 'eper'], ['🍊', 'narancs'], ['🥚', 'tojás'],
  ].map(([e, n]) => ({ e, n, k: 'healthy' }));
  const SNACK = [
    ['🍬', 'cukorka'], ['🍫', 'csoki'], ['🍩', 'fánk'], ['🍪', 'keksz'], ['🍰', 'torta'], ['🧁', 'muffin'],
    ['🍦', 'fagylalt'], ['🥤', 'cukros üdítő'],
  ].map(([e, n]) => ({ e, n, k: 'snack' }));
  const FRUIT = [
    ['🍎', 'alma'], ['🍐', 'körte'], ['🍌', 'banán'], ['🍇', 'szőlő'], ['🍓', 'eper'], ['🍒', 'cseresznye'],
    ['🍑', 'őszibarack'], ['🍋', 'citrom'], ['🍊', 'narancs'], ['🍍', 'ananász'], ['🥝', 'kivi'],
  ].map(([e, n]) => ({ e, n, k: 'fruit' }));
  const VEG = [
    ['🥕', 'répa'], ['🥦', 'brokkoli'], ['🥒', 'uborka'], ['🥔', 'krumpli'], ['🧅', 'hagyma'], ['🧄', 'fokhagyma'],
    ['🥬', 'saláta'],
  ].map(([e, n]) => ({ e, n, k: 'veg' }));
  const ORIGIN = {
    cow: [['🥛', 'tej', 'A tejet a tehén adja.'], ['🧀', 'sajt', 'A sajt a tehén tejéből készül.'], ['🧈', 'vaj', 'A vaj a tehén tejéből készül.']],
    hen: [['🥚', 'tojás', 'A tojást a tyúk tojja.'], ['🍳', 'tükörtojás', 'A tükörtojás a tyúk tojásából készül.']],
    wheat: [['🍞', 'kenyér', 'A kenyér a búza lisztjéből készül.'], ['🥐', 'kifli', 'A kifli a búza lisztjéből készül.'], ['🥨', 'perec', 'A perec a búza lisztjéből készül.']],
    tree: [['🍎', 'alma', 'Az alma a fán terem.'], ['🍐', 'körte', 'A körte a fán terem.'], ['🍒', 'cseresznye', 'A cseresznye a fán terem.'], ['🍑', 'őszibarack', 'Az őszibarack a fán terem.']],
  };
  const ORIGIN_ITEMS = {};
  Object.keys(ORIGIN).forEach((k) => { ORIGIN_ITEMS[k] = ORIGIN[k].map(([e, n, why]) => ({ e, n, k, why })); });
  const ORIGIN_BINS = [
    { k: 'cow', e: '🐄', n: 'tehén', say: 'A tehén.', cls: 'kz-bin-cow' },
    { k: 'hen', e: '🐔', n: 'tyúk', say: 'A tyúk.', cls: 'kz-bin-hen' },
    { k: 'wheat', e: '🌾', n: 'búza', say: 'A búza.', cls: 'kz-bin-wheat' },
    { k: 'tree', e: '🌳', n: 'gyümölcsfa', say: 'A gyümölcsfa.', cls: 'kz-bin-tree' },
  ];

  Bubu.registerGame({
    id: 'kornyezet-plate', world: 'kornyezet', name: 'Egészséges tányér!', icon: '🥗',
    intro: 'Bubu nagyon éhes! Segíts neki egészségesen enni!',
    levels: ['Egészséges vagy nasi', 'Gyümölcs vagy zöldség', 'Honnan származik?'],
    rounds: 5,
    topic: 'Egészséges táplálkozás; gyümölcsök és zöldségek; az élelmiszerek eredete (tehén, tyúk, gabona, gyümölcsfa).',
    round(ctx) {
      setup(ctx, 'plate');
      if (ctx.level === 1) {
        sortTask(ctx, {
          bins: [
            { k: 'healthy', e: '🥗', n: 'egészséges', say: 'Ez az egészséges ételek tányérja.', cls: 'kz-plate kz-bin-healthy' },
            { k: 'snack', e: '🍭', n: 'nasi', say: 'Ez a nassolnivalók tányérja. Ezekből csak ritkán és keveset eszünk.', cls: 'kz-plate kz-bin-snack' },
          ],
          items: mixItems(ctx, { healthy: HEALTHY, snack: SNACK }, 6),
          goodSay: (it) => Art(it.n) + (it.k === 'healthy' ? ' egészséges.' : ' nassolnivaló.'),
          wrongSay: (it) => (it.k === 'healthy' ? Art(it.n) + ' egészséges.' : Art(it.n) + ' nassolnivaló, abból csak keveset eszünk.'),
          doneSay: 'Kész a két tányér!',
        });
        ctx.ask('Válogasd szét az ételeket! Az egészséges ételek a zöld tányérra kerülnek, a nassolnivalók a piros tányérra.');
        return;
      }
      if (ctx.level === 2) {
        const fr = FRUIT.filter((x) => x.e !== '🍎'), vg = VEG.filter((x) => x.e !== '🥕');
        sortTask(ctx, {
          bins: [
            { k: 'fruit', e: '🍎', n: 'gyümölcs', say: 'Ez a gyümölcsök kosara.', cls: 'kz-basket kz-bin-fruit' },
            { k: 'veg', e: '🥕', n: 'zöldség', say: 'Ez a zöldségek kosara.', cls: 'kz-basket kz-bin-veg' },
          ],
          items: mixItems(ctx, { fruit: fr, veg: vg }, 6),
          goodSay: (it) => Art(it.n) + (it.k === 'fruit' ? ' gyümölcs.' : ' zöldség.'),
          wrongSay: (it) => Art(it.n) + (it.k === 'fruit' ? ' nem zöldség.' : ' nem gyümölcs.'),
          doneSay: 'Tele vannak a kosarak!',
        });
        ctx.ask('A gyümölcsöket tedd az almás kosárba, a zöldségeket a répás kosárba!');
        return;
      }
      sortTask(ctx, {
        bins: ORIGIN_BINS,
        items: mixItems(ctx, ORIGIN_ITEMS, 5),
        goodSay: (it) => it.why,
        wrongSay: (it) => Art(it.n) + ' nem innen származik.',
        doneSay: 'Mindent a helyére tettél!',
      });
      ctx.ask('Honnan kapjuk az ételeket? Vidd mindegyiket oda, ahonnan származik: a tehénhez, a tyúkhoz, a búzához vagy a gyümölcsfához!');
    },
  });

  /* =========================================================
   * 5) NAPIREND
   * ========================================================= */
  const DAYPARTS = [
    { k: 'reggel', n: 'reggel', e: '🌅' },
    { k: 'del', n: 'délben', e: '☀️' },
    { k: 'este', n: 'este', e: '🌆' },
    { k: 'ejjel', n: 'éjjel', e: '🌙' },
  ];
  const DAY_PICS = [
    { e: '⏰', p: 'reggel', n: 'ébresztőóra', q: 'Mikor csörög az ébresztőóra, hogy felkeljünk?' },
    { e: '🥣', p: 'reggel', n: 'reggeli', q: 'Mikor reggelizünk?' },
    { e: '🐓', p: 'reggel', n: 'kakas', q: 'Mikor kel fel a Nap, és kukorékol a kakas?' },
    { e: '🎒', p: 'reggel', n: 'iskolatáska', q: 'Mikor indulunk el az iskolába?' },
    { e: '🍲', p: 'del', n: 'ebéd', q: 'Mikor ebédelünk?' },
    { e: '🍽️', p: 'este', n: 'vacsora', q: 'Mikor vacsorázunk?' },
    { e: '🛁', p: 'este', n: 'fürdés', q: 'Mikor fürdünk meg lefekvés előtt?' },
    { e: '📖', p: 'este', n: 'mesekönyv', q: 'Mikor olvas nekünk anya mesét lefekvés előtt?' },
    { e: '🛌', p: 'ejjel', n: 'alvás', q: 'Mikor alszunk mélyen az ágyunkban?' },
    { e: '🦉', p: 'ejjel', n: 'bagoly', q: 'Mikor vadászik a bagoly a sötétben?' },
  ];
  const ROUTINE = [ // helyes sorrend; 'meal': ebéd és vacsora képe hasonló, egyszerre ne szerepeljen
    { e: '⏰', n: 'felkelés' },
    { e: '🥣', n: 'reggeli' },
    { e: '🏫', n: 'iskola' },
    { e: '🍲', n: 'ebéd', meal: true },
    { e: '⚽', n: 'játék' },
    { e: '🍽️', n: 'vacsora', meal: true },
    { e: '🛌', n: 'alvás' },
  ];
  const WEEK = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'];

  /** a hét napja kártyán: 🔊 + 7 pötty, ebből a nap sorszámáig színezve */
  function dayFace(U, i) {
    const dots = U.el('div', { class: 'kz-dots' }, WEEK.map((d, j) => U.el('span', {
      class: 'kz-dot' + (j <= i ? ' on' : '') + (j >= 5 ? ' we' : ''),
    })));
    return U.el('div', { class: 'kz-dayface' + (i >= 5 ? ' weekend' : '') }, [
      U.el('span', { class: 'kz-spk', text: '🔊' }),
      U.el('span', { class: 'kz-daynum', text: String(i + 1) }),
      dots,
    ]);
  }

  function weekTask(ctx) {
    const U = ctx.U;
    const [g, dir] = fresh(ctx, U.range(0, 6).flatMap((i) => [[i, 'after'], [i, 'after'], [i, 'before']]), (x) => 'w:' + x[0] + x[1]);
    const ans = dir === 'after' ? (g + 1) % 7 : (g + 6) % 7;
    const gName = WEEK[g], aName = WEEK[ans];

    const given = U.el('div', { class: 'kz-day kz-day-given' }, [dayFace(U, g)]);
    ctx.speakable(given, cap(gName) + '.');
    const q = U.el('div', { class: 'kz-day kz-day-q' }, [U.el('span', { class: 'pic', text: '❓' })]);
    const arrow = U.el('span', { class: 'pic kz-arrow-pic', text: '➡️' });
    ctx.header(dir === 'after' ? [given, arrow, q] : [q, arrow, given]);

    const others = U.sample(U.range(0, 6).filter((i) => i !== g && i !== ans), 2);
    const opts = U.shuffle([ans].concat(others));
    let sel = null, selAt = 0, miss = 0;
    const cards = [];
    const okBtn = U.el('button', { class: 'kz-confirm', type: 'button', disabled: true, 'aria-label': 'Ez az!' }, [U.el('span', { text: '✔' })]);
    const commit = (c) => {
      if (ctx.done || !c) return;
      const i = c._day;
      if (i === ans) {
        ctx.correct(c, { say: 'Igen! ' + (dir === 'after' ? cap(gName) + ' után ' + aName + ' jön.' : cap(gName) + ' előtt ' + aName + ' van.') });
        okBtn.disabled = true;
      } else {
        c.classList.remove('selected'); c.classList.add('used');
        sel = null; okBtn.disabled = true; okBtn.classList.remove('ready');
        miss++;
        ctx.wrong(c, { say: 'Ez ' + WEEK[i] + '.' });
        if (miss >= 2) ctx.hint(cards.find((x) => x._day === ans), { silent: true });
      }
    };
    const box = U.el('div', { class: 'kz-days' });
    opts.forEach((i, j) => {
      const c = U.el('button', { class: 'choice kz-day', type: 'button', style: { animationDelay: j * 0.08 + 's' } }, [dayFace(U, i)]);
      c._day = i;
      if (i === ans) c.dataset.ok = '1';
      cards.push(c);
      c.addEventListener('click', () => {
        if (ctx.done || c.classList.contains('used')) return;
        const now = Date.now();
        if (sel === c && now - selAt < 700) { commit(c); return; } // dupla koppintás
        if (sel && sel !== c) sel.classList.remove('selected');
        sel = c; selAt = now;
        c.classList.add('selected');
        U.anim(c, 'bounce', 500);
        ctx.sfx('tap');
        ctx.say(cap(WEEK[i]) + '.');
        okBtn.disabled = false;
        okBtn.classList.remove('ready'); void okBtn.offsetWidth; okBtn.classList.add('ready');
      });
      box.appendChild(c);
    });
    okBtn.addEventListener('click', () => { if (sel) commit(sel); });
    ctx.stage.appendChild(box);
    ctx.stage.appendChild(okBtn);

    const how = ctx.round === 0 || !ctx._kzWeekHow
      ? ' Koppints a kártyákra, és meghallod, melyik nap. Ha megtaláltad, nyomd meg a zöld pipát!'
      : '';
    ctx._kzWeekHow = true;
    ctx.ask((dir === 'after' ? 'Melyik nap jön ' + gName + ' után?' : 'Melyik nap van ' + gName + ' előtt?') + how);
    ctx.setRepeat((dir === 'after' ? 'Melyik nap jön ' + gName + ' után?' : 'Melyik nap van ' + gName + ' előtt?') + ' Koppints a kártyákra, aztán nyomd meg a zöld pipát!');
  }

  Bubu.registerGame({
    id: 'kornyezet-daily', world: 'kornyezet', name: 'Napirend!', icon: '⏰',
    intro: 'Reggel, délben, este, éjjel: így telik el egy nap.',
    levels: ['Napszakok', 'Napirend sorba', 'A hét napjai'],
    rounds: 5,
    topic: 'Napszakok (reggel, dél, este, éjjel); a napirend sorrendje; a hét napjainak sorrendje.',
    round(ctx) {
      setup(ctx, 'daily');
      const U = ctx.U;
      if (ctx.level === 1) {
        const it = fresh(ctx, DAY_PICS, (x) => x.e);
        headPics(ctx, [it.e], Art(it.n) + '.');
        pick(ctx, {
          items: DAYPARTS, isOk: (p) => p.k === it.p,
          render: (p) => opt(U, p.e, p.n),
          btnCls: (p) => 'kz-part kz-p-' + p.k,
          right: (p) => 'Igen, ' + p.n + '!',
          wrongSay: (p) => 'Nem ' + p.n + '.',
          cls: 'grid-4 kz-parts',
        });
        ctx.ask(it.q);
        return;
      }
      if (ctx.level === 2) {
        const n = ctx.round < 2 ? 3 : 4;
        let steps, guard = 0;
        do {
          steps = U.sample(ROUTINE.map((s, i) => i), n).sort((a, b) => a - b).map((i) => ROUTINE[i]);
        } while (steps.filter((s) => s.meal).length > 1 && guard++ < 50);
        headPics(ctx, ['🌅', '➡️', '🌙'], 'Reggeltől estig.');
        orderTask(ctx, { steps, finalSay: cap(steps.map((s) => s.n).join(', ')) + '.' });
        ctx.ask('Mi történik egy nap? Koppints a képekre sorban: azzal kezdd, ami a legkorábban van!');
        return;
      }
      weekTask(ctx);
    },
  });

  /* =========================================================
   * 6) KÖZLEKEDÉS
   * ========================================================= */
  function lightEl(U, color, big) {
    return U.el('div', { class: 'kz-light' + (big ? ' big' : '') }, [
      U.el('div', { class: 'kz-lamp red' + (color === 'red' ? ' on' : '') }, [U.el('span', { text: '🧍' })]),
      U.el('div', { class: 'kz-lamp green' + (color === 'green' ? ' on' : '') }, [U.el('span', { text: '🚶' })]),
    ]);
  }
  const VEHICLES = {
    land: [['🚗', 'autó'], ['🚲', 'bicikli'], ['🚂', 'vonat'], ['🚌', 'busz'], ['🚜', 'traktor'], ['🚒', 'tűzoltóautó'], ['🚑', 'mentőautó'], ['🛴', 'roller']],
    water: [['⛵', 'vitorlás'], ['🚢', 'hajó'], ['🚤', 'motorcsónak'], ['🛶', 'kenu'], ['⛴️', 'komp']],
    air: [['✈️', 'repülőgép'], ['🚁', 'helikopter'], ['🛩️', 'kisrepülő']],
  };
  const VEH_ITEMS = {};
  Object.keys(VEHICLES).forEach((k) => { VEH_ITEMS[k] = VEHICLES[k].map(([e, n]) => ({ e, n, k })); });
  const VEH_BINS = [
    { k: 'land', e: '🛣️', n: 'szárazföld', loc: 'a szárazföldön', say: 'Szárazföld: az út és a sín.', cls: 'kz-bin-land' },
    { k: 'water', e: '🌊', n: 'víz', loc: 'a vízen', say: 'A víz.', cls: 'kz-bin-water' },
    { k: 'air', e: '☁️', n: 'levegő', loc: 'a levegőben', say: 'A levegő.', cls: 'kz-bin-air' },
  ];
  const VEH_LOC = { land: 'a szárazföldön', water: 'a vízen', air: 'a levegőben' };
  const SAFETY = [
    { e: ['🚸'], t: 'Az úttesten a zebrán megyünk át.', ok: true },
    { e: ['👀', '🚗'], t: 'Mielőtt átmegyünk az úton, körülnézünk: balra, jobbra, aztán újra balra.', ok: true },
    { e: ['🚴'], t: 'Ha biciklizünk, bukósisakot teszünk a fejünkre.', ok: true },
    { e: ['🚗', '🧒'], t: 'Az autóban mindig bekapcsoljuk a biztonsági övet.', ok: true },
    { e: ['🦺', '🌙'], t: 'Sötétben láthatósági mellényt veszünk fel, hogy messziről lássanak minket.', ok: true },
    { e: ['🚌'], t: 'A buszon menet közben kapaszkodunk.', ok: true },
    { e: ['⚽', '🚗'], t: 'Az úttesten labdázunk.', ok: false, fix: 'Labdázni a játszótéren vagy az udvaron szabad.' },
    { e: ['🚦', '🏃'], t: 'Piros lámpánál átszaladunk az úton.', ok: false, fix: 'Piros lámpánál megállunk.' },
    { e: ['🚗'], t: 'Rövid úton nem kell bekapcsolni a biztonsági övet.', ok: false, fix: 'A biztonsági övet mindig bekapcsoljuk.' },
    { e: ['🚴', '🚚'], t: 'Bukósisak nélkül biciklizünk a forgalmas úton.', ok: false, fix: 'Biciklizéskor mindig bukósisak kell.' },
    { e: ['📱', '🚸'], t: 'Amikor átmegyünk a zebrán, a telefonunkat nézzük.', ok: false, fix: 'Átkeléskor az utat figyeljük.' },
    { e: ['🚌', '⚠️'], t: 'Menet közben kihajolunk a busz ablakán.', ok: false, fix: 'A buszból sosem hajolunk ki.' },
  ];

  Bubu.registerGame({
    id: 'kornyezet-traffic', world: 'kornyezet', name: 'Közlekedés!', icon: '🚦',
    intro: 'Közlekedjünk okosan! Piros: állj! Zöld: mehetsz!',
    levels: ['Jelzőlámpa', 'Szárazföld, víz, levegő', 'Biztonságos közlekedés'],
    rounds: 5,
    topic: 'A gyalogos jelzőlámpa; járművek csoportosítása (szárazföldi, vízi, légi); biztonságos gyalogos, biciklis és autós közlekedés.',
    round(ctx) {
      setup(ctx, 'traffic');
      const U = ctx.U;
      if (ctx.level === 1) {
        const kind = fresh(ctx, [['light', 'red'], ['light', 'green'], ['act', 'stop'], ['act', 'go']], (x) => 'tr:' + x.join());
        const zebra = U.el('div', { class: 'kz-zebra' });
        if (kind[0] === 'light') {
          const color = kind[1];
          const h = ctx.header([lightEl(U, color, true), zebra]);
          ctx.speakable(h, color === 'red' ? 'Piros a lámpa.' : 'Zöld a lámpa.');
          pick(ctx, {
            items: ['stop', 'go'], isOk: (v) => (v === 'stop') === (color === 'red'),
            render: (v) => opt(U, v === 'stop' ? '🧍' : '🚶', v === 'stop' ? 'megállok' : 'átmegyek'),
            right: () => (color === 'red' ? 'Igen! Piros: állj!' : 'Igen! Zöld: mehetsz! De azért nézz körül!'),
            wrongSay: () => (color === 'red' ? 'Piros lámpánál nem szabad átmenni!' : 'Zöld lámpánál már átmehetsz.'),
            cls: 'row pics kz-two',
            hintAfter: 1,
          });
          ctx.ask((color === 'red' ? 'Piros a lámpa.' : 'Zöld a lámpa.') + ' Mit csinálsz? Megállsz, vagy átmész?');
        } else {
          const go = kind[1] === 'go';
          headPics(ctx, [go ? '🚶' : '🧍', zebra], go ? 'Átmegyek.' : 'Megállok.');
          pick(ctx, {
            items: U.shuffle(['red', 'green']), isOk: (c) => (c === 'green') === go,
            render: (c) => lightEl(U, c, false),
            right: () => (go ? 'Igen! Zöld: mehetsz!' : 'Igen! Piros: állj!'),
            wrongSay: (c) => (c === 'red' ? 'Ez a piros lámpa. Piros: állj!' : 'Ez a zöld lámpa. Zöldnél mehetsz.'),
            cls: 'row kz-two kz-lights',
            hintAfter: 1,
          });
          ctx.ask(go ? 'Melyik lámpánál mehetsz át az úton?' : 'Melyik lámpánál kell megállnod?');
        }
        return;
      }
      if (ctx.level === 2) {
        sortTask(ctx, {
          bins: VEH_BINS,
          items: mixItems(ctx, VEH_ITEMS, 6),
          goodSay: (it) => Art(it.n) + ' ' + VEH_LOC[it.k] + ' közlekedik.',
          wrongSay: (it, bin) => Art(it.n) + ' nem ' + bin.loc + ' közlekedik.',
          doneSay: 'Minden jármű a helyén van!',
        });
        ctx.ask('Hol közlekednek a járművek? Vidd mindegyiket a helyére: a szárazföldre, a vízre vagy a levegőbe!');
        return;
      }
      const want = plan(ctx, [true, false]);
      tfTask(ctx, fresh(ctx, SAFETY.filter((s) => s.ok === want), (x) => x.t));
    },
  });

  /* =========================================================
   * 7) IDŐJÁRÁS
   * ========================================================= */
  const WEATHER = [ // g: azonos csoportból csak egy legyen a lehetőségek között
    { e: '☀️', n: 'napsütés', q: 'Melyik képen süt a nap?', ok: 'Igen! Itt süt a nap.', g: 'sun' },
    { e: '🌧️', n: 'eső', q: 'Melyik képen esik az eső?', ok: 'Igen! Itt esik az eső.', g: 'rain' },
    { e: '❄️', n: 'havazás', q: 'Melyik képen havazik?', ok: 'Igen! Itt esik a hó.', g: 'snow' },
    { e: '🌬️', n: 'szél', q: 'Melyik képen fúj a szél?', ok: 'Igen! Itt fúj a szél.', g: 'wind' },
    { e: '⛈️', n: 'vihar', q: 'Melyik képen villámlik és mennydörög?', ok: 'Igen! Itt vihar van, villámlik.', g: 'rain' },
    { e: '🌈', n: 'szivárvány', q: 'Melyik képen látsz szivárványt?', ok: 'Igen! Ez a szivárvány.', g: 'rainbow' },
  ];
  const WEAR = {
    rain: { say: 'Esik az eső.', e: ['🌧️'], ok: [['☂️', 'esernyő'], ['🥾', 'csizma']], bad: [['🕶️', 'napszemüveg'], ['👒', 'szalmakalap'], ['👙', 'fürdőruha']] },
    cold: { say: 'Nagyon hideg van, esik a hó.', e: ['❄️', '⛄'], ok: [['🧤', 'kesztyű'], ['🧣', 'sál'], ['🧥', 'kabát']], bad: [['🩳', 'rövidnadrág'], ['🕶️', 'napszemüveg'], ['👒', 'szalmakalap']] },
    hot: { say: 'Nagy a meleg, hétágra süt a nap.', e: ['☀️', '🏖️'], ok: [['🩳', 'rövidnadrág'], ['🕶️', 'napszemüveg'], ['👒', 'szalmakalap']], bad: [['🧤', 'kesztyű'], ['🧣', 'sál'], ['🧥', 'kabát']] },
  };
  const CYCLE = [
    { h: ['🌊', '☀️'], q: 'Süt a nap, és melegíti a tó vizét. A víz egy része pára lesz, és felszáll az égre. Mi lesz belőle?',
      opts: [['☁️', 'felhő', true], ['⭐', 'csillag'], ['🌙', 'Hold']], ok: 'Igen! A párából felhő lesz.' },
    { h: ['☁️', '💧'], q: 'A felhőben sok-sok apró vízcsepp gyűlik össze. Mi esik majd a felhőből?',
      opts: [['🌧️', 'eső', true], ['🍂', 'falevél'], ['⭐', 'csillag']], ok: 'Igen! A felhőből eső esik.' },
    { h: ['🌧️', '⛰️'], q: 'Esik az eső. Hova folyik az esővíz?',
      opts: [['🌊', 'patak, folyó, tó', true], ['☀️', 'Nap'], ['🌙', 'Hold']], ok: 'Igen! Az esővíz a patakokba, folyókba és tavakba folyik. Aztán minden kezdődik elölről!' },
    { h: ['☁️', '🥶'], q: 'Télen nagyon hideg van. Mi esik ilyenkor a felhőből eső helyett?',
      opts: [['❄️', 'hó', true], ['🌸', 'virág'], ['🍂', 'falevél']], ok: 'Igen! Hidegben hó esik.' },
  ];

  function thermoEl(U, hot) {
    return U.el('div', { class: 'kz-thermo' + (hot ? ' hot' : ' cold') }, [
      U.el('span', { class: 'kz-th-ico top', text: '☀️' }),
      U.el('div', { class: 'kz-tube' }, [U.el('div', { class: 'kz-fill' })]),
      U.el('div', { class: 'kz-bulb' }),
      U.el('span', { class: 'kz-th-ico bot', text: '❄️' }),
    ]);
  }

  Bubu.registerGame({
    id: 'kornyezet-weather', world: 'kornyezet', name: 'Időjárás!', icon: '🌦️',
    intro: 'Nézzük meg, milyen az idő!',
    levels: ['Milyen az idő?', 'Mit vegyek fel?', 'Hőmérő, a víz útja'],
    rounds: 5,
    topic: 'Időjárási jelenségek (napsütés, eső, hó, szél, vihar); öltözködés az időjárásnak megfelelően; meleg és hideg a hőmérőn; a víz körforgása egyszerűen.',
    round(ctx) {
      setup(ctx, 'weather');
      const U = ctx.U;
      const mk = (arr, ok) => arr.map(([e, n]) => ({ e, n, ok }));
      if (ctx.level === 1) {
        const w = fresh(ctx, WEATHER, (x) => x.e);
        const opts = [w];
        U.shuffle(WEATHER).forEach((x) => { if (opts.length < 3 && !opts.some((y) => y.g === x.g)) opts.push(x); });
        headPics(ctx, ['🧒', '👀'], 'Milyen az idő?');
        pick(ctx, {
          items: U.shuffle(opts), isOk: (x) => x === w,
          render: (x) => opt(U, x.e, x.n),
          right: () => w.ok,
          wrongSay: (x) => 'Ez ' + art(x.n) + '.',
          cls: 'row pics kz-wx',
        });
        ctx.ask(w.q);
        return;
      }
      if (ctx.level === 2) {
        const key = fresh(ctx, Object.keys(WEAR), (x) => 'wear:' + x);
        const set = WEAR[key];
        const good = fresh(ctx, mk(set.ok, true), (x) => 'wok:' + x.e);
        const items = U.shuffle([good].concat(U.sample(mk(set.bad, false), 2)));
        headPics(ctx, set.e, set.say);
        pick(ctx, {
          items, isOk: (x) => x.ok,
          render: (x) => opt(U, x.e, x.n),
          right: (x) => 'Igen! ' + Art(x.n) + ' most jól jön.',
          wrongSay: (x) => Art(x.n) + ' most nem jó.',
          cls: 'row pics',
        });
        ctx.ask(set.say + ' Mire lesz szükséged?');
        return;
      }
      const kind = plan(ctx, ['thermo', 'multi', 'cycle']);
      if (kind === 'thermo') {
        const hot = fresh(ctx, [true, false], (x) => 'th:' + x);
        if (U.rand(0, 1) === 0) {
          const h = ctx.header([U.el('span', { class: 'pic', text: '🌡️' }), thermoEl(U, hot)]);
          ctx.speakable(h, 'A hőmérő.');
          pick(ctx, {
            items: ['hot', 'cold'], isOk: (v) => (v === 'hot') === hot,
            render: (v) => opt(U, v === 'hot' ? '🥵' : '🥶', v === 'hot' ? 'meleg' : 'hideg'),
            right: () => (hot ? 'Igen! A hőmérő magasra kúszott, meleg van.' : 'Igen! A hőmérő lent áll, hideg van.'),
            wrongSay: () => '',
            cls: 'row pics kz-two',
            hintAfter: 1,
          });
          ctx.ask('Nézd meg a hőmérőt! Meleg van vagy hideg?');
        } else {
          headPics(ctx, ['🌡️', hot ? '🥵' : '🥶'], hot ? 'Meleg.' : 'Hideg.');
          pick(ctx, {
            items: U.shuffle([true, false]), isOk: (v) => v === hot,
            render: (v) => thermoEl(U, v),
            right: () => (hot ? 'Igen! Ez a hőmérő meleget mutat.' : 'Igen! Ez a hőmérő hideget mutat.'),
            wrongSay: () => '',
            cls: 'row kz-two kz-thermos',
            hintAfter: 1,
          });
          ctx.ask(hot ? 'Melyik hőmérő mutat meleget?' : 'Melyik hőmérő mutat hideget?');
        }
      } else if (kind === 'multi') {
        const key = fresh(ctx, Object.keys(WEAR), (x) => 'multi:' + x);
        const set = WEAR[key];
        const items = U.shuffle(mk(set.ok, true).concat(mk(set.bad, false)));
        headPics(ctx, set.e, set.say);
        const need = set.ok.length;
        multiTask(ctx, {
          items, need,
          badSay: (it) => Art(it.n) + ' most nem jó.',
          doneSay: 'Megtaláltad mindet!',
        });
        ctx.ask(set.say + ' Mire lesz szükséged? Keresd meg ' + (need === 2 ? 'mind a kettőt!' : 'mind a hármat!'));
      } else {
        const c = fresh(ctx, CYCLE, (x) => x.q);
        headPics(ctx, c.h);
        const items = U.shuffle(c.opts.map(([e, n, ok]) => ({ e, n, ok: !!ok })));
        pick(ctx, {
          items, isOk: (x) => x.ok,
          render: (x) => opt(U, x.e, x.n),
          right: () => c.ok,
          wrongSay: (x) => 'Ez ' + art(x.n) + '.',
          cls: 'row pics',
        });
        ctx.ask(c.q);
      }
    },
  });
})();
