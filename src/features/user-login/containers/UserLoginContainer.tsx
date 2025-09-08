"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailStore } from "@/lib/client/emailStore";
import UserLoginView from "../components/UserLoginView";
import { useCreateKycRequest } from "../hooks/useCreateKycRequest";
import { kycStore } from "@/lib/client/kycStore";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "กรุณากรอกอีเมล" })
    .email({ message: "กรุณากรอกอีเมลให้ถูกต้อง" }),
});

type Inputs = z.infer<typeof schema>;

export default function UserLoginContainer() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useCreateKycRequest();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    const saved = emailStore.get();
    if (saved) setValue("email", saved, { shouldValidate: true });
  }, [setValue]);

  const onSubmit: SubmitHandler<Inputs> = async ({ email }) => {
    setError(null);
    try {
      const response = await mutateAsync({
        companyId: "66d5c2a9f5f0a3e2b82f3a19",
        email,
      });

      kycStore.set(response, "email_sent", 30);
      router.replace(search.get("next") || "/id-accept");
    } catch (e) {
      setError("ส่งคำขอล้มเหลว ลองใหม่อีกครั้ง");
    }
  };

  return (
    <UserLoginView
      error={error}
      errors={errors}
      handleSubmit={handleSubmit}
      register={register as any}
      onSubmit={onSubmit}
    />
  );
}
