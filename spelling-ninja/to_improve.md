# To improve

Ideas that came out of a review of the game (using the `router` game-dev skill, then reading all the code).
Nothing here is broken today. Roughly in order of value.

Already done from that review: error recovery, pinned Babylon.js version with a "could not start" screen,
auto-pause when the tab is hidden, pausing during animations, in-place "back to hero select" (no reload),
and bringing missed words back (practice words).

## Learning value

- **Parent / teacher progress view.** The Spelling Report is thrown away after each boss. The game now keeps a
  "needs practice" score per word (`save.weak`), but nothing shows more than a 🎯 in the word list. Store a small
  per-word history (attempts, mistakes, which wrong letters were picked, last played date) and add a screen
  with "words to practise" and "sounds that are hard" (the picked wrong letters already show which sounds get mixed up).
- **Difficulty never changes.** Level 5 is the same four-sign choice as level 1. Later levels could use more
  confusable letters, switch off the automatic hint after two misses, or add a word with no picture.
- **Guessing is no longer free.** Wrong letters and timeouts cost lives (3 per boss round) and the word is said again
  after every choice. Still open: watch real play to see whether 3 lives / 20 seconds suit the child, and whether a
  speed bonus (fast answers earn extra coins) or a coin cost for hints would help.
- **Recall, not just recognition.** Every word is spelled by recognising the right letter among four. An optional
  "type it" or "no sign shown, only the choices" mode would train recall.

## Child safety and accessibility

- **Calm effects switch.** Full-screen white flashes (`flash()`, lightning, mega blast), hit-freeze and camera shake
  can be a lot for sensitive children. Add a "Calm effects" toggle next to Graphics (flash off or very soft, no
  freeze, less shake) and remember it in `localStorage`.
- **Small screens.** `style.css` has no `@media` rules. Touch input works (`touch-action:none`), but portrait phones and
  small tablets have not been checked. Test the HUD, the word list and the wardrobe grid (6 columns) on a narrow screen.
- **Caps Lock / Shift.** `KEYMAP` in `input.js` has `r`, `e`, `q`, `p` but not `R`, `E`, `Q`, `P`, so "hear the word" and
  pause do nothing when Caps Lock is on (`M` and `G` already handle both cases). Easy fix: look up `e.key.toLowerCase()`.
- **Key repeat.** Holding `P` or `Esc` toggles pause quickly. Ignore `e.repeat` for those keys.

## Game design details

- **Hint without a miss.** The correct sign only pulses after two wrong picks in a row. A "?" button that costs a few
  coins could help a child who is stuck but not guessing.
- **Word list rules.** Words are limited to `a-z`, 14 letters (`cleanWord`). Apostrophes, hyphens and accented letters
  are dropped silently. Worth a message, or support for them, if you want other words or languages.
- **Practice score tuning.** The numbers in `buildPool` / `requeueWord` / `wordComplete` (extra turns at score 1 and 3,
  maximum score 5, back after about 3 words, at most twice per game) are a first guess. Watch real play and adjust.

## Code health

- **Global scripts and load order.** All files share one global scope and depend on the order in `index.html`. Fine at this
  size, but ES modules would remove a whole class of load-order bugs. (The reset code also relies on that shared scope.)
- **State machine.** `G.state` is a string checked in many places (`play`, `busy`, `chest`, `pause`, ...) and `G.lock` is a
  second flag next to it. A small explicit state table would make the allowed transitions easier to check.
- **Effects dropped on reset.** When the player quits to hero select, running effect tweens are cancelled, so a few
  materials and textures that those effects would have cleaned up (for example the temporary materials of `shock()` and
  `fxPlane()`, and the boss "Z" textures) stay in memory until the page is reloaded. It is small, but a long session with
  many quits would add up. A cleanup list for temporary materials would fix it.
- **Unhandled rejections in the console.** Fire-and-forget tweens that throw now reject their promise, which the browser logs.
  Harmless, but `run()` or a tiny wrapper could swallow the ones that nobody awaits.
- **Vendoring Babylon.js.** The engine is pinned to `v9.37.1` on the CDN, but still needs the internet the first time. If the
  game should work fully offline, save that file under `spelling-ninja/lib/` and point `index.html` at it (about 9 MB, so
  decide whether it belongs in git).
- **Automated checks.** The word-choice logic (`buildPool`, `makeOptions`, practice scores) is mostly pure and easy to test
  with a few asserts in a small `tests.html` page, with no build step.

## Not verified

- **Auto-pause on hidden tab.** The `visibilitychange` handler in `game.js` could not be exercised in the embedded browser
  used for testing (it never reports a tab as hidden). Please check once in a normal browser: start a game, switch
  to another tab, come back, and the pause screen should be showing.
