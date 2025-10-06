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

function norm(raw?: string) {
  let s = (raw ?? "");

  // 1) แปลงเป็นรูปแบบที่สอดคล้องกัน (จัดการสระ/วรรณยุกต์ที่แตกตัว)
  //    NFKC จะรวมรูปที่เทียบเท่ากันทางการแสดงผล (เช่น ำ)
  s = s.normalize("NFKC");

  // 2) ตัดช่องว่างหัว–ท้าย + ลดช่องว่างซ้ำ
  s = s.trim().replace(/\s+/g, " ");

  // 3) แปลงเป็นตัวพิมพ์เล็ก (ไม่แยกเคส; ไม่กระทบอักษรไทย)
  s = s.toLocaleLowerCase();

  // 4) จัดรูปอีกครั้งเป็น NFC เพื่อให้ combining marks อยู่ลำดับคงที่
  //    (ช่วยลด false mismatch จากลำดับคอมไบนด์ต่างกัน)
  s = s.normalize("NFC");

  // 5) ลบ zero-width characters ที่อาจปนมาจาก OCR/คัดลอก
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");

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
  const A = norm(a);
  const B = norm(b);
  return calculateSimilaritySafe(A, B);
}
