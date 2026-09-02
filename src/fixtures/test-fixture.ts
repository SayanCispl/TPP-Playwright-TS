import { test as base, expect } from '@playwright/test';
import { ProductPage } from '../pages/product/product.page';
import { CheckoutPage } from '../pages/checkout/checkout.page';
import { ThankYouPage } from '../pages/thank-you/thank-you.page';
import { QuestionnairePage } from '../pages/questionnaire/questionnaire.page';
import { MockManager } from '../mocks/mock-manager';

type Fixtures = {
  mockManager: MockManager;
  productPage: ProductPage;
  checkoutPage: CheckoutPage;
  thankYouPage: ThankYouPage;
  questionnairePage: QuestionnairePage;
};

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    // Surface browser console errors/exceptions in the Node.js console so
    // they appear in Playwright's captured output and are easy to diagnose.
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
    page.on('pageerror', err => {
      console.error(`[PAGE ERROR] ${err.stack ?? err.message}`);
    });
    await use(page);
  },

  // Auto fixture: initializes routes & interceptors before any test navigation
  mockManager: [
    async ({ page }, use) => {
      const manager = new MockManager(page);
      await manager.init();
      await use(manager);
    },
    { auto: true },
  ],

  productPage: async ({ page }, use) => {
    // Mask the webdriver flag so the product page does not detect automation
    // and hide the patient-status / dosage controls.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    await use(new ProductPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    /**
     * Inject stubs BEFORE any page script runs to bypass two bot-detection
     * mechanisms that keep the checkout submit button permanently disabled
     * in a Playwright context.
     *
     * ── Problem 1: window.PageLoader undefined ────────────────────────────
     * The checkout page DOMContentLoaded handler calls:
     *   window.PageLoader.show()  /  .wait()  /  .done()  /  .fail()
     * PageLoader is defined by a Webflow custom-JS file that fails to load
     * when Cloudflare Turnstile detects automation (error 600010).
     * Without it, StatesDropdown and StripePayment crash and the button is
     * never enabled.
     *
     * ── Problem 2: Webflow native Turnstile gate ──────────────────────────
     * webflow.schunk.38ee8e4494af5637.js reads [data-turnstile-sitekey]
     * on the checkout form and, when found:
     *   1. Sets submit button disabled = true  +  adds class w-form-loading
     *   2. Listens for document "ready" event (because window.turnstile is
     *      undefined it falls back to a custom "TURNSTILE_LOADED" event)
     *   3. On "ready": calls turnstile.render() and waits for the challenge
     *      success callback before re-enabling the button
     * Cloudflare's real Turnstile script never loads / passes in automation,
     * so the button stays disabled indefinitely.
     */
    await page.addInitScript(() => {
      // ── Stub 1: window.PageLoader ───────────────────────────────────────
      const pending = new Set<string>();

      function tryEnableCheckoutButton() {
        if (pending.size === 0) {
          const btn = document.getElementById(
            'checkout-submit-button',
          ) as HTMLInputElement | null;
          if (btn) btn.disabled = false;
        }
      }

      window.PageLoader = {
        show(_message: string) {
          // no-op: we don't render a loading overlay in tests
        },
        hide() {
          // no-op
        },
        wait(key: string) {
          pending.add(key);
        },
        done(key: string) {
          pending.delete(key);
          tryEnableCheckoutButton();
        },
        fail(key: string, _message: string, _retry: () => void) {
          // Remove the key on failure so it never permanently blocks the button.
          pending.delete(key);
          tryEnableCheckoutButton();
        },
      };

      // ── Stub 2: window.turnstile ────────────────────────────────────────
      // Webflow's forms module checks `typeof turnstile` at bind-time:
      //   h.on("undefined" != typeof turnstile ? "ready" : "TURNSTILE_LOADED", ...)
      // By defining window.turnstile here we make Webflow listen for "ready".
      // Our render() immediately calls the success callback with a fake token,
      // which makes Webflow re-enable the submit button and store the token.
      window.turnstile = {
        render(
          _container: string | HTMLElement,
          params: { callback?: (token: string) => void },
        ) {
          if (typeof params.callback === 'function') {
            // Call async so that Webflow's listener has fully initialised
            // the form context before we invoke the success path.
            setTimeout(() => params.callback!('playwright-test-token'), 0);
          }
          return 'playwright-widget-id';
        },
        reset(_widgetId?: string) {
          // no-op
        },
        remove(_widgetId?: string) {
          // no-op
        },
        getResponse(_widgetId?: string) {
          return 'playwright-test-token';
        },
      };

      // Fire the "ready" event so Webflow's form module immediately invokes
      // the turnstile.render() path and re-enables the submit button.
      // We dispatch after a short delay to ensure Webflow has registered
      // the listener first.
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          document.dispatchEvent(new Event('ready'));
        }, 100);
      });
    });

    await use(new CheckoutPage(page));
  },

  thankYouPage: async ({ page }, use) => {
    await use(new ThankYouPage(page));
  },

  questionnairePage: async ({ page }, use) => {
    await use(new QuestionnairePage(page));
  },
});

export { expect };
export { MockManager };
