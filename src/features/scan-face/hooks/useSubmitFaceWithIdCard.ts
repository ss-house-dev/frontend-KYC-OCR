import { useState, useCallback } from "react";
import { captureStore } from "../state/captureStore";
import { getFileFromStorage } from "@/services/imagestorageService";
import { loadFormFromCookie } from "@/lib/utils/index";
import { FaceSubmit } from "../services/api-face";
import { cropFaceFromIdCard } from "@/lib/utils/index";

const COOKIE_IMAGE_KEY = "idcard_uploaded_objectName";

export function useSubmitFaceWithIdCard(kycRequestId: string) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // 1. ดึงข้อมูลจาก captureStore
      const state = captureStore.get();
      const allMovements = Object.values(state.movements).flat();

      console.log("📦 Preparing submission:", {
        movementCount: allMovements.length,
        hasStep1Sample: !!state.step1Sample,
        kycRequestId,
      });

      // ตรวจสอบข้อมูลพื้นฐาน
      if (allMovements.length < 5) {
        throw new Error(`Not enough movement images: ${allMovements.length}/5`);
      }
      if (!state.step1Sample) {
        throw new Error("Missing step1Sample image");
      }
      if (!kycRequestId) {
        throw new Error("Missing kycRequestId");
      }

      // 2. แปลง blob URLs เป็น Files (จาก face scan)
      const blobToFile = async (url: string, filename: string): Promise<File> => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
      };

      console.log("🔄 Converting movement images to files...");
      const movementFiles = await Promise.all(
        allMovements.map((url, i) => blobToFile(url, `movement_${i}.jpg`))
      );
      console.log(`✅ Converted ${movementFiles.length} movement files`);

      // 3. ดึงรูปบัตรประชาชนจาก storage
      console.log("🔍 Loading ID card image from storage...");
      const savedImage = loadFormFromCookie<{ objectName: string }>(COOKIE_IMAGE_KEY);
      
      if (!savedImage?.objectName) {
        throw new Error("ID card image not found in cookie");
      }

      const idCardBlob = await getFileFromStorage(savedImage.objectName);
      console.log("✅ ID card image loaded:", {
        size: idCardBlob.size,
        type: idCardBlob.type,
      });

      // 4. แปลง Blob เป็น Data URL เพื่อ crop
      const blobToDataUrl = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const idCardDataUrl = await blobToDataUrl(idCardBlob);
      console.log("🖼️ ID card converted to data URL");

      // 5. Crop หน้าจากบัตรประชาชน
      console.log("✂️ Cropping face from ID card...");
      const croppedFaceFile = await cropFaceFromIdCard(idCardDataUrl);
      console.log("✅ Face cropped:", {
        name: croppedFaceFile.name,
        size: croppedFaceFile.size,
        type: croppedFaceFile.type,
      });

      // 6. ส่งข้อมูลทั้งหมดไป API
      console.log("📤 Submitting to API...");
      const response = await FaceSubmit({
        files: movementFiles,       
        file: croppedFaceFile,       
        kycRequestId,
        onProgress: setProgress,
      });

      console.log("✅ Submission successful:", response);
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Submission failed:", errorMsg, err);
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [kycRequestId]);

  return {
    submit,
    loading,
    progress,
    error,
  };
}