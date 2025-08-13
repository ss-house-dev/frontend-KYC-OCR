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