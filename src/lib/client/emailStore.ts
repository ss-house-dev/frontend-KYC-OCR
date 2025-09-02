export const emailStore = {
  key: "kyra_email",
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(this.key);
    } catch {
      return null;
    }
  },
  set(email: string) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.key, email);
    } catch {}
  },
  clear() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(this.key);
    } catch {}
  },
};
