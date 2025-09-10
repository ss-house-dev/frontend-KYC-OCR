"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import UserLoginView from "../components/UserLoginView";
import { signIn } from "next-auth/react";
import { usePersistedForm } from "@/lib/client/usePersistedForm";

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
  const [isPending, setIsPending] = useState(false);

  const form = useForm<Inputs>({
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
    setIsPending(true);
    try {
      const res = await signIn("credentials", {
        email,
        companyId: "66d5c2a9f5f0a3e2b82f3a19",
        callbackUrl,  
      });

      if (!res || !res.ok) {
        console.error("Login failed", res?.error);
        return;
      }

      const next = search.get("next") || "/id-accept";
      router.replace(next);
    } catch (e) {
      console.error("Login error", e);
    } finally {
      setIsPending(false);
    }
  };

  return (
      <UserLoginView
        errors={errors}
        handleSubmit={handleSubmit}
        register={register as any}
        onSubmit={onSubmit}
      />
  );
}
