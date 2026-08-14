# Test Plan

## 1. Objective & scope

Verify that the Tic-Tac-Toe SUT (`app/index.html`) behaves correctly across its **critical user flows**: authentication, navigation, gameplay, history, profile, settings (theme / language), and persistence. The goal is confidence that a user can register, play, and have their results and preferences tracked correctly.

**In scope:** functional behavior of the features above, driven through the UI, plus the underlying `localStorage` side effects where the UI doesn't surface them (e.g. session cleared on logout).

**Out of scope:** visual/pixel regression, accessibility audit, cross-browser matrix, performance/load, and the app's obfuscated internals. The SUT is treated as a black box.

## 2. Risk-based priorities

| Priority | Meaning | Automated? |
|---|---|---|
| **P0** | On the core loop `register → play → see history → log out`, or a correctness/security check the loop depends on. A failure blocks real use. | Yes |
| **P1** | Important but off the core path, or an edge case. | Selected / documented |
| **P2** | Cosmetic, low-likelihood, or known-broken behavior. | Documented only |

Automation targets **P0 critical flows**; P1/P2 are written up as cases so nothing is lost, and a meaningful slice of P1 is automated where it's deterministic.

## 3. Test areas

| Area | What we check | Priority | Coverage |
|---|---|---|---|
| Auth — register | valid name, empty/whitespace/1-char rejection, duplicate (case-insensitive), name-injection escaping | P0 | automated |
| Auth — login | existing name, case-insensitive lookup, non-existent, empty, logout/login round-trip | P0/P1 | automated |
| Auth — mode switch | switching modes clears the prior error | P1 | automated |
| Navigation | nav renders, each tab switches view, logout clears session | P0 | automated |
| Gameplay — status/board | status transitions, X placement, occupied/thinking cells disabled | P0 | automated |
| Gameplay — AI | computer never overwrites (Easy/Medium) | P0 | automated |
| Gameplay — Hint | disabled while thinking, enabled on human turn | P1 | automated |
| Gameplay — New/Reset | board + status reset | P0 | automated |
| Gameplay — difficulty | pre-move apply, mid-game confirm/cancel, persistence | P0 | automated |
| History | empty state, append on finish, no dup on New Game, columns, order, clear (confirm), per-user scope | P0 | automated |
| Profile | name/created/stats, rename (unique/collision/own-case), delete (confirm), rename XSS | P0 | automated |
| Theme & i18n | toggle applies + persists, language translates + RTL | P0 | automated |
| Persistence | theme/lang/session/users survive reload; in-progress board does not; lands on Play; per-user difficulty | P0 | automated |
| End-to-end | full new-player journey; returning-player persistence | P0 | automated |
| Hard-difficulty defects, 100-row cap, hint quality, over-length names | see EXPLORATION | P1/P2 | documented only |

## 4. Environment & tooling

- **Framework / language:** WebdriverIO + TypeScript + Mocha (one framework, one language, per the brief).
- **Browser:** Chromium (headless locally and in Docker; `HEADED=1` to watch).
- **Two run modes:** host-side (`npm run serve` + `npm test`) for iteration, and fully Dockerized (`npm run docker:test`) for a clean, reproducible run that also produces an **Allure** report.
- **Locators:** `data-testid` only.

## 5. Approach

- **Page Object Model** with shared "section" objects (nav bar, header) and ready-made singletons; specs read as intent.
- **Synchronization** keys off the app's own signals (the `data-status` pill, element state) — never fixed sleeps.
- **Isolation:** each spec resets `localStorage` and reloads in `beforeEach`, so tests are order-independent and parallel-safe.
- **Traceability:** every automated test carries its `TEST-*` id in the title; see `TEST-CASES.md`.

## 6. Assumptions & risks

- The Hard AI is defective (see EXPLORATION BUG-1); its scenarios are **documented, not automated**, to avoid encoding broken behavior as a passing test.
- The computer move is asynchronous; flakiness is mitigated with status-based waits, a generous move timeout, and spec-file retries in CI.
- All state is client-side `localStorage`; there is no backend to seed, so pre-existing accounts are created by writing the `users` map directly.
