import { useState, useCallback } from "react";
import { captureStore } from "../state/captureStore";
import { FaceSubmit } from "../services/api-face";

// 🔑 key ใน sessionStorage ที่ตั้งไว้ตอนสแกนบัตร
const SESSION_FACE_KEY = "capturedFaceImage";

function dataURLtoFile(dataUrl: string, filename: string): File {
  // dataUrl format: "data:<mime>;base64,<data>"
  const arr = dataUrl.split(",");
  if (arr.length < 2) throw new Error("Invalid data URL");
  const mimeMatch = arr[0].match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

export function useSubmitFaceWithIdCard(kycRequestId: string) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // 1) ดึงข้อมูล movement จาก captureStore
      const state = captureStore.get();
      const allMovements = Object.values(state.movements).flat();

      if (allMovements.length < 3) {
        throw new Error(`Not enough movement images: ${allMovements.length}/4`);
      }
      if (!kycRequestId) {
        throw new Error("Missing kycRequestId");
      }

      // 2) เอา face ที่ครอปแล้วจาก sessionStorage
      const faceDataUrl = sessionStorage.getItem(SESSION_FACE_KEY);
      if (!faceDataUrl) {
        throw new Error(
          "Missing capturedFaceImage. Please rescan your ID card and ensure face is captured."
        );
      }

      // 3) แปลง movement blob URLs → Files
      const blobToFile = async (url: string, filename: string): Promise<File> => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type || "image/jpeg" });
      };
      const movementFiles = await Promise.all(
        allMovements.map((url, i) => blobToFile(url, `movement_${i}.jpg`))
      );

      // 4) แปลง face dataURL → File (ไม่ครอปซ้ำ)
      const croppedFaceFile = dataURLtoFile(faceDataUrl, "face-cropped.jpg");

      // 5) ส่งข้อมูลทั้งหมดไป API
      const response = await FaceSubmit({
        files: movementFiles,   // movement frames
        file: croppedFaceFile,  // face ที่ครอปไว้แล้ว
        kycRequestId,
        onProgress: setProgress,
      });

      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Submission failed:", msg, err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [kycRequestId]);

  return { submit, loading, progress, error };
}
