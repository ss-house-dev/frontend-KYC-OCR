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
import FullScreenLoader from "@/components/FullScreenLoader";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect, useRef } from "react";
import FormLaserId from "./FormLaserId";
import { saveFormToCookie } from "@/lib/utils/index";
import FormDate from "./FormDate";
import { addDays } from "date-fns";
import { X } from "lucide-react";
import Image from "next/image";

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
  isSubmitting?: boolean;
}

// ใช้ cookie key สำหรับข้อมูลที่แก้ไข
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
  isSubmitting,
}: FormIdCardProps<TFieldValues>) => {
  const [laserCharCount, setLaserCharCount] = useState(0);
  const initialDataRef = useRef<any>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const [showAlert, setShowAlert] = useState(true);

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
    <form onSubmit={handleSubmit(onSubmit)} className="pt-3 bg-[#E7E7E7] space-y-3">
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
                Your ID card information will be used only for identity
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
                  alt="Thai National ID Card"
                  className="w-full h-full object-contain rounded-xl"
                />
              )
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 space-y-4">
          <Controller
            name={"idNumberFormatted" as Path<TFieldValues>}
            control={control}
            render={({ field }) => (
              <FormField
                fieldName={"idNumberFormatted" as Path<TFieldValues>}
                label="ID Number"
                placeholder="Enter your ID Number"
                type="text"
                control={control}
                value={field.value}
                onChange={field.onChange}
                disabled
                errors={errors}
                maxLength={13}
                ignoreChars={["-"]}
              />
            )}
          />

          <FormDate
            fieldName={"issueDateThai" as Path<TFieldValues>}
            label="Date of Issue (DD/MM/YYYY)"
            control={control}
            errors={errors}
            maxDate={new Date()} // ไม่เลือกอนาคต
            placeholder="Enter your date of issue"
          />

          <FormDate
            fieldName={"expiryDateThai" as Path<TFieldValues>}
            label="Date of Expiry (DD/MM/YYYY)"
            control={control}
            errors={errors}
            minDate={addDays(new Date(), 1)}
            placeholder="Enter your date of expiry"
          />

          <Controller
            name={"laserId" as Path<TFieldValues>}
            control={control}
            render={({ field }) => (
              <FormLaserId
                fieldName={"laserId" as Path<TFieldValues>}
                label="Laser ID (Back of your ID Card)"
                control={control}
                placeholder="Enter your Laser ID"
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

        <div className="bg-white p-4 space-y-4">
          <Controller
            name={"titleThai" as Path<TFieldValues>}
            control={control}
            render={({ field }) => (
              <FormSelect
                fieldName={"titleThai" as Path<TFieldValues>}
                label="Select your name title"
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
                placeholder="Enter your first name"
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
                placeholder="Enter your last name"
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
                placeholder="Enter your first name"
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
                placeholder="Enter your last name"
                type="text"
                control={control}
                value={field.value}
                maxLength={50}
                errors={errors}
              />
            )}
          />

          <FormDate
            fieldName={"birthDateThai" as Path<TFieldValues>}
            label="Date of Birth (DD/MM/YYYY)"
            control={control}
            errors={errors}
            maxDate={new Date()}
            placeholder="Enter your date of birth"
          />
        </div>

        <div className="bg-white p-4">
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
                    placeholder="Enter your address"
                    maxLength={200}
                    className={`h-24 resize-y mt-1 mb-1 bg-white border-[#D1D1D1] ${
                      hasError ? "border-[#E6353D]" : ""
                    }`}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  <div className="text-xs text-muted-foreground min-h-[1rem]">
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

      <div className="bg-white p-4 mt-6">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full h-12 rounded-[8px] text-white font-semibold text-base transition-colors ${
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
