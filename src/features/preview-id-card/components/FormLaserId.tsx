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
  counterValue?: number;
}

const FormField = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
  maxLength,
  validationRules,
  ignoreChars,
  counterValue,
  ...rest
}: FormFieldProps<TFieldValues>) => {
  const fieldError = errors[fieldName];
  const hasError = !!fieldError;

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
      render={({ field, fieldState }) => {
        const val = field.value || "";
        const escapeForCharClass = (s: string) =>
          s.replace(/[\\^$.*+?()[\]{}|/-]/g, "\\$&");

        const makeCharCount = (val: unknown, ignore: string[] = []) => {
          let s = String(val ?? "");
          if (ignore.length) {
            const klass = ignore.map(escapeForCharClass).join("");
            s = s.replace(new RegExp(`[${klass}]`, "g"), "");
          }
          return s.length;
        };

        const internalCount = ignoreChars?.length
          ? makeCharCount(field.value, ignoreChars)
          : String(field.value ?? "").length;

        const charCount =
          typeof counterValue === "number" ? counterValue : internalCount;

        return (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor={fieldName} className="text-sm">
                {label}
                <span className="text-red-500 ml-[1px]">*</span>
              </Label>
            </div>

            <Input
              {...rest}
              id={fieldName}
              value={val}
              onChange={(e) => {
                const raw = e.target.value.replace(/-/g, "");
                const raw12 = raw.slice(0, 12);
                let formatted = "";
                if (raw12.length > 0) {
                  formatted += raw12.slice(0, 3);
                  if (raw12.length > 3) formatted += "-" + raw12.slice(3, 10);
                  if (raw12.length > 10) formatted += "-" + raw12.slice(10, 12);
                }
                field.onChange(formatted);
                rest?.onChange?.({
                  ...e,
                  target: { ...e.target, value: formatted },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
            />
            <div className="text-xs text-muted-foreground min-h-[1rem]">
              <span>{(val ?? "").toString().replace(/-/g, "").length}/12</span>
              {errors[fieldName] && (
                <span className="text-destructive">
                  {errors[fieldName]?.message as string}
                </span>
              )}
            </div>
          </div>
        );
      }}
    />
  );
};

export default FormField;
