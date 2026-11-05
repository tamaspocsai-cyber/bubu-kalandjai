/* Bubu kalandjai – MAGYAR NYELV világ (Betűerdő)
 * Hangoztató-elemző út az olvasásig: hangok → betűk → szótagok → szavak → mondatok.
 * Játékok: magyar-first (Kezdőhang), magyar-hunt (Betűvadász), magyar-clap (Tapsolj!),
 *          magyar-build (Szóépítő), magyar-read (Olvasó), magyar-place (Hol a hang?)
 */
(function () {
  'use strict';

  /* =========================================================
   * BETŰK
   * ========================================================= */
  // A betűkészlet szintenként bővül
  const SET1 = ['a', 'á', 'e', 'é', 'i', 'í', 'o', 'ó', 'u', 'ú', 'm', 'l', 't', 's'];
  const SET2 = ['ö', 'ő', 'ü', 'ű', 'n', 'r', 'k', 'v', 'p', 'b', 'd', 'g', 'z', 'h', 'j', 'f', 'c'];
  const SET3 = ['sz', 'cs', 'ny', 'gy', 'zs', 'ty', 'ly'];
  const ALL = SET1.concat(SET2, SET3);
  const VOWELS = ['a', 'á', 'e', 'é', 'i', 'í', 'o', 'ó', 'ö', 'ő', 'u', 'ú', 'ü', 'ű'];

  /**
   * Betűhang kimondása a gépi hangnak: magánhangzónál maga a hang,
   * mássalhangzónál a betűnév (a gépi hang az egyedülálló mássalhangzót nem mondja jól) + példaszó.
   */
  const LETTER_SAY = {
    a: 'a, mint alma', á: 'á, mint ásó', e: 'e, mint egér', é: 'é, mint ébresztő',
    i: 'i, mint iskola', í: 'í, mint íj', o: 'o, mint olló', ó: 'ó, mint óra',
    ö: 'ö, mint ölelés', ő: 'ő, mint őz', u: 'u, mint uborka', ú: 'ú, mint út',
    ü: 'ü, mint üveg', ű: 'ű, mint űrhajó',
    m: 'mmm, mint majom', l: 'el, mint labda', t: 'té, mint tök', s: 'es, mint sapka',
    n: 'en, mint nap', r: 'er, mint róka', k: 'ká, mint kacsa', v: 'vé, mint vonat',
    p: 'pé, mint pók', b: 'bé, mint béka', d: 'dé, mint dob', g: 'gé, mint gomba',
    z: 'zé, mint zebra', h: 'há, mint hal', j: 'jé, mint jég', f: 'ef, mint fa', c: 'cé, mint cica',
    sz: 'esz, mint szív', cs: 'csé, mint csiga', ny: 'eny, mint nyúl', gy: 'gyé, mint gyertya',
    zs: 'zsé, mint zsiráf', ty: 'tyé, mint tyúk', ly: 'el-ipszilon, mint lyuk',
    dz: 'dzé, mint bodza', dzs: 'dzsé, mint dzsungel',
  };
  /** rövid betűnév mondatba illesztéshez („Ez a nagy em betű.”) */
  const LETTER_NAME = {
    a: 'a', á: 'á', e: 'e', é: 'é', i: 'i', í: 'í', o: 'o', ó: 'ó', ö: 'ö', ő: 'ő', u: 'u', ú: 'ú', ü: 'ü', ű: 'ű',
    m: 'em', l: 'el', t: 'té', s: 'es', n: 'en', r: 'er', k: 'ká', v: 'vé', p: 'pé', b: 'bé', d: 'dé',
    g: 'gé', z: 'zé', h: 'há', j: 'jé', f: 'ef', c: 'cé',
    sz: 'esz', cs: 'csé', ny: 'eny', gy: 'gyé', zs: 'zsé', ty: 'tyé', ly: 'el-ipszilon', dz: 'dzé', dzs: 'dzsé',
  };
  /** hasonló alakú / hangzású betűk (zavaró lehetőségek) */
  const CONFUSE = {
    a: ['á', 'o', 'e'], á: ['a', 'é', 'ó'], e: ['é', 'a'], é: ['e', 'á', 'í'], i: ['í', 'j', 'l'], í: ['i', 'é'],
    o: ['ó', 'ö', 'a'], ó: ['o', 'ő', 'á'], ö: ['ő', 'o', 'ü'], ő: ['ö', 'ó', 'ű'], u: ['ú', 'ü', 'n'],
    ú: ['u', 'ű', 'ó'], ü: ['ű', 'u', 'ö'], ű: ['ü', 'ú', 'ő'],
    m: ['n', 'h'], n: ['m', 'h', 'u'], l: ['t', 'i'], t: ['l', 'f'], s: ['sz', 'zs', 'z'],
    b: ['d', 'p', 'h'], d: ['b', 'p'], p: ['b', 'd'], g: ['gy', 'j'], k: ['h', 'g'], h: ['k', 'n', 'b'],
    j: ['i', 'g'], f: ['t', 'v'], v: ['f'], z: ['zs', 'sz', 's'], r: ['n'], c: ['cs', 'sz'],
    sz: ['s', 'z', 'c'], cs: ['c', 'zs', 's'], zs: ['z', 's', 'sz'], ny: ['n', 'gy'], gy: ['g', 'ny', 'ty'],
    ty: ['t', 'gy'], ly: ['l', 'j', 'gy'],
  };
  /** nagy- és kisbetű alakja jól eltér (nagy → kis párosításhoz) */
  const CASE_PAIRS = ['a', 'á', 'e', 'é', 'i', 'í', 'm', 'n', 'r', 't', 'l', 'h', 'b', 'd', 'g', 'j', 'f', 'k', 'ny', 'gy', 'ty', 'ly'];

  /** nagybetű (kétjegyűnél csak az első: Sz, Cs) */
  const up = (l) => l.charAt(0).toUpperCase() + l.slice(1);
  const cap = up;
  /** névelő: a / az (magánhangzóval kezdődő szó előtt az) */
  const art = (w) => (VOWELS.includes(w.charAt(0).toLowerCase()) ? 'az' : 'a');

  /* =========================================================
   * SZÓBANK – szó, emoji, szótagok ('-'), betűk (' ', a kétjegyű egy betű), [csoport]
   * A csoport ugyanarra a fogalomra utal (pl. madár ↔ sas): egy csoportból egy feladatban csak egy kép lehet.
   * ========================================================= */
  const WORDS_RAW = [
    // gyümölcs, zöldség, étel
    ['alma', '🍎', 'al-ma', 'a l m a'],
    ['körte', '🍐', 'kör-te', 'k ö r t e'],
    ['szőlő', '🍇', 'sző-lő', 'sz ő l ő'],
    ['banán', '🍌', 'ba-nán', 'b a n á n'],
    ['citrom', '🍋', 'cit-rom', 'c i t r o m'],
    ['eper', '🍓', 'e-per', 'e p e r'],
    ['cseresznye', '🍒', 'cse-resz-nye', 'cs e r e sz ny e'],
    ['ananász', '🍍', 'a-na-nász', 'a n a n á sz'],
    ['répa', '🥕', 'ré-pa', 'r é p a'],
    ['uborka', '🥒', 'u-bor-ka', 'u b o r k a'],
    ['paradicsom', '🍅', 'pa-ra-di-csom', 'p a r a d i cs o m'],
    ['kukorica', '🌽', 'ku-ko-ri-ca', 'k u k o r i c a'],
    ['krumpli', '🥔', 'krump-li', 'k r u m p l i'],
    ['gomba', '🍄', 'gom-ba', 'g o m b a'],
    ['mogyoró', '🥜', 'mo-gyo-ró', 'm o gy o r ó'],
    ['avokádó', '🥑', 'a-vo-ká-dó', 'a v o k á d ó'],
    ['tök', '🎃', 'tök', 't ö k'],
    ['sajt', '🧀', 'sajt', 's a j t'],
    ['tojás', '🥚', 'to-jás', 't o j á s'],
    ['kenyér', '🍞', 'ke-nyér', 'k e ny é r'],
    ['tej', '🥛', 'tej', 't e j'],
    ['méz', '🍯', 'méz', 'm é z'],
    ['torta', '🎂', 'tor-ta', 't o r t a'],
    ['fagyi', '🍦', 'fa-gyi', 'f a gy i'],
    ['pizza', '🍕', 'piz-za', 'p i z z a'],
    ['csokoládé', '🍫', 'cso-ko-lá-dé', 'cs o k o l á d é'],
    ['só', '🧂', 'só', 's ó'],
    // állatok
    ['hal', '🐟', 'hal', 'h a l', 'sea'],
    ['ló', '🐴', 'ló', 'l ó'],
    ['kacsa', '🦆', 'ka-csa', 'k a cs a', 'bird'],
    ['csiga', '🐌', 'csi-ga', 'cs i g a'],
    ['méh', '🐝', 'méh', 'm é h'],
    ['bagoly', '🦉', 'ba-goly', 'b a g o ly', 'bird'],
    ['egér', '🐭', 'e-gér', 'e g é r'],
    ['cica', '🐱', 'ci-ca', 'c i c a'],
    ['kutya', '🐶', 'ku-tya', 'k u ty a'],
    ['madár', '🐦', 'ma-dár', 'm a d á r', 'bird'],
    ['kígyó', '🐍', 'kí-gyó', 'k í gy ó'],
    ['majom', '🐒', 'ma-jom', 'm a j o m', 'ape'],
    ['gorilla', '🦍', 'go-ril-la', 'g o r i l l a', 'ape'],
    ['róka', '🦊', 'ró-ka', 'r ó k a'],
    ['medve', '🐻', 'med-ve', 'm e d v e'],
    ['zebra', '🦓', 'zeb-ra', 'z e b r a'],
    ['tigris', '🐯', 'tig-ris', 't i g r i s'],
    ['panda', '🐼', 'pan-da', 'p a n d a'],
    ['koala', '🐨', 'ko-a-la', 'k o a l a'],
    ['zsiráf', '🦒', 'zsi-ráf', 'zs i r á f'],
    ['pingvin', '🐧', 'ping-vin', 'p i n g v i n', 'bird'],
    ['teknős', '🐢', 'tek-nős', 't e k n ő s'],
    ['polip', '🐙', 'po-lip', 'p o l i p'],
    ['delfin', '🐬', 'del-fin', 'd e l f i n', 'sea'],
    ['bálna', '🐳', 'bál-na', 'b á l n a', 'sea'],
    ['cápa', '🦈', 'cá-pa', 'c á p a', 'sea'],
    ['béka', '🐸', 'bé-ka', 'b é k a'],
    ['katica', '🐞', 'ka-ti-ca', 'k a t i c a'],
    ['pillangó', '🦋', 'pil-lan-gó', 'p i l l a n g ó'],
    ['hangya', '🐜', 'han-gya', 'h a n gy a'],
    ['hernyó', '🐛', 'her-nyó', 'h e r ny ó'],
    ['pók', '🕷️', 'pók', 'p ó k'],
    ['sün', '🦔', 'sün', 's ü n'],
    ['mókus', '🐿️', 'mó-kus', 'm ó k u s'],
    ['farkas', '🐺', 'far-kas', 'f a r k a s'],
    ['nyúl', '🐇', 'nyúl', 'ny ú l'],
    ['tyúk', '🐔', 'tyúk', 'ty ú k', 'bird'],
    ['kakas', '🐓', 'ka-kas', 'k a k a s', 'bird'],
    ['malac', '🐷', 'ma-lac', 'm a l a c'],
    ['tehén', '🐄', 'te-hén', 't e h é n'],
    ['bárány', '🐑', 'bá-rány', 'b á r á ny'],
    ['kecske', '🐐', 'kecs-ke', 'k e cs k e'],
    ['teve', '🐫', 'te-ve', 't e v e'],
    ['elefánt', '🐘', 'e-le-fánt', 'e l e f á n t'],
    ['oroszlán', '🦁', 'o-rosz-lán', 'o r o sz l á n'],
    ['krokodil', '🐊', 'kro-ko-dil', 'k r o k o d i l'],
    ['kenguru', '🦘', 'ken-gu-ru', 'k e n g u r u'],
    ['papagáj', '🦜', 'pa-pa-gáj', 'p a p a g á j', 'bird'],
    ['rák', '🦀', 'rák', 'r á k'],
    ['sas', '🦅', 'sas', 's a s', 'bird'],
    ['gyík', '🦎', 'gyík', 'gy í k'],
    ['flamingó', '🦩', 'fla-min-gó', 'f l a m i n g ó', 'bird'],
    // természet
    ['nap', '☀️', 'nap', 'n a p'],
    ['hold', '🌙', 'hold', 'h o l d'],
    ['csillag', '⭐', 'csil-lag', 'cs i l l a g'],
    ['hó', '❄️', 'hó', 'h ó', 'winter'],
    ['jég', '🧊', 'jég', 'j é g', 'winter'],
    ['hóember', '⛄', 'hó-em-ber', 'h ó e m b e r', 'winter'],
    ['fa', '🌳', 'fa', 'f a', 'tree'],
    ['karácsonyfa', '🎄', 'ka-rá-csony-fa', 'k a r á cs o ny f a', 'tree'],
    ['virág', '🌸', 'vi-rág', 'v i r á g', 'flower'],
    ['rózsa', '🌹', 'ró-zsa', 'r ó zs a', 'flower'],
    ['tulipán', '🌷', 'tu-li-pán', 't u l i p á n', 'flower'],
    ['napraforgó', '🌻', 'nap-ra-for-gó', 'n a p r a f o r g ó', 'flower'],
    ['kaktusz', '🌵', 'kak-tusz', 'k a k t u sz'],
    ['szivárvány', '🌈', 'szi-vár-vány', 'sz i v á r v á ny'],
    ['tűz', '🔥', 'tűz', 't ű z'],
    ['víz', '💧', 'víz', 'v í z'],
    // járművek, tárgyak, épületek
    ['ház', '🏠', 'ház', 'h á z'],
    ['vár', '🏰', 'vár', 'v á r'],
    ['iskola', '🏫', 'is-ko-la', 'i s k o l a'],
    ['autó', '🚗', 'a-u-tó', 'a u t ó', 'car'],
    ['mentőautó', '🚑', 'men-tő-a-u-tó', 'm e n t ő a u t ó', 'car'],
    ['busz', '🚌', 'busz', 'b u sz', 'car'],
    ['traktor', '🚜', 'trak-tor', 't r a k t o r', 'car'],
    ['vonat', '🚂', 'vo-nat', 'v o n a t'],
    ['hajó', '🚢', 'ha-jó', 'h a j ó'],
    ['repülő', '✈️', 're-pü-lő', 'r e p ü l ő'],
    ['rakéta', '🚀', 'ra-ké-ta', 'r a k é t a'],
    ['helikopter', '🚁', 'he-li-kop-ter', 'h e l i k o p t e r'],
    ['bicikli', '🚲', 'bi-cik-li', 'b i c i k l i'],
    ['szánkó', '🛷', 'szán-kó', 'sz á n k ó'],
    ['lufi', '🎈', 'lu-fi', 'l u f i'],
    ['labda', '⚽', 'lab-da', 'l a b d a'],
    ['dob', '🥁', 'dob', 'd o b'],
    ['gitár', '🎸', 'gi-tár', 'g i t á r'],
    ['trombita', '🎺', 'trom-bi-ta', 't r o m b i t a'],
    ['zongora', '🎹', 'zon-go-ra', 'z o n g o r a'],
    ['hegedű', '🎻', 'he-ge-dű', 'h e g e d ű'],
    ['csengő', '🔔', 'csen-gő', 'cs e n g ő'],
    ['kulcs', '🔑', 'kulcs', 'k u l cs'],
    ['olló', '✂️', 'ol-ló', 'o l l ó'],
    ['ceruza', '✏️', 'ce-ru-za', 'c e r u z a'],
    ['könyv', '📖', 'könyv', 'k ö ny v'],
    ['óra', '⏰', 'ó-ra', 'ó r a'],
    ['ajtó', '🚪', 'aj-tó', 'a j t ó'],
    ['ágy', '🛏️', 'ágy', 'á gy'],
    ['kés', '🔪', 'kés', 'k é s'],
    ['tű', '🪡', 'tű', 't ű'],
    ['kalapács', '🔨', 'ka-la-pács', 'k a l a p á cs'],
    ['ajándék', '🎁', 'a-ján-dék', 'a j á n d é k'],
    ['korona', '👑', 'ko-ro-na', 'k o r o n a', 'hat'],
    ['kalap', '🎩', 'ka-lap', 'k a l a p', 'hat'],
    ['sapka', '🧢', 'sap-ka', 's a p k a', 'hat'],
    ['sál', '🧣', 'sál', 's á l'],
    ['robot', '🤖', 'ro-bot', 'r o b o t'],
    ['szellem', '👻', 'szel-lem', 'sz e l l e m'],
    ['gyertya', '🕯️', 'gyer-tya', 'gy e r ty a'],
    ['telefon', '📱', 'te-le-fon', 't e l e f o n', 'device'],
    ['számítógép', '💻', 'szá-mí-tó-gép', 'sz á m í t ó g é p', 'device'],
    // testrészek
    ['kéz', '✋', 'kéz', 'k é z'],
    ['láb', '🦶', 'láb', 'l á b'],
    ['orr', '👃', 'orr', 'o r r'],
    ['száj', '👄', 'száj', 'sz á j'],
    ['szem', '👁️', 'szem', 'sz e m'],
    ['szív', '❤️', 'szív', 'sz í v'],
    ['fog', '🦷', 'fog', 'f o g'],
  ];
  const WORDS = WORDS_RAW.map(([w, e, syl, lets, grp]) => {
    const l = lets.split(' ');
    return { w, e, syl: syl.split('-'), let: l, grp: grp || null, n: l.length, di: l.some((x) => x.length > 1) };
  });
  const byWord = (w) => WORDS.find((x) => x.w === w);

  /** Rövid mondatok az olvasáshoz: [mondat, szótagolva ('-'), a képet adó szó] */
  const SENTENCES_RAW = [
    ['A ló fut.', 'A ló fut', 'ló'],
    ['Ez egy alma.', 'Ez egy al-ma', 'alma'],
    ['A hal úszik.', 'A hal ú-szik', 'hal'],
    ['A nap süt.', 'A nap süt', 'nap'],
    ['A kutya ugat.', 'A ku-tya u-gat', 'kutya'],
    ['A cica alszik.', 'A ci-ca al-szik', 'cica'],
    ['A madár repül.', 'A ma-dár re-pül', 'madár'],
    ['A béka ugrik.', 'A bé-ka ug-rik', 'béka'],
    ['A méh zümmög.', 'A méh züm-mög', 'méh'],
    ['Ez egy autó.', 'Ez egy a-u-tó', 'autó'],
    ['A hold világít.', 'A hold vi-lá-gít', 'hold'],
    ['A csiga lassú.', 'A csi-ga las-sú', 'csiga'],
    ['Ez egy ház.', 'Ez egy ház', 'ház'],
    ['A kacsa hápog.', 'A ka-csa há-pog', 'kacsa'],
    ['A tehén bőg.', 'A te-hén bőg', 'tehén'],
    ['A lufi piros.', 'A lu-fi pi-ros', 'lufi'],
    ['A banán sárga.', 'A ba-nán sár-ga', 'banán'],
    ['A tűz meleg.', 'A tűz me-leg', 'tűz'],
    ['A hó hideg.', 'A hó hi-deg', 'hó'],
    ['A majom mászik.', 'A ma-jom má-szik', 'majom'],
    ['A vonat megy.', 'A vo-nat megy', 'vonat'],
    ['Ez egy dob.', 'Ez egy dob', 'dob'],
    ['A róka fut.', 'A ró-ka fut', 'róka'],
    ['A sün szúr.', 'A sün szúr', 'sün'],
  ];
  const SENTENCES = SENTENCES_RAW.map(([t, s, w]) => ({ t, syl: s, x: byWord(w) }));

  /** szótagolt kimondás: „al, ma” (a vessző rövid szünetet ad) */
  const sylSay = (x) => x.syl.join(', ');
  const sentSay = (s) => s.syl.split(' ').map((t) => t.split('-').join(', ')).join(', ');

  /* =========================================================
   * közös segédek
   * ========================================================= */
  /** ismétlés nélküli választás egy játékon belül (a ctx a játék végéig él) */
  function pickFresh(ctx, key, pool) {
    const U = ctx.U;
    const store = ctx._mgUsed || (ctx._mgUsed = {});
    const used = store[key] || (store[key] = new Set());
    const id = (x) => (typeof x === 'string' ? x : x.w || x.t);
    let cand = pool.filter((x) => !used.has(id(x)));
    if (!cand.length) { used.clear(); cand = pool.slice(); }
    const x = U.pick(cand);
    used.add(id(x));
    return x;
  }

  /** betű-lehetőségek: helyes + (max maxConf) hasonló + véletlen a készletből */
  function letterOptions(U, correct, pool, n, maxConf) {
    const out = [correct];
    U.shuffle((CONFUSE[correct] || []).filter((l) => pool.includes(l))).slice(0, maxConf)
      .forEach((l) => { if (out.length < n && !out.includes(l)) out.push(l); });
    const rest = U.shuffle(pool.filter((l) => !out.includes(l)));
    while (out.length < n && rest.length) out.push(rest.pop());
    return U.shuffle(out);
  }

  /** kép-lehetőségek: helyes + n-1 más (eltérő csoport, eltérő emoji); sameFirst: hány kezdjen ugyanazzal a betűvel */
  function picOptions(U, correct, pool, n, opts) {
    opts = opts || {};
    const clash = (a, b) => a.w === b.w || a.e === b.e || (a.grp && a.grp === b.grp);
    const chosen = [correct];
    const ok = (y) => !chosen.some((c) => clash(c, y));
    const cand = U.shuffle(pool);
    if (opts.sameFirst) {
      cand.filter((y) => y.let[0] === correct.let[0]).forEach((y) => {
        if (chosen.length - 1 < opts.sameFirst && ok(y)) chosen.push(y);
      });
    }
    cand.forEach((y) => {
      if (chosen.length >= n || !ok(y)) return;
      if (opts.diffFirst && chosen.some((c) => c.let[0] === y.let[0])) return;
      chosen.push(y);
    });
    // végső tartalék (ha a szigorú szűrés túl kevés elemet hagyott)
    cand.forEach((y) => { if (chosen.length < n && ok(y)) chosen.push(y); });
    return U.shuffle(chosen);
  }

  /** nagy, koppintható kép a feladatfejben */
  function picBtn(ctx, x, slow) {
    const U = ctx.U;
    const b = U.el('button', { class: 'mg-pic', 'aria-label': x.w, text: x.e });
    b.addEventListener('click', () => {
      ctx.sfx('tap');
      U.anim(b, 'wiggle', 800);
      ctx.say(x.w, slow ? { rate: 0.7 } : undefined);
    });
    return b;
  }

  /** ugyanaz a stílus-osztály minden körben (a motor körönként visszaállítja a stage osztályát) */
  const mark = (ctx, cls) => ctx.stage.classList.add('g-magyar', cls);

  const FRIENDS = ['🦊', '🦔', '🐿️', '🦉', '🐻', '🐰', '🦌'];

  /* =========================================================
   * 1. KEZDŐHANG
   * ========================================================= */
  Bubu.registerGame({
    id: 'magyar-first',
    world: 'magyar',
    name: 'Kezdőhang!',
    icon: '🍎',
    intro: 'Bubu szavakat mond az erdőben. Figyeld, milyen hanggal kezdődnek!',
    levels: ['a á e é i í o ó u ú m l t s · 2 betűből', '+ ö ő ü ű n r k v p b d g z h j f c · 3 betűből', '+ sz cs ny gy zs ty ly, nagybetűk · 4 betűből'],
    rounds: 5,
    topic: 'Hangfelismerés: a szó első hangjának meghallása és a betű kiválasztása (hangoztató-elemző módszer)',
    round(ctx) {
      const U = ctx.U, L = ctx.level;
      mark(ctx, 'g-magyar-first');
      let pool, letters;
      if (L === 1) { pool = WORDS.filter((x) => SET1.includes(x.let[0])); letters = SET1; }
      else if (L === 2) {
        const fresh = WORDS.filter((x) => SET2.includes(x.let[0]));
        pool = Math.random() < 0.75 ? fresh : WORDS.filter((x) => SET1.includes(x.let[0]));
        letters = SET1.concat(SET2);
      } else {
        const fresh = WORDS.filter((x) => SET3.includes(x.let[0]));
        pool = Math.random() < 0.6 ? fresh : WORDS;
        letters = ALL;
      }
      const x = pickFresh(ctx, 'w', pool);
      const first = x.let[0];
      const n = [2, 3, 4][L - 1];
      const maxConf = L === 1 ? (Math.random() < 0.5 ? 1 : 0) : 2;
      const items = letterOptions(U, first, letters, n, maxConf);
      const upper = L === 3 && Math.random() < 0.5;

      ctx.header([picBtn(ctx, x), U.el('span', { class: 'mg-q', text: '❓' })]);
      ctx.choose({
        items, correct: first, cls: 'letters row',
        render: (l) => (upper ? up(l) : l),
        sayOnTap: (l) => LETTER_SAY[l] + '.',
      });
      ctx.ask('Mivel kezdődik ez a szó: ' + x.w + '?');
    },
  });

  /* =========================================================
   * 2. BETŰVADÁSZ
   * ========================================================= */
  Bubu.registerGame({
    id: 'magyar-hunt',
    world: 'magyar',
    name: 'Betűvadász!',
    icon: '🔎',
    intro: 'Betűvadászat az erdőben! Bubu mond egy betűt, te keresd meg!',
    levels: ['a á e é i í o ó u ú m l t s · 3 betűből', '+ ö ő ü ű n r k v p b d g z h j f c · 4 betűből', 'Nagybetű és kisbetű párja (A → a), kétjegyűek is'],
    rounds: 5,
    topic: 'Betűfelismerés hang alapján, hasonló alakú betűk megkülönböztetése (b–d, a–á, o–ö–ő, n–m), nagy- és kisbetű párosítása',
    round(ctx) {
      const U = ctx.U, L = ctx.level;
      mark(ctx, 'g-magyar-hunt');
      if (L < 3) {
        const letters = L === 1 ? SET1 : SET1.concat(SET2);
        const target = pickFresh(ctx, 'l', L === 1 ? SET1 : (Math.random() < 0.75 ? SET2 : SET1));
        const items = letterOptions(U, target, letters, L === 1 ? 3 : 4, 2);
        const head = U.el('div', { class: 'mg-hunter' }, [U.el('span', { class: 'pic', text: U.pick(FRIENDS) }), U.el('span', { class: 'pic mg-glass', text: '🔎' })]);
        ctx.speakable(head, () => LETTER_SAY[target]);
        ctx.header(head);
        ctx.choose({ items, correct: target, cls: 'letters row', sayOnTap: (l) => LETTER_SAY[l] + '.' });
        ctx.ask('Keresd meg ezt a betűt: ' + LETTER_SAY[target] + '!');
      } else {
        const target = pickFresh(ctx, 'l', CASE_PAIRS);
        const pool = CASE_PAIRS.concat(['o', 'ö', 'u', 'ü', 'p', 'c', 's', 'sz', 'cs', 'zs']);
        const items = letterOptions(U, target, pool, 4, 2);
        const big = U.el('div', { class: 'big-letter mg-upper', text: up(target) });
        ctx.speakable(big, () => LETTER_SAY[target]);
        ctx.header([big, U.el('span', { class: 'pic mg-arrow', text: '➡️' }), U.el('span', { class: 'mg-q', text: '❓' })]);
        ctx.choose({ items, correct: target, cls: 'letters row', sayOnTap: (l) => LETTER_SAY[l] + '.' });
        ctx.ask('Ez a nagy ' + LETTER_NAME[target] + ' betű. Keresd meg a kis párját!');
      }
    },
  });

  /* =========================================================
   * 3. TAPSOLJ! – szótagolás
   * ========================================================= */
  Bubu.registerGame({
    id: 'magyar-clap',
    world: 'magyar',
    name: 'Tapsolj!',
    icon: '🥁',
    intro: 'Tapsoljuk el a szavakat! Minden szótagnál koppints egyet a dobra, aztán nyomd meg a zöld pipát!',
    levels: ['1–2 szótagú szavak', '2–3 szótagú szavak', '3–4 szótagú szavak'],
    rounds: 5,
    topic: 'Szótagolás: a szavak szótagokra bontása tapsolással, a szótagok számának meghatározása',
    round(ctx) {
      const U = ctx.U, L = ctx.level;
      mark(ctx, 'g-magyar-clap');
      const [lo, hi] = [[1, 2], [2, 3], [3, 4]][L - 1];
      const want = U.rand(lo, hi);
      const x = pickFresh(ctx, 'w', WORDS.filter((y) => y.syl.length === want));
      const n = x.syl.length;
      let count = 0;

      const sylBox = U.el('div', { class: 'mg-syl' });
      ctx.header([picBtn(ctx, x), sylBox]);
      const taps = U.el('div', { class: 'mg-taps' });
      const drum = U.el('button', { class: 'mg-drum', 'aria-label': 'Dob', text: '🥁' });
      const reset = U.el('button', { class: 'mg-reset', 'aria-label': 'Újra', text: '↺' });
      const check = U.el('button', { class: 'mg-check', 'aria-label': 'Kész', text: '✔' });
      ctx.stage.appendChild(taps);
      ctx.stage.appendChild(U.el('div', { class: 'mg-clap-row' }, [reset, drum, check]));

      const clearTaps = () => { count = 0; U.clear(taps); };
      const showGhosts = () => {
        U.clear(taps);
        for (let i = 0; i < n; i++) taps.appendChild(U.el('span', { class: 'mg-tap ghost', text: '👏' }));
        count = 0;
      };

      drum.addEventListener('click', () => {
        if (ctx.done || count >= 6) return;
        ctx.sfx('drum');
        U.anim(drum, 'bounce', 600);
        const ghost = taps.querySelector('.ghost');
        if (ghost) ghost.classList.remove('ghost');
        else taps.appendChild(U.el('span', { class: 'mg-tap pop', text: '👏' }));
        count++;
        if (count <= n) ctx.say(x.syl[count - 1]);
      });
      reset.addEventListener('click', () => { if (ctx.done) return; ctx.sfx('whoosh'); clearTaps(); });
      check.addEventListener('click', () => {
        if (ctx.done) return;
        if (count === 0) { ctx.say('Előbb koppints a dobra!'); U.anim(drum, 'wiggle', 800); return; }
        const tell = sylSay(x) + '. ' + cap(U.numAdj(n)) + ' szótag.';
        if (count === n) {
          sylBox.textContent = x.syl.join(' – ');
          ctx.correct(taps, { say: tell });
        } else {
          sylBox.textContent = x.syl.join(' – ');
          const k = ctx.wrong(check, { say: 'Figyeld: ' + tell });
          if (k >= 2) { showGhosts(); ctx.hint(drum, { silent: true }); }
          else clearTaps();
        }
      });

      ctx.ask('Tapsold el: ' + x.w + '!');
    },
  });

  /* =========================================================
   * 4. SZÓÉPÍTŐ
   * ========================================================= */
  Bubu.registerGame({
    id: 'magyar-build',
    world: 'magyar',
    name: 'Szóépítő!',
    icon: '🧱',
    intro: 'Építsünk szavakat! Koppints a betűkre sorban, ahogy a szóban hallod őket!',
    levels: ['2 betűs szavak (ló, hó, fa…)', '3 betűs szavak (hal, ház, nap…)', '4–5 betűs szavak kétjegyű betűkkel (csiga, kutya…)'],
    rounds: 5,
    topic: 'Hang-betű megfeleltetés, a szó hangjainak sorrendje (hangoztatás, szóépítés betűkből)',
    round(ctx) {
      const U = ctx.U, L = ctx.level;
      mark(ctx, 'g-magyar-build');
      let pool;
      if (L === 1) pool = WORDS.filter((y) => y.n === 2);
      else if (L === 2) pool = WORDS.filter((y) => y.n === 3 && !y.di);
      else pool = WORDS.filter((y) => (y.n === 4 || y.n === 5) && y.di && new Set(y.let).size >= y.n - 1);
      const x = pickFresh(ctx, 'w', pool);
      const letters = x.let;
      const nDistract = [1, 2, 3][L - 1];
      const lpool = L === 3 ? ALL : SET1.concat(SET2);
      const distract = [];
      const cands = U.shuffle(letters.flatMap((l) => CONFUSE[l] || [])).concat(U.shuffle(lpool));
      cands.forEach((l) => { if (distract.length < nDistract && !letters.includes(l) && !distract.includes(l) && lpool.includes(l)) distract.push(l); });

      ctx.header([picBtn(ctx, x)]);
      const slots = letters.map(() => U.el('div', { class: 'mg-slot' }));
      ctx.stage.appendChild(U.el('div', { class: 'mg-slots' }, slots));
      const tilesBox = U.el('div', { class: 'mg-tiles' });
      ctx.stage.appendChild(tilesBox);

      let pos = 0, stepWrong = 0;
      const tiles = U.shuffle(letters.concat(distract)).map((l, i) => {
        const t = U.el('button', { class: 'mg-tile', dataset: { l }, text: l, style: { animationDelay: i * 0.06 + 's' } });
        t.addEventListener('click', () => {
          if (ctx.done || t.classList.contains('gone')) return;
          if (l === letters[pos]) {
            ctx.sfx('pop');
            tiles.forEach((o) => o.classList.remove('hint'));
            t.classList.add('gone');
            const s = slots[pos];
            s.textContent = l; s.classList.add('filled');
            U.anim(s, 'pop', 500);
            pos++; stepWrong = 0;
            if (pos === letters.length) {
              ctx.correct(slots[0].parentNode, { say: sylSay(x) + '. ' + x.w + '!' });
            }
          } else {
            stepWrong++;
            ctx.wrong(t, { silent: stepWrong === 1 && Math.random() < 0.5 });
            if (stepWrong >= 2) {
              const right = tiles.find((o) => !o.classList.contains('gone') && o.dataset.l === letters[pos]);
              if (right) ctx.hint(right, { silent: true });
            }
          }
        });
        tilesBox.appendChild(t);
        return t;
      });

      ctx.ask('Rakd ki ezt a szót: ' + x.w + '!');
    },
  });

  /* =========================================================
   * 5. OLVASÓ
   * ========================================================= */
  Bubu.registerGame({
    id: 'magyar-read',
    world: 'magyar',
    name: 'Olvasó!',
    icon: '📖',
    intro: 'Most te olvasol! Ha elakadsz, koppints a fülre, és Bubu segít.',
    levels: ['2–3 betűs szavak, nagyon különböző képek', '4–5 betűs szavak, hasonló kezdetű képek', 'Rövid mondatok (A ló fut.)'],
    rounds: 5,
    topic: 'Szóolvasás és szóértés: az írott szó (mondat) és a kép összekapcsolása, szótagoló olvasás',
    round(ctx) {
      const U = ctx.U, L = ctx.level;
      mark(ctx, 'g-magyar-read');
      let x, text, help, items;
      if (L === 1) {
        x = pickFresh(ctx, 'w', WORDS.filter((y) => y.n <= 3 && !y.di && y.w.length <= 3));
        items = picOptions(U, x, WORDS, 3, { diffFirst: true });
        text = x.w; help = sylSay(x);
      } else if (L === 2) {
        x = pickFresh(ctx, 'w', WORDS.filter((y) => y.n >= 4 && y.n <= 5 && y.w.length <= 6));
        items = picOptions(U, x, WORDS.filter((y) => y.n >= 3 && y.n <= 6), 3, { sameFirst: 1 });
        text = x.w; help = sylSay(x);
      } else {
        const s = pickFresh(ctx, 's', SENTENCES);
        x = s.x;
        items = picOptions(U, x, WORDS, 4, { sameFirst: 1 });
        text = s.t; help = sentSay(s);
      }
      const ear = U.el('button', { class: 'mg-ear', 'aria-label': 'Segítség', text: '👂' });
      ear.addEventListener('click', () => { ctx.sfx('tap'); U.anim(ear, 'wiggle', 800); ctx.say(help, { rate: 0.8 }); });
      ctx.header([U.el('div', { class: 'big-word mg-read-text' + (L === 3 ? ' sent' : ''), text }), ear]);
      ctx.choose({
        items, correct: x, cls: 'pics row',
        render: (y) => U.pic(y.e),
        sayOnTap: (y) => (y === x ? (L === 3 ? text : y.w + '.') : y.w + '.'),
      });
      ctx.ask(L === 3 ? 'Olvasd el a mondatot! Melyik képhez illik?' : 'Olvasd el a szót! Melyik képhez illik?');
    },
  });

  /* =========================================================
   * 6. HOL A HANG? – a hang helye a szóban (hangjelölő dobozok)
   * ========================================================= */
  const ORD = ['első', 'második', 'harmadik', 'negyedik', 'ötödik'];
  /** szó + benne pontosan egyszer előforduló cél-hang, a feltételeknek megfelelően */
  function placeTask(ctx, L) {
    const U = ctx.U;
    const pool = L === 1 ? WORDS.filter((y) => y.n >= 2 && y.n <= 3 && !y.di)
      : L === 2 ? WORDS.filter((y) => y.n === 3)
        : WORDS.filter((y) => y.n >= 4 && y.n <= 5);
    for (let guard = 0; guard < 60; guard++) {
      const x = pickFresh(ctx, 'w', pool);
      let idx = x.let.map((l, i) => i).filter((i) => x.let.filter((m) => m === x.let[i]).length === 1);
      // a szóvégi h alig hallható (méh), azt nem kérdezzük
      idx = idx.filter((i) => !(x.let[i] === 'h' && i === x.n - 1));
      if (L === 1) idx = idx.filter((i) => i === 0 || i === x.n - 1);
      if (L === 2) idx = idx.filter((i) => x.let[i].length === 1);
      if (L === 3 && Math.random() < 0.6) { const d = idx.filter((i) => x.let[i].length > 1); if (d.length) idx = d; }
      if (idx.length) return { x, i: U.pick(idx) };
    }
    const x = byWord('sün');
    return { x, i: 0 };
  }

  Bubu.registerGame({
    id: 'magyar-place',
    world: 'magyar',
    name: 'Hol a hang?',
    icon: '🔊',
    intro: 'Minden doboz a szó egy hangja. Az első doboz a szó eleje, az utolsó a vége.',
    levels: ['Az elején vagy a végén? (2–3 hangú szavak)', 'Elején, közepén vagy végén? (3 hangú szavak)', 'Hányadik hang? (4–5 hangú szavak, kétjegyűekkel)'],
    rounds: 5,
    topic: 'Hangelemzés: a hang helyének meghatározása a szóban (eleje, közepe, vége, hányadik hang)',
    round(ctx) {
      const U = ctx.U, L = ctx.level;
      mark(ctx, 'g-magyar-place');
      const { x, i } = placeTask(ctx, L);
      const target = x.let[i];
      ctx.header([picBtn(ctx, x, true), ctx.speakable(U.el('span', { class: 'mg-sound', text: '👂' }), LETTER_SAY[target])]);
      const boxes = x.let.map((l, k) => U.el('button', { class: 'mg-box', 'aria-label': (k + 1) + '. hang' }));
      ctx.stage.appendChild(U.el('div', { class: 'mg-boxes' }, boxes));

      const where = (k) => (k === 0 ? 'az elején' : k === x.n - 1 ? 'a végén' : 'a közepén');
      boxes.forEach((b, k) => {
        b.addEventListener('click', () => {
          if (ctx.done || b.classList.contains('used')) return;
          if (k === i) {
            boxes.forEach((o, j) => { o.textContent = x.let[j]; o.classList.add(j === i ? 'target' : 'shown'); });
            const say = L === 3 ? cap(art(ORD[i])) + ' ' + ORD[i] + ' hang: ' + LETTER_NAME[target] + '.'
              : cap(where(i)) + ' hallod: ' + x.w + '.';
            ctx.correct(b, { say });
          } else {
            b.classList.add('used');
            const n = ctx.wrong(b);
            if (n >= 2) ctx.hint(boxes[i], { silent: true });
          }
        });
      });

      const pre = 'Figyeld ezt a hangot: ' + LETTER_SAY[target] + '! ';
      if (L === 1) ctx.ask(pre + 'Hol hallod ' + art(x.w) + ' ' + x.w + ' szóban: az elején, vagy a végén?');
      else if (L === 2) ctx.ask(pre + 'Hol hallod ' + art(x.w) + ' ' + x.w + ' szóban: az elején, a közepén, vagy a végén?');
      else ctx.ask(pre + 'Hányadik hang ' + art(x.w) + ' ' + x.w + ' szóban? Koppints a dobozára!');
    },
  });

  /* adatok a teszteléshez / más világok számára (csak olvasásra) */
  Bubu.magyarData = { WORDS, SENTENCES, LETTER_SAY, LETTER_NAME, CONFUSE, SET1, SET2, SET3 };
})();
