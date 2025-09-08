import { type KycResponse } from "@/features/user-login/services/api-email";

export type KycStep = "email_sent" | "code_verified" | "profile_filled" | "done";

type KycPersist = { id: string; step?: KycStep; exp: number };

const KEY = "kyc_data_v1";

export const kycStore = {
  get(): KycPersist | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as KycPersist;
      if (!data.exp || data.exp < Date.now()) {
        localStorage.removeItem(KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  set(kyc: KycResponse, step?: KycStep, ttlMin = 30) {
    if (typeof window === "undefined" || !kyc?.id) return;
    try {
      const exp = Date.now() + ttlMin * 60 * 1000;
      const payload: KycPersist = { id: String(kyc.id), step, exp };
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {}
  },

  touch(ttlMin = 30) {
    const cur = this.get();
    if (!cur) return;
    cur.exp = Date.now() + ttlMin * 60 * 1000;
    try {
      localStorage.setItem(KEY, JSON.stringify(cur));
    } catch {}
  },

  setStep(step: KycStep, ttlMin = 30) {
    const cur = this.get();
    if (!cur) return;
    cur.step = step;
    cur.exp = Date.now() + ttlMin * 60 * 1000;
    try {
      localStorage.setItem(KEY, JSON.stringify(cur));
    } catch {}
  },

  clear() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(KEY);
    } catch {}
  },
};