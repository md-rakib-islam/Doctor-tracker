import { z } from 'zod';
import { dateRangeQuery, refineDateRange } from './common';

export const overviewQuery = z.object({
  /** Length of the "new this period" window, compared with the preceding window of equal length. */
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const patientsPerDoctorQuery = z
  .object({
    ...dateRangeQuery,
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .superRefine(refineDateRange);

export const statisticsQuery = z
  .object({
    ...dateRangeQuery,
    interval: z.enum(['day', 'week', 'month']).optional(),
  })
  .superRefine(refineDateRange);

export type StatisticsQuery = z.infer<typeof statisticsQuery>;
