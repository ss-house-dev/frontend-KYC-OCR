// ===== Type shared สำหรับงานวาดบน overlay =====
export type Pt = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type FracRect = { x: number; y: number; w: number; h: number };

/** วาดเส้นสี่เหลี่ยมบน overlay (ไว้ debug/ไฮไลต์สี่เหลี่ยมที่ตรวจพบ) */
export function drawQuad(
  ctx: CanvasRenderingContext2D,
  pts: Pt[],
  color: string,
  width = 3
) {
  if (!pts?.length) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/** วาดกล่องใบหน้าจากสัดส่วน (FACE_BOX_FRAC) พร้อมกรอบ margin รอบนอก */
export function drawFaceBoxFromFrac(
  ctx: CanvasRenderingContext2D,
  guide: Rect,
  frac: FracRect,
  opts: {
    marginPct?: number;
    coreColor?: string;
    coreWidth?: number;
    outerColor?: string;
    outerWidth?: number;
    dash?: number[];
    offsetFracX?: number; // ⬅ เพิ่ม: ออฟเซ็ตเป็นสัดส่วนของ guide.w (เช่น -0.02 = ซ้าย 2%)
    offsetFracY?: number; // ⬅ เพิ่ม: ออฟเซ็ตเป็นสัดส่วนของ guide.h
    offsetPxX?: number;   // ⬅ เพิ่ม: ออฟเซ็ตเป็นพิกเซลแนวนอน (เช่น -8 = ซ้าย 8px)
    offsetPxY?: number;   // ⬅ เพิ่ม: ออฟเซ็ตเป็นพิกเซลแนวตั้ง
  } = {}
) {
  const {
    marginPct = 0.08,
    coreColor = "rgba(255,255,255,0.95)",
    coreWidth = 2,
    outerColor = "rgba(0,200,255,0.9)",
    outerWidth = 2,
    dash = [],
    offsetFracX = 0,
    offsetFracY = 0,
    offsetPxX = 0,
    offsetPxY = 0,
  } = opts;

  const offX = offsetFracX * guide.w + offsetPxX;
  const offY = offsetFracY * guide.h + offsetPxY;

  // กล่องแกนกลาง (ตาม FACE_BOX_FRAC + ออฟเซ็ต)
  const fx = guide.x + guide.w * frac.x + offX; // ตั้ง offset เป็นค่าลบ = ขยับซ้าย
  const fy = guide.y + guide.h * frac.y + offY;
  const fw = guide.w * frac.w;
  const fh = guide.h * frac.h;

  // กล่องรวม margin (ต้องตรงกับตอนครอป fallback)
  const m  = Math.max(fw, fh) * marginPct;
  const ox = fx - m;
  const oy = fy - m;
  const ow = fw + m * 2;
  const oh = fh + m * 2;

  // core
  ctx.save();
  ctx.setLineDash(dash);
  ctx.lineWidth = coreWidth;
  ctx.strokeStyle = coreColor;
  ctx.strokeRect(Math.round(fx), Math.round(fy), Math.round(fw), Math.round(fh));
  ctx.restore();

  // outer
  ctx.save();
  ctx.setLineDash(dash.length ? dash : [6, 6]);
  ctx.lineWidth = outerWidth;
  ctx.strokeStyle = outerColor;
  ctx.strokeRect(Math.round(ox), Math.round(oy), Math.round(ow), Math.round(oh));
  ctx.restore();
}
