"use client";

import React, { useEffect, useRef } from "react";
import type { DetectionResult, FaceScanState, LM } from "../configs/type";
import { CONFIG } from "../configs/constant";
import { Step1Validator } from "../utils/validators/step1Validator";
import { Step2Validator } from "../utils/validators/step2Validator";
import {
  applySharpenToImageData,
  banner,
  roundedRect,
  alertFrame,
  drawLandmarks,
} from "../utils/canvasDraw";

const SHOW_OVERLAY = true;
// NOTE: เดิม 0 = ยังวาดแต่โปร่งใส → ปรับเป็น short-circuit เพื่อลดงาน
const OVERLAY_VISUAL_ALPHA = 0; // 0 = มองไม่เห็น, 1 = ปกติ

// ==== helper: mobile flag
const isAndroid =
  typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
const isIOS =
  typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod/i.test(navigator.userAgent);

// ====== ค่าจาก CONFIG สำหรับ Landmarks ======
const LM_CFG = (CONFIG as any).LANDMARKS ?? {};
const LM_MODE: "nose" | "all" = (LM_CFG.MODE as any) ?? "nose";
const LM_SHOW_STEP1: boolean = LM_CFG.SHOW_IN_STEP1 ?? true;
const LM_SHOW_STEP2: boolean = LM_CFG.SHOW_IN_STEP2 ?? true;
const LM_COLOR: string = LM_CFG.COLOR ?? "#00ff00";
const LM_RADIUS: number = LM_CFG.RADIUS ?? 3;

// ——— overlay throttle (กำหนดเฟรมเรตของ overlay เอง)
const OVERLAY_FPS = 10; // 8–12 กำลังดีบนมือถือ
const OVERLAY_INTERVAL_MS = Math.round(1000 / OVERLAY_FPS);

interface VideoCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  state: FaceScanState;
  detectionResults: DetectionResult[];
  videoElement?: HTMLVideoElement;
}

