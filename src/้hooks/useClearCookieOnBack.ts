"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";

export function useClearCookieOnBack(keys: string[], paths: string | string[]) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // แปลง paths ให้เป็น array เสมอ
    const pathList = Array.isArray(paths) ? paths : [paths];

    // ถ้า path ปัจจุบันอยู่ใน list
    if (pathList.includes(pathname)) {
      const onPopState = () => {
        keys.forEach((key) => {
          Cookies.remove(key, { path: "/" });
          console.log(`[Cookie] Cleared on back: ${key}`);
        });
      };

      window.addEventListener("popstate", onPopState);
      return () => window.removeEventListener("popstate", onPopState);
    }
  }, [pathname, keys, paths]);
}
