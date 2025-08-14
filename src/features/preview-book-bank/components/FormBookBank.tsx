import React from "react";
import {
  UseFormRegister,
  FieldErrors,
  FieldValues,
  UseFormHandleSubmit,
  UseFormWatch,
  Controller,
  Control,
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ConfirmButton } from "@/components/ui/confirmbutton";

const IconInfo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6 flex-shrink-0"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

interface BookBankFormValues {
  bank: string;
  branch: string;
  accountName: string;
  accountNo: string;
}
interface FormBookBankProps {
  handleSubmit: UseFormHandleSubmit<BookBankFormValues>;
  onSubmit: (data: BookBankFormValues) => void;
  register: UseFormRegister<BookBankFormValues>;
  errors: FieldErrors<BookBankFormValues>;
  control: Control<BookBankFormValues>;
  watch?: UseFormWatch<BookBankFormValues>;
  bankOptions: { value: string; label: string; image: string }[];
  capturedImage: string | null;
  isValid: boolean;
  isLoading: boolean;
  loadingProgress: number;
}

const FormBookBank = <TFieldValues extends FieldValues>({
  handleSubmit,
  onSubmit,
  watch,
  control,
  errors,
  register,
  capturedImage,
  bankOptions,
  isValid,
  isLoading,
  loadingProgress,
}: FormBookBankProps) => {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-6">
          <div className="border-2 border-dashed border-blue-400 rounded-lg p-1 mb-6">
            <div className="bg-gray-200 h-48 flex items-center justify-center rounded-md">
              <p className="text-gray-500">[Image Preview]</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank">Select a bank</Label>
            <Controller
              name="bank"
              control={control}
              defaultValue=""
              render={({ field }) => {
                const selectedBank = bankOptions.find(
                  (b) => b.value === field.value
                );

                return (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      {selectedBank ? (
                        <div className="flex items-center gap-4">
                          <Image
                            src={selectedBank.image}
                            alt={`${selectedBank.label} logo`}
                            className="h-8 w-8 rounded-full object-contain"
                          />
                          <span className="font-medium">
                            {selectedBank.label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">เลือกธนาคาร</span>
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

          {/* === ช่อง Branch === */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Input id="branch" {...register("branch")} />
          </div>

          {/* === ช่อง Account Name === */}
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input id="accountName" {...register("accountName")} />
          </div>

          {/* === ช่อง Account No. === */}
          <div className="space-y-2">
            <Label htmlFor="accountNo">Account No.</Label>
            <Input id="accountNo" {...register("accountNo")} />
          </div>
        </div>
      </div>

      <ConfirmButton disabled={!isValid} />
    </form>
  );
};

export default FormBookBank;
