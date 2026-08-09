export function getScoreColor(score: number | null): string {
  if (score === null) return "#CBD5E1";
  if (score >= 4.5) return "#10B981";
  if (score >= 3.5) return "#84CC16";
  if (score >= 2.5) return "#F59E0B";
  if (score >= 1.5) return "#F97316";
  return "#EF4444";
}
