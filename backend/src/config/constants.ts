/** Controlled vocabulary for patient conditions. Extend here; the API, seed and UI filters follow. */
export const PATIENT_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Cardiac Disease',
  'Arthritis',
  'Migraine',
  'Allergy',
  'Infection',
  'Injury',
  'Skin Disorder',
  'Pregnancy Care',
  'Other',
] as const;

export const GENDERS = ['male', 'female', 'other'] as const;

export type PatientCondition = (typeof PATIENT_CONDITIONS)[number];
export type Gender = (typeof GENDERS)[number];
