/* Bubu kalandjai – játékregiszter és közös tartalom */
(function () {
  'use strict';
  const Bubu = (window.Bubu = window.Bubu || {});

  /** A négy világ (tantárgy) */
  Bubu.worlds = [
    { id: 'math',      name: 'Számország',      say: 'Számország', subject: 'Matematika',        icon: '🔢', deco: ['➕', '5', '🔺', '3'], color: '#FF8C42', dark: '#D9631A', bg: 'linear-gradient(160deg,#FFE3C7,#FFC48C)' },
    { id: 'magyar',    name: 'Betűerdő',        say: 'Betűerdő',   subject: 'Magyar nyelv (olvasás-írás előkészítés)', icon: '🔤', deco: ['A', 'b', 'Ó', 'm'], color: '#3DBE6B', dark: '#23934B', bg: 'linear-gradient(160deg,#DDF7E3,#A8E6B9)' },
    { id: 'kornyezet', name: 'Természet-völgy', say: 'Természetvölgy', subject: 'Környezetismeret', icon: '🌳', deco: ['🐞', '🌻', '☀️', '🍎'], color: '#2D9CDB', dark: '#1B74A8', bg: 'linear-gradient(160deg,#D6EEFC,#A5D8F7)' },
    { id: 'logika',    name: 'Fejtörő-hegy',    say: 'Fejtörőhegy', subject: 'Logika, figyelem, emlékezet', icon: '🧩', deco: ['❓', '🔶', '🧠', '🔷'], color: '#9B5DE5', dark: '#7339BF', bg: 'linear-gradient(160deg,#EEE2FD,#D3BDF7)' },
  ];
  Bubu.world = (id) => Bubu.worlds.find((w) => w.id === id);

  /** Játékok */
  Bubu.games = [];
  /**
   * Bubu.registerGame({
   *   id: 'math-count',            // egyedi azonosító
   *   world: 'math',               // 'math' | 'magyar' | 'kornyezet' | 'logika'
   *   name: 'Számolj!',            // rövid, kimondható név
   *   icon: '🔢',                  // nagy emoji a kártyára
   *   intro: 'Számold meg ...',    // (nem kötelező) a játék elején elhangzó mondat
   *   levels: ['1–5', '1–10', '1–20'], // szintek rövid leírása a szülőnek (1–3 elem)
   *   rounds: 5,                   // (nem kötelező) feladatok száma egy játékban, alap: 5
   *   topic: 'Számlálás 20-ig',    // tananyag-leírás a szülői sarokhoz
   *   round(ctx) { ... }           // egy feladat felépítése a ctx.stage-be
   * })
   */
  Bubu.registerGame = function (def) {
    const problems = [];
    if (!def || !def.id) problems.push('hiányzó id');
    if (def && !Bubu.world(def.world)) problems.push('ismeretlen world: ' + def.world);
    if (typeof def.round !== 'function') problems.push('hiányzó round()');
    if (Bubu.games.some((g) => g.id === def.id)) problems.push('ismétlődő id: ' + def.id);
    if (problems.length) { console.error('[Bubu] Hibás játék:', def && def.id, problems); return; }
    def.levels = def.levels && def.levels.length ? def.levels.slice(0, 3) : ['Könnyű'];
    def.rounds = def.rounds || 5;
    def.order = Bubu.games.length;
    Bubu.games.push(def);
  };
  Bubu.gamesOf = (worldId) => Bubu.games.filter((g) => g.world === worldId);
  Bubu.game = (id) => Bubu.games.find((g) => g.id === id);

  /** Dicséretek és bátorítások */
  Bubu.PRAISE = ['Ügyes vagy!', 'Szuper!', 'Nagyszerű!', 'Ez az!', 'Fantasztikus!', 'Telitalálat!', 'Bravó!', 'Nagyon jó!', 'Hű, de okos vagy!', 'Pompás!', 'Igen, ez az!', 'Kiváló!'];
  Bubu.ENCOURAGE = ['Majdnem! Próbáld újra!', 'Hoppá! Próbáld még egyszer!', 'Nem baj, próbáld újra!', 'Gondold át még egyszer!', 'Ez most nem az. Próbáld újra!'];
  Bubu.HINT = ['Segítek egy kicsit! Nézd, mi villog!', 'Figyelj, megmutatom!'];
  Bubu.LEVEL_INFO = [
    { icon: '🌱', say: 'Könnyű' },
    { icon: '🌿', say: 'Közepes' },
    { icon: '🌳', say: 'Nehéz' },
  ];

  /** Matricák – ezeket gyűjti a gyerek a csillagaiért */
  Bubu.STICKERS = [
    ['🦁', 'oroszlán'], ['🐘', 'elefánt'], ['🦒', 'zsiráf'], ['🐼', 'panda'], ['🐨', 'koala'],
    ['🦓', 'zebra'], ['🐯', 'tigris'], ['🦊', 'róka'], ['🐻', 'medve'], ['🐰', 'nyuszi'],
    ['🦔', 'sün'], ['🐧', 'pingvin'], ['🦉', 'bagoly'], ['🦜', 'papagáj'], ['🦩', 'flamingó'],
    ['🐬', 'delfin'], ['🐳', 'bálna'], ['🐙', 'polip'], ['🦀', 'rák'], ['🐢', 'teknős'],
    ['🦋', 'pillangó'], ['🐞', 'katica'], ['🐝', 'méhecske'], ['🦄', 'egyszarvú'], ['🦖', 'dinoszaurusz'],
    ['🐉', 'sárkány'], ['🚀', 'rakéta'], ['🛸', 'ufó'], ['🚂', 'mozdony'], ['🚒', 'tűzoltóautó'],
    ['🏎️', 'versenyautó'], ['🚁', 'helikopter'], ['⛵', 'vitorlás'], ['🚜', 'traktor'], ['🏰', 'vár'],
    ['🌈', 'szivárvány'], ['🎡', 'óriáskerék'], ['🎸', 'gitár'], ['⚽', 'labda'], ['👑', 'korona'],
  ].map(([e, n], i) => ({ id: 's' + i, emoji: e, name: n }));

  /** hány csillag kell a k-adik (0-tól) matricához */
  Bubu.stickerThreshold = (k) => (k < 4 ? [1, 3, 6, 10][k] : 10 + (k - 3) * 5);
})();
