"use client";

import { Button } from "@/components/ui/button";

export default function CropGuideDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-lg p-4">
        <div
          className="text-center font-semibold"
          style={{ color: "##0F2D73" }}
        >
          Crop Book Bank
        </div>
        <p className="mt-2 text-center text-sm text-[#4B5563]">
          Please ensure the bankbook page is fully visible within the frame.
        </p>

        <div className="grid grid-cols-3 gap-4 my-4 opacity-90">
          <div className="h-16 rounded-md bg-gray-100 grid place-items-center text-gray-400 text-xs">
            Sample
          </div>
          <div className="h-16 rounded-md bg-gray-100 grid place-items-center text-gray-400 text-xs">
            Blurry
          </div>
          <div className="h-16 rounded-md bg-gray-100 grid place-items-center text-gray-400 text-xs">
            Glare
          </div>
        </div>

        <div className="space-y-2 text-left">
          <div className="flex ">
            <span className="flex items-center justify-center w-5 h-5  flex-shrink-0 rounded-full ">
              <svg
                className="w-4 h-4 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="11"
                  fill="#fff"
                  stroke="#9ca3af"
                  strokeWidth="2"
                />
                <text
                  x="12"
                  y="17"
                  textAnchor="middle"
                  fontSize="16"
                  fill="#9ca3af"
                  fontWeight="bold"
                >
                  !
                </text>
              </svg>
            </span>
            <span className="text-gray-600 pl-2" style={{ fontSize: "13px" }}>
              Make sure the full account page is clearly visible.
            </span>
          </div>
          <div className="flex items-center">
            <span className="flex items-center justify-center w-5 h-5  flex-shrink-0 rounded-full ">
              <svg
                className="w-4 h-4 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="11"
                  fill="#fff"
                  stroke="#9ca3af"
                  strokeWidth="2"
                />
                <text
                  x="12"
                  y="17"
                  textAnchor="middle"
                  fontSize="16"
                  fill="#9ca3af"
                  fontWeight="bold"
                >
                  !
                </text>
              </svg>
            </span>
            <span className="text-gray-600 pl-2" style={{ fontSize: "13px" }}>
              Keep the image sharp and readable under good lighting.
            </span>
          </div>
          <div className="flex items-center">
            <span className="flex items-center justify-center w-5 h-5  flex-shrink-0 rounded-full ">
              <svg
                className="w-4 h-4 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="11"
                  fill="#fff"
                  stroke="#9ca3af"
                  strokeWidth="2"
                />
                <text
                  x="12"
                  y="17"
                  textAnchor="middle"
                  fontSize="16"
                  fill="#9ca3af"
                  fontWeight="bold"
                >
                  !
                </text>
              </svg>
            </span>
            <span className="text-gray-600 pl-2" style={{ fontSize: "13px" }}>
              Use the page showing bank name, account holder, and account number.
            </span>
          </div>
        </div>

        <Button onClick={onClose} className="mt-8 w-full bg-[#1C55D9]">
          Got it
        </Button>
      </div>
    </div>
  );
}
