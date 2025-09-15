"use client";

import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { uploadIdCardOcr, type OcrResponse } from "../services/ocridcard";
import { base64StringToFile } from "@/lib/utils/index";

type OriginalNames = {
  firstNameThai: string;
  lastNameThai: string;
  firstNameEng: string;
  lastNameEng: string;
};

type UseIdCardOcrArgs<TForm extends FieldValues> = {
  kycRequestId?: string;
  form: UseFormReturn<TForm>;
  buildResetValues: (d: OcrResponse) => Partial<TForm>;
  requiredFields?: Array<Path<TForm>>;
  onSetOriginal?: Dispatch<SetStateAction<OriginalNames>>;
  sessionImageKey?: string;
  redirects?: { noSession?: string; noImage?: string };
  onError?: (err: unknown) => void;
};

export function useIdCardOcr<TForm extends FieldValues>({
  kycRequestId,
  form,
  buildResetValues,
  requiredFields = [],
  onSetOriginal,
  sessionImageKey = "capturedIdCardImage",
  redirects = { noSession: "/user-login", noImage: "/" },
  onError,
}: UseIdCardOcrArgs<TForm>) {
  const router = useRouter();
  const { reset, trigger, setError } = form;
  const [loadingProgress, setLoadingProgress] = useState(0);

  const mutation = useMutation({
    mutationKey: ["uploadIdCardOcr", kycRequestId],
    mutationFn: (file: File) => {
      if (!kycRequestId) throw new Error("Missing kycRequestId. Please sign in first.");
      return uploadIdCardOcr(file, kycRequestId, setLoadingProgress);
    },
    onSuccess: async (d: OcrResponse) => {
      onSetOriginal?.({
      firstNameThai: d.firstNameThai ?? "",
      lastNameThai: d.lastNameThai ?? "",
      firstNameEng: d.firstNameEng ?? "",
      lastNameEng: d.lastNameEng ?? "",
      });

      reset(buildResetValues(d) as any);

      setTimeout(async () => {
        if (requiredFields.length) {
          for (const f of requiredFields) await trigger(f);
        }
        (d.errors || []).forEach((err) => {
          setError(err.field as Path<TForm>, {
            type: "manual",
            message: err.message,
          });
        });
      }, 100);
    },
    onError: (err) => {
      console.error("OCR upload failed:", err);
      onError?.(err);
    },
  });

  const startFromSession = useCallback(() => {
    if (!kycRequestId) {
      router.replace(redirects.noSession || "/user-login");
      return;
    }
    const imageSrc = sessionStorage.getItem(sessionImageKey);
    if (!imageSrc) {
      router.replace(redirects.noImage || "/");
      return;
    }
    try {
      const file = base64StringToFile(imageSrc, "idcard_from_session.jpg");
      mutation.mutate(file);
    } catch (e) {
      onError?.(e);
    }
  }, [kycRequestId, sessionImageKey, router, redirects.noImage, redirects.noSession, mutation, onError]);

  return {
    uploadFile: mutation.mutate,
    startFromSession,
    isUploading: mutation.isPending,
    loadingProgress,
  };
}
