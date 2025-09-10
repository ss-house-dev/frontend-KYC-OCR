"use client";

import React from "react";
import {
  FieldErrors,
  FieldValues,
  Path,
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
import Image from "next/image";

interface FormSelectBookBankProps<TFieldValues extends FieldValues> {
  fieldName: Path<TFieldValues>;
  label: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
}

const FormSelectBookBank = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
}: FormSelectBookBankProps<TFieldValues>) => {
  const bankOptions = [
    { value: "kbank", label: "KBANK", image: "/logo-bank/kbank.jpg" },
    { value: "scb", label: "SCB", image: "/logo-bank/scb.png" },
    { value: "ktb", label: "KTB", image: "/logo-bank/ktb.png" },
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>
        {label}
        <span className="text-red-500 ml-[1px]">*</span>
      </Label>
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => {
          const selectedBank = bankOptions.find(
            (bank) => bank.value === field.value
          );

          return (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger>
                {selectedBank ? (
                  <div className="flex items-center gap-4">
                    <Image
                      src={selectedBank.image}
                      alt={`${selectedBank.label} logo`}
                      width={32}
                      height={32}
                      className="rounded-full object-contain"
                    />
                    <span className="font-medium">{selectedBank.label}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Bank</span>
                )}
              </SelectTrigger>
              <SelectContent>
                {bankOptions.map((bank) => (
                  <SelectItem key={bank.value} value={bank.value}>
                    <div className="flex items-center gap-4">
                      <Image
                        src={bank.image}
                        alt={`${bank.label} logo`}
                        width={32}
                        height={32}
                        className="rounded-full object-contain"
                      />
                      <SelectPrimitive.ItemText>
                        {bank.label}
                      </SelectPrimitive.ItemText>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }}
      />
    </div>
  );
};

export default FormSelectBookBank;
