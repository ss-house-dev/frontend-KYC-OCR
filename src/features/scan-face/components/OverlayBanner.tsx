"use client";
import React from "react";

type OverlayBannerProps = {
  text?: string | null;
  y?: number;
  visible?: boolean;
  className?: string;
};

export default function OverlayBanner({
  text,
  y = 80,
  visible = true,
  className = "",
}: OverlayBannerProps) {
  if (!visible || !text) return null;

  return (
    <div
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${className}`}
      style={{ top: y }}
    >
      <div className="text-white font-bold text-glow px-3 py-2 text-xl font-medium whitespace-nowrap">
        {text}
      </div>
    </div>
  );
}
