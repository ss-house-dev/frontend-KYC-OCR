"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePersistedForm } from "@/lib/client/usePersistedForm";
import { calculateSimilarity } from "@/lib/utils/index";
import FormIdCard from "../components/FormIdCard";
import AlertPopUp from "@/components/AlertPopUp";
import { idCardFormSchema, IdCardFormData } from "./../schemas/idcard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIdCardOcr } from "@/features/preview-id-card/hooks/useIdCardOcr";
import { useCanSubmit } from "../hooks/useCanSubmit";
import { useIdcardSubmit } from "../hooks/useIdcardSubmit";

const defaultFormValues: IdCardFormData = {
  idNumber: "",
  titleThai: "",
  issueDateThai: "",
  expiryDateThai: "",
  firstNameThai: "",
  lastNameThai: "",
  firstNameEng: "",
  lastNameEng: "",
  birthDateThai: "",
  address: "",
  laserId: "",
};

export default function VerifyIdentityScreen() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingData, setPendingData] = useState<IdCardFormData | null>(null);
  const { submit, isUploading, progress, error } = useIdcardSubmit();
  const [originalData, setOriginalData] = useState({
    firstNameThai: "",
    lastNameThai: "",
    firstNameEng: "",
    lastNameEng: "",
  });

  const { data: session, status } = useSession();
  const kycRequestId = session?.kycRequestId;

  const form = useForm<IdCardFormData>({
    resolver: zodResolver(idCardFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { errors, isValid },
    watch,
    control,
  } = form;

  usePersistedForm<IdCardFormData>(form, "id-accept:form", 30, ["errors"]);

  const ocr = useIdCardOcr<IdCardFormData>({
    kycRequestId,
    form,
    onSetOriginal: setOriginalData,
    buildResetValues: (d) => ({
      idNumber: d.idNumber ?? "",
      firstNameThai: d.firstNameThai ?? "",
      lastNameThai: d.lastNameThai ?? "",
      firstNameEng: d.firstNameEng ?? "",
      lastNameEng: d.lastNameEng ?? "",
      birthDateThai: d.birthDateThai ?? "",
      issueDateThai: d.issueDateThai ?? "",
      expiryDateThai: d.expiryDateThai ?? "",
      address: d.address ?? "",
      titleThai: d.titleThai ?? "",
    }),
    requiredFields: [
      "titleThai",
      "firstNameThai",
      "lastNameThai",
      "firstNameEng",
      "lastNameEng",
      "idNumber",
      "birthDateThai",
      "issueDateThai",
      "expiryDateThai",
      "address",
    ],
    onError: (err) => {
      console.error(err);
      alert(err instanceof Error ? err.message : "Upload failed");
    },
  });

  useEffect(() => {
    if (status !== "loading") {
      ocr.startFromSession();
    }
  }, [status]);

  const canSubmit = useCanSubmit<IdCardFormData>(watch, errors, {
    required: [
      "idNumber",
      "issueDateThai",
      "expiryDateThai",
      "birthDateThai",
      "titleThai",
      "firstNameThai",
      "lastNameThai",
      "firstNameEng",
      "lastNameEng",
      "address",
      "laserId",
    ],
  });

  const onSubmit = async (data: IdCardFormData) => {
    const firstNameSimilarity = calculateSimilarity(
      originalData.firstNameThai,
      data.firstNameThai
    );
    const lastNameSimilarity = calculateSimilarity(
      originalData.lastNameThai,
      data.lastNameThai
    );
    const firstNameEngSimilarity = calculateSimilarity(
      originalData.firstNameEng,
      data.firstNameEng
    );
    const lastNameEngSimilarity = calculateSimilarity(
      originalData.lastNameEng,
      data.lastNameEng
    );

    const overallSimilarityThai =
      (firstNameSimilarity + lastNameSimilarity) / 2;
    const overallSimilarityEng =
      (firstNameEngSimilarity + lastNameEngSimilarity) / 2;

    if (overallSimilarityThai < 60 || overallSimilarityEng < 60) {
      setPendingData(data);
      setShowDialog(true);
      return;
    }

    try {
      const captured =
        typeof window !== "undefined"
          ? sessionStorage.getItem("capturedIdCardImage")
          : null;
      if (!captured) throw new Error("Missing captured ID card image file");

      const file = await (async () => {
        const res = await fetch(captured);
        const blob = await res.blob();
        return new File([blob], "idcard.jpg", {
          type: blob.type || "image/jpeg",
        });
      })();

      await submit({
        file,
        kycRequestId: kycRequestId!,
        fields: {
          idNumber: data.idNumber,
          firstNameThai: data.firstNameThai,
          lastNameThai: data.lastNameThai,
          firstNameEng: data.firstNameEng,
          lastNameEng: data.lastNameEng,
          dateOfBirth: data.birthDateThai,
          dateOfIssue: data.issueDateThai,
          dateOfExpiry: data.expiryDateThai,
          address: data.address,
          titleNameThai: data.titleThai,
          laserId: data.laserId,
        },
      });
      console.log("Submit successful");
      router.push("/face-accept");
    } catch (err) {
      console.error(err);
      // alert(err instanceof Error ? err.message : "Submit failed");
    }
  };

  return (
    <>
      <FormIdCard
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        control={control}
        errors={errors}
        watch={watch}
        canSubmit={canSubmit}
        capturedImage={
          typeof window !== "undefined"
            ? sessionStorage.getItem("capturedIdCardImage")
            : null
        }
        isValid={isValid}
        isLoading={ocr.isUploading}
        loadingProgress={ocr.loadingProgress}
      />

      <AlertPopUp
        isOpen={showDialog}
        title="Edited Name Doesn’t Match"
        message="Your edited name is very different the extracted name, Please correct it to continue."
        onRetry={() => {
          setShowDialog(false);
          setPendingData(null);
        }}
      />
    </>
  );
}
