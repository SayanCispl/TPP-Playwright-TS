import { Page } from '@playwright/test';

export async function setupCheckoutMocks(page: Page) {
  // ── Mock: POST /api/v1/payments/init ──────────────────────────────────────
  await page.route('**/api/v1/payments/init*', async (route) => {
    console.log('[ROUTE MOCK] POST /api/v1/payments/init → 200');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        client_secret: `pi_mock_secret_${Date.now()}`,
        payment_intent_id: `pi_mock_${Date.now()}`,
      }),
    });
  });

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
          redirect_url: `/order-confirmation?key=${trackingKey}`,
        },
      }),
    });
  });

  // ── Mock: POST order creation endpoints ──────────────────────────────────
  await page.route('**/api/v1/orders*', async (route) => {
    const trackingKey = `tk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[ROUTE MOCK] POST /api/v1/orders → 200 (tracking_key=${trackingKey})`);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: {
          tracking_key: trackingKey,
          order_id: `ORD-${Date.now()}`,
        },
      }),
    });
  });
}
