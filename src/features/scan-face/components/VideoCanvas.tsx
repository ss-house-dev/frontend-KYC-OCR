"use client";

import React, { useEffect } from "react";
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

const SHOW_OVERLAY = true; // true = วาดกรอบ, ข้อความ, landmarks

/** ทำให้ overlay วาดจริงแต่โปร่งใส (ยังคงคำนวณ/เรียกฟังก์ชันวาดครบ) */
const OVERLAY_VISUAL_ALPHA = 0; // 0 = มองไม่เห็น, 1 = ปกติ
function withOverlayAlpha(ctx: CanvasRenderingContext2D, draw: () => void) {
  if (!SHOW_OVERLAY) return;
  ctx.save();
  ctx.globalAlpha *= OVERLAY_VISUAL_ALPHA;
  draw();
  ctx.restore();
}

/** ====== ค่าจาก CONFIG สำหรับ Landmarks ====== */
const LM_CFG = (CONFIG as any).LANDMARKS ?? {};
const LM_MODE: "nose" | "all" = (LM_CFG.MODE as any) ?? "nose";
const LM_SHOW_STEP1: boolean = LM_CFG.SHOW_IN_STEP1 ?? true;
const LM_SHOW_STEP2: boolean = LM_CFG.SHOW_IN_STEP2 ?? true;
const LM_COLOR: string = LM_CFG.COLOR ?? "#00ff00";
const LM_RADIUS: number = LM_CFG.RADIUS ?? 3;

