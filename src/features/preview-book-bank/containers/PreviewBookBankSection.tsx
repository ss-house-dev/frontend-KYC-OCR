"use client";

import React, { useState, useEffect } from "react";
import { Path, useForm } from "react-hook-form";
import FormBookBank from "../components/FormBookBank";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { uploadBookBankOcr, OcrResponse } from "../services";

const defaultFormValues = {
  bank: "",
  branchNameThai: "",
  accountNameThai: "",
  accountNumber: "",
  errors: [{ field: "", message: "" }],
};

type BookBankFormValues = typeof defaultFormValues;

const bankOptions = [
  { value: "kbank", label: "KBANK", image: "/logobank/KBANK.jpg" },
  { value: "scb", label: "SCB", image: "/logobank/SCB.png" },
  { value: "ktb", label: "KTB", image: "/logobank/KTB.png" },
];

const base64StringToFile = (base64String: string, filename: string): File => {
  const [meta, data] = base64String.split(",");
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const bstr = atob(data);
  const u8 = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
  return new File([u8], filename, { type: mime });
};

export default function BookBankPage() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const router = useRouter();
  const [canSubmit, setCanSubmit] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const {
    handleSubmit,
    watch,
    reset,
    register,
    control,
    setError,
    formState: { errors, isValid },
  } = useForm<BookBankFormValues>({
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const ocrMutation = useMutation({
    mutationKey: ["uploadBookBankOcr"],
    mutationFn: (file: File) => uploadBookBankOcr(file, setLoadingProgress),
    onSuccess: (ocrData: OcrResponse) => {
      console.log("OCR Success, resetting form with:", ocrData);
      reset({
        branchNameThai: ocrData.branchNameThai || "",
        accountNameThai: ocrData.accountNameThai || "",
        accountNumber: ocrData.accountNumber || "",
      });
      // set API errors into form
      (ocrData.errors || []).forEach((err) => {
        setError(err.field as Path<BookBankFormValues>, {
          type: "manual",
          message: err.message,
        });
      });
    },
    // onError: (err) => {
    //   console.error("OCR upload failed:", err);
    //   alert("ไม่สามารถอ่านข้อมูลจากบัตรได้ โปรดลองอีกครั้ง");
    // },
  });


  useEffect(() => {
    const processImageOnMount = async () => {
      const dataUrl = sessionStorage.getItem("capturedBookBankImage");

      if (!dataUrl) {
        router.replace("/book-bank-accept");
        return;
      }
      if (dataUrl) setPreviewImage(dataUrl);
      
      if (dataUrl) {
        try {
          const file = base64StringToFile(dataUrl, "idcard_from_session.jpg");
          ocrMutation.mutate(file);
        } catch (e) {
          console.error("Failed to process image from sessionStorage:", e);
          alert("รูปแบบรูปภาพใน Session ไม่ถูกต้อง");
          router.replace("/book-bank-accept");
        }
      } else {
        console.warn(
          "No image in session. Falling back to test image '/idcard.jpg'"
        );
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], dataUrl, { type: blob.type });
          ocrMutation.mutate(file);
        } catch (fetchError) {
          console.error("Failed to fetch test image:", fetchError);
          alert("ไม่พบรูปภาพสำหรับทดสอบ");
          router.replace("/book-bank-accept");
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

  const onSubmit = (data: BookBankFormValues) => {
    console.log("Form submitted:", data);
    // alert("บันทึกข้อมูลสำเร็จ!");
    router.push("/verification-complete");
  };

  return (
    <>
      <FormBookBank
        onSubmit={handleSubmit(onSubmit)}
        register={register}
        watch={watch}
        control={control}
        errors={errors}
        capturedImage={previewImage}
        bankOptions={bankOptions}
        isValid={isValid}
        canSubmit={canSubmit}
        isLoading={ocrMutation.isPending}
        loadingProgress={loadingProgress}
      />
    </>
  );
}
