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
  ignoreChars?: string[];
  counterValue?: number;
}

const FormField = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
  maxLength,
  ignoreChars,
  counterValue,
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
                let raw = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "");
                raw = raw.slice(0, 12);

                const chars = raw.split("");
                for (let i = 0; i < chars.length; i++) {
                  if (i < 2 && /[^A-Z]/.test(chars[i])) {
                    chars[i] = "";
                  }
                  if (i >= 2 && /[^0-9]/.test(chars[i])) {
                    chars[i] = "";
                  }
                }
                const fixed = chars.join("");
                const part1 = fixed.slice(0, 3); 
                const part2 = fixed.slice(3, 10); 
                const part3 = fixed.slice(10, 12); 
                const formatted =
                  part1 +
                  (part2 ? "-" + part2 : "") +
                  (part3 ? "-" + part3 : "");

                field.onChange(formatted);
              }}
            />
            <div className="text-xs text-muted-foreground min-h-[1rem]">
              <span>{(val ?? "").toString().replace(/-/g, "").length}/12</span>
            </div>
          </div>
        );
      }}
    />
  );
};

export default FormField;
