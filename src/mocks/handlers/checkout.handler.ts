import { Page } from '@playwright/test';

export async function setupCheckoutMocks(page: Page) {
  // ── Mock: GET /api/v1/checkout/status endpoint ───────────────────────────
  await page.route('**/api/v1/checkout/status*', async (route) => {
    const url = new URL(route.request().url());
    const piId = url.searchParams.get('payment_intent_id') ?? 'pi_test';
    const trackingKey = `tk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    console.log(
      `[ROUTE MOCK] GET /api/v1/checkout/status → 200 order_created ` +
      `(payment_intent_id=${piId}, tracking_key=${trackingKey})`
    );

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'order_created',
        data: {
          tracking_key: trackingKey,
          payment_intent_id: piId,
          order_id: `ORD-${Date.now()}`,
        },
      }),
    });
  });
}
