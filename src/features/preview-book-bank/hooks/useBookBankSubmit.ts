import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { BookBankSubmit } from "@/features/preview-book-bank/services/api-bookbank";

// ถ้ามี type จาก service ให้ import มาใช้ (จะชัวร์สุด)
// import type { BookBankSubmitArgs } from "@/features/preview-book-bank/services/api-bookbank";

// กำหนด payload ที่ "ต้อง" ได้จากหน้าฟอร์ม (ไม่ห่อ Partial)
type SubmitPayload = {
  file: File;
  kycRequestId: string;
  accountNo: string;
  accountNameThai: string;
  accountNameEng: string;
  branchName: string;
  bankName: string; // บังคับว่าต้องมี
};

// ตัวอย่าง mapping code -> bankName (ปรับตามของคุณ)
const BANK_NAME_MAP: Record<string, string> = {
  kbank: "KBANK",
  scb: "SCB",
  ktb: "KTB",
};

export function useBookBankSubmit() {
  const [progress, setProgress] = useState(0);

  // ระบุ generic ให้ชัด: <TReturn, TError, TVariables>
  const mutation = useMutation<void, AxiosError, SubmitPayload>({
    mutationKey: ["BookBankSubmit"],
    mutationFn: async (vars) => {
      const {
        file,
        kycRequestId,
        accountNo,
        accountNameThai,
        accountNameEng,
        branchName,
        bankName,
      } = vars;

      // ตรวจ runtime กันพลาด (กันเคส bankName ว่าง)
      if (!bankName) {
        throw new Error("bankName is required");
      }
      if (!accountNo) {
        throw new Error("accountNo is required");
      }
      if (!branchName) {
        throw new Error("branchName is required");
      }
      if (!accountNameThai) {
        throw new Error("accountNameThai is required");
      }

      const servicePayload = {
        file,
        kycRequestId,
        accountNo,
        accountNameThai,
        accountNameEng,
        branchName,
        bankName, 
        onProgress: (pct: number) => setProgress(pct),
      };

      // debug log (ไม่แสดงไฟล์จริง)
      const { file: _f, onProgress: _cb, ...rest } = servicePayload;
      console.log("Service payload:", {
        ...rest,
        file: `File(${file.name}, ${file.type}, ${file.size})`,
      });

      await BookBankSubmit(servicePayload);
    },
    onSettled: () => setProgress(0),
  });

  return {
    submit: mutation.mutateAsync,
    isUploading: mutation.isPending,
    progress,
    error: mutation.error as AxiosError | null,
    reset: mutation.reset,
  };
}
