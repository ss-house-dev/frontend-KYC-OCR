"use client";

import { Button } from "@/components/ui/button";

export default function CropGuideDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-lg p-5">
        <div className="text-center font-semibold" style={{ color: "#0F2D73" }}>
          Crop Book Bank
        </div>
        <p className="mt-1 text-center text-sm text-gray-600">
          Please ensure the bankbook page is fully visible within the frame.
        </p>

        <div className="grid grid-cols-3 gap-3 my-3 opacity-90">
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

        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Make sure the full account page is clearly visible.</li>
          <li>• Keep the image sharp and readable under good lighting.</li>
          <li>
            • Use the page showing bank name, account holder, and account
            number.
          </li>
        </ul>

        <Button onClick={onClose} className="mt-4 w-full">
          Got it
        </Button>
      </div>
    </div>
  );
}
