/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FaceDetection } from "@mediapipe/face_detection";
import { FaceMesh, Results as FMResults } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import * as Drawing from "@mediapipe/drawing_utils";

/* ================== CONFIG ================== */
const DISPLAY_WIDTH = 640;
const DISPLAY_HEIGHT = 480;
const SHARPEN = true;
const SHARPEN_KERNEL = [
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0],
] as const satisfies ReadonlyArray<ReadonlyArray<number>>;

const WHITE = "#ffffff"; 
const RED = "#ff3b3b";

const FAR_LABEL_SIZE = 80;
const NEAR_LABEL_SIZE = 260;

const BRIGHTNESS_DARK_THRESHOLD = 60;
const BRIGHTNESS_BRIGHT_THRESHOLD = 190;

const CENTER_TOL = 0.15; // 15%

const STEP1_HOLD_SECONDS = 2.0;

// MediaPipe Face Detection
const FD_CONF = 0.7;
const FD_MODEL_SELECTION = 0; // 0 near, 1 far

// Smoothing / Hysteresis
const BOX_EMA_ALPHA = 0.30;
const YAW_EMA_ALPHA = 0.25;
const PITCH_EMA_ALPHA = 0.25;

// input is mirrored
const MIRRORED_INPUT = true;

// ---- yaw thresholds (deg) ----
const YAW_ENTER_DEG = 8.0;
const YAW_EXIT_DEG = 5.0;
const YAW_ZERO_UPDATE_BAND = 8.0;
const STEP2_YAW_HOLD_SECONDS = 1.2;

// ---- pitch thresholds (deg) ----
const PITCH_ENTER_DEG = 8.0;
const PITCH_EXIT_DEG = 5.0;
const PITCH_ZERO_UPDATE_BAND = 6.0;
const STEP2_PITCH_HOLD_SECONDS = 1.0;

// Blink (EAR)
const BLINK_MIN_SEC = 0.30;
const BLINK_BASE_EMA_ALPHA = 0.10;
const BLINK_THRESH_FRACTION = 0.72;

// Mouth (MAR)
const MOUTH_BASE_EMA_ALPHA = 0.10;
const MOUTH_OPEN_DELTA = 0.12;
const MOUTH_OPEN_MIN_SEC = 0.60;
const MOUTH_OPEN_MAX_SEC = 2.00;
const MOUTH_CLOSE_MIN_SEC = 0.60;

// Debug draw
const SHOW_LANDMARK_POINTS_STEP2 = true;

/* ====== Landmark indices (MediaPipe) ====== */
const LAND = { nose: 1, chin: 152, leOuter: 33, reOuter: 263, mouthL: 61, mouthR: 291, mouthUp: 13, mouthDn: 14 } as const;
const LE = { p1: 33, p4: 133, p2: 159, p6: 145, p3: 158, p5: 153 } as const;
const RE = { p1: 263, p4: 362, p2: 386, p6: 374, p3: 385, p5: 380 } as const;

/* ================== DOM SETUP ================== */
const video = document.createElement("video");
video.playsInline = true;
video.muted = true;
video.autoplay = true;
video.style.transform = "scaleX(-1)"; // mirror preview (consistent with Python)
video.width = DISPLAY_WIDTH;
video.height = DISPLAY_HEIGHT;

const canvas = document.createElement("canvas");
canvas.width = DISPLAY_WIDTH;
canvas.height = DISPLAY_HEIGHT;
const ctx = canvas.getContext("2d")!;

const root = document.createElement("div");
root.style.display = "grid";
root.style.gap = "8px";
root.appendChild(video);
root.appendChild(canvas);
document.body.appendChild(root);

/* ================== Utils ================== */
class EMA {
  private alpha: number;
  private v: number | null = null;
  constructor(alpha: number) { this.alpha = alpha; }
  reset() { this.v = null; }
  update(x: number) { this.v = this.v == null ? x : this.alpha * x + (1 - this.alpha) * this.v; return this.v; }
  get value() { return this.v; }
}

