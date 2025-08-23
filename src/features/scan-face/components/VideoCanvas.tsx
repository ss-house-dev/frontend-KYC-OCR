"use client";

import React, { useEffect } from "react";
import { DetectionResult, FaceScanState } from "../configs/type";
import { CONFIG } from "../configs/constant";
import { Step1Validator } from "../utils/validators/step1Validator";
import { Step2Validator } from "../utils/validators/step2Validator";
import {
  applySharpenToImageData,
  banner,
  putLabel,
  roundedRect,
  alertFrame,
  drawLandmarks,
} from "../utils/canvasDraw";

interface VideoCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  state: FaceScanState;
  detectionResult: DetectionResult;
  videoElement?: HTMLVideoElement;
}

export function VideoCanvas({
  canvasRef,
  state,
  detectionResult,
  videoElement,
}: VideoCanvasProps) {
  useEffect(() => {
    if (!canvasRef.current || !videoElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    // Clear and draw video frame
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (CONFIG.CAMERA.MIRRORED_INPUT) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw based on current step
    if (state.step === 1) {
      drawStep1(ctx, detectionResult, canvas.width, canvas.height);
    } else if (state.step === 2) {
      drawStep2(ctx, detectionResult, state);
    } else if (state.step === 3) {
      banner(ctx, "DONE", 60);
    }
  }, [state, detectionResult, videoElement]);

  return (
    <canvas
      ref={canvasRef}
      width={CONFIG.DISPLAY.WIDTH}
      height={CONFIG.DISPLAY.HEIGHT}
      className="rounded-xl shadow-md bg-black"
    />
  );
}

function drawStep1(
  ctx: CanvasRenderingContext2D,
  detection: DetectionResult,
  canvasWidth: number,
  canvasHeight: number
) {
  const faceCount = detection.landmarks ? 1 : 0;

  if (faceCount === 0) {
    alertFrame(ctx, "rgba(255,0,0,1)", 4);
    banner(ctx, "No face found", 80);
    return;
  }

  if (!detection.bbox) return;

  const validation = Step1Validator.validateStep1(
    faceCount,
    detection.brightness,
    detection.bbox,
    canvasWidth,
    canvasHeight
  );

  const [x, y, w, h] = detection.bbox;
  roundedRect(ctx, x, y, w, h, 12, validation.color, 2);

  if (validation.message) {
    putLabel(ctx, validation.message, x, y);
  }

  // Draw sharpened PIP
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
  banner(ctx, "Please follow the instructions", 60);

  if (!detection.landmarks || state.phase === "-") return;

  // Draw landmarks if enabled
  if (CONFIG.LANDMARKS.SHOW_IN_STEP2) {
    drawLandmarks(ctx, detection.landmarks, 1, "white");
  }

  // Draw phase instruction
  const instruction = Step2Validator.getPhaseInstruction(state.phase as any);
  banner(ctx, instruction, 120);

  // Draw progress counter
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

  // Draw step and FPS info
  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = "16px system-ui";
  ctx.fillText(`STEP: ${state.step}   PHASE: ${state.phase}`, 10, 52);
  ctx.fillText(`FPS: ${state.fps}`, 10, 30);
  ctx.restore();

  // Draw mouth instruction variations for mouth phase
  if (state.phase === "mouth" && detection.marValue !== null) {
    // This could be enhanced with more specific mouth state feedback
    if (state.phase === "mouth") {
      banner(ctx, "Now, please close your mouth", 150);
    }
  }
}
