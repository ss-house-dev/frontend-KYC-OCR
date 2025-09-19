import React from "react";
import { LM, DetectionResult, FaceScanState } from "../../configs/type";
import { CONFIG } from "../../configs/constant";
import { FaceDetector, EyeDetector, MouthDetector } from "../detectors";
import { FaceMeshState } from "./FaceMeshState";
import { EMAManager } from "./EMAManager";

/**
 * DetectionProcessor
 * - คำนวณ bbox, ความสว่าง
 * - วัดออฟเซ็ต "ปลายจมูก" เทียบกับเครื่องหมายบวกกลางจอ (signed offset)
 *   * yawDeg  = ออฟเซ็ตแกน X แบบ normalized (ซ้าย = ลบ, ขวา = บวก) หลัง apply MIRRORED_INPUT
 *   * pitchDeg= ออฟเซ็ตแกน Y แบบ normalized (ขึ้น = ลบ, ลง = บวก)
 * - ทำ zero-tracking + EMA (ยังคงไว้ ถ้าต้องการความนิ่ง)
 */
export class DetectionProcessor {
  constructor(
    private state: FaceMeshState,
    private ema: EMAManager,
    private setState: React.Dispatch<React.SetStateAction<FaceScanState>>
  ) {}

  calculateFPS(): number | null {
    const now = performance.now();
    this.state.frameCount++;
    if (now - this.state.lastFpsTime >= 1000) {
      const fps = Math.round(
        (this.state.frameCount * 1000) / (now - this.state.lastFpsTime)
      );
      this.state.frameCount = 0;
      this.state.lastFpsTime = now;
      return fps;
    }
    return null;
  }

  processLandmarks(
    faces: LM[][],
    canvas: HTMLCanvasElement
  ): DetectionResult[] {
    const ctx = canvas.getContext("2d")!;

    return faces.map((landmarks) => {
      // 1) BBox + Brightness (ใช้ FaceDetector เดิม + EMA กล่อง)
      const bbox = FaceDetector.getBoundingBox(
        landmarks,
        canvas.width,
        canvas.height
      );
      const smoothedBox = this.ema.boxEma.update(bbox);
      const brightness = FaceDetector.calculateBrightness(ctx, smoothedBox);

      // 2) วัดออฟเซ็ตปลายจมูกเทียบ "จุดบวกกลางจอ"
      const { yawNorm, pitchNorm } = signedNoseOffsets(
        landmarks,
        canvas.width,
        canvas.height,
        CONFIG.CAMERA.MIRRORED_INPUT
      );

      // 3) อัปเดต zero เฉพาะตอนอยู่ใกล้ศูนย์ (ยังคงกลไกเดิมไว้เพื่อความนิ่ง)
      this.updatePoseZeros(yawNorm, pitchNorm);

      // 4) หัก zero แล้วทำ EMA (ได้ค่า yawDeg/pitchDeg เป็นออฟเซ็ต normalized หลังปรับศูนย์)
      const yawAdj = yawNorm - (this.ema.yawZero.value ?? 0);
      const pitchAdj = pitchNorm - (this.ema.pitchZero.value ?? 0);

      const yawDeg = this.ema.yawEma.update(yawAdj);
      const pitchDeg = this.ema.pitchEma.update(pitchAdj);

      this.ema.yawFast.update(yawAdj);
      this.ema.yawSlow.update(yawAdj);
      this.ema.pitchFast.update(pitchAdj);
      this.ema.pitchSlow.update(pitchAdj);

      // 5) EAR / MAR
      const earValue = EyeDetector.getEyeAspectRatio(
        landmarks,
        canvas.width,
        canvas.height
      );
      const marValue = MouthDetector.getMouthAspectRatio(
        landmarks,
        canvas.width,
        canvas.height
      );

      return {
        landmarks,
        bbox: smoothedBox,
        brightness,
        // หมายเหตุ: ตอนนี้ field ชื่อ yawDeg/pitchDeg = "ระยะออฟเซ็ต normalized"
        // (หน่วยเชิงสัดส่วนกับครึ่งจอ) ไม่ใช่องศาจริง เพื่อให้สอดคล้อง requirement
        yawDeg,
        pitchDeg,
        earValue,
        marValue,
      };
    });
  }

  /** อัปเดตค่าอ้างอิงศูนย์ (zero) เมื่อศีรษะอยู่ใกล้ตำแหน่งกลาง */
  private updatePoseZeros(rawYaw: number, rawPitch: number) {
    const { YAW_ZERO_UPDATE_BAND, PITCH_ZERO_UPDATE_BAND } = CONFIG.THRESHOLDS;

    if (
      this.ema.yawZero.value == null ||
      Math.abs(rawYaw - this.ema.yawZero.value) <= YAW_ZERO_UPDATE_BAND
    ) {
      this.ema.yawZero.update(rawYaw);
    }
    if (
      this.ema.pitchZero.value == null ||
      Math.abs(rawPitch - this.ema.pitchZero.value) <= PITCH_ZERO_UPDATE_BAND
    ) {
      this.ema.pitchZero.update(rawPitch);
    }
  }
}

/* ======================= Helpers ======================= */

/** index หลักของปลายจมูก (MediaPipe FaceMesh) */
const L = { noseTip: 1 } as const;

/**
 * คำนวณออฟเซ็ตแบบมีเครื่องหมายของ "ปลายจมูก" เทียบกับเครื่องหมายบวกกลางจอ
 * - คืนค่าเป็น normalized โดยหารด้วย "ครึ่งหนึ่งของความกว้าง/สูงจอ"
 * - แนวแกน:
 *   * X (ซ้าย/ขวา): ซ้ายเป็นลบ, ขวาเป็นบวก (หลังพิจารณา MIRRORED_INPUT แล้ว)
 *   * Y (ขึ้น/ลง): ขึ้นเป็นลบ, ลงเป็นบวก (คุมให้เข้ากับ intuition ของผู้ใช้)
 */
function signedNoseOffsets(
  landmarks: LM[],
  canvasW: number,
  canvasH: number,
  mirrored: boolean
) {
  const nose = landmarks[L.noseTip];
  if (!nose) return { yawNorm: 0, pitchNorm: 0 };

  // พิกัดจอ (px)
  let xPx = nose.x * canvasW;
  const yPx = nose.y * canvasH;

  // ถ้าวิดีโอถูก mirror ตอนแสดงผล ให้กลับแกน X ของจุดเพื่อความสอดคล้องกับภาพที่ผู้ใช้เห็น
  if (mirrored) xPx = canvasW - xPx;

  const cx = canvasW / 2;
  const cy = canvasH / 2;

  // ออฟเซ็ตเป็นสัดส่วนกับ "ครึ่งจอ" → ขอบซ้าย = -1, ขอบขวา = +1
  const yawNorm = (xPx - cx) / (canvasW / 2); // ซ้ายลบ/ขวาบวก
  const pitchNorm = (yPx - cy) / (canvasH / 2); // ขึ้นลบ/ลงบวก (เพราะ y ลงล่าง)

  // clamp กันค่าเผื่อเลยขอบ
  return {
    yawNorm: clampFinite(yawNorm, -1, 1),
    pitchNorm: clampFinite(pitchNorm, -1, 1),
  };
}

function clampFinite(v: number, lo: number, hi: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.max(lo, Math.min(hi, v));
}
