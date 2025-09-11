import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { IdcardSubmit } from "@/features/preview-id-card/services/api-id-card"; 

type SubmitPayload = {
  file: File;
  kycRequestId: string;
  fields: Partial<{
    idNumber: string;
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
    laserId: string;
  }>;
};

export function useIdcardSubmit() {
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationKey: ["IdcardSubmit"],
    mutationFn: async ({ file, kycRequestId, fields }: SubmitPayload) => {
      const servicePayload = {
        file,
        kycRequestId,
        idNumber: fields.idNumber || "",
        titleNameThai: fields.titleNameThai || "",
        titleNameEng: fields.titleNameEng,
        firstNameThai: fields.firstNameThai || "",
        lastNameThai: fields.lastNameThai || "",
        firstNameEng: fields.firstNameEng || "",
        lastNameEng: fields.lastNameEng || "",
        dateOfBirth: fields.dateOfBirth || "",
        dateOfIssue: fields.dateOfIssue || "",
        dateOfExpiry: fields.dateOfExpiry || "",
        address: fields.address || "",
        onProgress: (pct: number) => setProgress(pct),
      };

      const { file: _, onProgress: __, ...debugPayload } = servicePayload;
      console.log("Service payload:", {
        ...debugPayload,
        file: `File(${file.name}, ${file.type}, ${file.size})`,
      });

      await IdcardSubmit(servicePayload);
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