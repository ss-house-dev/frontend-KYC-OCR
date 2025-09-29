import React, { useState } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
} from "react-hook-form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

interface FormDateProps<TFieldValues extends FieldValues> {
  fieldName: Path<TFieldValues>;
  label: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  maxDate?: Date;
  minDate?: Date;
  placeholder?: string;
}

// แปลง Date → string (DD/MM/YYYY, พ.ศ.)
const dateToThaiString = (date: Date | null | undefined): string => {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = (date.getFullYear() + 543).toString();
  return `${d}/${m}/${y}`;
};

// แปลง string (DD/MM/YYYY, พ.ศ.) → Date
const thaiStringToDate = (value?: string): Date | null => {
  if (!value) return null;
  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10) - 543;

  const parsed = new Date(year, month, day);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const FormDate = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
  maxDate,
  minDate,
  placeholder,
}: FormDateProps<TFieldValues>) => {
  const [open, setOpen] = useState(false);
  const today = maxDate ?? new Date();

  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field }) => {
        const error = errors[fieldName];
        const hasError = !!error;
        const selectedDate = thaiStringToDate(field.value as string);

        return (
          <div className="flex flex-col space-y-1">
            <Label className="text-sm font-medium">
              {label}
              <span className="text-red-500 ml-[1px]">*</span>
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 rounded-[8px] justify-between font-normal",
                    "border-[#D1D1D1] hover:bg-white text-left text-sm", 
                    hasError ? "border-[#E6353D]" : ""
                  )}
                >
                  <span
                    className={cn(
                      !selectedDate ? "text-[#888888]" : "text-[#212121]" 
                    )}
                  >
                    {dateToThaiString(selectedDate) || placeholder || label}
                  </span>
                  <CalendarIcon className="ml-2 h-4 w-4 opacity-70 text-[#888888]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  selected={selectedDate ?? undefined}
                  disabled={[
                    ...(minDate ? [{ before: minDate }] : []),
                    ...(maxDate ? [{ after: maxDate }] : []),
                  ]}
                  onSelect={(d) => {
                    const picked = d && d > today ? today : d;
                    field.onChange(dateToThaiString(picked ?? null));
                    setOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
            {hasError && (
              <span className="text-xs text-destructive">
                {error?.message as string}
              </span>
            )}
          </div>
        );
      }}
    />
  );
};

export default FormDate;
