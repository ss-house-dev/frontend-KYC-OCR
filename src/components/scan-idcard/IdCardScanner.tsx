'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

// --- บอกให้ TypeScript รู้ว่าจะมีตัวแปร global ชื่อ 'cv' ---
declare const cv: any;

const videoConstraints = { width: 1280, height: 720, facingMode: "environment" };

const FrameSVG = ({ color }: { color: 'red' | 'green' }) => {
  const strokeColor = color === 'green' ? '#22c55e' : '#ef4444'; // tailwind green-500 / red-500
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 300 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <path
        d="M25 3H8C5.23858 3 3 5.23858 3 8V25M3 187V165C3 187 5.23857 187 8 187H25M275 3H292C294.761 3 297 5.23858 297 8V25M297 187V165C297 187 294.761 187 292 187H275"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
};

interface IdCardScannerProps {
  onCapture: (image: string) => void;
  onStatusChange: (status: string, frameColor: 'red' | 'green') => void;
  frameColor: string;
  sharpnessMsg: string;
}

export default function IdCardScanner({ onCapture, onStatusChange, frameColor, sharpnessMsg }: IdCardScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCvReady, setIsCvReady] = useState(false);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  const scriptId = 'opencv-script';
  // ถ้ามี cv อยู่แล้ว ให้ setIsCvReady ทันที
  if (typeof window !== 'undefined' && typeof cv !== 'undefined') {
    setIsCvReady(true);
    return;
  }
  // ถ้ายังไม่มี script ให้เพิ่ม script
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://docs.opencv.org/4.9.0/opencv.js';
    script.async = true;
    script.onload = () => {
      const checkCv = setInterval(() => {
        if (typeof cv !== 'undefined') {
          clearInterval(checkCv);
          setIsCvReady(true);
        }
      }, 100);
    };
    script.onerror = () => onStatusChange("เกิดข้อผิดพลาดในการโหลด OpenCV", 'red');
    document.body.appendChild(script);
  } else {
    // ถ้ามี script แล้ว ให้รอจน cv พร้อม
    const checkCv = setInterval(() => {
      if (typeof cv !== 'undefined') {
        clearInterval(checkCv);
        setIsCvReady(true);
      }
    }, 100);
    return () => clearInterval(checkCv);
  }
  // ไม่ต้องลบ script ตอน unmount
}, [onStatusChange]);

  const analyzeCard = useCallback(() => {
    const webcam = webcamRef.current;
    const canvas = canvasRef.current;
    if (!isCvReady || !webcam || !canvas || !webcam.video || webcam.video.readyState !== 4) {
      return;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = webcam.video.videoWidth;
    canvas.height = webcam.video.videoHeight;
    ctx.drawImage(webcam.video, 0, 0, canvas.width, canvas.height);
    try {
        const src = cv.imread(canvas);
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        if (cv.mean(gray)[0] < 50) {
            onStatusChange("กรุณา Scan ในที่ที่มีแสงสว่างเพียงพอ", 'red');
            src.delete(); gray.delete();
            return;
        }
        const edges = new cv.Mat();
        cv.Canny(gray, edges, 50, 150);
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        let cardFound = false;
        for (let i = 0; i < contours.size(); ++i) {
            const contour = contours.get(i);
            const peri = cv.arcLength(contour, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(contour, approx, 0.03 * peri, true);
            if (approx.rows === 4) {
                const rect = cv.boundingRect(approx);
                const aspectRatio = rect.width / rect.height;
                if (rect.width > 200 && rect.height > 100 && aspectRatio > 1.4 && aspectRatio < 1.8) {
                    cardFound = true;
                    const screenshot = webcamRef.current?.getScreenshot();
                    if(screenshot) onCapture(screenshot);
                    break;
                }
            }
            approx.delete();
        }
        if (cardFound) {
            onStatusChange("ตรวจพบบัตรแล้ว!", 'green');
        } else {
            onStatusChange("กรุณาจัดบัตรให้อยู่ในกรอบ", 'red');
        }
        src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
    } catch (err) {
        console.error(err);
        onStatusChange("เกิดข้อผิดพลาดในการวิเคราะห์", 'red');
    }
  }, [isCvReady, onCapture, onStatusChange]);

  useEffect(() => {
    if (isCvReady) {
        analysisIntervalRef.current = setInterval(analyzeCard, 1000);
    }
    return () => {
        if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [isCvReady, analyzeCard]);

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden"></canvas>

      {/* --- Overlay Container: fixed aspect ratio, centered --- */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88vw] max-w-[420px] aspect-[8.8/5.6] z-10 flex items-center justify-center p-[3%]">
        {/* Hole effect: darken outside, keep inside clear */}
        <div className="absolute inset-0 rounded-[25px] pointer-events-none" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }} />
        {/* ข้อความแนะนำ (แจ้งเตือน) อยู่เหนือ FrameSVG */}
        <div className="absolute -top-20 left-2 right-2 z-30 flex justify-center">
          <div className="inline-block border-2 border-dashed border-white text-center p-2 rounded-lg transition-colors">
            <p className="text-white font-semibold text-sm">{sharpnessMsg}</p>
          </div>
        </div>
        {/* Red/green frame - now fills the padded area */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[89%] h-[89%] flex items-center justify-center">
            <FrameSVG color={frameColor === 'green' ? 'green' : 'red'} />
          </div>
        </div>
        {/* CARD IDENT SVG - fills the same padded area */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <img src="/CARD IDENT.svg" alt="ID Card" className="w-10/12 h-10/12 object-contain filter invert brightness-200" />
        </div>
      </div>
    </div>
  );
}
