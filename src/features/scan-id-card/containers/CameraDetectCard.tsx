"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ensureOpenCV } from "@/features/scan-id-card/libs/loadOpenCV";
import { useRouter } from "next/navigation";
import { CaptureButton } from "@/features/scan-id-card/components/CaptureButton";
import { BoxShadowMask } from "@/features/scan-id-card/components/BoxShadowMask";
import { FrameSVG } from "@/features/scan-id-card/components/FrameSVG";
import { ScanHeader } from "@/features/scan-id-card/components/ScanHeader";
import {
  drawQuad,
  drawFaceBoxFromFrac,
  type Pt,
  type Rect,
  type FracRect,
} from "@/features/scan-id-card/utils/drawOverlay";

declare const cv: any;

type DetectedQuad = { pts: Pt[]; area: number; ratio: number };

/** ==========================================================
 *  Tunables: ค่าปรับความเข้มงวดของการตรวจจับและพฤติกรรมโดยรวม
 *  - CARD_RATIO / CARD_RATIO_TOL: อัตราส่วนบัตรและค่าคลาดเคลื่อนที่ยอมรับ
 *  - MIN_AREA_FRAC: สัดส่วนพื้นที่ขั้นต่ำของคอนทัวร์เทียบทั้งเฟรม
 *  - STEADY_FRAMES / STEADY_TOL_PX: เงื่อนไขความนิ่งก่อน “พร้อมถ่าย”
 *  - INSIDE_COVERAGE: สัดส่วนพื้นที่สี่เหลี่ยมที่ต้องครอบคลุม guide
 *  - GUIDE_SCALE: ขนาดเฟรม fallback (กรณีไม่มีกรอบบนจอ)
 * ========================================================== */
const CARD_RATIO = 1.58;
const CARD_RATIO_TOL = 0.17;
const MIN_AREA_FRAC = 0.08;
const STEADY_FRAMES = 2;
const STEADY_TOL_PX = 12;
const INSIDE_COVERAGE = 0.85;
const GUIDE_SCALE = 0.42; // 🔧 ใช้ตอน fallback กำหนดสเกลกรอบกลางจอ (กรณีหา guide ไม่ได้)

// คงระยะชิดขวา/ล่างเดิม แล้วลดขนาดลง 15%
const RIGHT_MARGIN = 0.05;
const BOTTOM_MARGIN = 0.16;
const SCALE = 0.85;           // ย่อ 15%

const BASE_W = 0.216;
const BASE_H = 0.396;

const W = +(BASE_W * SCALE).toFixed(3); // 0.184
const H = +(BASE_H * SCALE).toFixed(3); // 0.337

export const FACE_BOX_FRAC = {
  x: +(1 - W - RIGHT_MARGIN).toFixed(3), // 0.766  (คงชิดขวาเท่าเดิม)
  y: +(1 - H - BOTTOM_MARGIN).toFixed(3),// 0.543  (คงชิดล่างเท่าเดิม)
  w: W,                                   // 0.184
  h: H,                                   // 0.337
} as const;

const CASCADE_FILE = "/haarcascade_frontalface_default.xml";
const CAPTURE_COOLDOWN_MS = 1200;

/** ==========================================================
 *  ตัวปรับ “ขนาดกรอบที่ผู้ใช้เห็น” ให้ตรงกับพิกัด guide คำนวณจริง
 *  - FRAME_PADDING_PCT: ต้องเท่ากับ padding ของ frameBoxRef (p-[3%])
 *  - FRAME_OVERSCAN_PCT: ต้องเท่ากับ overscan ของ <FrameSVG />
 *  จุดนี้มีผลต่อ “ความกว้าง/ความสูง ของกรอบนำทาง (guide)” โดยตรง
 * ========================================================== */
const FRAME_PADDING_PCT = 0.0; // 🔧 p-[3%] ของกล่องกรอบ
const FRAME_OVERSCAN_PCT = 0.01; // 🔧 ต้องเท่ากับ props ของ <FrameSVG overscanPct={0.05} />

