"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import { CaptureButton } from "@/features/scan-id-card/components/CaptureButton";
import { FrameSVG } from "@/features/scan-id-card/components/FrameSVG";
import { BoxShadowMask } from "@/features/scan-id-card/components/BoxShadowMask";
import { ScanHeader } from "@/features/scan-id-card/components/ScanHeader";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment",
};

interface Props {
  onCapture: (img: string) => void;
  onStatusChange: (msg: string, color: "red" | "green") => void;
  frameColor: "red" | "green";
  sharpnessMsg: string;
}

/** ครอปจาก HTMLVideoElement: กรอบกลาง 88% อัตราส่วน 8.8:5.6 */
function cropCenterFromVideo(
  video: HTMLVideoElement,
  opts = { maxRatio: 0.88, aspectW: 8.8, aspectH: 5.6 }
) {
  const W = video.videoWidth;
  const H = video.videoHeight;
  if (!W || !H) return null;

  const maxW = W * opts.maxRatio;
  const maxH = H * opts.maxRatio;
  const ar = opts.aspectW / opts.aspectH;

  let cropW = Math.min(maxW, maxH * ar);
  let cropH = cropW / ar;

  cropW = Math.round(cropW);
  cropH = Math.round(cropH);

  const cropX = Math.round((W - cropW) / 2);
  const cropY = Math.round((H - cropH) / 2);

  const cvs = document.createElement("canvas");
  const ctx = cvs.getContext("2d");
  if (!ctx) return null;

  cvs.width = cropW;
  cvs.height = cropH;

  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  return cvs.toDataURL("image/jpeg", 0.92);
}

export default function ScanIDCardSection({
  onCapture,
  onStatusChange,
  frameColor,
  sharpnessMsg,
}: Props) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cvReady, setCvReady] = useState(false);
  const [readyToShoot, setReadyToShoot] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // โหลด OpenCV
  useEffect(() => {
    if (typeof cv !== "undefined") {
      setCvReady(true);
      return;
    }
    const id = "opencv-script";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://docs.opencv.org/4.9.0/opencv.js";
    s.async = true;
    s.onload = () => {
      const iv = setInterval(() => {
        if (typeof cv !== "undefined") {
          clearInterval(iv);
          setCvReady(true);
        }
      }, 100);
    };
    s.onerror = () => onStatusChange("Unable to load OpenCV", "red");
    document.body.appendChild(s);
  }, [onStatusChange]);

  // วิเคราะห์ภาพ
  const analyse = useCallback(() => {
    const cam = webcamRef.current;
    const cvs = canvasRef.current;
    if (!cvReady || !cam || !cvs || !cam.video || cam.video.readyState !== 4)
      return;

    const ctx = cvs.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    cvs.width = cam.video.videoWidth;
    cvs.height = cam.video.videoHeight;
    ctx.drawImage(cam.video, 0, 0, cvs.width, cvs.height);

    let src: CVMat | undefined,
      gray: CVMat | undefined,
      laplacian: CVMat | undefined,
      meanMat: CVMat | undefined,
      stdDev: CVMat | undefined,
      edges: CVMat | undefined,
      contours: CVMatVector | undefined,
      hierarchy: CVMat | undefined;

    try {
      src = cv.imread(cvs);
      gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      const mean = cv.mean(gray)[0];
      if (mean < 60) {
        setReadyToShoot(false);
        onStatusChange("Image is too dark. Please try again.", "red");
        return;
      }
      if (mean > 200) {
        setReadyToShoot(false);
        onStatusChange("Image is too bright. Please try again.", "red");
        return;
      }

      laplacian = new cv.Mat();
      cv.Laplacian(gray, laplacian, cv.CV_64F);

      // CHANGED: ใช้ CV_64F และอ่านค่าแบบปลอดภัย
      meanMat = new cv.Mat(1, 1, cv.CV_64F);
      stdDev = new cv.Mat(1, 1, cv.CV_64F);
      cv.meanStdDev(laplacian, meanMat, stdDev);
      const sigma = stdDev.data64F?.[0] ?? 0;
      const sharpness = sigma ** 2;

      if (sharpness < 80) {
        setReadyToShoot(false);
        onStatusChange("Image is too blurry. Please try again.", "red");
        return;
      }

      edges = new cv.Mat();
      cv.Canny(gray, edges, 50, 150);
      contours = new cv.MatVector();
      hierarchy = new cv.Mat();
      cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      let found = false;
      for (let i = 0; i < contours.size(); i++) {
        const c = contours.get(i);
        const peri = cv.arcLength(c, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(c, approx, 0.03 * peri, true);

        if (approx.rows === 4) {
          const r = cv.boundingRect(approx);
          const ratio = r.width / r.height;
          if (r.width > 200 && r.height > 100 && ratio > 1.4 && ratio < 1.9) {
            found = true;
            approx.delete();
            break;
          }
        }
        approx.delete();
      }

      if (found) {
        setReadyToShoot(true);
        onStatusChange("Image is ready to capture.", "green");
      } else {
        setReadyToShoot(false);
        onStatusChange("Place and align your ID card in the frame.", "red");
      }
    } catch (e) {
      console.error(e);
      setReadyToShoot(false);
      onStatusChange("An error occurred during analysis", "red");
    } finally {
      src?.delete();
      gray?.delete();
      laplacian?.delete();
      meanMat?.delete();
      stdDev?.delete();
      edges?.delete();
      contours?.delete();
      hierarchy?.delete();
    }
  }, [cvReady, onStatusChange]);

  useEffect(() => {
    if (cvReady) {
      timer.current = setInterval(analyse, 700);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [cvReady, analyse]);

  const router = useRouter();

  // ถ่าย + ครอปเฉพาะกรอบกลาง
  const shoot = () => {
    const videoEl = (webcamRef.current?.video ??
      null) as HTMLVideoElement | null;
    if (!videoEl) return;

    const imgData = cropCenterFromVideo(videoEl, {
      maxRatio: 0.33,
      aspectW: 85.6,
      aspectH: 53.98,
    });
    if (!imgData) return;

    onCapture(imgData);
    sessionStorage.setItem("capturedIdCardImage", imgData);
    sessionStorage.setItem("imageSource", "camera");
    router.push("/preview-id-card");
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-black ">
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88vw] max-w-[420px] aspect-[8.8/5.6] z-10 p-[3%]">
        <BoxShadowMask
          radius={14}
          inset={{ top: "-0.5%", right: "4%", bottom: "-0.5%", left: "4%" }}
          opacity={0.55}
        />

        <ScanHeader sharpnessMsg={sharpnessMsg} />

        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="relative w-full h-full">
            <FrameSVG color={frameColor} overscanPct={0.05} />
          </div>
        </div>

        <CaptureButton onClick={shoot} isReady={readyToShoot} />
      </div>
    </div>
  );
}
