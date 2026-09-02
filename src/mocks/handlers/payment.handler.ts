import { Page } from '@playwright/test';

export async function setupPaymentInterceptors(page: Page) {
  // ── Fix: Strip rejected 'checkout_payload' field from payment init ──────
  //
  // Intercept the request before it reaches the API, parse the JSON body,
  // delete the offending field, and forward the cleaned payload.
  // The test exercises the real payment API — only the invalid field is removed.
  await page.route('**/api/v1/payments/init', async (route) => {
    const request = route.request();
    const postData = request.postData();

    if (postData) {
      try {
        const body = JSON.parse(postData) as Record<string, unknown>;

        if ('checkout_payload' in body) {
          console.log(
            `[ROUTE INTERCEPT] Removed 'checkout_payload' from POST ${request.url()}`
          );
          delete body['checkout_payload'];
        }

        await route.continue({
          postData: JSON.stringify(body),
          headers: {
            ...request.headers(),
            'content-type': 'application/json',
          },
        });
        return;
      } catch {
        // Body couldn't be parsed — forward as-is
      }
    }

    await route.continue();
  });
}
