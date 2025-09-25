"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePersistedForm } from "@/lib/client/usePersistedForm";
import {
  base64StringToFile,
  calculateSimilarity,
  loadFormFromCookie,
} from "@/lib/utils/index";
import { loadIdCardDataWithPriority } from "@/lib/loadIdCardDataWithPriority";
import { loadImageFromCookie } from "@/lib/imageStorage";
import FormIdCard from "../components/FormIdCard";
import AlertPopUp from "@/components/AlertPopUp";
import { idCardFormSchema, IdCardFormData } from "./../schemas/idcard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIdCardOcr } from "@/features/preview-id-card/hooks/useIdCardOcr";
import { useCanSubmit } from "../hooks/useCanSubmit";
import { useIdcardSubmit } from "../hooks/useIdcardSubmit";

const COOKIE_KEYS = {
  OCR_RESPONSE: "idcard_ocr_response", 
  FORM_EDITED: "idcard_form_edited", 
  FORM_PERSISTED: "id-accept:form", 
} as const;

// Interface สำหรับ OCR cookie data
interface OcrCookieData {
  idNumber?: string;
  idNumberFormatted?: string;
  firstNameThai?: string;
  lastNameThai?: string;
  firstNameEng?: string;
  lastNameEng?: string;
  birthDateThai?: string;
  issueDateThai?: string;
  expiryDateThai?: string;
  address?: string;
  titleThai?: string;
  laserId?: string;
}

const defaultFormValues: IdCardFormData = {
  idNumber: "",
  idNumberFormatted: "",
  titleThai: "",
  issueDateThai: "",
  expiryDateThai: "",
  firstNameThai: "",
  lastNameThai: "",
  firstNameEng: "",
  lastNameEng: "",
  birthDateThai: "",
  address: "",
  laserId: "",
};

