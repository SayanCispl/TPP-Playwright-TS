import { expect, type Page } from '@playwright/test';
import { logStep } from '../../utils/logger';

export class PatientStatusComponent {
  constructor(private readonly page: Page) {}

  get locatorPage(): Page {
    return this.page;
  }

  async select(status: string): Promise<void> {
    const radio = this.page
      .getByRole('radio', { name: status })
      .first();

    await expect(
      radio,
      `Patient status "${status}" should be available`
    ).toBeVisible();

    await expect(
      radio,
      `Patient status "${status}" should be enabled`
    ).toBeEnabled();

    await radio.check();

    await expect(
      radio,
      `Patient status "${status}" should be selected`
    ).toBeChecked();

    logStep(`Patient Status selected: ${status}`, {
      status
    });
  }
}