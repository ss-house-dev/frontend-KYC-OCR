"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import FormIdCard from "../components/FormIdCard";

const defaultFormValues = {
  idCard: "",
  dateOfIssue: "",
  dateOfExpiry: "",
  laserId: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  address: "",
};

type PreviewIdCardForm = typeof defaultFormValues;

export default function VerifyIdentityScreen() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm({
    defaultValues: defaultFormValues,
    mode: "onBlur",
  });

  useEffect(() => {
    // ตรวจสอบรูปภาพจาก Session Storage
    const imageSrc = sessionStorage.getItem("capturedIdCardImage");
    if (imageSrc) {
      setCapturedImage(imageSrc);
    } else {
      router.replace("/");
      return;
    }

    // การโหลด Progress Bar
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    const fetchUserData = async () => {
      const mockApiData = await new Promise<PreviewIdCardForm>((resolve) =>
        setTimeout(() => {
          resolve({
            idCard: "140-990-3549-297",
            dateOfIssue: "2019-01-23",
            dateOfExpiry: "2027-12-22",
            laserId: "",
            firstName: "วิชญ์พิสิฐ",
            lastName: "เผ่าบริรักษ์",
            dateOfBirth: "2003-12-23",
            address: "205 หมู่ 4 ต.เมืองเก่า อ.เมือง จ.ขอนแก่น",
          });
        }, 1500)
      );

      reset(mockApiData);
      setIsLoading(false);
    };

    fetchUserData();
  }, [router, reset]);

  const onSubmit = (data: PreviewIdCardForm) => {
    setSuccessMessage("บันทึกข้อมูลสำเร็จ!");
  };

  return (
    <FormIdCard
      handleSubmit={handleSubmit}
      onSubmit={onSubmit}
      register={register}
      errors={errors}
      watch={watch}
      capturedImage={capturedImage}
      isValid={isValid}
      isLoading={isLoading}
      loadingProgress={loadingProgress}
    />
  );
}
