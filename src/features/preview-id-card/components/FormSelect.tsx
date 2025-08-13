"use client";

import {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormWatch,
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
import { Label } from "@/components/ui/label";

interface FormSelectProps<TFieldValues extends FieldValues> {
  fieldName: Path<TFieldValues>;
  label: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  watch?: UseFormWatch<TFieldValues>;
  validationRules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
}

const FormSelect = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  control,
  errors,
  watch,
  validationRules,
}: FormSelectProps<TFieldValues>) => {
  const titleValue = watch ? watch(fieldName) : "";

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Controller
        name={fieldName}
        control={control}
        rules={validationRules}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={(value) => field.onChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="เลือกคำนำหน้าชื่อ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="นาย">นาย</SelectItem>
              <SelectItem value="นาง">นาง</SelectItem>
              <SelectItem value="นางสาว">นางสาว</SelectItem>
            </SelectContent>
          </Select>
        )}
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
