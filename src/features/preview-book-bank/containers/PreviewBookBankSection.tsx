"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import FormBookBank from "../components/FormBookBank";
import { useRouter } from "next/router";
import { useMutation } from "@tanstack/react-query";
import { uploadBookBankOcr } from "../services";

const defaultValues = {
  bank: "",
  branch: "",
  accountName: "",
  accountNo: "",
};

const bankOptions = [
  { value: "kbank", label: "KBANK", image: "/logobank/KBANK.jpg" },
  { value: "scb", label: "SCB", image: "/logobank/SCB.png" },
  { value: "ktb", label: "KTB", image: "/logobank/KTB.png" },
];

type BookBankFormValues = typeof defaultValues;

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

  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    control,
  } = useForm<BookBankFormValues>({
    defaultValues: defaultValues,
    mode: "onChange",
  });

  const ocrMutation = useMutation({
    mutationKey: ["uploadBookBankOcr"],
    mutationFn: (file: File) => uploadBookBankOcr(file, setLoadingProgress),
    onSuccess: (ocrData: OcrResponse) => {
      console.log("OCR Success, resetting form with:", ocrData);
      reset({
        accountNumber: ocrData.accountNumber || "",
        accountNameThai: ocrData.accountNameThai || "",
        branchNameThai: ocrData.branchNameThai || "",
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
          // const file = base64StringToFile(imageSrc, "idcard_from_session.jpg");
          // ocrMutation.mutate(file);
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
          const response = await fetch("/idcard.jpg");
          const blob = await response.blob();
          const file = new File([blob], "idcard.jpg", { type: blob.type });
          // ocrMutation.mutate(file);
        } catch (fetchError) {
          console.error("Failed to fetch test image:", fetchError);
          alert("ไม่พบรูปภาพสำหรับทดสอบ");
          router.replace("/");
        }
      }
    };
    processImageOnMount();
  }, []);

  const BookBankPage = () => {
    const {
      register,
      handleSubmit,
      control,
      formState: { errors, isValid },
    } = useForm<BookBankFormValues>({
      defaultValues: {
        bank: "",
        branch: "",
        accountName: "",
        accountNo: "",
      },
      mode: "onChange",
    });

    const onSubmit = (data: BookBankFormValues) => {
      console.log("Form submitted:", data);
      alert("บันทึกข้อมูลสำเร็จ!");
    };

    return (
      <>
        <FormBookBank
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          register={register}
          errors={errors}
          control={control}
          bankOptions={bankOptions}
          isValid={isValid}
        />
      </>
    );
  };
}
