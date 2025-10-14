"use client";

import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { uploadIdCardOcr, type OcrResponse } from "../services/ocridcard";
import {
  base64StringToFile,
  saveFormToCookie,
  loadFormFromCookie,
  clearFormCookie,
} from "@/lib/utils/index";
import {
  imageStorage,
  getFileFromStorage,
  type StorageResponse,
} from "@/services/imagestorageService";

type OriginalNames = {
  firstNameThai: string;
  lastNameThai: string;
  firstNameEng: string;
  lastNameEng: string;
};

type UseIdCardOcrArgs<TForm extends FieldValues> = {
  kycRequestId?: string;
  form: UseFormReturn<TForm>;
  buildResetValues: (d: OcrResponse) => Partial<TForm>;
  requiredFields?: Array<Path<TForm>>;
  onSetOriginal?: Dispatch<SetStateAction<OriginalNames>>;
  sessionImageKey?: string;
  redirects?: { noSession?: string; noImage?: string };
  onError?: (err: unknown) => void;
};

const COOKIE_KEY = "idcard_ocr_response";
const COOKIE_IMAGE_KEY = "idcard_uploaded_objectName";

export function useIdCardOcr<TForm extends FieldValues>({
  kycRequestId,
  form,
  buildResetValues,
  requiredFields = [],
  onSetOriginal,
  sessionImageKey = "capturedIdCardImage",
  redirects = { noSession: "/user-login", noImage: "/" },
  onError,
}: UseIdCardOcrArgs<TForm>) {
  const router = useRouter();
  const { reset, trigger, setError } = form;
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [ocrStarted, setOcrStarted] = useState(false);

  const mutation = useMutation({
    mutationKey: ["uploadIdCardOcr", kycRequestId],
    mutationFn: async (file: File) => {
      if (!kycRequestId) throw new Error("Missing kycRequestId");

      // OCR
      const ocrResult = await uploadIdCardOcr(
        file,
        kycRequestId,
        setLoadingProgress
      );

      // Storage
      const storageResult: StorageResponse = await imageStorage(
        file,
        setLoadingProgress
      );
      console.log("[IDCard Uploaded] Uploaded to storage:", storageResult);

      return { ocrResult, storageResult };
    },
    onSuccess: async ({ ocrResult, storageResult }) => {
      const d = ocrResult;
      if (!d?.idNumber) {
        onError?.(new Error("Invalid OCR response"));
        return;
      }

      // ✅ เก็บเฉพาะข้อมูลที่จำเป็นลง cookie (ไม่เก็บ markdown)
      const cookieData = {
        idNumber: d.idNumber,
        idNumberFormatted: d.idNumberFormatted,
        titleThai: d.titleThai,
        firstNameThai: d.firstNameThai,
        lastNameThai: d.lastNameThai,
        firstNameEng: d.firstNameEng,
        lastNameEng: d.lastNameEng,
        birthDateThai: d.birthDateThai,
        issueDateThai: d.issueDateThai,
        expiryDateThai: d.expiryDateThai,
        address: d.address,
        laserId: d.laserId || "", 
        errors: d.errors,
      };

      try {
        saveFormToCookie(COOKIE_KEY, cookieData);
        console.log("[IDCard OCR] Saved OCR response to cookie (without markdown):", cookieData);
      } catch (e) {
        console.error("[IDCard OCR] Failed to save cookie:", e);
      }

      // โหลดรูปจาก storage แล้ว setImageSrc
      try {
        const blob = await getFileFromStorage(storageResult.objectName);
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        setImageSrc(dataUrl);

        saveFormToCookie(COOKIE_IMAGE_KEY, {
          objectName: storageResult.objectName,
        });
        console.log(
          "[IDCard OCR] Saved objectName to cookie:",
          storageResult.objectName
        );
      } catch (e) {
        console.error("[IDCard OCR] Failed to load image from storage:", e);
      }

      // set original
      onSetOriginal?.({
        firstNameThai: d.firstNameThai || "",
        lastNameThai: d.lastNameThai || "",
        firstNameEng: d.firstNameEng || "",
        lastNameEng: d.lastNameEng || "",
      });

      // reset form
      reset(buildResetValues(d) as any);

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
      console.error("[IDCard OCR] upload failed:", err);
      onError?.(err);
    },
  });

  const startFromSession = useCallback(async () => {
    if (ocrStarted) {
      console.log("[IDCard OCR] ❌ Already started, skip duplicate call");
      return;
    }
    setOcrStarted(true);

    if (!kycRequestId) {
      router.replace(redirects.noSession || "/user-login");
      return;
    }

    // 1) โหลด OCR cookie
    const cookieData = loadFormFromCookie<OcrResponse>(COOKIE_KEY);
    const hasOcrCookie = !!cookieData?.idNumber;
    
    if (hasOcrCookie) {
      console.log("[IDCard OCR] ✅ Using OCR cookie data:", cookieData);
      
      // รวม laserId จาก cookie ที่แก้ไขแล้ว (ถ้ามี)
      const editedData = loadFormFromCookie<Partial<TForm>>("idcard_form_edited");
      const resetData = buildResetValues(cookieData) as any;
      
      // ถ้ามี laserId จาก edited cookie ให้ใช้แทน
      if (editedData?.laserId) {
        resetData.laserId = editedData.laserId;
        console.log("[IDCard OCR] Using laserId from edited cookie:", editedData.laserId);
      }
      
      reset(resetData);
      onSetOriginal?.({
        firstNameThai: cookieData.firstNameThai || "",
        lastNameThai: cookieData.lastNameThai || "",
        firstNameEng: cookieData.firstNameEng || "",
        lastNameEng: cookieData.lastNameEng || "",
      });
    }

    // 2) โหลดรูปจาก objectName cookie (ถ้ามี OCR cookie)
    const savedImage = loadFormFromCookie<{ objectName: string }>(
      COOKIE_IMAGE_KEY
    );
    if (hasOcrCookie && savedImage?.objectName) {
      try {
        const blob = await getFileFromStorage(savedImage.objectName);
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        setImageSrc(dataUrl);
        console.log(
          "[IDCard OCR] ✅ Loaded image from cookie:",
          savedImage.objectName
        );
        return; 
      } catch (e) {
        console.error("[IDCard OCR] ⚠️ Failed to load image from cookie, will retry OCR:", e);
        clearFormCookie(COOKIE_IMAGE_KEY);
      }
    }

    // 3) ถ้าไม่มี OCR cookie หรือโหลดรูปไม่ได้ → OCR ใหม่จาก sessionStorage
    if (!hasOcrCookie) {
      console.log("[IDCard OCR] 🔍 Checking sessionStorage for key:", sessionImageKey);
      const dataUrl = sessionStorage.getItem(sessionImageKey);
      
      if (!dataUrl) {
        console.log("[IDCard OCR] ❌ No sessionStorage image, redirecting...");
        console.log("[IDCard OCR] 📋 Available sessionStorage keys:", Object.keys(sessionStorage));
        router.replace(redirects.noImage || "/");
        return;
      }
      
      console.log("[IDCard OCR] 🔄 Starting new OCR from sessionStorage, image length:", dataUrl.length);
      setImageSrc(dataUrl);

      try {
        const file = await base64StringToFile(dataUrl, "idcard_from_session.jpg");
        mutation.mutate(file);
      } catch (e) {
        console.error("[IDCard OCR] Failed to create file:", e);
        onError?.(e);
      }
    }
  }, [
    kycRequestId,
    sessionImageKey,
    router,
    redirects,
    mutation,
    ocrStarted,
    reset,
    buildResetValues,
    onSetOriginal,
  ]);

  const clearOcrCookie = useCallback(() => {
    console.log("[IDCard OCR] 🧹 Clearing all cookies and reset state");
    clearFormCookie(COOKIE_KEY);
    clearFormCookie(COOKIE_IMAGE_KEY);
    setOcrStarted(false);
    setImageSrc(null);
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