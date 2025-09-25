"use client";

import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { uploadBookBankOcr, type OcrResponse } from "../services";
import { base64StringToFile } from "@/lib/utils/index";

type OriginalNames = {
  accountNameThai: string;
  accountNameEng: string;
};

type UseBookBankOcrArgs<TForm extends FieldValues> = {
  kycRequestId?: string;
  form: UseFormReturn<TForm>;
  buildResetValues: (d: OcrResponse) => Partial<TForm>;
  requiredFields?: Array<Path<TForm>>;
  onSetOriginal?: Dispatch<SetStateAction<OriginalNames>>;
  sessionImageKey?: string;
  redirects?: { noSession?: string; noImage?: string };
  onError?: (err: unknown) => void;
};

export function useBookBankOcr<TForm extends FieldValues>({
  kycRequestId,
  form,
  buildResetValues,
  requiredFields = [],
  onSetOriginal,
  sessionImageKey = "croppedBookBankImage",
  redirects = { noSession: "/user-login", noImage: "/book-bank-accept" },
  onError,
}: UseBookBankOcrArgs<TForm>) {
  const router = useRouter();
  const { reset, trigger, setError } = form;
  const [loadingProgress, setLoadingProgress] = useState(0);

  const mutation = useMutation({
    mutationKey: ["uploadBookBankOcr", kycRequestId],
    mutationFn: (file: File) => {
      if (!kycRequestId) throw new Error("Missing kycRequestId");
      return uploadBookBankOcr(file, kycRequestId, setLoadingProgress);
    },
    onSuccess: async (d: OcrResponse) => {
      console.log("[BookBank OCR] Raw response:", d);

      // ✅ validate response
      const required = ["branchName","accountNumber"];
      const missing = required.filter((k) => !d[k as keyof OcrResponse]);
      if (missing.length > 0) {
        onError?.(new Error("Missing fields: " + missing.join(", ")));
        return;
      }

      // ✅ set original
      onSetOriginal?.({
        accountNameThai: d.accountNameThai || "",
        accountNameEng: d.accountNameEng || "",
      });

      // ✅ reset form
      const resetValues = buildResetValues(d);
      reset(resetValues as any);

      // ✅ trigger validation + errors
      setTimeout(async () => {
        for (const f of requiredFields) await trigger(f);
        (d.errors || []).forEach((err) => {
          setError(err.field as Path<TForm>, {
            type: "manual",
            message: err.message,
          });
        });
      }, 100);
    },
    onError: (err) => {
      console.error("[BookBank OCR] upload failed:", err);
      onError?.(err);
    },
  });

  const startFromSession = useCallback(() => {
    if (!kycRequestId) {
      router.replace(redirects.noSession || "/user-login");
      return;
    }

    const dataUrl = sessionStorage.getItem(sessionImageKey);
    if (!dataUrl) {
      router.replace(redirects.noImage || "/book-bank-accept");
      return;
    }

    try {
      const file = base64StringToFile(dataUrl, "bookbank_from_session.jpg");
      mutation.mutate(file);
    } catch (e) {
      console.error("[BookBank OCR] Failed to create file:", e);
      onError?.(e);
    }
  }, [kycRequestId, sessionImageKey, router, redirects, mutation]);

  return {
    uploadFile: mutation.mutate,
    startFromSession,
    isUploading: mutation.isPending,
    loadingProgress,
  };
}
