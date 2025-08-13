"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormIdCard from "../components/FormIdCard";
import {
  uploadIdCardOcr,
  OcrResponse,
} from "@/features/preview-id-card/services/ocr";

const defaultFormValues = {
  idNumber: "",
  titleThai: "",
  issueDateThai: "",
  expiryDateThai: "",
  firstNameThai: "",
  lastNameThai: "",
  birthdateThai: "",
  address: "",
  laserId: "",
};

type PreviewIdCardForm = typeof defaultFormValues;

const base64StringToFile = (base64String: string, filename: string): File => {
  const [meta, data] = base64String.split(",");
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const bstr = atob(data);
  const u8 = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
  return new File([u8], filename, { type: mime });
};

export default function VerifyIdentityScreen() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const router = useRouter();

  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    control,
  } = useForm<PreviewIdCardForm>({
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const ocrMutation = useMutation({
    mutationKey: ["uploadIdCardOcr"],
    mutationFn: (file: File) => uploadIdCardOcr(file, setLoadingProgress),
    onSuccess: (ocrData: OcrResponse) => {
      console.log("OCR Success, resetting form with:", ocrData);
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
    },
    onError: (err) => {
      console.error("OCR upload failed:", err);
      alert("ไม่สามารถอ่านข้อมูลจากบัตรได้ โปรดลองอีกครั้ง");
    },
  });

  useEffect(() => {
    const processImageOnMount = async () => {
      const imageSrc = sessionStorage.getItem("capturedIdCardImage");
      
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
        console.warn("No image in session. Falling back to test image '/idcard.jpg'");
        try {
            const response = await fetch("/idcard.jpg");
            const blob = await response.blob();
            const file = new File([blob], "idcard.jpg", { type: blob.type });
            ocrMutation.mutate(file); 
        } catch (fetchError) {
            console.error("Failed to fetch test image:", fetchError);
            alert("ไม่พบรูปภาพสำหรับทดสอบ");
            router.replace("/");
        }
      }
    };
    processImageOnMount();
  }, []); 

  const onSubmit = (data: PreviewIdCardForm) => {
    console.log("Form submitted:", data);
    alert("บันทึกข้อมูลสำเร็จ!");
  };

  return (
    <FormIdCard
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      control={control}          // ✅ ต้องส่ง control ให้ Controller
      errors={errors}
      watch={watch}
      capturedImage={
        typeof window !== "undefined"
          ? sessionStorage.getItem("capturedIdCardImage")
          : null
      }
      isValid={isValid}
      isLoading={ocrMutation.isPending}
      loadingProgress={loadingProgress}
    />
  );
}
