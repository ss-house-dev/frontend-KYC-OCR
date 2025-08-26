"use client";

import dynamic from "next/dynamic";
const FailModal = dynamic(() => import("../components/FailModal"), { ssr: false });

import React, { useRef, useEffect } from "react";
import { useFaceMesh } from "../hooks/useFaceMesh";
import { VideoCanvas } from "../components/VideoCanvas";
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

  useEffect(() => {
    if (done) {
      router.push("/face-verification");
    }
  }, [done, router]);

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
      </div>
      <FailModal open={failed} onRetry={restartFromSetup} />
    </div>
  );
}
