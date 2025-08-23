import { Phase } from '../../configs/type';

export class FaceMeshState {
  currentStep = 1 as 1 | 2 | 3;
  subPhase = "yaw_left" as Phase;
  step1HoldStart: number | null = null;
  holdStart: number | null = null;
  blinkCloseStart: number | null = null;
  blinkDone = false;
  mouthOpenStart: number | null = null;
  mouthCloseStart: number | null = null;
  mouthDone = false;
  lastFpsTime = performance.now();
  frameCount = 0;

  reset() {
    this.subPhase = "yaw_left";
    this.holdStart = null;
    this.blinkCloseStart = null;
    this.blinkDone = false;
    this.mouthOpenStart = null;
    this.mouthCloseStart = null;
    this.mouthDone = false;
  }
}