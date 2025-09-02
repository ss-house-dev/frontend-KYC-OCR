import { LM, Rect4 } from "../../configs/type";
import { CONFIG } from "../../configs/constant";

export class FaceDetector {
  private static clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
  }

  private static distXY(a: LM, b: LM, w: number, h: number): number {
    const ax = a.x * w;
    const ay = a.y * h;
    const bx = b.x * w;
    const by = b.y * h;
    return Math.hypot(ax - bx, ay - by);
  }

  static getBoundingBox(landmarks: LM[], w: number, h: number): Rect4 {
    let xmin = 1,
      ymin = 1,
      xmax = 0,
      ymax = 0;

    for (const p of landmarks) {
      xmin = Math.min(xmin, p.x);
      ymin = Math.min(ymin, p.y);
      xmax = Math.max(xmax, p.x);
      ymax = Math.max(ymax, p.y);
    }

    const xx = Math.floor(this.clamp(xmin, 0, 1) * w);
    const yy = Math.floor(this.clamp(ymin, 0, 1) * h);
    const ww = Math.max(
      1,
      Math.floor((this.clamp(xmax, 0, 1) - this.clamp(xmin, 0, 1)) * w)
    );
    const hh = Math.max(
      1,
      Math.floor((this.clamp(ymax, 0, 1) - this.clamp(ymin, 0, 1)) * h)
    );

    return [xx, yy, ww, hh];
  }

  static calculateBrightness(
    ctx: CanvasRenderingContext2D,
    bbox: Rect4
  ): number {
    const [x, y, w, h] = bbox;
    const x1 = this.clamp(x, 0, ctx.canvas.width - 1);
    const y1 = this.clamp(y, 0, ctx.canvas.height - 1);
    const x2 = this.clamp(x + w, 0, ctx.canvas.width);
    const y2 = this.clamp(y + h, 0, ctx.canvas.height);

    if (x2 <= x1 || y2 <= y1) return 128;

    const roi = ctx.getImageData(x1, y1, x2 - x1, y2 - y1);
    let sum = 0;

    for (let i = 0; i < roi.data.length; i += 4) {
      sum +=
        0.299 * roi.data[i] + 0.587 * roi.data[i + 1] + 0.114 * roi.data[i + 2];
    }

    return Math.round(sum / (roi.data.length / 4 || 1));
  }

  // static estimateYawPitch(
  //   landmarks: LM[],
  //   w: number,
  //   h: number
  // ): { yawDeg: number; pitchDeg: number } {
  //   const nose = landmarks[1];
  //   const eyeL = landmarks[33];
  //   const eyeR = landmarks[263];

  //   const midEye: LM = {
  //     x: (eyeL.x + eyeR.x) / 2,
  //     y: (eyeL.y + eyeR.y) / 2,
  //     z: (eyeL.z + eyeR.z) / 2,
  //   };

  //   const eyeDistPx = this.distXY(eyeL, eyeR, w, h) || 1;
  //   const dx = (nose.x - midEye.x) * w;
  //   const dy = (nose.y - midEye.y) * h;

  //   let yawDeg = (Math.atan2(dx, eyeDistPx) * 180) / Math.PI;
  //   const pitchDeg = (Math.atan2(dy, eyeDistPx) * 180) / Math.PI;

  //   if (CONFIG.CAMERA.MIRRORED_INPUT) yawDeg = -yawDeg;

  //   return { yawDeg, pitchDeg };
  // }

  // ปรับปรุง pose estimation ให้แม่นยำกว่า
  static estimateYawPitch(
    landmarks: LM[],
    w: number,
    h: number
  ): { yawDeg: number; pitchDeg: number } {
    // ใช้หลายจุดอ้างอิงเพื่อความแม่นยำ
    const nose = landmarks[1];
    const eyeL = landmarks[33];
    const eyeR = landmarks[263];
    const mouthL = landmarks[61];
    const mouthR = landmarks[291];
    const chin = landmarks[175];

    // Method 1: Eye-based (เดิม)
    const midEye: LM = {
      x: (eyeL.x + eyeR.x) / 2,
      y: (eyeL.y + eyeR.y) / 2,
      z: (eyeL.z + eyeR.z) / 2,
    };

    const eyeDistPx = this.distXY(eyeL, eyeR, w, h) || 1;
    const dx1 = (nose.x - midEye.x) * w;
    const dy1 = (nose.y - midEye.y) * h;

    const yaw1 = (Math.atan2(dx1, eyeDistPx) * 180) / Math.PI;
    const pitch1 = (Math.atan2(dy1, eyeDistPx) * 180) / Math.PI;

    // Method 2: Mouth-based (เพิ่มเติม)
    const midMouth: LM = {
      x: (mouthL.x + mouthR.x) / 2,
      y: (mouthL.y + mouthR.y) / 2,
      z: (mouthL.z + mouthR.z) / 2,
    };

    const mouthDistPx = this.distXY(mouthL, mouthR, w, h) || 1;
    const dx2 = (nose.x - midMouth.x) * w;

    const yaw2 = (Math.atan2(dx2, mouthDistPx) * 180) / Math.PI;

    // Method 3: ใช้ chin เป็น reference เพิ่มเติม
    const dx3 = (nose.x - chin.x) * w;
    const dy3 = (nose.y - chin.y) * h;
    const chinDistPx = Math.hypot(dx3, dy3) || 1;
    
    const pitch3 = (Math.atan2(dy3, chinDistPx) * 180) / Math.PI;

    // Weighted average ให้น้ำหนักตา 60%, ปาก 25%, คาง 15%
    let yawDeg = yaw1 * 0.6 + yaw2 * 0.4;
    const pitchDeg = pitch1 * 0.7 + pitch3 * 0.3;

    if (CONFIG.CAMERA.MIRRORED_INPUT) yawDeg = -yawDeg;

    return { yawDeg, pitchDeg };
  }

  static processFaces(
    faces: LM[][],
    w: number,
    h: number,
    ctx: CanvasRenderingContext2D
  ) {
    return faces.map((landmarks) => {
      const bbox = this.getBoundingBox(landmarks, w, h);
      const brightness = this.calculateBrightness(ctx, bbox);
      const { yawDeg, pitchDeg } = this.estimateYawPitch(landmarks, w, h);
      return {
        landmarks,
        bbox,
        brightness,
        yawDeg,
        pitchDeg,
        earValue: null,
        marValue: null,
      };
    });
  }

  static countFaces(faces: LM[][]): number {
    return faces.length;
  }
}
