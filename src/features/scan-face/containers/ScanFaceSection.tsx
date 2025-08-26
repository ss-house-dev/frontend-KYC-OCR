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

export default function ScanFaceSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();

   const {
    state, detectionResult, setupCamera,
    failed, restartFromSetup,
    done,
  } = useFaceMesh(videoRef, canvasRef);

  const [frameSrc, setFrameSrc] = useState("/scan-face/frame-face-white.svg");
  const [step1Valid, setStep1Valid] = useState(true);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try { cleanup = await setupCamera(); } catch (e) {
        console.error("Failed to initialize camera:", e);
        alert("ไม่สามารถเปิดกล้องได้");
      }
    })();
    return () => { if (cleanup) cleanup(); };
  }, [setupCamera]);

  // ใช้ Step1Validator ตรวจสอบใบหน้า แล้วเปลี่ยนกรอบ
  useEffect(() => {
    if (!detectionResult.bbox) {
      setFrameSrc("/scan-face/frame-face-red.svg");
      setStep1Valid(false);
      if ("vibrate" in navigator) navigator.vibrate(300);
      return;
    }

    const validation = Step1Validator.validateStep1(
      detectionResult.landmarks ? 1 : 0,
      detectionResult.brightness ?? 0,
      detectionResult.bbox,
      CONFIG.DISPLAY.WIDTH,
      CONFIG.DISPLAY.HEIGHT
    );

    setStep1Valid(validation.isValid);
    setFrameSrc(
      validation.isValid
        ? "/scan-face/frame-face-white.svg"
        : "/scan-face/frame-face-red.svg"
    );

    // สั่นเมื่อ invalid
    if (!validation.isValid && navigator.vibrate) {
      navigator.vibrate(300);
    }
  }, [detectionResult]);
  useEffect(() => {
    if (done) {
      router.push("/face-verification");
    }
  }, [done, router]);

  return (
    <div className="relative w-full h-full min-h-screen bg-black">
      <div className="fixed inset-0 bg-black">
        <video ref={videoRef} playsInline className="hidden" muted autoPlay />
        <VideoCanvas
          canvasRef={canvasRef}
          state={state}
          detectionResult={detectionResult}
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
          detection={detectionResult}
          visible={true}
        />
        <FailModal open={failed} onRetry={restartFromSetup} />
      </div>
    </div>
  );
}
