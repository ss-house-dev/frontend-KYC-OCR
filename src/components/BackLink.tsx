"use client";

import Link from "next/link";
import { clearFormCookie } from "@/lib/utils/index";

const COOKIE_KEYS_TO_CLEAR = [
  "idcard_ocr_response",
  "idcard_form_edited",
  "id-accept:form",
];

type BackLinkProps = {
  children: React.ReactNode;
  href: string; // ✅ รับจาก parent
};

export default function BackLink({ children, href }: BackLinkProps) {
  const handleClick = () => {
    console.log("[BackLink] Clearing all ID card related cookies and sessionStorage");

    COOKIE_KEYS_TO_CLEAR.forEach((key) => {
      clearFormCookie(key);
      console.log("[BackLink] Cleared cookie:", key);
    });

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
