import React from "react";
import {
  FieldErrors,
  FieldValues,
  UseFormHandleSubmit,
  Control,
  Path,
} from "react-hook-form";
import ProgressLoading from "@/components/ProgressLoading";
import FormSelectBookBank from "./FormSelectBookBank";
import FormFieldBookBank from "./FormFieldBookBank";

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
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  capturedImage: string | null;
  canSubmit: boolean;
  isLoading: boolean;
  loadingProgress: number;
  isSubmitting?: boolean;
}

const FormBookBank = <TFieldValues extends FieldValues>({
  onSubmit,
  control,
  errors,
  capturedImage,
  canSubmit,
  isLoading,
  loadingProgress,
  isSubmitting = false,
}: FormBookBankProps<TFieldValues>) => {
  return (
    <form onSubmit={onSubmit} className="p-6 max-w-md mx-auto">
      <div className="flex items-center space-x-2.5 rounded-lg bg-[#246AEC] text-white p-7 mb-5">
        <IconInfo />
        <p className="text-sm font-medium">
          Your bank account information will be used only for transaction
          verification and handled securely.
        </p>
      </div>
      {isLoading ? (
        <ProgressLoading progress={loadingProgress} />
      ) : (
        capturedImage && (
          <img
            src={capturedImage}
            alt="Book Bank"
            className="rounded-xl w-full mb-5 border-2 border-dashed border-[#1849D6] p-1"
          />
        )
      )}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <FormSelectBookBank
              fieldName={"bank" as Path<TFieldValues>}
              label="Select a Bank"
              control={control}
            />
          </div>

          {/* === ช่อง Branch === */}
          <FormFieldBookBank
            fieldName={"branchName" as Path<TFieldValues>}
            label="Branch"
            placeholder="Enter Branch"
            type="text"
            control={control}
            errors={errors}
          />

          {/* === ช่อง Account Name (TH) === */}
          <FormFieldBookBank
            fieldName={"accountNameThai" as Path<TFieldValues>}
            label="Account Name (TH)"
            placeholder="Enter Name"
            type="text"
            control={control}
            errors={errors}
          />

          {/* === ช่อง Account Name (ENG) === */}
          <FormFieldBookBank
            fieldName={"accountNameEng" as Path<TFieldValues>}
            label="Account Name (ENG)"
            placeholder="Enter Name"
            type="text"
            control={control}
            errors={errors}
          />

          {/* === ช่อง Account No. === */}
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
