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

interface FormFieldBookBankProps<TFieldValues extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName: Path<TFieldValues>;
  label: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  maxLength?: number;
  validationRules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  ignoreChars?: string[];
}

const FormFieldBookBank = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
  maxLength,
  validationRules,
  ignoreChars,
  ...rest
}: FormFieldBookBankProps<TFieldValues>) => {
  return (
    <Controller
      name={fieldName}
      control={control}
      rules={validationRules}
      render={({ field }) => (
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
