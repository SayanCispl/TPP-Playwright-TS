export type ProductKey = 'tirzepatide' | 'semaglutide';

export interface ProductConfig {
  key: ProductKey;
  name: string;
  path: string;
  patientStatus: string;
  dosage: string;
}
