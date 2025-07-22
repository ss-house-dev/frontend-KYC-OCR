// src/components/IdCardOcrUploader.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useRouter } from 'next/navigation';

// --- Tell TypeScript that a 'cv' global variable will exist ---
declare const cv: any;

// --- Interfaces and Static Components (No Changes) ---
interface OcrResult {
  identification_number?: string;
  name_th?: string;
  name_en?: string;
  date_of_birth?: string;
  date_of_expiry?: string;
  raw_text?: string;
}
type VerificationStatus = 'idle' | 'capturing' | 'preview' | 'processing';
const CardOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
    <div className="relative w-full max-w-lg" style={{ aspectRatio: '85.6 / 54' }}>
      <svg className="w-full h-full" viewBox="0 0 856 540" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="852" height="536" rx="40" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="4" strokeDasharray="20 10"/>
        <rect x="620" y="180" width="180" height="240" rx="20" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="3" />
        <path d="M665 295C665 278.431 678.431 265 695 265C711.569 265 725 278.431 725 295V305H665V295Z" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="3"/>
        <path d="M695 245C717.091 245 735 262.909 735 285V325C735 341.569 721.569 355 705 355H685C668.431 355 655 341.569 655 325V285C655 262.909 672.909 245 695 245Z" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="3"/>
        <rect x="100" y="240" width="100" height="80" rx="10" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="3" />
      </svg>
    </div>
  </div>
);
const videoConstraints = { width: 1280, height: 720, facingMode: "environment" };

