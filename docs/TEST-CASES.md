# Test Cases

Detailed, step-by-step cases for the Tic-Tac-Toe suite. Each automated case maps 1:1 to
an `it` title in the specs via its `TEST-NN` id; documented-only cases use `MAN-NN`.

## Conventions

- **IDs** — automated cases carry a flat `TEST-NN` id in the spec's `it` title (traceable
  back to here). Documented-only (manual) cases use `MAN-NN`.
- **Priority** — P0 (critical), P1 (important), P2 (edge / cosmetic / known-broken).
  See `TESTPLAN.md`.
- **Auto** — ✅ automated · 📝 documented only (manual).
- **Preconditions**
  - `PRE-CLEAN` — `localStorage` cleared and the page reloaded; the app sits on the auth
    card, logged out and history-free. Applied by `resetState()` in every spec's
    `beforeEach`.
  - `PRE-USER` — `PRE-CLEAN` followed by registering a fresh user; the app sits on the
    Play view with an empty board and empty history. Applied by `registerAndStart()`.
  - "Seed a user" — a `users` record is written directly to `localStorage` (no UI), used
    to set up login / duplicate / isolation scenarios deterministically.
- **Storage keys** — `users` (map keyed by lowercased name → account record), `session`
  (the signed-in name), plus persisted `theme` / `language` preferences.

---

## Authentication — Register

Spec: `authentication/register.spec.ts` · Precondition for all: **PRE-CLEAN**

### TEST-09 · P0 · ✅ — registers a new player
- **Steps**
  1. On the auth card (register mode), type a valid, unused name (≥ 2 chars).
  2. Submit the form.
- **Expected**
  - App navigates to the **Play** view.
  - The greeting shows the entered name.
  - `localStorage.users` gains an entry keyed by the **lowercased** name.
  - `localStorage.session` is set to the signed-in name.

### TEST-10 · P0 · ✅ — rejects an empty name
- **Steps**
  1. Leave the name field empty.
  2. Submit.
- **Expected**
  - Inline "enter a name" validation error is shown.
  - App stays on the auth card; no `session` / `users` change.

### TEST-07 · P0 · ✅ — rejects a whitespace-only name
- **Steps**
  1. Type only whitespace (e.g. spaces / tabs).
  2. Submit.
- **Expected**
  - Same "enter a name" error as TEST-10 (input is trimmed before validation).
  - App stays on the auth card.

### TEST-08 · P0 · ✅ — rejects a 1-character name
- **Steps**
  1. Type a single character.
  2. Submit.
- **Expected**
  - "at least 2 characters" minimum-length error is shown.
  - App stays on the auth card.

### TEST-11 · P0 · ✅ — rejects a duplicate name
- **Precondition** — seed a user, e.g. `Alice`.
- **Steps**
  1. Attempt to register that name in its original casing, then again UPPERCASE, then
     again lowercase.
- **Expected**
  - Each attempt is rejected as "already taken" (matching is case-insensitive).
  - No second `users` record is created; app stays on the auth card.

### TEST-12 · P0 · ✅ — renders an injection payload as text, never markup
- **Steps**
  1. For each XSS probe payload (e.g. `<img onerror>`, `<script>`, quote-breakers):
     register it as the name.
- **Expected**
  - The greeting renders the payload as **literal text** — no element is injected.
  - The XSS probe sentinel `window.__xss` stays `0` for every payload.

---

## Authentication — Login

Spec: `authentication/login.spec.ts` · Precondition for all: **PRE-CLEAN**

### TEST-01 · P0 · ✅ — logs in with an existing name
- **Precondition** — seed a user.
- **Steps**
  1. Switch to sign-in mode; type the exact stored name.
  2. Submit.
- **Expected**
  - App lands on **Play**, greeting the user by name.

### TEST-02 · P1 · ✅ — matches login case-insensitively, keeping stored casing
- **Precondition** — seed a user `name`.
- **Steps**
  1. Sign in with `name.toUpperCase()`.
- **Expected**
  - Login succeeds.
  - The greeting shows the **originally stored** casing (not what was typed).
  - No duplicate `users` record is created.

### TEST-03 · P0 · ✅ — rejects a non-existent name
- **Steps**
  1. Sign in with a name that has no account.
- **Expected**
  - "no account" error is shown; app stays on the auth card.

### TEST-04 · P0 · ✅ — rejects an empty / whitespace name
- **Steps**
  1. Submit sign-in with empty or whitespace-only input.
- **Expected**
  - "enter a name" error; app stays on the auth card.

### TEST-05 · P1 · ✅ — logs out and back in without duplicating the account
- **Steps**
  1. Register a new user (now on Play).
  2. Log out → back on the auth card.
  3. Sign in again with the same name.
- **Expected**
  - App returns to **Play**; session restored.
  - `users` still holds **exactly one** record for that name.

