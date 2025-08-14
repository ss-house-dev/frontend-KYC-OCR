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
  validationRules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  ignoreChars?: string[];
}

const FormField = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
  maxLength,
  validationRules,
  ignoreChars,
  ...rest
}: FormFieldProps<TFieldValues>) => {
  const maxLen =
    (validationRules?.maxLength &&
      typeof validationRules.maxLength === "object" &&
      validationRules.maxLength.value) ||
    maxLength;

  return (
<Controller
      name={fieldName}
      control={control}
      rules={validationRules}
      render={({ field }) => {
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
                if (maxLen) inputVal = inputVal.slice(0, maxLen);
                field.onChange(inputVal);
              }}
              {...rest}
            />

            <div className="text-xs text-muted-foreground min-h-[1rem]">
              {errors[fieldName] ? (
                <span className="text-destructive text-sm">
                  {errors[fieldName]?.message as string}
                </span>
              ) : (
                maxLen && <span>{charCount}/{maxLen}</span>
              )}
            </div>
          </div>
        );
      }}
    />
  );
};

export default FormField;