export default function VerifyIdentityScreen() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingData, setPendingData] = useState<IdCardFormData | null>(null);
  const { submit } = useIdcardSubmit();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState({
    firstNameThai: "",
    lastNameThai: "",
    firstNameEng: "",
    lastNameEng: "",
  });

  const { data: session, status } = useSession();
  const kycRequestId = session?.kycRequestId;

  // log session / kycRequestId
  useEffect(() => {
    console.log("[VerifyIdentityScreen] Session:", session);
    console.log("[VerifyIdentityScreen] kycRequestId:", kycRequestId);
  }, [session, kycRequestId]);

  const form = useForm<IdCardFormData>({
    resolver: zodResolver(idCardFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    control,
  } = form;

  const ocr = useIdCardOcr<IdCardFormData>({
    kycRequestId,
    form,
    onSetOriginal: setOriginalData,
    buildResetValues: (d) => ({
      idNumber: d.idNumber ?? "",
      idNumberFormatted: d.idNumberFormatted ?? "",
      firstNameThai: d.firstNameThai ?? "",
      lastNameThai: d.lastNameThai ?? "",
      firstNameEng: d.firstNameEng ?? "",
      lastNameEng: d.lastNameEng ?? "",
      birthDateThai: d.birthDateThai ?? "",
      issueDateThai: d.issueDateThai ?? "",
      expiryDateThai: d.expiryDateThai ?? "",
      address: d.address ?? "",
      titleThai: d.titleThai ?? "",
    }),
    requiredFields: [
      "idNumber",
      "idNumberFormatted",
      "titleThai",
      "firstNameThai",
      "lastNameThai",
      "firstNameEng",
      "lastNameEng",
      "birthDateThai",
      "issueDateThai",
      "expiryDateThai",
      "address",
    ],
    onError: (err) => {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed");
    },
  });

  // ตรวจสอบว่ามีข้อมูล OCR ใน cookie หรือไม่
  const hasOcrData = () => {
    const cookieData = loadFormFromCookie<OcrCookieData>(
      COOKIE_KEYS.OCR_RESPONSE
    );
    return !!(
      cookieData &&
      cookieData.idNumber &&
      cookieData.idNumber.trim().length > 0
    );
  };

  // ฟังก์ชันดึงข้อมูลตาม priority: FORM_EDITED > OCR_RESPONSE
  const loadDataWithPriority = loadIdCardDataWithPriority;

  // เรียก hook ทุกครั้ง แต่ส่ง flag เข้าไป
  const persistForm = usePersistedForm<IdCardFormData>(
    form,
    "id-accept:form",
    30,
    ["errors"]
  );

  useEffect(() => {
    if (ocr.isUploading || !hasOcrData()) {
      console.log("[VerifyIdentityScreen] usePersistedForm disabled");
      // ไม่ต้องใช้ persistForm
    } else {
      console.log("[VerifyIdentityScreen] usePersistedForm enabled");
      // persistForm จะเริ่มทำงานเอง
    }
  }, [ocr.isUploading]);

  // ใช้ OCR / cookie ตอนเข้ามาครั้งแรก
  useEffect(() => {
    if (status !== "loading") {
      console.log(
        "[VerifyIdentityScreen] Starting OCR or loading from cookie..."
      );

      // ตรวจสอบข้อมูลที่มีอยู่ก่อน
      const existingData = loadDataWithPriority();
      if (existingData) {
        console.log("[VerifyIdentityScreen] Found existing data, skipping OCR");
        // ใช้ข้อมูลที่มีอยู่แล้ว
        const resetValues = {
          idNumber: existingData.idNumber ?? "",
          idNumberFormatted: existingData.idNumberFormatted ?? "",
          firstNameThai: existingData.firstNameThai ?? "",
          lastNameThai: existingData.lastNameThai ?? "",
          firstNameEng: existingData.firstNameEng ?? "",
          lastNameEng: existingData.lastNameEng ?? "",
          birthDateThai: existingData.birthDateThai ?? "",
          issueDateThai: existingData.issueDateThai ?? "",
          expiryDateThai: existingData.expiryDateThai ?? "",
          address: existingData.address ?? "",
          titleThai: existingData.titleThai ?? "",
        };
        form.reset(resetValues);
        setOriginalData({
          firstNameThai: existingData.firstNameThai ?? "",
          lastNameThai: existingData.lastNameThai ?? "",
          firstNameEng: existingData.firstNameEng ?? "",
          lastNameEng: existingData.lastNameEng ?? "",
        });
      } else {
        console.log("[VerifyIdentityScreen] No existing data, starting OCR");
        ocr.startFromSession();
      }

      // log ค่าใน cookie ทุกครั้งที่ mount
      console.log("[VerifyIdentityScreen] Cookie data on mount:", {
        edited: loadFormFromCookie<OcrCookieData>(COOKIE_KEYS.FORM_EDITED),
        ocr: loadFormFromCookie<OcrCookieData>(COOKIE_KEYS.OCR_RESPONSE),
      });
    }
  }, [status]);

  const canSubmit = useCanSubmit<IdCardFormData>(watch, errors, {
    required: [
      "idNumber",
      "idNumberFormatted",
      "issueDateThai",
      "expiryDateThai",
      "birthDateThai",
      "titleThai",
      "firstNameThai",
      "lastNameThai",
      "firstNameEng",
      "lastNameEng",
      "address",
      "laserId",
    ],
  });

  const onSubmit = async (data: IdCardFormData) => {
    setIsSubmitting(true);

    console.log("[VerifyIdentityScreen] Submitting form data:", data);
    console.log("[VerifyIdentityScreen] Original OCR data:", originalData);

    const firstNameSimilarity = calculateSimilarity(
      originalData.firstNameThai,
      data.firstNameThai
    );
    const lastNameSimilarity = calculateSimilarity(
      originalData.lastNameThai,
      data.lastNameThai
    );
    const firstNameEngSimilarity = calculateSimilarity(
      originalData.firstNameEng,
      data.firstNameEng
    );
    const lastNameEngSimilarity = calculateSimilarity(
      originalData.lastNameEng,
      data.lastNameEng
    );

    const overallSimilarityThai =
      (firstNameSimilarity + lastNameSimilarity) / 2;
    const overallSimilarityEng =
      (firstNameEngSimilarity + lastNameEngSimilarity) / 2;

    if (overallSimilarityThai < 60 || overallSimilarityEng < 60) {
      setPendingData(data);
      setShowDialog(true);
      return;
    }

    try {
      const captured = loadImageFromCookie(); // จะโหลดจาก sessionStorage ก่อน แล้วค่อย fallback cookie
      console.log(
        "[VerifyIdentityScreen] Captured image from storage:",
        captured ? "FOUND" : "NOT FOUND"
      );
      if (!captured) throw new Error("Missing captured ID card image file");

      const files = base64StringToFile(captured, "idcard.jpg");

      await submit({
        files,
        kycRequestId: kycRequestId!,
        fields: {
          idNumber: data.idNumber,
          firstNameThai: data.firstNameThai,
          lastNameThai: data.lastNameThai,
          firstNameEng: data.firstNameEng,
          lastNameEng: data.lastNameEng,
          dateOfBirth: data.birthDateThai,
          dateOfIssue: data.issueDateThai,
          dateOfExpiry: data.expiryDateThai,
          address: data.address,
          titleNameThai: data.titleThai,
          laserId: data.laserId,
        },
      });
      console.log("Submit successful");
      router.push("/face-accept");
    } catch (err) {
      console.error(err);
      // alert(err instanceof Error ? err.message : "Submit failed");
    }
  };

  return (
    <>
      <FormIdCard
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        control={control}
        errors={errors}
        watch={watch}
        canSubmit={canSubmit}
        capturedImage={loadImageFromCookie()} // ใช้ image จาก cookie (SSR-safe)
        isValid={isValid}
        isLoading={ocr.isUploading}
        loadingProgress={ocr.loadingProgress}
        isSubmitting={isSubmitting}
      />

      <AlertPopUp
        isOpen={showDialog}
        title="Edited Name Doesn&rsquo;t Match"
        message="Your edited name is very different the extracted name, Please correct it to continue."
        onRetry={() => {
          setShowDialog(false);
          setPendingData(null);
        }}
      />
    </>
  );
}
