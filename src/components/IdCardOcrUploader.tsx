'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useRouter } from 'next/navigation';

// --- Tell TypeScript that a 'cv' global variable will exist ---
declare const cv: any;

// --- Static Components (ไม่เปลี่ยนแปลง) ---
const CardOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
    <div className="relative w-full max-w-lg" style={{ aspectRatio: '85.6 / 54' }}>
      <svg className="w-full h-full" viewBox="0 0 856 540" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="852" height="536" rx="40" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="4" strokeDasharray="20 10" />
        <rect x="620" y="180" width="180" height="240" rx="20" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="3" />
        <path d="M665 295C665 278.431 678.431 265 695 265C711.569 265 725 278.431 725 295V305H665V295Z" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="3" />
        <path d="M695 245C717.091 245 735 262.909 735 285V325C735 341.569 721.569 355 705 355H685C668.431 355 655 341.569 655 325V285C655 262.909 672.909 245 695 245Z" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="3" />
        <rect x="100" y="240" width="100" height="80" rx="10" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="3" />
      </svg>
    </div>
  </div>
);
const videoConstraints = { width: 1280, height: 720, facingMode: "environment" };

export default function CapturePage() {
  const [isSharp, setIsSharp] = useState(false);
  const [sharpnessMsg, setSharpnessMsg] = useState('กำลังเตรียมกล้อง...');
  const [isCvReady, setIsCvReady] = useState(false);

  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // โหลด OpenCV.js
  useEffect(() => {
    const scriptId = 'opencv-script';
    if (document.getElementById(scriptId)) {
      if (typeof cv !== 'undefined') setIsCvReady(true);
      return;
    }
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
    script.onerror = () => {
      setSharpnessMsg("ไม่สามารถโหลด Library วิเคราะห์ภาพได้");
    }
    document.body.appendChild(script);
    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) document.body.removeChild(existingScript);
    };
  }, []);

  // วิเคราะห์ความคมชัด
  const analyzeClarity = useCallback(() => {
    if (!isCvReady || !webcamRef.current || !canvasRef.current) return;
    const webcam = webcamRef.current;
    if (!webcam.video || webcam.video.readyState !== 4) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = webcam.video.videoWidth;
    canvas.height = webcam.video.videoHeight;
    ctx.drawImage(webcam.video, 0, 0, canvas.width, canvas.height);
    try {
      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      const meanBrightness = cv.mean(gray)[0];
      if (meanBrightness < 50) {
        setIsSharp(false);
        setSharpnessMsg('กรุณา Scan ตรงที่ที่มีแสงสว่าง');
        return;
      }
      const laplacian = new cv.Mat();
      cv.Laplacian(gray, laplacian, cv.CV_64F);
      const mean = new cv.Mat();
      const stdDev = new cv.Mat();
      cv.meanStdDev(laplacian, mean, stdDev);
      const variance = stdDev.data64F[0] * stdDev.data64F[0];
      if (variance < 80) {
        setIsSharp(false);
        setSharpnessMsg('กรุณาถือบัตรนิ่งๆ');
      } else {
        setIsSharp(true);
        setSharpnessMsg('ภาพชัดเจนแล้ว ถ่ายได้เลย!');
      }
      src.delete(); gray.delete(); laplacian.delete(); mean.delete(); stdDev.delete();
    } catch (err) {
      setSharpnessMsg("เกิดข้อผิดพลาดในการวิเคราะห์ภาพ");
    }
  }, [isCvReady]);

  // เริ่มการวิเคราะห์เมื่อกล้องพร้อม
  useEffect(() => {
    if (isCvReady) {
      analysisIntervalRef.current = setInterval(analyzeClarity, 500);
    }
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [isCvReady, analyzeClarity]);

  // ฟังก์ชันถ่ายรูป
  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // [การแก้ไข] บันทึกรูปลง sessionStorage แล้วไปหน้า preview
        sessionStorage.setItem('capturedIdCardImage', imageSrc);
        sessionStorage.setItem('imageSource', 'camera');
        router.push('/preview-id-card');
      }
    }
  }, [webcamRef, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative w-full aspect-[9/16] max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden">
        <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} className="w-full h-full object-cover" />
        <CardOverlay />
        <canvas ref={canvasRef} className="hidden"></canvas>
        <div className="absolute bottom-5 w-full px-4 space-y-2">
          <div className={`text-center p-2 rounded-md transition-colors ${isSharp ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
            <p className="text-white font-bold">{sharpnessMsg}</p>
          </div>
          <button onClick={handleCapture} disabled={!isSharp} className="w-16 h-16 mx-auto block bg-white rounded-full border-4 border-gray-400 focus:outline-none shadow-lg transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"></button>
        </div>
      </div>
    </div>
  );
}