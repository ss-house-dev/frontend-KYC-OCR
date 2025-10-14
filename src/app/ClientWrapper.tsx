"use client";
import { useMemo } from "react";
import { useClearCookieOnBack } from "@/hooks/useClearCookieOnBack";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const idCardKeys = useMemo(
    () => [
      "idcard_ocr_response",
      "idcard_uploaded_objectName",
      "idcard_form_edited",
    ],
    []
  );
  const idCardPaths = useMemo(() => ["/preview-id-card", "/scan-id-card"], []);

  const bookBankKeys = useMemo(
    () => [
      "bookbank_ocr_response",
      "bookbank_uploaded_objectName",
      "capturedBookBankImage",
      "croppedBookBankImage",
    ],
    []
  );
  const bookBankPaths = useMemo(
    () => ["/preview-book-bank", "/book-bank-crop"],
    []
  );

  useClearCookieOnBack(idCardKeys, idCardPaths);
  useClearCookieOnBack(bookBankKeys, bookBankPaths);

  return <>{children}</>;
}
