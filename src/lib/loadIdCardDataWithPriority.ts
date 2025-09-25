import { loadFormFromCookie } from "./utils/index";

// ✅ Shared function สำหรับอ่านข้อมูลตาม priority
export function loadIdCardDataWithPriority() {
  console.log("[loadDataWithPriority] Loading data with priority...");
  
  // Priority 1: ข้อมูลที่แก้ไขแล้ว
  const editedData = loadFormFromCookie<any>("idcard_form_edited");
  if (editedData && editedData.idNumber && editedData.idNumber.trim()) {
    console.log("[loadDataWithPriority] Using edited data");
    return editedData;
  }
  
  // Priority 2: ข้อมูลจาก OCR
  const ocrData = loadFormFromCookie<any>("idcard_ocr_response");
  if (ocrData && ocrData.idNumber && ocrData.idNumber.trim()) {
    console.log("[loadDataWithPriority] Using OCR data");
    return ocrData;
  }
  
  console.log("[loadDataWithPriority] No valid data found");
  return null;
}