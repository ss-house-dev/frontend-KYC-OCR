"use client";

import { useEffect, useMemo, useState } from "react";
import type { FieldErrors, UseFormWatch, Path, FieldValues } from "react-hook-form";

export function useCanSubmit<T extends FieldValues>(
  watch: UseFormWatch<T>,
  errors: FieldErrors<T>,
  groups: { required: Array<Path<T>> }
) {
  const values = watch(groups.required);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    const allFilled = groups.required.every((name, idx) => {
      const v = (values as any)?.[idx];
      const hasVal = v !== "" && v !== null && v !== undefined;
      const hasErr = !!(errors as any)[name];
      return hasVal && !hasErr;
    });
    setCanSubmit(allFilled);
  }, [values, errors, groups.required]);

  return canSubmit;
}
