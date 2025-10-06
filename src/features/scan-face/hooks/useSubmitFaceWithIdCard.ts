"use client";

import { useState, useCallback } from "react";
import { captureStore } from "../state/captureStore";
import { FaceSubmit } from "../services/api-face";

export function useSubmitFaceWithIdCard(kycRequestId: string) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // 1) ดึงข้อมูลจาก captureStore
      const state = captureStore.get();
      const allMovements = Object.values(state.movements).flat();

      console.log("📦 Preparing submission:", {
        movementCount: allMovements.length,
        hasStep1Sample: !!state.step1Sample,
        kycRequestId,
      });

      if (allMovements.length < 5) {
        throw new Error(`Not enough movement images: ${allMovements.length}/5`);
      }
      if (!state.step1Sample) {
        throw new Error("Missing step1Sample image");
      }
      if (!kycRequestId) {
        throw new Error("Missing kycRequestId");
      }

      // 2) แปลง blob URLs -> Files (จาก face scan)
      const blobUrlToFile = async (url: string, filename: string): Promise<File> => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type || "image/jpeg" });
      };

      console.log("🔄 Converting movement images to files...");
      const movementFiles = await Promise.all(
        allMovements.map((url, i) => blobUrlToFile(url, `movement_${i}.jpg`))
      );
      console.log(`✅ Converted ${movementFiles.length} movement files`);

      // 3) ดึงรูปใบหน้าที่ครอปไว้จาก sessionStorage
      const faceDataUrl = typeof window !== "undefined"
        ? sessionStorage.getItem("capturedFaceImage")
        : null;

      if (!faceDataUrl) {
        throw new Error("capturedFaceImage not found in sessionStorage");
      }

      // 4) แปลง Data URL -> File
      const dataUrlToFile = (dataUrl: string, filename = "captured_face.jpg"): File => {
        // dataUrl รูปแบบ: data:image/jpeg;base64,xxxx
        const arr = dataUrl.split(",");
        if (arr.length < 2) throw new Error("Invalid data URL");
        const mimeMatch = arr[0].match(/data:(.*?);base64/);
        const mime = mimeMatch?.[1] || "image/jpeg";
        const bstr = atob(arr[1]);
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
        return new File([u8arr], filename, { type: mime });
      };

      const croppedFaceFile = dataUrlToFile(faceDataUrl, "captured_face.jpg");
      console.log("✅ Using capturedFaceImage from sessionStorage:", {
        name: croppedFaceFile.name,
        size: croppedFaceFile.size,
        type: croppedFaceFile.type,
      });

      // (ถ้าต้องการ debug ตำแหน่งหน้าเดิม)
      try {
        const rectRaw = sessionStorage.getItem("capturedFaceRect");
        if (rectRaw) {
          const rect = JSON.parse(rectRaw);
          console.log("ℹ️ capturedFaceRect:", rect);
        }
      } catch {
        /* noop */
      }

      // 5) ส่งทั้งหมดไป API
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
