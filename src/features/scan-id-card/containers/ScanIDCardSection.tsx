"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import { CaptureButton } from "@/features/scan-id-card/components/CaptureButton";
import { FrameSVG } from "@/features/scan-id-card/components/FrameSVG";
import { BoxShadowMask } from "@/features/scan-id-card/components/BoxShadowMask";
import { ScanHeader } from "@/features/scan-id-card/components/ScanHeader";
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

// ❌ ลบ useRef นอก component ออก (ต้นเหตุ Invalid hook call)

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

  // ใหม่: สำหรับ AC2
  const [manualVisible, setManualVisible] = useState(false); // แสดงปุ่มหลัง 10s
  const manualTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ใหม่: กันออโต้ช็อตยิงซ้ำ (AC1)
  const [autoFired, setAutoFired] = useState(false);

  const router = useRouter();

  // ✅ ย้ายเข้ามาไว้ใน component
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // โหลด OpenCV (เดิม)
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

  // วิเคราะห์ภาพ (เดิม แต่แก้ข้อความเมื่อพร้อม)
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
        // ปรับข้อความให้ตรง AC (ไม่มีจุด)
        onStatusChange("Image is ready to capture", "green");
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

  // วิเคราะห์ซ้ำทุก 700ms (เดิม)
  useEffect(() => {
    let iv: NodeJS.Timeout | null = null;
    if (cvReady) {
      iv = setInterval(analyse, 700);
    }
    return () => {
      if (iv) clearInterval(iv);
    };
  }, [cvReady, analyse]);

  // ตั้งเวลาครบ 10 วินาทีค่อยโชว์ปุ่ม (AC2)
  useEffect(() => {
    manualTimerRef.current = setTimeout(() => setManualVisible(true), 10_000);
    return () => {
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    };
  }, []);

  // ถ่าย + ครอปเฉพาะกรอบกลาง (เดิม)
  const shoot = useCallback(() => {
    const videoEl = (webcamRef.current?.video ??
      null) as HTMLVideoElement | null;
    let imgData: string | null = null;

    if (videoEl) {
      imgData = cropCenterFromVideo(videoEl, {
        maxRatio: 0.85,
        aspectW: 8.8,
        aspectH: 5.6,
      });
    }

    // Fallback: ถ้าครอปไม่ได้ ใช้ getScreenshot()
    if (!imgData) {
      imgData = webcamRef.current?.getScreenshot() ?? null;
    }
    if (!imgData) return;

    onCapture(imgData);
    sessionStorage.setItem("capturedIdCardImage", imgData);
    sessionStorage.setItem("imageSource", "camera");
    router.push("/preview-id-card");
  }, [onCapture, router]);

  // เมื่อพร้อมจริง → ยิงออโต้ + ซ่อนปุ่ม (AC1)  (hook ต้องอยู่นอก shoot)
  useEffect(() => {
    if (readyToShoot && !autoFired && !autoTimerRef.current) {
      // ซ่อนปุ่มมือ และเคลียร์ตัวจับเวลา 10s ทิ้ง
      setManualVisible(false);
      if (manualTimerRef.current) {
        clearTimeout(manualTimerRef.current);
        manualTimerRef.current = null;
      }

      // ตั้งยิงแบบหน่วงเล็กน้อย โดยไม่คืน cleanup มาล้าง timer ตอน state แกว่ง
      autoTimerRef.current = setTimeout(() => {
        shoot();
        setAutoFired(true);
        autoTimerRef.current = null;
      }, 150); // 150–300ms ก็ได้
    }
  }, [readyToShoot, autoFired, shoot]);

  // ล้าง timer ตอน unmount
  useEffect(() => {
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen bg-black ">
      <Link
        href="/id-accept"
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

        {/* แสดงปุ่มเฉพาะเคส AC2: ครบ 10s และยังไม่ได้ออโต้ช็อต */}
        {manualVisible && !autoFired && (
          // ให้กดได้แม้ยังไม่ ready ตาม AC2 → isReady = true
          <CaptureButton onClick={shoot} isReady={true} />
        )}
      </div>
    </div>
  );
}
