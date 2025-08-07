import React from "react";
import {
  UseFormRegister,
  FieldErrors,
  RegisterOptions,
  FieldValues,
  Path,
  UseFormWatch, // 1. Import UseFormWatch
} from "react-hook-form";

// 2. อัปเดต Interface ให้รับ watch และ maxLength
interface FormFieldProps<TFieldValues extends FieldValues>
  extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName: Path<TFieldValues>;
  label: string;
  register: UseFormRegister<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  watch?: UseFormWatch<TFieldValues>; // ทำให้ watch เป็น optional
  maxLength?: number; // ทำให้ maxLength เป็น optional
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
  // 3. ใช้ watch เพื่อดึงค่าปัจจุบันของ field มาดู
  const currentValue = watch ? watch(fieldName) : "";
  const currentLength =
    typeof currentValue === "string" ? currentValue.length : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={fieldName} className="text-sm text-gray-500">
          {label}
        </label>
      </div>
      <input
        id={fieldName}
        {...register(fieldName, validationRules)}
        className="w-full rounded-lg bg-gray-100 p-3 text-gray-900 outline-none border-2 border-transparent focus:border-blue-500"
        // 3. ถ้ามีการใช้ ignoreChars เราจะไม่กำหนด maxLength ของ HTML
        // เพื่อให้ผู้ใช้สามารถพิมพ์ตัวอักษรที่ไม่ถูกนับได้ (เช่นขีด)
        // การจำกัดความยาวจริงๆ จะถูกจัดการโดย validationRules ของ react-hook-form
        {...(ignoreChars ? {} : { maxLength: maxLength })}
        {...rest}
      />
      {/* 4. แสดงตัวนับ ถ้ามีการส่ง maxLength เข้ามา */}
      {maxLength && (
        <span className="text-xs text-gray-400">
          {currentLength}/{maxLength}
        </span>
      )}
      {errors[fieldName] && (
        <p className="text-red-500 text-sm mt-1">
          {errors[fieldName]?.message as string}
        </p>
      )}
    </div>
  );
};

export default FormField;
