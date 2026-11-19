import { z } from 'zod';
import { dateRangeQuery, emailField, emptyToUndefined, objectId, paginationQuery, phone, refineDateRange } from './common';

const doctorBody = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  specialization: z.string().trim().min(2, 'Specialization is required').max(100),
  hospital: z.string().trim().min(2, 'Hospital is required').max(150),
  phone,
  email: emailField,
};

export const createDoctorSchema = z.object(doctorBody);

export const updateDoctorSchema = z
  .object(doctorBody)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const listDoctorsQuery = z
  .object({
    ...paginationQuery,
    ...dateRangeQuery,
    search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
    specialization: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
    hospital: z.preprocess(emptyToUndefined, z.string().trim().max(150).optional()),
    sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  })
  .superRefine(refineDateRange);

export const deleteDoctorQuery = z.object({
  /** Delete the doctor's patients together with the doctor. */
  cascade: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  /** Move the doctor's patients to another doctor before deleting. */
  reassignTo: z.preprocess(emptyToUndefined, objectId.optional()),
});

export type ListDoctorsQuery = z.infer<typeof listDoctorsQuery>;
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
