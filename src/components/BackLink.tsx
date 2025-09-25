"use client";

import Link from "next/link";
import { clearFormCookie } from "@/lib/utils/index";
import { clearCapturedImage } from "@/lib/imageStorage";

// ✅ ใช้ keys ที่ถูกต้อง
const COOKIE_KEYS_TO_CLEAR = [
  "idcard_ocr_response",  // OCR response data
  "idcard_form_edited",   // User edited data
  "id-accept:form"        // Persisted form data
];

export default function BackLink({
  children,
  href = "/scan-id-card",
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const handleClick = () => {
    console.log("[BackLink] Clearing all ID card related cookies and sessionStorage");
    
    // ✅ ล้าง cookies ทั้งหมดที่เกี่ยวข้อง
    COOKIE_KEYS_TO_CLEAR.forEach(key => {
      clearFormCookie(key);
      console.log("[BackLink] Cleared cookie:", key);
    });
    
    // ✅ ล้าง sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("capturedIdCardImage");
      console.log("[BackLink] Cleared sessionStorage: capturedIdCardImage");
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-label="Back"
      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg
       focus-visible:outline focus-visible:outline-2
       focus-visible:outline-offset-2 focus-visible:outline-[#2152b6]"
    >
      {children}
    </Link>
  );
}