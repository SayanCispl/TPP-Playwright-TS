/**
 * Mock Order Tracking Data
 */

export function createMockOrderResponse() {
  return {
    order: {
      id: 12345,
      status: 'pending',
      order_number: `ORD-${Date.now()}`,
      created_at: new Date().toISOString(),
      subtotal_cents: 10000,
      total_cents: 10000,
      patient_status_label: 'New Patient',
    },
    addresses: {
      shipping: {
        line1: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        postal_code: '90001',
      },
    },
    items: [
      {
        product_id: 1,
        product_name: 'Tirzepatide',
        unit_price_cents: 10000,
        quantity: 1,
        line_total_cents: 10000,
      },
    ],
  };
}
