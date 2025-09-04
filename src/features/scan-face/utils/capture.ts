export type BBox = [number, number, number, number]; // x, y, w, h (พิกัดจากเฟรมจริงของวิดีโอ)

export function cropFaceToDataURL(
  video: HTMLVideoElement,
  bbox: BBox,
  targetSize = 256,
  quality = 0.92,
  pad = 30
): string {
  const [x, y, w, h] = bbox;

  const px = Math.round(x - pad);
  const py = Math.round(y - pad);
  const pw = Math.round(w + pad * 2);
  const ph = Math.round(h + pad * 2);

  const vw = video.videoWidth || (video as any).width || 0;
  const vh = video.videoHeight || (video as any).height || 0;
  if (!vw || !vh) return "";

  const sx = Math.max(0, px);
  const sy = Math.max(0, py);
  const ex = Math.min(vw, px + pw);
  const ey = Math.min(vh, py + ph);
  const sw = Math.max(1, ex - sx);
  const sh = Math.max(1, ey - sy);

  const off = document.createElement("canvas");
  off.width = targetSize;
  off.height = targetSize;
  const ctx = off.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetSize, targetSize);
  return off.toDataURL("image/jpeg", quality);
}

/** ครอปพอร์ตเทรต: ขยายเป็นสี่เหลี่ยมจาก bbox + เลื่อนขึ้นเล็กน้อย ให้ได้เฟรม */
export function cropFacePortraitToDataURL(
  video: HTMLVideoElement,
  bbox: BBox,
  opts?: {
    targetSize?: number;     // default 320
    quality?: number;        // default 0.92
    scale?: number;          // ขยายจาก max(w,h), default 1.5
    yShiftRatio?: number;    // เลื่อนขึ้น/ลงเป็นสัดส่วนของด้านสี่เหลี่ยม (ลบ=เลื่อนขึ้น), default -0.06
  }
): string {
  const { targetSize = 320, quality = 0.92, scale = 1.5, yShiftRatio = -0.06 } =
    opts ?? {};
  const [x, y, w, h] = bbox;

  const vw = video.videoWidth || (video as any).width || 0;
  const vh = video.videoHeight || (video as any).height || 0;
  if (!vw || !vh) return "";

  const side0 = Math.max(w, h);
  const side = Math.round(side0 * scale);

  const cx = x + w / 2;
  const cy = y + h / 2;

  const yShift = Math.round(side * yShiftRatio);

  const left = Math.round(cx - side / 2);
  const top = Math.round(cy - side / 2 + yShift);

  const sx = Math.max(0, left);
  const sy = Math.max(0, top);
  const ex = Math.min(vw, left + side);
  const ey = Math.min(vh, top + side);
  const sw = Math.max(1, ex - sx);
  const sh = Math.max(1, ey - sy);

  const off = document.createElement("canvas");
  off.width = targetSize;
  off.height = targetSize;
  const ctx = off.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetSize, targetSize);
  return off.toDataURL("image/jpeg", quality);
}

export function shouldCapture(lastAt: number | null, minIntervalMs: number) {
  const now = performance.now();
  return !lastAt || now - lastAt >= minIntervalMs;
}
