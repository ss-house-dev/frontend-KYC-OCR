"use client";

import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { uploadBookBankOcr, type OcrResponse } from "../services";
import {
  base64StringToFile,
  saveFormToCookie,
  loadFormFromCookie,
  clearFormCookie,
} from "@/lib/utils/index";

type OriginalNames = {
  accountNameThai: string;
  accountNameEng: string;
};

type UseBookBankOcrArgs<TForm extends FieldValues> = {
  kycRequestId?: string;
  form: UseFormReturn<TForm>;
  buildResetValues: (d: OcrResponse) => Partial<TForm>;
  requiredFields?: Array<Path<TForm>>;
  onSetOriginal?: Dispatch<SetStateAction<OriginalNames>>;
  sessionImageKey?: string;
  redirects?: { noSession?: string; noImage?: string };
  onError?: (err: unknown) => void;
};

export function useBookBankOcr<TForm extends FieldValues>({
  kycRequestId,
  form,
  buildResetValues,
  requiredFields = [],
  onSetOriginal,
  sessionImageKey = "croppedBookBankImage",
  redirects = { noSession: "/user-login", noImage: "/book-bank-accept" },
  onError,
}: UseBookBankOcrArgs<TForm>) {
  const router = useRouter();
  const { reset, trigger, setError } = form;
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [ocrStarted, setOcrStarted] = useState(false);

  const COOKIE_KEY = "bookbank_ocr_response";
  const IMAGE_COOKIE_KEY = "bookbank_captured_image";

  const mutation = useMutation({
    mutationKey: ["uploadBookBankOcr", kycRequestId],
    mutationFn: (file: File) => {
      if (!kycRequestId) throw new Error("Missing kycRequestId");
      return uploadBookBankOcr(file, kycRequestId, setLoadingProgress);
    },
    onSuccess: async (d: OcrResponse) => {
      console.log("[BookBank OCR] Raw response:", d);

      const errors: string[] = [];
      if (!d.branchName?.trim()) errors.push("Missing branchName");
      if (!d.accountNumber?.trim()) errors.push("Missing accountNumber");
      if (!d.accountNameThai?.trim() && !d.accountNameEng?.trim()) {
        errors.push("Both accountNameThai and accountNameEng are missing");
      }

      if (errors.length > 0) {
        console.error("[BookBank OCR] Validation failed:", errors);
        onError?.(new Error(errors.join(" | ")));
        return;
      }

      // Save to cookie
      try {
        saveFormToCookie(COOKIE_KEY, d);
        console.log("[BookBank OCR] Saved to cookie:", d);

        // Save image ลง cookie ด้วย
        if (imageSrc) {
          saveFormToCookie(IMAGE_COOKIE_KEY, { dataUrl: imageSrc });
          console.log("[BookBank OCR] Saved image to cookie");
        }
      } catch (e) {
        console.error("[BookBank OCR] Failed to save cookie:", e);
      }

      // set original
      onSetOriginal?.({
        accountNameThai: d.accountNameThai || "",
        accountNameEng: d.accountNameEng || "",
      });

      // reset form
      const resetValues = buildResetValues(d);
      reset(resetValues as any);

      // trigger validation + API errors
      setTimeout(async () => {
        for (const f of requiredFields) await trigger(f);
        (d.errors || []).forEach((err) => {
          setError(err.field as Path<TForm>, {
            type: "manual",
            message: err.message,
          });
        });
      }, 100);
    },
    onError: (err) => {
      console.error("[BookBank OCR] upload failed:", err);
      onError?.(err);
    },
  });

  const startFromSession = useCallback(() => {
    if (ocrStarted) {
      console.log("[BookBank OCR] ❌ Already started, skip duplicate call");
      return;
    }
    setOcrStarted(true);

    if (!kycRequestId) {
      router.replace(redirects.noSession || "/user-login");
      return;
    }

    // Load from cookie first
    const cookieData = loadFormFromCookie<OcrResponse>(COOKIE_KEY);
    const cookieImage = loadFormFromCookie<{ dataUrl: string }>(
      IMAGE_COOKIE_KEY
    );
    if (cookieData?.accountNumber && cookieData?.branchName) {
      console.log("[BookBank OCR] ✅ Using cookie data:", cookieData);

      if (cookieImage?.dataUrl) {
        setImageSrc(cookieImage.dataUrl); 
      }

      const resetValues = buildResetValues(cookieData);
      reset(resetValues as any);
      onSetOriginal?.({
        accountNameThai: cookieData.accountNameThai || "",
        accountNameEng: cookieData.accountNameEng || "",
      });
      return;
    }

    // No cookie → run OCR
    const dataUrl = sessionStorage.getItem(sessionImageKey);
    if (!dataUrl) {
      router.replace(redirects.noImage || "/book-bank-accept");
      return;
    }
    setImageSrc(dataUrl);

    try {
      const file = base64StringToFile(dataUrl, "bookbank_from_session.jpg");
      mutation.mutate(file);
    } catch (e) {
      console.error("[BookBank OCR] Failed to create file:", e);
      onError?.(e);
    }
  }, [kycRequestId, sessionImageKey, router, redirects, mutation, ocrStarted]);

  const clearOcrCookie = useCallback(() => {
    console.log("[BookBank OCR] Clearing cookie");
    clearFormCookie(COOKIE_KEY);
  }, []);

  return {
    uploadFile: mutation.mutate,
    startFromSession,
    isUploading: mutation.isPending,
    loadingProgress,
    imageSrc,
    clearOcrCookie,
  };
}
