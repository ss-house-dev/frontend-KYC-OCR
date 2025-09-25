"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

// ✅ Cookie Keys Constants
const COOKIE_KEYS = {
  OCR_RESPONSE: "idcard_ocr_response",
  FORM_EDITED: "idcard_form_edited",
} as const;

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
  const { submit } = useIdcardSubmit();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState({
    firstNameThai: "",
    lastNameThai: "",
    firstNameEng: "",
    lastNameEng: "",
  });

  // ✅ state สำหรับ error alert
  const [errorAlert, setErrorAlert] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    imageSrc?: string;
    redirectTo?: string;
  }>({ isOpen: false, message: "" });

  const { data: session, status } = useSession();
  const kycRequestId = session?.kycRequestId;

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
      setErrorAlert({
        isOpen: true,
        title: "ID Card not found",
        message: "Unable to detect ID Card, please retake photo",
        imageSrc: "/popup/error-ocr-idcard.png",
        redirectTo: "/scan-id-card",
      });
    },
  });


  // ✅ ใช้ OCR / cookie ตอนเข้ามาครั้งแรก
  useEffect(() => {
    if (status !== "loading") {
      console.log(
        "[VerifyIdentityScreen] Starting OCR or loading from cookie..."
      );

      const existingData = loadIdCardDataWithPriority();
      if (existingData) {
        console.log("[VerifyIdentityScreen] Found existing data, skipping OCR");
        form.reset(existingData);
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
      setShowDialog(true);
      return;
    }

    try {
      const captured = loadImageFromCookie();
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
        capturedImage={loadImageFromCookie()}
        isValid={isValid}
        isLoading={ocr.isUploading}
        loadingProgress={ocr.loadingProgress}
        isSubmitting={isSubmitting}
      />

      {/* Alert: case similarity ไม่ตรง */}
      <AlertPopUp
        isOpen={showDialog}
        title="Edited Name Doesn’t Match"
        message="Your edited name is very different the extracted name, Please correct it to continue."
        onRetry={() => {
          setShowDialog(false);
        }}
        imageSrc="/popup/error-editname.png"
      />

      {/* Alert: case OCR error */}
      <AlertPopUp
        isOpen={errorAlert.isOpen}
        title={errorAlert.title}
        message={errorAlert.message}
        onRetry={() => setErrorAlert({ ...errorAlert, isOpen: false })}
        imageSrc={errorAlert.imageSrc}
        redirectTo={errorAlert.redirectTo}
      />
    </>
  );
}
