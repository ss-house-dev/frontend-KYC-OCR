export type Persisted<T> = { v: number; exp: number; data: T };

const isBrowser = () => typeof window !== "undefined";

export const persist = {
  set<T>(key: string, data: T, ttlMin = 30, version = 1) {
    if (!isBrowser()) return;
    const exp = Date.now() + ttlMin * 60_000;
    localStorage.setItem(key, JSON.stringify({ v: version, exp, data }));
  },
  get<T>(key: string): T | null {
    if (!isBrowser()) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw) as Persisted<T>;
      if (typeof obj.exp === "number" && Date.now() > obj.exp) {
        localStorage.removeItem(key);
        return null;
      }
      return obj.data as T;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  },
  remove(key: string) {
    if (isBrowser()) localStorage.removeItem(key);
  },
  clearExpired(prefix?: string) {
    if (!isBrowser()) return;
    const now = Date.now();
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      keys.push(k);
    }
    keys.forEach((k) => {
      if (prefix && !k.startsWith(prefix)) return;
      try {
        const obj = JSON.parse(localStorage.getItem(k)!);
        if (obj?.exp && now > obj.exp) localStorage.removeItem(k);
      } catch {}
    });
  },
};
