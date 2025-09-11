"use client";

import { toast as baseToast } from "sonner";

type ToastVariant = "default" | "destructive";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

export function useToast() {
  const toast = (opts: ToastOptions) => {
    const {
      title = "",
      description,
      variant = "default",
      duration,
    } = opts ?? {};
    if (variant === "destructive") {
      baseToast.error(title, { description, duration });
    } else {
      baseToast(title, { description, duration });
    }
  };
  return { toast };
}
