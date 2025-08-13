// import axios from "axios";
// import React, { useEffect, useState } from "react";

// const TestUploader = () => {
//   const [ocrResult, setOcrResult] = useState(null); 
//   const [isLoading, setIsLoading] = useState(false);

//   const handleTestUpload = async () => {
//     setOcrResult(null); 
//     setIsLoading(true);
//     try {
//       const response = await fetch("/idcard.jpg");
//       const imageBlob = await response.blob();

//       const imageFile = new File([imageBlob], "idcard.jpg", {
//         type: imageBlob.type,
//       });

//       const formData = new FormData();
//       formData.append("file", imageFile);

//       alert("กำลังจะส่งไฟล์ทดสอบ...");
//       const result = await axios.post("/ocr/idcard", formData);

//       alert("อัปโหลดสำเร็จ!");
//       console.log(result.data);

//     console.log("API Response Data:", result.data); 
//     setOcrResult(result.data); 

//     } catch (error) {
//       alert("อัปโหลดล้มเหลว! ดูที่ console");
//       console.error("Test upload failed:", error);
//     }
//   };
// };

import axios from 'axios';

/**
 * ฟังก์ชันสำหรับอัปโหลดไฟล์รูปภาพไปยัง OCR API
 * @param imageFile - The File object ของรูปภาพที่จะอัปโหลด
 * @returns - ข้อมูลที่ได้จากการอ่าน OCR
 */
export const uploadIdCardOcr = async (imageFile: File) => {
  try {
    // 1. สร้าง FormData
    const formData = new FormData();
    // 2. เพิ่มไฟล์เข้าไป (ใช้ key ที่ถูกต้อง เช่น 'file')
    formData.append('file', imageFile);

    // 3. ส่งคำขอไปยัง API และรอผลลัพธ์
    const result = await axios.post("/ocr/idcard", formData);

    // 4. คืนค่าข้อมูลที่ได้กลับไปให้ Component
    return result.data;

  } catch (error) {
    // 5. หากเกิดข้อผิดพลาด ให้โยน error ออกไปให้ Component จัดการต่อ
    console.error("Error in OCR Service:", error);
    throw error;
  }
};