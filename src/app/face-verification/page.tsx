"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; 
import { captureStore } from "@/features/scan-face/state/captureStore";

export default function FaceVerificationPage() {
  const data = captureStore.get();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center p-6">
      <h1 className="text-xl font-semibold text-[#053] mb-4">Face Verification</h1>

      <div className="w-full max-w-md rounded-2xl bg-white shadow p-5">
        <p className="text-center text-emerald-600 font-semibold mb-2">
          Scanning success
        </p>
        <p className="text-center text-sm text-neutral-500 mb-4">
          Facial verification sample image
        </p>

        {/* รูปตัวอย่างจากตอนจบ Step 1 */}
        {data.step1Sample && (
          <div className="mb-6">
            <div className="rounded-xl overflow-hidden border">
              <Image
                src={data.step1Sample}
                alt="step1-sample"
                width={320}
                height={320}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        )}

        {/* รูปแต่ละ movement (สูงสุด 10 รูป/กลุ่ม) */}
        {(["yaw", "pitch", "blink", "mouth"] as const).map((g) => {
          const items = data.movements[g];
          if (!items?.length) return null;
          return (
            <div key={g} className="mb-6">
              <div className="text-sm font-medium mb-2 capitalize">{g} (max 10)</div>
              <div className="grid grid-cols-5 gap-2">
                {items.map((src, i) => (
                  <div key={`${g}-${i}`} className="rounded-lg overflow-hidden border">
                    <Image src={src} alt={`${g}-${i}`} width={120} height={120} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <button
          onClick={() => {
            router.push("/book-bank-accept"); 
          }}
          className="mt-4 w-full rounded-2xl px-5 py-3 text-white text-[15px] font-medium bg-[#1766FF] hover:bg-[#155BE6] transition"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
