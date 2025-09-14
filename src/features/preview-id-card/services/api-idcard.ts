import axios from "axios";

type IdcardSubmitArgs = {
  file: File;
  kycRequestId: string;
  idNumber: string;
  idNumberFormatted: string;
  titleNameThai: string;
  titleNameEng?: string;
  firstNameThai: string;
  lastNameThai: string;
  firstNameEng: string;
  lastNameEng: string;
  dateOfBirth: string;
  dateOfIssue: string;
  dateOfExpiry: string;
  address: string;
  onProgress?: (pct: number) => void;
};

export async function IdcardSubmit({
  file,
  kycRequestId,
  onProgress,
  ...fields
}: IdcardSubmitArgs): Promise<void> {
  if (!kycRequestId) {
    throw new Error("Missing kycRequestId. Please sign in first.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("kycRequestId", kycRequestId);

  //titleNameEng เป็น null ได้ เพราะไม่ได้มีการรับ title เป็นภาษาอังกฤษจาก user แต่api มีการรับfeild นี้ (อาจเพิ่มการmapกับtitleThaiในอนาคต)
  Object.entries(fields).forEach(([key, value]) => {
  if (key === "titleNameEng" && value == null) {
    formData.append("titleNameEng", "null"); 
  } else if (value != null && value !== "") {
    formData.append(key, String(value));
  }
});

  await axios.post("/submit/idcard", formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
}
