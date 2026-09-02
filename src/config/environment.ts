import path from 'node:path';

export const environment = {
  email: process.env.TEST_EMAIL ?? 'sayan.koley@codeclouds.co.in',

  firstName: process.env.TEST_FIRST_NAME ?? 'Test',

  lastName: process.env.TEST_LAST_NAME ?? 'QA',

  address: process.env.TEST_SHIPPING_ADDRESS ?? 'Test',

  city: process.env.TEST_CITY ?? 'Test',

  state: process.env.TEST_STATE ?? 'ANY',

  zip: process.env.TEST_ZIP ?? '10002',

  phone: process.env.TEST_PHONE ?? '2125550123',

  cardNumber:
    process.env.TEST_CARD_NUMBER ?? '4242424242424242',

  expirationDate:
    process.env.TEST_CARD_EXPIRY ?? '09/30',

  cvv:
    process.env.TEST_CARD_CVV ?? '123',

  /**
   * The value injected as the `cc_test` query-string parameter
   * on the checkout URL (e.g. ?cc_test=sandbox).
   *
   * Change CHECKOUT_TEST_PARAM in .env to switch environments
   * without touching any test or page-object code.
   */
  checkoutTestParam:
    process.env.CHECKOUT_TEST_PARAM ?? 'sandbox',

  /**
   * Absolute path to the video file used in the questionnaire
   * video-upload question.  Change VIDEO_PATH in .env to use
   * a different file without touching test code.
   */
  videoPath:
    path.resolve(
      process.env.VIDEO_PATH ??
        '/Users/codeclouds-sayan/Downloads/file_example_MP4_480_1_5MG.mp4'
    ),

  /**
   * Absolute path to the photo file used in the questionnaire
   * photo-upload question.  Change PHOTO_PATH in .env to use
   * a different file without touching test code.
   */
  photoPath:
    path.resolve(
      process.env.PHOTO_PATH ??
        '/Users/codeclouds-sayan/Downloads/TPP-ID.jpg'
    ),
};