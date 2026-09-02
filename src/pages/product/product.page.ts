import { expect, type Page } from '@playwright/test';

import { BasePage } from '../base/base.page';
import { PatientStatusComponent } from '../components/patient-status.component';
import { DosageComponent } from '../components/dosage.component';
import { CartDrawerComponent } from '../components/cart-drawer.component';

import type { ProductConfig } from '../../models/product.model';
import { logStep } from '../../utils/logger';

export class ProductPage extends BasePage {
  readonly patientStatus: PatientStatusComponent;
  readonly dosage: DosageComponent;
  readonly cart: CartDrawerComponent;

  constructor(page: Page) {
    super(page);

    this.patientStatus = new PatientStatusComponent(page);
    this.dosage = new DosageComponent(page);
    this.cart = new CartDrawerComponent(page);
  }

  /**
   * Opens the requested medication product page
   * and verifies that the product configuration controls
   * are available.
   */
  async open(product: ProductConfig): Promise<void> {
    await this.page.goto(product.path, {
      waitUntil: 'domcontentloaded',
    });

    // Verify Patient Status is available.
    await expect(
      this.page
        .getByRole('radio', {
          name: product.patientStatus,
        })
        .first(),
      `Patient status "${product.patientStatus}" should be available for ${product.name}`,
    ).toBeVisible();

    // Verify Dosage dropdown is available.
    await expect(
      this.page
        .locator(
          'select[data-node-type="commerce-add-to-cart-option-select"]',
        )
        .first(),
      `Dosage dropdown should be available for ${product.name}`,
    ).toBeVisible();

    logStep(`Opened product: ${product.name}`, {
      product: product.name,
      url: this.page.url(),
    });
  }

  /**
   * Configures the medication according to the supplied
   * product test data.
   *
   * This keeps test data separate from UI implementation.
   */
  async configureProduct(product: ProductConfig): Promise<void> {
    await this.patientStatus.select(product.patientStatus);

    await this.dosage.select(product.dosage);

    logStep(`Configured product: ${product.name}`, {
      patientStatus: product.patientStatus,
      dosage: product.dosage,
    });
  }

  /**
   * Adds the configured medication to the cart
   * and waits for the cart drawer.
   */
  async addToCart(): Promise<void> {
    const button = this.page
      .getByRole('link', { name: /add to cart/i })
      .first();

    await expect(
      button,
      'Add To Cart should be visible',
    ).toBeVisible();

    await expect(
      button,
      'Add To Cart should be enabled',
    ).toBeEnabled();

    await button.click();

    logStep('Add To Cart clicked');

    await this.cart.waitForOpen();
  }
}