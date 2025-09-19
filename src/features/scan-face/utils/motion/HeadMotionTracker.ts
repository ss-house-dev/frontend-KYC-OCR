// utils/motion/HeadMotionTracker.ts
//
// ตรวจจับการหันศีรษะ (ซ้าย/ขวา/ขึ้น/ลง) ด้วย metric nose↔center + EMA + hysteresis + hold
// รองรับ swapYawLR เพื่อสลับความหมายซ้าย/ขวาเมื่อจำเป็น

export type HeadPhase =
  | "yaw_left"
  | "yaw_right"
  | "pitch_up"
  | "pitch_down"
  | "-";

export interface HeadMotionConfig {
  emaAlphaPos?: number; // smoothing ตำแหน่ง (dx/dy)
  emaAlphaVel?: number; // smoothing ความเร็ว
  targetEnter?: number; // เกณฑ์เข้า (normalized ต่อ half-axis)
  targetExit?: number; // เกณฑ์ออก (hysteresis) < targetEnter
  minHoldMs?: number; // ต้องคงสภาพ >= minHoldMs ถึงจะ pass
  dirTol?: number; // กันสั่นทิศทางรอบศูนย์ (normalized)
  swapYawLR?: boolean; // true = สลับซ้าย/ขวา
}

export interface HeadMotionUpdate {
  dx: number; // signed px: ซ้ายลบ/ขวาบวก (หลัง mirror แล้ว)
  dy: number; // signed px: ขึ้นลบ/ลงบวก
  canvasW: number;
  canvasH: number;
  phase: HeadPhase;
  now: number; // performance.now()
}

export interface HeadMotionResult {
  metricNorm: number; // ระยะ/half-axis (0..1)
  metricPx: number; // ระยะพิกเซล
  needed: "left" | "right" | "up" | "down" | "-";
  dirNow: "left" | "right" | "up" | "down" | "center";
  dirOK: boolean;
  dxEma: number;
  dyEma: number;
  velNorm: number; // |velocity| normalized ต่อวินาที
  enter: number;
  exit: number;
  heldMs: number;
  pass: boolean;
}

export class HeadMotionTracker {
  private cfg: Required<HeadMotionConfig>;
  private prev: { t: number; dxEma: number; dyEma: number } | null = null;
  private holdStart: number | null = null;
  private lastPhase: HeadPhase = "-";

  constructor(config?: HeadMotionConfig) {
    this.cfg = {
      emaAlphaPos: config?.emaAlphaPos ?? 0.25,
      emaAlphaVel: config?.emaAlphaVel ?? 0.2,
      targetEnter: config?.targetEnter ?? 0.06,
      targetExit: config?.targetExit ?? 0.04,
      minHoldMs: config?.minHoldMs ?? 450,
      dirTol: config?.dirTol ?? 0.02,
      swapYawLR: config?.swapYawLR ?? false,
    };
  }

  reset() {
    this.prev = null;
    this.holdStart = null;
    this.lastPhase = "-";
  }

  update(input: HeadMotionUpdate): HeadMotionResult {
    const { dx, dy, canvasW, canvasH, phase, now } = input;

    if (phase !== this.lastPhase) {
      this.holdStart = null;
      this.lastPhase = phase;
    }

    const halfW = canvasW / 2;
    const halfH = canvasH / 2;

    const dxEma = this.ema(this.prev?.dxEma ?? dx, dx, this.cfg.emaAlphaPos);
    const dyEma = this.ema(this.prev?.dyEma ?? dy, dy, this.cfg.emaAlphaPos);

    const dt = this.prev ? Math.max(1, now - this.prev.t) : 16.7;
    const dtSec = dt / 1000;

    let axis: "x" | "y" = "x";
    let raw = 0;
    let dirNeed: HeadMotionResult["needed"] = "-";
    let dirNow: HeadMotionResult["dirNow"] = "center";
    let metricPx = 0;
    let metricNorm = 0;

    const tolX = this.cfg.dirTol * halfW;
    const tolY = this.cfg.dirTol * halfH;

    switch (phase) {
      case "yaw_left":
      case "yaw_right": {
        axis = "x";
        raw = dxEma;
        metricPx = Math.abs(dxEma);
        metricNorm = Math.min(1, Math.abs(dxEma) / halfW);

        const wantLeft = phase === "yaw_left";
        const swapped = this.cfg.swapYawLR ? !wantLeft : wantLeft;

        if (swapped) {
          // ต้องการ "right" ถ้า phase=left และ "left" ถ้า phase=right
          dirNeed = wantLeft ? "right" : "left";
          dirNow = dxEma > tolX ? "right" : dxEma < -tolX ? "left" : "center";
        } else {
          dirNeed = wantLeft ? "left" : "right";
          dirNow = dxEma < -tolX ? "left" : dxEma > tolX ? "right" : "center";
        }
        break;
      }

      case "pitch_up":
      case "pitch_down": {
        axis = "y";
        raw = dyEma;
        metricPx = Math.abs(dyEma);
        metricNorm = Math.min(1, Math.abs(dyEma) / halfH);
        const wantUp = phase === "pitch_up";
        dirNeed = wantUp ? "up" : "down";
        dirNow = dyEma < -tolY ? "up" : dyEma > tolY ? "down" : "center";
        break;
      }

      default: {
        axis = "x";
        raw = 0;
        metricPx = 0;
        metricNorm = 0;
        dirNeed = "-";
        dirNow = "center";
      }
    }

    const prevRaw = this.prev
      ? axis === "x"
        ? this.prev.dxEma
        : this.prev.dyEma
      : raw;
    const denom = axis === "x" ? halfW : halfH;
    const velInst = (raw - prevRaw) / denom / dtSec;
    const velNorm = this.ema(0, Math.abs(velInst), this.cfg.emaAlphaVel);

    const enter = this.cfg.targetEnter!;
    const exit = this.cfg.targetExit!;
    const dirOK =
      (dirNeed === "left" && dirNow === "left") ||
      (dirNeed === "right" && dirNow === "right") ||
      (dirNeed === "up" && dirNow === "up") ||
      (dirNeed === "down" && dirNow === "down");

    let heldMs = 0;
    let pass = false;

    if (dirOK && metricNorm >= enter) {
      if (this.holdStart == null) this.holdStart = now;
      heldMs = now - (this.holdStart ?? now);
      pass = heldMs >= this.cfg.minHoldMs!;
    } else {
      const stillInBand = dirOK && metricNorm >= exit;
      if (!stillInBand) {
        this.holdStart = null;
        heldMs = 0;
      } else {
        heldMs = this.holdStart ? now - this.holdStart : 0;
      }
    }

    this.prev = { t: now, dxEma, dyEma };

    return {
      metricNorm,
      metricPx,
      needed: dirNeed,
      dirNow,
      dirOK,
      dxEma,
      dyEma,
      velNorm,
      enter,
      exit,
      heldMs,
      pass,
    };
  }

  private ema(prev: number, next: number, alpha: number) {
    return prev + alpha * (next - prev);
  }
}
