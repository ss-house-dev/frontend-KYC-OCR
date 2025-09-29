//Scan ID Card เช็ค 4 มุม

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import { CaptureButton } from "@/features/scan-id-card/components/CaptureButton";
import { FrameSVG } from "@/features/scan-id-card/components/FrameSVG";
import { BoxShadowMask } from "@/features/scan-id-card/components/BoxShadowMask";
import { ScanHeader } from "@/features/scan-id-card/components/ScanHeader";
import { saveImageToCookie } from "@/lib/imageStorage";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type CVMat = any;
type CVMatVector = any;

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

// @ts-ignore
declare const cv: any;

function cropByCorners(src: CVMat, pts: { x: number; y: number }[]): string {
  // เรียงจุด tl,tr,br,bl
  pts.sort((a, b) => a.y - b.y || a.x - b.x);
  const top = pts.slice(0, 2).sort((a, b) => a.x - b.x);
  const bot = pts.slice(2, 4).sort((a, b) => a.x - b.x);
  const ordered = [top[0], top[1], bot[1], bot[0]];

  const w = 880,
    h = 560;
  const srcTri = cv.matFromArray(
    4,
    1,
    cv.CV_32FC2,
    ordered.flatMap((p) => [p.x, p.y])
  );
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, w, 0, w, h, 0, h]);

  const M = cv.getPerspectiveTransform(srcTri, dstTri);
  const dst = new cv.Mat();
  cv.warpPerspective(src, dst, M, new cv.Size(w, h));

  const canvas = document.createElement("canvas");
  cv.imshow(canvas, dst);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

  // cleanup
  srcTri.delete();
  dstTri.delete();
  M.delete();
  dst.delete();

  return dataUrl;
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

  // AC2: แสดงปุ่มหลัง 10 วินาที
  const [manualVisible, setManualVisible] = useState(false);
  const manualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AC1: กันยิงซ้ำ
  const [autoFired, setAutoFired] = useState(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ใช้ ref ถือค่าพร้อมล่าสุด กัน race ระหว่างตั้ง timer กับตอนยิง
  const readyRef = useRef(false);
  useEffect(() => {
    readyRef.current = readyToShoot;
  }, [readyToShoot]);

  const router = useRouter();

  // ✨ state เก็บมุมการ์ด
  const [cardCorners, setCardCorners] = useState<
    { x: number; y: number }[] | null
  >(null);

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

  // วิเคราะห์ภาพ หา card ในเฟรม + เช็ค brightness/sharpness
  const analyse = useCallback(() => {
    
  const cam = webcamRef.current;
  const cvs = canvasRef.current;
  if (!cvReady || !cam || !cvs || !cam.video || cam.video.readyState !== 4) return;

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
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    const W = cam.video.videoWidth;
    const H = cam.video.videoHeight;

    let bestCandidate: { pts: { x: number; y: number }[]; score: number; rect: any } | null = null;

    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const peri = cv.arcLength(c, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(c, approx, 0.01 * peri, true); // ใช้ 0.01 เพื่อความละเอียดขึ้น

      if (approx.rows === 4) {
        const rect = cv.boundingRect(approx);
        const ratio = rect.width / rect.height;
        const area = cv.contourArea(c);

        if (
          ratio > 1.5 && ratio < 1.65 &&             // อัตราส่วนบัตร
          area > W * H * 0.15 && area < W * H * 0.45 // พื้นที่สมเหตุสมผล
        ) {
          const pts: { x: number; y: number }[] = [];
          for (let j = 0; j < 4; j++) {
            pts.push({ x: approx.intPtr(j, 0)[0], y: approx.intPtr(j, 0)[1] });
          }

          // คะแนน: ใกล้ center ดีกว่า
          const cx = rect.x + rect.width / 2;
          const cy = rect.y + rect.height / 2;
          const score = Math.hypot(cx - W / 2, cy - H / 2);

          if (!bestCandidate || score < bestCandidate.score) {
            bestCandidate = { pts, score, rect };
          }
        }
      }
      approx.delete();
    }

      if (bestCandidate) {
        // เช็คว่าบัตรอยู่ในกรอบกลาง
        const frameX = W * 0.06, frameY = H * 0.06;
        const frameW = W * 0.88, frameH = H * 0.88;

        const rect = bestCandidate.rect;
        const overlapX = Math.max(0, Math.min(rect.x + rect.width, frameX + frameW) - Math.max(rect.x, frameX));
        const overlapY = Math.max(0, Math.min(rect.y + rect.height, frameY + frameH) - Math.max(rect.y, frameY));
        const overlapArea = overlapX * overlapY;
        const rectArea = rect.width * rect.height;
        const overlapRatio = overlapArea / rectArea;

        if (overlapRatio > 0.9) {
          setReadyToShoot(true);
          setCardCorners(bestCandidate.pts);
          onStatusChange("Image is ready to capture.", "green");
        } else {
          setReadyToShoot(false);
          setCardCorners(bestCandidate.pts);
          onStatusChange("Please align your ID card in the frame.", "red");
        }
      } else {
        setReadyToShoot(false);
        setCardCorners(null);
        onStatusChange("Please align your ID card in the frame.", "red");
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



  // วิเคราะห์ซ้ำทุก ~700ms
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | null = null;
    if (cvReady) {
      iv = setInterval(analyse, 700);
    }
    return () => {
      if (iv) clearInterval(iv);
    };
  }, [cvReady, analyse]);

  // ปุ่มมือโผล่หลัง 10 วิ (AC2)
  useEffect(() => {
    manualTimerRef.current = setTimeout(() => setManualVisible(true), 10_000);
    return () => {
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    };
  }, []);

  // ฟังก์ชันถ่ายภาพ + ครอปกลาง + fallback เป็น getScreenshot()
const shoot = useCallback(() => {
  console.log(
    "🚀 shoot() called. readyToShoot=",
    readyToShoot,
    "corners=",
    cardCorners
  );

  const videoEl = webcamRef.current?.video as HTMLVideoElement | null;
  if (!videoEl) {
    console.warn("❌ no video element");
    return;
  }

  let imgData: string | null = null;

  if (readyToShoot && cardCorners) {
    console.log("✅ cropping by corners...");

    // เอา frame ปัจจุบันจาก video → วาดลง temp canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = videoEl.videoWidth;
    tempCanvas.height = videoEl.videoHeight;
    const ctx = tempCanvas.getContext("2d");
    ctx?.drawImage(videoEl, 0, 0, tempCanvas.width, tempCanvas.height);

    // อ่านภาพจาก canvas ไม่ใช่ video
    const src = cv.imread(tempCanvas);

    imgData = cropByCorners(src, cardCorners);
    src.delete();
  } else {
    console.log("⚠️ fallback: crop center");
    imgData = cropCenterFromVideo(videoEl, {
      maxRatio: 0.85,
      aspectW: 8.8,
      aspectH: 5.6,
    });
  }

  if (!imgData) imgData = webcamRef.current?.getScreenshot() ?? null;
  if (!imgData) {
    console.warn("❌ no image data captured");
    return;
  }

  console.log("📸 captured image length=", imgData.length);

  // ✅ บันทึกลง sessionStorage ด้วย key ที่ถูกต้อง
  try {
    sessionStorage.setItem("capturedIdCardImage", imgData);
    console.log("💾 Saved to sessionStorage with key: capturedIdCardImage");
  } catch (e) {
    console.error("❌ Failed to save to sessionStorage:", e);
  }

  // ✅ ส่งให้ hook ผ่าน onCapture (ถ้ามี)
  onCapture?.(imgData);

  console.log("➡️ navigating to /preview-id-card");
  router.push("/preview-id-card");
}, [readyToShoot, onCapture, router, cardCorners]);

  // ✅ ออโต้ช็อตทำงานเฉพาะก่อนเข้าโหมด AC2 เท่านั้น
  useEffect(() => {
    if (!manualVisible && readyToShoot && !autoFired && !autoTimerRef.current) {
      // จับ snapshot ของสถานะตอนตั้ง timer + ใช้ ref เช็กซ้ำตอนยิง
      const readyAtSchedule = readyToShoot;

      if (manualTimerRef.current) {
        clearTimeout(manualTimerRef.current);
        manualTimerRef.current = null;
      }

      autoTimerRef.current = setTimeout(() => {
        // ต้องพร้อมทั้งตอนตั้ง timer และตอนจะยิงจริง เพื่อลด false positive
        if (readyAtSchedule && readyRef.current) {
          shoot();
          setAutoFired(true);
        }
        autoTimerRef.current = null;
      }, 150);
    }
  }, [manualVisible, readyToShoot, autoFired, shoot]);

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
        <ChevronLeft />
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
          <CaptureButton
            onClick={() => {
              if (readyToShoot) shoot(); // กดได้เมื่อขึ้นเขียวเท่านั้น
            }}
            isReady={readyToShoot} // สถานะปุ่มเท่ากับความพร้อมจริง
          />
        )}
      </div>

      {/* Overlay มุมที่ detect ได้ */}
      {cardCorners && (
        <svg
          className="absolute inset-0 z-30 pointer-events-none"
          width="100%"
          height="100%"
        >
          <polygon
            points={cardCorners.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="lime"
            strokeWidth="3"
          />
          {cardCorners.map((p, idx) => (
            <circle key={idx} cx={p.x} cy={p.y} r="6" fill="red" />
          ))}
        </svg>
      )}
    </div>
  );
}