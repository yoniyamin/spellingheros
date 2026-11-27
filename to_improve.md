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
- **Difficulty.** Levels now add word twists (look-cover-spell from level 2, mystery words without a picture from level 3).
  Still open: more confusable letters on later levels, or switching off the automatic hint after two misses.
- **Guessing is no longer free.** Wrong letters and timeouts cost lives (3 per boss round) and the word is said again
  after every choice. Still open: watch real play to see whether 3 lives / 20 seconds suit the child, and whether a
  speed bonus (fast answers earn extra coins) or a coin cost for hints would help.
- **Recall, not just recognition.** Every word is spelled by recognising the right letter among four. An optional
  "type it" or "no sign shown, only the choices" mode would train recall.

## Child safety and accessibility

- **Calm effects switch.** Full-screen white flashes (`flash()`, lightning, mega blast), hit-freeze and camera shake
  can be a lot for sensitive children. Add a "Calm effects" toggle next to Graphics (flash off or very soft, no
  freeze, less shake) and remember it in `localStorage`.
- **Phones: test on a real device.** The layout was checked in an emulated 844 x 390 (iPhone held sideways) and 375 x 812 screen,
  but not on a real iPhone: please check speech (first tap), sound with the silent switch on, "Add to Home Screen", and
  how smooth it runs. Upright play ("Play like this anyway") works but is small; a real portrait layout (signs in a 2 x 2
  grid) would be a bigger change.

## Game design details

- **Hint without a miss.** The correct sign only pulses after two wrong picks in a row. A "?" button that costs a few
  coins could help a child who is stuck but not guessing.
- **Word list rules.** Words are limited to `a-z`, 14 letters (`cleanWord`). Apostrophes, hyphens and accented letters
  are dropped silently. Worth a message, or support for them, if you want other words or languages.
- **Practice score tuning.** The numbers in `buildPool` / `requeueWord` / `wordComplete` / `recordWord` (extra turns at score 1 and 3,
  maximum score 5, back after about 3 words, at most twice per game, pool weight `1 + 1.5 x score`, look-cover-spell from score 2)
  are a first guess. Watch real play and adjust. The new power-ups, missions and twist chances (`POWER_FILL`, `TWIST`) too.
- **Music by ear.** The four new place songs (forest, candy, snow waltz, pirate jig) and the reworked sound effects were checked to
  run without errors, but should be listened to and balanced (`mix` and `rev` per song in `SONGS`).

## Code health

- **Global scripts and load order.** All files share one global scope and depend on the order in `index.html`. Fine at this
  size, but ES modules would remove a whole class of load-order bugs. (The reset code also relies on that shared scope.)
- **State machine.** `G.state` is a string checked in many places (`play`, `busy`, `chest`, `pause`, ...) and `G.lock` is a
  second flag next to it. A small explicit state table would make the allowed transitions easier to check.
- **Box-built bosses.** The homework monster is ~25 meshes (about 45 draw calls with outlines); the model bosses are far fewer.
  Its static parts could go through `bakeNode()` like the hero accessories, if level 1 ever needs to be faster.
- **Effects dropped on reset.** When the player quits to hero select, running effect tweens are cancelled, so a few
  materials and textures that those effects would have cleaned up (for example the temporary materials of `shock()` and
  `fxPlane()`, and the boss "Z" textures) stay in memory until the page is reloaded. It is small, but a long session with
  many quits would add up. A cleanup list for temporary materials would fix it.
- **Unhandled rejections in the console.** Fire-and-forget tweens that throw now reject their promise, which the browser logs.
  Harmless, but `run()` or a tiny wrapper could swallow the ones that nobody awaits.
- **Vendoring Babylon.js.** The engine is pinned to `v9.37.1` on the CDN, but still needs the internet the first time. If the
  game should work fully offline, save that file under `lib/` and point `index.html` at it (about 9 MB, so
  decide whether it belongs in git).
- **Automated checks.** The word-choice logic (`buildPool`, `makeOptions`, practice scores) is mostly pure and easy to test
  with a few asserts in a small `tests.html` page, with no build step.

## Not verified

- **Auto-pause on hidden tab.** The `visibilitychange` handler in `game.js` could not be exercised in the embedded browser
  used for testing (it never reports a tab as hidden). Please check once in a normal browser: start a game, switch
  to another tab, come back, and the pause screen should be showing.
