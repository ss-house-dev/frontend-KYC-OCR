"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { useRouter } from 'next/navigation';

// ให้ TypeScript ทราบว่า cv จะมีอยู่
declare const cv: any;

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment",
};

// กรอบมุมโค้ง
const FrameSVG = ({ color }: { color: "red" | "green" }) => {
  const stroke = color === "green" ? "#22c55e" : "#ef4444";
  return (
    <svg className="w-full h-full" viewBox="0 0 300 190" fill="none">
      <path
        d="M25 3H8C5.24 3 3 5.24 3 8V25M3 187V165C3 187 5.24 187 8 187H25
           M275 3H292C294.76 3 297 5.24 297 8V25M297 187V165C297 187 294.76 187 292 187H275"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
};

interface Props {
  onCapture: (img: string) => void;
  onStatusChange: (msg: string, color: "red" | "green") => void;
  frameColor: "red" | "green";
  sharpnessMsg: string;
}

export default function IdCardScanner({
  onCapture,
  onStatusChange,
  frameColor,
  sharpnessMsg,
}: Props) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cvReady, setCvReady] = useState(false);
  const [readyToShoot, setReadyToShoot] = useState(false); // true เฉพาะข้อ 4
  const timer = useRef<NodeJS.Timeout | null>(null);

  /* ---------- โหลด OpenCV ---------- */
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
    s.onerror = () => onStatusChange("ไม่สามารถโหลด OpenCV", "red");
    document.body.appendChild(s);
  }, [onStatusChange]);

  /* ---------- วิเคราะห์เฟรมกล้องทุก 0.7 วิ ---------- */
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

    try {
      const src = cv.imread(cvs);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      /* ---------- 2 : Too dark / 3 : Too bright ---------- */
      const mean = cv.mean(gray)[0];
      if (mean < 60) {
        setReadyToShoot(false);
        onStatusChange("Too dark, Can’t read the card", "red");
        src.delete();
        gray.delete();
        return;
      }
      if (mean > 200) {
        setReadyToShoot(false);
        onStatusChange("Too bright, Can’t read the card", "red");
        src.delete();
        gray.delete();
        return;
      }

      /* ---------- ตรวจหาบัตรในเฟรม ---------- */
      const edges = new cv.Mat();
      cv.Canny(gray, edges, 50, 150);
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
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
          // เงื่อนไขขนาด/อัตราส่วนของบัตร
          if (r.width > 200 && r.height > 100 && ratio > 1.4 && ratio < 1.9) {
            found = true;
            break;
          }
        }
        approx.delete();
      }

      if (found) {
        /* ---------- 4 : Ready to capture ---------- */
        setReadyToShoot(true);
        onStatusChange("Ready to capture", "green");
      } else {
        /* ---------- 1 : ยังไม่อยู่ในกรอบ ---------- */
        setReadyToShoot(false);
        onStatusChange("Please keep your card in frame", "red");
      }

      // clean
      src.delete();
      gray.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();
    } catch (e) {
      console.error(e);
      setReadyToShoot(false);
      onStatusChange("เกิดข้อผิดพลาดในการวิเคราะห์", "red");
    }
  }, [cvReady, onStatusChange]);

  useEffect(() => {
    if (cvReady) {
      timer.current = setInterval(analyse, 700);
    }
    return () => {
      if (timer.current) {
        clearInterval(timer.current); // <- คืนค่า void แน่นอน
      }
    };
  }, [cvReady, analyse]);

  const router = useRouter();

  /* ---------- กดถ่าย ---------- */
  const shoot = () => {
    const img = webcamRef.current?.getScreenshot();
    if (img) {
      onCapture(img);
      // บันทึกรูปลง sessionStorage แล้วไปหน้า preview
      sessionStorage.setItem('capturedIdCardImage', img);
      sessionStorage.setItem('imageSource', 'camera');
      router.push('/preview-id-card');
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="relative w-full h-full min-h-screen bg-black ">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* กรอบ/รูเบลอ */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88vw] max-w-[420px] aspect-[8.8/5.6] z-10 p-[3%]">
        {/* mask ทำให้รอบนอกทึบ/เบลอ */}
        <div
          className="absolute inset-0 rounded-[25px] pointer-events-none"
          style={{ boxShadow: "0 0 0 2000px rgba(0,0,0,0.55)" }}
        />

        {/* กรอบข้อความ */}
        <div className="absolute -top-20 left-2 right-2 flex justify-center z-30">
          <div
            className={`inline-block border-2 border-dashed ${frameColor === "green" ? "border-green-500" : "border-red-500"
              } text-center p-2 rounded-lg`}
          >
            <p className="text-white font-semibold text-sm">{sharpnessMsg}</p>
          </div>
        </div>

        {/* กรอบมุมโค้ง */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[89%] h-[89%]">
            <FrameSVG color={frameColor} />
          </div>
        </div>

        {/* รูปไกด์บัตร */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/CARD IDENT.svg"
            className="w-10/12 h-10/12 object-contain filter invert brightness-200"
          />
        </div>

        {/* ปุ่มถ่าย – แสดงเฉพาะเมื่อ ready */}

        <button
          onClick={shoot}
          className={`absolute -bottom-44 left-1/2 -translate-x-1/2
                        w-14 h-14 rounded-full border-4 border-gray-300 shadow-lg
                        transition-all duration-300

                        ${readyToShoot
              ? "bg-white opacity-100 blur-0 cursor-pointer" // << สภาพพร้อมถ่าย (ชัด)
              : "bg-white/60  cursor-not-allowed"
            }`}
          disabled={!readyToShoot}
        />
      </div>
    </div>
  );
}