### MAN-01 · P1 · 📝 — over-length name
- **Steps** — sign in with a 500-character name.
- **Expected** — the app should reject over-length input. **Currently no maximum is
  enforced** (see `EXPLORATION.md`); documented, not automated.

---

## Authentication — Mode switching

Spec: `authentication/mode-switching.spec.ts` · Precondition: **PRE-CLEAN**

### TEST-06 · P1 · ✅ — clears the error when switching auth mode
- **Steps**
  1. In register mode, submit empty → validation error appears.
  2. Click the mode-switch link (register ⇄ sign-in).
- **Expected**
  - The previously shown error is cleared on mode switch.

### MAN-02 · P2 · 📝 — name field autofocus
- **Expected** — on each auth render the name field is focused. Documented, not automated.

---

## Navigation

Spec: `navigation.spec.ts` · Precondition for all: **PRE-USER**

### TEST-39 · P0 · ✅ — shows the nav bar with all entries after login
- **Expected** — after login the nav bar shows the **Play / Profile / History** tabs plus
  the avatar, greeting, and **Log Out** control.

### TEST-40 · P0 · ✅ — switches view and updates active state per nav item
- **Steps**
  1. Click each nav tab in turn.
- **Expected**
  - The matching view is shown for each tab.
  - The clicked item is marked **active** (and only it).

### TEST-41 · P0 · ✅ — clears session and returns to the auth card on log out
- **Steps**
  1. Click **Log Out**.
- **Expected**
  - `localStorage.session` is cleared; app returns to the auth card.
  - The `users` record is **preserved**.

---

## Gameplay — Status pill

Spec: `gameplay/status-pill.spec.ts` · Precondition for all: **PRE-USER**

### TEST-35 · P0 · ✅ — starts on "Your turn (X)"
- **Expected** — on a fresh game the status pill reports `data-status = your-turn` and its
  text matches /your turn/i.

### TEST-36 · P0 · ✅ — transitions human → computer-thinking → human
- **Steps**
  1. Play one human move.
  2. Wait for the computer's turn to start and finish (synchronize on the status pill,
     never a fixed pause).
- **Expected**
  - Status passes through `computer-thinking` and returns to `your-turn`.

---

## Gameplay — Board interactions

Spec: `gameplay/board.spec.ts` · Precondition for all: **PRE-USER**

### TEST-23 · P0 · ✅ — places X on an empty cell
- **Steps** — click each empty cell (`cell-0`…`cell-8`) in a fresh game.
- **Expected** — the clicked cell shows `X`.

### TEST-24 · P0 · ✅ — disables an occupied cell
- **Steps** — play a cell, then inspect it.
- **Expected** — the played cell is **disabled** and keeps its `X` (no re-click / overwrite).

### TEST-25 · P0 · ✅ — disables all cells while the computer is thinking
- **Steps** — play a move; while `computer-thinking` is active, inspect the board.
- **Expected** — **every** cell is disabled during the computer's turn.

---

## Gameplay — Computer opponent

Spec: `gameplay/computer-ai.spec.ts` · Precondition: **PRE-USER**

### TEST-26 · P0 · ✅ — never plays into an occupied cell (easy & medium)
- **Steps**
  1. For difficulty **easy** and then **medium**: play several human moves, letting the
     computer respond each time.
  2. After each computer move, snapshot the board.
- **Expected**
  - The computer **never** alters an already-filled cell on easy or medium.

### MAN-03 · P1 · 📝 — Hard must not overwrite a played cell
- **Expected** — on **Hard** the computer must not overwrite a played cell. **Currently
  fails** (EXPLORATION BUG-1: Hard is the weakest level and can overwrite). Documented,
  not automated.

---

## Gameplay — Hint

Spec: `gameplay/hint.spec.ts` · Precondition for all: **PRE-USER**

### TEST-31 · P1 · ✅ — is disabled while the computer is thinking
- **Steps** — play a move; during `computer-thinking`, inspect the Hint button.
- **Expected** — Hint is **disabled** while the computer is thinking.

### TEST-32 · P1 · ✅ — is enabled on the human turn during an active game
- **Steps** — with an active game and the human to move, inspect the Hint button.
- **Expected** — Hint is **enabled**.

---

## Gameplay — New Game & Reset

Spec: `gameplay/new-game-reset.spec.ts` · Precondition for all: **PRE-USER**

### TEST-33 · P0 · ✅ — clears the board and resets status on New Game
- **Steps**
  1. Choose difficulty **easy**; make a move.
  2. Click **New Game**.
- **Expected**
  - Board is fully cleared (no non-empty cells).
  - Status returns to `your-turn`.
  - The selected difficulty (**easy**) is retained.

### TEST-34 · P0 · ✅ — resets the board like New Game
- **Steps**
  1. Choose difficulty **medium**; make a move.
  2. Click **Reset**.
