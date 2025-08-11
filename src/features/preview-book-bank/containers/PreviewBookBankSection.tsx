"use client";

import React from "react";
import {
  useForm,
} from "react-hook-form";
import FormBookBank from "../components/FormBookBank";

interface BookBankFormValues {
  bank: string;
  branch: string;
  accountName: string;
  accountNo: string;
}

const defaultValues: BookBankFormValues = {
  bank: "",
  branch: "",
  accountName: "",
  accountNo: "",
};

const bankOptions = [
  { value: "kbank", label: "KBANK", image: "/logobank/KBANK.jpg"  },
  { value: "scb", label: "SCB", image: "/logobank/SCB.png" },
  { value: "ktb", label: "KTB", image: "/logobank/KTB.png" },
];

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
    console.log("Form Submitted! Data handled in container:", data);
    alert("ยืนยันข้อมูลสำเร็จ! (ตรวจสอบข้อมูลใน Console)");
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

export default BookBankPage;
