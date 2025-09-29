import { clearFormCookie } from "@/lib/utils/index";

export function clearIdCardData() {
  clearFormCookie("idcard_ocr_data");
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("capturedIdCardImage");
  }
}