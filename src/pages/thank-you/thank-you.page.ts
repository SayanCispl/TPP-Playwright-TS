import { expect, type Page } from '@playwright/test';
import { BasePage } from '../base/base.page';
import { logStep } from '../../utils/logger';

export class ThankYouPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async expectLoaded(): Promise<void> {
    // ── 1. Wait for URL redirect to /order-confirmation ───────────────────────
    await expect(this.page).toHaveURL(
      /thank|success|confirmation/i,
      { timeout: 25000 }
    );

    // ── 2. Wait for HTML DOM and network idle ─────────────────────────────────
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle').catch(() => {});

    // ── 3. Validate key DOM elements on Order Confirmation page ──────────────
    const confirmationHeading = this.page
      .locator('h1, h2, h3, .heading-confirmation')
      .filter({ hasText: /thank|order|confirmed|assessment/i })
      .first();

    await expect(
      confirmationHeading,
      'Order confirmation heading should be rendered in the DOM'
    ).toBeVisible({ timeout: 20000 });

    const startAssessmentBtn = this.page.getByRole('link', {
      name: /start your assessment/i,
    });

    await expect(
      startAssessmentBtn,
      '"Start Your Assessment" button should be rendered and visible in the DOM'
    ).toBeVisible({ timeout: 20000 });

    logStep('Order confirmation HTML DOM fully rendered and validated', {
      url: this.page.url(),
    });
  }

  /**
   * Validates the checkout Thank You / Order Confirmation page, waits for all
   * DOM elements to be fully rendered, prints the Order ID prominently to the console,
   * and captures a full-page screenshot.
   *
   * @param screenshotPath - Absolute path where the PNG will be saved.
   * @param orderId        - The order ID captured from URL or DOM.
   */
  async expectLoadedWithLog(
    screenshotPath: string,
    orderId: string
  ): Promise<void> {
    // ── Step 1: Wait for full HTML DOM load & element assertions ──────────────
    await this.expectLoaded();

    const currentUrl = this.page.url();
    const pageTitle = await this.page.title().catch(() => 'unknown');

    const thankHeading = this.page
      .locator('h1, h2, h3, .heading-confirmation')
      .filter({ hasText: /thank|order|confirmed|assessment/i })
      .first();

    const headingText = (await thankHeading.textContent().catch(() => '') ?? '').trim();

    // ── Step 2: Print structured Order ID summary to console ──────────────────
    console.log(
      `\n============================================================\n` +
      `🛒 [ORDER CONFIRMATION] Order Placed Successfully!\n` +
      `  Order ID : ${orderId}\n` +
      `  URL      : ${currentUrl}\n` +
      `  Title    : ${pageTitle}\n` +
      `  Heading  : ${headingText}\n` +
      `  DOM      : Fully rendered & validated\n` +
      `============================================================\n`
    );

    logStep('Order Confirmation page validated and Order ID logged', {
      orderId,
      url: currentUrl,
      title: pageTitle,
      heading: headingText,
    });

    // ── Step 3: Capture full-page screenshot ──────────────────────────────────
    await this.page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(
      `[ORDER CONFIRMATION] 📸 Screenshot saved: ${screenshotPath}\n`
    );

    logStep('Order Confirmation screenshot captured', { screenshotPath });
  }

  async getOrderId(): Promise<string> {
    // ── 1. Try URL query-string ?key= (checkout JS redirect) ────────────────
    const currentUrl = new URL(this.page.url());
    const keyFromUrl = currentUrl.searchParams.get('key');
    if (keyFromUrl) {
      logStep('Order tracking key captured from URL', { trackingKey: keyFromUrl });
      return keyFromUrl;
    }

    // ── 2. Try DOM text patterns ──────────────────────────────────────────────
    const candidates = [
      this.page.getByText(/order\s*(id|number|#)/i).first(),
      this.page.locator('[data-order-id]').first()
    ];

    for (const candidate of candidates) {
      if (await candidate.count()) {
        const text = (await candidate.textContent())?.trim() ?? '';
        const match = text.match(/(?:order\s*(?:id|number|#)?\s*[:#-]?\s*)([A-Z0-9-]+)/i);
        if (match?.[1]) {
          logStep('Order ID captured', { orderId: match[1] });
          return match[1];
        }
      }
    }

    // ── 3. Scan page body text ────────────────────────────────────────────────
    const body = await this.page.locator('body').innerText();
    const match = body.match(/(?:order\s*(?:id|number|#)?\s*[:#-]?\s*)([A-Z0-9-]{4,})/i);
    if (match?.[1]) {
      logStep('Order ID captured from page body', { orderId: match[1] });
      return match[1];
    }

    throw new Error('Order ID was not found on the confirmation page');
  }

  /**
   * Clicks the "Start Your Assessment" link on the order-confirmation
   * page and waits for the browser to navigate to the questionnaire.
   *
   * From the DevTools screenshot the element is:
   *
   *   <a href="https://...webflow.io/questionnaires?key=..."
   *      class="c-button button-big w-button">
   *     Start Your Assessment
   *   </a>
   *
   * We use a role-based locator (preferred over CSS class) so the
   * selector remains resilient to styling changes.
   *
   * Playwright's built-in navigation auto-wait means no hardcoded
   * waitForTimeout is required here.
   */
  async startAssessment(): Promise<void> {
    const button = this.page.getByRole('link', {
      name: /start your assessment/i,
    });

    await expect(
      button,
      '"Start Your Assessment" button should be visible on the confirmation page'
    ).toBeVisible({ timeout: 15000 });

    logStep('Clicking Start Your Assessment', { url: this.page.url() });

    await Promise.all([
      this.page.waitForURL(/questionnaires/i, { timeout: 20000 }),
      button.click(),
    ]);

    logStep('Navigated to questionnaire page', { url: this.page.url() });
  }

  async captureScreenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true });
  }
}
