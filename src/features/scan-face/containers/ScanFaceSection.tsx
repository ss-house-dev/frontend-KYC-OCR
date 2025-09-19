"use client";

import dynamic from "next/dynamic";
const FailModal = dynamic(() => import("../components/FailModal"), {
  ssr: false,
});

import React, { useRef, useEffect, useState } from "react";
import { useFaceMesh } from "../hooks/useFaceMesh";
import { VideoCanvas } from "../components/VideoCanvas";
import { StatusBar } from "../components/StatusBar";
import ScanOverlayHUD from "../components/ScanOverlayHUD";
import { CONFIG } from "../configs/constant";
import Image from "next/image";
import { Step1Validator } from "../utils/validators/step1Validator";
import { useRouter } from "next/navigation";
import Link from "next/link";

const IconArrowLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 19.5L8.25 12l7.5-7.5"
    />
  </svg>
);

export default function ScanFaceSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();

  const {
    state,
    detectionResult,
    setupCamera,
    failed,
    restartFromSetup,
    done,
  } = useFaceMesh(videoRef, canvasRef);

  const [frameSrc, setFrameSrc] = useState("/scan-face/frame-face-white.svg");
  const [step1Valid, setStep1Valid] = useState(true);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        cleanup = await setupCamera();
      } catch (e) {
        console.error("Failed to initialize camera:", e);
        alert("ไม่สามารถเปิดกล้องได้");
      }
    })();
    return () => {
      if (cleanup) cleanup();
    };
  }, [setupCamera]);

  // ใช้ Step1Validator ตรวจและเปลี่ยนกรอบ
  useEffect(() => {
    const pattern = [100, 50, 100, 200];

    // ไม่มีหน้า → bbox เป็น null
    if (!detectionResult?.bbox) {
      setFrameSrc("/scan-face/frame-face-red.svg");
      setStep1Valid(false);
      if ("vibrate" in navigator) navigator.vibrate(pattern);
      return;
    }

    // ⬅️ Step1Validator ยังรับ array → ห่อเป็น [detectionResult]
    const validation = Step1Validator.validateStep1(
      [detectionResult],
      CONFIG.DISPLAY.WIDTH,
      CONFIG.DISPLAY.HEIGHT
    );

    setStep1Valid(validation.isValid);
    setFrameSrc(
      validation.isValid
        ? "/scan-face/frame-face-white.svg"
        : "/scan-face/frame-face-red.svg"
    );

    if (!validation.isValid && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, [detectionResult]);

  useEffect(() => {
    if (done) {
      router.push("/face-verification");
    }
  }, [done, router]);

  const detectionResults = detectionResult ? [detectionResult] : [];

  return (
    <div className="relative w-full h-full min-h-screen bg-black">
      <Link
        href="/face-accept"
        aria-label="Back"
        className="fixed left-4 top-4 z-40 text-white p-2
             focus-visible:outline focus-visible:outline-2
             focus-visible:outline-offset-2 focus-visible:outline-[#2152b6]"
        style={{ top: "max(env(safe-area-inset-top, 0px), 1rem)" }}
      >
        {/* Icon Back */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        <span className="sr-only">Back</span>
      </Link>

      <div className="fixed inset-0 bg-black">
        <video ref={videoRef} playsInline className="hidden" muted autoPlay />
        <VideoCanvas
          canvasRef={canvasRef}
          state={state}
          detectionResults={detectionResults}
          videoElement={videoRef.current || undefined}
        />

        <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 w-[88vw] max-w-[420px] aspect-[8.8/5.6] z-10 p-[3%]">
          <Image
            src={frameSrc}
            alt="face-outline"
            width={500}
            height={500}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 object-contain pointer-events-none"
          />
        </div>

        <StatusBar state={state} step1Valid={step1Valid} />

        <ScanOverlayHUD
          state={state}
          detectionResults={detectionResults}
          visible={true}
        />

        <FailModal open={failed} onRetry={restartFromSetup} />
      </div>
    </div>
  );
}
