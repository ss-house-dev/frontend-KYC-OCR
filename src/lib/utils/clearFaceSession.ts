// features/scan-face/utils/clearFaceSession.ts

export const DEFAULT_FACE_SESSION_KEYS = [
  "capturedFaceImage",
  "croppedFaceImage",
  "step1Sample",
  "step2Sample",
  "movements",
  "faceMeta",
  // กรณี flow ร่วมกับ KYC
  "idcard_uploaded_objectName",
  "idcard_ocr_response",
] as const;

type CaptureStoreLike = Partial<{
  clear: () => void;
  reset: () => void;
  set: (s: any) => void;
}>;

type ClearOptions = {
  /** เพิ่มคีย์อื่น ๆ ที่อยากล้างร่วมด้วย */
  extraKeys?: string[];
  /** ระบุคีย์ที่ "ไม่" อยากล้าง (จะถูกกรองออก) */
  keepKeys?: string[];
};

function safeRemove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // เงียบไว้เพื่อไม่ให้ flow ล้ม
  }
}

export function clearFaceSession(
  store?: CaptureStoreLike,
  options?: ClearOptions
) {
  const extra = options?.extraKeys ?? [];
  const keep = new Set(options?.keepKeys ?? []);

  // รวมรายการคีย์ แล้วกรองออกด้วย keepKeys (ถ้ามี)
  const keys = [...DEFAULT_FACE_SESSION_KEYS, ...extra].filter(
    (k) => !keep.has(k)
  );

  // ล้าง sessionStorage ตามคีย์
  keys.forEach(safeRemove);

  // เคลียร์ state ฝั่ง store ถ้าให้มา
  store?.clear?.();
  store?.reset?.();
  store?.set?.({
    movements: {},
    step1Sample: undefined,
    step2Sample: undefined,
  });
}
