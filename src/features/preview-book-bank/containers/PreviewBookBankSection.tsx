"use client";

import React, { useState, useEffect } from "react";
import { Path, useForm } from "react-hook-form";
import FormBookBank from "../components/FormBookBank";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { uploadBookBankOcr, OcrResponse } from "../services";
import AlertPopUp from "@/components/AlertPopUp";

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

// ฟังก์ชันคำนวณความคล้ายคลึง
const calculateSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 100;

  const matrix = [];
  for (let i = 0; i <= longer.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= shorter.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= longer.length; i++) {
    for (let j = 1; j <= shorter.length; j++) {
      if (longer.charAt(i - 1) === shorter.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[longer.length][shorter.length];
  return ((longer.length - distance) / longer.length) * 100;
};

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
  const [showDialog, setShowDialog] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<{
    accountNameThai: string;
  }>({ accountNameThai: "" });

  const {
    handleSubmit,
    watch,
    reset,
    register,
    control,
    setError,
    trigger,
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

      // เก็บข้อมูลเดิมจาก OCR
      setOriginalData({
        accountNameThai: ocrData.accountNameThai || "",
      });

      reset({
        branchNameThai: ocrData.branchNameThai || "",
        accountNameThai: ocrData.accountNameThai || "",
        accountNumber: ocrData.accountNumber || "",
      });

      setTimeout(async () => {
        // ตรวจสอบและ set error สำหรับ field ที่ required แต่ไม่มีค่า
        const requiredFields = [
          { field: "branchNameThai", value: ocrData.branchNameThai },
          { field: "accountNameThai", value: ocrData.accountNameThai },
          { field: "accountNumber", value: ocrData.accountNumber },
        ];

        for (const { field, value } of requiredFields) {
          if (!value || value.trim() === "") {
            await trigger(field as Path<BookBankFormValues>);
          }
        }

        // set API errors into form
        (ocrData.errors || []).forEach((err) => {
          setError(err.field as Path<BookBankFormValues>, {
            type: "manual",
            message: err.message,
          });
        });
      }, 100);
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

    // เช็คความคล้ายคลึงของชื่อ
    const accountNameSimilarity = calculateSimilarity(
      originalData.accountNameThai,
      data.accountNameThai
    );

    if (accountNameSimilarity < 60) {
      setPendingData(data);
      setShowDialog(true);
    } else {
      router.push("/verification-complete");
    }
  };

  const handleRetry = () => {
    setShowDialog(false);
    setPendingData(null);
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

      <AlertPopUp
        isOpen={showDialog}
        title="Edited Name Doesn’t Match"
        message={`Your edited name is very different the extracted name, Please correct it to continue.`}
        onRetry={handleRetry}
      />
    </>
  );
}
