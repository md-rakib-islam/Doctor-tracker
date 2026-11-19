/** Start of the given calendar day, UTC. */
export const startOfDayUtc = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

/** Last millisecond of the given calendar day, UTC. */
export const endOfDayUtc = (d: Date) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

export const addDaysUtc = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

/** Builds a Mongo `createdAt` range clause from optional inclusive from/to calendar dates. */
export function createdAtRange(from?: Date, to?: Date): Record<string, Date> | undefined {
  if (!from && !to) return undefined;
  const range: Record<string, Date> = {};
  if (from) range.$gte = startOfDayUtc(from);
  if (to) range.$lte = endOfDayUtc(to);
  return range;
}
