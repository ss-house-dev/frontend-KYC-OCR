import { DetectionResult, Phase } from "../../configs/type";
import { CONFIG } from "../../configs/constant";
import { Step1Validator, Step2Validator } from "../validators";
import { FaceMeshState } from "./FaceMeshState";
import { EMAManager } from "./EMAManager";

export class StepProcessor {
  constructor(
    private state: FaceMeshState,
    private ema: EMAManager
  ) {}

  processStep1(
    detections: DetectionResult[],
    canvasWidth: number,
    canvasHeight: number
  ) {
    const validation = Step1Validator.validateStep1(
      detections,
      canvasWidth,
      canvasHeight
    );

    if (validation.canProceed) {
      if (!this.state.step1HoldStart) {
        this.state.step1HoldStart = performance.now();
      } else if (
        (performance.now() - this.state.step1HoldStart) / 1000 >=
        CONFIG.TIMING.STEP1_HOLD_SECONDS
      ) {
        this.state.currentStep = 2;
        this.state.reset();
        this.ema.reset();
      }
    } else {
      this.state.step1HoldStart = null;
    }
  }

  processStep2(detection: DetectionResult) {
    if (!this.isValidDetection(detection)) return;

    const { yawDeg, pitchDeg, earValue, marValue } = detection;
    this.updateBaselines(earValue!, marValue!);

    const handlers = {
      yaw_left: () => this.handleYawLeft(yawDeg!),
      yaw_right: () => this.handleYawRight(yawDeg!),
      pitch_up: () => this.handlePitchUp(pitchDeg!),
      pitch_down: () => this.handlePitchDown(pitchDeg!),
      blink: () => this.handleBlink(earValue!),
      mouth: () => this.handleMouth(marValue!),
    };

    handlers[this.state.subPhase]?.();
  }

  private isValidDetection(detection: DetectionResult): boolean {
    return !!(
      detection.landmarks &&
      detection.yawDeg !== null &&
      detection.pitchDeg !== null &&
      detection.earValue !== null &&
      detection.marValue !== null
    );
  }

  private updateBaselines(earValue: number, marValue: number) {
    if (
      this.state.subPhase === "blink" &&
      (!this.ema.earBase.value || earValue > this.ema.earBase.value * 0.9)
    ) {
      this.ema.earBase.update(earValue);
    }
    if (
      this.state.subPhase === "mouth" &&
      (!this.ema.marBase.value || marValue < this.ema.marBase.value * 1.1)
    ) {
      this.ema.marBase.update(marValue);
    }
  }

  private handlePhaseTransition(
    validator: () => boolean,
    nextPhase: Phase,
    holdTime: number,
    exitCondition?: () => boolean
  ) {
    const now = performance.now();

    if (validator()) {
      if (!this.state.holdStart) {
        this.state.holdStart = now;
      } else if ((now - this.state.holdStart) / 1000 >= holdTime) {
        this.state.subPhase = nextPhase;
        this.state.holdStart = null;
      }
    } else if (exitCondition?.()) {
      this.state.holdStart = null;
    }
  }

  private handleYawLeft(yawDeg: number) {
    this.handlePhaseTransition(
      () => Step2Validator.validateYawLeft(yawDeg).entered,
      "yaw_right",
      CONFIG.TIMING.STEP2_YAW_HOLD_SECONDS,
      () => yawDeg < CONFIG.THRESHOLDS.YAW_EXIT_DEG
    );
  }

  private handleYawRight(yawDeg: number) {
    this.handlePhaseTransition(
      () => Step2Validator.validateYawRight(yawDeg).entered,
      "pitch_up",
      CONFIG.TIMING.STEP2_YAW_HOLD_SECONDS,
      () => yawDeg > -CONFIG.THRESHOLDS.YAW_EXIT_DEG
    );
  }

  private handlePitchUp(pitchDeg: number) {
    this.handlePhaseTransition(
      () => Step2Validator.validatePitchUp(pitchDeg).entered,
      "pitch_down",
      CONFIG.TIMING.STEP2_PITCH_HOLD_SECONDS,
      () => pitchDeg > -CONFIG.THRESHOLDS.PITCH_EXIT_DEG
    );
  }

  private handlePitchDown(pitchDeg: number) {
    this.handlePhaseTransition(
      () => Step2Validator.validatePitchDown(pitchDeg).entered,
      "blink",
      CONFIG.TIMING.STEP2_PITCH_HOLD_SECONDS,
      () => pitchDeg < CONFIG.THRESHOLDS.PITCH_EXIT_DEG
    );
  }

  private handleBlink(earValue: number) {
    const baselineEAR = this.ema.earBase.value ?? earValue;
    const isBlink = Step2Validator.validateBlink(earValue, baselineEAR);
    const now = performance.now();

    if (isBlink) {
      if (!this.state.blinkCloseStart) {
        this.state.blinkCloseStart = now;
      } else if (
        (now - this.state.blinkCloseStart) / 1000 >=
        CONFIG.TIMING.BLINK_MIN_SECONDS
      ) {
        this.state.blinkDone = true;
      }
    } else {
      this.state.blinkCloseStart = null;
    }

    if (this.state.blinkDone) {
      this.state.subPhase = "mouth";
      this.state.blinkCloseStart = null;
    }
  }

  private handleMouth(marValue: number) {
    const baselineMAR = this.ema.marBase.value ?? marValue;
    const isMouthOpen = Step2Validator.validateMouthOpen(marValue, baselineMAR);
    const now = performance.now();

    if (isMouthOpen) {
      if (!this.state.mouthOpenStart) {
        this.state.mouthOpenStart = now;
      }
    } else if (this.state.mouthOpenStart) {
      if (!this.state.mouthCloseStart) {
        this.state.mouthCloseStart = now;
      } else if (
        (now - this.state.mouthCloseStart) / 1000 >=
        CONFIG.TIMING.MOUTH_CLOSE_MIN_SECONDS
      ) {
        this.state.mouthDone = true;
      }
    }

    if (this.state.mouthDone) {
      this.state.currentStep = 3;
    }
  }
}
