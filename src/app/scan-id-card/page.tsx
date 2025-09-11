"use client";

import React, { useState } from "react";
import IdCardScannerContainer from "@/features/scan-id-card/containers/ScanIDCardSection";

const ScanIdCardPage = () => {
  const [statusMessage, setStatusMessage] = useState("Please hold steady");
  const [statusColor, setStatusColor] = useState<"red" | "green">("red");

  const handleCapture = (imageDataUrl: string) => {
    console.log("Image captured!", imageDataUrl.substring(0, 30) + "...");
  };

  const handleStatusChange = (message: string, color: "red" | "green") => {
    setStatusMessage(message);
    setStatusColor(color);
  };

  return (
    <main>
      <IdCardScannerContainer
        onCapture={handleCapture}
        onStatusChange={handleStatusChange}
        frameColor={statusColor}
        sharpnessMsg={statusMessage}
      />
    </main>
  );
};

export default ScanIdCardPage;
