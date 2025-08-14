"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VerifyBookBankView from "../components/VerifyBookBankView";

export default function VerifyBookBankContainer() {
  const [isChecked, setIsChecked] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

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
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await fileToDataURL(file);
      setPreviewSrc(dataUrl); 
      setSheetOpen(false);
    }
    e.target.value = ""; 
  };

  const cancelPreview = () => {
    setPreviewSrc(null);
    setSheetOpen(true); 
  };

  const usePhoto = () => {
    if (!previewSrc) return;
    sessionStorage.setItem("capturedBookBankImage", previewSrc);
    sessionStorage.setItem("imageSource", "upload");
    router.push("/preview-book-bank");
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
        accept="image/*"
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
                  Upload Photo
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  Take a picture or choose from gallery.
                </div>
              </div>
              <div className="border-t border-gray-200" />
              <button
                onClick={pickCamera}
                className="w-full px-5 py-3 text-[#007AFF] text-center hover:bg-gray-50"
              >
                Take a Picture
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

      {previewSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white overflow-hidden">
            <div className="max-h-[70vh] bg-black flex items-center justify-center">
              <img
                src={previewSrc}
                alt="Preview"
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
            <div className="flex gap-3 p-4">
              <button
                onClick={cancelPreview}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Retake / Choose again
              </button>
              <button
                onClick={usePhoto}
                className="flex-1 py-2 rounded-lg bg-[#007AFF] text-white hover:opacity-90"
              >
                Use Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
