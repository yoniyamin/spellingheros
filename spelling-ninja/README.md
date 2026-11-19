# Spelling Heroes

A 3D spelling game for young children that runs in the browser. Pick a hero, hear a word, spell it by
choosing the right letters, and beat a boss at the end of each level. Built with plain HTML, CSS and
JavaScript on top of [Babylon.js](https://www.babylonjs.com/). There is no build step and no audio or
image files; sounds, music and figures are generated in code.

> The folder is still called `spelling-ninja` from an earlier version. The game is now called **Spelling Heroes**.

## How to play

1. **Title screen:** click or press ✕ to start.
2. **Choose your hero:** use ◀ ▶ (or click a hero), then press **PLAY**.
3. **Spell the word:** the game says the word and shows a picture and blank letter slots. Several signs
   show letters, and only one is right. Click the correct sign (or press keys 1-4, or the matching pad button).
4. **Beat the boss:** after a set number of words (5 by default) a boss appears. Spell correctly to
   attack, and a finisher move plays at the end.
5. **Report and treasure:** each level ends with a spelling report and a treasure chest with coins, stickers and prizes.

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
- **Words per boss** sets how many words make a level (2 to 10).
- Click a word to hear it, ✖ to remove it. The list is saved in the browser.

## Controls

| Input | Use |
|---|---|
| Mouse / touch | Click signs, heroes and buttons |
| Keyboard | `1`-`4` choose a letter sign, arrow keys move, `Enter` / `Space` confirm, `Esc` back, `P` pause, `R` hear the word, `M` music, `G` graphics |
| PS4 controller | ✕ ○ □ △ for the four signs, D-pad / stick to move, R1 hears the word, Options pauses |

## Running it

It is a static site. Serve the `spelling-ninja` folder with any web server and open it in a browser, for example:

```
cd spelling-ninja
python -m http.server 8777
```

Then open <http://localhost:8777/>. Babylon.js is loaded from `https://cdn.babylonjs.com/babylon.js`, so an
internet connection is needed the first time. Progress (coins, stars, wardrobe, stickers, word list) is kept in
the browser's `localStorage` under the key `spellingHeroes_v1`.

## Project layout

```
spelling-ninja/
├── index.html        all screens (title, select, shop, locker, words, pause, report, reveal) and the script load order
├── css/style.css     look and feel
├── js/
│   ├── settings.js   default words, word packs, emoji picks, picture picker lists, confusable letters, wardrobe catalog, save data
│   ├── audio.js      synthesised sound effects, live-generated music, text-to-speech for the words
│   ├── engine.js     Babylon.js set-up, lighting and quality levels, mesh helpers, particles, screen effects
│   ├── tween.js      small tween / pose scheduler (frozen while paused)
│   ├── fx.js         particles and power effects
│   ├── corridor.js   the 3D school corridor scene
│   ├── rig.js        the block-figure hero rig, the three heroes and their move sets
│   ├── targets.js    the letter signs and the bosses
│   ├── input.js      keyboard, mouse and PS4 controller handling
│   ├── game.js       game state, screens, wardrobe, word editor, game flow (levels, words, finishers, report, chest)
│   └── main.js       start-up and the main loop
└── Backup/           older snapshots (not part of the game; ignored by git)
```

The scripts are plain (non-module) files that share one global scope, so **the load order in `index.html`
matters**: `settings` → `audio` → `engine` → `tween` → `fx` → `corridor` → `rig` → `targets` → `input` → `game` → `main`.

## Notes for changing things

- **Hero names / descriptions:** the `HEROES` array in `js/rig.js`.
- **Default words and packs:** `DEFAULT_WORDS` and `WORD_PACKS` in `js/settings.js`; automatic picture guesses are in `EMOJI_DICT`; picker pictures are in `EMOJI_CATS`.
- **Wrong-letter behaviour:** `CONFUSABLE` in `js/settings.js`.
- **Title look:** `#title` rules in `css/style.css`. The "Heroes" word uses a rainbow gradient, so its shadow is a
  `drop-shadow` filter on the heading rather than a `text-shadow`, which would show through the gradient.
- Browsers cache the CSS and JS aggressively; use a hard refresh (Ctrl+F5) after editing.
