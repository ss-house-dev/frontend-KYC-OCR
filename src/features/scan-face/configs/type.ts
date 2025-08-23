export type LM = { x: number; y: number; z: number; visibility?: number };
export type Phase =
  | "yaw_left"
  | "yaw_right"
  | "pitch_up"
  | "pitch_down"
  | "blink"
  | "mouth";
export type Rect4 = [number, number, number, number];

export interface FaceScanState {
  step: 1 | 2 | 3;
  phase: Phase | "-";
  fps: number;
  isReady: boolean;
}

export interface DetectionResult {
  landmarks: LM[] | null;
  bbox: Rect4 | null;
  brightness: number;
  yawDeg: number | null;
  pitchDeg: number | null;
  earValue: number | null;
  marValue: number | null;
}

export interface StepValidation {
  isValid: boolean;
  message: string;
  color: string;
}
