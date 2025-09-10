"use client";

import React, { useState, useEffect } from "react";
import { Path, useForm } from "react-hook-form";
import FormBookBank from "../components/FormBookBank";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { uploadBookBankOcr, OcrResponse } from "../services";
import { usePersistedForm } from "@/lib/client/usePersistedForm";
import AlertPopUp from "@/components/AlertPopUp";
import { base64StringToFile, calculateSimilarity } from "@/lib/utils/index";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { bookbankFormSchema, BookBankFormData } from "./../schemas/bookbank";

const defaultFormValues = {
  bank: "",
  branchNameThai: "",
  accountNameThai: "",
  accountNameEng: "",
  accountNumber: "",
  // errors: [{ field: "", message: "" }],
};

type BookBankFormValues = typeof defaultFormValues;

const bankOptions = [
  { value: "kbank", label: "KBANK", image: "/logobank/KBANK.jpg" },
  { value: "scb", label: "SCB", image: "/logobank/SCB.png" },
  { value: "ktb", label: "KTB", image: "/logobank/KTB.png" },
];

export default function BookBankPage() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const router = useRouter();
  const [canSubmit, setCanSubmit] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [originalData, setOriginalData] = useState<{
    accountNameThai: string;
    accountNameEng: string;
  }>({ accountNameThai: "", accountNameEng: "" });

  const { data: session, status } = useSession();
  const kycRequestId = session?.kycRequestId;

  const form = useForm<BookBankFormValues>({
    resolver: zodResolver(bookbankFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
  });

  const {
    handleSubmit,
    watch,
    reset,
    register,
    control,
    setError,
    trigger,
    formState: { errors, isValid },
  } = form;

  usePersistedForm<BookBankFormData>(form, "book-bank:form", 30, ["errors"]);

  const ocrMutation = useMutation({
    mutationKey: ["uploadBookBankOcr", kycRequestId],
    mutationFn: (file: File) => {
      if (!kycRequestId)
        throw new Error("Missing kycRequestId. Please sign in first.");
      return uploadBookBankOcr(file, kycRequestId, setLoadingProgress);
    },
    onSuccess: (ocrData: OcrResponse) => {
      console.log("OCR Success, resetting form with:", ocrData);

      // เก็บข้อมูลเดิมจาก OCR
      setOriginalData({
        accountNameThai: ocrData.accountNameThai || "",
        accountNameEng: ocrData.accountNameEng || "",
      });

      reset({
        branchNameThai: ocrData.branchNameThai || "",
        accountNameThai: ocrData.accountNameThai || "",
        accountNameEng: ocrData.accountNameEng || "",
        accountNumber: ocrData.accountNumber || "",
      });

      setTimeout(async () => {
        // ตรวจสอบและ set error สำหรับ field ที่ required แต่ไม่มีค่า
        const requiredFields = [
          { field: "branchNameThai", value: ocrData.branchNameThai },
          { field: "accountNameThai", value: ocrData.accountNameThai },
          { field: "accountNameEng", value: ocrData.accountNameEng },
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
    onError: (err) => {
      console.error("OCR upload failed:", err);
      alert("ไม่สามารถอ่านข้อมูลจากบัตรได้ โปรดลองอีกครั้ง");
    },
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

    // เช็คความคล้ายของชื่อ
    const accountNameThaiSimilarity = calculateSimilarity(
      originalData.accountNameThai,
      data.accountNameThai
    );
    const accountNameEngSimilarity = calculateSimilarity(
      originalData.accountNameEng,
      data.accountNameEng
    );

    if (accountNameThaiSimilarity < 60 || accountNameEngSimilarity < 60) {
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
