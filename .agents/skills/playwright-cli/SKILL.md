---
name: playwright-cli
description: >-
  Cheatsheet for running Playwright CLI commands in the pharmacy-playwright-ts
  project. Covers test running, debugging, codegen, trace viewer, and report
  generation. Activate when asked to run tests, debug failures, record actions,
  or view reports.
---

# Playwright CLI — pharmacy-playwright-ts

## Project Root
All commands must be run from:
```
/Users/codeclouds-sayan/Downloads/pharmacy-playwright-ts
```

---

## 1. Running Tests

### Run all tests
```bash
npm test
# or
npx playwright test
```

### Run by suite
```bash
npm run test:smoke       # tests/smoke/
npm run test:regression  # tests/regression/
npm run test:edge        # tests/edge/
```

### Run by browser
```bash
npm run test:chromium    # --project=chromium
npm run test:firefox     # --project=firefox
npm run test:webkit      # --project=webkit
```

### Run a single spec file
```bash
npx playwright test tests/smoke/product-checkout.smoke.spec.ts
```

### Run a specific test by title (grep)
```bash
npx playwright test --grep "Tirzepatide"
npx playwright test --grep "@smoke"
```

### Run headed (visible browser window)
```bash
npm run test:headed
# or
npx playwright test --headed
```

### Run in debug mode (Playwright Inspector)
```bash
npm run test:debug
# or
npx playwright test --debug
```

### Retry only failed tests
```bash
npm run test:failed
# or
npx playwright test --last-failed
```

### Run with Playwright UI Mode
```bash
npm run test:ui
# or
npx playwright test --ui
```

### Control parallelism
```bash
npx playwright test --workers=1   # sequential
npx playwright test --workers=4   # 4 parallel workers
```

---

## 2. Code Generation (Codegen)

Record user actions and generate Playwright TypeScript code:

```bash
npm run test:codegen
# which is:
npx playwright codegen https://the-pharmacy-place.webflow.io
```

### Codegen with specific browser
```bash
npx playwright codegen --browser=firefox https://the-pharmacy-place.webflow.io
```

### Codegen with saved storage state (authenticated session)
```bash
npx playwright codegen --load-storage=state.json https://the-pharmacy-place.webflow.io
```

---

## 3. Trace Viewer

View a failed test's trace:
```bash
npm run test:trace-viewer
# which is:
npx playwright show-trace
```

Open a specific trace file:
```bash
npx playwright show-trace reports/test-results/<test-name>/trace.zip
```

---

## 4. Reports

### Open HTML report
```bash
npm run report
# which is:
npx playwright show-report reports/html
```

### Generate + open Allure report
```bash
npm run allure:generate   # generate from allure-results
npm run allure:open       # open in browser
```

---

## 5. TypeScript Check

Verify the project compiles cleanly (no TS errors):
```bash
npm run typecheck
# which is:
npx tsc --noEmit
```

---

## 6. MCP Server

Start the Playwright MCP server for AI agent use:
```bash
npm run mcp:server
# which is:
playwright-mcp --port 3001
```

---

## 7. Clean Reports

Remove generated test artefacts:
```bash
npm run clean
```

---

## Environment Variables

All env vars live in `.env` at the project root. Key variables:

| Variable | Purpose |
|---|---|
| `BASE_URL` | Target site (default: `https://the-pharmacy-place.webflow.io`) |
| `TEST_FIRST_NAME` | Checkout first name |
| `TEST_LAST_NAME` | Checkout last name |
| `TEST_SHIPPING_ADDRESS` | Checkout address |
| `TEST_CITY` | Checkout city |
| `TEST_STATE` | Checkout state |
| `TEST_ZIP` | Checkout zip code |
| `TEST_PHONE` | Checkout phone |
| `TEST_CARD_NUMBER` | Stripe test card |
| `TEST_CARD_EXPIRY` | Card expiry (MM/YY) |
| `TEST_CARD_CVV` | Card CVV |
| `WORKERS` | Playwright worker count (blank = auto) |

---

## Project Test Architecture

```
tests/
  smoke/        product-checkout.smoke.spec.ts   ← full happy-path flow
  regression/   product.regression.spec.ts
  edge/         checkout-validation.edge.spec.ts

src/
  config/       environment.ts      ← reads .env vars
  data/         product-data.ts     ← tirzepatide / semaglutide config
  fixtures/     test-fixture.ts     ← page objects + route mocks
  models/       *.model.ts          ← TypeScript interfaces
  pages/        *.page.ts           ← Page Object Model
  utils/        test-data.ts        ← checkout + questionnaire data
                logger.ts           ← pino structured logger
```

## Common Debugging Patterns

### Slow down actions for debugging
```bash
PWDEBUG=1 npx playwright test tests/smoke --headed
```

### Keep browser open after test completes
Add to `playwright.config.ts` temporarily:
```ts
use: { launchOptions: { slowMo: 500 } }
```

### Capture a screenshot on demand (in page object)
```ts
await page.screenshot({ path: 'debug.png', fullPage: true });
```
