"use client";

import React, { useRef, useEffect } from "react";
import { useFaceMesh } from "../hooks/useFaceMesh";
import { VideoCanvas } from "../components/VideoCanvas";
import { StatusBar } from "../components/StatusBar";
import { CONFIG } from "../configs/constant";

export default function ScanFaceSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { state, detectionResult, setupCamera } = useFaceMesh(
    videoRef,
    canvasRef
  );

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
      if (cleanup) {
        cleanup();
      }
    };
  }, [setupCamera]);

  return (
    <div className="w-full flex flex-col items-center gap-3 p-4">
      <div
        className="relative"
        style={{ width: CONFIG.DISPLAY.WIDTH, height: CONFIG.DISPLAY.HEIGHT }}
      >
        <video ref={videoRef} playsInline className="hidden" muted autoPlay />
        <VideoCanvas
          canvasRef={canvasRef}
          state={state}
          detectionResult={detectionResult}
          videoElement={videoRef.current || undefined}
        />
      </div>
      <StatusBar state={state} />
    </div>
  );
}
