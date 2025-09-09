"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { persist } from "@/lib/client/persist";
import { useSession } from "next-auth/react";

export default function ResumeGate({ ttlMin = 30, enabled = true }: { ttlMin?: number; enabled?: boolean }) {
  const { data: session, status } = useSession();
  const uid = (session?.user as any)?.id ?? "guest";
  const key = `persist:${uid}:lastRoute`;
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    if (status !== "authenticated") return; 
    const last = persist.get<string>(key);
    if (last && last !== pathname) {
      router.replace(last);
    }
  }, [status]);

  return null;
}
