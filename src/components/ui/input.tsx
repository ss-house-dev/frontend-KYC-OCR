import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[#888888] selection:bg-primary selection:text-primary-foreground",
        "dark:bg-input/30 flex h-12 w-full min-w-0 rounded-md border border-[#D1D1D1] bg-white px-3 py-1 text-base",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "hover:border-[#D1D1D1] hover:bg-white",
        className
      )}
      {...props}
    />
  );
}

export { Input };
