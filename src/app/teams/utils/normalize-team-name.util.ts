/** Canonicalize names for both storage and case-insensitive uniqueness checks. */
export function normalizeTeamName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}
