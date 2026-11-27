# Spelling Heroes

**Play online:** [yoniyamin.github.io/spellingheros](https://yoniyamin.github.io/spellingheros/) (GitHub Pages; needs internet the first time for Babylon.js from the CDN).

A 3D spelling game for young children that runs in the browser. Pick a hero, hear a word, spell it by
choosing the right letters, and beat a boss at the end of each level. Built with plain HTML, CSS and
JavaScript on top of [Babylon.js](https://www.babylonjs.com/). There is no build step and no audio or
image files; sounds, music and figures are generated in code.

## How to play

1. **Title screen:** the four wardrobe pets (dragon, chick, ghost, robo drone) fly over the title. Click or press ✕ to start.
2. **Choose your hero:** use ◀ ▶ (or click a hero; a ▼ marker bounces over the chosen one), then press **PLAY** under the hero card.
   (The camera tips down a little on this screen, so the heroes stand above the card.)
3. **Where to?** Pick a place from the picture cards (or the Adventure tour, or Surprise me), and how to play: **All my words**,
   **Tricky words** (only the words that were hard) and the timer on or off. Then press **GO!**
4. **Spell the word:** the game says the word and shows a picture and blank letter slots. Several signs
   show letters, and only one is right. Click the correct sign (or press keys 1-4, or the matching pad button).
5. **Beat the boss:** after a set number of words (4 by default, shown as the boss's hearts) a boss appears. Spell correctly to
   attack, and a finisher move plays at the end.
5. **Report and treasure:** each level ends with a spelling report and a treasure chest with coins, stickers and prizes.

### Challenge rules

- **Lives:** you have 💚💚💚 in every boss round. A wrong letter costs a life, and so does letting the timer run out.
  Every 5 correct letters in a row (a combo of 5, 10, ...) win one life back (never more than 3).
- **Letter timer:** you have 20 seconds to choose each letter (the bar under the word box goes green, yellow, red).
  When it runs out you lose a life, the word is said again, and you get a fresh 20 seconds with the same signs.
  The timer can be switched off (⏱️ Timer button in the menu bar or the pause screen, or the `T` key) for a calmer game;
  lives are then only lost on wrong letters. The setting is remembered (`sh_timer` in `localStorage`).
- **Out of lives:** the boss wins the round. The spelling report is shown (with the word you were on, and ⏰ where time ran out),
  then you are back at hero select. The word goes on the "needs practice" list.
- **The word is said again** after every letter you choose.
- **The slot you are spelling** is the red glowing box with a bouncing arrow and a "?".
- **Levels start easier:** on level 1 only about a third of the letters are blank (vowels first, the other letters are
  already filled in, in grey), level 2 about half, level 3 about four fifths, and from level 4 the whole word is blank.
  See `BLANK_SHARE` in `js/settings.js`.

Wrong letters are chosen to be the ones children really mix up (for example `b`/`d`, vowels with vowels,
sound-alikes such as `c`/`k`/`s`), so the game also shows which sounds need practice.

### Power-ups, missions and word twists

- **⚡ Power meter** (bottom left): every right letter charges it. After 6 (`POWER_FILL`) you win a power-up (you can hold two;
  with both slots full you get 5 coins instead). Use one with a click on its button, keys `5` / `6`, or L1 on the pad:
  - 🔍 **Magnifier** - two wrong signs disappear (the child still has to choose between the last two)
  - 🛡️ **Shield** - the next slip or timeout costs no life
  - 💚 **Extra life** - one life back (it waits if your lives are full)
- **⚡ Quick letters:** a right letter picked on the first try within 4 seconds (`QUICK_TIME`) gives a bonus coin.
- **🎯 Mission** (top left, under the lives): every level has one small goal, for example "spell 3 words with no slips",
  "reach a x5 combo", "pick 6 letters fast", "beat the boss without losing a life" or "spell a tricky word perfectly".
  Done = +25 coins and a star.
- **Word twists** (a tag under the word box, see `TWIST` in `js/settings.js`):
  - ⭐ **Golden word** - double coins
  - 👀 **Look, cover, spell** (from level 2) - the whole word is shown for a moment, then hidden
  - 🙈 **Mystery word** (from level 3, only words met before) - no picture, just listen (+5 coins)
- **😡 Last heart:** when the boss is down to its last heart it gets angry (the boss box shakes) and the last word is the mega finisher.

### Heroes

| Hero | Description |
|---|---|
| Kai the Red Ninja | Super-speedy karate chops, throws ninja stars |
| Saint Jordi the Knight | Shield bonks and silly sword swings, sword beam |
| Princess Aina | Flips, kicks and boxing gloves, sparkle rings |

Each hero has its own move set, and there are further finisher moves (meteors, lightning, rainbow,
fireworks and others).

### Places

After PLAY, the **Where to?** step shows a picture card for every place (`images/places/`, screenshots of the game's own scenery)
plus the Adventure tour and Surprise me. The scene behind it changes as you pick, and the choice is remembered. The default is the **Adventure tour**: every level moves to the
next place (school, forest, candy, snow, beach, then round again) and each place has its own boss.

| Place | Look |
|---|---|
| 🗺️ Adventure tour | Default. A new place and a new boss on every level |
| School corridor | The original place |
| Haunted forest | Cute-spooky night with glowing mushrooms, a friendly ghost, an owl and fireflies. Boss: the grumpy red pig |
| Candy land | Rainbow, lollipops, ice cream and a gingerbread house. Boss: the Bouncy Pink Blob |
| Snowy mountain | Snowy pines, snowmen, penguins and falling snow. Boss: the Grumpy Yeti |
| Pirate beach | Sea, palm trees, a treasure chest and a pirate flag. Boss: Captain Barbarossa |
| 🎲 Surprise me! | A random different place at the start of every level |

### Bosses

Every place has its own boss the first time you get there in a run (the school has the homework monster). When you come
back to a place, a random boss from the other pool turns up instead (Cheeky Green Imp, the egg, Wobbly Alien, Dizzy Dino,
Grumpy Orc or Hoppy Frog), never the same one twice in a row.

The bosses mostly hold their ground: a small "director" (`bossRoam` in `js/targets.js`) has them rest and make threatening gestures
(a punch swing, a head shake, a shiver of rage), with now and then a small step, a small hop or a lean-in with a strike, and plays the
matching animation of the model. The big run at the hero is the final hit when you lose the round. Model bosses are flattened a little
in depth so they stay behind the letter signs without going behind the scenery.

### Rewards

- 🪙 **Coins** and ⭐ **stars** are earned by spelling correctly. Combos give bonuses.
- 👗 **Wardrobe:** spend coins on hats, scarves and necklaces, capes and wings, trails, pets and power effects.
- 🏆 **Trophy locker:** a sticker for every word, with up to three stars each.

## Menu bar (hero select screen)

| Button | What it does |
|---|---|
| 📝 Words | Edit the spelling list (see below) |
| 👗 Wardrobe | Buy and wear items |
| 🏆 Trophies | See collected word stickers |
| 🎵 Music | Turn the generated music on or off |
| ⏱️ Timer | Turn the 20-second letter timer on or off |
| ✨ Graphics | Cycle graphics quality (Low / Balanced / High). The game also lowers it by itself on slow computers. |

## Your own words (📝 My Spelling Words)

- Type a word, or many separated by commas or spaces (`cat, dog, sun`), then press **➕ Add**.
- **Picture:** each word gets a picture (emoji). The game guesses one automatically (shown in the small
  picture box). To choose a different one:
  - press **🎨 More…** to open the picker, choose a category (Animals, Food, Nature, Things, Travel, People, Fun)
    and tap a picture. **✨ Auto** goes back to the automatic pick; or
  - type or paste any emoji into the picture box.
  - A chosen picture applies when adding a single word. When several words are added at once, each uses its automatic pick.
- **Word groups:** the words are kept in groups. There are ready-made packs (Starter, igh, Animals, Colors, ai / oa, Sight words,
  Numbers, Food) and your own groups (it starts with "My words"; **➕ New group** makes another one, for example one per week's
  spelling list). **Tick ✅ any number of groups** and the game plays all their words together (a word that is in two groups is played once).
  Click a group's name to see its words; your own groups can be renamed, deleted and have words added or removed. A pack cannot be
  changed, but **📋 Copy to my groups** makes an editable copy.
- **Words per boss** sets how many words make a level (2 to 10). The default is 4; a value you chose earlier stays saved in the browser.
- Click a word to hear it, ✖ to remove it. Everything is saved in the browser (`groups` and `active` in the save data).

### Tricky words (reinforcement)

Words the child gets wrong are practised until they stick:

- **Right after a slip:** when the word is finished, it is spelled out letter by letter on the sticker, with the letters that went
  wrong in red, and the voice says it the same way ("pig. P, I, G. pig").
- **Again soon:** a word with mistakes comes back about 3 words later in the same game (twice at most).
- **As "look, cover, spell":** a tricky word (and a word coming back after a slip) is first shown whole for a moment, then hidden.
- **The hard letters are always blank:** the game remembers which letters of a word were missed (`hist` in the save data), and those
  letters are always ones to spell next time, even on the easy first levels. Spelling one right fades the mark again.
- **More often, and earlier:** every word has a practice score (`weak` in the save data, 0-5). Mistakes raise it, a perfect spelling
  lowers it. Tricky words get extra turns and tend to come early in the round, so they are not lost among many ticked words.
- **🎯 marks** show tricky words in the word lists and on the spelling report; the Words screen lists all of them (🧽 Reset forgets them).
  When a tricky word is spelled perfectly it shows "✨ Fixed it!".
- **🎯 Tricky words** (the "how do you want to play?" choice in the Where to? step; greyed out when there are none): a practice
  run with only the tricky words of all groups.

Scores of words that are in no group any more are forgotten.

## Controls

| Input | Use |
|---|---|
| Mouse / touch | Click signs, heroes and buttons |
| Keyboard | `1`-`4` choose a letter sign, `5` / `6` use a power-up, arrow keys move, `Enter` / `Space` confirm, `Esc` back, `▲` `▼` switch between places and how to play (Where to? step), `P` pause, `R` hear the word, `M` music, `T` timer, `G` graphics (Caps Lock does not matter) |
| PS4 controller | ✕ ○ □ △ for the four signs, D-pad / stick to move, R1 hears the word, L1 uses a power-up, Options pauses |

The game can be paused at almost any moment (`P`, `Esc`, Options, or the ⏸ button), and it pauses by itself when the
browser tab is hidden. "Back to hero select" in the pause menu resets the game in place (no page reload). If something
unexpected goes wrong during play, the game retries the current word, and returns to hero select if that keeps failing,
instead of getting stuck.

## Phones and tablets

The game works on phones and tablets (tested at iPhone 14 / 16 size, 844 x 390 sideways).

- **Always sideways.** On a phone held upright the game turns itself 90 degrees, so it is always shown in landscape: just
  turn the phone to the left. This also works with the phone's rotation lock on. When the browser turns to landscape by
  itself, the game is shown normally. (`layoutRotation()` / `ROT` in `js/engine.js`: the whole page is turned, taps are turned
  back with `toLocal()`, and style.css uses `--vw` / `--vh`, 1% of the game frame, instead of `vw` / `vh`.)
- **Never stretched.** After the phone turns, the drawing surface is re-fitted to the canvas (Safari reports the new size late).
- **Full screen on iPhone:** in Safari tap Share, then **Add to Home Screen**. The icon opens the game full screen, without
  Safari's bars (`manifest.webmanifest`, `icons/`). iPhones cannot go full screen from a web page any other way; on Android and
  computers the menu bar has a **⛶ Full screen** button.
- **Sound:** on an iPhone the game plays even with the silent switch on (the words have to be heard), and the first tap
  switches on speech (iOS only lets a tap start it).
- The HUD gets compact on short screens, stays clear of the notch / Dynamic Island and the home bar (safe areas), and long
  words get narrower letter boxes. Tap hints replace the keyboard help.

## Running it

### GitHub Pages

The site is deployed from `main` with the [GitHub Actions workflow](.github/workflows/pages.yml). After a push, check the **Actions** tab; when the run finishes, the game is live at the link above (first deploy can take a minute or two).

### Local

It is a static site. Serve this repository root with any web server and open it in a browser, for example:

```
python -m http.server 8777
```

Then open <http://localhost:8777/>. Babylon.js is loaded from a **pinned version** (`https://cdn.babylonjs.com/v9.37.1/babylon.js`, set in
`index.html`) so a new Babylon release cannot break the game. To upgrade, change the version in that URL and test the
whole game. An internet connection is needed the first time; if the engine cannot load, a "could not start" screen is shown. Progress (coins, stars, wardrobe, stickers, word list) is kept in
the browser's `localStorage` under the key `spellingHeroes_v1`.

## Project layout

```
├── index.html        all screens (title, select, shop, locker, words, pause, report, reveal) and the script load order
├── css/style.css     look and feel
├── js/
│   ├── settings.js   default words, word packs, emoji picks, picture picker lists, confusable letters, wardrobe catalog, save data
│   ├── audio.js      synthesised sound effects, live-generated music, text-to-speech for the words
│   ├── engine.js     Babylon.js set-up, lighting and quality levels, mesh helpers, particles, screen effects
│   ├── tween.js      small tween / pose scheduler (frozen while paused)
│   ├── fx.js         particles and power effects
│   ├── corridor.js   the 3D school corridor scene (the default place)
│   ├── places.js     the other places (haunted forest, candy land, snowy mountain, pirate beach) and place switching
│   ├── rig.js        the block-figure hero rig, the three heroes and their move sets
│   ├── targets.js    the letter signs and the bosses
│   ├── input.js      keyboard, mouse and PS4 controller handling
│   ├── game.js       game state, screens, wardrobe, word editor, game flow (levels, words, finishers, report, chest)
│   └── main.js       start-up and the main loop
├── models/           Kenney hero GLBs, weapons, bosses (Monsters/, Pirates/, Imp; CC0 / kit licenses in models/)
├── images/places/    picture cards of the places for the Where to? step (captured from the game; tour / random made from them)
├── icons/            home-screen icons (drawn by tools/make_icons.py), used by manifest.webmanifest
├── manifest.webmanifest  "Add to Home Screen" settings (full screen, sideways)
├── tools/            gltf2glb.py: packs a Quaternius .gltf (embedded buffer) into a compact .glb; make_icons.py: draws icons/
└── Backup/           older snapshots (not part of the game; ignored by git)
```

The scripts are plain (non-module) files that share one global scope, so **the load order in `index.html`
matters**: `settings` → `audio` → `engine` → `tween` → `fx` → `corridor` → `places` → `rig` → `targets` → `input` → `game` → `main`.

## Notes for changing things

- **Hero names / descriptions:** the `HEROES` array in `js/rig.js`.
- **Adding a place:** add an entry to the `PLACES` array in `js/places.js` (colours, fog, floor painter, four scenery
  segment builders, a sky painter, particle settings). Scenery is built from merged meshes and built lazily the first time
  the place is used (or a little ahead of time during the tour). Add it to `TOUR` and give it a `tour:()=>boss` to put it
  in the adventure tour. Keep the scenery light: ~16 copies are on screen at once, so `places.js` scales down sphere,
  cylinder and torus detail (`LOD_S`, `LOD_C`, `LOD_T`). Nodes that must survive `sweepScene()` in `js/game.js` are registered with `keepNode`.
- **Draw order:** the backdrop (floor, sky, scenery pieces, ambient sparkles) is in rendering group 0; everything else (hero, signs, bosses, effects) is in
  group 1 and is drawn on top. A new floor / sky / scenery mesh or ambient particle system must be wrapped in `backdrop(...)` (see `js/engine.js`), or it will be drawn over the characters.
- **Default words and packs:** `DEFAULT_WORDS` and `WORD_PACKS` in `js/settings.js` (give a new pack a unique `id`: ticked groups are saved by it); automatic picture guesses are in `EMOJI_DICT`; picker pictures are in `EMOJI_CATS`.
- **Wrong-letter behaviour:** `CONFUSABLE` in `js/settings.js`.
- **Challenge numbers:** `LIVES_PER_BOSS`, `LETTER_TIME`, `BLANK_SHARE`, `POWER_FILL`, `QUICK_TIME` and `TWIST` in `js/settings.js`; the missions are `MISSIONS` in `js/game.js`.
- **Music:** `SONGS` in `js/audio.js`. A song is plain data (tempo, key, steps per bar, patterns, phrases, form, instruments, mix,
  reverb). Every place has its own song: school "School Bell March", forest "Moonlit Mushroom Sneak" (swung, music box),
  candy "Sugar Rush Bounce" (toy piano, claps), snow "Snowflake Waltz" (3/4, glockenspiel, sleigh bells), beach "Pirate Jig"
  (6/8, accordion, mandolin); menus play the "dojo" song. `SONG_OF_PLACE` links places to songs. Music and sound effects share a
  generated reverb, and the effects go through their own compressor so many at once never clip.
- **Title look:** `#title` rules in `css/style.css`. The "Heroes" word uses a rainbow gradient, so its shadow is a
  `drop-shadow` filter on the heading rather than a `text-shadow`, which would show through the gradient.
- **Performance:** keep the number of draw calls low (about 140 during play; check with `BABYLON.SceneInstrumentation`
  and its `drawCallsCounter`). Scenery made of many small pieces goes through `mergeBaked()` / `bakeNode()` in `js/engine.js`:
  it turns flat colours into vertex colours, so a whole wall or a hero accessory with many colours is one or a few draw calls.
  The training dummies under the signs are instances of shared meshes (`DUMMY` in `js/targets.js`) and the sign textures are
  pooled and redrawn. Smoothing in the main loop uses `lerpK(k, dt)` so animations run at the same speed at 60, 120 or 144 Hz.
- **Sharpness:** `applyResScale()` in `js/corridor.js` renders above CSS resolution on hi-DPI screens (Retina, phones), up to a
  budget of 1.6 million pixels (`PIX_BUDGET`); the automatic quality check in `js/main.js` can bring it back down.
- **Browser cache:** `index.html` loads the scripts and the stylesheet with `?v=9`. Raise that number when you publish
  changed files, so phones and browsers fetch the new version instead of a cached old one (or use a hard refresh, Ctrl+F5).
