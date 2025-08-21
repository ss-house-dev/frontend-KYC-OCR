"use client";

import React, { useEffect, useRef, useState } from "react";

// ================== CONFIG ==================
const DISPLAY_WIDTH = 640;
const DISPLAY_HEIGHT = 480;

const SHARPEN = true;
const SHARPEN_KERNEL: number[][] = [
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0],
];

const FAR_LABEL_SIZE = 80;
const NEAR_LABEL_SIZE = 260;

const BRIGHTNESS_DARK_THRESHOLD = 60;
const BRIGHTNESS_BRIGHT_THRESHOLD = 190;

const CENTER_TOL = 0.15; // 15%

const STEP1_HOLD_SECONDS = 2.0;

// smoothing / hysteresis
const BOX_EMA_ALPHA = 0.3;
const YAW_EMA_ALPHA = 0.25;
const PITCH_EMA_ALPHA = 0.25;

const MIRRORED_INPUT = true;

// yaw/pitch thresholds (deg)
const YAW_ENTER_DEG = 8.0;
const YAW_EXIT_DEG = 5.0;
const YAW_ZERO_UPDATE_BAND = 8.0;
const STEP2_YAW_HOLD_SECONDS = 1.2;

const PITCH_ENTER_DEG = 8.0;
const PITCH_EXIT_DEG = 5.0;
const PITCH_ZERO_UPDATE_BAND = 6.0;
const STEP2_PITCH_HOLD_SECONDS = 1.0;

// Blink (EAR)
const BLINK_MIN_SEC = 0.3;
const BLINK_BASE_EMA_ALPHA = 0.1;
const BLINK_THRESH_FRACTION = 0.72;

// Mouth (MAR)
const MOUTH_BASE_EMA_ALPHA = 0.1;
const MOUTH_OPEN_DELTA = 0.12;
const MOUTH_OPEN_MIN_SEC = 0.6;
const MOUTH_OPEN_MAX_SEC = 2.0;
const MOUTH_CLOSE_MIN_SEC = 0.6;

const SHOW_LANDMARK_POINTS_STEP2 = true;

// ================== Landmark indices ==================
const LAND_IDX = [1, 152, 33, 263, 61, 291] as const;

// ชนิดดัชนีตา (คลาย literal เพื่อใช้ได้ทั้ง LE/RE)
type EyeSpec = Readonly<{
  p1: number; p4: number; p2: number; p6: number; p3: number; p5: number;
}>;

const LE: EyeSpec = { p1: 33,  p4: 133, p2: 159, p6: 145, p3: 158, p5: 153 };
const RE: EyeSpec = { p1: 263, p4: 362, p2: 386, p6: 374, p3: 385, p5: 380 };

// ================== Types ==================
type LM = { x: number; y: number; z: number; visibility?: number };
type Phase = "yaw_left" | "yaw_right" | "pitch_up" | "pitch_down" | "blink" | "mouth";
type Rect4 = [number, number, number, number];

// ================== Helpers ==================
class EMA {
  private alpha: number;
  private v: number | null = null;
  constructor(alpha: number) { this.alpha = alpha; }
  reset() { this.v = null; }
  update(x: number) {
    this.v = this.v == null ? x : this.alpha * x + (1 - this.alpha) * this.v;
    return this.v;
  }
  get value() { return this.v; }
}

