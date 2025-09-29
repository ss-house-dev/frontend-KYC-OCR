// utils/imageStorage.ts - จัดการรูปภาพแบบ SSR-safe

import { saveFormToCookie, loadFormFromCookie, clearFormCookie } from "./utils/index";

const IMAGE_COOKIE_KEY = "captured_id_card_image";

// ✅ บันทึกรูปแบบ hybrid: sessionStorage หลัก, cookie เป็น fallback metadata
export function saveImageToCookie(base64Image: string) {
  try {
    console.log("[ImageStorage] Saving image, size:", base64Image.length);
    
    // ✅ Primary: sessionStorage (ไม่มี size limit)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("capturedIdCardImage", base64Image);
      sessionStorage.setItem("imageSource", "camera");
      sessionStorage.setItem("imageTimestamp", Date.now().toString());
      console.log("[ImageStorage] Saved to sessionStorage successfully");
    }
    
    // ✅ Secondary: cookie เก็บ metadata + compressed thumbnail สำหรับ SSR
    const compressedImage = compressImageForCookie(base64Image);
    const imageMetadata = {
      hasImage: true,
      timestamp: Date.now(),
      source: "camera",
      originalSize: base64Image.length,
      thumbnail: compressedImage // compressed ขนาดเล็กมาก
    };
    
    saveFormToCookie(IMAGE_COOKIE_KEY, imageMetadata);
    console.log("[ImageStorage] Saved metadata to cookie");
  } catch (error) {
    console.error("[ImageStorage] Failed to save:", error);
  }
}

// ✅ โหลดรูป: sessionStorage หลัก, cookie เป็น fallback
export function loadImageFromCookie(): string | null {
  // ✅ Primary: sessionStorage
  if (typeof window !== "undefined") {
    const sessionImage = sessionStorage.getItem("capturedIdCardImage");
    if (sessionImage) {
      console.log("[ImageStorage] Loaded from sessionStorage");
      return sessionImage;
    }
  }
  
  // ✅ Fallback: cookie metadata + thumbnail
  try {
    const metadata = loadFormFromCookie<{
      hasImage: boolean;
      timestamp: number;
      source: string;
      thumbnail?: string;
    }>(IMAGE_COOKIE_KEY);
    
    if (metadata && metadata.hasImage && metadata.thumbnail) {
      console.log("[ImageStorage] Loaded thumbnail from cookie (fallback)");
      return metadata.thumbnail;
    }
  } catch (error) {
    console.error("[ImageStorage] Failed to load from cookie:", error);
  }
  
  return null;
}

// ✅ เช็คว่ามีรูปหรือไม่ (SSR-safe)
export function hasStoredImage(): boolean {
  // Check sessionStorage first
  if (typeof window !== "undefined") {
    const sessionImage = sessionStorage.getItem("capturedIdCardImage");
    if (sessionImage) return true;
  }
  
  // Check cookie metadata
  try {
    const metadata = loadFormFromCookie<{
      hasImage: boolean;
    }>(IMAGE_COOKIE_KEY);
    return !!(metadata && metadata.hasImage);
  } catch (error) {
    return false;
  }
}

// ✅ ล้างรูปทั้งหมด
export function clearCapturedImage() {
  console.log("[ImageStorage] Clearing captured image");
  clearFormCookie(IMAGE_COOKIE_KEY);
  
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("capturedIdCardImage");
    sessionStorage.removeItem("imageSource");
    sessionStorage.removeItem("imageTimestamp");
  }
}

// ✅ บีบอัดรูปให้เหมาะสมกับ cookie (~2KB)
function compressImageForCookie(base64: string): string {
  if (typeof window === "undefined") return "";
  
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    return new Promise<string>((resolve) => {
      img.onload = () => {
        // ขนาดเล็กมากสำหรับ thumbnail
        const maxSize = 200; // 200px max
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        // คุณภาพต่ำมากเพื่อลด size
        const compressed = canvas.toDataURL("image/jpeg", 0.3);
        
        console.log("[ImageStorage] Thumbnail compressed:", base64.length, "→", compressed.length);
        resolve(compressed);
      };
      
      img.onerror = () => resolve("");
      img.src = base64;
    }) as any;
  } catch (error) {
    console.error("[ImageStorage] Compression failed:", error);
    return "";
  }
}