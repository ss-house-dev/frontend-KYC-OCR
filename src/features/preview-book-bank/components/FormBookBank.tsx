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
import Image from "next/image";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface FormBookBankProps<TFieldValues extends FieldValues> {
  onSubmit: ReturnType<UseFormHandleSubmit<TFieldValues>>;
  watch: UseFormWatch<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  capturedImage: string | null;
  canSubmit: boolean;
  isLoading: boolean;
  isSubmitting?: boolean;
}

// ใช้ cookie key ของ bookbank
const EDITED_DATA_COOKIE_KEY = "bookbank_form_edited";

// helper: เซ็ตคุกกี้ kycStep อายุ 30 นาที
function setKycStep30m(step: string) {
  const encoded = encodeURIComponent(step);
  const base = `kycStep=${encoded}; Max-Age=${30 * 60}; Path=/; SameSite=Lax`;
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    document.cookie = `${base}; Secure`;
  } else {
    document.cookie = base;
  }
}

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
  const [showAlert, setShowAlert] = useState(true);
  const router = useRouter();

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

  // ✅ แก้ type: ใช้ FormEventHandler แล้วค่อยเรียก onSubmit ของ RHF
  const handleConfirm: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    // ให้ RHF จัดการ validate + submit ก่อน
    await onSubmit(e as unknown as React.BaseSyntheticEvent);
    // ตั้งคุกกี้บอกว่าเพิ่งผ่านหน้า book-bank-accept
    setKycStep30m("/book-bank-accept");
    // ไปหน้าถัดไปของ flow
    router.push("/verification-complete");
  };

  return (
    <form onSubmit={handleConfirm} className="pt-3 bg-[#E7E7E7] space-y-3">
      {/* Info Box */}
      <div className="bg-white p-4 space-y-4">
        {showAlert && (
          <div className="flex items-start justify-between rounded-lg bg-[#F5F8FF] text-white p-4 mb-5 relative">
            <div className="flex items-center space-x-2.5">
              <Image
                src="/icon/shield-check.svg"
                width={20}
                height={20}
                alt="Picture of the author"
              />
              <p className="text-sm font-medium text-[#4A4A4A]">
                Your bank account information will be used only for transaction
                verification and handled securely.
              </p>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="ml-2 text-[#4A4A4A] hover:text-gray-200 transition"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Preview Image */}
        <div className="rounded-xl w-full p-1 border-2 border-dashed border-[#1849D6] overflow-hidden">
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
      </div>

      {/* Form Fields */}
      <div className="bg-white p-6">
        <div className="space-y-1">
          <FormSelectBookBank
            fieldName={"bank" as Path<TFieldValues>}
            label="Bank"
            control={control}
          />

          <FormFieldBookBank
            fieldName={"branchName" as Path<TFieldValues>}
            label="Branch (TH)"
            placeholder="Enter your branch"
            type="text"
            control={control}
            errors={errors}
          />

          <FormFieldBookBank
            fieldName={"accountNameThai" as Path<TFieldValues>}
            label="Account Name (TH)"
            placeholder="Enter your account name"
            type="text"
            control={control}
            errors={errors}
          />

          <FormFieldBookBank
            fieldName={"accountNameEng" as Path<TFieldValues>}
            label="Account Name (ENG)"
            placeholder="Enter your account name"
            type="text"
            control={control}
            errors={errors}
          />

          <FormFieldBookBank
            fieldName={"accountNumber" as Path<TFieldValues>}
            label="Account No."
            placeholder="Enter account no."
            type="text"
            control={control}
            errors={errors}
            disabled
          />
        </div>
      </div>

      {/* Confirm Button */}
      <div className="bg-white p-4 mt-6">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full h-12 rounded-[8px] text-white font-semibold text-base transition-colors ${
            canSubmit && !isSubmitting ? "bg-[#2152b6]" : "bg-gray-400"
          }`}
        >
          {isSubmitting ? "Confirm" : "Confirm"}
        </button>
      </div>
    </form>
  );
};

export default FormBookBank;
