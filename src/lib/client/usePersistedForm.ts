"use client";
import { useEffect, useRef } from "react";
import type {
  UseFormReturn,
  FieldValues,
  Path,
  PathValue,
  DeepPartial
} from "react-hook-form";
import { persist } from "./persist";
import { useSession } from "next-auth/react";

function typedEntries<T extends object>(obj: T) {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function usePersistedForm<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  key: string,
  ttlMin = 30,
  exclude: (keyof TFieldValues)[] = []
) {
  const { watch, setValue } = form;
  const { data: session } = useSession();
  const uid = session?.user?.id ?? "guest";
  const storageKey = `persist:${uid}:${key}`;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = persist.get<Partial<TFieldValues>>(storageKey);
    if (saved) {
      for (const [k, v] of typedEntries(saved)) {
        if (!exclude.includes(k) && typeof v !== "undefined") {
          setValue(
            k as Path<TFieldValues>,
            v as PathValue<TFieldValues, Path<TFieldValues>>,
            { shouldDirty: false, shouldValidate: true }
          );
        }
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const data = parsed?.data as Partial<TFieldValues> | undefined;
          if (data) {
            for (const [k, v] of typedEntries(data)) {
              if (!exclude.includes(k)) {
                setValue(
                  k as Path<TFieldValues>,
                  v as PathValue<TFieldValues, Path<TFieldValues>>,
                  { shouldDirty: false, shouldValidate: false }
                );
              }
            }
          }
        } catch {
          /* noop */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sub = watch((values) => {
      const partial = values as DeepPartial<TFieldValues>;
      const filteredEntries = Object.entries(partial).filter(
        ([k]) => !exclude.includes(k as keyof TFieldValues)
      );
      const filtered = Object.fromEntries(filteredEntries) as Partial<TFieldValues>;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        persist.set<Partial<TFieldValues>>(storageKey, filtered, ttlMin);
      }, 300);
    });
    return () => sub.unsubscribe();
  }, [watch, ttlMin, storageKey, exclude]);

  const clear = () => persist.remove(storageKey);
  return { clear, storageKey };
}
