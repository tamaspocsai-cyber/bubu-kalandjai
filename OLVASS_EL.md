# 🐲 Bubu kalandjai – útmutató szülőknek

Játékos tanulóprogram **1. osztályosoknak**, akik **még nem tudnak olvasni**. A 2020-as NAT és az 1. osztályos kerettanterv anyagára épül.
Mindent Bubu, a kis zöld sárkány mond el hangosan. A gyereknek nem kell olvasnia, csak koppintania (vagy húznia).

## Indítás
- **Online (tableten, telefonon, bármilyen gépen):** https://tamaspocsai-cyber.github.io/bubu-kalandjai/
  Tableten érdemes a böngésző menüjéből a „Hozzáadás a kezdőképernyőhöz” lehetőséget választani, így ikonról indul, mint egy alkalmazás.
- **Helyben:** kattints duplán az **`index.html`** fájlra.
- **Legjobb böngésző: Microsoft Edge.** Ebben a legszebb a magyar felolvasó hang („Microsoft Noémi / Tamás Online”, ehhez internet kell). Chrome-ban a Windows saját magyar hangja szól („Microsoft Szabolcs”). Ez gépiesebb, de jól érthető.
- Nem kell telepíteni. Ha van internet, a program letölt két gyerekbarát betűtípust. Az egyik az **Andika**, amelyet kifejezetten olvasni tanulóknak terveztek.
- **Tableten:** másold a teljes `Bubu-kalandjai` mappát az eszközre, vagy tedd fel egy tárhelyre (pl. GitHub Pages, Netlify), és nyisd meg böngészőben. Érintéssel ugyanúgy működik, és teljes képernyőre vált.

## Mi van benne? – 4 sziget, 27 játék, mindegyik 3 szinttel (🌱 könnyű · 🌿 közepes · 🌳 nehéz)

| Sziget | Játékok |
|---|---|
| 🔢 **Számország** (matematika, 20-as számkör) | Számolj! · Melyik több? (<, >, = krokodillal) · Összeadás · Kivonás · Számszomszédok (vonat, számegyenes) · Tízes barátok (bontás, pótlás, tízes keret) · Formák (síkidomok, testek) |
| 🔤 **Betűerdő** (olvasás-írás előkészítése) | Kezdőhang · Betűvadász (hasonló betűk, kis- és nagybetűk) · Tapsolj! (szótagolás dobbal) · Szóépítő · Olvasó (első szavak és mondatok) · Hol a hang? (hangok helye a szóban) |
| 🌳 **Természet-völgy** (környezetismeret) | Évszakok (hónapokkal) · Állatok (hangok, háziállat és vadállat, élőhely, anya és kicsinye) · A testem (érzékszervek, testrészek, tisztálkodás) · Egészséges tányér · Napirend (napszakok, a hét napjai) · Közlekedés (lámpa, járművek, biztonság) · Időjárás |
| 🧩 **Fejtörő-hegy** (logika, figyelem, emlékezet) | Memória · Mi jön? (mintasorok) · Kakukktojás · Merre van? (fent, lent, jobbra, balra, között) · Árnyékvadász · Bubu dobol (hangsor megismétlése) · Rakd sorba! (méret szerint) |

A **Betűerdő** a hangoztató-elemző módszert követi. A betűk szintenként bővülnek:
- 🌱 magánhangzók és m, l, t, s;
- 🌿 a többi egyjegyű betű;
- 🌳 a kétjegyű betűk (sz, cs, ny, gy, zs, ty, ly) és a nagybetűk.

Érdemes a nehezebb szinteket akkor bevenni, amikor az iskolában is ott tartanak (a *Szülői sarokban* bármelyik szint kinyitható).

## Hogyan motivál?
- **Csillagok:** egy játékkör 5 feladat (kb. 2–3 perc). 0–1 hiba ★★★, 2–4 hiba ★★, több hiba ★.
- **Szintek:** a következő szint akkor nyílik meg, ha az előzőn már van legalább 1 csillag.
- **Matricagyűjtemény 📒:** 40 matrica (állatok, járművek…). A csillagokért járnak; az első gyorsan jön, aztán kb. 5 csillagonként egy új.
- **Korona 👑:** a játék kártyáján jelenik meg, ha mindhárom szintje 3 csillagos.
- **Hibázni szabad:**
  - rossz válaszra kedves bátorítás jön, nincs büntetés;
  - 2 hiba után a játék megmutatja (villogtatja) a jó megoldást;
  - jó válaszra konfetti, Bubu ugrál és dicsér.
- **Felolvasás:** a 🔊 gomb (vagy Bubura koppintás) bármikor újra elmondja a feladatot.

## 👨‍👩‍👦 Szülői sarok
A kezdőképernyőn a jobb felső „Szülőknek” gomb, vagy a térképen a ⚙️ gomb nyitja meg. A gyerekzár egy szorzásos kérdés.
- **Statisztika:** csillagok, matricák, játékidő az elmúlt 7 napban, és játékonként az eredmény szintenként.
- **Legutóbbi játékok** a hibák számával és az időtartammal.
- **Hangbeállítás:** felolvasó hang, beszédsebesség, hangeffektek. Itt vannak a teendők arra az esetre is, ha nincs magyar hang (Windows, Android, iPad).
- **Minden szint nyitva:** ha egy konkrét témát kell gyakorolni.
- **Mentés letöltése és visszatöltése:** a haladás a böngészőben tárolódik, így vihető át másik gépre.
- **Haladás törlése.**

## Tippek
- Napi 15–20 perc bőven elég. Az elején üljetek le együtt, hogy lássa, mit kell csinálni.
- Ha Bubu túl gyorsan vagy lassan beszél, a Szülői sarokban állítható.

## Technikai felépítés (fejlesztőknek)
- Tiszta HTML, CSS és JavaScript, build és szerver nélkül (`file://`-ról is fut).
- Felépítés:
  - `js/core/`: hang, mentés, játékregiszter;
  - `js/app.js`: képernyők és játékfuttató;
  - `js/games/<sziget>.js`: a játékok;
  - `css/games/<sziget>.css`: a játékok stílusa.
- Új játékot a `docs/JATEK_API.md` szerint lehet hozzáadni.
- Egy játék közvetlenül is indítható: `index.html#game=math-count&level=2`.
