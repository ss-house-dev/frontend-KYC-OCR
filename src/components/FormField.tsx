// src/components/FormField.jsx

import React from 'react';
import PropTypes from 'prop-types'; // <-- Import PropTypes for type checking

// 2. เปลี่ยนวิธีรับ props มาเป็นแบบ (props) ตรงๆ
const FormField = (props) => {
  // 3. ดึงค่าแต่ละตัวออกจาก props object ด้านในฟังก์ชัน
  const { label, value, charCount, placeholder } = props;

  return (
    <div>
      <label className="text-sm text-gray-500 mb-1 block">{label}</label>
      <div className="w-full rounded-lg bg-gray-100 p-3">
        {placeholder ? (
          <input 
            type="text" 
            placeholder={placeholder}
            className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
          />
        ) : (
          <p className="text-gray-900">{value}</p>
        )}
      </div>
      {charCount && <p className="text-right text-xs text-gray-400 mt-1">{charCount}</p>}
    </div>
  );
};

// 4. (แนะนำ) กำหนด propTypes เพื่อระบุว่า props แต่ละตัวควรเป็นข้อมูลประเภทไหน
FormField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  charCount: PropTypes.string,
  placeholder: PropTypes.string,
};

// 5. (แนะนำ) กำหนดค่าเริ่มต้นให้ props ที่อาจจะไม่ถูกส่งมา
FormField.defaultProps = {
  value: '',
  charCount: null,
  placeholder: '',
};

export default FormField;