"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { clearFormCookie } from "@/lib/utils/index";

// ✅ คุกกี้ฟอร์มที่ต้องลบ (idcard + bookbank)
const COOKIE_KEYS_TO_CLEAR = [
  "idcard_ocr_response",
  "idcard_form_edited",
  "id-accept:form",
  "bookbank_ocr_response",
  "bookbank_form_edited",
  "book-bank:form",
];

// ✅ คีย์ sessionStorage ที่ต้องลบ
const SESSION_KEYS_TO_CLEAR = [
  "capturedIdCardImage",
  "croppedBookBankImage",
  "capturedBookBankImage",
];

// ✅ คุกกี้ progress/step ของ flow ที่ต้องลบเพิ่ม
const FLOW_PROGRESS_COOKIES = ["kycStep", "kyc_progress"];

// helper เคลียร์คุกกี้ raw (กรณี util ไม่มี key นี้)
const clearCookieRaw = (name: string) => {
  // ลบแบบครอบจักรวาล: set ให้หมดอายุ + path=/
  // ถ้าอยู่บน https จะติด Secure ด้วย
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const base = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  document.cookie = isHttps ? `${base}; Secure` : base;
};

export default function VerificationCompletePage() {
  const router = useRouter();

  const handleConfirm = async () => {
    console.log("[Confirm] Clearing all cookies and sessionStorage...");

    // 1) ล้างคุกกี้ฟอร์ม
    COOKIE_KEYS_TO_CLEAR.forEach((key) => {
      try {
        clearFormCookie(key);
        console.log("[Confirm] Cleared cookie:", key);
      } catch {
        // ถ้า util fail ก็ลบแบบ raw
        clearCookieRaw(key);
        console.log("[Confirm] Cleared cookie (raw):", key);
      }
    });

    // 2) ล้างคุกกี้ progress/step ของ flow (สำคัญสุด)
    FLOW_PROGRESS_COOKIES.forEach((key) => {
      clearCookieRaw(key);
      console.log("[Confirm] Cleared flow cookie:", key);
    });

    // 3) ล้าง sessionStorage ที่เก็บรูป/สถานะระหว่างทาง
    if (typeof window !== "undefined") {
      SESSION_KEYS_TO_CLEAR.forEach((key) => {
        sessionStorage.removeItem(key);
        console.log("[Confirm] Cleared sessionStorage:", key);
      });
    }

    // 4) ออกจากระบบ → กลับหน้า login
    await signOut({ callbackUrl: "/user-login" });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center px-6 py-10 relative">
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center">
        {/* Top badge */}
        <div className="mt-6 mb-6">
          <div className="w-28 h-28 rounded-full grid place-items-center">
            <Image
              src="/verification-complete/checkmark-complete.png"
              alt="Verification Complete"
              width={112}
              height={112}
              className="rounded-full"
            />
          </div>
        </div>

        {/* Headings */}
        <h1 className="text-[22px] sm:text-2xl font-semibold text-neutral-900 text-center">
          KYC Verification Complete
        </h1>
        <p className="mt-3 text-[15px] text-neutral-600 text-center">
          We’ve received all your documents
        </p>
        <p className="mt-1 text-[15px] text-neutral-600 text-center">
          We’ll send the verification result to your email within 24 hours
        </p>

        {/* Info card */}
        <div className="w-full max-w-md mt-8">
          <div className="flex items-start gap-3 rounded-2xl bg-[#F4F7FF] px-4 py-4">
            <div className="shrink-0 mt-[2px]">
              <div className="w-6 h-6 rounded-full bg-[#2E6BFF] grid place-items-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
            </div>
            <p className="text-[15px] leading-snug text-neutral-700">
              Your information is encrypted and securely stored following
              industry standards
            </p>
          </div>
        </div>
      </div>

      {/* Confirm button pinned bottom */}
      <div className="w-full max-w-md fixed bottom-0 left-0 right-0 mx-auto px-6 py-4 ">
        <button
          onClick={handleConfirm}
          className="w-full h-12 rounded-xl bg-[#1C55D9] text-white font-semibold text-base shadow "
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