export default function CameraDetectCard() {
  const router = useRouter();

  /** อ้างอิง DOM/Canvas/Loop */
  const videoRef = useRef<HTMLVideoElement>(null); // วิดีโอจากกล้อง
  const overlayRef = useRef<HTMLCanvasElement>(null); // overlay สำหรับวาดไกด์/ดีบัก
  const workRef = useRef<HTMLCanvasElement>(null); // แคนวาสงานเบื้องหลัง (ทำ OpenCV)
  const rafRef = useRef<number | null>(null); // requestAnimationFrame id

  /** พิกัด guide ล่าสุด (ใช้ครอปตอน capture) */
  const guideRef = useRef<Rect | null>(null);

  type FaceRect = { x: number; y: number; w: number; h: number };
  const faceRectRef = useRef<FaceRect | null>(null);

  /** Cascade (ถ้าใช้ตรวจใบหน้าหรืออื่น ๆ ต่อ) */
  const cascadeRef = useRef<any | null>(null);

  /** สถานะระบบ */
  const [ready, setReady] = useState(false); // OpenCV โหลดแล้วหรือยัง
  const [streaming, setStreaming] = useState(false); // กล้องกำลังทำงานหรือไม่

  /** ตัวจำความนิ่งของสี่เหลี่ยม (กันสั่น) */
  const steadyCountRef = useRef(0);
  const lastQuadRef = useRef<DetectedQuad | null>(null);

  /** กันทริกเกอร์ auto-capture ซ้ำ ๆ */
  const autoTriggeredRef = useRef(false);
  const lastCaptureAtRef = useRef(0);

  /** UI binding */
  const [statusMsg, setStatusMsg] = useState(
    "Please align your ID card in the frame."
  );
  const [frameColor, setFrameColor] = useState<"red" | "green" | "white">(
    "white"
  );
  const [canCapture, setCanCapture] = useState(false);

  /** ปุ่ม manual จะโผล่หลัง 10 วิ */
  const [manualVisible, setManualVisible] = useState(false);
  const manualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false); // mirror state canCapture เพื่อใช้ใน setTimeout

  /** กล่องกรอบที่ผู้ใช้เห็น (ใช้เป็น reference วาด guide) */
  const frameBoxRef = useRef<HTMLDivElement>(null);

  /** sync canCapture ลง ref (กัน race ใน setTimeout auto-capture) */
  useEffect(() => {
    readyRef.current = canCapture;
  }, [canCapture]);

  /** โหลด OpenCV และ cascade เมื่อ mount */
  useEffect(() => {
    (async () => {
      try {
        await ensureOpenCV();
        setReady(true);
        ensureCascadeLazy().catch(() => {});
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      stopLoop();
      stopCamera();
    };
  }, []);

  /** เปิดกล้องอัตโนมัติหลังพร้อม */
  useEffect(() => {
    if (ready && !streaming) {
      startCamera().catch((err) =>
        console.warn("Auto start camera failed:", err)
      );
    }
  }, [ready, streaming]);

  /** โชว์ปุ่ม manual ครบ 10 วิ */
  useEffect(() => {
    manualTimerRef.current = setTimeout(() => setManualVisible(true), 10_000);
    return () => {
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    };
  }, []);

  /** โหลดไฟล์ cascade (จาก public) เข้า FS ของ OpenCV.js หนึ่งครั้ง */
  async function ensureCascadeLazy() {
    if (cascadeRef.current) return;
    try {
      cv.FS_lookupPath("/haarcascade_frontalface_default.xml");
    } catch {
      const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
      const url = `${base}${CASCADE_FILE}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Cannot fetch cascade: ${resp.status}`);
      const buf = await resp.arrayBuffer();
      cv.FS_createDataFile(
        "/",
        "haarcascade_frontalface_default.xml",
        new Uint8Array(buf),
        true,
        false,
        false
      );
    }
    const cascade = new cv.CascadeClassifier();
    if (!cascade.load("/haarcascade_frontalface_default.xml")) {
      throw new Error("Failed to load cascade");
    }
    cascadeRef.current = cascade;
  }

  /** เปิดกล้อง + เริ่มลูปประมวลผล */
  async function startCamera() {
    if (!ready) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      setStreaming(true);

      // reset ตัววัด/สถานะต่าง ๆ
      steadyCountRef.current = 0;
      lastQuadRef.current = null;
      autoTriggeredRef.current = false;
      lastCaptureAtRef.current = 0;

      startLoop();
    } catch (err) {
      console.error("Camera error:", err);
      // alert("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้กล้อง");
    }
  }

  /** ปิดกล้อง */
  function stopCamera() {
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setStreaming(false);
  }

  /** เริ่มลูปอ่านเฟรมทีละภาพจากวิดีโอ แล้วประมวลผลด้วย OpenCV */
  function startLoop() {
    stopLoop();
    const loop = () => {
      processFrame();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }

  /** หยุดลูปประมวลผล */
  function stopLoop() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  /** แกนหลัก: ประมวลผล 1 เฟรม
   *  1) sync ขนาดแคนวาสกับวิดีโอ
   *  2) ดึงภาพเข้า work canvas → ImageData → cv.Mat
   *  3) ทำกรองขอบ + หาคอนทัวร์ + คัดสี่เหลี่ยมที่อัตราส่วนใกล้บัตร
   *  4) สร้าง guide จากกรอบบนจอ (frameBoxRef) ด้วยการหัก padding/overscan
   *  5) ตรวจว่าการ์ด “อยู่ใน guide” + “นิ่งพอ” → เปลี่ยนข้อความ/สี/สถานะ
   *  6) auto-capture ด้วยดีเลย์เล็ก ๆ + คูลดาวน์
   */
  function processFrame() {
    const v = videoRef.current;
    const overlay = overlayRef.current;
    const work = workRef.current;
    if (!v || !overlay || !work || !v.videoWidth || !v.videoHeight) return;

    // (1) sync canvas ขนาดให้เท่ากับวิดีโอจริง (พิกเซล)
    if (overlay.width !== v.videoWidth || overlay.height !== v.videoHeight) {
      overlay.width = v.videoWidth;
      overlay.height = v.videoHeight;
    }
    if (work.width !== v.videoWidth || work.height !== v.videoHeight) {
      work.width = v.videoWidth;
      work.height = v.videoHeight;
    }

    // (2) copy เฟรมวิดีโอลง work canvas แล้วดึง ImageData
    const wctx = work.getContext("2d")!;
    wctx.drawImage(v, 0, 0, work.width, work.height);
    const frame = wctx.getImageData(0, 0, work.width, work.height);

    // (3) ตรวจจับสี่เหลี่ยม (บัตร) ด้วย OpenCV
    let matRGBA: any,
      gray: any,
      blur: any,
      edges: any,
      contours: any,
      hierarchy: any;
    let best: DetectedQuad | null = null;

    // ตัวแปรสถิติระหว่างหา contour
    let anyQuad4 = false;
    let maxAreaSeen = 0;
    let minRatioErrSeen = Infinity;
    let meanGrayVal = 128;

    try {
      matRGBA = cv.matFromImageData(frame);
      gray = new cv.Mat();
      cv.cvtColor(matRGBA, gray, cv.COLOR_RGBA2GRAY, 0);

      // ค่าแสงเฉลี่ย (ไว้แจ้งเตือนสว่าง/มืดเกิน)
      try {
        meanGrayVal = (cv.mean ? cv.mean(gray)[0] : 128) as number;
      } catch {}

      // กรองเบลอเล็กน้อย + หาขอบ
      blur = new cv.Mat();
      cv.GaussianBlur(gray, blur, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);

      edges = new cv.Mat();
      cv.Canny(blur, edges, 50, 150);

      // หา contour ภายนอกสุด
      contours = new cv.MatVector();
      hierarchy = new cv.Mat();
      cv.findContours(
        edges,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );

      // คัดเฉพาะ contour ที่มีพื้นที่มากพอ
      const areaMin = work.width * work.height * MIN_AREA_FRAC;
      for (let i = 0; i < contours.size(); i++) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt, false);
        maxAreaSeen = Math.max(maxAreaSeen, area);
        if (area < areaMin) {
          cnt.delete();
          continue;
        }

        // simplify เป็นโพลิกอน แล้วคัดสี่เหลี่ยม
        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

        if (approx.rows === 4) {
          anyQuad4 = true;
          const pts: Pt[] = [];
          for (let r = 0; r < 4; r++)
            pts.push({ x: approx.intPtr(r, 0)[0], y: approx.intPtr(r, 0)[1] });
          const o = orderCorners(pts);
          const w = dist(o[0], o[1]);
          const h = dist(o[0], o[3]);
          const ratio = w / Math.max(h, 1);

          minRatioErrSeen = Math.min(
            minRatioErrSeen,
            Math.abs(ratio - CARD_RATIO)
          );

          // ผ่านเงื่อนไขอัตราส่วน → เลือกอันที่ใหญ่ที่สุดเป็นตัวแทน
          if (Math.abs(ratio - CARD_RATIO) <= CARD_RATIO_TOL) {
            const cand: DetectedQuad = { pts: o, area, ratio };
            if (!best || cand.area > best.area) best = cand;
          }
        }

        approx.delete();
        cnt.delete();
      }
    } finally {
      hierarchy?.delete?.();
      contours?.delete?.();
      edges?.delete?.();
      blur?.delete?.();
      gray?.delete?.();
      matRGBA?.delete?.();
    }

    // (4) วาด guide จากตำแหน่งกล่องบนจอ (frameBoxRef) → พิกัดบน overlay canvas
    const octx = overlay.getContext("2d")!;
    octx.clearRect(0, 0, overlay.width, overlay.height);

    // ✅ จุดนี้คือ “ที่มาของความกว้าง/ความสูงของกรอบนำทาง (guide)”
    //    - ใช้ FRAME_PADDING_PCT และ FRAME_OVERSCAN_PCT ในการ “หัก” พื้นที่
    //    - จากนั้นบังคับอัตราส่วน ID1 แล้วค่อยจัดให้อยู่กึ่งกลาง
    const guide = drawGuideFromBox(octx, overlay, frameBoxRef.current!, {
      shrinkPct: 0, // 🔧 ย่อเพิ่มเติมจากขอบใน (เริ่ม 0 เพื่อให้ตรงกรอบที่เห็น)
      heightBiasPct: 0, // 🔧 bias ความสูง (เริ่ม 0)
      color: "rgba(255,255,255,0.25)",
      lineWidth: 2,
      draw: true,
    });

    guideRef.current = guide;

    // วาดกรอบ FACE_BOX_FRAC (core + outer) ให้เห็นตำแหน่งคร่าว ๆ ของใบหน้า
    drawFaceBoxFromFrac(octx, guide, FACE_BOX_FRAC, {
      marginPct: 0.08, // ให้ตรงกับตอน fallback crop
      coreColor: "rgba(255,255,255,0.95)",
      coreWidth: 2,
      outerColor: "rgba(0,200,255,0.9)", // เส้นขอบนอก (รวม margin)
      outerWidth: 2,
      dash: [6, 6], // เส้นประสำหรับ outer
    });

    // (5) สร้างข้อความ/สถานะ สำหรับ UI และตัดสินใจ “พร้อมถ่าย” หรือยัง
    let msg = "Please align your ID card in the frame.";
    let readyNow = false;

    if (!best) {
      // ยังไม่เจอสี่เหลี่ยมที่ผ่านอัตราส่วน
      if (!anyQuad4) msg = "Please align your ID card in the frame.";
      else if (maxAreaSeen < work.width * work.height * MIN_AREA_FRAC)
        msg = "Please align your ID card in the frame.";

      if (meanGrayVal < 60) {
        msg = "Image is too dark. Please try again.";
        readyNow = false;
      }
      if (meanGrayVal > 200) {
        msg = "Image is too bright. Please try again.";
        readyNow = false;
      }

      steadyCountRef.current = 0;
      lastQuadRef.current = null;
    } else {
      // มีผู้สมัคร (best) → เช็คว่าอยู่ใน guide และนิ่งพอหรือไม่
      const inside = isQuadInside(best.pts, guide, INSIDE_COVERAGE);
      const steady = isSteady(best, lastQuadRef.current, STEADY_TOL_PX);
      lastQuadRef.current = best; // อัปเดตผู้สมัครล่าสุด

      const readySoon = inside && steadyCountRef.current + 1 >= STEADY_FRAMES;

      // วาดเส้นไฮไลต์สี่เหลี่ยมที่ตรวจพบ (เขียวเข้มถ้าใกล้พร้อม)
      const color = readySoon
        ? "rgba(16,185,129,0.95)"
        : "rgba(255,255,255,0.7)";
      // drawQuad(octx, best.pts, color, 4); // 🔧 ปิดดีบักเส้นสี่เหลี่ยมที่ตรวจพบ

      // นับเฟรมที่นิ่งติดต่อกัน
      const nextCount = inside && steady ? steadyCountRef.current + 1 : 0;
      steadyCountRef.current = nextCount;

      if (!inside) msg = "Please align your ID card in the frame.";
      // else if (!steady) msg = "Please hold steady";
      else if (nextCount >= STEADY_FRAMES) {
        msg = "Image is ready to capture.";
        readyNow = true;
      }
    }

    let hasFaceInCard: boolean | null = null;

    if (best && cascadeRef.current) {
      // ROI ของบัตรในพิกัดเต็มเฟรม
      const roiX = Math.max(
        0,
        Math.floor(Math.min(...best.pts.map((p) => p.x)))
      );
      const roiY = Math.max(
        0,
        Math.floor(Math.min(...best.pts.map((p) => p.y)))
      );
      const roiW = Math.min(
        work.width - roiX,
        Math.ceil(Math.max(...best.pts.map((p) => p.x)) - roiX)
      );
      const roiH = Math.min(
        work.height - roiY,
        Math.ceil(Math.max(...best.pts.map((p) => p.y)) - roiY)
      );

      if (roiW > 10 && roiH > 10) {
        // เตรียม Mat สำหรับ ROI
        const src = cv.matFromImageData(
          work.getContext("2d")!.getImageData(roiX, roiY, roiW, roiH)
        );
        const gray2 = new cv.Mat();
        cv.cvtColor(src, gray2, cv.COLOR_RGBA2GRAY);

        const faces = new cv.RectVector();
        const cascade = cascadeRef.current as any;
        cascade.detectMultiScale(gray2, faces, 1.2, 3, 0, new cv.Size(24, 24));

        if (faces.size() > 0) {
          // เลือกหน้าที่ "พื้นที่มากสุด"
          let bestIdx = 0,
            bestArea = -1;
          for (let i = 0; i < faces.size(); i++) {
            const r = faces.get(i);
            const area = r.width * r.height;
            if (area > bestArea) {
              bestArea = area;
              bestIdx = i;
            }
          }
          const r = faces.get(bestIdx);

          // เก็บเป็น "พิกัดเต็มเฟรม"
          faceRectRef.current = {
            x: roiX + r.x,
            y: roiY + r.y,
            w: r.width,
            h: r.height,
          };
          hasFaceInCard = true;

          // ดีบัก (เส้นสีฟ้า)
          const dbg = overlay.getContext("2d")!;
          dbg.strokeStyle = "rgba(0,200,255,0.9)";
          dbg.lineWidth = 3;
          dbg.strokeRect(
            faceRectRef.current.x,
            faceRectRef.current.y,
            r.width,
            r.height
          );
        } else {
          faceRectRef.current = null;
          hasFaceInCard = false;
        }

        faces.delete();
        gray2.delete();
        src.delete();
      }
    }

    // ถ้าต้องการ "บังคับว่าต้องเห็นหน้า" ถึงจะพร้อมถ่าย → รวมเข้ากับ msg/readyNow
    if (hasFaceInCard === false) {
      // msg = "Ensure the portrait side is visible.";
      readyNow = false;
    }

    // อัปเดต UI
    setStatusMsg(msg);
    setCanCapture(readyNow);

    let uiColor: "red" | "green" | "white";

    if (msg === "Image is ready to capture.") {
      uiColor = "green";
    } else if (msg === "Please align your ID card in the frame.") {
      uiColor = "white";
    } else if (
      msg === "Image is too dark. Please try again." ||
      msg === "Image is too bright. Please try again."
    ) {
      uiColor = "red";
    } else {
      uiColor = "red";
    }

    setFrameColor(uiColor);

    // (6) Auto-capture พร้อมดีเลย์เล็กน้อย + คูลดาวน์
    const now = Date.now();
    if (!readyNow) {
      autoTriggeredRef.current = false;
      return;
    }
    if (
      !autoTriggeredRef.current &&
      now - lastCaptureAtRef.current >= CAPTURE_COOLDOWN_MS
    ) {
      autoTriggeredRef.current = true;
      lastCaptureAtRef.current = now;
      setTimeout(() => {
        if (readyRef.current) {
          const g = guideRef.current!;
          captureAndRoute(v, g);
        }
      }, 150);
    }
  }

  /** จับภาพจากวิดีโอทั้งเฟรม แล้ว “ครอปด้วย guide” → ส่งไปหน้า preview */
  function captureAndRoute(videoEl: HTMLVideoElement, guide: Rect) {
    // ทั้งเฟรม
    const full = document.createElement("canvas");
    full.width = videoEl.videoWidth;
    full.height = videoEl.videoHeight;
    full.getContext("2d")!.drawImage(videoEl, 0, 0, full.width, full.height);

    // ===== A) DETECTED FACE: ครอปจากผลตรวจจับ (เดิม) =====
    let faceCropped = false;
    if (faceRectRef.current) {
      const face = faceRectRef.current;

      // ขยาย margin รอบหน้าเล็กน้อย
      const m = Math.round(Math.max(face.w, face.h) * 0.15);
      const sx = face.x - m;
      const sy = face.y - m;
      const sw = face.w + m * 2;
      const sh = face.h + m * 2;

      const bounded = clampRectToBounds(
        sx,
        sy,
        sw,
        sh,
        full.width,
        full.height
      );
      if (bounded.w > 4 && bounded.h > 4) {
        const faceCv = document.createElement("canvas");
        faceCv.width = bounded.w;
        faceCv.height = bounded.h;
        faceCv
          .getContext("2d")!
          .drawImage(
            full,
            bounded.x,
            bounded.y,
            bounded.w,
            bounded.h,
            0,
            0,
            bounded.w,
            bounded.h
          );
        const faceData = faceCv.toDataURL("image/jpeg", 0.92);
        sessionStorage.setItem("capturedFaceImage", faceData);
        sessionStorage.setItem("capturedFaceRect", JSON.stringify(bounded));
        faceCropped = true;
      }
    }

    // ===== B) FALLBACK: ไม่พบใบหน้า → ครอปจากสัดส่วนบน "การ์ด (guide)" =====
    if (!faceCropped && guide) {
      // คำนวณกล่องใบหน้าในพิกัดเต็มเฟรม โดยอิงจากกรอบการ์ด (guide)
      const fx = Math.round(guide.x + guide.w * FACE_BOX_FRAC.x);
      const fy = Math.round(guide.y + guide.h * FACE_BOX_FRAC.y);
      const fw = Math.round(guide.w * FACE_BOX_FRAC.w);
      const fh = Math.round(guide.h * FACE_BOX_FRAC.h);

      // ขยาย margin อีกนิดเพื่อให้ครอบหัว-ไหล่
      const margin = Math.round(Math.max(fw, fh) * 0.08);
      const bounded = clampRectToBounds(
        fx - margin,
        fy - margin,
        fw + margin * 2,
        fh + margin * 2,
        full.width,
        full.height
      );

      if (bounded.w > 4 && bounded.h > 4) {
        const faceCv = document.createElement("canvas");
        faceCv.width = bounded.w;
        faceCv.height = bounded.h;
        faceCv
          .getContext("2d")!
          .drawImage(
            full,
            bounded.x,
            bounded.y,
            bounded.w,
            bounded.h,
            0,
            0,
            bounded.w,
            bounded.h
          );
        const faceData = faceCv.toDataURL("image/jpeg", 0.92);
        sessionStorage.setItem("capturedFaceImage", faceData);
        sessionStorage.setItem("capturedFaceRect", JSON.stringify(bounded));
        // (ไม่มี flag แยกก็ได้—downstream จะรู้เพียงว่าเรามีภาพหน้าแล้ว)
      } else {
        // กรณีผิดปกติจริงๆ ก็ล้างทิ้ง
        sessionStorage.removeItem("capturedFaceImage");
        sessionStorage.removeItem("capturedFaceRect");
      }
    }

    // ===== เดิม: ครอป "บัตร" ด้วย guide =====
    const card = document.createElement("canvas");
    card.width = guide.w;
    card.height = guide.h;
    card
      .getContext("2d")!
      .drawImage(
        full,
        guide.x,
        guide.y,
        guide.w,
        guide.h,
        0,
        0,
        guide.w,
        guide.h
      );

    const imgData = card.toDataURL("image/jpeg", 0.92);
    sessionStorage.setItem("capturedIdCardImage", imgData);
    sessionStorage.setItem("imageSource", "camera");

    router.push("/preview-id-card");
    stopLoop();
  }

  /** -------------------- Helpers -------------------- */

  /** เรียงจุดมุมของสี่เหลี่ยม: TL, TR, BR, BL */
  function orderCorners(pts: Pt[]): Pt[] {
    const sum = pts.map((p) => p.x + p.y);
    const diff = pts.map((p) => p.y - p.x);
    return [
      pts[sum.indexOf(Math.min(...sum))], // top-left
      pts[diff.indexOf(Math.min(...diff))], // top-right
      pts[sum.indexOf(Math.max(...sum))], // bottom-right
      pts[diff.indexOf(Math.max(...diff))], // bottom-left
    ];
  }

  function dist(a: Pt, b: Pt) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /** จุดกึ่งกลางของสี่เหลี่ยม (ใช้วัดการสั่น) */
  function centroid(q: DetectedQuad) {
    return {
      x: q.pts.reduce((s, p) => s + p.x, 0) / 4,
      y: q.pts.reduce((s, p) => s + p.y, 0) / 4,
    };
  }

  /** เช็คความนิ่งเทียบกับเฟรมก่อนหน้า: ระยะ centroid + อัตราส่วนต้องไม่ต่างมาก */
  function isSteady(
    curr: DetectedQuad,
    prev: DetectedQuad | null,
    tolPx: number
  ) {
    if (!prev) return false; // เฟรมแรกยังไม่มีมาตรฐานเทียบ → ให้ไม่ผ่านก่อน
    const c1 = centroid(curr),
      c0 = centroid(prev);
    return (
      Math.hypot(c1.x - c0.x, c1.y - c0.y) < tolPx &&
      Math.abs(curr.ratio - prev.ratio) < 0.05
    );
  }

  /** เช็คว่าสี่เหลี่ยมอยู่ “ใน guide” และพื้นที่ครอบคลุมพอ */
  function isQuadInside(pts: Pt[], rect: Rect, coverage = 0.85) {
    // ต้องอยู่ในสี่เหลี่ยม guide ทั้ง 4 มุม
    if (
      !pts.every(
        (p) =>
          p.x >= rect.x &&
          p.x <= rect.x + rect.w &&
          p.y >= rect.y &&
          p.y <= rect.y + rect.h
      )
    )
      return false;

    // ใช้ bounding box ของสี่เหลี่ยมเทียบพื้นที่ guide (ประมาณค่าแบบเร็ว)
    const xs = pts.map((p) => p.x),
      ys = pts.map((p) => p.y);
    const bx = Math.min(...xs),
      by = Math.min(...ys);
    const bw = Math.max(...xs) - bx,
      bh = Math.max(...ys) - by;
    const cov = (bw * bh) / (rect.w * rect.h);
    return cov >= coverage && cov <= 1.15; // เผื่อ overshoot เล็กน้อย
  }

  type DrawFromBoxOpts = {
    shrinkPct?: number; // 🔧 ย่อกรอบจากพื้นที่ใน (ยิ่งมาก → guide แคบลง)
    heightBiasPct?: number; // 🔧 bias ใช้ความสูงเป็นตัวกำหนดมากขึ้น
    color?: string;
    lineWidth?: number;
    draw?: boolean;
  };

  /** คำนวณกรอบนำทาง (guide) จากกล่องกรอบที่ผู้ใช้เห็น (frameBoxRef)
   *  ขั้นตอน:
   *   - map พิกัด DOM → overlay canvas
   *   - หัก padding (%) ที่กำหนดไว้ใน class ของ frameBoxRef
   *   - หัก overscan (%) ให้พอดีกับเส้นกรอบที่วาดด้วย <FrameSVG />
   *   - (ออปชัน) shrink เพิ่มเติมอีกชั้น
   *   - บังคับอัตราส่วน ID-1 แล้ววางกึ่งกลาง
   *
   *  จุดปรับ “ความกว้าง/ความสูงของกรอบจริง”:
   *   1) FRAME_PADDING_PCT (ดึงจาก p-[x%] ของ frameBoxRef)  🔧
   *   2) FRAME_OVERSCAN_PCT (ต้องเท่ากับ <FrameSVG overscanPct>) 🔧
   *   3) shrinkPct (ออปชัน) ย่อกรอบในสุดเพิ่ม                 🔧
   *   4) CSS ของ frameBoxRef: w-[88vw] / max-w-[420px] / aspect[...] 🔧
   */
  function drawGuideFromBox(
    ctx: CanvasRenderingContext2D,
    overlayEl: HTMLCanvasElement,
    boxEl: HTMLDivElement,
    opts: DrawFromBoxOpts = {}
  ): Rect {
    const {
      shrinkPct = 0, // เริ่ม 0 เพื่อให้ guide ตรงกับกรอบที่เห็น
      heightBiasPct = 0, // เริ่ม 0 (ค่อยปรับถ้าต้องการ)
      color = "rgba(255,255,255,0.25)",
      lineWidth = 2,
      draw = false, // ไม่วาดบน overlay
    } = opts;

    // DOMRect ของ overlay และกล่องกรอบ (หน่วย CSS px)
    const ovr = overlayEl.getBoundingClientRect();
    const box = boxEl.getBoundingClientRect();

    // สัดส่วนแปลง CSS → พิกัดแคนวาส (พิกเซลจริงของวิดีโอ)
    const scaleX = overlayEl.width / ovr.width;
    const scaleY = overlayEl.height / ovr.height;

    // กล่องด้านนอก (รวม padding)
    const boxX = (box.left - ovr.left) * scaleX;
    const boxY = (box.top - ovr.top) * scaleY;
    const boxW = box.width * scaleX;
    const boxH = box.height * scaleY;

    // 1) หัก padding 3% รอบด้าน → ได้พื้นที่ “ด้านใน” ของกล่อง
    const padX = boxW * FRAME_PADDING_PCT; // 🔧 ปรับ padding ได้ที่ FRAME_PADDING_PCT
    const padY = boxH * FRAME_PADDING_PCT;
    const innerX = boxX + padX;
    const innerY = boxY + padY;
    const innerW = boxW - padX * 2;
    const innerH = boxH - padY * 2;

    // 2) หัก overscan ให้พอดีกับเส้นกรอบ <FrameSVG />
    const overX = innerW * FRAME_OVERSCAN_PCT; // 🔧 ปรับ overscan ได้ที่ FRAME_OVERSCAN_PCT
    const overY = innerH * FRAME_OVERSCAN_PCT;
    const ovX = innerX + overX;
    const ovY = innerY + overY;
    const ovW = innerW - overX * 2;
    const ovH = innerH - overY * 2;

    // 3) (ออปชัน) ย่อพื้นที่ในอีกชั้นด้วย shrinkPct
    const pad = Math.min(ovW, ovH) * shrinkPct; // 🔧 ยิ่งมาก guide ยิ่งแคบ
    const inW = Math.max(1, ovW - pad * 2);
    const inH = Math.max(1, ovH - pad * 2);
    const inX = ovX + pad;
    const inY = ovY + pad;

    // 4) บังคับอัตราส่วนบัตร ID-1 แล้วคำนวนกว้าง/สูงให้ “พอดี” พื้นที่ใน
    const ID1_RATIO = 85.6 / 53.98;
    const biasedH = inH * (1 + heightBiasPct); // 🔧 bias ความสูง
    const w_byH = biasedH * ID1_RATIO;

    let guideW: number, guideH: number;
    if (w_byH <= inW) {
      // จำกัดด้วยความสูง (กรณีนี้จะได้ความกว้างที่สอดคล้องกับ ID1_RATIO)
      guideW = Math.round(w_byH);
      guideH = Math.round(guideW / ID1_RATIO);
    } else {
      // จำกัดด้วยความกว้าง
      guideW = Math.round(inW);
      guideH = Math.round(guideW / ID1_RATIO);
    }

    // 5) จัดให้อยู่กึ่งกลาง
    const x = Math.round(inX + (inW - guideW) / 2);
    const y = Math.round(inY + (inH - guideH) / 2);

    // วาดกรอบนำทาง
    if (draw) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(x, y, guideW, guideH);
      ctx.restore();
    }
    return { x, y, w: guideW, h: guideH };
  }

  /** ปุ่มถ่ายแบบ manual: ใช้ guide ล่าสุด ถ้ายังไม่มีให้คำนวนแบบไม่วาด
   *  ถ้า overlay/box ยังไม่พร้อม → fallback ครอปกลางจอตาม GUIDE_SCALE
   */
  const handleManualCaptureAnytime = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !v.videoHeight) return;

    let g = guideRef.current;
    if (!g) {
      const overlayEl = overlayRef.current;
      const boxEl = frameBoxRef.current;
      if (overlayEl && boxEl) {
        const octx = overlayEl.getContext("2d")!;
        g = drawGuideFromBox(octx, overlayEl, boxEl, {
          shrinkPct: 0.06, // 🔧 manual-capture ยอมย่อกรอบเพิ่มเล็กน้อย
          draw: false,
          color: "rgba(255,255,255,0.25)",
          lineWidth: 2,
        });
        guideRef.current = g;
      } else {
        // 🔧 fallback: ปรับ GUIDE_SCALE เพื่อให้กรอบ fallback ใหญ่/เล็กลง
        const guideH = Math.min(
          v.videoHeight * GUIDE_SCALE,
          v.videoWidth * GUIDE_SCALE
        );
        const guideW = Math.round(guideH * CARD_RATIO);
        const x = Math.round((v.videoWidth - guideW) / 2);
        const y = Math.round((v.videoHeight - guideH) / 2);
        g = { x, y, w: guideW, h: guideH };
      }
    }

    captureAndRoute(v, g!);
  }, []);

  function clampRectToBounds(
    x: number,
    y: number,
    w: number,
    h: number,
    maxW: number,
    maxH: number
  ) {
    const sx = Math.max(0, Math.min(x, maxW - 1));
    const sy = Math.max(0, Math.min(y, maxH - 1));
    const ex = Math.max(sx + 1, Math.min(x + w, maxW));
    const ey = Math.max(sy + 1, Math.min(y + h, maxH));
    return {
      x: Math.round(sx),
      y: Math.round(sy),
      w: Math.round(ex - sx),
      h: Math.round(ey - sy),
    };
  }

  /** ============================== UI ============================== */
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* วิดีโอเต็มจอ (object-cover) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover z-10"
      />

      {/* กล่องกรอบกลาง + มาสก์ + เฮดเดอร์ + เส้นกรอบ (FrameSVG) */}
      <div
        ref={frameBoxRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                  w-[92vw]  /* เดิม 88vw → 92vw */
    max-w-[460px] /* เดิม 420px → 460px */
    aspect-[8.8/5.6] z-30 p-[3%]" // 🔧 CSS ที่กำหนดความกว้าง/สูงหลักของกรอบ
      >
        {/* เงามืดรอบนอก (กำหนด inset ได้) → มีผลต่อภาพที่เห็น แต่ guide จะหักออกในคำนวณแล้ว */}
        <BoxShadowMask
          radius={14}
          inset={{ top: "-0.5%", right: "4%", bottom: "-0.5%", left: "4%" }}
          opacity={0.55}
        />

        {/* ข้อความสถานะ (สว่าง/มืด/นิ่ง/พร้อมถ่าย) */}
        <ScanHeader sharpnessMsg={statusMsg} />

        {/* เส้นกรอบที่ผู้ใช้เห็น (สีแดง/เขียว) */}
        <div className="absolute inset-0 pointer-events-none">
          <FrameSVG color={frameColor} overscanPct={0.05} />{" "}
          {/* 🔧 overscan ต้องตรงกับ FRAME_OVERSCAN_PCT */}
        </div>
      </div>

      {/* ปุ่มถ่าย: ตรึงล่างหน้าจอ (อยู่นอกกล่อง aspect) */}
      <div
        className="fixed inset-x-0 z-[90] pointer-events-none"
        style={{ bottom: "max(env(safe-area-inset-bottom, 0px), 24px)" }}
      >
        <div className="flex justify-center pointer-events-auto">
          <CaptureButton onClick={handleManualCaptureAnytime} isReady={true} />
        </div>
      </div>

      {/* overlay สำหรับวาด guide/ดีบัก (ทับบนวิดีโอ) */}
      {/* <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[80]"
      /> */}
      {/* ซ่อนแคนวาสดีบัก */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[80] opacity-0"
      />

      {/* work canvas ซ่อน (ใช้กับ OpenCV) */}
      <canvas ref={workRef} className="hidden" />
    </div>
  );
}