class EMAVec {
  private alpha: number;
  private v: [number, number, number, number] | null = null; // x,y,w,h
  constructor(alpha: number) { this.alpha = alpha; }
  reset() { this.v = null; }
  update(vec: [number, number, number, number]) {
    if (!this.v) { this.v = [...vec]; }
    else {
      this.v = [
        this.alpha * vec[0] + (1 - this.alpha) * this.v[0],
        this.alpha * vec[1] + (1 - this.alpha) * this.v[1],
        this.alpha * vec[2] + (1 - this.alpha) * this.v[2],
        this.alpha * vec[3] + (1 - this.alpha) * this.v[3],
      ];
    }
    return [...this.v] as [number, number, number, number];
  }
}

function putBanner(text: string, y = 80) {
  if (!text) return;
  ctx.save();
  ctx.font = "16px system-ui, sans-serif";
  const metrics = ctx.measureText(text);
  const th = 18, padX = 10, padY = 8;
  const x1 = Math.max(0, (DISPLAY_WIDTH - metrics.width) / 2 - padX);
  const y1 = Math.max(0, Math.min(y, DISPLAY_HEIGHT - (th + padY * 2) - 1));
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(x1, y1, metrics.width + padX * 2, th + padY * 2);
  ctx.fillStyle = WHITE;
  ctx.fillText(text, x1 + padX, y1 + th + padY - 6);
  ctx.restore();
}

function putLabel(text: string, x: number, y: number) {
  if (!text) return;
  ctx.save();
  ctx.font = "14px system-ui, sans-serif";
  const w = ctx.measureText(text).width;
  const h = 18, pad = 4;
  const x1 = Math.max(0, x);
  const y1 = Math.max(0, y - h - 8);
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(x1, y1, w + pad * 2, h + pad * 2);
  ctx.fillStyle = WHITE;
  ctx.fillText(text, x1 + pad, y1 + h + pad - 6);
  ctx.restore();
}

function drawRoundedRect(x: number, y: number, w: number, h: number, color = WHITE, th = 2, r = 12) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = th;
  const x2 = x + w, y2 = y + h;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x2 - r, y);
  ctx.quadraticCurveTo(x2, y, x2, y + r);
  ctx.lineTo(x2, y2 - r);
  ctx.quadraticCurveTo(x2, y2, x2 - r, y2);
  ctx.lineTo(x + r, y2);
  ctx.quadraticCurveTo(x, y2, x, y2 - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.stroke();
  ctx.restore();
}

function drawAlertFrame(color = RED, thickness = 4) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.strokeRect(2, 2, DISPLAY_WIDTH - 5, DISPLAY_HEIGHT - 5);
  ctx.restore();
}


function convolveSharpen(imageData: ImageData) {
  // Simple 3x3 conv, no border handling (skip 1px border)
  const { data, width, height } = imageData;
  const out = new Uint8ClampedArray(data.length);
  out.set(data);

  const kernel = SHARPEN_KERNEL; // ✅ ใช้อันนี้แทน `k`

  const get = (x: number, y: number, c: number) => data[(y * width + x) * 4 + c];
  const set = (x: number, y: number, c: number, v: number) => { out[(y * width + x) * 4 + c] = v; };

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let acc = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            acc += get(x + kx, y + ky, c) * kernel[ky + 1][kx + 1];
          }
        }
        // clamp + ปัดเป็น int
        const v = Math.round(Math.max(0, Math.min(255, acc)));
        set(x, y, c, v);
      }
    }
  }

  return new ImageData(out, width, height);
}


function avgGrayInRect(img: ImageData, rx: number, ry: number, rw: number, rh: number) {
  const { data, width } = img;
  let sum = 0, cnt = 0;
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      sum += gray; cnt++;
    }
  }
  return cnt ? sum / cnt : 128;
}

/* =============== Geometry helpers (FaceMesh) =============== */
type LM = { x: number; y: number; z: number; visibility?: number };
type LMs = LM[];
type FMResultsPatched = FMResults & { multiFaceWorldLandmarks?: LMs[] };

