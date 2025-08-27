import * as React from "react";

interface CaptureButtonProps {
  onClick: () => void;
  isReady: boolean;
}

export function CaptureButton({ onClick, isReady }: CaptureButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isReady}
      aria-label="Capture"
      className="absolute -bottom-80 left-1/2 -translate-x-1/2
             relative w-[63px] h-[63px] rounded-full
             transition-all duration-300
             focus-visible:outline focus-visible:outline-2
             focus-visible:outline-offset-2 focus-visible:outline-[#2152b6]
             hover:scale-105 active:scale-95"
    >
      <span
        className={`absolute inset-0 rounded-full pointer-events-none
    ${
      isReady
        ? "border border-white ring-1 ring-white/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
        : "border border-white/40 ring-1 ring-white/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
    }`}
      />
      <span
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[53px] h-[53px] rounded-full pointer-events-none
          ${
            isReady
              ? "bg-white border-[1.5px] border-white/90"
              : "bg-white/40 border-[1.5px] border-white/40"
          }`}
      />
    </button>
  );
}
