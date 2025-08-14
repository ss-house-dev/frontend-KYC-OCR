"use client";

import React, { useEffect, useState } from "react";
import { Path, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
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
  birthDateThai: "",
  address: "",
  laserId: "",
  errors: [{ field: "", message: "" }],
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
  const [canSubmit, setCanSubmit] = useState(false);

  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    control,
    setError,
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

      // set API errors into form
      (ocrData.errors || []).forEach((err) => {
        setError(err.field as Path<PreviewIdCardForm>, {
          type: "manual",
          message: err.message,
        });
      });
    },
    //alert error
    // onError: (err) => {
    //   console.error("OCR upload failed:", err);
    //   alert("ไม่สามารถอ่านข้อมูลจากบัตรได้ โปรดลองอีกครั้ง");
    // },
  });

  // mockdata
  // const ocrMutation = useMutation({
  //   mutationKey: ["uploadIdCardOcr"],
  //   mutationFn: async () => {
  //     await new Promise((res) => setTimeout(res, 500)); // delay จำลอง
  //     return {
  //       idNumber: "1-23456-7890-12-3",
  //       firstNameThai: "ไอรินทร์",
  //       lastNameThai: "เมษะสิทธิโรจน์",
  //       birthDateThai: "01-01-1980",
  //       issueDateThai: "01-01-2020",
  //       expiryDateThai: "20-08-2025",
  //       address: "310/11",
  //       titleThai: "นาง",
  //       // errors: [
  //       //   { field: "firstNameThai", message: "This field is needed" },
  //       //   { field: "lastNameThai", message: null },
  //       //   { field: "expiryDateThai", message: null },
  //       // ],
  //     } as OcrResponse;
  //   },
  //   onSuccess: (ocrData) => {
  //     reset({
  //       idNumber: ocrData.idNumber || "",
  //       firstNameThai: ocrData.firstNameThai || "",
  //       lastNameThai: ocrData.lastNameThai || "",
  //       birthDateThai: ocrData.birthDateThai || "",
  //       issueDateThai: ocrData.issueDateThai || "",
  //       expiryDateThai: ocrData.expiryDateThai || "",
  //       address: ocrData.address || "",
  //       titleThai: ocrData.titleThai || "",
  //     });

  //     (ocrData.errors || []).forEach((err) => {
  //       setError(err.field as Path<PreviewIdCardForm>, {
  //         type: "manual",
  //         message: err.message,
  //       });
  //     });
  //   },
  // });

  useEffect(() => {
    const processImageOnMount = async () => {
      const imageSrc = sessionStorage.getItem("capturedIdCardImage");

      if (!imageSrc) {
        router.replace("/");
        return;
      }
      // mockdata
      // ocrMutation.mutate();
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
  }, []);

  const watchedValues = watch();

  useEffect(() => {
    const allFieldsFilled = Object.values(watchedValues).every(
      (value) => value !== "" && value !== null && value !== undefined
    );
    const noErrors = Object.keys(errors).length === 0;

    setCanSubmit(allFieldsFilled && noErrors);
  }, [watchedValues, errors]);

  const onSubmit = (data: PreviewIdCardForm) => {
    console.log("Form submitted:", data);
    alert("บันทึกข้อมูลสำเร็จ!");
  };

  return (
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
  );
}
