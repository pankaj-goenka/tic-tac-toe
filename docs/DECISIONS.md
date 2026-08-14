# Design Notes (optional)

Short rationale for the main choices. Optional per the brief — included for context.

## Framework & language
**WebdriverIO + TypeScript + Mocha.** WebdriverIO gives a clean async API and `expect-webdriverio` matchers with built-in auto-waiting, which suits an app whose opponent moves asynchronously. TypeScript adds safety around the page-object layer; Mocha is a light, familiar runner. One framework, one language, as the brief requires.

## Locator strategy
`data-testid` **only**. The SUT exposes a stable testid on essentially every interactive element, so there's no need for brittle CSS/XPath. All locating funnels through a single `byTestId` helper.

## Layered architecture
- **Page objects** (`board`, `login`, `profile`, `history`) + shared **sections** (nav bar, header), each exporting a ready-made **singleton** so specs import behavior directly instead of constructing objects.
- **`act`** wraps every element interaction (click / fill / read / wait) and **`verify`** wraps every assertion — so *how* we touch the UI and *how* we assert live in one place each, and specs read as intent.
- Helpers are grouped by mechanism: `dom` (locate + interact), `assertions` (`verify`), `browser` (localStorage / session / `window.confirm`), `util` (game-driving routines + data builders), `injectionData` (XSS payloads + probe).

## Synchronization
No fixed sleeps. Waits key off the app's own signals — chiefly the status pill's `data-status` (`your-turn` / `computer-thinking` / terminal) and element display/enabled state. The computer's ~1.5 s reply is waited out on status, with a generous timeout so parallel-worker CPU contention doesn't cause false timeouts.

## State isolation
Every spec clears `localStorage` and reloads in `beforeEach`, so tests are independent and safe to run in parallel. Pre-existing accounts are seeded by writing the `users` map directly (there's no backend). Native `window.confirm` dialogs are handled by stubbing `window.confirm` before the click, which is more reliable than driving the real dialog.

## Handling the Hard-difficulty bug
The Hard opponent is defective (it can overwrite the player's cell — EXPLORATION BUG-1). I deliberately **did not automate** its scenarios: a test asserting correct behavior would fail on the current build, and asserting the *broken* behavior would flip red the day it's fixed. Instead it's captured as documented cases (MAN-03) plus the exploration notes, which is the right home for a known defect.

## Execution & reporting
Two entry points: host-side (`npm run serve` + `npm test`) for fast iteration, and a fully Dockerized run (`npm run docker:test`) that bundles Chromium + chromedriver, runs the suite against an nginx-served copy of the app over a private network, and generates an **Allure** report inside the container — a clean, reproducible one-command entry point.
