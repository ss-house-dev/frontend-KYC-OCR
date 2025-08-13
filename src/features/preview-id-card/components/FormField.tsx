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
  return (
    <Controller
      name={fieldName}
      control={control}
      rules={validationRules}
      render={({ field }) => {
        const currentValue = field.value || "";
        const charCount =
          typeof currentValue === "string"
            ? ignoreChars && ignoreChars.length > 0
              ? currentValue.replace(
                  new RegExp(`[${ignoreChars.join("")}]`, "g"),
                  ""
                ).length
              : currentValue.length
            : 0;

        return (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor={fieldName} className="text-sm">
                {label}
                {validationRules?.required && (
                  <span className="text-red-500 ml-[1px]">*</span>
                )}
              </Label>
            </div>

            <Input
              id={fieldName}
              {...field}
              {...(ignoreChars ? {} : { maxLength })}
              {...rest}
            />

            <div className="text-xs text-muted-foreground min-h-[1rem]">
              {fieldName !== "firstNameThai" &&
              fieldName !== "lastNameThai" &&
              errors[fieldName] ? (
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
