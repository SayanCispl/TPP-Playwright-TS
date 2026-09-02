import { test, expect } from '../../src/fixtures/test-fixture';
import { products } from '../../src/data/product-data';

test.describe('Medication Product Regression', () => {
  for (const product of Object.values(products)) {
    test(`@regression @product ${product.name} - product configuration controls are available`, async ({
      productPage
    }) => {
      await productPage.open(product);

      await expect(
        productPage.patientStatus.locatorPage
          .getByRole('radio', { name: product.patientStatus })
          .first()
      ).toBeVisible();

      await expect(
        productPage.patientStatus.locatorPage.getByLabel('Dosage Step').first()
      ).toBeVisible();

      await expect(
        productPage.patientStatus.locatorPage
          .getByRole('link', { name: 'Add To Cart' })
          .first()
      ).toBeVisible();
    });
  }
});
