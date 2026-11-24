# Spelling Heroes

**Play online:** [yoniyamin.github.io/spellingheros](https://yoniyamin.github.io/spellingheros/) (GitHub Pages; needs internet the first time for Babylon.js from the CDN).

A 3D spelling game for young children that runs in the browser. Pick a hero, hear a word, spell it by
choosing the right letters, and beat a boss at the end of each level. Built with plain HTML, CSS and
JavaScript on top of [Babylon.js](https://www.babylonjs.com/). There is no build step and no audio or
image files; sounds, music and figures are generated in code.

## How to play

1. **Title screen:** click or press ✕ to start.
2. **Choose your hero:** use ◀ ▶ (or click a hero), then press **PLAY**.
3. **Spell the word:** the game says the word and shows a picture and blank letter slots. Several signs
   show letters, and only one is right. Click the correct sign (or press keys 1-4, or the matching pad button).
4. **Beat the boss:** after a set number of words (4 by default, shown as the boss's hearts) a boss appears. Spell correctly to
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

### Heroes

| Hero | Description |
|---|---|
| Kai the Red Ninja | Super-speedy karate chops, throws ninja stars |
| Saint Jordi the Knight | Shield bonks and silly sword swings, sword beam |
| Princess Aina | Flips, kicks and boxing gloves, sparkle rings |

Each hero has its own move set, and there are further finisher moves (meteors, lightning, rainbow,
fireworks and others).

### Places

The hero select screen has a place chip under the heroes. Use its ◀ ▶ buttons (or the ▲ ▼ keys) to choose where
the adventure happens. The choice is remembered. The default is the **Adventure tour**: every level moves to the
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

The bosses do not just hop: a small "director" (`bossRoam` in `js/targets.js`) strings together strolls, hops, spins, charges at
the hero with a strike, and taunts, and plays the matching animation of the model (walk, run, jump, punch, wave...).

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
- **Word packs** replace the list with a ready-made set (Starter, Animals, Colors, ai / oa, Sight words, Numbers, Food).
- **Words per boss** sets how many words make a level (2 to 10). The default is 4; a value you chose earlier stays saved in the browser.
- Click a word to hear it, ✖ to remove it. The list is saved in the browser.
- **Practice words:** a word spelled with mistakes comes back about 3 words later in the same game, and words
  the child keeps getting wrong appear more often in later games (a 🎯 marks them in this list). A word spelled
  perfectly slowly loses its 🎯 again. The score is kept per word in the browser (`weak` in the save data) and is
  forgotten when the word is removed from the list.

## Controls

| Input | Use |
|---|---|
| Mouse / touch | Click signs, heroes and buttons |
| Keyboard | `1`-`4` choose a letter sign, arrow keys move, `Enter` / `Space` confirm, `Esc` back, `▲` `▼` change place (hero select), `P` pause, `R` hear the word, `M` music, `T` timer, `G` graphics |
| PS4 controller | ✕ ○ □ △ for the four signs, D-pad / stick to move, R1 hears the word, Options pauses |

The game can be paused at almost any moment (`P`, `Esc`, Options, or the ⏸ button), and it pauses by itself when the
browser tab is hidden. "Back to hero select" in the pause menu resets the game in place (no page reload). If something
unexpected goes wrong during play, the game retries the current word, and returns to hero select if that keeps failing,
instead of getting stuck.

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
├── tools/            gltf2glb.py: packs a Quaternius .gltf (embedded buffer) into a compact .glb
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
- **Default words and packs:** `DEFAULT_WORDS` and `WORD_PACKS` in `js/settings.js`; automatic picture guesses are in `EMOJI_DICT`; picker pictures are in `EMOJI_CATS`.
- **Wrong-letter behaviour:** `CONFUSABLE` in `js/settings.js`.
- **Challenge numbers:** `LIVES_PER_BOSS`, `LETTER_TIME` and `BLANK_SHARE` in `js/settings.js`.
- **Title look:** `#title` rules in `css/style.css`. The "Heroes" word uses a rainbow gradient, so its shadow is a
  `drop-shadow` filter on the heading rather than a `text-shadow`, which would show through the gradient.
- Browsers cache the CSS and JS aggressively; use a hard refresh (Ctrl+F5) after editing.
