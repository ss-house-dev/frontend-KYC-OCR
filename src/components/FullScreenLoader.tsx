"use client";

import React from "react";

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="h-5 w-5 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
    </div>
  );
}
