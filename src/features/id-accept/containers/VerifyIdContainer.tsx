"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VerifyIdView from "../components/VerifyIdView";

export default function VerifyIdContainer() {
  
  const [isChecked, setIsChecked] = useState(false);
  const router = useRouter();

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
  };

  const handleStartScan = () => {
    if (!isChecked) return;
    console.log("Navigating to scanner page...");
  };
  
  const handleBack = () => {
    router.back();
  }

  return (
    <VerifyIdView
      isChecked={isChecked}
      onCheckboxChange={handleCheckboxChange}
      onStartScan={handleStartScan}
      onBack={handleBack}
    />
  );
}