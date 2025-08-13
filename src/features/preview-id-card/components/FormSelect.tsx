"use client";

import React , {useEffect}from "react";
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
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Label } from "@/components/ui/label";
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

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>{label}</Label>
      <Controller
        name={fieldName}
        control={control}
        rules={validationRules}
        render={({ field }) => {
          const selectedTitle = titleThai.find(
            (title) => title.value === field.value
          );

          return (
            <Select
              value={field.value || ""}
              onValueChange={(value) => field.onChange(value)}
            >
              <SelectTrigger>
                {selectedTitle ? (
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{selectedTitle.label}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Select your name title</span>
                )}
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
          );
        }}
      />
      {errors[fieldName] && (
        <p className="text-red-500 text-sm mt-1">
          {errors[fieldName]?.message as string}
        </p>
      )}
    </div>
  );
};

export default FormSelect;
