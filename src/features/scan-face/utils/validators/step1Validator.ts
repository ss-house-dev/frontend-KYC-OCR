import { DetectionResult, Rect4, StepValidation } from "../../configs/type";
import { CONFIG } from "../../configs/constant";

export class Step1Validator {
  static validateFaceCount(results: DetectionResult[]): StepValidation {
    const faceCount = results.length;
    if (faceCount === 0) {
      return {
        isValid: false,
        message: "No face found.",
        color: "red",
      };
    }

    if (faceCount > 1) {
      return {
        isValid: false,
        message: "Ensure only your face is in frame.",
        color: "red",
      };
    }

    return { isValid: true, message: "", color: "white" };
  }

  static validateBrightness(brightness: number): StepValidation {
    if (brightness <= CONFIG.BRIGHTNESS.DARK_THRESHOLD) {
      return {
        isValid: false,
        message: "The Face is too dark.",
        color: "red",
      };
    }

    if (brightness >= CONFIG.BRIGHTNESS.BRIGHT_THRESHOLD) {
      return {
        isValid: false,
        message: "The Face is too bright.",
        color: "red",
      };
    }

    return { isValid: true, message: "", color: "white" };
  }

  static validateFaceSize(bbox: Rect4): StepValidation {
    const [, , w, h] = bbox;
    const sizeMin = Math.min(w, h);

    if (sizeMin >= CONFIG.FACE_SIZE.NEAR_THRESHOLD) {
      return {
        isValid: false,
        message: `Move your face away.`,
        color: "red",
      };
    }

    if (sizeMin < CONFIG.FACE_SIZE.FAR_THRESHOLD) {
      return {
        isValid: false,
        message: `Move your face closer.`,
        color: "red",
      };
    }

    return {
      isValid: true,
      message: `OK | Medium `,
      color: "white",
    };
  }

  static validateFacePosition(
    bbox: Rect4,
    canvasWidth: number,
    canvasHeight: number
  ): StepValidation {
    const [x, y, w, h] = bbox;
    const frameCx = canvasWidth / 2;
    const frameCy = canvasHeight / 2;
    const cx = x + w / 2;
    const cy = y + h / 2;

    const isCenter =
      Math.abs(cx - frameCx) <=
        canvasWidth * CONFIG.POSITION.CENTER_TOLERANCE &&
      Math.abs(cy - frameCy) <= canvasHeight * CONFIG.POSITION.CENTER_TOLERANCE;

    if (isCenter) {
      return {
        isValid: true,
        message: "Look straight and stay still.",
        color: "white",
      };
    }

    return {
      isValid: false,
      message: "Please keep your face in frame.",
      color: "yellow",
    };
  }

  static validateStep1(
    detectionResults: DetectionResult[],
    canvasWidth: number,
    canvasHeight: number
  ): StepValidation & { canProceed: boolean } {
    // เช็คจำนวนใบหน้า
    const faceValidation = this.validateFaceCount(detectionResults);
    if (!faceValidation.isValid) {
      return { ...faceValidation, canProceed: false };
    }

    // ถ้ามีหน้าเดียว ให้เช็คเงื่อนไขอื่นต่อ
    const primaryFace = detectionResults[0];

    if (!primaryFace.bbox) {
      return {
        isValid: false,
        message: "No face detected",
        color: "red",
        canProceed: false,
      };
    }

    const brightnessValidation = this.validateBrightness(
      primaryFace.brightness
    );
    if (!brightnessValidation.isValid) {
      return { ...brightnessValidation, canProceed: false };
    }

    const sizeValidation = this.validateFaceSize(primaryFace.bbox);
    if (!sizeValidation.isValid) {
      return { ...sizeValidation, canProceed: false };
    }

    const positionValidation = this.validateFacePosition(
      primaryFace.bbox,
      canvasWidth,
      canvasHeight
    );
    return { ...positionValidation, canProceed: positionValidation.isValid };
  }
}
