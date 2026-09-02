/**
 * Checkout test data.
 *
 * Represents all information required to complete
 * the sandbox checkout flow.
 */
export interface CheckoutData {
  /**
   * Customer email address.
   *
   * This should be unique for every test execution.
   */
  email: string;

  /**
   * Customer first name.
   */
  firstName: string;

  /**
   * Customer last name.
   */
  lastName: string;

  /**
   * Shipping address.
   */
  address: string;

  /**
   * Optional apartment / suite.
   */
  apartment?: string;

  /**
   * Shipping city.
   */
  city: string;

  /**
   * Shipping state.
   *
   * ANY means that the framework should dynamically
   * select an allowed state from the checkout dropdown.
   */
  state: string;

  /**
   * Shipping ZIP/postal code.
   */
  zipCode: string;

  /**
   * Customer phone number.
   */
  phone: string;

  /**
   * Sandbox card number.
   */
  cardNumber: string;

  /**
   * Card expiration date.
   *
   * Example:
   * 09/30
   */
  expirationDate: string;

  /**
   * Card security code.
   */
  cvv: string;
}