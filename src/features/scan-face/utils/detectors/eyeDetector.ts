import { LM } from "../../configs/type";

type EyeSpec = Readonly<{
  p1: number;
  p4: number;
  p2: number;
  p6: number;
  p3: number;
  p5: number;
}>;

const LEFT_EYE: EyeSpec = {
  p1: 33,
  p4: 133,
  p2: 159,
  p6: 145,
  p3: 158,
  p5: 153,
};
const RIGHT_EYE: EyeSpec = {
  p1: 263,
  p4: 362,
  p2: 386,
  p6: 374,
  p3: 385,
  p5: 380,
};

export class EyeDetector {
  private static distXY(a: LM, b: LM, w: number, h: number): number {
    const ax = a.x * w;
    const ay = a.y * h;
    const bx = b.x * w;
    const by = b.y * h;
    return Math.hypot(ax - bx, ay - by);
  }

  private static calculateEAR(
    landmarks: LM[],
    w: number,
    h: number,
    spec: EyeSpec
  ): number {
    const p1 = landmarks[spec.p1];
    const p2 = landmarks[spec.p2];
    const p3 = landmarks[spec.p3];
    const p4 = landmarks[spec.p4];
    const p5 = landmarks[spec.p5];
    const p6 = landmarks[spec.p6];

    const vert = this.distXY(p2, p6, w, h) + this.distXY(p3, p5, w, h);
    const horiz = 2.0 * this.distXY(p1, p4, w, h);

    return horiz > 1e-6 ? vert / horiz : 0.0;
  }

  static getEyeAspectRatio(landmarks: LM[], w: number, h: number): number {
    const leftEAR = this.calculateEAR(landmarks, w, h, LEFT_EYE);
    const rightEAR = this.calculateEAR(landmarks, w, h, RIGHT_EYE);
    return (leftEAR + rightEAR) * 0.5;
  }
}
