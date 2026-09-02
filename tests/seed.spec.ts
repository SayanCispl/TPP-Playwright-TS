/**
 * Seed File — pharmacy-playwright-ts
 *
 * This file is used EXCLUSIVELY by the Playwright AI Agents (Planner, Generator, Healer).
 * It teaches the agents about this project's fixtures, data utilities, and Page Object Model
 * so generated tests are immediately compatible with the existing framework.
 *
 * DO NOT run this file as a real test suite (it is intentionally empty).
 * The agents read the imports and boilerplate here to understand:
 *   - Which test fixture to import (not @playwright/test directly)
 *   - How to generate unique checkout data per-test
 *   - How to access questionnaire answer data
 *   - The base URL and environment configuration
 *
 * ─── Project fixture ────────────────────────────────────────────────────────
 * All generated tests should import from:
 *   '../../src/fixtures/test-fixture'
 * NOT from '@playwright/test' directly. The fixture provides:
 *   - productPage      → src/pages/product/product.page.ts
 *   - checkoutPage     → src/pages/checkout/checkout.page.ts
 *   - thankYouPage     → src/pages/thank-you/thank-you.page.ts
 *   - questionnairePage → src/pages/questionnaire/questionnaire.page.ts
 *
 * ─── Data utilities ─────────────────────────────────────────────────────────
 *   checkoutData(testInfo)      → static/env-driven email + form data
 *   questionnaireAnswers()      → full quiz answer set (DOB, gender, BMI, BP, etc.)
 *
 * ─── Product catalogue ──────────────────────────────────────────────────────
 *   products['tirzepatide']  → { key, name, path, patientStatus, dosage }
 *   products['semaglutide']  → { key, name, path, patientStatus, dosage }
 *
 * ─── Test file locations ────────────────────────────────────────────────────
 *   tests/smoke/       → happy-path end-to-end flows
 *   tests/regression/  → product page regression scenarios
 *   tests/edge/        → checkout validation edge cases
 *   specs/             → AI-generated Markdown test plans (from Planner agent)
 */

import { test, expect } from '../src/fixtures/test-fixture';
import { products } from '../src/data/product-data';
import { checkoutData, questionnaireAnswers } from '../src/utils/test-data';

test.describe('Seed — environment bootstrap', () => {
  test('seed: verify base URL and homepage loads', async ({ page }, testInfo) => {
    // Agents: this is the target site for all tests
    await page.goto('/');
    await expect(page).toHaveURL(/the-pharmacy-place/);

    // Agents: this is how to generate test-specific data
    const data = checkoutData(testInfo);
    const qData = questionnaireAnswers();

    // Agents: confirm data utilities resolve without errors
    expect(data.email).toBeTruthy();
    expect(qData.dateOfBirth).toBeTruthy();
    expect(Object.keys(products)).toEqual(['tirzepatide', 'semaglutide']);
  });
});
