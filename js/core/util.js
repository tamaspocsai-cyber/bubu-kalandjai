/* Bubu kalandjai – segédfüggvények (U) */
(function () {
  'use strict';

  const U = {};

  /* ---------- véletlen ---------- */
  U.rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min; // [min..max] egész
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.sample = (arr, n) => U.shuffle(arr).slice(0, n);
  U.range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  /** n darab különböző elem: a "correct" + (n-1) másik a pool-ból (eqFn szerint különböző) */
  U.options = (correct, pool, n, eqFn) => {
    const eq = eqFn || ((x, y) => x === y);
    const others = U.shuffle(pool.filter((p) => !eq(p, correct))).slice(0, n - 1);
    return U.shuffle([correct, ...others]);
  };
  /** n darab különböző szám a correct körül [min..max] tartományban */
  U.numOptions = (correct, n, min, max) => {
    const set = new Set([correct]);
    let guard = 0;
    while (set.size < n && guard++ < 500) {
      const spread = Math.max(2, Math.ceil(n * 1.5));
      const v = correct + U.rand(-spread, spread);
      if (v >= min && v <= max) set.add(v);
    }
    for (let v = min; set.size < n && v <= max; v++) set.add(v);
    return U.shuffle([...set]);
  };

  /* ---------- DOM ---------- */
  /** U.el('div', {class:'x', onclick: fn, style:{...}, html:'..', text:'..'}, [children]) */
  U.el = (tag, attrs, children) => {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.assign(e.dataset, v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null || c === false) return;
        e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      });
    }
    return e;
  };
  U.clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); return node; };
  U.wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /** CSS animáció egyszeri lejátszása egy elemen (class hozzáadás/eltávolítás) */
  U.anim = (el, cls, ms) => {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms || 700);
  };

  /* ---------- magyar számnevek (a felolvasáshoz) ---------- */
  const ONES = ['nulla', 'egy', 'kettő', 'három', 'négy', 'öt', 'hat', 'hét', 'nyolc', 'kilenc'];
  const TENS = ['', 'tíz', 'húsz', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];
  const TENS_PREFIX = ['', 'tizen', 'huszon', 'harminc', 'negyven', 'ötven', 'hatvan', 'hetven', 'nyolcvan', 'kilencven'];
  /** 0–100 közötti szám kiírva: 7 → "hét", 12 → "tizenkettő", 100 → "száz" */
  U.numWord = (n) => {
    if (n === 100) return 'száz';
    if (n < 10) return ONES[n];
    const t = Math.floor(n / 10), o = n % 10;
    if (o === 0) return TENS[t];
    return TENS_PREFIX[t] + ONES[o];
  };
  /** toldalékoláshoz: 2 → "két" (pl. "két alma") */
  U.numAdj = (n) => (n === 2 ? 'két' : (n % 10 === 2 && n > 10 && n < 100 ? U.numWord(n).replace(/kettő$/, 'két') : U.numWord(n)));

  /* ---------- emoji-képek ---------- */
  /** nagy emoji kép elem */
  U.pic = (emoji, size) => U.el('span', { class: 'pic', style: size ? { fontSize: size } : null, text: emoji });

  /* ---------- húzd-és-ejtsd (+ koppintásos alternatíva) ----------
   * U.draggable(el, { targets: () => [elemek], onDrop(targetEl) -> bool (true = elfogadva), onTap })
   * Érintőképernyőn és egérrel is működik. Ha nincs mozgás, koppintásnak számít:
   * ilyenkor kijelöljük az elemet, és a következő célpontra koppintás "ejti" oda.
   */
  let selected = null;
  U.draggable = (el, opts) => {
    el.classList.add('draggable');
    let start = null, ghost = null, moved = false;
    const getTargets = () => (typeof opts.targets === 'function' ? opts.targets() : opts.targets) || [];

    const hit = (x, y) => getTargets().find((t) => {
      const r = t.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });

    el.addEventListener('pointerdown', (ev) => {
      if (el.classList.contains('done')) return;
      ev.preventDefault();
      start = { x: ev.clientX, y: ev.clientY };
      moved = false;
      el.setPointerCapture && el.setPointerCapture(ev.pointerId);
    });
    el.addEventListener('pointermove', (ev) => {
      if (!start) return;
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) > 10) {
        moved = true;
        const r = el.getBoundingClientRect();
        ghost = el.cloneNode(true);
        ghost.classList.add('drag-ghost');
        Object.assign(ghost.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
        ghost._ox = start.x - r.left; ghost._oy = start.y - r.top;
        document.body.appendChild(ghost);
        el.classList.add('dragging');
        if (window.Bubu && Bubu.sfx) Bubu.sfx('pop');
      }
      if (moved && ghost) {
        ghost.style.left = ev.clientX - ghost._ox + 'px';
        ghost.style.top = ev.clientY - ghost._oy + 'px';
        getTargets().forEach((t) => t.classList.toggle('drop-hover', t === hit(ev.clientX, ev.clientY)));
      }
    });
    const end = (ev) => {
      if (!start) return;
      start = null;
      getTargets().forEach((t) => t.classList.remove('drop-hover'));
      if (ghost) { ghost.remove(); ghost = null; }
      el.classList.remove('dragging');
      if (moved) {
        const t = ev.type === 'pointerup' ? hit(ev.clientX, ev.clientY) : null;
        if (t) opts.onDrop(t);
      } else {
        // koppintás: kijelölés
        if (selected && selected !== el) selected.classList.remove('selected');
        const was = selected === el;
        selected = was ? null : el;
        el.classList.toggle('selected', !was);
        if (opts.onTap) opts.onTap(!was);
        if (window.Bubu && Bubu.sfx) Bubu.sfx('tap');
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el._dragOpts = opts;
  };
  /** célpont, amire a kijelölt (koppintott) elem "ejthető" */
  U.dropTarget = (target) => {
    target.classList.add('drop-target');
    target.addEventListener('click', () => {
      if (!selected || !selected._dragOpts) return;
      const s = selected;
      const ok = s._dragOpts.targets && (typeof s._dragOpts.targets === 'function' ? s._dragOpts.targets() : s._dragOpts.targets).includes(target);
      if (!ok) return;
      s.classList.remove('selected');
      selected = null;
      s._dragOpts.onDrop(target);
    });
  };
  U.clearSelection = () => { if (selected) selected.classList.remove('selected'); selected = null; };

  window.U = U;
})();
