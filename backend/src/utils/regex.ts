/** Escapes user input so it can be embedded safely in a RegExp (prevents ReDoS / regex injection). */
export const escapeRegex = (input: string) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
