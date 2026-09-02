import type { ProductConfig } from '../models/product.model';

export const products: Record<string, ProductConfig> = {
  tirzepatide: {
    key: 'tirzepatide',
    name: 'Tirzepatide',
    path: '/product/tirzepatide',
    patientStatus: 'New Patient',
    dosage: 'Step 1'
  },

  semaglutide: {
    key: 'semaglutide',
    name: 'Semaglutide',
    path: '/product/semaglutide',
    patientStatus: 'New Patient',
    dosage: 'Step 1'
  }
};