const fm: FMResultsPatched = await new Promise(async (resolve) => {
  faceMesh.onResults((r) => resolve(r as FMResultsPatched));
  await faceMesh.send({ image: video });
});


function earFrom(lm: LMs, spec: typeof LE | typeof RE, w: number, h: number) {
  const p = (i: number) => lm[i];
  const dist = (a: LM, b: LM) => {
    const dx = (a.x - b.x) * w;
    const dy = (a.y - b.y) * h;
    return Math.hypot(dx, dy);
  };
  const p1 = p(spec.p1), p2 = p(spec.p2), p3 = p(spec.p3), p4 = p(spec.p4), p5 = p(spec.p5), p6 = p(spec.p6);
  const vert = dist(p2, p6) + dist(p3, p5);
  const horiz = 2 * dist(p1, p4);
  return horiz > 1e-6 ? vert / horiz : 0;
}

function marFrom(lm: LMs, w: number, h: number) {
  const L = lm[LAND.mouthL], R = lm[LAND.mouthR], U = lm[LAND.mouthUp], D = lm[LAND.mouthDn];
  const vert = Math.hypot((U.x - D.x) * w, (U.y - D.y) * h);
  const horiz = Math.hypot((L.x - R.x) * w, (L.y - R.y) * h);
  return horiz > 1e-6 ? vert / horiz : 0;
}

/**
 * Estimate yaw/pitch from MediaPipe *world* landmarks (meters).
 * Build two reference vectors:
 *  - vL = leftEyeOuter -> rightEyeOuter  (right direction)
 *  - vU = chin -> nose (up direction)
 * Forward (face normal) ≈ normalize(cross(vU, vL))
 *   then yaw = atan2(f.x, -f.z)
 *        pitch = asin(clamp(f.y))
 */
function yawPitchFromWorld(lm: LMs) {
  const L = lm[LAND.leOuter], R = lm[LAND.reOuter], nose = lm[LAND.nose], chin = lm[LAND.chin];
  if (!L || !R || !nose || !chin) return null;

  // vectors in world coords
  const vL = { x: R.x - L.x, y: R.y - L.y, z: R.z - L.z }; // right
  const vU = { x: nose.x - chin.x, y: nose.y - chin.y, z: nose.z - chin.z }; // up

  // forward = vU x vL
  const f = {
    x: vU.y * vL.z - vU.z * vL.y,
    y: vU.z * vL.x - vU.x * vL.z,
    z: vU.x * vL.y - vU.y * vL.x,
  };
  const flen = Math.hypot(f.x, f.y, f.z) || 1;
  const fx = f.x / flen, fy = f.y / flen, fz = f.z / flen;

  let yaw = (180 / Math.PI) * Math.atan2(fx, -fz);    // left(+)/right(-)
  let pitch = (180 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, fy))); // down(+)/up(-)

  if (MIRRORED_INPUT) yaw = -yaw; // compensate mirror

  return { yaw, pitch };
}

/* ================== State ================== */
const boxEMA = new EMAVec(BOX_EMA_ALPHA);
const yawEMA = new EMA(YAW_EMA_ALPHA);
const yawZero = new EMA(0.10);
const pitchEMA = new EMA(PITCH_EMA_ALPHA);
const pitchZero = new EMA(0.10);
const earBase = new EMA(BLINK_BASE_EMA_ALPHA);
const marBase = new EMA(MOUTH_BASE_EMA_ALPHA);

let blinkCloseStart: number | null = null;
let blinkDone = false;
let mouthOpenStart: number | null = null;
let mouthCloseStart: number | null = null;
let mouthDone = false;

let currentStep: 1 | 2 | 3 = 1;
let phase: "yaw_left" | "yaw_right" | "pitch_up" | "pitch_down" | "blink" | "mouth" | "-" = "-";
let step1HoldStart: number | null = null;
let holdStart: number | null = null;
let step2AllDone = false;

let fps = 0;
let frames = 0;
let lastFpsT = performance.now();

