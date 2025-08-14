import axios from "axios";

export type OcrResponse = {
  idNumber?: string;
  firstNameThai?: string;
  lastNameThai?: string;
  birthDateThai?: string;
  issueDateThai?: string;
  expiryDateThai?: string;
  address?: string;
  titleThai?: string;
  errors: { field: string; message: string }[];
};

export async function uploadIdCardOcr(
  file: File,
  onProgress?: (pct: number) => void
): Promise<OcrResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post("/ocr/idcard", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (!onProgress) return;
      const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
      onProgress(pct);
    },
  });
  return res.data;
}