- **Expected** — identical outcome to TEST-33: board cleared, status `your-turn`,
  difficulty (**medium**) retained. (Reset and New Game are behaviorally equivalent; only
  the trigger differs.)

---

## Gameplay — Difficulty selector

Specs: `gameplay/difficulty-selector.spec.ts`, `persistence.spec.ts` · Precondition: **PRE-USER**

### TEST-27 · P0 · ✅ — applies a pre-move change immediately
- **Steps** — before making any move, change the difficulty dropdown.
- **Expected**
  - The change applies immediately (no confirm prompt).
  - The board stays empty; status is unchanged (`your-turn`).

### TEST-28 · P0 · ✅ — clears the board with the new difficulty when a mid-game change is confirmed
- **Steps**
  1. Make a move (game now in progress).
  2. Change difficulty → a confirm dialog appears; click **OK**.
- **Expected** — the board clears and the new difficulty is in effect.

### TEST-29 · P0 · ✅ — keeps the board and reverts the dropdown when a mid-game change is cancelled
- **Steps**
  1. Make a move.
  2. Change difficulty → confirm dialog; click **Cancel**.
- **Expected** — the board is kept intact; the dropdown reverts to the previous difficulty.

### TEST-30 · P0 · ✅ — persists a difficulty change to the user record
- **Steps** — change difficulty, then reload the page.
- **Expected** — the chosen difficulty persists (stored on the user record).

### TEST-44 · P0 · ✅ — keeps difficulty on the user record across re-login
- **Location** — `persistence.spec.ts` (paired with the pre-move change of TEST-27).
- **Steps** — set a difficulty, log out, log back in.
- **Expected** — the difficulty survives the logout/login round-trip.

---

## History

Spec: `gameHistory.spec.ts` · Precondition for all: **PRE-USER** (unless noted)

### TEST-15 · P0 · ✅ — shows the empty state for a fresh user
- **Expected** — a fresh user sees the empty state: 0 history rows and **no** Clear button.

### TEST-16 · P0 · ✅ — records nothing when Reset is used before game-end
- **Steps** — make one move, then Reset before the game ends; open History.
- **Expected** — nothing is recorded (0 rows).

### TEST-17 · P0 · ✅ — appends one row when a game finishes
- **Steps** — play a game to completion; open History.
- **Expected** — **exactly one** row is appended.

### TEST-18 · P0 · ✅ — does not duplicate the previous entry on New Game
- **Steps** — finish a game, then click New Game; open History.
- **Expected** — still **one** row (starting a new game does not re-log the finished one).

### TEST-19 · P0 · ✅ — reflects actual game data in the row columns
- **Steps** — finish a game at a known difficulty/result; open History.
- **Expected** — the row's **difficulty** and **result** columns match the actual game;
  the **date** column is non-empty.

### TEST-20 · P0 · ✅ — lists the newest entry first
- **Steps** — play two games; open History.
- **Expected** — the newest game appears in the **first** row (descending order).

### TEST-21 · P0 · ✅ — keeps entries on Cancel and clears them on OK
- **Steps**
  1. With ≥ 1 row present, click **Clear History** → confirm dialog; **Cancel**.
  2. Click **Clear History** again → confirm; **OK**.
- **Expected** — Cancel keeps all rows; OK empties the table.

### TEST-22 · P1 · ✅ — preserves another user's history and profile when one user clears theirs
- **Precondition** — two users, each with their own history (seeded).
- **Steps** — as user B, clear history.
- **Expected** — user A's history **and** profile stats are untouched.

### MAN-04 · P1 · 📝 — locale-aware date column
- **Expected** — the date column follows the active locale (Gregorian for `en`;
  Jalali/Persian digits for `fa`). Documented, not automated.

### MAN-05 · P1 · 📝 — 100-row cap
- **Expected** — the table should cap at 100 rows. **Currently fails**: 101 seeded rows
  all render (EXPLORATION BUG-2). Documented, not automated.

---

## Profile

Spec: `userProfile.spec.ts` · Precondition for all: **PRE-USER** (unless noted)

### TEST-48 · P0 · ✅ — displays the current name, Created date, and zeroed stats
- **Steps** — open the Profile view.
- **Expected** — shows the current name, a **Created** date, and zeroed stats
  (`wins = losses = draws = 0`).

### TEST-49 · P0 · ✅ — renames to a new unique name
- **Steps** — edit the username to a new, unused name; save.
- **Expected**
  - Rename succeeds.
  - The greeting and the `users` key update to the new name; the old key is **gone**.

### TEST-50 · P1 · ✅ — renames to its own name in a different case
- **Steps** — rename to the current name but in a different case (e.g. `Alice` → `ALICE`).
- **Expected** — succeeds (no self-collision); still exactly **one** account.

