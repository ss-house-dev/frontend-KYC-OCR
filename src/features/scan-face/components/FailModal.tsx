"use client";

import React from "react";
import Image from "next/image";

type Props = {
  open: boolean;
  onRetry: () => void;
};

export default function FailModal({ open, onRetry }: Props) {
  if (!open) return null;

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === "Escape") onRetry();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-failed-title"
      aria-describedby="scan-failed-desc"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      suppressHydrationWarning
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

      {/* card */}
      <div className="relative z-10 w-[420px] max-w-[92vw] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            <Image
              src="/scan-face/alert.png"
              alt="alert"
              width={48}
              height={48}
              priority
              draggable={false}
            />
          </div>

          <h3
            id="scan-failed-title"
            className="text-[22px] leading-snug font-semibold text-neutral-900 mb-1"
          >
            Scan Failed
          </h3>
          <p id="scan-failed-desc" className="text-sm text-neutral-600 mb-6">
            Face scan is failed, please try again
          </p>

          <button
            onClick={onRetry}
            className="w-full rounded-2xl px-5 py-3 text-white text-[15px] font-medium bg-[#1766FF] hover:bg-[#155BE6] active:translate-y-[1px] transition-shadow shadow-[0_6px_20px_rgba(23,102,255,0.45)]"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
