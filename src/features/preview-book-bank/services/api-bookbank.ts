import axios from "axios";

type BookBankSubmitArgs = {
  files: File;
  kycRequestId: string;
  accountNo: string;
  accountNameThai: string;
  accountNameEng: string;
  branchName: string;
  bankName?: string;
  onProgress?: (pct: number) => void;
};

export async function BookBankSubmit({
  files,
  kycRequestId,
  onProgress,
  ...fields
}: BookBankSubmitArgs): Promise<void> {
  if (!kycRequestId) {
    throw new Error("Missing kycRequestId. Please sign in first.");
  }

  const formData = new FormData();
  formData.append("files", files);
  formData.append("kycRequestId", kycRequestId);

  Object.entries(fields).forEach(([key, value]) => {
    if (value != null && value !== "") {
      formData.append(key, String(value));
    } 
  });

  await axios.post("/submit/bookbank", formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
}
