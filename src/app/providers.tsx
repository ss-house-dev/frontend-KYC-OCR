"use client";

import { SessionProvider } from "next-auth/react";
import QueryProvider from "@/lib/react-query/QueryClientProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </SessionProvider>
  );
}
