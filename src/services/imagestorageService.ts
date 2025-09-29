import axios from "axios";

export type StorageResponse = {
  objectName: string;
  originalName: string;
  size: number;
  contentType: string;
};

export async function imageStorage(
  file: File,
  onProgress?: (pct: number) => void
): Promise<StorageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post("/storage/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (!onProgress) return;
      const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
      onProgress(pct);
    },
  });
  return res.data;
}

export async function getFileFromStorage(
  filename: string
): Promise<Blob> {
  const res = await axios.get(`/storage/files/${encodeURIComponent(filename)}`, {
    responseType: "blob", // เพื่อให้ได้เป็นไฟล์
  });
  return res.data;
}