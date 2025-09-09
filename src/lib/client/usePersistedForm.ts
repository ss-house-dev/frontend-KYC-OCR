"use client";
import { useEffect, useRef } from "react";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { persist } from "./persist";
import { useSession } from "next-auth/react";

export function usePersistedForm<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  key: string,
  ttlMin = 30,
  exclude: (keyof TFieldValues)[] = []
) {
  const { watch, setValue } = form;
  const { data: session } = useSession();
  const uid = (session?.user as any)?.id ?? "guest";
  const storageKey = `persist:${uid}:${key}`;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = persist.get<Partial<TFieldValues>>(storageKey);
    if (saved) {
      Object.entries(saved).forEach(([k, v]) => {
        if (!exclude.includes(k as keyof TFieldValues) && typeof v !== "undefined") {
          setValue(k as Path<TFieldValues>, v as any, {
            shouldDirty: false,
            shouldValidate: true,
          });
        }
      });
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const data = parsed?.data as Partial<TFieldValues>;
          if (data) {
            Object.entries(data).forEach(([k, v]) => {
              if (!exclude.includes(k as keyof TFieldValues)) {
                setValue(k as Path<TFieldValues>, v as any, {
                  shouldDirty: false,
                  shouldValidate: false,
                });
              }
            });
          }
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const sub = watch((values) => {
      const filtered = { ...(values as TFieldValues) } as Partial<TFieldValues>;
      exclude.forEach((k) => {
        delete (filtered as any)[k as string];
      });

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        persist.set(storageKey, filtered, ttlMin);
      }, 300);
    });
    return () => sub.unsubscribe();
  }, [watch, ttlMin, storageKey, exclude]);

  const clear = () => persist.remove(storageKey);
  return { clear, storageKey };
}
