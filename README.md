# Pharmacy Place - Playwright TypeScript Framework

Senior-SDET-style Playwright framework for The Pharmacy Place sandbox flow.

## Phase 1 + Phase 2 scope

Implemented:

- TypeScript + Playwright Test
- POM + reusable components
- Data-driven product configuration
- Independent BrowserContexts per test
- Chromium / Firefox / WebKit projects
- Parallel execution
- CI-aware retries
- Screenshot/video/trace retention on failure
- Allure integration
- Centralized structured logging
- Unique `test###@codeclouds.com` email generation per test
- Product flow for Tirzepatide and Semaglutide
- Patient Status selection
- Dynamic dosage selection
- Cart drawer
- Checkout
- Thank-you page assertion
- Order ID capture
- Assessment intentionally deferred to Phase 3

## Setup

```bash
npm install
npx playwright install
cp .env.example .env
```

## Run

```bash
npm test
npm run test:smoke
npm run test:regression
npm run test:chromium
npm run test:headed
npm run test:debug
npm run test:failed
npm run report
npm run typecheck
```

## Allure

```bash
npm run allure:generate
npm run allure:open
```

The generated test artifacts are under `reports/`.

## Architecture

```text
tests
  -> fixtures
  -> page objects/components
  -> test data/config
  -> centralized logger
  -> Playwright Test runner
  -> HTML / Allure / trace / video / screenshots
```

## Important locator note

The product pages expose stable accessible names for Patient Status, Dosage Step, Add To Cart and Proceed to checkout. The checkout implementation uses label/role/name-first locators with a small set of semantic fallbacks because payment providers may render card controls in hosted iframes.

Run the first checkout test headed if the sandbox checkout markup differs from the current page representation. No fixed sleeps are used.

## Unique test emails

Every test generates an email shaped like:

`test001@codeclouds.com`

The numeric suffix is deterministic for a given Playwright test identity and worker, so parallel tests do not share a customer email.

## Security

`.env` is ignored by Git. Commit only `.env.example`. Use sandbox/test payment credentials only.
