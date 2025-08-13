import axios from "axios";

export type OcrResponse = {
  id_number?: string;
  first_name_th?: string;
  last_name_th?: string;
  date_of_birth_th?: string;
  issue_date_th?: string;
  expiry_date_th?: string;
  address?: string;
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
