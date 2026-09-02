import { test, expect } from '../../src/fixtures/test-fixture';
import { products } from '../../src/data/product-data';
import { checkoutData, questionnaireAnswers } from '../../src/utils/test-data';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../../src/utils/logger';

/**
 * ============================================================
 * Medication Checkout - Smoke Tests
 * ============================================================
 *
 * Purpose:
 * - Validate the complete happy-path checkout flow.
 * - Run the same flow for every configured medication.
 * - Keep tests independent and parallel-safe.
 *
 * Flow:
 *
 * Product Page
 *      ↓
 * Configure Patient Status
 *      ↓
 * Select Dosage
 *      ↓
 * Add To Cart
 *      ↓
 * Cart Drawer
 *      ↓
 * Proceed To Checkout
 *      ↓
 * Checkout Page
 *      ↓
 * Customer Information
 *      ↓
 * Payment Information
 *      ↓
 * Complete Checkout
 *      ↓
 * Thank You Page
 *      ↓
 * Validate Order ID
 *      ↓
 * Capture Screenshot
 *      ↓
 * Start Assessment (questionnaire entry point)
 *      ↓
 * Questionnaire Welcome Page
 *      ↓
 * Click "Take 3 min eligibility quiz"
 *      ↓
 * Answer Quiz Questions (DOB, Gender, Height/Weight, BP, Conditions)
 * ============================================================
 */

