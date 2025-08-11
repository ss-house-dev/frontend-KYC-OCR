import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-lg bg-gray-100 px-4 py-2 text-base outline-none", 
        "placeholder:text-gray-400",
        "dark:bg-gray-800 dark:text-gray-50 dark:placeholder:text-gray-500", 
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", 
        "disabled:cursor-not-allowed disabled:opacity-50", 
        "aria-invalid:border-red-500 aria-invalid:ring-red-500", 
        className
      )}
      {...props}
    />
  )
}

export { Input }