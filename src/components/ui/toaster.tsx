"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      position="top-center"
      closeButton
      expand={false}
      duration={4000}
    />
  );
}

export default Toaster;
