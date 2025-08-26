import React from "react";
import { LM, DetectionResult, FaceScanState } from "../../configs/type";
import { CONFIG } from "../../configs/constant";
import { FaceDetector, EyeDetector, MouthDetector } from "../detectors";
import { FaceMeshState } from "./FaceMeshState";
import { EMAManager } from "./EMAManager";

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
      // โค้ดเดิมสำหรับหน้าเดียว
      const bbox = FaceDetector.getBoundingBox(
        landmarks,
        canvas.width,
        canvas.height
      );
      const smoothedBox = this.ema.boxEma.update(bbox);
      const brightness = FaceDetector.calculateBrightness(ctx, smoothedBox);

      const { yawDeg: rawYaw, pitchDeg: rawPitch } =
        FaceDetector.estimateYawPitch(landmarks, canvas.width, canvas.height);
      this.updatePoseZeros(rawYaw, rawPitch);

      const yawDeg = this.ema.yawEma.update(
        rawYaw - (this.ema.yawZero.value ?? 0)
      );
      const pitchDeg = this.ema.pitchEma.update(
        rawPitch - (this.ema.pitchZero.value ?? 0)
      );

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
        yawDeg,
        pitchDeg,
        earValue,
        marValue,
      };
    });
  }

  private updatePoseZeros(rawYaw: number, rawPitch: number) {
    const { YAW_ZERO_UPDATE_BAND, PITCH_ZERO_UPDATE_BAND } = CONFIG.THRESHOLDS;

    if (
      !this.ema.yawZero.value ||
      Math.abs(rawYaw - this.ema.yawZero.value) <= YAW_ZERO_UPDATE_BAND
    ) {
      this.ema.yawZero.update(rawYaw);
    }
    if (
      !this.ema.pitchZero.value ||
      Math.abs(rawPitch - this.ema.pitchZero.value) <= PITCH_ZERO_UPDATE_BAND
    ) {
      this.ema.pitchZero.update(rawPitch);
    }
  }
}
