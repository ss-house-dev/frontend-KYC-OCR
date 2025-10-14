"use client";

import { useSearchParams, usePathname } from "next/navigation";

export function NotFoundClient() {
  const sp = useSearchParams(); 
  const pathname = usePathname();
  const code = sp.get("code") ?? "404";

  return (
    <p className="text-sm text-gray-500">
      Route: <code>{pathname}</code> • Error code: <code>{code}</code>
    </p>
  );
}
