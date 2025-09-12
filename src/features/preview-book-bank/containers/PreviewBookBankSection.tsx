"use client";

import React, { useState, useEffect } from "react";
import { Path, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { base64StringToFile, calculateSimilarity } from "@/lib/utils/index";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { usePersistedForm } from "@/lib/client/usePersistedForm";
import { bookbankFormSchema, BookBankFormData } from "./../schemas/bookbank";
import { useBookBankSubmit } from "../hooks/useBookBankSubmit";
import { useBookBankOcr, type OriginalNames } from "../hooks/useBookBankOcr";
import { uploadBookBankOcr, OcrResponse } from "../services";
import FormBookBank from "../components/FormBookBank";
import AlertPopUp from "@/components/AlertPopUp";

const defaultFormValues: BookBankFormData = {
  bank: "",
  branchNameThai: "",
  accountNameThai: "",
  accountNameEng: "",
  accountNumber: "",
};

const bankOptions = [
  { value: "kbank", label: "KBANK", image: "/logobank/KBANK.jpg" },
  { value: "scb", label: "SCB", image: "/logobank/SCB.png" },
  { value: "ktb", label: "KTB", image: "/logobank/KTB.png" },
];

export default function BookBankPage() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingData, setPendingData] = useState<BookBankFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submit } = useBookBankSubmit();
  const [originalData, setOriginalData] = useState<OriginalNames>({
    accountNameThai: null,
    accountNameEng: null,
  });

  const { data: session, status } = useSession();
  const kycRequestId = session?.kycRequestId;

  const form = useForm<BookBankFormData>({
    resolver: zodResolver(bookbankFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const {
    handleSubmit,
    watch,
    reset,
    control,
    setError,
    trigger,
    formState: { errors, isValid },
  } = form;

  usePersistedForm<BookBankFormData>(form, "book-bank:form", 30);

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
        accountNameThai: ocrData.accountNameThai ?? null,
        accountNameEng: ocrData.accountNameEng ?? null,
      });

      reset({
        bank: "",
        branchNameThai: ocrData.branchNameThai ?? "",
        accountNameThai: ocrData.accountNameThai ?? "",
        accountNameEng: ocrData.accountNameEng ?? "",
        accountNumber: ocrData.accountNumber ?? "",
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
            await trigger(field as Path<BookBankFormData>);
          }
        }

        // set API errors into form
        (ocrData.errors || []).forEach((err) => {
          setError(err.field as Path<BookBankFormData>, {
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
      setPreviewImage(dataUrl);

      try {
        const file = base64StringToFile(dataUrl, "bookbank_from_session.jpg");
        ocrMutation.mutate(file);
      } catch (e) {
        console.error("Failed to process image from sessionStorage:", e);
        alert("รูปแบบรูปภาพใน Session ไม่ถูกต้อง");
        router.replace("/book-bank-accept");
      }
    };

    if (status !== "loading") {
      processImageOnMount();
    }
  }, [status]);

  const watchedValues = watch();
  const canSubmit = React.useMemo(() => {
    if (isSubmitting) return false;

    // เช็คว่าทุก field มีค่า
    const requiredFields = [
      "bank",
      "branchNameThai",
      "accountNameThai",
      "accountNameEng",
      "accountNumber",
    ];
    const allFieldsFilled = requiredFields.every((field) => {
      const value = watchedValues[field as keyof BookBankFormData];
      return value && value.toString().trim() !== "";
    });

    // เช็คว่าไม่มี error
    const noErrors = Object.keys(errors).length === 0;

    return allFieldsFilled && noErrors && isValid;
  }, [watchedValues, errors, isValid, isSubmitting]);

  const onSubmit = async (data: BookBankFormData) => {
    setIsSubmitting(true);

    const THRESHOLD = 60;
    const mismatches: string[] = [];

    // เช็คความคล้ายของชื่อ
    if (originalData.accountNameThai) {
      const simTH = calculateSimilarity(
        originalData.accountNameThai,
        data.accountNameThai
      );
      if (simTH < THRESHOLD) mismatches.push("Account Name (TH)");
    }
    if (originalData.accountNameEng) {
      const simEN = calculateSimilarity(
        originalData.accountNameEng,
        data.accountNameEng
      );
      if (simEN < THRESHOLD) mismatches.push("Account Name (ENG)");
    }

    if (mismatches.length > 0) {
      setPendingData(data);
      setShowDialog(true);
      return;
    }

    try {
      const captured =
        typeof window !== "undefined"
          ? sessionStorage.getItem("capturedBookBankImage")
          : null;
      if (!captured) throw new Error("Missing captured BookBank image file");

      const file = base64StringToFile(captured, "bookbank.jpg");

      const bankName =
        bankOptions.find((b) => b.value === data.bank)?.label ?? data.bank;

      await submit({
        file,
        kycRequestId: kycRequestId!,
        bankName,
        accountNo: data.accountNumber,
        accountNameThai: data.accountNameThai,
        accountNameEng: data.accountNameEng ?? "",
        branchName: data.branchNameThai,
      });

      router.push("/verification-complete");
    } catch (error) {
      console.error("Submit failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setShowDialog(false);
    setPendingData(null);
    setIsSubmitting(false);
  };

  return (
    <>
      <FormBookBank
        onSubmit={handleSubmit(onSubmit)}
        control={control}
        errors={errors}
        capturedImage={previewImage}
        canSubmit={canSubmit}
        isLoading={ocrMutation.isPending}
        loadingProgress={loadingProgress}
        isSubmitting={isSubmitting}
      />

      <AlertPopUp
        isOpen={showDialog}
        title="Edited Name Doesn't Match"
        message="Your edited name is very different from the extracted name. Do you want to continue with the edited name?"
        onRetry={handleRetry}
      />
    </>
  );
}
