"use client";

import React from "react";
import {
  Controller,
  Control,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormFieldProps<TFieldValues extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName: Path<TFieldValues>;
  label: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  maxLength?: number;
  ignoreChars?: string[];
  disabled?: boolean;
}

const FormField = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
  maxLength,
  ignoreChars,
  disabled,
  ...rest
}: FormFieldProps<TFieldValues>) => {
  const fieldError = errors[fieldName];
  const hasError = !!fieldError;

  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field, fieldState }) => {
        const val = field.value || "";
        const charCount =
          typeof val === "string"
            ? ignoreChars && ignoreChars.length > 0
              ? val.replace(new RegExp(`[${ignoreChars.join("")}]`, "g"), "")
                  .length
              : val.length
            : 0;

        return (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label
                htmlFor={fieldName}
                className={cn(
                  "text-sm",
                  disabled ? "text-[#9E9E9E] cursor-not-allowed" : ""
                )}
              >
                {label}
                <span className="text-red-500 ml-[1px]">*</span>
              </Label>
            </div>

            <Input
              id={fieldName}
              value={val}
              onChange={(e) => {
                let inputVal = e.target.value;
                if (maxLength) inputVal = inputVal.slice(0, maxLength);
                field.onChange(inputVal);
              }}
              {...rest}
              disabled={disabled}
              className={cn(
                "w-full h-12 rounded-[8px] justify-between font-normal",
                "text-sm text-[#212121] border-[#D1D1D1]",
                hasError || fieldState.error
                  ? "border-[#D1D1D1] hover:bg-white text-left"
                  : "",
                disabled
                  ? "bg-[#F6F6F6] cursor-not-allowed text-[#888888] border-none"
                  : ""
              )}
            />
            <div
              className={cn(
                "text-xs min-h-[1rem]",
                disabled ? "text-gray-400" : "text-muted-foreground"
              )}
            >
              {errors[fieldName] ? (
                <span className="text-destructive text-xs">
                  {errors[fieldName]?.message as string}
                </span>
              ) : (
                maxLength && (
                  <span className={cn(disabled ? "text-gray-400" : "")}>
                    {charCount}/{maxLength}
                  </span>
                )
              )}
            </div>
          </div>
        );
      }}
    />
  );
};

export default FormField;
