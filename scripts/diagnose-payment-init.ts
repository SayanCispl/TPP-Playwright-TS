/**
 * ============================================================
 * Diagnostic Script: Payment Initialization Network Intercept
 * ============================================================
 *
 * Purpose:
 * Intercepts ALL network requests on the checkout page and
 * logs any request that returns a non-2xx status code so we
 * can see the exact URL, request body, and response body of
 * the failing payment-init call.
 *
 * Run:
 *   npx ts-node --project tsconfig.json scripts/diagnose-payment-init.ts
 */

import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL ?? 'https://the-pharmacy-place.webflow.io';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  // ── Inject the same stubs as the test fixture ──────────────────────────────
  await page.addInitScript(() => {
    // Mask webdriver flag
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

    // PageLoader stub
    const pending = new Set<string>();
    function tryEnableCheckoutButton() {
      if (pending.size === 0) {
        const btn = document.getElementById('checkout-submit-button') as HTMLInputElement | null;
        if (btn) btn.disabled = false;
      }
    }
    (window as any).PageLoader = {
      show: () => {},
      hide: () => {},
      wait: (k: string) => pending.add(k),
      done: (k: string) => { pending.delete(k); tryEnableCheckoutButton(); },
      fail: (k: string) => { pending.delete(k); tryEnableCheckoutButton(); },
    };

    // Turnstile stub
    (window as any).turnstile = {
      render(_: any, params: { callback?: (t: string) => void }) {
        setTimeout(() => params.callback?.('playwright-test-token'), 0);
        return 'playwright-widget-id';
      },
      reset: () => {},
      remove: () => {},
      getResponse: () => 'playwright-test-token',
    };

    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => document.dispatchEvent(new Event('ready')), 100);
    });
  });

  // ── Intercept ALL responses ────────────────────────────────────────────────
  const failedRequests: Array<{ url: string; status: number; responseBody: string; requestBody: string; requestHeaders: Record<string, string> }> = [];

  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    const isPaymentRelated =
      url.includes('payment') ||
      url.includes('stripe') ||
      url.includes('order') ||
      url.includes('/api/') ||
      url.includes('wf-api') ||
      url.includes('webflow');

    if (status >= 400 || isPaymentRelated) {
      let responseBody = '';
      try { responseBody = await response.text(); } catch { responseBody = '(unreadable)'; }

      const request = response.request();
      const requestBody = request.postData() ?? '';
      const requestHeaders = request.headers();
      const relevantHeaders = Object.fromEntries(
        Object.entries(requestHeaders).filter(([k]) =>
          ['content-type', 'authorization', 'x-turnstile-token', 'cookie', 'referer', 'origin', 'x-wf-csrf'].some(h => k.toLowerCase().includes(h))
        )
      );

      failedRequests.push({ url, status, responseBody, requestBody, requestHeaders: relevantHeaders });

      console.log('\n' + '─'.repeat(80));
      console.log(`[${status}] ${request.method()} ${url}`);
      if (requestBody) console.log('Request body:', requestBody.substring(0, 3000));
      if (Object.keys(relevantHeaders).length) console.log('Relevant headers:', JSON.stringify(relevantHeaders, null, 2));
      if (responseBody) console.log('Response body:', responseBody.substring(0, 3000));
    }
  });

  // ── Navigate to product page ───────────────────────────────────────────────
  console.log('\n[1] Navigating to Tirzepatide product page...');
  await page.goto(`${BASE_URL}/product/tirzepatide`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // ── Select patient status via .check() (mirrors PatientStatusComponent) ───
  console.log('[2] Selecting New Patient...');
  const radio = page.getByRole('radio', { name: 'New Patient' }).first();
  await radio.check();
  await page.waitForTimeout(500);

  // ── Select dosage (mirrors DosageComponent) ────────────────────────────────
  console.log('[3] Selecting dosage Step 1...');
  const dosageSelect = page.locator('select[data-node-type="commerce-add-to-cart-option-select"]').first();
  const step1Option = dosageSelect.locator('option').filter({ hasText: /^Step 1:/i });
  const step1Value = await step1Option.getAttribute('value');
  if (step1Value) {
    await dosageSelect.selectOption(step1Value);
  }
  await page.waitForTimeout(500);

  // ── Add to cart ────────────────────────────────────────────────────────────
  console.log('[4] Clicking Add to Cart...');
  const addToCart = page.getByRole('link', { name: /add to cart/i }).first();
  await addToCart.click();
  await page.waitForTimeout(3000);

  // ── Proceed to checkout ────────────────────────────────────────────────────
  console.log('[5] Proceeding to checkout...');
  const proceedBtn = page.getByRole('link', { name: 'Proceed to checkout' }).first();
  await proceedBtn.click();

  // ── Wait and monitor network on checkout page ──────────────────────────────
  console.log('[6] On checkout page. Monitoring network for 20 seconds...\n');
  await page.waitForTimeout(20000);

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY - All intercepted requests:');
  if (failedRequests.length === 0) {
    console.log('No payment-related or failed requests captured.');
  } else {
    for (const r of failedRequests) {
      console.log(`\n  [${r.status}] ${r.url}`);
      if (r.requestBody) console.log(`  Request: ${r.requestBody.substring(0, 500)}`);
      if (r.responseBody) console.log(`  Response: ${r.responseBody.substring(0, 500)}`);
    }
  }

  await browser.close();
})();
