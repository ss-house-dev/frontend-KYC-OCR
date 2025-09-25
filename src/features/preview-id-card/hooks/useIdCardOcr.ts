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
import { loadIdCardDataWithPriority } from "@/lib/loadIdCardDataWithPriority";
import { hasStoredImage, loadImageFromCookie } from "@/lib/imageStorage";

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

  const COOKIE_KEY = "idcard_ocr_response"; // เปลี่ยน key ใหม่เพื่อไม่ conflict กับ usePersistedForm

  // ✅ ใช้ shared function สำหรับ priority
  const loadDataWithPriority = loadIdCardDataWithPriority;

  const mutation = useMutation({
    mutationKey: ["uploadIdCardOcr", kycRequestId],
    mutationFn: (file: File) => {
      if (!kycRequestId)
        throw new Error("Missing kycRequestId. Please sign in first.");

      // ✅ log ข้อมูลที่ส่งไป OCR
      console.log("[OCR] Uploading file:", {
        name: file.name,
        size: file.size,
        type: file.type,
        kycRequestId,
      });

      return uploadIdCardOcr(file, kycRequestId, setLoadingProgress);
    },
    onSuccess: async (d: OcrResponse) => {
      // ✅ log ข้อมูลที่ OCR ส่งกลับมา
      console.log("[OCR] Raw response data:", d);
      console.log("[OCR] Response data keys:", Object.keys(d));
      console.log("[OCR] Response data values:", Object.values(d));

      // ✅ ตรวจสอบว่า response มีข้อมูลจริงหรือไม่
      const hasData = d && typeof d === 'object' && Object.keys(d).length > 0;
      const hasValidIdNumber = d?.idNumber && typeof d.idNumber === 'string' && d.idNumber.trim().length > 0;
      
      console.log("[OCR] Has data:", hasData);
      console.log("[OCR] Has valid ID number:", hasValidIdNumber, d?.idNumber);

      if (!hasData || !hasValidIdNumber) {
        console.error("[OCR] Empty, invalid response data, or missing ID number");
        onError?.(new Error("Invalid OCR response or missing ID number"));
        return;
      }

      // ✅ สร้าง plain object โดยระบุ fields ที่ต้องการชัดเจน
      const ocrDataToSave = {
        idNumber: d.idNumber,
        idNumberFormatted: d.idNumberFormatted || "",
        firstNameThai: d.firstNameThai || "",
        lastNameThai: d.lastNameThai || "",
        firstNameEng: d.firstNameEng || "",
        lastNameEng: d.lastNameEng || "",
        birthDateThai: d.birthDateThai || "",
        issueDateThai: d.issueDateThai || "",
        expiryDateThai: d.expiryDateThai || "",
        address: d.address || "",
        titleThai: d.titleThai || "",
        // laserId: d.laserId || "",
        errors: d.errors || [],
      };

      console.log("[OCR] Prepared data to save:", ocrDataToSave);

      // ✅ เก็บลง cookie เฉพาะเมื่อมีข้อมูล idNumber
      try {
        saveFormToCookie(COOKIE_KEY, ocrDataToSave);
        console.log("[OCR] Cookie saved successfully");
        
        // ✅ ทดสอบอ่าน cookie กลับมาทันที
        const testRead = loadFormFromCookie<typeof ocrDataToSave>(COOKIE_KEY);
        console.log("[OCR] Test read cookie:", testRead);
        
        if (!testRead || !testRead.idNumber) {
          console.error("[OCR] Cookie save/read failed!");
        }
      } catch (error) {
        console.error("[OCR] Cookie save error:", error);
      }

      // ✅ set original data
      onSetOriginal?.({
        firstNameThai: d.firstNameThai || "",
        lastNameThai: d.lastNameThai || "",
        firstNameEng: d.firstNameEng || "",
        lastNameEng: d.lastNameEng || "",
      });

      // ✅ reset form
      const resetValues = buildResetValues(d);
      console.log("[OCR] Reset values:", resetValues);
      reset(resetValues as any);

      // ✅ trigger validation และ set errors
      setTimeout(async () => {
        if (requiredFields.length) {
          for (const f of requiredFields) await trigger(f);
        }
        (d.errors || []).forEach((err) => {
          setError(err.field as Path<TForm>, {
            type: "manual",
            message: err.message,
          });
        });
      }, 100);
    },
    onError: (err) => {
      console.error("OCR upload failed:", err);
      onError?.(err);
    },
  });

  const startFromSession = useCallback(() => {
    console.log("[useIdCardOcr] startFromSession called");
    
    if (!kycRequestId) {
      console.log("[useIdCardOcr] No kycRequestId, redirecting to login");
      router.replace(redirects.noSession || "/user-login");
      return;
    }

    // ✅ ลองอ่าน cookie พร้อม delay เล็กน้อยเพื่อให้ DOM stabilize
    setTimeout(() => {
      console.log("[useIdCardOcr] Attempting to load cookie...");
      
      // ✅ ใช้ priority function แทนการอ่าน OCR cookie โดยตรง
      const cookieData = loadDataWithPriority();
      console.log("[useIdCardOcr] Loaded cookie data:", cookieData);
      console.log("[useIdCardOcr] All cookie keys:", Object.keys(cookieData || {}));
      console.log("[useIdCardOcr] idNumber value:", cookieData?.idNumber, "length:", cookieData?.idNumber?.length);

      // เงื่อนไขการใช้ cookie - ปรับให้เข้มงวดขึ้น
      const hasCookie = !!(cookieData && typeof cookieData === 'object');
      const hasIdNumber = !!(cookieData?.idNumber && 
        typeof cookieData.idNumber === 'string' && 
        cookieData.idNumber.trim().length > 0);
      
      console.log("[useIdCardOcr] Cookie evaluation:", {
        hasCookie,
        hasIdNumber,
        idNumber: cookieData?.idNumber,
        cookieDataType: typeof cookieData,
        idNumberType: typeof cookieData?.idNumber,
      });

      if (hasCookie && hasIdNumber) {
        console.log("[useIdCardOcr] ✅ Using valid cookie data for form reset");
        
        const resetValues = buildResetValues(cookieData);
        console.log("[useIdCardOcr] Reset values from cookie:", resetValues);
        
        reset(resetValues as any);
        onSetOriginal?.({
          firstNameThai: cookieData.firstNameThai || "",
          lastNameThai: cookieData.lastNameThai || "",
          firstNameEng: cookieData.firstNameEng || "",
          lastNameEng: cookieData.lastNameEng || "",
        });
        return;
      }

      // ❌ ถ้าไม่มี cookie หรือ idNumber ว่าง → OCR ใหม่
      console.log("[useIdCardOcr] ❌ No valid cookie data, proceeding with OCR");

      // ✅ ตรวจสอบรูปจาก imageStorage ใหม่
      const hasImage = hasStoredImage();
      console.log("[useIdCardOcr] Has stored image:", hasImage);
      
      if (!hasImage) {
        console.log("[useIdCardOcr] No stored image, redirecting to home");
        router.replace(redirects.noImage || "/");
        return;
      }
      
      // ✅ โหลดรูปจาก storage
      const imageSrc = loadImageFromCookie();
      if (!imageSrc) {
        console.log("[useIdCardOcr] Failed to load image, redirecting");
        router.replace(redirects.noImage || "/");
        return;
      }
      
      try {
        console.log("[useIdCardOcr] Creating file from stored image and starting OCR");
        const file = base64StringToFile(imageSrc, "idcard_from_session.jpg");
        mutation.mutate(file);
      } catch (e) {
        console.error("[useIdCardOcr] Error creating file:", e);
        onError?.(e);
      }
    }, 100); 
  }, [
    kycRequestId,
    sessionImageKey,
    router,
    redirects.noImage,
    redirects.noSession,
    mutation,
    reset,
    onSetOriginal,
    buildResetValues,
  ]);

  const clearOcrCookie = useCallback(() => {
    console.log("[useIdCardOcr] Clearing OCR cookie");
    clearFormCookie(COOKIE_KEY);
  }, []);

  return {
    uploadFile: mutation.mutate,
    startFromSession,
    isUploading: mutation.isPending,
    loadingProgress,
    clearOcrCookie,
  };
}