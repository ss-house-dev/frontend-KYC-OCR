export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 100;
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

function norm(raw?: string) {
  let s = (raw ?? "");
  s = s.normalize("NFKC");
  s = s.trim().replace(/\s+/g, " ");
  s = s.toLocaleLowerCase();
  s = s.normalize("NFC");
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
  return s;
}

// Levenshtein (rolling array) — คงพฤติกรรมเดิม:
// - ทั้งคู่ว่าง → 100
// - ว่างด้านเดียว → 0
export function calculateSimilaritySafe(a: string, b: string): number {
  const s1 = a ?? "";
  const s2 = b ?? "";

  if (s1.length === 0 && s2.length === 0) return 100;
  if (s1.length === 0 || s2.length === 0) return 100;

  const longer  = s1.length >= s2.length ? s1 : s2;
  const shorter = s1.length >= s2.length ? s2 : s1;

  const m = shorter.length, n = longer.length;
  const prev = new Array(m + 1);
  const curr = new Array(m + 1);

  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    for (let j = 1; j <= m; j++) {
      curr[j] =
        longer[i - 1] === shorter[j - 1]
          ? prev[j - 1]
          : Math.min(prev[j - 1] + 1, curr[j - 1] + 1, prev[j] + 1);
    }
    for (let j = 0; j <= m; j++) prev[j] = curr[j];
  }

  const distance = prev[m];
  return ((n - distance) / n) * 100;
}

/**
 * KYC policy:
 * - ถ้า original ว่าง & input ไม่ว่าง → 100 (ยอมรับเพราะต้นทางไม่มีข้อมูลให้เทียบ)
 * - ถ้า original ไม่ว่าง & input ว่าง → 0 (ผู้ใช้ไม่ได้กรอก)
 * - ถ้าทั้งคู่ว่าง → 100
 * - อย่างอื่น → คำนวณจริงด้วย Levenshtein
 */
export function scoreName(original?: string, input?: string) {
  const A = norm(original);
  const B = norm(input);

  const aEmpty = A.length === 0;
  const bEmpty = B.length === 0;

  if (aEmpty && bEmpty) return 100;     // ทั้งคู่ว่าง = เหมือน
  if (aEmpty && !bEmpty) return 100;    // ต้นทางว่าง แต่ผู้ใช้กรอก = ยอมรับ
  if (!aEmpty && bEmpty) return 0;      // ต้นทางมี แต่ผู้ใช้ไม่กรอก = ไม่ผ่าน

  return calculateSimilaritySafe(A, B); // เทียบตามปกติ
}