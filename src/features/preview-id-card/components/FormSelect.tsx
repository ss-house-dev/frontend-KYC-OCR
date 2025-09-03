"use client";

import React, { useEffect } from "react";
import {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  Control,
  Controller,
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormSelectProps<TFieldValues extends FieldValues> {
  fieldName: Path<TFieldValues>;
  label: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  validationRules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
}

const FormSelect = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
  validationRules,
}: FormSelectProps<TFieldValues>) => {
  const titleThai = [
    { value: "นาย", label: "นาย" },
    { value: "นาง", label: "นาง" },
    { value: "นางสาว", label: "นางสาว" },
  ];

  const fieldError = errors[fieldName];
  const hasError = !!fieldError;

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>
        {label}
        <span className="text-red-500 ml-[1px]">*</span>
      </Label>
      <Controller
        name={fieldName}
        control={control}
        rules={validationRules}
        render={({ field, fieldState }) => {
          const selectedTitle = titleThai.find(
            (title) => title.value === field.value
          );

          return (
            <>
              <Select
                value={field.value || ""}
                onValueChange={(value) => {
                  field.onChange(value);
                  setTimeout(() => field.onBlur(), 0);
                }}
              >
                <SelectTrigger
                  className={cn(
                    hasError ? "border-red-500 focus:border-red-500" : "",
                    "text-gray-900 font-medium",
                    "data-[placeholder]:text-muted-foreground bg-muted data-[placeholder]:font-normal"
                  )}
                >
                  <SelectValue placeholder="Select your name title" />
                </SelectTrigger>

                <SelectContent>
                  {titleThai.map((title) => (
                    <SelectItem key={title.value} value={title.value}>
                      <SelectPrimitive.ItemText>
                        {title.label}
                      </SelectPrimitive.ItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* แสดงข้อความ error */}
              <div className="text-xs text-muted-foreground min-h-[1rem]">
                {(fieldError || fieldState.error) && (
                  <span className="text-destructive text-sm">
                    {
                      (fieldError?.message ||
                        fieldState.error?.message) as string
                    }
                  </span>
                )}
              </div>
            </>
          );
        }}
      />
    </div>
  );
};

export default FormSelect;
