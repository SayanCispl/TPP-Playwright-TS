import { test, expect } from '../../src/fixtures/test-fixture';
import { products } from '../../src/data/product-data';

test.describe('Checkout Validation Edge Cases', () => {
  test('@edge @checkout incomplete checkout should not complete the order', async ({
    productPage,
    checkoutPage,
    page
  }) => {
    await productPage.open(products.tirzepatide);
    await productPage.configureProduct(products.tirzepatide);
    await productPage.addToCart();
    await productPage.cart.proceedToCheckout();
    await checkoutPage.expectLoaded();

    const completeButton = page.getByRole('button', { name: /Complete Checkout/i }).first();

    if (await completeButton.count()) {
      // With required fields empty, a native/semantic disabled state is preferred.
      // If the application leaves it enabled, clicking should remain on checkout.
      const enabled = await completeButton.isEnabled();
      if (enabled) {
        await completeButton.click();
        await expect(page).toHaveURL(/checkout/i);
      } else {
        await expect(completeButton).toBeDisabled();
      }
    }
  });
});
