import { format, parseISO } from "date-fns";

export const formatDate = (iso: string) => format(parseISO(iso), "MMM d, yyyy");
export const formatDateTime = (iso: string) => format(parseISO(iso), "MMM d, yyyy · h:mm a");
/** `YYYY-MM-DD` for API date filters, using the *local* calendar date the user picked. */
export const toApiDate = (d: Date) => format(d, "yyyy-MM-dd");
export const fromApiDate = (s: string) => parseISO(s);
export const initials = (name: string) =>
  name
    .replace(/^dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
