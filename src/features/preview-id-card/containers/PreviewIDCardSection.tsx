"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import FormField from "@/features/preview-id-card/components/FormField";
import { useRouter } from "next/navigation";

const IconInfo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 flex-shrink-0 mt-0.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

// 1. สร้าง "โครง" ของฟอร์มขึ้นมาก่อนนอกคอมโพเนนต์
// เพื่อให้ React Hook Form รู้จัก field ทั้งหมดตั้งแต่แรก
const defaultFormValues = {
  idCard: "",
  dateOfIssue: "",
  dateOfExpiry: "",
  laserId: "",
  fullName: "",
  lastName: "",
  dateOfBirth: "",
  address: "",
};

type VerifyIdentityForm = typeof defaultFormValues;

export default function VerifyIdentityScreen() {
  // 1. เพิ่ม State สำหรับจัดการรูปภาพและ Error
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 1. ดึงฟังก์ชัน watch ออกมาจาก useForm
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: defaultFormValues,
    mode: "onBlur",
  });

  useEffect(() => {
    // --- ส่วนที่ 1: ตรวจสอบรูปภาพจาก Session Storage ---
    const imageSrc = sessionStorage.getItem("capturedIdCardImage");

    // ตรวจสอบว่ามีรูปภาพหรือไม่
    if (imageSrc) {
      setCapturedImage(imageSrc);
    } else {
      // ถ้าไม่มีรูป, ให้กลับไปหน้าแรกและหยุดการทำงาน
      router.replace("/");
      return;
    }

    // --- ส่วนที่ 2: ดึงข้อมูลผู้ใช้ (ถ้ามีรูปภาพ) ---
    const fetchUserData = async () => {
      const mockApiData = await new Promise<VerifyIdentityForm>((resolve) =>
        setTimeout(() => {
          resolve({
            idCard: "140-990-3549-297",
            dateOfIssue: "2019-01-23",
            dateOfExpiry: "2027-12-22",
            laserId: "",
            fullName: "วิชญ์พิสิฐ",
            lastName: "เผ่าบริรักษ์",
            dateOfBirth: "2003-12-23",
            address: "205 หมู่ 4 ต.เมืองเก่า อ.เมือง จ.ขอนแก่น",
          });
        }, 1500)
      );

      reset(mockApiData);
      // ปิดสถานะ Loading หลังจากทุกอย่างพร้อม
      setIsLoading(false);
    };

    fetchUserData();
  }, [router, reset]);

  const onSubmit = (data: VerifyIdentityForm) => {
    console.log("ข้อมูลที่ถูกส่งไป Backend:", data);
    alert("บันทึกข้อมูลสำเร็จ!");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4">
      <div className="flex items-center space-x-2.5 rounded-lg bg-[#246AEC] text-white p-7 mb-5">
        <IconInfo />
        <p className="text-sm font-medium">
          Your data will be used only for identity verification and handled
          securely.
        </p>
      </div>

      {/* 3. แสดงรูปภาพจาก State และมี Fallback กรณีรูปยังไม่มา */}
      {capturedImage ? (
        <img
          src={capturedImage}
          alt="Thai National ID Card"
          className="rounded-xl w-full mb-5 border-2 border-dashed border-[#1849D6]"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 rounded-xl mb-5 animate-pulse"></div>
      )}

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
          <FormField
            fieldName="idCard"
            label="ID Card"
            register={register}
            errors={errors}
            watch={watch}
            maxLength={13}
            validationRules={{
              required: "ID Card is required",
              maxLength: {
                value: 13,
                message: "ID Card must be 13 digits",
              },
            }}
          />
          <FormField
            fieldName="dateOfIssue"
            label="Date of Issue"
            type="date"
            register={register}
            errors={errors}
          />
          <FormField
            fieldName="dateOfExpiry"
            label="Date of Expiry"
            type="date"
            register={register}
            errors={errors}
          />
          <FormField
            fieldName="laserId"
            label="Laser ID"
            placeholder="Enter Laser ID number"
            register={register}
            errors={errors}
            watch={watch}
            maxLength={14}
            validationRules={{
              required: "Laser ID is required",
              maxLength: {
                value: 14,
                message: "Laser ID must be 14 characters",
              },
            }}
          />
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
          <FormField
            fieldName="fullName"
            label="Full name"
            register={register}
            errors={errors}
            watch={watch}
            maxLength={50}
          />
          <FormField
            fieldName="lastName"
            label="Last name"
            register={register}
            errors={errors}
            watch={watch}
            maxLength={50}
          />
          <FormField
            fieldName="dateOfBirth"
            label="Date of Birth"
            type="date"
            register={register}
            errors={errors}
          />
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4">
          <FormField
            fieldName="address"
            label="Address"
            register={register}
            errors={errors}
            watch={watch}
            maxLength={100}
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-gray-800 text-white font-semibold text-base hover:bg-gray-900 active:bg-gray-700"
        >
          Confirm
        </button>
      </div>
    </form>
  );
}