### TEST-51 · P0 · ✅ — rejects a rename to an existing other user
- **Precondition** — a second user exists (seeded).
- **Steps** — rename to a name that other user owns.
- **Expected** — rejected with "already uses this name"; the greeting is unchanged.

### TEST-52 · P0 · ✅ — does not execute injected markup / XSS in a renamed name
- **Steps** — rename to each XSS probe payload.
- **Expected** — the payload is escaped as **text** everywhere it renders;
  `window.__xss` stays `0`.

### TEST-53 · P0 · ✅ — keeps the account on Cancel and removes it on confirmed Delete
- **Steps**
  1. Click **Delete Account** → confirm dialog; **Cancel**.
  2. Click **Delete Account** again → confirm; **OK**.
- **Expected**
  - Cancel keeps the user.
  - OK removes the `users` record; a subsequent login with that name **fails**.

### MAN-06 · P1 · 📝 — live stats update
- **Expected** — after a win / loss / draw, the profile stats update without a reload.
  Documented, not automated.

---

## Theme

Spec: `theme.spec.ts`

### TEST-46 · P0 · ✅ — updates the active theme synchronously on toggle
- **Precondition** — PRE-CLEAN (auth card).
- **Steps**
  1. Confirm the document starts in **light** (`data-theme = light`); note the toggle
     button's label.
  2. Click the theme toggle.
  3. Click it again.
- **Expected**
  - After the first toggle: `data-theme = dark` **synchronously**, and the toggle button's
    own label changes (it tracks the active theme).
  - After the second toggle: back to `light`.

### TEST-47 · P0 · ✅ — persists across reload, logout, and user switch
- **Precondition** — PRE-USER.
- **Steps**
  1. Toggle to **dark**.
  2. Hard-reload the page.
  3. Log out (back on auth card).
  4. Register a brand-new user.
- **Expected** — `data-theme = dark` after every step: reload, logout, and the new user all
  inherit the persisted theme (it is a global preference, not per-session).

---

## Localization

Spec: `localization.spec.ts` · Precondition: **PRE-USER**

### TEST-38 · P0 · ✅ — translates labels and switches document direction to RTL
- **Steps** — use the language selector to switch to `fa`.
- **Expected**
  - UI labels are translated.
  - The document direction becomes `dir="rtl"`.

---

## Header

Spec: `header.spec.ts` · Precondition: **PRE-USER**

### TEST-37 · P0 · ✅ — shows header controls on every authenticated view
- **Steps** — starting on Play, then visiting Profile, History, and back to the game:
- **Expected** — the **language selector** and **theme toggle** are visible on **every**
  authenticated view.

---

## Persistence

Spec: `persistence.spec.ts` · Precondition for all: **PRE-USER**

### TEST-42 · P0 · ✅ — lands on Play view after reload regardless of prior view
- **Steps** — navigate to any view (e.g. Profile or History), then reload.
- **Expected** — the app lands on **Play** after reload.

### TEST-43 · P0 · ✅ — drops the in-progress game board on reload
- **Steps** — start a game (make a move), then reload.
- **Expected** — the in-progress board is **not** restored (a fresh board is shown).

### TEST-45 · P0 · ✅ — keeps theme, language, session, and users across reload
- **Steps** — set a theme and language, play a game, then reload.
- **Expected** — theme, language, `session`, and `users` records **all survive** the reload.

_(TEST-44 — difficulty across re-login — also lives in this spec; see the Difficulty section.)_

---

## End-to-end

Spec: `e2e.spec.ts` · Precondition for all: **PRE-CLEAN**

### TEST-13 · P0 · ✅ — registers, wins on Easy, loses on Medium, reviews history, logs out
- **Steps**
  1. Register a new user.
  2. Win a game on **Easy**.
  3. Lose a game on **Medium**.
  4. Open History and review the two rows.
  5. Check the profile stats.
  6. Log out.
- **Expected**
  - History shows two rows matching the two games (newest first).
  - Stats reflect one win and one loss.
  - Log out clears the `session`; the `users` record is kept.

### TEST-14 · P0 · ✅ — persists preferences and account across a logout
- **Steps**
  1. Register a user; set **dark** theme, **fa** language, **medium** difficulty.
  2. Finish a game.
  3. Log out, then log back in with the same name.
- **Expected**
  - Theme, language, difficulty, and history are all persisted across the logout/login.

---

## Coverage summary

- **Automated:** 53 tests across 17 spec files (all P0 flows plus the deterministic P1s
  above).
- **Documented, not automated:** MAN-01 (over-length name), MAN-02 (autofocus),
  MAN-03 (Hard overwrite bug), MAN-04 (locale date), MAN-05 (100-row cap bug),
  MAN-06 (live stats) — either known-broken behavior or edges not worth the automation
  cost within the time box.
