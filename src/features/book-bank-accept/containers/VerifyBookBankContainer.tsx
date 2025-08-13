"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VerifyBookBankView from "../components/VerifyBookBankView";

export default function VerifyBookBankContainer() {
  
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
    <VerifyBookBankView
      isChecked={isChecked}
      onCheckboxChange={handleCheckboxChange}
      onStartScan={handleStartScan}
      onBack={handleBack}
    />
  );
}