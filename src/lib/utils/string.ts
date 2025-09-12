export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 100;

  const matrix: number[][] = Array.from({ length: longer.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= shorter.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= longer.length; i++) {
    for (let j = 1; j <= shorter.length; j++) {
      matrix[i][j] =
        longer[i - 1] === shorter[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  const distance = matrix[longer.length][shorter.length];
  return ((longer.length - distance) / longer.length) * 100;
}
