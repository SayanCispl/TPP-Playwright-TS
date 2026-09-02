# Locator Contract

## Confirmed from current product page

The current product pages expose accessible text/names for:

- Patient Status
- New Patient
- Returning Patient
- Dosage Step
- Add To Cart
- Order Summary
- Proceed to checkout

## Checkout

Checkout is intentionally implemented using semantic labels first, with placeholders as fallback.

Payment fields may be rendered by a hosted payment provider. The framework therefore checks payment iframes before same-page fields.

## No fixed waits

Do not add:

```ts
await page.waitForTimeout(...)
```

Use:

- `expect(...).toBeVisible()`
- `expect(...).toBeEnabled()`
- `page.waitForURL(...)`
- locator assertions
- Playwright auto-waiting

## Final browser inspection

Before production CI is enabled, run the smoke flow once in headed mode and use:

```bash
npx playwright codegen https://the-pharmacy-place.webflow.io/product/tirzepatide
```

only as a locator-discovery aid. Do not copy generated brittle selectors into POMs.
