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
              className={cn(
                "w-full h-12 rounded-[8px] justify-between font-normal",
                "text-sm text-[#212121] border-[#D1D1D1]",
                hasError || fieldState.error
                  ? "border-[#D1D1D1] hover:bg-white text-left"
                  : "",
              )}
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
