# Exploratory Testing Notes

**SUT:** `app/index.html` — a self-contained Tic-Tac-Toe web app (HTML + CSS + JS, no network calls; all state in `localStorage`).
**Method:** black-box exploration in Chromium, driving the app by hand and inspecting the DOM / `localStorage` as I went.

The app is unusually test-friendly: almost every interactive element carries a stable `data-testid`, which I used throughout.

---

## Feature map

### 1. Authentication (`auth-form`)
- Single **username-only** form with two modes — **Register** (`btn-register`) and **Sign in** (`btn-login`) — toggled by a link (`btn-switch-mode`). The mode is exposed on the form's `data-mode` attribute.
- Validation observed:
  - Empty / whitespace-only name → inline error "Please enter a name." (`auth-error`).
  - 1-character name → "at least 2 characters" error (minimum length is 2).
  - Register with an existing name → "already taken" (the check is **case-insensitive**).
  - Sign in with a non-existent name → "No account…".
- **Case-insensitive login:** registering `Sara` and signing in as `SARA` or `sara` both succeed, and the greeting always shows the **stored** casing (`Sara`). No duplicate account is created.
- **Switching mode clears the current error** (the `auth-error` element is removed from the DOM).
- **XSS:** entering an injection payload as a name (e.g. `<script>window.__xss=1</script>`) is **escaped and rendered as literal text** in the greeting/profile/history — it never executes.

### 2. Navigation (`nav`)
- After login the nav bar shows **Play / Profile / History** tabs plus **Log Out**, an avatar, and a greeting (`hello-user`).
- Each tab switches the visible view (`view-play` / `view-profile` / `view-history`) and marks itself active.
- **Log Out** clears the `ttt:session` key and returns to the auth card; the user record itself is retained.

### 3. Gameplay (`view-play`)
- 3×3 board (`cell-0`…`cell-8`), a **status pill** (`status`, with a `data-status` attribute), a **difficulty** dropdown (`select-difficulty`: easy / medium / hard), and **Hint** / **New Game** / **Reset** buttons.
- The human is always **X** and moves first. `data-status` cycles: `your-turn` → `computer-thinking` → back to `your-turn`, or to a terminal `human` / `computer` / `draw`.
- The computer replies quickly (≈1–1.5 s); the status pill is the reliable synchronization signal.
- A played cell is **disabled**; all cells are disabled while the computer is thinking.
- **New Game** and **Reset** both clear the board and return the status to "Your turn", keeping the selected difficulty.
- **Difficulty change mid-game** raises a native `window.confirm`: OK clears the board with the new difficulty, Cancel keeps the board and reverts the dropdown.

### 4. History (`view-history`)
- Table of past finished games with **date, difficulty, result** columns; empty state (`history-empty`) for a fresh user; **newest entry first**.
- Only **finished** games are recorded — abandoning via Reset/New Game before the end records nothing.
- **Clear History** raises a `window.confirm` (Cancel keeps rows, OK empties). Clearing is **scoped to the acting user** — another user's history and stats are untouched.

### 5. Profile (`view-profile`)
- Shows the current name, a **Created** date, and win/loss/draw stats (`profile-wins` / `profile-losses` / `profile-draws`).
- **Rename**: to a new unique name succeeds; to a name already owned by another user is rejected ("already uses this name"); to your **own name in a different case** succeeds (no self-collision). XSS payloads are escaped, as in auth.
- **Delete Account** raises a `window.confirm`; OK removes the user record and returns to auth (login then fails), Cancel is a no-op.

### 6. Settings — Header (`select-language`, `btn-theme`)
- **Language** toggle **en / fa**; switching to `fa` translates labels and flips the document to **RTL** (`document.documentElement.dir = "rtl"`, `lang = "fa"`).
- **Theme** toggle **light / dark**, reflected on `document.documentElement[data-theme]` and the button label.
- Both controls are present on **every** view and both **persist across reload** (and logout / user switch, since they're global prefs).

### 7. Persistence & storage model
- `localStorage` keys are all `ttt:`-prefixed: `ttt:session`, `ttt:users`, `ttt:theme`, `ttt:lang`.
- `ttt:users` is a map keyed by the **lowercased** display name; each record holds `name`, `createdAt`, `difficulty`, and a `history` array.
- Survives reload: theme, language, session, user records, and the per-user difficulty. **Does not** survive reload: an in-progress board (a reload always lands back on **Play**).

---

## Bugs & quirks found

- **BUG-1 — Hard difficulty overwrites the human's move (reproduced).** On `hard`, clicking an empty cell can result in that cell holding the **computer's** `o` with the human's `x` gone entirely (observed: after a single human click on `cell-0`, the board showed `cell-0 = o`, X-count = 0). The Hard opponent is inconsistent — in another game it blocked threats and completed its own line to win, so it isn't simply "weak", it's **unreliable / illegal-move-prone**. Severity: high (breaks a core game rule). Easy and Medium never do this.
- **BUG-2 — History table is not capped.** Seeding a user's `history` with 101 entries and reloading renders **all 101** rows; there is no visible 100-row (or any) cap.
- **Hint quality.** Hint is available on the human's turn and disabled during "computer thinking", but the suggestion is not always the strongest move — it reads as non-strategic.
- **Over-length names.** There's a minimum length (2) but no obvious maximum; very long names are accepted on both register and profile rename.

These informed the plan: the reliable Easy/Medium behaviors are automated as critical flows, while the Hard-difficulty defects are captured as **documented-but-not-automated** cases (automating a known-broken behavior would either rot as a skip or encode the bug as a passing regression).
