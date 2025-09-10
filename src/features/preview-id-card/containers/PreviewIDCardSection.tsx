"use client";

import React, { useEffect, useState } from "react";
import { Path, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { usePersistedForm } from "@/lib/client/usePersistedForm";
import { base64StringToFile, calculateSimilarity } from "@/lib/utils/index";
import FormIdCard from "../components/FormIdCard";
import AlertPopUp from "@/components/AlertPopUp";
import {
  uploadIdCardOcr,
  OcrResponse,
} from "@/features/preview-id-card/services/ocr-id-card";
import { idCardFormSchema, IdCardFormData } from "./../schemas/idcard";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";

const defaultFormValues = {
  idNumber: "",
  titleThai: "",
  issueDateThai: "",
  expiryDateThai: "",
  firstNameThai: "",
  lastNameThai: "",
  birthDateThai: "",
  address: "",
  laserId: "",
};

type PreviewIdCardForm = typeof defaultFormValues;

export default function VerifyIdentityScreen() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const router = useRouter();
  const [canSubmit, setCanSubmit] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<{
    firstNameThai: string;
    lastNameThai: string;
  }>({ firstNameThai: "", lastNameThai: "" });
  const { data: session, status } = useSession();
  const kycRequestId = session?.kycRequestId;

    const form = useForm<IdCardFormData>({
    resolver: zodResolver(idCardFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    control,
    setError,
    trigger,
  } = form;

  usePersistedForm<IdCardFormData>(form, "id-accept:form", 30, ["errors"]);

  const ocrMutation = useMutation({
    mutationKey: ["uploadIdCardOcr", kycRequestId],
    mutationFn: (file: File) =>
      uploadIdCardOcr(file, kycRequestId, setLoadingProgress),

    onSuccess: (ocrData: OcrResponse) => {
      console.log("OCR Success, resetting form with:", ocrData);

      // เก็บข้อมูลเดิมจาก OCR
      setOriginalData({
        firstNameThai: ocrData.firstNameThai || "",
        lastNameThai: ocrData.lastNameThai || "",
      });

      reset({
        idNumber: ocrData.idNumber || "",
        firstNameThai: ocrData.firstNameThai || "",
        lastNameThai: ocrData.lastNameThai || "",
        birthDateThai: ocrData.birthDateThai || "",
        issueDateThai: ocrData.issueDateThai || "",
        expiryDateThai: ocrData.expiryDateThai || "",
        address: ocrData.address || "",
        titleThai: ocrData.titleThai || "",
      });

      setTimeout(async () => {
        // ตรวจสอบและ set error สำหรับ field ที่ required แต่ไม่มีค่า
        const requiredFields = [
          { field: "titleThai", value: ocrData.titleThai },
          { field: "firstNameThai", value: ocrData.firstNameThai },
          { field: "lastNameThai", value: ocrData.lastNameThai },
          { field: "idNumber", value: ocrData.idNumber },
          { field: "birthDateThai", value: ocrData.birthDateThai },
          { field: "issueDateThai", value: ocrData.issueDateThai },
          { field: "expiryDateThai", value: ocrData.expiryDateThai },
          { field: "address", value: ocrData.address },
        ];

        for (const { field, value } of requiredFields) {
          if (!value || value.trim() === "") {
            await trigger(field as Path<PreviewIdCardForm>);
          }
        }

        // set API errors ที่มาจากระบบ OCR
        (ocrData.errors || []).forEach((err) => {
          setError(err.field as Path<PreviewIdCardForm>, {
            type: "manual",
            message: err.message,
          });
        });
      }, 100);
    },
    //alert error ไว้ใช้ใน sprint หน้า
    onError: (err) => {
      console.error("OCR upload failed:", err);
      alert(err instanceof Error ? err.message : "Upload failed");    },
  });

  useEffect(() => {
    const processImageOnMount = async () => {
      if (status === "loading") return;
      if (!kycRequestId) {
        router.replace("/user-login");
        return;
      }

      const imageSrc = sessionStorage.getItem("capturedIdCardImage");
      if (!imageSrc) {
        router.replace("/");
        return;
      }
      if (imageSrc) {
        try {
          const file = base64StringToFile(imageSrc, "idcard_from_session.jpg");
          ocrMutation.mutate(file);
        } catch (e) {
          console.error("Failed to process image from sessionStorage:", e);
          alert("รูปแบบรูปภาพใน Session ไม่ถูกต้อง");
          router.replace("/");
        }
      } else {
        console.warn(
          "No image in session. Falling back to test image '/idcard.jpg'"
        );
        try {
          const response = await fetch(imageSrc);
          const blob = await response.blob();
          const file = new File([blob], imageSrc, { type: blob.type });
          ocrMutation.mutate(file);
        } catch (fetchError) {
          console.error("Failed to fetch test image:", fetchError);
          alert("ไม่พบรูปภาพสำหรับทดสอบ");
          router.replace("/");
        }
      }
    };
    processImageOnMount();
  }, [status, kycRequestId]);

  const watchedValues = watch();

  useEffect(() => {
    const disabledFields = [
      "idNumber",
      "issueDateThai",
      "expiryDateThai",
      "birthDateThai",
    ];

    const editableFields = [
      "titleThai",
      "firstNameThai",
      "lastNameThai",
      "address",
      "laserId",
    ];

    const disabledFieldsValid = disabledFields.every((fieldName) => {
      const value = watchedValues[fieldName as keyof typeof watchedValues];
      const hasValue = value !== "" && value !== null && value !== undefined;
      const hasError = errors[fieldName as keyof typeof errors];
      return hasValue && !hasError;
    });

    const editableFieldsValid = editableFields.every((fieldName) => {
      const value = watchedValues[fieldName as keyof typeof watchedValues];
      const hasValue = value !== "" && value !== null && value !== undefined;
      const hasError = errors[fieldName as keyof typeof errors];
      return hasValue && !hasError;
    });

    setCanSubmit(disabledFieldsValid && editableFieldsValid);
  }, [watchedValues, errors]);

  const onSubmit = (data: PreviewIdCardForm) => {
    console.log("Form submitted:", data);

    // เช็คความคล้ายคลึงของชื่อ
    const firstNameSimilarity = calculateSimilarity(
      originalData.firstNameThai,
      data.firstNameThai
    );
    const lastNameSimilarity = calculateSimilarity(
      originalData.lastNameThai,
      data.lastNameThai
    );

    const overallSimilarity = (firstNameSimilarity + lastNameSimilarity) / 2;

    if (overallSimilarity < 60) {
      setPendingData(data);
      setShowDialog(true);
    } else {
      router.push("/face-accept");
    }
  };

  const handleRetry = () => {
    setShowDialog(false);
    setPendingData(null);
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
        isLoading={ocrMutation.isPending}
        loadingProgress={loadingProgress}
      />

      <AlertPopUp
        isOpen={showDialog}
        title="Edited Name Doesn’t Match"
        message={`Your edited name is very different the extracted name, Please correct it to continue.`}
        onRetry={handleRetry}
      />
    </>
  );
}
