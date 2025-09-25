import {
  Control,
  Controller,
  UseFormWatch,
  FieldErrors,
  FieldValues,
  Path,
  UseFormHandleSubmit,
  SubmitHandler,
  SubmitErrorHandler,
} from "react-hook-form";
import FormField from "@/features/preview-id-card/components/FormField";
import FormSelect from "@/features/preview-id-card/components/FormSelect";
import FullScreenLoader from "@/components/FullScreenLoader";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect, useRef } from "react";
import FormLaserId from "./FormLaserId";
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

interface FormIdCardProps<TFieldValues extends FieldValues> {
  handleSubmit: UseFormHandleSubmit<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  canSubmit: boolean;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  capturedImage: string | null;
  isValid: boolean;
  isLoading: boolean;
  loadingProgress: number;
  isSubmitting?: boolean;
}

// ใช้ cookie key สำหรับข้อมูลที่แก้ไข (priority สูง)
const EDITED_DATA_COOKIE_KEY = "idcard_form_edited";

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
  isSubmitting,
}: FormIdCardProps<TFieldValues>) => {
  const [laserCharCount, setLaserCharCount] = useState(0);
  const initialDataRef = useRef<any>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // บันทึกข้อมูลเริ่มต้น (จาก OCR) เพื่อเปรียบเทียบ
  const allValues = watch();
  useEffect(() => {
    if (allValues && !initialDataRef.current && !isFormInitialized) {
      // บันทึกข้อมูลเริ่มต้นครั้งแรก (จาก OCR หรือ cookie)
      const hasIdNumber =
        allValues.idNumber && String(allValues.idNumber).trim();
      if (hasIdNumber) {
        console.log("[FormIdCard] Recording initial data:", allValues);
        initialDataRef.current = JSON.parse(JSON.stringify(allValues));
        setIsFormInitialized(true);
      }
    }
  }, [allValues, isFormInitialized]);

  // บันทึกลง cookie เมื่อ user แก้ไขข้อมูล (ไม่ใช่ข้อมูลเริ่มต้น)
  useEffect(() => {
    if (
      allValues &&
      initialDataRef.current &&
      isFormInitialized &&
      !isLoading
    ) {
      // เปรียบเทียบกับข้อมูลเริ่มต้น
      const hasChanges =
        JSON.stringify(allValues) !== JSON.stringify(initialDataRef.current);

      if (hasChanges) {
        console.log(
          "[FormIdCard] Detected user changes, saving to edited cookie"
        );
        console.log("[FormIdCard] Initial data:", initialDataRef.current);
        console.log("[FormIdCard] Current data:", allValues);

        // เฉพาะเมื่อ user แก้ไขข้อมูลเท่านั้น
        saveFormToCookie(EDITED_DATA_COOKIE_KEY, allValues);
      } else {
        console.log("[FormIdCard] No changes detected, skipping cookie save");
      }
    }
  }, [allValues, isFormInitialized, isLoading]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-muted space-y-4">
      <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
        <div className="flex items-center space-x-2.5 rounded-lg bg-[#246AEC] text-white p-7 mb-5">
          <IconInfo />
          <p className="text-sm font-medium">
            Your data will be used only for identity verification and handled
            securely.
          </p>
        </div>

        <div className="rounded-xl w-full mb-5 p-1 border-2 border-dashed border-[#1849D6] overflow-hidden">
          <div className="relative w-full aspect-[8.8/5.6] flex items-center justify-center">
            {isLoading ? (
              <>
                <FullScreenLoader />
                <p className="text-[#1849D6] font-medium z-10">
                  Image loading...
                </p>
              </>
            ) : (
              capturedImage && (
                <img
                  src={capturedImage}
                  alt="Thai National ID Card"
                  className="w-full h-full object-contain rounded-xl"
                />
              )
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
          <Controller
            name={"idNumberFormatted" as Path<TFieldValues>}
            control={control}
            render={({ field }) => (
              <FormField
                fieldName={"idNumberFormatted" as Path<TFieldValues>}
                label="ID Number"
                placeholder="Enter 13-digit Citizen ID number"
                type="text"
                control={control}
                value={field.value}
                onChange={field.onChange}
                disabled
                errors={errors}
              />
            )}
          />

          <Controller
            name={"issueDateThai" as Path<TFieldValues>}
            control={control}
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
            render={({ field }) => (
              <FormLaserId
                fieldName={"laserId" as Path<TFieldValues>}
                label="Laser ID"
                control={control}
                placeholder="Enter Laser ID number"
                type="text"
                value={field.value}
                pattern="[A-Za-z]{2}\d-\d{7}-\d{2}"
                maxLength={14}
                ignoreChars={["-"]}
                counterValue={laserCharCount}
                errors={errors}
              />
            )}
          />
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
          <Controller
            name={"titleThai" as Path<TFieldValues>}
            control={control}
            render={({ field }) => (
              <FormSelect
                fieldName={"titleThai" as Path<TFieldValues>}
                label="Name Title"
                control={control}
                errors={errors}
                validationRules={{
                  required: "This field is needed",
                }}
              />
            )}
          />

          <Controller
            name={"firstNameThai" as Path<TFieldValues>}
            control={control}
            render={({ field }) => (
              <FormField
                fieldName={"firstNameThai" as Path<TFieldValues>}
                label="First name (TH)"
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
            render={({ field }) => (
              <FormField
                fieldName={"lastNameThai" as Path<TFieldValues>}
                label="Last name (TH)"
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
            name={"firstNameEng" as Path<TFieldValues>}
            control={control}
            render={({ field }) => (
              <FormField
                fieldName={"firstNameEng" as Path<TFieldValues>}
                label="First name (ENG)"
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
            name={"lastNameEng" as Path<TFieldValues>}
            control={control}
            render={({ field }) => (
              <FormField
                fieldName={"lastNameEng" as Path<TFieldValues>}
                label="Last name (ENG)"
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
            render={({ field, fieldState }) => {
              const fieldError = errors.address;
              const hasError = !!(fieldError || fieldState.error);
              return (
                <>
                  <Textarea
                    id="address"
                    placeholder="Enter your Address"
                    maxLength={200}
                    className={`h-24 resize-y mt-1 mb-1 bg-muted ${
                      hasError
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  <div className="text-sm text-muted-foreground min-h-[1rem]">
                    {hasError ? (
                      <span className="text-destructive">
                        {
                          (fieldError?.message ||
                            fieldState.error?.message) as string
                        }
                      </span>
                    ) : (
                      <span>{field.value ? field.value.length : 0} / 200</span>
                    )}
                  </div>
                </>
              );
            }}
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
          {isSubmitting ? "Confirm" : "Confirm"}
        </button>
      </div>
    </form>
  );
};

export default FormIdCard;
