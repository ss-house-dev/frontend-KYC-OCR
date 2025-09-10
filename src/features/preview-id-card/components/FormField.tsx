"use client";

import React from "react";
import {
  Controller,
  Control,
  FieldErrors,
  RegisterOptions,
  FieldValues,
  Path,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormFieldProps<TFieldValues extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName: Path<TFieldValues>;
  label: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  maxLength?: number;
  // validationRules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  ignoreChars?: string[];
}

const FormField = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
  maxLength,
  ignoreChars,
  ...rest
}: FormFieldProps<TFieldValues>) => {
  const fieldError = errors[fieldName];
  const hasError = !!fieldError;

  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field , fieldState}) => {
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
              <Label htmlFor={fieldName} className="text-sm">
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
              className={`${
                hasError || fieldState.error 
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                  : ""
              }`}
            />
            <div className="text-xs text-muted-foreground min-h-[1rem]">
              {errors[fieldName] ? (
                <span className="text-destructive text-sm">
                  {errors[fieldName]?.message as string}
                </span>
              ) : (
                maxLength && (
                  <span>
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
