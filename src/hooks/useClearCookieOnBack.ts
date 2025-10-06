"use client";

import { useEffect, useMemo, useRef } from "react";
import Cookies from "js-cookie";

export function useClearCookieOnBack(keys: string[], paths: string | string[]) {
  // freeze ค่า เพื่อไม่ให้ effect re-run จาก identity ใหม่ทุก render
  const keyList = useMemo(() => [...keys], [JSON.stringify(keys)]);
  const pathList = useMemo(
    () => (Array.isArray(paths) ? [...paths] : [paths]),
    [JSON.stringify(paths)]
  );

  const clearedOnceRef = useRef(false); // กันยิงซ้ำจาก pagehide/pageshow/popstate

  useEffect(() => {
    const shouldClearFor = (p: string) => pathList.includes(p);

    const clearAll = (reason: string) => {
      if (clearedOnceRef.current) return;
      clearedOnceRef.current = true;
      keyList.forEach((k) => {
        removeCookieAllScopes(k);
        console.log(`[Cookie] Cleared (${reason}): ${k}`);
      });
      // reset flag หลังจาก event loop หนึ่งรอบเพื่อให้ครั้งต่อไปยังทำงานได้
      setTimeout(() => (clearedOnceRef.current = false), 0);
    };

    const onPopState = () => {
      // ใน popstate ให้ใช้ location.pathname (เป็น path หลังเปลี่ยนแล้ว)
      const target = window.location.pathname || "/";
      console.log("[Back] popstate -> target:", target);
      if (shouldClearFor(target)) clearAll("popstate");
    };

    const onPageHide = (ev: PageTransitionEvent) => {
      const target = window.location.pathname || "/";
      console.log("[Back] pagehide -> target:", target, "persisted:", ev.persisted);
      if (shouldClearFor(target)) clearAll("pagehide");
    };

    const onPageShow = (ev: PageTransitionEvent) => {
      // กรณี bfcache กลับมา อีกครั้ง ให้เช็คอีกรอบ
      if (ev.persisted) {
        const target = window.location.pathname || "/";
        console.log("[Back] pageshow(bfcache) -> target:", target);
        if (shouldClearFor(target)) clearAll("pageshow");
      }
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    console.log("[Hook] useClearCookieOnBack mounted with keys:", keyList, "paths:", pathList);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      console.log("[Hook] useClearCookieOnBack unmounted");
    };
  }, [keyList, pathList]);
}

function removeCookieAllScopes(name: string) {
  // หมายเหตุ: ถ้า cookie เป็น HttpOnly จะลบจากฝั่ง client ไม่ได้ ต้องให้ server ลบ
  try {
    Cookies.remove(name);                 // path ปัจจุบัน
    Cookies.remove(name, { path: "/" });  // root

    // ลองทุกระดับ path
    const p = window.location.pathname || "/";
    let cur = p;
    while (true) {
      Cookies.remove(name, { path: cur });
      const idx = cur.lastIndexOf("/");
      if (idx <= 0) { Cookies.remove(name, { path: "/" }); break; }
      cur = cur.slice(0, idx);
    }

    // ลอง host และ .host
    const host = window.location.hostname;
    const dotHost = host.startsWith(".") ? host : "." + host;
    Cookies.remove(name, { path: "/", domain: host });
    Cookies.remove(name, { path: "/", domain: dotHost });
  } catch (e) {
    console.warn("[Cookie] remove error:", e);
  }
}
