import { Page } from '@playwright/test';
import { mockQuestionnaireResolveResponse } from '../data/questionnaire.mock-data';
import { createMockOrderResponse } from '../data/order.mock-data';

export async function setupQuestionnaireMocks(page: Page) {
  // ── Mock: POST /api/v1/questionnaires/resolve ───────────────────────────
  await page.route('**/api/v1/questionnaires/resolve', async (route) => {
    console.log('[ROUTE MOCK] POST /api/v1/questionnaires/resolve → 200 (stub questions)');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockQuestionnaireResolveResponse),
    });
  });

  // ── Mock: POST /api/v1/questionnaires/progress ──────────────────────────
  await page.route('**/api/v1/questionnaires/progress', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // ── Mock: POST /api/v1/questionnaires/complete ──────────────────────────
  await page.route('**/api/v1/questionnaires/complete', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // ── Mock: POST /api/v1/questionnaires/**/files ──────────────────────────
  await page.route('**/api/v1/questionnaires/**/files', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // ── Mock: POST /api/v1/track-sessions/lookup ────────────────────────────
  await page.route('**/api/v1/track-sessions/lookup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          created_at: new Date().toISOString(),
        },
      }),
    });
  });

  // ── Mock: GET /api/v1/orders/track/** ───────────────────────────────────
  await page.route('**/api/v1/orders/track/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createMockOrderResponse()),
    });
  });
}
