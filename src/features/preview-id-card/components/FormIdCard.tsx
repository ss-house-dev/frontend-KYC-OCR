import {
  Control,
  Controller,
  UseFormWatch,
  FieldErrors,
  FieldValues,
  Path,
  UseFormHandleSubmit,
  SubmitHandler,
} from "react-hook-form";
import FormField from "@/features/preview-id-card/components/FormField";
import FormSelect from "@/features/preview-id-card/components/FormSelect";
import ProgressLoading from "./ProgressLoading";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";

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
  watch?: UseFormWatch<TFieldValues>;
  canSubmit: boolean;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  capturedImage: string | null;
  isValid: boolean;
  isLoading: boolean;
  loadingProgress: number;
}

const FormIdCard = <TFieldValues extends FieldValues>({
  handleSubmit,
  onSubmit,
  watch,
  canSubmit,
  control,
  errors,
  capturedImage,
  isLoading,
  loadingProgress,
}: FormIdCardProps<TFieldValues>) => {
  const [laserCharCount, setLaserCharCount] = useState(0);

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
        capturedImage && (
          <img
            src={capturedImage}
            alt="Thai National ID Card"
            className="rounded-xl w-full mb-5 border-2 border-dashed border-[#1849D6] p-1"
          />
        )
      )}

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
          <Controller
            name={"idNumber" as Path<TFieldValues>}
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
              <FormField
                fieldName={"idNumber" as Path<TFieldValues>}
                label="ID Number"
                placeholder="Enter 13-digit Citizen ID number"
                type="text"
                control={control}
                value={field.value}
                onChange={field.onChange}
                disabled
                maxLength={13}
                ignoreChars={["-"]}
                errors={errors}
              />
            )}
          />

          <Controller
            name={"issueDateThai" as Path<TFieldValues>}
            control={control}
            rules={{
              required: "Unable to extract data. Kindly rescan your document.",
            }}
            render={({ field }) => (
              <FormField
                fieldName={"issueDateThai" as Path<TFieldValues>}
                label="Date of Issue"
                placeholder="DD-MM-YY"
                type="text"
                disabled
                value={field.value}
                control={control}
                onChange={field.onChange}
                errors={errors}
              />
            )}
          />

          <Controller
            name={"expiryDateThai" as Path<TFieldValues>}
            control={control}
            rules={{
              required: "Unable to extract data. Kindly rescan your document.",
            }}
            render={({ field }) => (
              <FormField
                fieldName={"expiryDateThai" as Path<TFieldValues>}
                label="Date of Expiry"
                placeholder="DD-MM-YY"
                type="text"
                disabled
                value={field.value}
                control={control}
                onChange={field.onChange}
                errors={errors}
              />
            )}
          />

          <Controller
            name={"laserId" as Path<TFieldValues>}
            control={control}
            rules={{
              required: true,
              pattern: /^[A-Za-z]{2}\d-\d{7}-\d{2}$/,
            }}
            render={({ field }) => (
              <FormField
                fieldName={"laserId" as Path<TFieldValues>}
                label="Laser ID"
                control={control}
                placeholder="Enter Laser ID number"
                type="text"
                value={field.value}
                onChange={(e) => {
                  let value = e.target.value.replace(/-/g, "");
                  setLaserCharCount(value.length);
                  let formatted = "";
                  if (value.length > 0)
                    formatted +=
                      value.slice(0, 3) + (value.length > 3 ? "-" : "");
                  if (value.length > 3)
                    formatted +=
                      value.slice(3, 10) + (value.length > 10 ? "-" : "");
                  if (value.length > 10) formatted += value.slice(10, 12);
                  e.target.value = formatted;
                  field.onChange(e);
                }}
                maxLength={12}
                ignoreChars={["-"]}
                errors={errors}
              />
            )}
          />
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
          <FormSelect
            fieldName={"titleThai" as Path<TFieldValues>}
            label="Name Title"
            control={control}
            errors={errors}
            validationRules={{ required: "This field is needed." }}
          />

          <Controller
            name={"firstNameThai" as Path<TFieldValues>}
            control={control}
            rules={{
              required: "This field is needed",
              maxLength: {
                value: 50,
                message: "Cannot exceed 50 characters",
              },
              pattern: {
                value: /^[\u0E00-\u0E7F]+$/,
                message: "Invalid format. Please enter the correct characters.",
              },
            }}
            render={({ field }) => (
              <FormField
                fieldName={"firstNameThai" as Path<TFieldValues>}
                label="First name"
                placeholder="Enter your First name"
                type="text"
                value={field.value}
                control={control}
                maxLength={50}
                errors={errors}
              />
            )}
          />

          <Controller
            name={"lastNameThai" as Path<TFieldValues>}
            control={control}
            rules={{
              required: "This field is needed",
              maxLength: 50,
              pattern: {
                value: /^[\u0E00-\u0E7F]+$/,
                message: "Invalid format. Please enter the correct characters.",
              },
            }}
            render={({ field }) => (
              <FormField
                fieldName={"lastNameThai" as Path<TFieldValues>}
                label="Last name"
                placeholder="Enter your Last name"
                type="text"
                control={control}
                value={field.value}
                maxLength={50}
                errors={errors}
              />
            )}
          />

          <Controller
            name={"birthDateThai" as Path<TFieldValues>}
            control={control}
            rules={{
              required: "Unable to extract data. Kindly rescan your document.",
            }}
            render={({ field }) => (
              <FormField
                fieldName={"birthDateThai" as Path<TFieldValues>}
                label="Date of Birth"
                placeholder="DD-MM-YY"
                type="text"
                disabled
                value={field.value}
                control={control}
                onChange={field.onChange}
                errors={errors}
              />
            )}
          />
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4">
          <Label htmlFor="address" className="text-sm">
            Address <span className="text-red-500 ml-[1px]">*</span>
          </Label>
          <Controller
            name={"address" as Path<TFieldValues>}
            control={control}
            rules={{
              required: "This field is needed",
              maxLength: {
                value: 200,
                message: "Address must be 200 characters or less",
              },
            }}
            render={({ field }) => (
              <>
                <Textarea
                  id="address"
                  placeholder="Enter your Address"
                  maxLength={200}
                  className="h-24 resize-y mt-1 mb-1 bg-muted"
                  value={field.value}
                  onChange={field.onChange}
                />
                <div className="text-sm text-muted-foreground min-h-[1rem]">
                  {errors.address ? (
                    <span className="text-destructive">
                      {errors.address.message as string}
                    </span>
                  ) : (
                    <span>{field.value ? field.value.length : 0} / 200</span>
                  )}
                </div>
              </>
            )}
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full h-12 rounded-xl text-white font-semibold text-base transition-colors ${
            canSubmit
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