/** เครื่องหมายบวกกลางจอ (วาดหลัง restore เพื่อไม่โดน mirror) */
function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 14,
  lineWidth = 3,
  color = "#22c55e"
) {
  ctx.save();
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

/** ดัชนีจมูก */
const NOSE_LANDMARKS = [1, 2, 97, 326, 6, 197];

function drawNoseLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: LM[],
  canvasWidth: number,
  canvasHeight: number,
  radius = LM_RADIUS,
  color = LM_COLOR
) {
  ctx.save();
  ctx.fillStyle = color;
  for (const idx of NOSE_LANDMARKS) {
    const pt = landmarks[idx];
    if (!pt) continue;
    ctx.beginPath();
    ctx.arc(pt.x * canvasWidth, pt.y * canvasHeight, radius, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

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
  useEffect(() => {
    if (!canvasRef.current || !videoElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    // 1) วาดภาพจากวิดีโอ (ตามการ mirror ที่ตั้งไว้)
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (CONFIG.CAMERA.MIRRORED_INPUT) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 2) Overlay per step (ยังคงคำนวณ/เรียกฟังก์ชันวาด แต่ทำให้โปร่งใส)
    if (state.step === 1) {
      drawStep1(ctx, detectionResults, canvas.width, canvas.height);
    } else if (state.step === 2) {
      drawStep2(ctx, detectionResults[0], state, canvas.width, canvas.height);
    } else if (state.step === 3) {
      withOverlayAlpha(ctx, () => {
        banner(ctx, " ", 60);
      });
    }

    // 3) crosshair กลางจอ (บนสุด)
    withOverlayAlpha(ctx, () => {
      drawCrosshair(
        ctx,
        canvas.width / 2,
        canvas.height / 2 + canvas.height * 0.1, // ➜ เลื่อนลง 10% ของความสูง
        14,
        2,
        "#22c55e"
      );
    });
  }, [state, detectionResults, videoElement, canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={CONFIG.DISPLAY.WIDTH}
      height={CONFIG.DISPLAY.HEIGHT}
      className="absolute inset-0 w-full h-full z-0"
    />
  );
}

/* ====== Step 1 UI ====== */
function drawStep1(
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

  // วาดกรอบ/ข้อความ/landmarks แบบโปร่งใส (ยังคงเรียกฟังก์ชันวาดครบ)
  withOverlayAlpha(ctx, () => {
    alertFrame(
      ctx,
      validation.isValid ? "rgba(255,255,255,1)" : "rgba(255,0,0,1)",
      4
    );

    detectionResults.forEach((detection) => {
      if (detection.bbox) {
        const [x, y, w, h] = detection.bbox;
        roundedRect(ctx, x, y, w, h, 12, validation.color, 2);
      }
    });

    if (LM_SHOW_STEP1) {
      detectionResults.forEach((d) => {
        const lms = d.landmarks; // LM[] | null
        if (!lms) return;        // แคบชนิดให้เป็น LM[]
        if (LM_MODE === "nose") {
          drawNoseLandmarks(ctx, lms, canvasWidth, canvasHeight);
        } else {
          drawLandmarks(ctx, lms as any, LM_RADIUS, LM_COLOR);
        }
      });
    }

    if (validation.message) {
      banner(ctx, validation.message, 80);
    }
  });

  // NOTE: sharpen/PiP ปล่อยวาดปกติ (ไม่ใช่กรอบ/ข้อความ/landmarks)
  if (CONFIG.SHARPEN.ENABLED) {
    const pipW = 160,
      pipH = 120;
    const sx = canvasWidth - pipW;
    const sy = canvasHeight - pipH;
    const pip = ctx.getImageData(sx, sy, pipW, pipH);
    const sharpened = applySharpenToImageData(pip, CONFIG.SHARPEN.KERNEL);
    ctx.putImageData(sharpened, sx, sy);
  }
}

/* ====== Step 2 UI: แสดง overlay/ดีบัก (การเปลี่ยนเฟสทำใน useFaceMesh แล้ว) ====== */
function drawStep2(
  ctx: CanvasRenderingContext2D,
  detection: DetectionResult | undefined,
  state: FaceScanState,
  canvasWidth: number,
  canvasHeight: number
) {
  if (!detection || state.phase === "-") return;

  const lms = detection.landmarks; // LM[] | null
  if (!lms) return;                // แคบชนิดให้เป็น LM[] ต่อจากนี้

  // Landmarks (โปร่งใส)
  withOverlayAlpha(ctx, () => {
    if (LM_SHOW_STEP2) {
      if (LM_MODE === "nose") {
        drawNoseLandmarks(ctx, lms, canvasWidth, canvasHeight);
      } else {
        drawLandmarks(ctx, lms as any, LM_RADIUS, LM_COLOR);
      }
    }
  });

  // ข้อความคำสั่งของเฟส (โปร่งใส)
  const instruction = Step2Validator.getPhaseInstruction(state.phase as any);
  withOverlayAlpha(ctx, () => {
    banner(ctx, instruction, 120);
  });

  // คำนวณ metric ต่อ (ไม่เกี่ยวกับการแสดงผล)
  const noseIdx = 1;
  const nose = lms[noseIdx];
  if (nose) {
    let xPx = nose.x * canvasWidth;
    const yPx = nose.y * canvasHeight;
    if (CONFIG.CAMERA.MIRRORED_INPUT) xPx = canvasWidth - xPx;
    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;
    const dx = xPx - cx;
    const dy = yPx - cy;

    // debug text + กรอบ status (โปร่งใส)
    withOverlayAlpha(ctx, () => {
      ctx.save();
      ctx.fillStyle = "white";
      ctx.font = "16px system-ui";
      const lines = [
        `phase: ${state.phase}`,
        `dx: ${dx.toFixed(1)} px, dy: ${dy.toFixed(1)} px`,
      ];
      lines.forEach((t, i) => ctx.fillText(t, 10, 56 + i * 18));
      ctx.restore();

      alertFrame(ctx, "rgba(255,255,255,0.6)", 4);
    });
  }

  // mouth phase banner (โปร่งใส)
  if (state.phase === "mouth" && detection.marValue !== null) {
    withOverlayAlpha(ctx, () => {
      banner(ctx, "Now, please close your mouth", 150);
    });
  }
}
