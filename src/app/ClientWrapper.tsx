"use client";

import { useClearCookieOnBack } from "@/้hooks/useClearCookieOnBack";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useClearCookieOnBack(
    ["idcard_ocr_response", "idcard_uploaded_objectName", "idcard_form_edited"],
    ["/preview-id-card", "/scan-id-card"]
  );

  useClearCookieOnBack(
    [
      "bookbank_ocr_response",
      "bookbank_uploaded_objectName",
      "capturedBookBankImage",
      "croppedBookBankImage",
    ],
    ["/preview-book-bank", "/book-bank-crop"]
  );
  
  return <>{children}</>;
}
