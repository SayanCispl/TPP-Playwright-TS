import { type Page } from '@playwright/test';
import { logStep } from '../../utils/logger';

/**
 * BasePage
 *
 * Common parent class for all Page Objects.
 *
 * Responsibilities:
 * - Store Playwright Page instance.
 * - Provide common browser/page utilities.
 * - Provide reusable navigation helpers.
 *
 * All concrete Page Objects such as:
 *
 * ProductPage
 * CheckoutPage
 * ThankYouPage
 *
 * extend this class.
 */
export abstract class BasePage {
  /**
   * Playwright browser page.
   *
   * protected means child Page Objects can directly access it:
   *
   * this.page
   *
   * but tests should interact through Page Object methods.
   */
  constructor(protected readonly page: Page) {}

  /**
   * Navigate to a URL.
   *
   * This method intentionally does not use hardcoded waits.
   * Playwright's navigation and auto-wait mechanisms are used.
   */
  protected async navigate(url: string): Promise<void> {
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
    });

    logStep('Navigated to page', {
      url,
    });
  }

  /**
   * Returns the current URL.
   */
  protected getCurrentUrl(): string {
    return this.page.url();
  }
}