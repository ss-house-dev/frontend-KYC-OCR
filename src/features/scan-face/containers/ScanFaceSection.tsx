"use client";

import dynamic from "next/dynamic";
const FailModal = dynamic(() => import("../components/FailModal"), { ssr: false });

import React, { useRef, useEffect, useState } from "react";
import { useFaceMesh } from "../hooks/useFaceMesh";
import { VideoCanvas } from "../components/VideoCanvas";
import { StatusBar } from "../components/StatusBar";
import { CONFIG } from "../configs/constant";
import Image from "next/image";


export default function ScanFaceSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    state,
    detectionResult,
    setupCamera,
    failed,
    restartFromSetup,
  } = useFaceMesh(videoRef, canvasRef);

  const [frameSrc, setFrameSrc] = useState("/scan-face/frame-face-white.svg");

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initCamera = async () => {
      try {
        cleanup = await setupCamera();
      } catch (error) {
        console.error("Failed to initialize camera:", error);
        alert(
          "ไม่สามารถเปิดกล้องได้: " +
            (error instanceof Error ? error.message : String(error))
        );
      }
    };

    initCamera();

    return () => {
      if (cleanup) cleanup();
    };
  }, [setupCamera]);

    useEffect(() => {
    if (!detectionResult.landmarks) {
      setFrameSrc("/scan-face/frame-face-red.svg"); // ไม่มีหน้า -> กรอบแดง
    } else {
      setFrameSrc("/scan-face/frame-face-white.svg"); // พบหน้า -> กรอบปกติ
    }
  }, [detectionResult]);

  return (
    <div className="relative w-full h-full min-h-screen bg-black">
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <video ref={videoRef} playsInline className="hidden" muted autoPlay />
        <VideoCanvas
          canvasRef={canvasRef}
          state={state}
          detectionResult={detectionResult}
          videoElement={videoRef.current || undefined}
        />
        <Image
          src={frameSrc}
          alt="face-outline"
          width={500}
          height={500}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 object-contain pointer-events-none"
        />
      </div>

      <StatusBar state={state} />

      {/* กด Try again → หยุด session เก่าและเริ่มใหม่ตั้งแต่ Setup */}
      <FailModal open={failed} onRetry={restartFromSetup} />
    </div>
  );
}
