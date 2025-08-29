"use client";

import React, { useEffect } from "react";
import { DetectionResult, FaceScanState } from "../configs/type";
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

// ตั้งค่าใน .env.local ตอน dev: NEXT_PUBLIC_SHOW_OVERLAY=1
const SHOW_OVERLAY = process.env.NEXT_PUBLIC_SHOW_OVERLAY === "1";

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
    // ล้างแล้ววาดวิดีโอ
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (CONFIG.CAMERA.MIRRORED_INPUT) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // วาดตามขั้นตอน
    if (state.step === 1) {
      drawStep1(ctx, detectionResults, canvas.width, canvas.height);
    } else if (state.step === 2) {
      drawStep2(ctx, detectionResults[0], state);
    } else if (state.step === 3) {
      if (SHOW_OVERLAY) {
        banner(ctx, " ", 60);
      }
    }
  }, [state, detectionResults, videoElement]);

  return (
    <canvas
      ref={canvasRef}
      width={CONFIG.DISPLAY.WIDTH}
      height={CONFIG.DISPLAY.HEIGHT}
      className="absolute inset-0 w-full h-full z-0"
    />
  );
}

function drawStep1(
  ctx: CanvasRenderingContext2D,
  detectionResults: DetectionResult[],
  canvasWidth: number,
  canvasHeight: number
) {
  const faceCount = detectionResults.length;

  const validation = Step1Validator.validateStep1(
    detectionResults,
    canvasWidth,
    canvasHeight
  );

  if (SHOW_OVERLAY) {
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

    if (validation.message) {
      banner(ctx, validation.message, 80);
    }
  }

  // PIP sharpen
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

function drawStep2(
  ctx: CanvasRenderingContext2D,
  detection: DetectionResult,
  state: FaceScanState
) {
  if (!detection.landmarks || state.phase === "-") return;

  // จุด landmark ปิดไว้
  if (SHOW_OVERLAY) {
    if (CONFIG.LANDMARKS.SHOW_IN_STEP2) {
      drawLandmarks(ctx, detection.landmarks, 1, "white");
    }

    // ปิดbanner
    const instruction = Step2Validator.getPhaseInstruction(state.phase as any);
    banner(ctx, instruction, 120);

    // ปิด Progress text
    if (detection.yawDeg !== null || detection.pitchDeg !== null) {
      const progress = Step2Validator.getPhaseProgress(
        state.phase as any,
        detection.yawDeg,
        detection.pitchDeg
      );
      if (progress) {
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "16px system-ui";
        ctx.fillText(progress, 10, 74);
        ctx.restore();
      }
    }

    // ข้อความเฉพาะ phase ปาก
    if (state.phase === "mouth" && detection.marValue !== null) {
      banner(ctx, "Now, please close your mouth", 150);
    }
  }
}
