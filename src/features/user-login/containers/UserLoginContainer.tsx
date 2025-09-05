"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { emailStore } from "@/lib/client/emailStore";
import UserLoginView from "../components/UserLoginView";
import { useForm, SubmitHandler } from "react-hook-form";

type Inputs = {
  email: string;
};

export default function UserLoginContainer() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Inputs>({
    defaultValues: { email: "" },
  });

  useEffect(() => {
    const saved = emailStore.get();
    if (saved) setValue("email", saved, { shouldValidate: true });
  }, [setValue]);

  const onSubmit: SubmitHandler<Inputs> = ({ email }) => {
    setError(null);

    emailStore.set(email);
    const next = search.get("next") || "/id-accept";
    router.replace(next);
  };

  return (
    <UserLoginView
      error={error}
      handleSubmit={handleSubmit}
      register={register as any}
      onSubmit={onSubmit}
    />
  );
}