// --- Main Component with Sharpness Detection ---
export default function IdCardOcrUploader() {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSharp, setIsSharp] = useState(false);
  const [sharpnessMsg, setSharpnessMsg] = useState('กำลังเตรียมกล้อง...');
  const [isCvReady, setIsCvReady] = useState(false); // State to track if OpenCV is loaded
  
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // โหลด OpenCV.js เมื่อคอมโพเนนต์ถูกติดตั้ง
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
      // After script is loaded, poll until the 'cv' object is available.
      const checkCv = setInterval(() => {
        if (typeof cv !== 'undefined') {
          clearInterval(checkCv);
          setIsCvReady(true);
        }
      }, 100);
    };
    script.onerror = () => {
        setError("ไม่สามารถโหลด Library สำหรับวิเคราะห์ภาพได้");
    }
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // ตรวจสอบความคมชัดของภาพทุก 500ms เมื่ออยู่ในสถานะ 'capturing'
  const analyzeClarity = useCallback(() => {
    if (!isCvReady || !webcamRef.current || !canvasRef.current) {
        setSharpnessMsg('OpenCV ยังไม่พร้อมใช้งาน');
        return;
    }

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

        // แปลงเป็น Grayscale
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // ---- ตรวจสอบความสว่างเฉลี่ย ----
        const meanBrightness = cv.mean(gray)[0];  // ค่าเฉลี่ย brightness (0-255)
        const BRIGHTNESS_THRESHOLD = 50;          // ปรับได้ตามสภาพแสงจริง

        if (meanBrightness < BRIGHTNESS_THRESHOLD) {
            setIsSharp(false);
            setSharpnessMsg('กรุณา Scan ตรงที่ที่มีแสงสว่าง');
            // cleanup();
            return;
        }

        // ---- ตรวจสอบความคมชัด (Laplacian Variance) ----
        const laplacian = new cv.Mat();
        cv.Laplacian(gray, laplacian, cv.CV_64F);

        const mean = new cv.Mat();
        const stdDev = new cv.Mat();
        cv.meanStdDev(laplacian, mean, stdDev);

        const variance = stdDev.data64F[0] * stdDev.data64F[0];
        const SHARPNESS_THRESHOLD = 80;

        if (variance < SHARPNESS_THRESHOLD) {
            setIsSharp(false);
            setSharpnessMsg('กรุณาถือบัตรนิ่งๆ');
        } else {
            setIsSharp(true);
            setSharpnessMsg('ภาพชัดเจนแล้ว ถ่ายได้เลย!');
        }
        // const src = cv.imread(canvas);
        // const gray = new cv.Mat();
        // cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        
        // const laplacian = new cv.Mat();
        // cv.Laplacian(gray, laplacian, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT);
        
        // const mean = new cv.Mat();
        // const stdDev = new cv.Mat();
        // cv.meanStdDev(laplacian, mean, stdDev);
        
        // const variance = stdDev.data64F[0] * stdDev.data64F[0];
        // const SHARPNESS_THRESHOLD = 80;

        // if (variance > SHARPNESS_THRESHOLD) {
        //     setIsSharp(true);
        //     setSharpnessMsg('ภาพชัดเจนแล้ว ถ่ายได้เลย!');
        // } 
        // else {
        //     setIsSharp(false);
        //     setSharpnessMsg('กรุณาถือกล้องให้นิ่งและหาแสงสว่าง');
        // }



        src.delete(); gray.delete(); laplacian.delete(); mean.delete(); stdDev.delete();

    } catch (err: any) {
        setSharpnessMsg("เกิดข้อผิดพลาดในการวิเคราะห์ภาพ");
    }
  }, [isCvReady]);

  // --- Component Lifecycle and State Management ---
  useEffect(() => {
    if (status === 'capturing' && isCvReady) {
      analysisIntervalRef.current = setInterval(analyzeClarity, 500);
    } else {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    }
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [status, analyzeClarity, isCvReady]);

  const startCamera = () => {
    setError(null);
    setCapturedImage(null);
    setIsSharp(false);
    setSharpnessMsg(isCvReady ? 'กำลังเปิดกล้อง...' : 'กำลังโหลด Library วิเคราะห์ภาพ...');
    setStatus('capturing');
  };

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setStatus('preview');
    }
  }, [webcamRef]);

  const handleSubmit = async () => {
    if (!capturedImage) return;
    setStatus('processing');
    setError(null);
    
    const response = await fetch(capturedImage);
    const blob = await response.blob();
    const file = new File([blob], "id_card_capture.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append('idCardImage', file);

    try {
      const apiResponse = await fetch('/api/ocr', { method: 'POST', body: formData });
      if (!apiResponse.ok) {
        const errData = await apiResponse.json();
        throw new Error(errData.error || `Server error: ${apiResponse.statusText}`);
      }
      const result = await apiResponse.json();
      if (result.success && result.data) {
        const params = new URLSearchParams();
        Object.entries(result.data).forEach(([key, value]) => {
          if (typeof value === 'string') params.append(key, value);
        });
        router.push(`/edit-form?${params.toString()}`);
      } else {
        throw new Error(result.error || 'ไม่สามารถประมวลผลหรือดึงข้อมูลได้');
      }
    } catch (err: any) {
      setStatus('preview');
      setError(err.message);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'capturing':
        return (
          <div className="relative w-full aspect-[9/16] max-h-[80vh] bg-black rounded-lg overflow-hidden">
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
        );
      
      case 'preview':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">ภาพที่ถ่ายได้</h2>
            {capturedImage && <img src={capturedImage} alt="Captured ID Card" className="rounded-lg" />}
            {error && <p className="p-4 text-center bg-red-900/50 text-red-300 rounded-lg">{error}</p>}
            <div className="flex gap-4">
              <button onClick={handleSubmit} className="flex-1 px-4 py-3 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700">ยืนยันและดึงข้อมูล</button>
              <button onClick={startCamera} className="flex-1 px-4 py-3 text-lg font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-500">ถ่ายใหม่</button>
            </div>
          </div>
        );

      case 'processing':
        return <div className="text-center text-white p-8 animate-pulse"><h2 className="text-2xl font-bold">กำลังดึงข้อมูลจากภาพ...</h2></div>;
        
      case 'idle':
      default:
        return (
            <div className="text-center space-y-4 p-4">
                <button onClick={startCamera} className="w-full px-4 py-3 text-lg font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">📷 เริ่มต้นถ่ายรูปบัตร</button>
            </div>
        );
    }
  };
  
  return (
    <div className="w-full max-w-lg p-4 md:p-8 mx-auto space-y-6 bg-gray-800 rounded-xl">
      <h1 className="text-3xl font-bold text-center text-white">ยืนยันตัวตนด้วยบัตรประชาชน</h1>
      {renderContent()}
    </div>
  );
}
