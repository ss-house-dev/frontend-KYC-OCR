"use client";
import React from "react";
import Image from "next/image";

interface AlertPopUpProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onRetry: () => void;
}

const AlertPopUp: React.FC<AlertPopUpProps> = ({
  isOpen,
  title ,
  message,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
            {title}
          </h3>
          <p id="scan-failed-desc" className="text-sm text-neutral-600 mb-6">
            {message}
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
};

export default AlertPopUp;
