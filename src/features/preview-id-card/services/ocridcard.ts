import axios from "axios";

export type OcrResponse = {
  idNumber?: string;
  idNumberFormatted?: string;
  firstNameThai?: string;
  lastNameThai?: string;
  birthDateThai?: string;
  issueDateThai?: string;
  expiryDateThai?: string;
  address?: string;
  titleThai?: string;
  firstNameEng?: string;
  lastNameEng?: string;
  errors: { field: string; message: string }[];
};

export async function uploadIdCardOcr(
  file: File,
  kycRequestId?: string,
  onProgress?: (pct: number) => void
): Promise<OcrResponse> {
  if (!kycRequestId) {
    throw new Error("Missing kycRequestId. Please sign in first.");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kycRequestId", kycRequestId);

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
