// app/verify/page.tsx

import VerifyIdContainer from "@/features/verify-id/containers/VerifyIdContainer";
// หมายเหตุ: อาจจะต้องปรับ path ของ import ตามการตั้งค่า alias (@) ในโปรเจกต์ของคุณ
// หากไม่มี alias สามารถใช้ relative path เช่น '../../src/features/...'

export default function VerifyPage() {
  return <VerifyIdContainer />;
}