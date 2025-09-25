"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FieldErrors,
  FieldValues,
  UseFormHandleSubmit,
  UseFormWatch,
  Control,
  Path,
} from "react-hook-form";
import FormSelectBookBank from "./FormSelectBookBank";
import FormFieldBookBank from "./FormFieldBookBank";
import FullScreenLoader from "@/components/FullScreenLoader";
import { saveFormToCookie } from "@/lib/utils/index";

const IconInfo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 flex-shrink-0"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

interface FormBookBankProps<TFieldValues extends FieldValues> {
  onSubmit: ReturnType<UseFormHandleSubmit<TFieldValues>>;
  watch: UseFormWatch<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  capturedImage: string | null;
  canSubmit: boolean;
  isLoading: boolean;
  loadingProgress: number;
  isSubmitting?: boolean;
}

// ใช้ cookie key ของ bookbank
const EDITED_DATA_COOKIE_KEY = "bookbank_form_edited";

const FormBookBank = <TFieldValues extends FieldValues>({
  onSubmit,
  watch,
  control,
  errors,
  capturedImage,
  canSubmit,
  isLoading,
  isSubmitting = false,
}: FormBookBankProps<TFieldValues>) => {
  const initialDataRef = useRef<any>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // อ่านค่าจาก form
  const allValues = watch();

  useEffect(() => {
    if (allValues && !initialDataRef.current && !isFormInitialized) {
      // ใช้ accountNumber เป็นตัวบอกว่ามีข้อมูลจาก OCR แล้ว
      const hasAccountNumber =
        allValues.accountNumber && String(allValues.accountNumber).trim();
      if (hasAccountNumber) {
        console.log("[FormBookBank] Recording initial data:", allValues);
        initialDataRef.current = JSON.parse(JSON.stringify(allValues));
        setIsFormInitialized(true);
      }
    }
  }, [allValues, isFormInitialized]);

  // Save cookie เมื่อมีการแก้ไข
  useEffect(() => {
    if (
      allValues &&
      initialDataRef.current &&
      isFormInitialized &&
      !isLoading
    ) {
      const hasChanges =
        JSON.stringify(allValues) !== JSON.stringify(initialDataRef.current);

      if (hasChanges) {
        console.log("[FormBookBank] Detected user changes, saving cookie");
        saveFormToCookie(EDITED_DATA_COOKIE_KEY, allValues);
      } else {
        console.log("[FormBookBank] No changes detected, skip save");
      }
    }
  }, [allValues, isFormInitialized, isLoading]);

  return (
    <form onSubmit={onSubmit} className="p-6 max-w-md mx-auto">
      {/* Info Box */}
      <div className="flex items-center space-x-2.5 rounded-lg bg-[#246AEC] text-white p-7 mb-5">
        <IconInfo />
        <p className="text-sm font-medium">
          Your bank account information will be used only for transaction
          verification and handled securely.
        </p>
      </div>

      {/* Preview Image */}
      <div className="rounded-xl w-full mb-5 p-1 border-2 border-dashed border-[#1849D6] overflow-hidden">
        <div className="relative w-full aspect-[8.8/5.6] flex items-center justify-center">
          {isLoading ? (
            <>
              <FullScreenLoader />
              <p className="font-medium z-10">Image loading...</p>
            </>
          ) : (
            capturedImage && (
              <img
                src={capturedImage}
                alt="Book Bank"
                className="w-full h-full object-contain rounded-xl"
              />
            )
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-6">
          <FormSelectBookBank
            fieldName={"bank" as Path<TFieldValues>}
            label="Select a Bank"
            control={control}
          />

          <FormFieldBookBank
            fieldName={"branchName" as Path<TFieldValues>}
            label="Branch"
            placeholder="Enter Branch"
            type="text"
            control={control}
            errors={errors}
          />

          <FormFieldBookBank
            fieldName={"accountNameThai" as Path<TFieldValues>}
            label="Account Name (TH)"
            placeholder="Enter Name"
            type="text"
            control={control}
            errors={errors}
          />

          <FormFieldBookBank
            fieldName={"accountNameEng" as Path<TFieldValues>}
            label="Account Name (ENG)"
            placeholder="Enter Name"
            type="text"
            control={control}
            errors={errors}
          />

          <FormFieldBookBank
            fieldName={"accountNumber" as Path<TFieldValues>}
            label="Account No."
            placeholder="Enter Account no."
            type="text"
            control={control}
            errors={errors}
            disabled
          />
        </div>
      </div>

      {/* Confirm Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full h-12 rounded-xl text-white font-semibold text-base transition-colors ${
            canSubmit && !isSubmitting
              ? "bg-[#2152b6] hover:bg-[#1a4299]"
              : "bg-gray-400"
          }`}
        >
          {isSubmitting ? "Confirm" : "Confirm"}
        </button>
      </div>
    </form>
  );
};

export default FormBookBank;
