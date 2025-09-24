"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import UserLoginView from "../components/UserLoginView";
import { signIn } from "next-auth/react";
import { usePersistedForm } from "@/lib/client/usePersistedForm";
import type { LoginInputs } from "@/features/user-login/types/type.ts";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Please enter your email address." })
    .email({ message: "Please enter a valid email address." }),
});

type Inputs = z.infer<typeof schema>;

export default function UserLoginContainer() {
  const router = useRouter();
  const search = useSearchParams();
  const rawCb = search.get("callbackUrl");
  const callbackUrl = rawCb ?? "/id-accept";
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<LoginInputs>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  usePersistedForm<Inputs>(form, "auth:login", 30);

  const onSubmit: SubmitHandler<Inputs> = async ({ email }) => {
    setError(null);
    setIsPending(true);
    try {
      const res = await signIn("credentials", {
        email,
        companyId: process.env.NEXT_PUBLIC_COMPANY_ID,
        callbackUrl,
        redirect: false,
      });

      if (!res || !res.ok) {
        setError("Login failed. Please try again.");
        console.error("Login failed", res?.error);
        return;
      }

      const next = search.get("next") || "/id-accept";
      router.replace(next);
    } catch (e) {
      setError("Request failed. Please try again.");
      console.error("Login error", e);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <UserLoginView
      error={error}
      errors={errors}
      handleSubmit={handleSubmit}
      register={register} 
      onSubmit={onSubmit}
    />
  );
}
