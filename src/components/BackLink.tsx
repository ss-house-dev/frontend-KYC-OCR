"use client";

import Link from "next/link";
import { clearFormCookie } from "@/lib/utils/index";

type BackLinkProps = {
  children: React.ReactNode;
  href: string;
  type: "idcard" | "bookbank"; // ✅ บังคับให้เลือกประเภท
};

// ✅ mapping cookies และ sessionStorage ตาม type
const COOKIE_KEYS: Record<BackLinkProps["type"], string[]> = {
  idcard: ["idcard_ocr_response", "idcard_form_edited", "id-accept:form"],
  bookbank: [
    "bookbank_ocr_response",
    "bookbank_form_edited",
    "book-bank:form",
  ],
};

const SESSION_KEYS: Record<BackLinkProps["type"], string[]> = {
  idcard: ["capturedIdCardImage"],
  bookbank: ["croppedBookBankImage", "capturedBookBankImage"],
};

export default function BackLink({ children, href, type }: BackLinkProps) {
  const handleClick = () => {
    console.log(`[BackLink] Clearing all ${type} related cookies and sessionStorage`);

    // clear cookies
    COOKIE_KEYS[type].forEach((key) => {
      clearFormCookie(key);
      console.log(`[BackLink] Cleared cookie: ${key}`);
    });

    // clear sessionStorage
    if (typeof window !== "undefined") {
      SESSION_KEYS[type].forEach((key) => {
        sessionStorage.removeItem(key);
        console.log(`[BackLink] Cleared sessionStorage: ${key}`);
      });
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
