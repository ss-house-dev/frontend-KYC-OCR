"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";

export function useClearCookieOnBack(keys: string[], paths: string | string[]) {
  const pathname = usePathname();
  const pathListRef = useRef<string[]>(Array.isArray(paths) ? paths : [paths]);
  const latestPathRef = useRef<string | null>(null);

  // จำ path ล่าสุดไว้ใน ref เสมอ (ไม่มีการ add/remove listener ซ้ำ)
  useEffect(() => {
    latestPathRef.current = pathname ?? null;
  }, [pathname]);

  useEffect(() => {
    const onPopState = () => {
      const cur = latestPathRef.current;
      if (cur && pathListRef.current.includes(cur)) {
        keys.forEach((k) => {
          removeCookieAllScopes(k);
          console.log(`[Cookie] Cleared on back: ${k}`);
        });
      }
    };

    // เผื่อบาง browser ใช้ BFCache / timing แปลก ๆ
    const onPageHide = (ev: PageTransitionEvent) => {
      if (ev.persisted) {
        // bfcache path restore case
      }
      const cur = latestPathRef.current;
      if (cur && pathListRef.current.includes(cur)) {
        keys.forEach((k) => {
          removeCookieAllScopes(k);
          console.log(`[Cookie] Cleared on pagehide: ${k}`);
        });
      }
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [keys]); // paths ถูกเก็บใน ref แล้ว
}

function removeCookieAllScopes(name: string) {
  Cookies.remove(name);
  Cookies.remove(name, { path: "/" });
  try {
    const p = window.location.pathname || "/";
    let cur = p;
    while (true) {
      Cookies.remove(name, { path: cur });
      const idx = cur.lastIndexOf("/");
      if (idx <= 0) { Cookies.remove(name, { path: "/" }); break; }
      cur = cur.slice(0, idx);
    }
  } catch {}
  try {
    const host = window.location.hostname;
    const dotHost = host.startsWith(".") ? host : "." + host;
    Cookies.remove(name, { path: "/", domain: host });
    Cookies.remove(name, { path: "/", domain: dotHost });
  } catch {}
}
