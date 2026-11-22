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
| Keyboard | `1`-`4` choose a letter sign, arrow keys move, `Enter` / `Space` confirm, `Esc` back, `P` pause, `R` hear the word, `M` music, `T` timer, `G` graphics |
| PS4 controller | ✕ ○ □ △ for the four signs, D-pad / stick to move, R1 hears the word, Options pauses |

The game can be paused at almost any moment (`P`, `Esc`, Options, or the ⏸ button), and it pauses by itself when the
browser tab is hidden. "Back to hero select" in the pause menu resets the game in place (no page reload). If something
unexpected goes wrong during play, the game retries the current word, and returns to hero select if that keeps failing,
instead of getting stuck.

## Running it

It is a static site. Serve the `spelling-ninja` folder with any web server and open it in a browser, for example:

```
cd spelling-ninja
python -m http.server 8777
```

Then open <http://localhost:8777/>. Babylon.js is loaded from a **pinned version** (`https://cdn.babylonjs.com/v9.37.1/babylon.js`, set in
`index.html`) so a new Babylon release cannot break the game. To upgrade, change the version in that URL and test the
whole game. An internet connection is needed the first time; if the engine cannot load, a "could not start" screen is shown. Progress (coins, stars, wardrobe, stickers, word list) is kept in
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
- **Challenge numbers:** `LIVES_PER_BOSS`, `LETTER_TIME` and `BLANK_SHARE` in `js/settings.js`.
- **Title look:** `#title` rules in `css/style.css`. The "Heroes" word uses a rainbow gradient, so its shadow is a
  `drop-shadow` filter on the heading rather than a `text-shadow`, which would show through the gradient.
- Browsers cache the CSS and JS aggressively; use a hard refresh (Ctrl+F5) after editing.
