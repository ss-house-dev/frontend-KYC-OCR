"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormIdCard from "../components/FormIdCard";
import { uploadIdCardOcr } from "@/features/preview-id-card/services/update-id-card";
import TestUploader from "@/app/testapi/page";

// ฟังก์ชันสำหรับแปลง Base64 Data URL กลับเป็น File object
const base64StringToFile = (base64String: string, filename: string): File => {
  const arr = base64String.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};

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

export default function VerifyIdentityScreen() {
  const [isLoading, setIsLoading] = useState(true); // ใช้ State นี้เป็นตัวควบคุมหลัก
  const [loadingProgress, setLoadingProgress] = useState(0); // เก็บไว้สำหรับ UI animation
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset, // เราจะใช้ reset เพื่อเติมข้อมูลลงฟอร์ม
    watch,
  } = useForm({
    defaultValues: defaultFormValues,
    mode: "onBlur",
  });
  
  const queryClient = useQueryClient();

  // Mutations
  const mutation = useMutation({
    mutationFn: TestUploader,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  // useEffect จะทำหน้าที่หลักในการดึงรูป, อัปโหลด, และเติมข้อมูลลงฟอร์ม
  useEffect(() => {
    // 1. สร้างฟังก์ชัน async เพื่อเรียก API ภายใน useEffect
    const processImageFromSession = async () => {
      // 2. ใช้ key ของ sessionStorage ให้ตรงกัน
      const imageSrc = sessionStorage.getItem("capturedIdCardImage");
      if (!imageSrc) {
        router.replace("/");
        return;
      }

      try {
        // 3. แปลง Base64 เป็น File และเรียก Service
        const imageFile = base64StringToFile(
          imageSrc,
          "idcard_from_session.jpg"
        );
        const ocrData = await uploadIdCardOcr(imageFile);
        console.log("API Response Data:", ocrData);

        // 4. ใช้ reset() เพื่ออัปเดตค่าในฟอร์มด้วยข้อมูลจาก OCR
        // **สำคัญ:** ต้องแก้ชื่อ field จาก ocrData ให้ตรงกับชื่อใน defaultFormValues
        reset({
          idNumber: ocrData.id_number || "",
          firstNameThai: ocrData.first_name_th || "",
          lastNameThai: ocrData.last_name_th || "",
          birthdateThai: ocrData.date_of_birth_th || "",
          issueDateThai: ocrData.issue_date_th || "",
          expiryDateThai: ocrData.expiry_date_th || "",
          address: ocrData.address || "",
        });
      } catch (error) {
        console.error("OCR upload failed:", error);
        alert("ไม่สามารถอ่านข้อมูลจากบัตรได้ โปรดลองอีกครั้ง");
        // อาจจะ redirect กลับไปหน้าถ่ายรูป
        // router.replace("/");
      } finally {
        // 5. เมื่อกระบวนการทั้งหมดเสร็จสิ้น ให้หยุดการ loading
        setIsLoading(false);
      }
    };

    processImageFromSession();
  }, [router, reset]); // ใส่ reset ใน dependency array

  const onSubmit = (data: PreviewIdCardForm) => {
    console.log("Form submitted successfully:", data);
    // TODO: ทำการส่งข้อมูลฟอร์มที่ผู้ใช้ยืนยันแล้วไปยัง API ต่อไป
    alert("บันทึกข้อมูลสำเร็จ!");
  };

  return (
    <FormIdCard
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      watch={watch}
      capturedImage={sessionStorage.getItem("capturedIdCardImage")}
      isValid={isValid}
      isLoading={isLoading}
      loadingProgress={loadingProgress}
    />
  );
}
