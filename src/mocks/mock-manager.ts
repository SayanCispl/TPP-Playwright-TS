import { Page } from '@playwright/test';
import { setupQuestionnaireMocks } from './handlers/questionnaire.handler';
import { setupCheckoutMocks } from './handlers/checkout.handler';
import { setupPaymentInterceptors } from './handlers/payment.handler';

export interface MockOptions {
  /** Enable or disable mocking questionnaire APIs. Default: determined by MOCK_API env (true unless 'false') */
  mockQuestionnaire?: boolean;
  /** Enable or disable mocking checkout status polling API. Default: determined by MOCK_API env (true unless 'false') */
  mockCheckoutStatus?: boolean;
  /** Enable or disable intercepting payment payload to remove invalid fields. Default: true */
  interceptPaymentPayload?: boolean;
}

export class MockManager {
  constructor(private page: Page) {}

  /**
   * Initializes network interceptors and mocks based on environment flags and provided options.
   */
  async init(options?: MockOptions) {
    const isMockApiEnvEnabled = process.env.MOCK_API !== 'false';

    // 1. Always attach network error logger for visibility
    this.attachNetworkErrorLogger();

    // 2. Setup payment interceptor (needed for real backend payload compatibility)
    if (options?.interceptPaymentPayload ?? true) {
      await setupPaymentInterceptors(this.page);
    }

    // 3. Setup questionnaire mocks
    const shouldMockQuestionnaire = options?.mockQuestionnaire ?? isMockApiEnvEnabled;
    if (shouldMockQuestionnaire) {
      await setupQuestionnaireMocks(this.page);
    }

    // 4. Setup checkout status mocks
    const shouldMockCheckoutStatus = options?.mockCheckoutStatus ?? isMockApiEnvEnabled;
    if (shouldMockCheckoutStatus) {
      await setupCheckoutMocks(this.page);
    }
  }

  /**
   * Logs HTTP 4xx and 5xx responses directly in the test output for faster debugging.
   */
  private attachNetworkErrorLogger() {
    this.page.on('response', async (response) => {
      const status = response.status();
      if (status < 400) return; // Only non-2xx / non-3xx responses

      const url = response.url();
      const method = response.request().method();

      let body = '';
      try {
        body = await response.text();
        if (body.length > 1000) body = body.substring(0, 1000) + '… [truncated]';
      } catch {
        body = '(response body unreadable)';
      }

      console.error(
        `\n[NETWORK ERROR] ${method} ${url}\n` +
        `  Status : ${status}\n` +
        `  Body   : ${body || '(empty)'}\n`
      );
    });
  }
}
