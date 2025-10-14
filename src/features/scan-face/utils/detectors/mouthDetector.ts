import { LM } from "../../configs/type";

export class MouthDetector {
  private static distXY(a: LM, b: LM, w: number, h: number): number {
    const ax = a.x * w;
    const ay = a.y * h;
    const bx = b.x * w;
    const by = b.y * h;
    return Math.hypot(ax - bx, ay - by);
  }

  static getMouthAspectRatio(landmarks: LM[], w: number, h: number): number {
    const left = landmarks[61];
    const right = landmarks[291];
    const up = landmarks[13];
    const down = landmarks[14];

    const vert = this.distXY(up, down, w, h);
    const horiz = this.distXY(left, right, w, h);

    return horiz > 1e-6 ? vert / horiz : 0.0;
  }
}