export function VideoCanvas({
  canvasRef,
  state,
  detectionResults,
  videoElement,
}: VideoCanvasProps) {
  // เก็บค่า “ล่าสุด” ใน ref เพื่อลูป rAF หยิบไปใช้ โดยไม่ต้อง re-render
  const latestStateRef = useRef(state);
  const latestDetRef = useRef(detectionResults);
  const latestVideoRef = useRef(videoElement);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);
  useEffect(() => {
    latestDetRef.current = detectionResults;
  }, [detectionResults]);
  useEffect(() => {
    latestVideoRef.current = videoElement;
  }, [videoElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ใช้ willReadFrequently ลด GC/CPU
    const ctx =
      (canvas.getContext("2d", {
        willReadFrequently: true,
      }) as CanvasRenderingContext2D | null) ?? undefined;
    if (!ctx) return;

    // ลดงาน smoothing
    ctx.imageSmoothingEnabled = true;

    let rafId = 0;
    let lastOverlayAt = 0;

    const draw = (t: number) => {
      const v = latestVideoRef.current;

      const W = canvas.width;
      const H = canvas.height;

      // ถ้ายังไม่มีวิดีโอ หรือยังไม่มีเฟรม (HAVE_CURRENT_DATA < 2) ให้ข้ามไปก่อน
      if (!v || v.readyState < 2) {
        rafId = requestAnimationFrame(draw);
        return;
      }
      try {
        // 1) วาดภาพจากวิดีโอ
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform แทน save/restore ซ้ำๆ
        ctx.clearRect(0, 0, W, H);
        if (CONFIG.CAMERA.MIRRORED_INPUT) {
          ctx.setTransform(-1, 0, 0, 1, W, 0); // mirror (fast)
        }
        ctx.drawImage(v, 0, 0, W, H);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // คืนสภาพ (เผื่อ overlay บางอันไม่ต้อง mirror)

        // 2) วาด overlay แบบ throttle
        const now = performance.now();
        if (SHOW_OVERLAY && now - lastOverlayAt >= OVERLAY_INTERVAL_MS) {
          const st = latestStateRef.current;
          const dets = latestDetRef.current;

          // ถ้า OVERLAY_VISUAL_ALPHA === 0: ข้าม overlay ทั้งหมด (ลดงานสุดๆ)
          if (OVERLAY_VISUAL_ALPHA > 0) {
            if (st.step === 1) {
              drawStep1Throttled(ctx, dets, W, H);
            } else if (st.step === 2) {
              drawStep2Throttled(ctx, dets[0], st, W, H);
            } else if (st.step === 3) {
              ctx.globalAlpha = OVERLAY_VISUAL_ALPHA;
              banner(ctx, " ", 60);
              ctx.globalAlpha = 1;
            }

            // crosshair ด้านบน
            drawCrosshair(ctx, W / 2, H / 2 + H * 0.1, 14, 2, "#22c55e");
          }

          lastOverlayAt = now;
        }
      } catch (_) {
        // กันไว้ไม่ให้ error เฟรมเดียวพังลูป
      } finally {
        rafId = requestAnimationFrame(draw);
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={CONFIG.DISPLAY.WIDTH}
      height={CONFIG.DISPLAY.HEIGHT}
      className="absolute inset-0 w-full h-full z-0"
    />
  );
}

/* ============ ฟังก์ชันวาดแบบ “เบา” ============ */

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 14,
  lineWidth = 2,
  color = "#22c55e"
) {
  ctx.save();
  ctx.globalAlpha = OVERLAY_VISUAL_ALPHA;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

function drawStep1Throttled(
  ctx: CanvasRenderingContext2D,
  detectionResults: DetectionResult[],
  canvasWidth: number,
  canvasHeight: number
) {
  const validation = Step1Validator.validateStep1(
    detectionResults,
    canvasWidth,
    canvasHeight
  );

  ctx.save();
  ctx.globalAlpha = OVERLAY_VISUAL_ALPHA;

  alertFrame(
    ctx,
    validation.isValid ? "rgba(255,255,255,1)" : "rgba(255,0,0,1)",
    3
  );

  // วาด bbox แบบบางลง
  for (const d of detectionResults) {
    const bbox = d.bbox;
    if (!bbox) continue; // ไม่มี bbox ก็ข้าม

    const [x, y, w, h] = bbox; // ตอนนี้เป็น number ทั้งหมดตาม type
    roundedRect(ctx, x, y, w, h, 10, validation.color, 1.5);
  }

  // Landmarks: ลดจำนวนจุดเมื่อ MODE=all
  if (LM_SHOW_STEP1) {
    for (const d of detectionResults) {
      const lms = d.landmarks;
      if (!lms) continue;
      if (LM_MODE === "nose") {
        drawNoseOnly(ctx, lms, canvasWidth, canvasHeight);
      } else {
        const sparse = sparseLandmarks(lms, 0.35); // วาด ~35% ของจุด
        drawLandmarks(ctx, sparse as any, LM_RADIUS, LM_COLOR);
      }
    }
  }

  if (validation.message) banner(ctx, validation.message, 72);

  ctx.restore();

  // Sharpen: ปิดบนมือถือ (หนักมาก)
  if (!isAndroid && !isIOS && CONFIG.SHARPEN.ENABLED) {
    const pipW = 160,
      pipH = 120;
    const sx = canvasWidth - pipW;
    const sy = canvasHeight - pipH;
    const pip = ctx.getImageData(sx, sy, pipW, pipH);
    const sharpened = applySharpenToImageData(pip, CONFIG.SHARPEN.KERNEL);
    ctx.putImageData(sharpened, sx, sy);
  }
}

function drawStep2Throttled(
  ctx: CanvasRenderingContext2D,
  detection: DetectionResult | undefined,
  state: FaceScanState,
  canvasWidth: number,
  canvasHeight: number
) {
  if (!detection || state.phase === "-") return;
  const lms = detection.landmarks;
  if (!lms) return;

  ctx.save();
  ctx.globalAlpha = OVERLAY_VISUAL_ALPHA;

  if (LM_SHOW_STEP2) {
    if (LM_MODE === "nose") {
      drawNoseOnly(ctx, lms, canvasWidth, canvasHeight);
    } else {
      const sparse = sparseLandmarks(lms, 0.35);
      drawLandmarks(ctx, sparse as any, LM_RADIUS, LM_COLOR);
    }
  }

  const instruction = Step2Validator.getPhaseInstruction(state.phase as any);
  banner(ctx, instruction, 110);

  // debug text บาง ๆ
  const nose = lms[1];
  if (nose) {
    let xPx = nose.x * canvasWidth;
    const yPx = nose.y * canvasHeight;
    if (CONFIG.CAMERA.MIRRORED_INPUT) xPx = canvasWidth - xPx;
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;

    ctx.fillStyle = "white";
    ctx.font = "14px system-ui";
    ctx.fillText(
      `phase: ${state.phase} | dx: ${(xPx - cx).toFixed(1)} dy: ${(yPx - cy).toFixed(1)}`,
      10,
      52
    );

    alertFrame(ctx, "rgba(255,255,255,0.5)", 3);
  }

  // mouth phase banner
  if (state.phase === "mouth" && detection.marValue !== null) {
    banner(ctx, "Now, please close your mouth", 138);
  }

  ctx.restore();
}

/* ===== helpers ===== */
const NOSE_LANDMARKS = [1, 2, 97, 326, 6, 197];
function drawNoseOnly(
  ctx: CanvasRenderingContext2D,
  landmarks: LM[],
  W: number,
  H: number,
  radius = LM_RADIUS,
  color = LM_COLOR
) {
  ctx.fillStyle = color;
  for (const idx of NOSE_LANDMARKS) {
    const pt = landmarks[idx];
    if (!pt) continue;
    ctx.beginPath();
    ctx.arc(pt.x * W, pt.y * H, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function sparseLandmarks(lms: LM[], keepRatio = 0.35): LM[] {
  // ดึงมาเฉพาะบางจุด เพื่อลดจำนวน path
  const out: LM[] = [];
  const step = Math.max(1, Math.floor(1 / keepRatio));
  for (let i = 0; i < lms.length; i += step) {
    const p = lms[i];
    if (p) out.push(p);
  }
  return out;
}
