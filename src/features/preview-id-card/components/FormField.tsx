import React from 'react';

import {
  UseFormRegister,
  FieldErrors,
  RegisterOptions,
  FieldValues, 
  Path,      
} from 'react-hook-form';

interface FormFieldProps<TFieldValues extends FieldValues> {
  fieldName: Path<TFieldValues>; 
  label: string;
  register: UseFormRegister<TFieldValues>; 
  errors: FieldErrors<TFieldValues>;       
  validationRules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  
  [key: string]: unknown; 
}

const FormField = <TFieldValues extends FieldValues>({
  fieldName,
  label,
  register,
  errors,
  validationRules,
  ...rest 
}: FormFieldProps<TFieldValues>) => {

  
  return (
    <div>
      <label htmlFor={fieldName} className="text-sm text-gray-500 mb-1 block">
        {label}
      </label>
      <input
        id={fieldName}
        
        {...register(fieldName, validationRules)}
        className="w-full rounded-lg bg-gray-100 p-3 text-gray-900 outline-none border-2 border-transparent focus:border-blue-500"

        {...rest}
      />
      {/* แสดงข้อความ Error ถ้ามี */}
      {errors[fieldName] && (
        <p className="text-red-500 text-sm mt-1">
          {errors[fieldName]?.message as string}
        </p>
      )}
    </div>
  );
};

export default FormField;
