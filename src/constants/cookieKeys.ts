// สร้างไฟล์ constants/cookieKeys.ts
export const COOKIE_KEYS = {
  OCR_RESPONSE: "idcard_ocr_response",     // ข้อมูลจาก OCR (read-only หลังจาก OCR เสร็จ)
  FORM_EDITED: "idcard_form_edited",       // ข้อมูลที่ user แก้ไข (priority สูงกว่า OCR)
  FORM_PERSISTED: "id-accept:form"         // ข้อมูลจาก usePersistedForm
} as const;

// Priority: FORM_EDITED > OCR_RESPONSE > FORM_PERSISTED