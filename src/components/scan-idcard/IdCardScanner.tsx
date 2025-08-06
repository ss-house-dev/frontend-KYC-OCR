"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";

// To inform TypeScript that 'cv' will exist
declare const cv: any;

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment",
};

// --- Paths to required files in the /public folder ---
const GARUDA_TEMPLATE_URL = "/garuda_template.png";
const FACE_CASCADE_URL = "/haarcascade_frontalface_default.xml";
const FACE_CASCADE_FILE_NAME = "haarcascade_frontalface_default.xml";

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

const sortCorners = (corners: { x: number; y: number }[]) => {
  corners.sort((a, b) => a.y - b.y);
  const top = corners.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = corners.slice(2, 4).sort((a, b) => b.x - a.x);
  return [top[0], top[1], bottom[0], bottom[1]];
};

const createFileFromUrl = async (path: string, url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const data = await response.arrayBuffer();
  const data_arr = new Uint8Array(data);
  cv.FS_createDataFile("/", path, data_arr, true, false, false);
};

export default function IdCardScanner({
  onCapture,
  onStatusChange,
  frameColor,
  sharpnessMsg,
}: Props) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cvReady, setCvReady] = useState(false);
  const [readyToShoot, setReadyToShoot] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const isLoadingModels = useRef(false);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const cardCornersRef = useRef<any>(null);
  const faceCascadeRef = useRef<any>(null);
  const garudaTemplateRef = useRef<any>(null);

  /* ---------- Load OpenCV ---------- */
  useEffect(() => {
    if (typeof cv !== "undefined" && cv.imread) {
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
        if (typeof cv !== "undefined" && cv.imread) {
          clearInterval(iv);
          setCvReady(true);
        }
      }, 100);
    };
    s.onerror = () => onStatusChange("ไม่สามารถโหลด OpenCV", "red");
    document.body.appendChild(s);
  }, [onStatusChange]);

  /* ---------- Load Models ---------- */
  useEffect(() => {
    if (cvReady && !modelsLoaded && !isLoadingModels.current) {
      isLoadingModels.current = true;

      const loadModels = async () => {
        try {
          // Load Garuda Template
          await new Promise<void>((resolve, reject) => {
            const templateImg = new Image();
            templateImg.src = GARUDA_TEMPLATE_URL;
            templateImg.onload = () => {
              const originalTemplate = cv.imread(templateImg);
              const resizedTemplate = new cv.Mat();
              const safeSize = new cv.Size(80, 80);
              cv.resize(
                originalTemplate,
                resizedTemplate,
                safeSize,
                0,
                0,
                cv.INTER_AREA
              );
              garudaTemplateRef.current = resizedTemplate;
              originalTemplate.delete();
              resolve();
            };
            templateImg.onerror = (err) =>
              reject(new Error(`Failed to load garuda template: ${err}`));
          });

          // Load Face Cascade
          await createFileFromUrl(FACE_CASCADE_FILE_NAME, FACE_CASCADE_URL);
          const cascade = new cv.CascadeClassifier();
          if (cascade.load(FACE_CASCADE_FILE_NAME)) {
            faceCascadeRef.current = cascade;
          } else {
            cascade.delete();
            throw new Error("Failed to load face cascade file.");
          }

          setModelsLoaded(true);
          console.log("All models loaded successfully.");
        } catch (err) {
          console.error("Error loading models:", err);
          onStatusChange("เกิดข้อผิดพลาดในการโหลดไฟล์โมเดล", "red");
        } finally {
          isLoadingModels.current = false;
        }
      };
      loadModels();
    }
  }, [cvReady, modelsLoaded]);

  /* ---------- Cleanup on Unmount ---------- */
  useEffect(() => {
    return () => {
      console.log("Cleaning up OpenCV models...");
      faceCascadeRef.current?.delete();
      garudaTemplateRef.current?.delete();
    };
  }, []);

  /* ---------- Analyze Camera Frame ---------- */
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
    let src, gray;
    try {
      src = cv.imread(cvs);
      gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      const meanBrightness = cv.mean(gray)[0];
      if (meanBrightness < 60 || meanBrightness > 200) {
        onStatusChange(meanBrightness < 60 ? "Too dark" : "Too bright", "red");
        setReadyToShoot(false);
        return;
      }
      const laplacian = new cv.Mat();
      cv.Laplacian(gray, laplacian, cv.CV_64F);
      const meanStdDev = new cv.Mat();
      const stdDev = new cv.Mat();
      cv.meanStdDev(laplacian, meanStdDev, stdDev);
      const sharpness = stdDev.data64F[0] ** 2;
      laplacian.delete();
      meanStdDev.delete();
      stdDev.delete();
      if (sharpness < 80) {
        onStatusChange("Image is too blurry", "red");
        setReadyToShoot(false);
        return;
      }
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
      edges.delete();
      hierarchy.delete();
      let cardFound = false;
      let bestContour = null;
      for (let i = 0; i < contours.size(); i++) {
        const c = contours.get(i);
        const peri = cv.arcLength(c, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(c, approx, 0.03 * peri, true);
        if (approx.rows === 4) {
          const r = cv.boundingRect(approx);
          if (r.width > 200 && r.height > 100 && r.width / r.height > 1.4) {
            cardFound = true;
            bestContour = approx.clone();
            approx.delete();
            break;
          }
        }
        approx.delete();
      }
      contours.delete();
      if (cardFound && bestContour) {
        cardCornersRef.current = bestContour;
        setReadyToShoot(true);
        onStatusChange("Ready to capture", "green");
      } else {
        cardCornersRef.current = null;
        setReadyToShoot(false);
        onStatusChange("Please keep your card in frame", "red");
      }
    } finally {
      src?.delete();
      gray?.delete();
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

  /* ---------- Shoot and Verify with Color Heuristics ---------- */
  const shoot = async () => {
    if (timer.current) clearInterval(timer.current);

    if (!webcamRef.current || !canvasRef.current || !cardCornersRef.current) {
      onStatusChange("ส่วนประกอบไม่พร้อม, กรุณาลองใหม่", "red");
      timer.current = setInterval(analyse, 700);
      return;
    }

    onStatusChange("Verifying card features...", "green");
    setReadyToShoot(false);

    const cam = webcamRef.current;
    const cvs = canvasRef.current;
    const video = cam?.video;
    if (!cvs || !video || video.readyState !== 4) {
      onStatusChange("กล้องไม่พร้อม กรุณาลองใหม่", "red");
      setReadyToShoot(true);
      timer.current = setInterval(analyse, 700);
      return;
    }
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    cvs.width = video.videoWidth;
    cvs.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, cvs.width, cvs.height);

    const src = cv.imread(cvs);
    const warped = new cv.Mat();
    const finalImage = new cv.Mat();

    try {
      // ✨✨✨ ส่วนที่เพิ่มเข้ามา: ตรวจสอบความพร้อมของไลบรารีก่อนใช้งาน ✨✨✨
      if (
        typeof cv.COLOR_RGBA2HSV !== "number" ||
        typeof cv.COLOR_RGBA2YCrCb !== "number" ||
        typeof cv.COLOR_RGBA2GRAY !== "number"
      ) {
        throw new Error("OpenCV color constants not fully loaded.");
      }

      // --- 1. ดึงภาพบัตรให้ตรงและตัดขอบ (Warp and Pad) ---
      const cornersMat = cardCornersRef.current;
      const cornerPoints = [];
      for (let i = 0; i < cornersMat.data32S.length; i += 2) {
        cornerPoints.push({
          x: cornersMat.data32S[i],
          y: cornersMat.data32S[i + 1],
        });
      }
      const sortedCorners = sortCorners(cornerPoints);
      const padding = 30;
      const cardWidth = 856;
      const cardHeight = 540;
      const outputWidth = cardWidth + padding * 2;
      const outputHeight = cardHeight + padding * 2;
      const srcCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
        sortedCorners[0].x,
        sortedCorners[0].y,
        sortedCorners[1].x,
        sortedCorners[1].y,
        sortedCorners[2].x,
        sortedCorners[2].y,
        sortedCorners[3].x,
        sortedCorners[3].y,
      ]);
      const dstCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
        padding,
        padding,
        cardWidth + padding,
        padding,
        cardWidth + padding,
        cardHeight + padding,
        padding,
        cardHeight + padding,
      ]);
      const M = cv.getPerspectiveTransform(srcCorners, dstCorners);
      const dsize = new cv.Size(outputWidth, outputHeight);
      cv.warpPerspective(
        src,
        warped,
        M,
        dsize,
        cv.INTER_LINEAR,
        cv.BORDER_CONSTANT,
        new cv.Scalar()
      );
      srcCorners.delete();
      dstCorners.delete();
      M.delete();

      // --- 2. ตรวจสอบพื้นหลังสีฟ้า (Blue Background Check) ---
      let isBlueBgFound = false;
      const bgRoiRect = new cv.Rect(300 + padding, 300 + padding, 150, 100);
      const bgROI = warped.roi(bgRoiRect);
      const hsvBg = new cv.Mat();
      cv.cvtColor(bgROI, hsvBg, cv.COLOR_RGBA2HSV);
      const lowerBlue = new cv.Mat(
        hsvBg.rows,
        hsvBg.cols,
        hsvBg.type(),
        [90, 50, 150, 0]
      );
      const upperBlue = new cv.Mat(
        hsvBg.rows,
        hsvBg.cols,
        hsvBg.type(),
        [130, 255, 255, 255]
      );
      const blueMask = new cv.Mat();
      cv.inRange(hsvBg, lowerBlue, upperBlue, blueMask);
      const bluePercentage =
        (cv.countNonZero(blueMask) / (bgROI.rows * bgROI.cols)) * 100;
      if (bluePercentage > 70) {
        isBlueBgFound = true;
      }
      bgROI.delete();
      hsvBg.delete();
      lowerBlue.delete();
      upperBlue.delete();
      blueMask.delete();

      // --- 3. ตรวจสอบโซนสีผิว (Skin Tone Check) ---
      let isSkinToneFound = false;
      const skinRoiRect = new cv.Rect(590 + padding, 270 + padding, 250, 300);
      const skinROI = warped.roi(skinRoiRect);
      const ycrcbSkin = new cv.Mat();
      cv.cvtColor(skinROI, ycrcbSkin, cv.COLOR_RGBA2YCrCb);
      const lowerSkin = new cv.Mat(
        ycrcbSkin.rows,
        ycrcbSkin.cols,
        ycrcbSkin.type(),
        [0, 135, 85, 0]
      );
      const upperSkin = new cv.Mat(
        ycrcbSkin.rows,
        ycrcbSkin.cols,
        ycrcbSkin.type(),
        [255, 180, 135, 255]
      );
      const skinMask = new cv.Mat();
      cv.inRange(ycrcbSkin, lowerSkin, upperSkin, skinMask);
      const skinPercentage =
        (cv.countNonZero(skinMask) / (skinROI.rows * skinROI.cols)) * 100;
      if (skinPercentage > 55) {
        isSkinToneFound = true;
      }
      skinROI.delete();
      ycrcbSkin.delete();
      lowerSkin.delete();
      upperSkin.delete();
      skinMask.delete();

      // --- 4. สรุปผลและปรับปรุงภาพ ---
      if (isBlueBgFound && isSkinToneFound) {
        // ทำการปรับปรุงคุณภาพภาพ
        const gray = new cv.Mat();
        cv.cvtColor(warped, gray, cv.COLOR_RGBA2GRAY);
        const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
        clahe.apply(gray, finalImage);
        clahe.delete();
        const sharpenKernel = cv.matFromArray(
          3,
          3,
          cv.CV_32F,
          [0, -1, 0, -1, 5, -1, 0, -1, 0]
        );
        cv.filter2D(finalImage, finalImage, cv.CV_8U, sharpenKernel);
        sharpenKernel.delete();
        gray.delete();

        const outputCanvas = document.createElement("canvas");
        cv.imshow(outputCanvas, finalImage);
        const correctedImage = outputCanvas.toDataURL("image/jpeg");
        onCapture(correctedImage);
      } else {
        onStatusChange(
          `Card check failed (Blue BG: ${isBlueBgFound}, Skin Tone: ${isSkinToneFound})`,
          "red"
        );
        setReadyToShoot(true);
        timer.current = setInterval(analyse, 700);
      }
    } catch (e) {
      console.error("Verification failed", e);
      onStatusChange("การตรวจสอบผิดพลาด โปรดลองอีกครั้ง", "red");
      setReadyToShoot(true);
      timer.current = setInterval(analyse, 700);
    } finally {
      src.delete();
      warped.delete();
      finalImage.delete();
    }
  };
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
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[88vw] max-w-[420px] aspect-[8.8/5.6] z-10 p-[3%]">
        <div
          className="absolute inset-0 rounded-[25px] pointer-events-none"
          style={{ boxShadow: "0 0 0 2000px rgba(0,0,0,0.55)" }}
        />
        <div className="absolute -top-20 left-2 right-2 flex justify-center z-30">
          <div
            className={`inline-block border-2 border-dashed ${
              frameColor === "green" ? "border-green-500" : "border-red-500"
            } text-center p-2 rounded-lg`}
          >
            <p className="text-white font-semibold text-sm">{sharpnessMsg}</p>
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[89%] h-[89%]">
            <FrameSVG color={frameColor} />
          </div>
        </div>
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

                        ${
                          readyToShoot
                            ? "bg-white opacity-100 blur-0 cursor-pointer" // << สภาพพร้อมถ่าย (ชัด)
                            : "bg-white/60  cursor-not-allowed"
                        }`}
          disabled={!readyToShoot}
        />
      </div>
    </div>
  );
}
