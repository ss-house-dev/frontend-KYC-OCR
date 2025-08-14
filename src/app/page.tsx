"use client";

import VerifyPage from "@/app/id-accept/page";
import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<"capturing" | "preview" | "processing">(
    "capturing"
  );
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [frameColor, setFrameColor] = useState<"red" | "green">("red"); // <-- แก้ไข Type ให้ตรง
  const [sharpnessMsg, setSharpnessMsg] = useState("กำลังเตรียมกล้อง...");

  const handleCapture = (image: string) => {
    setCroppedImage(image);
    setStatus("preview");
  };

  // --- ส่วนที่แก้ไข ---
  // รับค่ามา 2 ตัว (message และ newColor) เพื่ออัปเดต state ทั้งสอง
  const handleStatusChange = (message: string, newColor: "red" | "green") => {
    setSharpnessMsg(message);
    setFrameColor(newColor);
  };
  // --- สิ้นสุดส่วนที่แก้ไข ---

  return (
    <main>
      <VerifyPage />
    </main>
  );
}
