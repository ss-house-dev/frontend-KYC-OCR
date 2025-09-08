"use client";

import Cookies from "js-cookie";

export type KycCookie = { id: string; step?: string; exp: number };

const KEY = "kyc_state";

export function setKycCookie(id: string, step?: string, ttlMin = 30) {
  const exp = Date.now() + ttlMin * 60 * 1000;
  const payload: KycCookie = { id, step, exp };
  Cookies.set(KEY, JSON.stringify(payload), {
    expires: new Date(exp),
    sameSite: "lax",
    path: "/",
  });
}

export function getKycCookie(): KycCookie | null {
  const raw = Cookies.get(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as KycCookie;
    if (!parsed.exp || parsed.exp < Date.now()) {
      clearKycCookie();
      return null;
    }
    return parsed;
  } catch {
    clearKycCookie();
    return null;
  }
}

export function clearKycCookie() {
  Cookies.remove(KEY, { path: "/" });
}
