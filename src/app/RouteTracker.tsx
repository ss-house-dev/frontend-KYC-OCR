"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { persist } from "@/lib/client/persist";
import { useSession } from "next-auth/react";

export default function RouteTracker({ ttlMin = 30 }: { ttlMin?: number }) {
  const pathname = usePathname();
  const qs = useSearchParams();
  const { data: session } = useSession();
  const uid = (session?.user as any)?.id ?? "guest";
  const key = `persist:${uid}:lastRoute`;

  useEffect(() => {
    if (!pathname) return;
    const full = qs?.toString() ? `${pathname}?${qs}` : pathname;
    persist.set(key, full, ttlMin);
  }, [pathname, qs, key, ttlMin]);

  return null;
}
