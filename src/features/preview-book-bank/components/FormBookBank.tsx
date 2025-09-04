import React from "react";
import {
  UseFormRegister,
  FieldErrors,
  FieldValues,
  UseFormHandleSubmit,
  UseFormWatch,
  Controller,
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

interface BookBankFormValues {
  bank: string;
  branch: string;
  accountName: string;
  accountNo: string;
}
interface FormBookBankProps<TFieldValues extends FieldValues> {
  onSubmit: ReturnType<UseFormHandleSubmit<TFieldValues>>;
  register: UseFormRegister<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  control: Control<TFieldValues>;
  canSubmit: boolean;
  errors: FieldErrors<TFieldValues>;
  bankOptions: { value: string; label: string; image: string }[];
  capturedImage: string | null;
  isValid: boolean;
  isLoading: boolean;
  loadingProgress: number;
}

const FormBookBank = <TFieldValues extends FieldValues>({
  onSubmit,
  watch,
  control,
  errors,
  register,
  capturedImage,
  bankOptions,
  isValid,
  canSubmit,
  isLoading,
  loadingProgress,
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
              fieldName={"bookbankOption" as Path<TFieldValues>}
              label="Select a Bank"
              control={control}
              errors={errors}
              validationRules={{ required: "This field is needed." }}
            />
          </div>

          {/* === ช่อง Branch === */}
          <Controller
            name={"branchNameThai" as Path<TFieldValues>}
            control={control}
            rules={{
              required: "Unable to extract data. Kindly rescan your document.",
              pattern: {
                value: /^[\u0E00-\u0E7F ]+$/,
                message: "Invalid format. Please enter the correct characters.",
              },
            }}
            render={({ field }) => (
              <FormFieldBookBank
                fieldName={"branchNameThai" as Path<TFieldValues>}
                label="Branch"
                placeholder="Enter Branch"
                type="text"
                value={field.value}
                control={control}
                errors={errors}
              />
            )}
          />

          {/* === ช่อง Account Name === */}
          <Controller
            name={"accountNameThai" as Path<TFieldValues>}
            control={control}
            rules={{
              required: "Unable to extract data. Kindly rescan your document.",
              pattern: {
                value: /^[\u0E00-\u0E7F ]+$/,
                message: "Invalid format. Please enter the correct characters.",
              },
            }}
            render={({ field }) => (
              <FormFieldBookBank
                fieldName={"accountNameThai" as Path<TFieldValues>}
                label="Account Name (TH)"
                placeholder="Enter Name"
                type="text"
                value={field.value}
                control={control}
                errors={errors}
              />
            )}
          />

          {/* === ช่อง Account No. === */}
          <Controller
            name={"accountNumber" as Path<TFieldValues>}
            control={control}
            rules={{
              required: "Unable to extract data. Kindly rescan your document.",
              maxLength: 13,
              validate: (value: string) => {
                const digitsOnly = value.replace(/-/g, "");
                if (digitsOnly.length > 13) return false;
                if (value.length > 0 && !/^[0-9-]+$/.test(value)) return false;
                return true;
              },
            }}
            render={({ field }) => (
              <FormFieldBookBank
                fieldName={"accountNumber" as Path<TFieldValues>}
                label="Account No."
                placeholder="Enter Account no."
                type="text"
                control={control}
                value={field.value}
                onChange={field.onChange}
                errors={errors}
                disabled
              />
            )}
          />
        </div>
      </div>
      <div className="mt-6">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full h-12 rounded-xl text-white font-semibold text-base transition-colors ${
            canSubmit ? "bg-[#2152b6]" : "bg-gray-400"
          }`}
        >
          Confirm
        </button>
      </div>
    </form>
  );
};

export default FormBookBank;
