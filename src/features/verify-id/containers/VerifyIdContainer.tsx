// src/features/verify-id/containers/VerifyIdContainer.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VerifyIdView from "../components/VerifyIdView"; // นำ UI component เข้ามา

export default function VerifyIdContainer() {
  // --- State and Logic ---
  const [isChecked, setIsChecked] = useState(false);
  const router = useRouter();

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
  };

  const handleStartScan = () => {
    if (!isChecked) return;
    // Logic การนำทางไปยังหน้าสแกน
    console.log("Navigating to scanner page...");
    // router.push('/scan'); // <-- ตัวอย่างการเปลี่ยนหน้า
  };
  
  const handleBack = () => {
    router.back();
  }

  // --- Rendering ---
  // ส่ง State และฟังก์ชันทั้งหมดเป็น Props ให้กับ View
  return (
    <VerifyIdView
      isChecked={isChecked}
      onCheckboxChange={handleCheckboxChange}
      onStartScan={handleStartScan}
      onBack={handleBack}
    />
  );
}