/* ================== MediaPipe init ================== */
const faceDet = new FaceDetection({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
});
faceDet.setOptions({
  model: "short", // "short"=0, "full"=1-ish
  minDetectionConfidence: FD_CONF,
  selfieMode: true,
});

const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  selfieMode: true,
});

/* We’ll drive both models manually in the camera callback */
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT }, audio: false });
  video.srcObject = stream;
  await video.play();
}

function resetStep2Accumulators() {
  yawEMA.reset(); yawZero.reset();
  pitchEMA.reset(); pitchZero.reset();
  earBase.reset(); blinkCloseStart = null; blinkDone = false;
  marBase.reset(); mouthOpenStart = null; mouthCloseStart = null; mouthDone = false;
}

function bannerStepPhase() {
  ctx.save();
  ctx.fillStyle = WHITE;
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText(`STEP: ${currentStep}  PHASE: ${currentStep === 2 ? phase : "-"}`, 10, 52);
  ctx.restore();
}

/* ================== Main loop ================== */
async function main() {
  await setupCamera();

  // พิมพ์เขียว type ที่เพิ่ม field world landmarks แบบ optional
  type FMResultsPatched = FMResults & { multiFaceWorldLandmarks?: LMs[] };

  // ตัวช่วย: ผูก onResults ครั้งเดียว แล้วรอผลด้วย Promise ในแต่ละเฟรม
  function createResultsAwaiter<F>(attach: (cb: (r: F) => void) => void) {
    let resolver: ((v: F) => void) | null = null;
    attach((r) => { if (resolver) { const done = resolver; resolver = null; done(r); } });
    return () => new Promise<F>((res) => { resolver = res; });
  }
  const nextFM = createResultsAwaiter<FMResultsPatched>((cb) =>
    faceMesh.onResults((r) => cb(r as FMResultsPatched))
  );

  const camera = new Camera(video, {
    onFrame: async () => {
      frames++;
      const now = performance.now();
      if (now - lastFpsT >= 1000) {
        fps = Math.round((frames * 1000) / (now - lastFpsT));
        frames = 0;
        lastFpsT = now;
      }

      // draw video frame to canvas
      ctx.drawImage(video, 0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

      // optional sharpen (simple CPU conv)
      if (SHARPEN) {
        const img = ctx.getImageData(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
        const sharp = convolveSharpen(img);
        ctx.putImageData(sharp, 0, 0);
      }

      // run face detection
      const detPromise = faceDet.send({ image: video }).then(() => (faceDet as any).results);
      const [detResults]: [{ detections?: any[] }] = await Promise.all([detPromise]);
      const detections = (detResults?.detections || []).map((d) => d);

      // =============== STEP 1 overlay & logic ===============
      let alertText: string | null = null;
      let centerOK = false;
      let oneBox: [number, number, number, number] | null = null;

      if (detections.length === 0) {
        alertText = "No face found";
        drawAlertFrame(RED, 4);
        putBanner(alertText, 80);
      } else if (detections.length > 1) {
        alertText = "Ensure only your face is in frame.";
        for (const det of detections) {
          const bb = det.boundingBox || det.locationData?.relativeBoundingBox;
          const rx = (bb?.xCenter ?? bb?.xMin ?? 0) - (bb?.width ?? 0) / 2;
          const ry = (bb?.yCenter ?? bb?.yMin ?? 0) - (bb?.height ?? 0) / 2;
          const rw = bb?.width ?? 0, rh = bb?.height ?? 0;
          const x = Math.max(0, Math.round(rx * DISPLAY_WIDTH));
          const y = Math.max(0, Math.round(ry * DISPLAY_HEIGHT));
          const w = Math.max(1, Math.round(rw * DISPLAY_WIDTH));
          const h = Math.max(1, Math.round(rh * DISPLAY_HEIGHT));
          drawRoundedRect(x, y, w, h, RED);
          putLabel(alertText, x, y);
        }
      } else {
        // one face
        const det = detections[0];
        const bb = det.boundingBox || det.locationData?.relativeBoundingBox;
        const rx = (bb?.xCenter ?? bb?.xMin ?? 0) - (bb?.width ?? 0) / 2;
        const ry = (bb?.yCenter ?? bb?.yMin ?? 0) - (bb?.height ?? 0) / 2;
        const rw = bb?.width ?? 0, rh = bb?.height ?? 0;

        let x = Math.round(rx * DISPLAY_WIDTH);
        let y = Math.round(ry * DISPLAY_HEIGHT);
        let w = Math.round(rw * DISPLAY_WIDTH);
        let h = Math.round(rh * DISPLAY_HEIGHT);
        x = Math.max(0, x); y = Math.max(0, y); w = Math.max(1, w); h = Math.max(1, h);

        // Smooth box
        const sm = boxEMA.update([x, y, w, h]);
        [x, y, w, h] = sm.map((v) => Math.round(v)) as [number, number, number, number];
        oneBox = [x, y, w, h];

        // brightness check
        const img = ctx.getImageData(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
        const x1 = Math.max(0, x), y1 = Math.max(0, y), x2 = Math.min(DISPLAY_WIDTH - 1, x + w), y2 = Math.min(DISPLAY_HEIGHT - 1, y + h);
        const meanVal = (x2 > x1 && y2 > y1) ? avgGrayInRect(img, x1, y1, x2 - x1, y2 - y1) : 128;

        const sizeMin = Math.min(w, h);
        let boxColor = WHITE;
        let labelText = "";

        if (meanVal <= BRIGHTNESS_DARK_THRESHOLD) {
          labelText = "The Face is too dark.";
          boxColor = RED;
        } else if (meanVal >= BRIGHTNESS_BRIGHT_THRESHOLD) {
          labelText = "The Face is too bright.";
          boxColor = RED;
        } else {
          if (sizeMin >= NEAR_LABEL_SIZE) {
            labelText = `Move your face back. (${w}x${h})`;
            boxColor = RED;
          } else if (sizeMin < FAR_LABEL_SIZE) {
            labelText = `Move your face closer. (${w}x${h})`;
            boxColor = RED;
          } else {
            const frameCx = DISPLAY_WIDTH / 2, frameCy = DISPLAY_HEIGHT / 2;
            const cx = x + w / 2, cy = y + h / 2;
            if (Math.abs(cx - frameCx) <= DISPLAY_WIDTH * CENTER_TOL && Math.abs(cy - frameCy) <= DISPLAY_HEIGHT * CENTER_TOL) {
              labelText = "Look straight and stay still.";
              centerOK = true;
            } else {
              labelText = `OK | Medium (${w}x${h})`;
            }
          }
        }
        drawRoundedRect(x, y, w, h, boxColor);
        if (labelText) putLabel(labelText, x, y);
      }

      // FPS & faces
      ctx.save();
      ctx.fillStyle = WHITE;
      ctx.font = "14px system-ui, sans-serif";
      ctx.fillText(`${new Date().toLocaleTimeString()} | ${fps} FPS | Faces:${detections.length}`, 10, 30);
      ctx.restore();

      // Step 1 → Step 2
      if (currentStep === 1) {
        if (!alertText && detections.length === 1 && centerOK) {
          if (step1HoldStart == null) step1HoldStart = performance.now();
          else if ((performance.now() - step1HoldStart) / 1000 >= STEP1_HOLD_SECONDS) {
            currentStep = 2;
            phase = "yaw_left";
            holdStart = null;
            resetStep2Accumulators();
            step1HoldStart = null;
          }
        } else {
          step1HoldStart = null;
        }
      }

      // =============== STEP 2 ===============
      if (currentStep === 2 && !step2AllDone) {
        putBanner("Please turn your face left and right.", 60);

        // ส่งภาพให้ FaceMesh แล้วรอผลลัพธ์เฟรมนี้ (ไม่ผูก onResults ซ้ำ)
        await faceMesh.send({ image: video });
        const fm = await nextFM();

        const lm2d = fm.multiFaceLandmarks?.[0] as LMs | undefined;
        // ถ้ามี world ใช้ world; ถ้าไม่มี fallback เป็น normalized landmarks (มี z เช่นกัน)
        const lm3d = (fm.multiFaceWorldLandmarks?.[0] ?? lm2d) as LMs | undefined;

        let yaw: number | null = null;
        let pitch: number | null = null;

        if (lm2d && lm3d) {
          if (SHOW_LANDMARK_POINTS_STEP2) {
            ctx.save();
            ctx.fillStyle = WHITE;
            for (const p of lm2d) {
              const cx = Math.round(p.x * DISPLAY_WIDTH);
              const cy = Math.round(p.y * DISPLAY_HEIGHT);
              if (cx >= 0 && cy >= 0 && cx < DISPLAY_WIDTH && cy < DISPLAY_HEIGHT) {
                ctx.fillRect(cx, cy, 2, 2);
              }
            }
            ctx.restore();
          }

          const ypr = yawPitchFromWorld(lm3d);
          if (ypr) {
            let { yaw: yawRaw, pitch: pitchRaw } = ypr;
            // zero-drift suppression
            if (yawZero.value == null || Math.abs(yawRaw - yawZero.value) <= YAW_ZERO_UPDATE_BAND) yawZero.update(yawRaw);
            yaw = yawEMA.update(yawRaw - (yawZero.value ?? 0));

            if (pitchZero.value == null || Math.abs(pitchRaw - pitchZero.value) <= PITCH_ZERO_UPDATE_BAND) pitchZero.update(pitchRaw);
            pitch = pitchEMA.update(pitchRaw - (pitchZero.value ?? 0));
          }

          // EAR baseline (phase blink)
          if (phase === "blink") {
            const le = earFrom(lm2d, LE, DISPLAY_WIDTH, DISPLAY_HEIGHT);
            const re = earFrom(lm2d, RE, DISPLAY_WIDTH, DISPLAY_HEIGHT);
            const ear = (le + re) * 0.5;
            if (earBase.value == null || ear > (earBase.value ? earBase.value * 0.9 : ear)) earBase.update(ear);
          }
          // MAR baseline (phase mouth)
          if (phase === "mouth") {
            const mar = marFrom(lm2d, DISPLAY_WIDTH, DISPLAY_HEIGHT);
            if (marBase.value == null || mar < (marBase.value ? marBase.value * 1.1 : mar)) marBase.update(mar);
          }
        }

        // live counters
        ctx.save();
        ctx.fillStyle = WHITE;
        ctx.font = "14px system-ui, sans-serif";
        if ((phase === "yaw_left" || phase === "yaw_right") && yaw != null) {
          if (phase === "yaw_left") {
            const achieved = Math.max(0, +yaw);
            const remaining = Math.max(0, YAW_ENTER_DEG - achieved);
            ctx.fillText(`left: ${remaining.toFixed(1)}`, 10, 74);
          } else {
            const achieved = Math.max(0, -yaw);
            const remaining = Math.max(0, YAW_ENTER_DEG - achieved);
            ctx.fillText(`right: ${remaining.toFixed(1)}`, 10, 74);
          }
        } else if ((phase === "pitch_up" || phase === "pitch_down") && pitch != null) {
          if (phase === "pitch_up") {
            const achieved = Math.max(0, -pitch); // up = negative
            const remaining = Math.max(0, PITCH_ENTER_DEG - achieved);
            ctx.fillText(`up: ${remaining.toFixed(1)}`, 10, 74);
          } else {
            const achieved = Math.max(0, +pitch); // down = positive
            const remaining = Math.max(0, PITCH_ENTER_DEG - achieved);
            ctx.fillText(`down: ${remaining.toFixed(1)}`, 10, 74);
          }
        }
        ctx.restore();

        // -------- Phase machine --------
        if (phase === "yaw_left") {
          putBanner("Turn your head LEFT", 120);
          if (yaw != null && yaw >= +YAW_ENTER_DEG) {
            if (holdStart == null) holdStart = performance.now();
            else if ((performance.now() - holdStart) / 1000 >= STEP2_YAW_HOLD_SECONDS) {
              phase = "yaw_right"; holdStart = null;
            }
          } else if (yaw != null && yaw < +YAW_EXIT_DEG) holdStart = null;

        } else if (phase === "yaw_right") {
          putBanner("Turn your head RIGHT", 120);
          if (yaw != null && yaw <= -YAW_ENTER_DEG) {
            if (holdStart == null) holdStart = performance.now();
            else if ((performance.now() - holdStart) / 1000 >= STEP2_YAW_HOLD_SECONDS) {
              phase = "pitch_up"; holdStart = null;
            }
          } else if (yaw != null && yaw > -YAW_EXIT_DEG) holdStart = null;

        } else if (phase === "pitch_up") {
          putBanner("Nod your head UP", 120);
          if (pitch != null && pitch <= -PITCH_ENTER_DEG) {
            if (holdStart == null) holdStart = performance.now();
            else if ((performance.now() - holdStart) / 1000 >= STEP2_PITCH_HOLD_SECONDS) {
              phase = "pitch_down"; holdStart = null;
            }
          } else if (pitch != null && pitch > -PITCH_EXIT_DEG) holdStart = null;

        } else if (phase === "pitch_down") {
          putBanner("Nod your head DOWN", 120);
          if (pitch != null && pitch >= +PITCH_ENTER_DEG) {
            if (holdStart == null) holdStart = performance.now();
            else if ((performance.now() - holdStart) / 1000 >= STEP2_PITCH_HOLD_SECONDS) {
              phase = "blink"; holdStart = null;
            }
          } else if (pitch != null && pitch < +PITCH_EXIT_DEG) holdStart = null;

        } else if (phase === "blink") {
          putBanner("Please blink your eyes slowly", 120);
          if (lm2d && earBase.value != null) {
            const le = earFrom(lm2d, LE, DISPLAY_WIDTH, DISPLAY_HEIGHT);
            const re = earFrom(lm2d, RE, DISPLAY_WIDTH, DISPLAY_HEIGHT);
            const ear = (le + re) * 0.5;
            const earThresh = earBase.value * BLINK_THRESH_FRACTION;

            if (ear <= earThresh) {
              if (blinkCloseStart == null) blinkCloseStart = performance.now();
              else if ((performance.now() - (blinkCloseStart ?? 0)) / 1000 >= BLINK_MIN_SEC) blinkDone = true;
            } else {
              blinkCloseStart = null;
            }

            if (blinkDone) {
              phase = "mouth";
              blinkCloseStart = null;
            }
          }

        } else if (phase === "mouth") {
          putBanner("Please open your mouth", 120);
          if (lm2d && marBase.value != null) {
            const mar = marFrom(lm2d, DISPLAY_WIDTH, DISPLAY_HEIGHT);
            const marOpenTh = marBase.value + MOUTH_OPEN_DELTA;

            if (mar >= marOpenTh) {
              if (mouthOpenStart == null) mouthOpenStart = performance.now();
              const openDur = (performance.now() - mouthOpenStart) / 1000;

              if (openDur >= MOUTH_OPEN_MAX_SEC) putBanner("Please close your mouth", 150);
              if (openDur >= MOUTH_OPEN_MIN_SEC) putBanner("Now, please close your mouth", 150);

            } else {
              if (mouthOpenStart != null) {
                if (mouthCloseStart == null) mouthCloseStart = performance.now();
                else if ((performance.now() - mouthCloseStart) / 1000 >= MOUTH_CLOSE_MIN_SEC) mouthDone = true;
              } else {
                mouthCloseStart = null;
              }
            }

            if (mouthDone) {
              step2AllDone = true;
              currentStep = 3;
            }
          }
        }

        if (currentStep === 3 || step2AllDone) putBanner("DONE", 60);
      }

      bannerStepPhase();
    },
    width: DISPLAY_WIDTH,
    height: DISPLAY_HEIGHT,
  });

  await camera.start();
}


main().catch((e) => {
  console.error(e);
  alert("Camera init failed.");
});
