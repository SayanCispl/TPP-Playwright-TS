import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const reportsDir = path.resolve('reports');

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // Keep retries low so a flaky test is visible instead of being hidden.
  retries: process.env.CI ? 2 : 0,

  // Playwright can calculate a sensible worker count locally/CI.
  // Set WORKERS in .env/CI when infrastructure capacity is known.
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : undefined,

  timeout: 180_000,
  expect: {
    timeout: 15_000
  },

  reporter: process.env.CI
    ? [
        ['list'],
        ['blob'],
        ['allure-playwright', { resultsDir: path.join(reportsDir, 'allure-results') }],
      ]
    : [
        ['list'],
        ['html', { outputFolder: path.join(reportsDir, 'html'), open: 'never' }],
        ['allure-playwright', { resultsDir: path.join(reportsDir, 'allure-results') }],
      ],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://the-pharmacy-place.webflow.io',

    // No hard-coded waits. Playwright auto-waiting + explicit web assertions are used.
    actionTimeout: 20_000,
    navigationTimeout: 30_000,

    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    ignoreHTTPSErrors: true,
    serviceWorkers: 'allow',

    viewport: { width: 1440, height: 1000 }
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],

  outputDir: path.join(reportsDir, 'test-results')
});
