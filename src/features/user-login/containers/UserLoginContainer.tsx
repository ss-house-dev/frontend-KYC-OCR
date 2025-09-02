"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { emailStore } from "@/lib/client/emailStore";
import UserLoginView from "../components/UserLoginView";

const EMAIL_RE = /.+@.+\..+/;

export default function UserLoginContainer() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = emailStore.get();
    if (saved) setEmail(saved);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    emailStore.set(email);
    const next = search.get("next") || "/ocr"; // ไปหน้า OCR ต่อ
    router.replace(next);
  };

  return (
    <UserLoginView
      email={email}
      error={error}
      onEmailChange={setEmail}
      onSubmit={onSubmit}
    />
  );
}
