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

// ตัดวรรณยุกต์ไทย (ตัวเลือก เพิ่ม-ลบตามนโยบาย)
// รวมช่วง \u0E31, \u0E34-\u0E3A, \u0E47-\u0E4E
const THAI_MARKS = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g;

function norm(raw?: string, options?: { stripThaiMarks?: boolean }) {
  let s = (raw ?? "").normalize("NFKC").trim();
  if (!s) return "";
  s = s.toLocaleLowerCase();               // ไม่แยกตัวพิมพ์
  s = s.replace(/\s+/g, " ");              // ลดช่องว่างซ้ำ
  if (options?.stripThaiMarks) {
    s = s.replace(THAI_MARKS, "");         // เอาวรรณยุกต์/สระลอยออก
  }
  return s;
}

// Levenshtein แบบ rolling array → เร็วและกินหน่วยความจำน้อยลง
export function calculateSimilaritySafe(a: string, b: string): number {
  const s1 = a ?? "";
  const s2 = b ?? "";

  if (s1.length === 0 && s2.length === 0) return 100; // ทั้งคู่ว่าง = เหมือนกัน
  if (s1.length === 0 || s2.length === 0) return 0;   // ว่างด้านเดียว = 0%

  // จัดให้ s1 คือสตริงที่ "ยาวกว่า" เพื่อ normalize ด้วยความยาวนี้
  const longer = s1.length >= s2.length ? s1 : s2;
  const shorter = s1.length >= s2.length ? s2 : s1;

  const m = shorter.length;
  const n = longer.length;

  const prev = new Array(m + 1);
  const curr = new Array(m + 1);

  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    for (let j = 1; j <= m; j++) {
      if (longer[i - 1] === shorter[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = Math.min(
          prev[j - 1] + 1, // แทนที่
          curr[j - 1] + 1, // แทรก
          prev[j] + 1      // ลบ
        );
      }
    }
    // สลับแถว
    for (let j = 0; j <= m; j++) prev[j] = curr[j];
  }

  const distance = prev[m];
  return ((n - distance) / n) * 100;
}

// ตัวช่วยรวม: normalize ก่อน + ส่งคืน 0–100 เสมอ
export function scoreName(a?: string, b?: string) {
  const A = norm(a, { stripThaiMarks: true });
  const B = norm(b, { stripThaiMarks: true });
  return calculateSimilaritySafe(A, B);
}

