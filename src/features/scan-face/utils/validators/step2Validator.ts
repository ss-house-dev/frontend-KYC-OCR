import { Phase } from "../../configs/type";
import { CONFIG } from "../../configs/constant";

export class Step2Validator {
  static validateYawLeft(yawDeg: number): {
    entered: boolean;
    remaining: number;
  } {
    const achieved = Math.max(0, yawDeg);
    const remaining = Math.max(0, CONFIG.THRESHOLDS.YAW_ENTER_DEG - achieved);
    const entered = yawDeg >= CONFIG.THRESHOLDS.YAW_ENTER_DEG;
    return { entered, remaining };
  }

  static validateYawRight(yawDeg: number): {
    entered: boolean;
    remaining: number;
  } {
    const achieved = Math.max(0, -yawDeg);
    const remaining = Math.max(0, CONFIG.THRESHOLDS.YAW_ENTER_DEG - achieved);
    const entered = yawDeg <= -CONFIG.THRESHOLDS.YAW_ENTER_DEG;
    return { entered, remaining };
  }

  static validatePitchUp(pitchDeg: number): {
    entered: boolean;
    remaining: number;
  } {
    const achieved = Math.max(0, -pitchDeg);
    const remaining = Math.max(0, CONFIG.THRESHOLDS.PITCH_ENTER_DEG - achieved);
    const entered = pitchDeg <= -CONFIG.THRESHOLDS.PITCH_ENTER_DEG;
    return { entered, remaining };
  }

  static validatePitchDown(pitchDeg: number): {
    entered: boolean;
    remaining: number;
  } {
    const achieved = Math.max(0, pitchDeg);
    const remaining = Math.max(0, CONFIG.THRESHOLDS.PITCH_ENTER_DEG - achieved);
    const entered = pitchDeg >= CONFIG.THRESHOLDS.PITCH_ENTER_DEG;
    return { entered, remaining };
  }

  static validateBlink(earValue: number, baselineEAR: number): boolean {
    const threshold = baselineEAR * CONFIG.THRESHOLDS.BLINK_THRESH_FRACTION;
    return earValue <= threshold;
  }

  static validateMouthOpen(marValue: number, baselineMAR: number): boolean {
    const threshold = baselineMAR + CONFIG.THRESHOLDS.MOUTH_OPEN_DELTA;
    return marValue >= threshold;
  }

  static getPhaseInstruction(phase: Phase): string {
    const instructions = {
      yaw_left: "Please turn your face left.",
      yaw_right: "Please turn your face right.",
      pitch_up: "Nod your head up.",
      pitch_down: "Nod your head down.",
      blink: "Please blink your eyes.",
      mouth: "Please open your mouth.",
    };
    return instructions[phase];
  }

  static getPhaseProgress(
    phase: Phase,
    yawDeg: number | null,
    pitchDeg: number | null
  ): string {
    if (!yawDeg && !pitchDeg) return "";

    switch (phase) {
      case "yaw_left":
        if (yawDeg !== null) {
          const { remaining } = this.validateYawLeft(yawDeg);
          return `left: ${remaining.toFixed(1)}`;
        }
        break;
      case "yaw_right":
        if (yawDeg !== null) {
          const { remaining } = this.validateYawRight(yawDeg);
          return `right: ${remaining.toFixed(1)}`;
        }
        break;
      case "pitch_up":
        if (pitchDeg !== null) {
          const { remaining } = this.validatePitchUp(pitchDeg);
          return `up: ${remaining.toFixed(1)}`;
        }
        break;
      case "pitch_down":
        if (pitchDeg !== null) {
          const { remaining } = this.validatePitchDown(pitchDeg);
          return `down: ${remaining.toFixed(1)}`;
        }
        break;
      default:
        return "";
    }
    return "";
  }
}
