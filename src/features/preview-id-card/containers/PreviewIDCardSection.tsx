"use client";

import React, { useEffect, useState } from "react";
import { Path, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import FormIdCard from "../components/FormIdCard";
import {
  uploadIdCardOcr,
  OcrResponse,
} from "@/features/preview-id-card/services/ocr-id-card";
import { SubmitErrorHandler } from "react-hook-form";

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

// ฟังก์ชันคำนวณความคล้ายคลึง (Levenshtein distance)
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

export default function VerifyIdentityScreen() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const router = useRouter();
  const [canSubmit, setCanSubmit] = useState(false);
  const [originalData, setOriginalData] = useState<{
    firstNameThai: string;
    lastNameThai: string;
  }>({ firstNameThai: "", lastNameThai: "" });

  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    control,
    setError,
    trigger,
    setFocus,
    getValues, 
  } = useForm<PreviewIdCardForm>({
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const ocrMutation = useMutation({
    mutationKey: ["uploadIdCardOcr"],
    mutationFn: (file: File) => uploadIdCardOcr(file, setLoadingProgress),

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
    // onError: (err) => {
    //   console.error("OCR upload failed:", err);
    //   alert("ไม่สามารถอ่านข้อมูลจากบัตรได้ โปรดลองอีกครั้ง");
    // },
  });

  useEffect(() => {
    const processImageOnMount = async () => {
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
  }, []);

  const watchedValues = watch();

  useEffect(() => {
    // ฟิลด์ที่แก้ไขไม่ได้ (disabled fields) - เช็คแค่ว่ามีค่าหรือไม่
    const disabledFields = ['idNumber', 'issueDateThai', 'expiryDateThai', 'birthDateThai'];
    
    // ฟิลด์ที่แก้ไขได้ - ต้องเช็คทั้งค่าและ validation
    const editableFields = [
      'titleThai', 'firstNameThai', 'lastNameThai', 
      'address', 'laserId'
    ];
    
    // เช็คฟิลด์ที่แก้ไขไม่ได้ - ต้องมีค่าและไม่มี error
    const disabledFieldsValid = disabledFields.every((fieldName) => {
      const value = watchedValues[fieldName as keyof typeof watchedValues];
      const hasValue = value !== "" && value !== null && value !== undefined;
      const hasError = errors[fieldName as keyof typeof errors];
      return hasValue && !hasError;
    });
    
    // เช็คฟิลด์ที่แก้ไขได้ - ต้องมีค่า, ไม่มี error, และผ่าน validation
    const editableFieldsValid = editableFields.every((fieldName) => {
      const value = watchedValues[fieldName as keyof typeof watchedValues];
      const hasValue = value !== "" && value !== null && value !== undefined;
      const hasError = errors[fieldName as keyof typeof errors];
      return hasValue && !hasError;
    });
    
    // ตั้งค่า canSubmit เป็น true เมื่อทุกเงื่อนไขผ่าน
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

    // แจ้งเตือนถ้าความคล้ายคลึงต่ำกว่า 60%
    if (firstNameSimilarity < 60 || lastNameSimilarity < 60) {
      const message = `คำเตือน: ข้อมูลที่แก้ไขมีความแตกต่างจากข้อมูลเดิมมาก\n` +
        `ชื่อ: ${firstNameSimilarity.toFixed(1)}% ความคล้าย\n` +
        `นามสกุล: ${lastNameSimilarity.toFixed(1)}% ความคล้าย\n\n` +
        `คุณต้องการดำเนินการต่อหรือไม่?`;
      
      if (!confirm(message)) {
        return; // หยุดการ submit ถ้าผู้ใช้ยกเลิก
      }
    }
    
    // ไปหน้า preview-book-bank
    router.push("/preview-book-bank");
  };

   const onInvalid: SubmitErrorHandler<PreviewIdCardForm> = (errs) => {
    console.group("[Form Submit Failed]");
    console.log("Values at submit:", getValues());
    Object.entries(errs).forEach(([k, v]) => {
      console.log(`${k}:`, (v as any)?.message, v);
    });
    console.groupEnd();

    // โฟกัสช่องแรกที่พัง
    const first = Object.keys(errs)[0];
    if (first) setFocus(first as any);
  };


  // useEffect(() => {
  //   const allFieldsFilled = Object.values(watchedValues).every(
  //     (value) => value !== "" && value !== null && value !== undefined
  //   );
  //   const noErrors = Object.keys(errors).length === 0;

  //   setCanSubmit(allFieldsFilled && noErrors);
  // }, [watchedValues, errors]);

  // const onSubmit = (data: PreviewIdCardForm) => {
  //   console.log("Form submitted:", data);
  //   alert("บันทึกข้อมูลสำเร็จ!");
  // };

  return (
    <FormIdCard
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      onInvalid={onInvalid}
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