test.describe('Medication Checkout Smoke', () => {
  /**
   * Generate one test per configured product.
   *
   * Example:
   *
   * Tirzepatide
   * Semaglutide
   *
   * Because every test gets its own Playwright context,
   * the tests remain isolated and can safely run in parallel.
   */
  for (const product of Object.values(products)) {
    test(
      `@smoke @checkout ${product.name} - customer can complete sandbox checkout`,
      async (
        {
          productPage,
          checkoutPage,
          thankYouPage,
          questionnairePage,
        },
        testInfo
      ) => {
        /**
         * ------------------------------------------------------
         * 1. Generate test-specific checkout data
         * ------------------------------------------------------
         *
         * checkoutData(testInfo) returns the configured email
         * (sourced from TEST_EMAIL in .env) and form data.
         */
        const data = checkoutData(testInfo);
        const qData = questionnaireAnswers();

        /**
         * Browser/project information is useful when debugging
         * failures across Chromium, Firefox and WebKit.
         */
        const browserName = testInfo.project.name;

        logger.info(
          {
            product: product.name,
            productKey: product.key,
            email: data.email,
            browser: browserName,
            worker: testInfo.workerIndex,
          },
          'Starting medication checkout smoke test'
        );

        /**
         * ------------------------------------------------------
         * 2. Open Product
         * ------------------------------------------------------
         *
         * Product configuration is driven from product-data.ts.
         *
         * This allows us to add another medication later without
         * duplicating the test flow.
         */
        await productPage.open(product);

        /**
         * ------------------------------------------------------
         * 3. Configure Product
         * ------------------------------------------------------
         *
         * configureProduct() should handle:
         *
         * - Patient status
         * - Dosage selection
         *
         * These values should come from ProductConfig rather
         * than being hardcoded inside the test.
         */
        await productPage.configureProduct(product);

        /**
         * ------------------------------------------------------
         * 4. Add Product To Cart
         * ------------------------------------------------------
         *
         * ProductPage internally waits for:
         *
         * - Add To Cart button
         * - Button enabled state
         * - Cart drawer
         *
         * No hardcoded wait should be required here.
         */
        await productPage.addToCart();

        /**
         * ------------------------------------------------------
         * 5. Proceed To Checkout
         * ------------------------------------------------------
         *
         * CartDrawerComponent owns all cart-specific locators
         * and interactions.
         */
        await productPage.cart.proceedToCheckout();

        /**
         * ------------------------------------------------------
         * 6. Validate Checkout Page
         * ------------------------------------------------------
         *
         * expectLoaded() should verify that the checkout page
         * and its critical controls are ready.
         */
        await checkoutPage.expectLoaded();

        /**
         * ------------------------------------------------------
         * 7. Fill Customer Information
         * ------------------------------------------------------
         *
         * This should fill:
         *
         * - Email
         * - First name
         * - Last name
         * - Shipping address
         * - City
         * - State
         * - Zip code
         * - Phone number
         *
         * State selection remains dynamic.
         */
        await checkoutPage.fillCustomerInformation(data);

        /**
         * ------------------------------------------------------
         * 8. Fill Payment Information
         * ------------------------------------------------------
         *
         * Payment details come from the test data/environment
         * and are handled internally by CheckoutPage.
         *
         * The test does NOT access private implementation
         * methods or locators.
         */
        await checkoutPage.fillPaymentInformation(data);

        /**
         * ------------------------------------------------------
         * 9. Complete Checkout
         * ------------------------------------------------------
         *
         * This method should:
         *
         * - Locate Complete Checkout button
         * - Wait for it to be actionable
         * - Click it
         * - Wait for the resulting navigation/state
         */
        await checkoutPage.completeCheckout();

        /**
         * ------------------------------------------------------
         * 10. Validate Thank You Page (Checkout Confirmation)
         * ------------------------------------------------------
         *
         * expectLoadedWithLog() combines the URL assertion with:
         *  - Structured console output (Order ID, URL, page title, heading)
         *  - A full-page screenshot saved to reports/screenshots/
         * Both the console and the screenshot serve as validation
         * evidence for the checkout confirmation page.
         */
        const screenshotDir = path.resolve('reports/screenshots');

        fs.mkdirSync(screenshotDir, { recursive: true });

        const checkoutConfirmScreenshotPath = path.join(
          screenshotDir,
          [
            product.key,
            browserName,
            `worker-${testInfo.workerIndex}`,
            'checkout-confirmation',
            `${Date.now()}.png`,
          ].join('-')
        );

        // Capture order ID first (needed for the log message)
        const orderId = await thankYouPage.getOrderId();

        expect(
          orderId,
          'Order ID should be generated after successful checkout'
        ).toBeTruthy();

        await thankYouPage.expectLoadedWithLog(
          checkoutConfirmScreenshotPath,
          orderId
        );

        /**
         * ------------------------------------------------------
         * 12. Attach Order ID To Playwright Report
         * ------------------------------------------------------
         */
        await testInfo.attach('Order ID', {
          body: orderId,
          contentType: 'text/plain',
        });

        /**
         * ------------------------------------------------------
         * 13. Attach Checkout Confirmation Screenshot
         * ------------------------------------------------------
         */
        await testInfo.attach('Checkout Confirmation Screenshot', {
          path: checkoutConfirmScreenshotPath,
          contentType: 'image/png',
        });

        /**
         * ------------------------------------------------------
         * 14. Attach Unique Test Email
         * ------------------------------------------------------
         *
         * Useful during debugging because the email can be
         * searched in the sandbox system.
         */
        await testInfo.attach('Unique checkout email', {
          body: data.email,
          contentType: 'text/plain',
        });

        /**
         * ------------------------------------------------------
         * 15. Attach Browser Information
         * ------------------------------------------------------
         */
        await testInfo.attach('Browser', {
          body: browserName,
          contentType: 'text/plain',
        });

        /**
         * ------------------------------------------------------
         * 16. Start Assessment
         * ------------------------------------------------------
         *
         * The confirmation page shows a "Start Your Assessment"
         * button that navigates to the questionnaire flow.
         * ThankYouPage.startAssessment() clicks the link and
         * waits for navigation to /questionnaires.
         */
        await thankYouPage.startAssessment();

        /**
         * ------------------------------------------------------
         * 17. Validate Questionnaire Welcome Page
         * ------------------------------------------------------
         *
         * Asserts the correct URL, that the widget has rendered,
         * and that the eligibility-quiz button is ready.
         */
        await questionnairePage.expectLoaded();

        /**
         * ------------------------------------------------------
         * 18. Click "Take 3 min eligibility quiz"
         * ------------------------------------------------------
         *
         * Scrolls the button into view (it sits below the fold)
         * and clicks it to begin the questionnaire proper.
         */
        await questionnairePage.startEligibilityQuiz();

        /**
         * ------------------------------------------------------
         * 19. Answer Quiz Questions
         * ------------------------------------------------------
         *
         * Progress through the preliminary eligibility questions.
         * The answers are sourced from test-data so they can be
         * easily configured to test different scenarios.
         *
         * Q1-Q34 : Full health assessment questionnaire
         * Q35    : Video upload  (file: VIDEO_PATH in .env)
         * Q36    : Photo upload  (file: PHOTO_PATH in .env)
         */
        await questionnairePage.completeFullAssessment(qData);

        /**
         * ------------------------------------------------------
         * 20. Validate Assessment Thank You Page
         * ------------------------------------------------------
         *
         * After submitting the last questionnaire question the
         * quiz JS navigates to (or reveals) a completion/thank-you
         * screen.  expectAssessmentComplete() validates it via:
         *  - Console output (URL, title, heading text)
         *  - Full-page screenshot attached to the Playwright report
         */
        const assessmentScreenshotPath = path.join(
          screenshotDir,
          [
            product.key,
            browserName,
            `worker-${testInfo.workerIndex}`,
            'assessment-complete',
            `${Date.now()}.png`,
          ].join('-')
        );

        await questionnairePage.expectAssessmentComplete(assessmentScreenshotPath);

        await testInfo.attach('Assessment Completion Screenshot', {
          path: assessmentScreenshotPath,
          contentType: 'image/png',
        });

        /**
         * ------------------------------------------------------
         * 21. Final Structured Log
         * ------------------------------------------------------
         */
        logger.info(
          {
            product: product.name,
            productKey: product.key,
            orderId,
            email: data.email,
            browser: browserName,
            worker: testInfo.workerIndex,
            screenshot: checkoutConfirmScreenshotPath,
          },
          'Medication checkout + assessment smoke test completed successfully'
        );
      }
    );
  }
});