"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { base64StringToFile, scoreName } from "@/lib/utils/index";
import FormIdCard from "../components/FormIdCard";
import AlertPopUp from "@/components/AlertPopUp";
import { idCardFormSchema, IdCardFormData } from "./../schemas/idcard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIdCardOcr } from "@/features/preview-id-card/hooks/useIdCardOcr";
import { useCanSubmit } from "../hooks/useCanSubmit";
import { useIdcardSubmit } from "../hooks/useIdcardSubmit";

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

  // state สำหรับ error alert
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
      laserId: d.laserId ?? "",
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
      "laserId",
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

  // ใช้ OCR / cookie ตอนเข้ามาครั้งแรก
  useEffect(() => {
    if (status !== "loading") {
      ocr.startFromSession();
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

    const thFirst = scoreName(originalData.firstNameThai, data.firstNameThai);
    const thLast = scoreName(originalData.lastNameThai, data.lastNameThai);
    const enFirst = scoreName(originalData.firstNameEng, data.firstNameEng);
    const enLast = scoreName(originalData.lastNameEng, data.lastNameEng);

    // ความยาวหลัง normalize (กัน null/undefined)
    const len = (s?: string) => (s ?? "").trim().length;

    const thLenSum =
      len(originalData.firstNameThai) + len(originalData.lastNameThai);
    const enLenSum =
      len(originalData.firstNameEng) + len(originalData.lastNameEng);

    const thWeighted =
      thLenSum === 0
        ? 100
        : (thFirst * len(originalData.firstNameThai) +
            thLast * len(originalData.lastNameThai)) /
          thLenSum;

    const enWeighted =
      enLenSum === 0
        ? 100
        : (enFirst * len(originalData.firstNameEng) +
            enLast * len(originalData.lastNameEng)) /
          enLenSum;

    const FIELD_MIN = 60;
    const LANG_MIN = 60;

    const thaiPass =
      thFirst >= FIELD_MIN && thLast >= FIELD_MIN && thWeighted >= LANG_MIN;
    const engPass =
      enFirst >= FIELD_MIN && enLast >= FIELD_MIN && enWeighted >= LANG_MIN;

    if (!thaiPass || !engPass) {
      setShowDialog(true);
      return;
    }

    try {
      if (!ocr.imageSrc) throw new Error("Missing captured ID card image file");

      const files = await base64StringToFile(ocr.imageSrc, "idcard.jpg");

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
        capturedImage={ocr?.imageSrc ?? null}
        isValid={isValid}
        isLoading={ocr.isUploading}
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
