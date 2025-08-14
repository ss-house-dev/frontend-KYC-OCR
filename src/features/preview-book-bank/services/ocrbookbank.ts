import axios from "axios";

export type OcrResponse = {
  accountNumber?: string;
  accountNameThai?: string;
  branchNameThai?: string;
};

export async function uploadBookBankOcr(
  file: File,
  onProgress?: (pct: number) => void
): Promise<OcrResponse> {
  const formData = new FormData();
  formData.append("file", file);

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
