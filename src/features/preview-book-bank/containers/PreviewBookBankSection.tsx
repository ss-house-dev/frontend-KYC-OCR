"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { base64StringToFile, calculateSimilarity } from "@/lib/utils/index";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { bookbankFormSchema, BookBankFormData } from "./../schemas/bookbank";
import { useBookBankSubmit } from "../hooks/useBookBankSubmit";
import FormBookBank from "../components/FormBookBank";
import AlertPopUp from "@/components/AlertPopUp";
import { useBookBankOcr } from "../hooks/useBookBankOcr";

const defaultFormValues: BookBankFormData = {
  bank: "",
  branchName: "",
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
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submit } = useBookBankSubmit();
  const [originalData, setOriginalData] = useState<{
    accountNameThai: string;
    accountNameEng: string;
  }>({ accountNameThai: "", accountNameEng: "" });

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

  const form = useForm<BookBankFormData>({
    resolver: zodResolver(bookbankFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const {
    handleSubmit,
    watch,
    control,
    formState: { errors, isValid },
  } = form;

  const ocr = useBookBankOcr<BookBankFormData>({
  kycRequestId,
  form,
  onSetOriginal: setOriginalData,
  buildResetValues: (d) => ({
    bank: "",
    branchName: d.branchName ?? "",
    accountNameThai: d.accountNameThai ?? "",
    accountNameEng: d.accountNameEng ?? "",
    accountNumber: d.accountNumber ?? "",
  }),
  requiredFields: ["bank", "branchName", "accountNumber"],
  onError: (err) => {
    console.error(err);
    setErrorAlert({
      isOpen: true,
      title: "Book Bank not found",
      message: err instanceof Error ? err.message : "Upload failed",
      imageSrc: "/popup/error-ocr-bookbank.png",
      redirectTo: "/book-bank-accept",
    });
  },
});

// เรียก OCR / ใช้ cookie
useEffect(() => {
  if (status !== "loading") {
    ocr.startFromSession();
  }
}, [status]);

  const watchedValues = watch();
  const canSubmit = React.useMemo(() => {
    const required: (keyof BookBankFormData)[] = [
      "bank",
      "branchName",
      "accountNameThai",
      "accountNameEng",
      "accountNumber",
    ];
    const allFilled = required.every((f) => {
      const v = watchedValues[f];
      return v && v.toString().trim() !== "";
    });
    return allFilled && isValid;
  }, [watchedValues, isValid]);

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
      setShowDialog(true);
      return;
    }

    try {
      const captured =
        typeof window !== "undefined"
          ? sessionStorage.getItem("capturedBookBankImage")
          : null;
      if (!captured) throw new Error("Missing captured BookBank image file");

      const files = base64StringToFile(captured, "bookbank.jpg");

      const bankName =
        bankOptions.find((b) => b.value === data.bank)?.label ?? data.bank;

      await submit({
        files,
        kycRequestId: kycRequestId!,
        bankName,
        accountNo: data.accountNumber,
        accountNameThai: data.accountNameThai,
        accountNameEng: data.accountNameEng ?? "",
        branchName: data.branchName,
      });

      router.push("/verification-complete");
    } catch (error) {
      console.error("Submit failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormBookBank
        onSubmit={handleSubmit(onSubmit)}
        watch={watch}
        control={control}
        errors={errors}
        capturedImage={ocr.imageSrc}
        canSubmit={canSubmit}
        isLoading={ocr.isUploading}
        loadingProgress={ocr.loadingProgress}
        isSubmitting={isSubmitting}
      />

      {/* Alert: case similarity ไม่ตรง */}
      <AlertPopUp
        isOpen={showDialog}
        title="Edited Name Doesn't Match"
        message="Your edited name is very different from the extracted name. Do you want to continue with the edited name?"
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
