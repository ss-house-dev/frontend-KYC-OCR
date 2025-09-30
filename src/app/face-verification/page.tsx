"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { captureStore } from "@/features/scan-face/state/captureStore";
import { useSubmitFaceWithIdCard } from "@/features/scan-face/hooks/useSubmitFaceWithIdCard";

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
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center p-6">
      <h1 className="text-xl font-semibold text-[#053] mb-4">
        Face Verification
      </h1>

      <div className="w-full max-w-md rounded-2xl bg-white shadow p-5">
        <p className="text-center text-emerald-600 font-semibold mb-2">
          Scanning success
        </p>
        <p className="text-center text-sm text-neutral-500 mb-4">
          Facial verification sample image
        </p>

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

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              กำลังส่งข้อมูล... {progress}%
            </p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading || !kycRequestId}
          className="mt-4 w-full rounded-2xl px-5 py-3 text-white text-[15px] font-medium bg-[#1766FF] hover:bg-[#155BE6] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? `กำลังส่ง... ${progress}%` : "Confirm"}
        </button>
      </div>
    </div>
  );
}