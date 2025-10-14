"use client";

import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { uploadBookBankOcr, type OcrResponse } from "../services";
import {
  imageStorage,
  getFileFromStorage,
  type StorageResponse,
} from "@/services/imagestorageService";
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

const COOKIE_KEY = "bookbank_ocr_response";
const COOKIE_IMAGE_KEY = "bookbank_uploaded_objectName";

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

  const mutation = useMutation({
    mutationKey: ["uploadBookBankOcr", kycRequestId],
    mutationFn: async (file: File) => {
      if (!kycRequestId) throw new Error("Missing kycRequestId");

      // ส่งไป OCR
      const ocrResult = await uploadBookBankOcr(
        file,
        kycRequestId,
        setLoadingProgress
      );

      // ส่งไป storage
      const storageResult: StorageResponse = await imageStorage(
        file,
        setLoadingProgress
      );
      console.log("[BookBank Uploaded] Uploaded to storage:", storageResult);

      // return ทั้ง OCR + storageResult
      return { ocrResult, storageResult };
    },
    onSuccess: async ({ ocrResult, storageResult }) => {
      const d = ocrResult;
      console.log("[BookBank OCR] Raw response:", d);

      const errors: string[] = [];
      if (!d.branchName?.trim()) errors.push("Missing branchName");
      if (!d.accountNumber?.trim()) errors.push("Missing accountNumber");

      if (errors.length > 0) {
        console.error("[BookBank OCR] Validation failed:", errors);
        onError?.(new Error(errors.join(" | ")));
        return;
      }

      // Save OCR response ลง cookie
      try {
        saveFormToCookie(COOKIE_KEY, d);
        console.log("[BookBank OCR] Saved to cookie:", d);
      } catch (e) {
        console.error("[BookBank OCR] Failed to save cookie:", e);
      }

      // โหลดรูปจาก storage
      try {
        const blob = await getFileFromStorage(storageResult.objectName);
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        setImageSrc(dataUrl);

        // เก็บ objectName ลง cookie
        saveFormToCookie(COOKIE_IMAGE_KEY, {
          objectName: storageResult.objectName,
        });
        console.log(
          "[BookBank OCR] Saved objectName to cookie:",
          storageResult.objectName
        );
      } catch (e) {
        console.error("[BookBank OCR] Failed to load image from storage:", e);
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

  const startFromSession = useCallback(async () => {
    if (ocrStarted) {
      console.log("[BookBank OCR] ❌ Already started, skip duplicate call");
      return;
    }
    setOcrStarted(true);

    if (!kycRequestId) {
      router.replace(redirects.noSession || "/user-login");
      return;
    }

    // โหลด OCR cookie
    const cookieData = loadFormFromCookie<OcrResponse>(COOKIE_KEY);
    const hasOcrCookie = cookieData?.accountNumber && cookieData?.branchName;
    if (hasOcrCookie) {
      console.log("[BookBank OCR] ✅ Using OCR cookie data:", cookieData);
      const resetValues = buildResetValues(cookieData);
      reset(resetValues as any);
      onSetOriginal?.({
        accountNameThai: cookieData.accountNameThai || "",
        accountNameEng: cookieData.accountNameEng || "",
      });
    }

    // โหลดรูปจาก objectName cookie
    const savedImage = loadFormFromCookie<{ objectName: string }>(
      COOKIE_IMAGE_KEY
    );
    if (savedImage?.objectName) {
      try {
        const blob = await getFileFromStorage(savedImage.objectName);
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        setImageSrc(dataUrl);
        console.log(
          "[BookBank OCR] Loaded image from cookie:",
          savedImage.objectName
        );
      } catch (e) {
        console.error("[BookBank OCR] Failed to load image from cookie:", e);
      }
    }

    // ถ้าไม่มี OCR cookie → run OCR จาก sessionStorage
    if (!hasOcrCookie) {
      const dataUrl = sessionStorage.getItem(sessionImageKey); // "croppedBookBankImage" (legacy)
      const objUrl = sessionStorage.getItem("croppedBookBankImageURL"); // ✅ ใหม่

      console.log("[OCR] session check:", {
        sessionImageKey,
        hasDataUrl: !!dataUrl,
        hasObjUrl: !!objUrl,
      });

      if (!dataUrl && !objUrl) {
        router.replace(redirects.noImage || "/book-bank-accept");
        return;
      }
      try {
        let file: File;
        if (objUrl) {
          const blob = await (await fetch(objUrl)).blob();
          setImageSrc(objUrl);
          file = new File([blob], "bookbank_from_session.jpg", {
            type: blob.type || "image/jpeg",
          });
          console.log("[OCR] built File from objectURL, size:", blob.size);
        } else {
          setImageSrc(dataUrl!);
          file = await base64StringToFile(dataUrl!, "bookbank_from_session.jpg");
          console.log("[OCR] built File from dataURL");
        }
        mutation.mutate(file);
      } catch (e) {
        console.error("[OCR] failed to create file from session image:", e);
        onError?.(e);
      }
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
