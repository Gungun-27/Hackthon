/**
 * Centralized severity score formatter.
 * Always renders exactly one decimal place (e.g. 7 → "7.0", 8.5 → "8.5").
 * Import this wherever severity_score is displayed — never format inline.
 */
export function formatSeverityScore(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(Number(score))) return '—';
  return Number(score).toFixed(1);
}
