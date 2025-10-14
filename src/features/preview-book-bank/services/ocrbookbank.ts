import axios from "axios";

export type OcrResponse = {
  accountNumber?: string;
  accountNameThai?: string;
  accountNameEng?: string;
  branchName?: string;
  errors: { field: string; message: string }[];
};

export async function uploadBookBankOcr(
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

  const res = await axios.post("/ocr/bookbank", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (!onProgress) return;
      const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
      onProgress(pct);
    },
  });
  return res.data;
}