class EMAVec {
  private alpha: number;
  private v: Rect4 | null = null;
  constructor(alpha: number) { this.alpha = alpha; }
  reset() { this.v = null; }
  update(vec: Rect4): Rect4 {
    if (!this.v) {
      this.v = [vec[0], vec[1], vec[2], vec[3]];
    } else {
      this.v = [
        this.alpha * vec[0] + (1 - this.alpha) * this.v[0],
        this.alpha * vec[1] + (1 - this.alpha) * this.v[1],
        this.alpha * vec[2] + (1 - this.alpha) * this.v[2],
        this.alpha * vec[3] + (1 - this.alpha) * this.v[3],
      ];
    }
    return [this.v[0], this.v[1], this.v[2], this.v[3]];
  }
  get value(): Rect4 | null { return this.v; }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function distXY(a: LM, b: LM, w: number, h: number) {
  const ax = a.x * w;
  const ay = a.y * h;
  const bx = b.x * w;
  const by = b.y * h;
  return Math.hypot(ax - bx, ay - by);
}

function ear(lm: LM[], w: number, h: number, spec: EyeSpec) {
  const p1 = lm[spec.p1];
  const p2 = lm[spec.p2];
  const p3 = lm[spec.p3];
  const p4 = lm[spec.p4];
  const p5 = lm[spec.p5];
  const p6 = lm[spec.p6];
  const vert = distXY(p2, p6, w, h) + distXY(p3, p5, w, h);
  const horiz = 2.0 * distXY(p1, p4, w, h);
  return horiz > 1e-6 ? vert / horiz : 0.0;
}

function mar(lm: LM[], w: number, h: number) {
  const left = lm[61];
  const right = lm[291];
  const up = lm[13];
  const down = lm[14];
  const vert = distXY(up, down, w, h);
  const horiz = distXY(left, right, w, h);
  return horiz > 1e-6 ? vert / horiz : 0.0;
}

function bboxFromLandmarks(lm: LM[], w: number, h: number): Rect4 {
  let xmin = 1, ymin = 1, xmax = 0, ymax = 0;
  for (const p of lm) {
    xmin = Math.min(xmin, p.x);
    ymin = Math.min(ymin, p.y);
    xmax = Math.max(xmax, p.x);
    ymax = Math.max(ymax, p.y);
  }
  const xx = Math.floor(clamp(xmin, 0, 1) * w);
  const yy = Math.floor(clamp(ymin, 0, 1) * h);
  const ww = Math.max(1, Math.floor((clamp(xmax, 0, 1) - clamp(xmin, 0, 1)) * w));
  const hh = Math.max(1, Math.floor((clamp(ymax, 0, 1) - clamp(ymin, 0, 1)) * h));
  return [xx, yy, ww, hh];
}

/**
 * ประมาณ yaw/pitch แบบเรขาคณิตจาก nose-midEye:
 * yaw (+ซ้าย / -ขวา), pitch (+ก้ม / -เงย)
 */
function estimateYawPitchDeg(lm: LM[], w: number, h: number) {
  const nose = lm[1];
  const eyeL = lm[33];
  const eyeR = lm[263];
  const midEye: LM = {
    x: (eyeL.x + eyeR.x) / 2,
    y: (eyeL.y + eyeR.y) / 2,
    z: (eyeL.z + eyeR.z) / 2,
  };
  const eyeDistPx = distXY(eyeL, eyeR, w, h) || 1;
  const dx = (nose.x - midEye.x) * w;
  const dy = (nose.y - midEye.y) * h;

  let yawDeg = (Math.atan2(dx, eyeDistPx) * 180) / Math.PI;
  let pitchDeg = (Math.atan2(dy, eyeDistPx) * 180) / Math.PI;

  if (MIRRORED_INPUT) yawDeg = -yawDeg;

  return { yawDeg, pitchDeg };
}

// ================== Canvas Drawing ==================
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r = 12, color = "rgba(255,255,255,1)", th = 2
) {
  ctx.save();
  ctx.lineWidth = th;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.stroke();
  ctx.restore();
}

function banner(ctx: CanvasRenderingContext2D, text: string, y = 80) {
  if (!text) return;
  ctx.save();
  ctx.font = "16px system-ui, sans-serif";
  const padX = 10, padY = 8;
  const tw = ctx.measureText(text).width;
  const th = 18;
  const w = ctx.canvas.width;
  const x1 = Math.max(0, Math.floor((w - tw) / 2) - padX);
  const y1 = Math.max(0, y);
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(x1, y1, tw + padX * 2, th + padY * 2);
  ctx.fillStyle = "#fff";
  ctx.fillText(text, x1 + padX, y1 + th);
  ctx.restore();
}

function putLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  if (!text) return;
  ctx.save();
  ctx.font = "14px system-ui, sans-serif";
  const pad = 4;
  const tw = ctx.measureText(text).width;
  const th = 16;
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(x, y - th - pad * 2, tw + pad * 2, th + pad * 2);
  ctx.fillStyle = "#fff";
  ctx.fillText(text, x + pad, y - pad);
  ctx.restore();
}

function alertFrame(ctx: CanvasRenderingContext2D, color = "rgba(255,0,0,1)", thickness = 4) {
  ctx.save();
  ctx.lineWidth = thickness;
  ctx.strokeStyle = color;
  ctx.strokeRect(2, 2, ctx.canvas.width - 4, ctx.canvas.height - 4);
  ctx.restore();
}

