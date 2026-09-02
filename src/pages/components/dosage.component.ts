import { expect, type Page } from '@playwright/test';
import { logStep } from '../../utils/logger';

export class DosageComponent {
  constructor(private readonly page: Page) {}

  private get dosageSelect() {
    return this.page
      .locator('select[data-node-type="commerce-add-to-cart-option-select"]')
      .first();
  }

  async select(step: string): Promise<void> {
    await expect(
      this.dosageSelect,
      'Dosage Step dropdown should be visible'
    ).toBeVisible();

    await expect(
      this.dosageSelect,
      'Dosage Step dropdown should be enabled'
    ).toBeEnabled();

    const option = this.dosageSelect.locator('option').filter({
      hasText: new RegExp(`^${step}:`, 'i')
    });

    await expect(
      option,
      `Dosage option "${step}" should exist`
    ).toHaveCount(1);

    const value = await option.getAttribute('value');

    if (!value) {
      throw new Error(`Dosage option "${step}" does not have a value`);
    }

    await this.dosageSelect.selectOption(value);

    await expect(this.dosageSelect).toHaveValue(value);

    logStep(`Dosage selected: ${step}`, {
      dosageStep: step,
      optionValue: value
    });
  }
}