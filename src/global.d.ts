/**
 * Extends the browser Window interface with custom globals used by the
 * pharmacy-place checkout page.
 *
 * window.PageLoader is a lightweight orchestrator that gates the checkout
 * submit button until all async dependencies (states API, Stripe) have
 * finished loading.  In tests we inject a stub via addInitScript so the
 * button is enabled even when the real Webflow custom-JS cannot execute
 * (e.g. Cloudflare Turnstile bot-detection in CI).
 *
 * window.turnstile is the Cloudflare Turnstile global.  Webflow's native
 * forms module reads typeof turnstile at bind-time to decide whether to
 * listen for a "ready" event or a custom "TURNSTILE_LOADED" event.  In
 * tests we inject a stub that immediately calls the success callback so
 * the submit button is re-enabled without solving a real challenge.
 */

interface PageLoader {
  show(message: string): void;
  hide(): void;
  wait(key: string): void;
  done(key: string): void;
  fail(key: string, message: string, retry: () => void): void;
}

interface Turnstile {
  render(
    container: string | HTMLElement,
    params: {
      sitekey?: string;
      callback?: (token: string) => void;
      'error-callback'?: () => void;
      [key: string]: unknown;
    },
  ): string;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
  getResponse(widgetId?: string): string;
}

interface Window {
  PageLoader: PageLoader;
  turnstile: Turnstile;
}
