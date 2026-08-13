# Tic-Tac-Toe — End-to-End QA Automation

A personal project I built to practice a full end-to-end QA automation workflow against a real browser application. The System Under Test is the Tic-Tac-Toe app in `app/index.html`, and the entire testing pipeline is wired around it — runnable locally or fully containerized, with Allure reporting.

I picked **WebdriverIO + TypeScript** as the automation stack, with **Mocha** as a lightweight runner and `expect-webdriverio` for browser-aware assertions.

---

## Repository layout

The folder naming is deliberate: `app/` is the thing under test, `src/` is the test framework I wrote.

```text
.
├── app/
│   └── index.html          # System Under Test (SUT) — do not modify
├── src/
│   ├── pages/              # Page objects + shared sections (nav bar, header)
│   │   └── sections/
│   ├── helpers/            # dom / assertions / browser / util / injectionData
│   └── specs/              # WebdriverIO + Mocha specs
├── Dockerfile.app          # nginx image serving app/ on port 8080
├── Dockerfile.tests        # Node 22 + Chromium + chromedriver + WDIO
├── compose.yml             # Docker Compose services: app and tests
├── wdio.conf.ts            # WebdriverIO configuration
└── tsconfig.json           # TypeScript configuration; noEmit
```

Every automated spec keeps its `TC-*` id in the `it` title (e.g. `... [TC-REG-01]`), so coverage stays traceable.

---

## Running the tests

Two ways to run, depending on what I need:

- **Host-side** — fast iteration.
- **Dockerized** — a clean, reproducible run on a fresh machine.

### Host-side

Serve the app in one terminal:

```bash
npm run serve
```

and drive the tests from another:

```bash
npm test
```

By default WebdriverIO targets `http://localhost:8080`; the base URL is configurable through `WDIO_BASE_URL`. Use `HEADED=1 npm test` to watch it run, and `-- --spec src/specs/<name>.spec.ts` to run a single spec.

### Dockerized

Needs Docker Desktop or a compatible engine:

```bash
npm run docker:test
```

That single command builds the test image, brings the app up, waits on its healthcheck, runs WebdriverIO against Chromium, generates the Allure report **inside the container**, and mounts the result out to `./allure-report/` before tearing the test container down. Because Java ships inside the image, none is needed on the host.

View the report:

```bash
npx http-server ./allure-report -o
```

---

## npm scripts

| Command | What it does |
|---|---|
| `npm run serve` | Serves the app at `http://localhost:8080` and opens the browser. |
| `npm test` | Runs the WebdriverIO suite against `WDIO_BASE_URL`. |
| `npm run typecheck` | Type-checks the project with `tsc --noEmit`. |
| `npm run lint` / `lint:fix` | Lints `src/` and the WDIO config with ESLint 9. |
| `npm run format` / `format:check` | Prettier 3 (the app source and Markdown are ignored). |
| `npm run allure:generate` / `allure:open` / `allure:serve` | Build / open / serve an Allure report (needs Java). |
| `npm run docker:up` / `docker:down` | Start / stop the Compose app container. |
| `npm run docker:test` | The full Dockerized WDIO run + Allure report. |

---

## Design choices

I organized the test code into page objects, shared sections, and reusable helpers so the specs read as intent:

- **Page objects & sections** — `BoardPage` (`board.page.ts`), `LoginPage` (`login.page.ts`), `ProfilePage`, `HistoryPage`, plus shared sections `NavBarSection` and `HeaderSection`. Each also exports a ready-made **singleton** (`game`, `login`, `profile`, `history`, `navBar`, `header`) that specs import directly instead of constructing.
- **`helpers/`** (five files):
  - `dom.helper.ts` — `byTestId` (locate) + `act` (click / fill / read / wait).
  - `assertions.helper.ts` — `verify`, the shared element and value assertions.
  - `browser.helper.ts` — browser-state helpers: localStorage read/seed, the session lifecycle (`resetState`, `registerAndStart`), and `window.confirm` control.
  - `util.helper.ts` — the game-driving routines (`playGame`, `playWinningGame`, …) plus small utilities (`makeUsername`, `escapeForRegex`).
  - `injectionData.helper.ts` — XSS payloads and the probe that detects execution.

The app exposes a stable `data-testid` on nearly every interactive element (`cell-0`, `board`, `status`, `btn-new`, `btn-hint`, `btn-reset`, `select-difficulty`, …), which is the primary locator strategy.

The suite covers the critical flows: `authentication`, `gameHistory`, `userProfile`, `localization`, `gamePlay`, `navigation`, `theme`, `header`, `persistence`, and an `e2e` journey.

### Docker Compose

The containerized run is two services:

```text
┌───────────────┐        ┌───────────────┐
│      app      │  net   │     tests     │
│   nginx :8080 │◄──────►│  WebdriverIO  │
│               │        │  Chromium     │
└───────────────┘        └───────────────┘
```

Chromium and chromedriver are bundled straight into the `tests` container — no Selenium Grid, no browser/driver installed on the host — and the run is gated behind the app's healthcheck so tests never start early.

---

## What this project shows

A hands-on end-to-end QA workflow: automated coverage with WebdriverIO + TypeScript, a layered page-object / helper design, Dockerized reproducible execution, quality gates (`typecheck` + `lint` + `format:check`), and Allure reporting. The fastest way to see it work is a single `npm run docker:test`.
