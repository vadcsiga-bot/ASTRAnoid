# ASTRANOID – az Opel Rulett folytatása

Arkanoid, ahol a téglafal egy **Opel Astra Caravan**. A gépek feltámadtak a roncstelepen, és az új Astrádat
zsarolják: az ő játékukat kell játszanod – szedd szét az autót, minden darabjáig.

## Játékmenet
- **Ütő:** két toló emberke a régi Opel motorházteteje alatt. Húzd az ujjad / egér / ← → (A, D).
- **Labda:** forgó Kis Grofó CD. Koppintás / Space / kattintás az indításhoz.
- **A labda feljuthat az autó fölé is**, és fentről éri a motorháztetőt. Ha a motorháztető leesik, a motortér
  kinyílik, és az apró alkatrészek (gyújtótekercsek, akku, ECU…) szanaszét repülnek.
- **Kerekek:** a kereket 4 csavar tartja. A felnire érkező ütések meglazítják a csavarokat is. Ha mind kiesett, a kerék legurul.
- **Leeső alkatrészek:** a power-upot adó darabokat (akku, plüsskocka, illatosító, pótkerék, elakadásjelző, szerszámosláda)
  kapd el az ütővel. A nehéz darabok (ajtó, tető, motorblokk, kerék…) megbénítják és összenyomják az ütőt –
  a piros jelzés mutatja, hová esnek.
- **Cél:** minden alkatrészt le kell szedni (77 darab). 3 CD-d van.
- **Power-upok:** FLEX (szikrázó lövések), Kis Grofó remix (3 labda), Illatosító (lassítás), Pótkerék (+1 élet),
  Elakadásjelző (3. toló, szélesebb ütő), Légkulcs (átütő labda).
- Adaptív elrendezés: fekvő, álló telefon és gép is támogatott (forgatásnál a labda újraindul).

## Feltöltés GitHub Pages-re
1. Hozz létre egy új repót, és töltsd fel **ennek a mappának a teljes tartalmát** (index.html, manifest.json, sw.js,
   icon-*.png, js/ mappa).
2. Repo → **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main` / `(root)`.
3. Pár perc múlva elérhető: `https://<felhasznalo>.github.io/<repo>/`.
4. Telefonon a böngésző menüjéből telepíthető a kezdőképernyőre (PWA), offline is megy.

> Minden útvonal relatív, ezért alkönyvtárban (`/<repo>/`) is működik.
> Ha módosítasz a fájlokon, a `sw.js` elején a `CACHE` nevét (`astranoid-v1`) növeld, hogy a telepített változatok is frissüljenek.

## Fájlok
- `js/car.js` – az Astra 77 alkatrésze (rajz + pixelpontos ütközési maszk), `js/game.js` – fizika, játék, kirajzolás,
  `js/audio.js` – hangok és zene (Web Audio, nincs külső hangfájl).
- A `tools/` mappa (ha megvan) csak a fejlesztői tesztekhez kellett, a játékhoz nem szükséges.
