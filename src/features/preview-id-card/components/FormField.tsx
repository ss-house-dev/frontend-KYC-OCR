"use client";

import React from "react";
import {
  UseFormRegister,
  FieldErrors,
  RegisterOptions,
  FieldValues,
  Path,
  UseFormWatch,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormFieldProps<TFieldValues extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName: Path<TFieldValues>;
  label: string;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  watch?: UseFormWatch<TFieldValues>;
  maxLength?: number;
  validationRules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  ignoreChars?: string[];
}

const FormField = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  register,
  errors,
  watch,
  maxLength,
  validationRules,
  ignoreChars,
  ...rest
}: FormFieldProps<TFieldValues>) => {
  const currentValue = watch ? watch(fieldName) : "";
  const currentLength =
    typeof currentValue === "string" ? currentValue.length : 0;

  return (
    <div className="space-y-1">
  <div className="flex justify-between items-center">
    <Label htmlFor={fieldName} className="text-sm">
      {label}
      {validationRules?.required && (
        <span className="text-red-500 ml-[1px]">*</span>
      )}
    </Label>
    {maxLength && (
      <span className="text-xs text-muted-foreground">
        {currentLength}/{maxLength}
      </span>
    )}
  </div>

  <Input
    id={fieldName}
    {...register(fieldName, validationRules)}
    {...(ignoreChars ? {} : { maxLength })}
    {...rest}
  />

  {errors[fieldName] && (
    <p className="text-sm text-destructive">
      {errors[fieldName]?.message as string}
    </p>
  )}
</div>
  );
};

export default FormField;
