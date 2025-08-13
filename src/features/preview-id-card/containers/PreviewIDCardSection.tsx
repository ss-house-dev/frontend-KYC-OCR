"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormIdCard from "../components/FormIdCard";
import { uploadIdCardOcr, OcrResponse } from "@/features/preview-id-card/services/ocr";

const defaultFormValues = {
  idNumber: "",
  titleThai: "",
  issueDateThai: "",
  expiryDateThai: "",
  firstNameThai: "",
  lastNameThai: "",
  birthdateThai: "",
  address: "",
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<PreviewIdCardForm>({
    defaultValues: defaultFormValues,
    mode: "onBlur",
  });


  const ocrMutation = useMutation({
    mutationKey: ["uploadIdCardOcr"],
    mutationFn: (file: File) => uploadIdCardOcr(file, setLoadingProgress),
    onSuccess: (ocrData: OcrResponse) => {
      console.log("Onsuccess")
      reset({
        idNumber: ocrData.id_number || "",
        firstNameThai: ocrData.first_name_th || "",
        lastNameThai: ocrData.last_name_th || "",
        birthdateThai: ocrData.date_of_birth_th || "",
        issueDateThai: ocrData.issue_date_th || "",
        expiryDateThai: ocrData.expiry_date_th || "",
        address: ocrData.address || "",
        titleThai: "", 
      });
    },
    onError: (err) => {
      console.error("OCR upload failed:", err);
      alert("ไม่สามารถอ่านข้อมูลจากบัตรได้ โปรดลองอีกครั้ง");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  useEffect(() => {
    const run = async () => {
      const imageSrc = sessionStorage.getItem("capturedIdCardImage");
      if (!imageSrc) {
        router.replace("/");
        return;
      }
      try {
        const file = base64StringToFile(imageSrc, "idcard_from_session.jpg");
        setIsLoading(true);
        setLoadingProgress(0);
        ocrMutation.mutate(file);
      } catch (e) {
        console.error(e);
        setIsLoading(false);
      }
    };
    run();
  }, [router]);

  const onSubmit = (data: PreviewIdCardForm) => {
    console.log("Form submitted:", data);
    alert("บันทึกข้อมูลสำเร็จ!");
  };

  


  return (
    <FormIdCard
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      watch={watch}
      capturedImage={typeof window !== "undefined" ? sessionStorage.getItem("capturedIdCardImage") : null}
      isValid={isValid}
      isLoading={isLoading || ocrMutation.isPending}
      loadingProgress={loadingProgress}
    />
  );
}
