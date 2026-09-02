import { expect, type Page } from '@playwright/test';
import { logStep } from '../../utils/logger';

export class CartDrawerComponent {
  constructor(private readonly page: Page) {}

  async waitForOpen(): Promise<void> {
    await expect(
      this.page.getByText('Order Summary').first(),
      'Cart drawer order summary should appear'
    ).toBeVisible();

    logStep('Cart drawer opened');
  }

  async proceedToCheckout(): Promise<void> {
    const checkoutButton = this.page
      .getByRole('link', { name: 'Proceed to checkout' })
      .first();

    await expect(
      checkoutButton,
      'Proceed to checkout should be visible'
    ).toBeVisible();

    await checkoutButton.click();

    logStep('Proceed to checkout clicked');
  }
}