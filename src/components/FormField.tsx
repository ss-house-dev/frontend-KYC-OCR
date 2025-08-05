// src/components/FormField.jsx

import React from 'react';
import PropTypes from 'prop-types'; // ตัวนี้คือ 'PropTypes' ไม่ใช่ 'props' นะครับ

// 1. เปลี่ยนวิธีการรับ props มาเป็น (props) ตรงๆ เพื่อให้ชัวร์ที่สุด
const FormField = (props) => {
  
  // 2. ดึงค่าตัวแปรทั้งหมดออกมาจาก object 'props' ด้านในฟังก์ชัน
  const {
    fieldName,
    label,
    register,
    errors,
    validationRules,
    ...rest
  } = props;

  // ส่วนที่เหลือของคอมโพเนนต์เหมือนเดิมทุกอย่าง
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
      {errors[fieldName] && (
        <p className="text-red-500 text-sm mt-1">
          {errors[fieldName].message}
        </p>
      )}
    </div>
  );
};

// ส่วนของ PropTypes เหมือนเดิม
FormField.propTypes = {
  fieldName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  validationRules: PropTypes.object,
};

// ส่วนของ defaultProps เหมือนเดิม
FormField.defaultProps = {
  validationRules: {},
};

export default FormField;