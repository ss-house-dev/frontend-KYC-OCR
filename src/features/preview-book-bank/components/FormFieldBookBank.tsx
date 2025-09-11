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

interface FormFieldBookBankProps<TFieldValues extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName: Path<TFieldValues>;
  label: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  maxLength?: number;
  ignoreChars?: string[];
}

const FormFieldBookBank = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
  maxLength,
  ignoreChars,
  ...rest
}: FormFieldBookBankProps<TFieldValues>) => {
  const fieldError = errors[fieldName];
  const hasError = !!fieldError;

  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field, fieldState }) => (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Label htmlFor={fieldName} className="text-sm">
              {label}
              <span className="text-red-500 ml-[1px]">*</span>
            </Label>
          </div>

          <Input
            id={fieldName}
            {...field}
            {...rest}
            className={`${
              hasError || fieldState.error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : ""
            }`}
          />
          <div className="text-xs text-muted-foreground min-h-[1rem]">
            <span className="text-destructive text-sm">
              {errors[fieldName]?.message as string}
            </span>
          </div>
        </div>
      )}
    />
  );
};

export default FormFieldBookBank;
