import { z } from 'zod';

export const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const idParams = z.object({ id: objectId });

/** `YYYY-MM-DD` calendar date -> Date (UTC midnight). */
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .transform((s) => new Date(`${s}T00:00:00.000Z`))
  .refine((d) => !Number.isNaN(d.getTime()), 'Invalid date');

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Enter a valid phone number (7-20 digits, may start with +)');

export const emailField = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

/** Empty strings in query strings are treated as "not provided". */
export const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

export const dateRangeQuery = {
  from: z.preprocess(emptyToUndefined, dateString.optional()),
  to: z.preprocess(emptyToUndefined, dateString.optional()),
};

export const refineDateRange = <T extends { from?: Date; to?: Date }>(v: T, ctx: z.RefinementCtx) => {
  if (v.from && v.to && v.from > v.to) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: '`to` must be on or after `from`' });
  }
};
