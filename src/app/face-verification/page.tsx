"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { captureStore } from "@/features/scan-face/state/captureStore";
import { useSubmitFaceWithIdCard } from "@/features/scan-face/hooks/useSubmitFaceWithIdCard";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function FaceVerificationPage() {
  const data = captureStore.get();
  const router = useRouter();
  const { data: session } = useSession();

  const kycRequestId = session?.kycRequestId;
  const { submit, loading, progress, error } = useSubmitFaceWithIdCard(
    kycRequestId || ""
  );

  const handleConfirm = async () => {
    if (!kycRequestId) {
      alert("กรุณาเข้าสู่ระบบ");
      router.push("/user-login");
      return;
    }

    try {
      await submit();
      router.push("/book-bank-accept");
    } catch (err) {
      console.error("❌ ส่งข้อมูลล้มเหลว", err);
      // แสดง error ให้ user เห็น
    }
  };

  return (
    <div className="bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col">
        {/* Header */}
        <header className="relative flex items-center justify-center px-5 py-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-[#0F2D73]">
            Face Verification
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 px-5 pt-5">
          <div className="rounded-[20px] bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.08)] p-6">
            <p className="text-center text-[#00C48C] font-semibold mb-1">
              Scaning success
            </p>
            <p className="text-center text-sm text-neutral-500 mb-4">
              Facial verification sample image
            </p>

            {data.step1Sample && (
              <div className="mb-2">
                <div className="rounded-[16px] overflow-hidden">
                  <Image
                    src={data.step1Sample}
                    alt="Facial sample"
                    width={320}
                    height={320}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {loading && <FullScreenLoader />}
          </div>
        </main>

        {/* Sticky bottom button */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur px-5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <button
            onClick={handleConfirm}
            disabled={loading || !kycRequestId}
            className="w-full h-12 rounded-[8px] text-white font-semibold text-base bg-[#2152b6] transition disabled:bg-gray-400 "
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
