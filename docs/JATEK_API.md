# Bubu kalandjai – fejlesztői specifikáció (játékmodulok)

## A termék
Böngészőben (file:// is!) futó tanulójáték egy **7 éves, 1. osztályos magyar kisfiúnak, aki MÉG NEM TUD OLVASNI**.
A tananyag a 2020-as NAT és az 1. osztályos kerettanterv: matematika, magyar (olvasás-írás előkészítés), környezetismeret, plusz logika.
Kabala: **Bubu, a kis zöld sárkány**. Ő mond el mindent magyar gépi hangon (Web Speech API).

**Aranyszabályok (olvasni nem tudó gyerek):**
1. **Minden feladatot hangosan el kell mondani** a `ctx.ask(...)`-kal. A képernyőn lévő szöveg csak „díszítés” vagy maga a tananyag (pl. betű, szó, szám). Soha ne kelljen olvasnia az instrukciót.
2. **Képek = emoji.** Nincs képfájl. Nagy, jól felismerhető, egyértelmű emojit válassz. Ami Windows (Segoe UI Emoji) alatt nem egyértelmű, vagy félreérthető, azt kerüld (pl. 🫛 nem jelenik meg mindenhol; kerüld az Unicode 14+ emojikat).
3. **Nagy gombok** (min. ~90px), kevés választási lehetőség (2–4, nehéz szinten max 5–6), egy feladat = egy döntés.
4. **Koppintás** a fő interakció. Húzás csak ott, ahol természetes. A `U.draggable` húzást és „koppints rá, aztán koppints a célra” módot is tud.
5. Rövid, kedves, gyereknyelvű magyar mondatok. Tegezés. Pl. „Hány katica van a képen?”, „Melyik kezdődik így: Mmm?”
6. A szám kiejtéséhez a felolvasásban használd a `U.numWord(n)` függvényt (pl. `U.numWord(12)` → „tizenkettő”). „3 + 4” helyett írd ki: „három meg négy”, vagy „három plusz négy”.
7. A tartalom **szakmailag pontos, a magyar helyesírás hibátlan** legyen (á é í ó ö ő ú ü ű!).
8. Minden körben legyen véletlenszerűség, hogy sokszor újrajátszható legyen. Ugyanaz a feladat ne ismétlődjön egy játékon belül (5 kör), ha lehet.

## Fájlok
- Te csak a saját világod fájljaiba írhatsz:
  - `js/games/<world>.js` – a játékaid (több `Bubu.registerGame` hívás egy fájlban)
  - `css/games/<world>.css` – a játékaid saját stílusa (minden szelektort prefixelj a játék osztályával, pl. `.g-math-count ...`)
- NE módosítsd a `js/core/*`, `js/app.js`, `css/style.css`, `index.html` fájlokat. Ha valami hiányzik a motorból, írd meg a zárójelentésedben.
- Sima JavaScript (NEM ES modul, nincs import/export, nincs build). Az egész fájlt tedd egy IIFE-be: `(function(){ 'use strict'; ... })();`.
- Ellenőrzés: `node --check js/games/<world>.js` legyen hibátlan.

## Játék regisztrálása
```js
Bubu.registerGame({
  id: 'math-count',               // egyedi, prefix: a világ id-ja
  world: 'math',                  // 'math' | 'magyar' | 'kornyezet' | 'logika'
  name: 'Számolj!',               // rövid név: a kártyán látszik ÉS felolvassuk (mondatként, ponttal/felkiáltójellel a végén)
  icon: '🐞',                     // nagy emoji a kártyára
  intro: 'Számold meg, hány állatot látsz!', // (opcionális) a legelső kérdés előtt elhangzik egyszer
  levels: ['1–5', '1–10', '1–20'],// 3 szint rövid leírása a szülőnek (🌱 könnyű, 🌿 közepes, 🌳 nehéz)
  rounds: 5,                      // feladatok száma egy játékban (5–6)
  topic: 'Számlálás, mennyiségek 20-ig', // tananyag leírása a szülői sarokhoz
  round(ctx) { /* egy feladat felépítése */ },
});
```

A motor egy játékban `rounds` darab feladatot ad. Minden feladat előtt üríti a `ctx.stage`-et és meghívja a `round(ctx)`-et.
A feladat akkor ér véget, amikor meghívod a `ctx.correct(...)`-ot. Csillag: 0–1 hiba ★★★, 2–4 hiba ★★, több ★. Körönként legfeljebb 3 hiba számít.

## ctx API
| | |
|---|---|
| `ctx.level` | 1, 2 vagy 3 (könnyű/közepes/nehéz) |
| `ctx.round` | hányadik feladat (0-tól) |
| `ctx.rounds` | összes feladat |
| `ctx.stage` | a feladat DOM-konténere (flex oszlop, középre igazítva, a képernyő nagy része) |
| `ctx.U` | segédfüggvények (lásd lent), ugyanaz, mint a globális `U` |
| `ctx.ask(text)` → Promise | **kimondja a feladatot**, és elmenti a 🔊 ismétlés gombhoz. Minden körben hívd meg! |
| `ctx.say(text)` → Promise | kimond valamit, de nem menti el ismétléshez |
| `ctx.setRepeat(text)` | az ismétlés gomb szövegének cseréje kimondás nélkül |
| `ctx.correct(el?, {say?, praise?})` | jó válasz: hang, konfetti az elemen, dicséret, majd következő kör. A `say` a dicséret elé kerül (pl. `{say: 'Hét!'}`). Egy körben csak egyszer hat. |
| `ctx.wrong(el?, {say?, silent?})` → szám | rossz válasz: hang, rázás, bátorítás. Visszaadja, hányadik hiba volt ebben a körben. |
| `ctx.good(el?, {say?, sfx?})` | kis siker egy többlépéses feladaton belül (pl. egy elem jó helyre került). Nem lép tovább. |
| `ctx.hint(el, {silent?})` | kiemeli (villogtatja) a helyes elemet. Hívd meg 2 hiba után! |
| `ctx.choose({...})` | **kész választós feladat** (lásd lent). A legtöbb játékhoz ez elég. |
| `ctx.speakable(node, text)` | koppintásra kimondja a szöveget (pl. képek meghallgatása, betűhang) |
| `ctx.header(content)` | feladatfej-sáv a stage tetején (pl. a nagy kép, amire a kérdés vonatkozik). `content` lehet Node vagy tömb. |
| `ctx.later(fn, ms)` / `ctx.wait(ms)` | időzítés, ami automatikusan leáll, ha a gyerek kilép. Ne használj sima setTimeoutot! |
| `ctx.sfx(name)` | 'tap' 'pop' 'correct' 'wrong' 'star' 'win' 'whoosh' 'unlock' 'drum' 'clap' 'flip' 'sticker' |
| `ctx.tone(freq, dur, type)` | zenei hang (pl. ritmusjátékhoz) |
| `ctx.mascot(mood)` | Bubu kifejezése: 'happy' 'sad' 'cheer' 'think' |
| `ctx.confetti(el, n)` | konfetti egy elemről |
| `ctx.done` | igaz, ha a kör már véget ért (vagy kiléptek). Aszinkron kódban ellenőrizd! |

### ctx.choose
```js
ctx.choose({
  items: [3, 5, 7],                 // a lehetőségek (bármilyen érték/objektum)
  correct: 5,                       // a helyes érték, vagy fn(item) → bool
  render: (item, btn) => String(item), // szöveg vagy DOM Node a gombba
  sayOnTap: (item) => U.numWord(item), // (opc.) koppintáskor kimondja: jónál a dicséret előtt, rossznál: „Ez három. Próbáld újra!”
  sayOnWrong: (item) => '...',      // (opc.) saját szöveg rossz válasznál (a bátorítás elé kerül)
  cls: 'numbers',                   // elrendezés/stílus, lásd lent
  hintAfter: 2,                     // hány hiba után villogjon a jó megoldás
  container: ctx.stage,             // (opc.) hova kerüljön
});
```
Beépített `cls` értékek (kombinálhatók szóközzel):
- elrendezés: `row` (egy sor, tördel), `grid-2`, `grid-3`, `grid-4`
- tartalom: `numbers` (nagy számok), `letters` (nagy betűk Andika betűtípussal), `pics` (nagy emojik), `words` (szavak, olvasáshoz), `small` (kisebb gombok sok elemhez)

## Közös CSS osztályok (style.css-ben vannak)
- `.pic` – nagy emoji (`U.pic('🍎', '4rem')`)
- `.task-head` – a `ctx.header()` sávja (fehér, lekerekített kártya)
- `.pic-row` – emojik sorban, tördelve, egyenletes távolsággal (pl. számláláshoz)
- `.big-num` – óriás szám, `.big-letter` – óriás betű (Andika), `.big-word` – nagy szó (Andika)
- `.card` – fehér, lekerekített, árnyékos doboz
- `.ok` (zöld kiemelés), `.hint` (villogó sárga keret), `.used` (elhalványított rossz gomb)
- animációk (`U.anim(el, 'név')`): `shake`, `bounce`, `wiggle`, `pop`
- `.drop-target`, `.drop-hover`, `.draggable`, `.selected` – a húzáshoz
- Szín-változók: `var(--c)` a világ fő színe, `var(--d)` a sötétebb változata. A betűtípusok: `var(--font-read)` (Andika, olvasáshoz), `var(--font-ui)` (Nunito).

## U segédfüggvények
`U.rand(min,max)`, `U.pick(arr)`, `U.shuffle(arr)`, `U.sample(arr,n)`, `U.range(a,b)`,
`U.options(correct, pool, n, eq?)` (helyes + n−1 különböző más elem, megkeverve), `U.numOptions(correct, n, min, max)`,
`U.el(tag, attrs, children)` (DOM-építő: `{class, text, html, style:{}, onclick, dataset}`), `U.clear(node)`, `U.wait(ms)`, `U.anim(el, cls, ms)`,
`U.numWord(n)` (0–100 kiírva), `U.numAdj(n)` (2 → „két”), `U.pic(emoji, size)`,
`U.draggable(el, { targets: () => [célelemek], onDrop(target) })` és `U.dropTarget(target)` (koppintásos módhoz minden célra hívd meg).

## Minta
```js
(function () {
  'use strict';
  const ANIMALS = [['🐞','katica','katicát'], ['🐟','hal','halat'], ['🐤','csibe','csibét']];
  Bubu.registerGame({
    id: 'math-count', world: 'math', name: 'Számolj!', icon: '🐞',
    levels: ['1–5', '1–10', '1–20'], rounds: 5, topic: 'Számlálás 20-ig',
    round(ctx) {
      const U = ctx.U;
      const max = [5, 10, 20][ctx.level - 1];
      const n = U.rand(1, max);
      const [emoji, , acc] = U.pick(ANIMALS);
      ctx.header(U.el('div', { class: 'pic-row' }, U.range(1, n).map(() => U.pic(emoji))));
      ctx.choose({
        items: U.numOptions(n, 3, 1, max), correct: n, cls: 'numbers row',
        sayOnTap: (v) => U.numWord(v),
      });
      ctx.ask('Hány ' + acc + ' látsz?'); // ragozás! „hány katicát”
    },
  });
})();
```

## Minőségi elvárások
- Kezeld a nehézségi szinteket érdemben (számkör, lehetőségek száma, elvontság).
- 2 hiba után mindig legyen segítség (`ctx.hint`).
- Aszinkron/animált feladatnál figyelj a `ctx.done`-ra, és csak `ctx.later`/`ctx.wait` időzítést használj.
- Ne használj `alert`/`confirm`/`prompt` hívást.
- Reszponzív legyen: tableten (fekvő és álló) és laptopon is férjen ki görgetés nélkül. Használj `clamp()`, `vmin` mértékegységet.
- A magyar nyelvtani helyességre (ragozás, tárgyeset: „Hány almát…”, „Hány kutyát…”) különösen figyelj, mert a gyerek ebből is tanul.
