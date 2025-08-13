"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function GetStartedPicker({
  isChecked,
  onCapture,
}: {
  isChecked: boolean;
  onCapture: (img: string) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const openSheet = () => { if (isChecked) setSheetOpen(true); };
  const closeSheet = () => setSheetOpen(false);

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

  const pickCamera = () => cameraInputRef.current?.click();
  const pickGallery = () => galleryInputRef.current?.click();

  const cancelPreview = () => {
    setPreviewSrc(null);
    setSheetOpen(true);
  };

  const usePhoto = () => {
    if (!previewSrc) return;
    onCapture(previewSrc);
    sessionStorage.setItem("capturedIdCardImage", previewSrc);
    sessionStorage.setItem("imageSource", "upload");
    router.push("/preview-id-card");
  };

  return (
    <>
    
      <button
        onClick={openSheet}
        disabled={!isChecked}
        className={`w-full py-3 rounded-lg text-white text-base transition-colors duration-300 ${
          isChecked
            ? "bg-gradient-to-b from-[#1F4293] to-[#246AEC] hover:from-[#246AEC] hover:to-[#1F4293]"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Get Started
      </button>

      {/* hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/่jpg"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Action Sheet */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={closeSheet}
        >
          <div className="w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl bg-white shadow">
              <div className="px-5 pt-4 pb-2 text-center">
                <div className="text-sm font-semibold text-gray-500">A Short Title is Best</div>
                <div className="mt-1 text-sm text-gray-400">
                  A message should be a short, complete sentence.
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

      {/* Preview Modal */}
      {previewSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white overflow-hidden">
            <div className="max-h-[70vh] bg-black flex items-center justify-center">
              <img src={previewSrc} alt="Preview" className="max-h-[70vh] w-full object-contain" />
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