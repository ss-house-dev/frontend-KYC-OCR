// src/screens/VerifyIdentityScreen.jsx

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import FormField from "@/components/FormField";

const IconArrowLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 19.5L8.25 12l7.5-7.5"
    />
  </svg>
);

const IconInfo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 flex-shrink-0 mt-0.5"
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
  const [isLoading, setIsLoading] = useState(true);

  // 2. ส่ง defaultValues เข้าไปใน useForm ตอนเริ่มต้น
  // (แนะนำ) เพิ่ม mode: 'onBlur' เพื่อให้ user experience ดีขึ้น (error จะขึ้นทันทีที่ออกจากช่องกรอก)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: defaultFormValues,
    mode: "onBlur",
  });

  // ส่วนของ useEffect เหมือนเดิมทุกอย่าง
  useEffect(() => {
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

      // ตอนนี้ reset จะทำงานได้อย่างถูกต้อง เพราะฟอร์มถูกเตรียมไว้พร้อมแล้ว
      reset(mockApiData);
      setIsLoading(false);
    };

    fetchUserData();
  }, [reset]);

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

  // ส่วนของ JSX ที่เหลือเหมือนเดิมทุกอย่าง ไม่ต้องแก้ไข
  return (
    <div className="bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen">
        <header className="relative flex items-center justify-center p-4">
          <button className="absolute left-4 top-1/2 -translate-y-1/2">
            <IconArrowLeft />
          </button>
          <h1 className="text-xl font-bold">Verify Your Identity</h1>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="flex items-start space-x-2.5 rounded-lg bg-[#246AEC] text-white p-3 mb-5">
            <IconInfo />
            <p className="text-sm font-medium">
              Your data will be used only for identity verification and handled
              securely.
            </p>
          </div>

          <img
            src="http://googleusercontent.com/file_content/0"
            alt="Thai National ID Card"
            className="rounded-xl w-full mb-5"
          />

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
              <FormField
                fieldName="idCard"
                label="ID Card"
                register={register}
                errors={errors}
                validationRules={{ required: "ID Card is required" }}
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
                validationRules={{ required: "Laser ID is required" }}
              />
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
              <FormField
                fieldName="fullName"
                label="Full name"
                register={register}
                errors={errors}
              />
              <FormField
                fieldName="lastName"
                label="Last name"
                register={register}
                errors={errors}
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
      </div>
    </div>
  );
}
