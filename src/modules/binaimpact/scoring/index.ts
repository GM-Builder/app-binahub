export function averageScore(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

export function calculateLevelScore(sectionScores: number[]) {
  return averageScore(sectionScores);
}

export function calculateModelScore(levelScores: number[]) {
  return averageScore(levelScores);
}
