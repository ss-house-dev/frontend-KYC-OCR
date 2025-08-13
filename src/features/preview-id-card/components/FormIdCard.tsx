"use client";

import {
  UseFormRegister,
  FieldErrors,
  UseFormWatch,
  FieldValues,
  UseFormHandleSubmit,
  SubmitHandler,
  Path,
} from "react-hook-form";
import FormField from "@/features/preview-id-card/components/FormField";
import ProgressLoading from "./ProgressLoading";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";
import { register } from "next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup";

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

interface FormIdCardProps<TFieldValues extends FieldValues> {
  handleSubmit: UseFormHandleSubmit<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  capturedImage: string | null;
  isValid: boolean;
  isLoading: boolean;
  loadingProgress: number;
}

const FormIdCard = <TFieldValues extends FieldValues>({
  handleSubmit,
  onSubmit,
  register,
  errors,
  watch,
  capturedImage,
  isValid,
  isLoading,
  loadingProgress,
}: FormIdCardProps<TFieldValues>) => {
  const addressValue = watch("address" as Path<TFieldValues>);
  const addressCurrentLength = addressValue ? addressValue.length : 0;
  const addressMaxLength = 200; // Define the max length here
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4">
      <div className="flex items-center space-x-2.5 rounded-lg bg-[#246AEC] text-white p-7 mb-5">
        <IconInfo />
        <p className="text-sm font-medium">
          Your data will be used only for identity verification and handled
          securely.
        </p>
      </div>
      {isLoading ? (
        <ProgressLoading progress={loadingProgress} />
      ) : (
        <img
          src={capturedImage!}
          alt="Thai National ID Card"
          className="rounded-xl w-full mb-5 border-2 border-dashed border-[#1849D6] p-1"
        />
      )}

      <div className="space-y-4">
        {/* --- Form Fields --- */}
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
          <FormField
            fieldName={"idNumber" as Path<TFieldValues>}
            label="ID Number"
            placeholder="Enter 13-digit Citizen ID number"
            type="text"
            register={register}
            errors={errors}
            watch={watch}
            maxLength={13}
            readOnly={true}
            ignoreChars={["-"]}
            validationRules={{
              required: "Unable to extact data. Kindly rescan your document.",
              validate: (value: string) => {
                const digitsOnly = value.replace(/-/g, "");
                if (digitsOnly.length > 13) {
                  return "ID Card must be 13 digits";
                }
                if (value.length > 0 && !/^[0-9-]+$/.test(value)) {
                  return "ID Card can only contain digits and hyphens";
                }
                return true;
              },
            }}
          />
          <FormField
            fieldName={"issueDateThai" as Path<TFieldValues>}
            label="Date of Issue"
            placeholder="DD-MM-YYYY"
            type="text"
            register={register}
            errors={errors}
            readOnly={true}
            validationRules={{
              required: "Unable to extract data. Kindly rescan your document.",
            }}
          />

          <FormField
            fieldName={"expiryDateThai" as Path<TFieldValues>}
            label="Date of Expiry"
            placeholder="DD-MM-YYYY"
            type="text"
            register={register}
            errors={errors}
            readOnly={true}
            validationRules={{
              required: "Unable to extact data. Kindly rescan your document.",
            }}
          />
          <FormField
            fieldName={"laserId" as Path<TFieldValues>}
            label="Laser ID"
            placeholder="Enter Laser ID number"
            register={register}
            errors={errors}
            type="text"
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
            fieldName={"firstNameThai" as Path<TFieldValues>}
            label="First name"
            placeholder="Enter your First name"
            register={register}
            errors={errors}
            type="text"
            maxLength={50}
            validationRules={{
              required: "This field is needed",
            }}
          />
          <FormField
            fieldName={"lastNameThai" as Path<TFieldValues>}
            label="Last name"
            placeholder="Enter your Last name"
            register={register}
            errors={errors}
            type="text"
            maxLength={50}
            validationRules={{
              required: "This field is needed",
            }}
          />
          <FormField
            fieldName={"birthdateThai" as Path<TFieldValues>}
            label="Date of Birth"
            placeholder="DD-MM-YYYY"
            type="text"
            register={register}
            errors={errors}
            readOnly={true}
            validationRules={{
              required: "Unable to extact data. Kindly rescan your document.",
            }}
          />
        </div>
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="address" className="text-sm">
              Address
              <span className="text-red-500 ml-[1px]">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">
              {addressCurrentLength}/{addressMaxLength}
            </span>
          </div>
          <Textarea
            id="address"
            placeholder="Enter your Address"
            {...register("address" as Path<TFieldValues>, {
              required: "This field is needed",
              maxLength: addressMaxLength,
            })}
            className="h-24 resize-y mt-1 bg-muted"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">
              {errors.address.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={!isValid}
          className={`w-full h-12 rounded-xl text-white font-semibold text-base transition-colors ${
            isValid
              ? "bg-gradient-to-b from-[#1F4293] to-[#246AEC] hover:from-[#1A377A]"
              : "bg-gray-400"
          }`}
        >
          Confirm
        </button>
      </div>
    </form>
  );
};

export default FormIdCard;
