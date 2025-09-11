"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VerifyBookBankView from "../components/VerifyBookBankView";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/webp",
  "image/jpg",
];

export default function VerifyBookBankContainer() {
  const [isChecked, setIsChecked] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const handleCheckboxChange = (checked: boolean) => setIsChecked(checked);
  const handleStartScan = () => {
    if (!isChecked) return;
    setSheetOpen(true);
  };

  const closeSheet = () => setSheetOpen(false);
  const pickCamera = () => cameraInputRef.current?.click();
  const pickGallery = () => galleryInputRef.current?.click();

  const fileToDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    try {
      if (!file) return;

      // validate: ไฟล์ใหญ่เกิน/ชนิดไม่รองรับ (iOS บางเครื่องให้ type = "" ก็ปล่อยผ่าน)
      if (file.size > MAX_FILE_SIZE) {
        alert("ไฟล์ใหญ่เกิน 10 MB กรุณาเลือกรูปที่เล็กกว่า 10 MB");
        return;
      }
      if (file.type && !ALLOWED_TYPES.includes(file.type)) {
        alert("รองรับเฉพาะ JPEG, PNG, HEIC/HEIF, JPG และ WEBP เท่านั้น");
        return;
      }

      const dataUrl = await fileToDataURL(file);

      // เก็บรูปใหม่ทับของเดิม
      try {
        sessionStorage.setItem("capturedBookBankImage", dataUrl);
        sessionStorage.setItem("imageSource", "upload");
      } catch (err) {
        console.warn("sessionStorage unavailable:", err);
        alert("เบราว์เซอร์ไม่อนุญาตให้เก็บรูปชั่วคราว");
        return;
      }

      setSheetOpen(false);

      // บังคับรี หน้า crop ทุกครั้ง
      const v = Date.now().toString();
      router.push(`/book-bank-crop?v=${v}`);
    } finally {
      // ให้เลือกไฟล์ชื่อเดิมซ้ำได้
      e.target.value = "";
    }
  };

  return (
    <>
      <VerifyBookBankView
        isChecked={isChecked}
        onCheckboxChange={handleCheckboxChange}
        onStartScan={handleStartScan}
        onBack={() => router.back()}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp,image/jpg"
        className="hidden"
        onChange={onFileChange}
      />

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={closeSheet}
        >
          <div
            className="w-full max-w-md space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-white shadow">
              <div className="px-5 pt-4 pb-2 text-center">
                <div className="text-sm font-semibold text-gray-500">
                  Upload Your Document Photo
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  Supports images up to 10 MB.
                </div>
              </div>
              <div className="border-t border-gray-200" />
              <button
                onClick={pickCamera}
                className="w-full px-5 py-3 text-[#007AFF] text-center hover:bg-gray-50"
              >
                Take a picture
              </button>
              <div className="border-t border-gray-200" />
              <button
                onClick={pickGallery}
                className="w-full px-5 py-3 text-[#007AFF] text-center hover:bg-gray-50"
              >
                Choose from gallery
              </button>
            </div>

            <button
              onClick={closeSheet}
              className="w-full rounded-2xl bg-white py-3 text-center text-[#007AFF] font-medium shadow hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
