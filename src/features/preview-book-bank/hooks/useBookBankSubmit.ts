import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { BookBankSubmit } from "@/features/preview-book-bank/services/api-bookbank";

type SubmitPayload = {
  file: File;
  kycRequestId: string;
  accountNo: string;
  accountNameThai: string;
  accountNameEng: string;
  branchName: string;
  bankName: string; 
};

export function useBookBankSubmit() {
  const [progress, setProgress] = useState(0);

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
