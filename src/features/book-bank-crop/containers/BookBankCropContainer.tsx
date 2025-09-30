"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BookBankCropper, {
  BookBankCropperRef,
} from "../components/BookBankCropper";
import CropHeader from "../components/CropHeader";
import CropGuideDialog from "../components/CropGuideDialog";
import CropFooter from "../components/CropFooter";
import { useToast } from "@/components/ui/use-toast";
import { clearFormCookie } from "@/lib/utils/index";

function getItemSafe(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItemSafe(key: string, val: string) {
  try {
    sessionStorage.setItem(key, val);
  } catch {}
}

const BookBankCropContainer = () => {
  const router = useRouter();
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const cropperApiRef = useRef<BookBankCropperRef>(null);
  const { toast } = useToast();

  useEffect(() => {
    const s = getItemSafe("capturedBookBankImage");
    if (!s) {
      toast({
        title: "ไม่พบรูปภาพ",
        description: "กรุณาอัปโหลดภาพสมุดบัญชีอีกครั้ง",
        variant: "destructive",
        duration: 4000,
      });
      router.replace("/book-bank-accept");
      return;
    }
    setImgSrc(s);
  }, [router, toast]);

  const onConfirm = useCallback(() => {
    const dataUrl = cropperApiRef.current?.getCroppedDataURL();
    if (!dataUrl) return;
    setItemSafe("croppedBookBankImage", dataUrl);
    const v = Date.now().toString();
    router.push(`/preview-book-bank?v=${v}`);
  }, [router]);

  const onRetake = useCallback(() => {
    setItemSafe("croppedBookBankImage", "");

    // เคลียร์ cookie ที่เกี่ยวข้อง เช่น capturedBookBankImage
    clearFormCookie("capturedBookBankImage");
    clearFormCookie("croppedBookBankImage");
    router.back();
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-[480px] h-[100dvh] bg-white flex flex-col">
      <CropHeader title="Crop Book Bank" onBack={() => router.back()} />
      <div className="relative grow bg-neutral-900">
        {imgSrc && (
          <BookBankCropper ref={cropperApiRef} image={imgSrc} aspect={3 / 4} />
        )}
        {showGuide && <CropGuideDialog onClose={() => setShowGuide(false)} />}
      </div>
      <CropFooter onRetake={onRetake} onConfirm={onConfirm} />
    </div>
  );
};

export default BookBankCropContainer;