function drawLandmarks(ctx: CanvasRenderingContext2D, lm: LM[], radius = 1, color = "white") {
  ctx.save();
  ctx.fillStyle = color;
  const w = ctx.canvas.width, h = ctx.canvas.height;
  for (const p of lm) {
    const cx = Math.floor(p.x * w), cy = Math.floor(p.y * h);
    if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** sharpen แบบง่าย ๆ บน canvas */
function applySharpenToImageData(img: ImageData) {
  const w = img.width, h = img.height, data = img.data;
  const out = new Uint8ClampedArray(data.length);
  const k = SHARPEN_KERNEL;

  const idx = (x: number, y: number, c: number) => (y * w + x) * 4 + c;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += data[idx(x + kx, y + ky, c)] * k[ky + 1][kx + 1];
          }
        }
        let val = Math.round(sum);
        if (val < 0) val = 0;
        if (val > 255) val = 255;
        out[idx(x, y, c)] = val;
      }
      out[idx(x, y, 3)] = data[idx(x, y, 3)];
    }
  }

  // border = ค่าเดิม
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < 4; c++) {
      out[idx(x, 0, c)] = data[idx(x, 0, c)];
      out[idx(x, h - 1, c)] = data[idx(x, h - 1, c)];
    }
  }
  for (let y = 0; y < h; y++) {
    for (let c = 0; c < 4; c++) {
      out[idx(0, y, c)] = data[idx(0, y, c)];
      out[idx(w - 1, y, c)] = data[idx(w - 1, y, c)];
    }
  }

  return new ImageData(out, w, h);
}

