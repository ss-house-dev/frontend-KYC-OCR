import axios from "axios";

type FaceSubmitArgs = {
  files: File[];          
  file: File;             
  kycRequestId: string;
  onProgress?: (pct: number) => void;
};

export async function FaceSubmit({
  files,
  file,
  kycRequestId,
  onProgress,
}: FaceSubmitArgs): Promise<any> {
  console.log("=== FaceSubmit DEBUG ===");
  console.log("files count:", files.length);
  console.log("file:", file?.name, file?.size);
  console.log("kycRequestId:", kycRequestId);

  if (!kycRequestId) {
    throw new Error("Missing kycRequestId");
  }

  const formData = new FormData();
  
  // เพิ่มไฟล์
  files.forEach((f, idx) => {
    formData.append("files", f);
    console.log(`Appended files[${idx}]:`, f.name, f.size);
  });
  
  formData.append("file", file);
  console.log("Appended file:", file.name, file.size);
  
  // ⚠️ ลอง append kycRequestId ทั้ง 2 แบบ
  formData.append("kycRequestId", kycRequestId);
  
  // Debug FormData
  console.log("FormData entries:");
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`  ${key}:`, value.name, value.size);
    } else {
      console.log(`  ${key}:`, value);
    }
  }

  try {
    const response = await axios.post("/submit/face", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
      timeout: 30000,
    });

    console.log("✅ Response:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Axios error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }
    throw error;
  }
}