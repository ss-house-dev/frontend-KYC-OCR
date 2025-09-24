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
import FormIdCard from "../components/FormIdCard";
import AlertPopUp from "@/components/AlertPopUp";
import { idCardFormSchema, IdCardFormData } from "./../schemas/idcard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIdCardOcr } from "@/features/preview-id-card/hooks/useIdCardOcr";
import { useCanSubmit } from "../hooks/useCanSubmit";
import { useIdcardSubmit } from "../hooks/useIdcardSubmit";

// ✅ Interface สำหรับ OCR cookie data
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

  // ✅ log session / kycRequestId
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

  // ✅ ตรวจสอบว่ามีข้อมูล OCR ใน cookie หรือไม่
  const hasOcrData = () => {
    const cookieData = loadFormFromCookie<OcrCookieData>("idcard_ocr_response");
    return !!(cookieData && cookieData.idNumber && cookieData.idNumber.trim().length > 0);
  };

  // ✅ ใช้ usePersistedForm เฉพาะเมื่อไม่มี OCR loading และมีข้อมูล OCR แล้ว
  const shouldPersist = !ocr.isUploading && hasOcrData();
  
  if (shouldPersist) {
    usePersistedForm<IdCardFormData>(form, "id-accept:form", 30, ["errors"]);
    console.log("[VerifyIdentityScreen] usePersistedForm enabled");
  } else {
    console.log("[VerifyIdentityScreen] usePersistedForm disabled - OCR loading or no data");
  }

  // ✅ ใช้ OCR / cookie ตอนเข้ามาครั้งแรก
  useEffect(() => {
    if (status !== "loading") {
      console.log(
        "[VerifyIdentityScreen] Starting OCR or loading from cookie..."
      );
      ocr.startFromSession();

      // log ค่าใน cookie ทุกครั้งที่ mount
      const cookieData = loadFormFromCookie<OcrCookieData>("idcard_ocr_response");
      console.log("[VerifyIdentityScreen] Cookie data on mount:", cookieData);
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
      const captured =
        typeof window !== "undefined"
          ? sessionStorage.getItem("capturedIdCardImage")
          : null;
      console.log(
        "[VerifyIdentityScreen] Captured image from sessionStorage:",
        captured ? "FOUND" : "NOT FOUND"
      );
      if (!captured) throw new Error("Missing captured ID card image file");

      const file = base64StringToFile(captured, "idcard.jpg");

      await submit({
        file,
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
        capturedImage={
          typeof window !== "undefined"
            ? sessionStorage.getItem("capturedIdCardImage")
            : null
        }
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