// ================== Component ==================
export default function FaceScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [step, setStep] = useState<number>(1);
  const [phase, setPhase] = useState<string>("-");
  const [fps, setFps] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    let camera: any = null;
    let faceMesh: any = null;

    // EMA states
    const boxEma = new EMAVec(BOX_EMA_ALPHA);
    const yawEma = new EMA(YAW_EMA_ALPHA);
    const yawZero = new EMA(0.10);
    const pitchEma = new EMA(PITCH_EMA_ALPHA);
    const pitchZero = new EMA(0.10);
    const earBase = new EMA(BLINK_BASE_EMA_ALPHA);
    const marBase = new EMA(MOUTH_BASE_EMA_ALPHA);

    // timers & flags
    let step1HoldStart: number | null = null;
    let currentStep: 1 | 2 | 3 = 1;
    let subPhase: Phase = "yaw_left";
    let holdStart: number | null = null;
    let blinkCloseStart: number | null = null;
    let blinkDone = false;
    let mouthOpenStart: number | null = null;
    let mouthCloseStart: number | null = null;
    let mouthDone = false;

    let lastFpsT = performance.now();
    let frameCount = 0;

    function resetStep2() {
      subPhase = "yaw_left";
      holdStart = null;
      yawEma.reset(); yawZero.reset();
      pitchEma.reset(); pitchZero.reset();
      earBase.reset(); blinkCloseStart = null; blinkDone = false;
      marBase.reset(); mouthOpenStart = null; mouthCloseStart = null; mouthDone = false;
    }

    async function setup() {
      const [{ FaceMesh }, { Camera }] = await Promise.all([
        import("@mediapipe/face_mesh"),
        import("@mediapipe/camera_utils"),
      ]);

      if (!isMounted || !videoRef.current || !canvasRef.current) return;

      faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        selfieMode: MIRRORED_INPUT,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      const videoEl = videoRef.current!;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

      faceMesh.onResults((results: any) => {
        const now = performance.now();
        frameCount++;
        if (now - lastFpsT >= 1000) {
          setFps(Math.round((frameCount * 1000) / (now - lastFpsT)));
          frameCount = 0;
          lastFpsT = now;
        }

        const img = results.image as HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

        // วาดภาพพื้น
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (MIRRORED_INPUT) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        const lmAll: LM[] | null =
          results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0
            ? (results.multiFaceLandmarks[0] as LM[])
            : null;

        // กรอบจาก landmarks
        let boxes: Rect4[] = [];
        if (lmAll) {
          boxes = [bboxFromLandmarks(lmAll, canvas.width, canvas.height)];
        }

        // smoothing box
        let smoothBox: Rect4 | null = null;
        if (boxes.length) {
          smoothBox = boxEma.update(boxes[0]);
        } else {
          boxEma.reset();
        }

        // ---------- STEP 1 ----------
        const drawStep1 = () => {
          let alertText: string | null = null;
          let centerOK = false;

          if (boxes.length === 0) {
            alertText = "No face found";
            alertFrame(ctx, "rgba(255,0,0,1)", 4);
            banner(ctx, alertText, 80);
          } else if (boxes.length > 1) {
            alertText = "Ensure only your face is in frame.";
            for (const b of boxes) {
              roundedRect(ctx, b[0], b[1], b[2], b[3], 12, "red", 2);
              putLabel(ctx, alertText, b[0], b[1]);
            }
          } else if (smoothBox) {
            const [xx, yy, ww, hh] = smoothBox;

            // ความสว่างในกรอบ
            const x1 = clamp(xx, 0, canvas.width - 1);
            const y1 = clamp(yy, 0, canvas.height - 1);
            const x2 = clamp(xx + ww, 0, canvas.width);
            const y2 = clamp(yy + hh, 0, canvas.height);
            let meanVal = 128;

            if (x2 > x1 && y2 > y1) {
              const roi = ctx.getImageData(x1, y1, x2 - x1, y2 - y1);
              let sum = 0;
              for (let i = 0; i < roi.data.length; i += 4) {
                sum += 0.299 * roi.data[i] + 0.587 * roi.data[i + 1] + 0.114 * roi.data[i + 2];
              }
              meanVal = Math.round(sum / ((roi.data.length / 4) || 1));
            }

            let boxColor = "white";
            let labelText = "";

            if (meanVal <= BRIGHTNESS_DARK_THRESHOLD) {
              labelText = "The Face is too dark.";
              boxColor = "red";
            } else if (meanVal >= BRIGHTNESS_BRIGHT_THRESHOLD) {
              labelText = "The Face is too bright.";
              boxColor = "red";
            } else {
              const sizeMin = Math.min(ww, hh);
              if (sizeMin >= NEAR_LABEL_SIZE) {
                labelText = `Move your face back. (${ww}x${hh})`;
                boxColor = "red";
              } else if (sizeMin < FAR_LABEL_SIZE) {
                labelText = `Move your face closer. (${ww}x${hh})`;
                boxColor = "red";
              } else {
                const frameCx = canvas.width / 2;
                const frameCy = canvas.height / 2;
                const cx = xx + ww / 2;
                const cy = yy + hh / 2;
                if (Math.abs(cx - frameCx) <= canvas.width * CENTER_TOL &&
                    Math.abs(cy - frameCy) <= canvas.height * CENTER_TOL) {
                  labelText = "Look straight and stay still.";
                  centerOK = true;
                } else {
                  labelText = `OK | Medium (${ww}x${hh})`;
                }
              }
            }

            roundedRect(ctx, xx, yy, ww, hh, 12, boxColor, 2);
            if (labelText) putLabel(ctx, labelText, xx, yy);

            // PIP sharpen
            const pipW = 160, pipH = 120;
            const sx = canvas.width - pipW;
            const sy = canvas.height - pipH;
            const pip = ctx.getImageData(sx, sy, pipW, pipH);
            const sharpened = SHARPEN ? applySharpenToImageData(pip) : pip;
            ctx.putImageData(sharpened, sx, sy);
          }

          // เงื่อนไขเข้าสtep2
          if (boxes.length === 1 && smoothBox) {
            if (centerOK) {
              if (step1HoldStart == null) step1HoldStart = performance.now();
              else if ((performance.now() - step1HoldStart) / 1000 >= STEP1_HOLD_SECONDS) {
                currentStep = 2;
                resetStep2();
              }
            } else {
              step1HoldStart = null;
            }
          } else {
            step1HoldStart = null;
          }
        };

        // ---------- STEP 2 ----------
        const drawStep2 = () => {
          banner(ctx, "Please turn your face left and right.", 60);

          let yawDeg: number | null = null;
          let pitchDeg: number | null = null;

          if (lmAll) {
            if (SHOW_LANDMARK_POINTS_STEP2) drawLandmarks(ctx, lmAll, 1, "white");

            const est = estimateYawPitchDeg(lmAll, canvas.width, canvas.height);

            // calibrate + smooth
            if (yawZero.value == null || Math.abs(est.yawDeg - (yawZero.value ?? 0)) <= YAW_ZERO_UPDATE_BAND) {
              yawZero.update(est.yawDeg);
            }
            if (pitchZero.value == null || Math.abs(est.pitchDeg - (pitchZero.value ?? 0)) <= PITCH_ZERO_UPDATE_BAND) {
              pitchZero.update(est.pitchDeg);
            }
            yawDeg = yawEma.update(est.yawDeg - (yawZero.value ?? 0));
            pitchDeg = pitchEma.update(est.pitchDeg - (pitchZero.value ?? 0));

            // EAR/MAR
            const le = ear(lmAll, canvas.width, canvas.height, LE);
            const re = ear(lmAll, canvas.width, canvas.height, RE);
            const earNow = (le + re) * 0.5;
            const marNow = mar(lmAll, canvas.width, canvas.height);

            if (subPhase === "blink") {
              if (earBase.value == null || earNow > earBase.value * 0.9) earBase.update(earNow);
            }
            if (subPhase === "mouth") {
              if (marBase.value == null || marNow < marBase.value * 1.1) marBase.update(marNow);
            }

            // ตัวเลขนับถอย
            ctx.save();
            ctx.fillStyle = "white";
            ctx.font = "16px system-ui";
            if ((subPhase === "yaw_left" || subPhase === "yaw_right") && yawDeg != null) {
              if (subPhase === "yaw_left") {
                const achieved = Math.max(0, +yawDeg);
                const remaining = Math.max(0, YAW_ENTER_DEG - achieved);
                ctx.fillText(`left: ${remaining.toFixed(1)}`, 10, 74);
              } else {
                const achieved = Math.max(0, -yawDeg);
                const remaining = Math.max(0, YAW_ENTER_DEG - achieved);
                ctx.fillText(`right: ${remaining.toFixed(1)}`, 10, 74);
              }
            } else if ((subPhase === "pitch_up" || subPhase === "pitch_down") && pitchDeg != null) {
              if (subPhase === "pitch_up") {
                const achieved = Math.max(0, -pitchDeg);
                const remaining = Math.max(0, PITCH_ENTER_DEG - achieved);
                ctx.fillText(`up: ${remaining.toFixed(1)}`, 10, 74);
              } else {
                const achieved = Math.max(0, +pitchDeg);
                const remaining = Math.max(0, PITCH_ENTER_DEG - achieved);
                ctx.fillText(`down: ${remaining.toFixed(1)}`, 10, 74);
              }
            }
            ctx.restore();

            // Phase machine
            if (subPhase === "yaw_left") {
              banner(ctx, "Turn your head LEFT", 120);
              if (yawDeg != null && yawDeg >= +YAW_ENTER_DEG) {
                if (holdStart == null) holdStart = performance.now();
                else if ((performance.now() - holdStart) / 1000 >= STEP2_YAW_HOLD_SECONDS) {
                  subPhase = "yaw_right";
                  holdStart = null;
                }
              } else if (yawDeg != null && yawDeg < +YAW_EXIT_DEG) {
                holdStart = null;
              }
            } else if (subPhase === "yaw_right") {
              banner(ctx, "Turn your head RIGHT", 120);
              if (yawDeg != null && yawDeg <= -YAW_ENTER_DEG) {
                if (holdStart == null) holdStart = performance.now();
                else if ((performance.now() - holdStart) / 1000 >= STEP2_YAW_HOLD_SECONDS) {
                  subPhase = "pitch_up";
                  holdStart = null;
                }
              } else if (yawDeg != null && yawDeg > -YAW_EXIT_DEG) {
                holdStart = null;
              }
            } else if (subPhase === "pitch_up") {
              banner(ctx, "Nod your head UP", 120);
              if (pitchDeg != null && pitchDeg <= -PITCH_ENTER_DEG) {
                if (holdStart == null) holdStart = performance.now();
                else if ((performance.now() - holdStart) / 1000 >= STEP2_PITCH_HOLD_SECONDS) {
                  subPhase = "pitch_down";
                  holdStart = null;
                }
              } else if (pitchDeg != null && pitchDeg > -PITCH_EXIT_DEG) {
                holdStart = null;
              }
            } else if (subPhase === "pitch_down") {
              banner(ctx, "Nod your head DOWN", 120);
              if (pitchDeg != null && pitchDeg >= +PITCH_ENTER_DEG) {
                if (holdStart == null) holdStart = performance.now();
                else if ((performance.now() - holdStart) / 1000 >= STEP2_PITCH_HOLD_SECONDS) {
                  subPhase = "blink";
                  holdStart = null;
                }
              } else if (pitchDeg != null && pitchDeg < +PITCH_EXIT_DEG) {
                holdStart = null;
              }
            } else if (subPhase === "blink") {
              banner(ctx, "Please blink your eyes slowly", 120);
              const base = earBase.value ?? earNow;
              const earThresh = base * BLINK_THRESH_FRACTION;

              if (earNow <= earThresh) {
                if (blinkCloseStart == null) blinkCloseStart = performance.now();
                else if ((performance.now() - blinkCloseStart) / 1000 >= BLINK_MIN_SEC) {
                  blinkDone = true;
                }
              } else {
                blinkCloseStart = null;
              }

              if (blinkDone) {
                subPhase = "mouth";
                blinkCloseStart = null;
              }
            } else if (subPhase === "mouth") {
              banner(ctx, "Please open your mouth", 120);
              const base = marBase.value ?? marNow;
              const marOpenTh = base + MOUTH_OPEN_DELTA;

              if (marNow >= marOpenTh) {
                if (mouthOpenStart == null) mouthOpenStart = performance.now();
                const openDur = (performance.now() - mouthOpenStart) / 1000;
                if (openDur >= MOUTH_OPEN_MAX_SEC) {
                  banner(ctx, "Please close your mouth", 150);
                } else if (openDur >= MOUTH_OPEN_MIN_SEC) {
                  banner(ctx, "Now, please close your mouth", 150);
                }
              } else {
                if (mouthOpenStart != null) {
                  if (mouthCloseStart == null) mouthCloseStart = performance.now();
                  else if ((performance.now() - mouthCloseStart) / 1000 >= MOUTH_CLOSE_MIN_SEC) {
                    mouthDone = true;
                  }
                }
              }

              if (mouthDone) {
                currentStep = 3;
              }
            }
          }

          // Header
          ctx.save();
          ctx.fillStyle = "white";
          ctx.font = "16px system-ui";
          ctx.fillText(`STEP: ${currentStep}   PHASE: ${currentStep === 2 ? subPhase : "-"}`, 10, 52);
          ctx.fillText(`FPS: ${fps}`, 10, 30);
          ctx.restore();
        };

        if (currentStep === 1) {
          drawStep1();
        } else if (currentStep === 2) {
          drawStep2();
        } else if (currentStep === 3) {
          banner(ctx, "DONE", 60);
        }

        setStep(currentStep);
        setPhase(currentStep === 2 ? subPhase : "-");
      });

      // กล้อง
      camera = new Camera(videoEl, {
        onFrame: async () => {
          if (!isMounted) return;
          await faceMesh.send({ image: videoEl });
        },
        width: DISPLAY_WIDTH,
        height: DISPLAY_HEIGHT,
      });

      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT },
        audio: false,
      });
      await camera.start();
    }

    setup().catch((e: any) => {
      console.error("Init error:", e);
      alert("ไม่สามารถเปิดกล้องได้: " + (e?.message ?? String(e)));
    });

    return () => {
      isMounted = false;
      try { camera && camera.stop && camera.stop(); } catch { /* noop */ }
      try { faceMesh && faceMesh.close && faceMesh.close(); } catch { /* noop */ }
    };
  }, []); // รันครั้งเดียว

  return (
    <div className="w-full flex flex-col items-center gap-3 p-4">
      <h1 className="text-xl font-semibold">Face Scan (Next.js + TypeScript + MediaPipe)</h1>
      <div className="relative" style={{ width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT }}>
        <video ref={videoRef} playsInline className="hidden" muted />
        <canvas
          ref={canvasRef}
          width={DISPLAY_WIDTH}
          height={DISPLAY_HEIGHT}
          className="rounded-xl shadow-md bg-black"
        />
      </div>

      <div className="text-sm opacity-80">
        STEP: <b>{step}</b> &nbsp;|&nbsp; PHASE: <b>{phase}</b> &nbsp;|&nbsp; FPS: <b>{fps}</b>
      </div>

      <div className="text-xs text-neutral-500">
        ต้องเปิดผ่าน HTTPS หรือ <code>localhost</code> เพื่อขอสิทธิ์กล้อง (โดยเฉพาะ iOS)
      </div>
    </div>
  );
}
