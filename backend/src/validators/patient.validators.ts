import { z } from 'zod';
import { GENDERS, PATIENT_CONDITIONS } from '../config/constants';
import { dateRangeQuery, emptyToUndefined, objectId, paginationQuery, phone, refineDateRange } from './common';

/** Optional email: '' or null clears it, otherwise must be a valid address. */
const optionalEmail = z
  .union([z.literal(''), z.null(), z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'))])
  .optional();

const patientBody = {
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  age: z.coerce.number('Age must be a number').int('Age must be a whole number').min(0).max(120),
  gender: z.enum(GENDERS, 'Select a gender'),
  phone,
  email: optionalEmail,
  condition: z.enum(PATIENT_CONDITIONS, 'Select a condition'),
  doctorId: objectId,
};

export const createPatientSchema = z.object(patientBody);

export const updatePatientSchema = z
  .object(patientBody)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

/** Body for POST /doctors/:id/patients - doctor comes from the URL. */
export const createDoctorPatientSchema = z.object(patientBody).omit({ doctorId: true });

export const listPatientsQuery = z
  .object({
    ...paginationQuery,
    ...dateRangeQuery,
    search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
    condition: z.preprocess(emptyToUndefined, z.enum(PATIENT_CONDITIONS).optional()),
    gender: z.preprocess(emptyToUndefined, z.enum(GENDERS).optional()),
    doctorId: z.preprocess(emptyToUndefined, objectId.optional()),
    sortBy: z.enum(['createdAt', 'fullName', 'age']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .superRefine(refineDateRange);

export type ListPatientsQuery = z.infer<typeof listPatientsQuery>;
export type CreateDoctorPatientInput = z.infer<typeof createDoctorPatientSchema>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
