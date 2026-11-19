import type { Response } from 'express';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const buildPagination = (page: number, limit: number, total: number): Pagination => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T,
  options: { status?: number; pagination?: Pagination } = {},
) {
  const body: Record<string, unknown> = { success: true, message, data };
  if (options.pagination) body.pagination = options.pagination;
  return res.status(options.status ?? 200).json(body);
}
