"use client";

import Link from "next/link";
import { clearFormCookie } from "@/lib/utils/index";

export default function BackLink({
  children,
  href = "/scan-id-card",
}: {
  children: React.ReactNode;
  href?: string;
}) {
  const handleClick = () => {
    // ✅ ล้าง cookie และ sessionStorage ก่อนกลับ
    clearFormCookie("idcard_ocr_data");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("capturedIdCardImage");
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
