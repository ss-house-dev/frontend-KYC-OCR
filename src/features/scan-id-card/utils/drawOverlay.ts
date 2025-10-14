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
    offsetFracX?: number;
    offsetFracY?: number;
    offsetPxX?: number;
    offsetPxY?: number;
    /** > 1 = ซูมออก, < 1 = ซูมเข้า (สเกลจากจุดกึ่งกลางของกล่อง) */
    zoom?: number;
    /** true = บังคับให้กรอบไม่ล้น guide */
    clampToGuide?: boolean;
  } = {}
) {
  const {
    marginPct = 0.12,
    coreColor = "rgba(255,255,255,0.95)",
    coreWidth = 2,
    outerColor = "rgba(0,200,255,0.9)",
    outerWidth = 2,
    dash = [],
    offsetFracX = -0.04,
    offsetFracY = 0,
    offsetPxX = 0,
    offsetPxY = 0,
    zoom = 1.35,
    clampToGuide = true,
  } = opts;

  const offX = offsetFracX * guide.w + offsetPxX;
  const offY = offsetFracY * guide.h + offsetPxY;

  // กล่องแกนกลางจาก frac (มุมซ้ายบนเป็นสัดส่วนของ guide) + ออฟเซ็ต
  let fx = guide.x + guide.w * frac.x + offX;
  let fy = guide.y + guide.h * frac.y + offY;
  let fw = guide.w * frac.w;
  let fh = guide.h * frac.h;

  // ซูมออก/เข้า โดยยึด "กึ่งกลาง" เดิม
  if (zoom !== 1 && zoom > 0) {
    const cx = fx + fw / 2;
    const cy = fy + fh / 2;
    const nfw = fw * zoom;
    const nfh = fh * zoom;
    fx = cx - nfw / 2;
    fy = cy - nfh / 2;
    fw = nfw;
    fh = nfh;
  }

  // บังคับให้อยู่ในกรอบ guide
  if (clampToGuide) {
    fx = Math.max(guide.x, Math.min(fx, guide.x + guide.w - fw));
    fy = Math.max(guide.y, Math.min(fy, guide.y + guide.h - fh));
  }

  // กล่องรวม margin (ใช้กับขั้นตอนครอป fallback ให้ตรงกัน)
  const m = Math.max(fw, fh) * marginPct;
  let ox = fx - m;
  let oy = fy - m;
  let ow = fw + m * 2;
  let oh = fh + m * 2;

  // บังคับ outer ให้อยู่ใน guide เช่นกัน (ถ้าเปิด clamp)
  if (clampToGuide) {
    const gx = guide.x,
      gy = guide.y,
      gr = guide.x + guide.w,
      gb = guide.y + guide.h;
    const nx = Math.max(gx, ox);
    const ny = Math.max(gy, oy);
    const nr = Math.min(gr, ox + ow);
    const nb = Math.min(gb, oy + oh);
    ox = nx;
    oy = ny;
    ow = Math.max(0, nr - nx);
    oh = Math.max(0, nb - ny);
  }

  // core
  ctx.save();
  ctx.setLineDash(dash);
  ctx.lineWidth = coreWidth;
  ctx.strokeStyle = coreColor;
  ctx.strokeRect(
    Math.round(fx),
    Math.round(fy),
    Math.round(fw),
    Math.round(fh)
  );
  ctx.restore();

  // outer (เส้นประค่าเริ่มต้น)
  ctx.save();
  ctx.setLineDash(dash.length ? dash : [6, 6]);
  ctx.lineWidth = outerWidth;
  ctx.strokeStyle = outerColor;
  ctx.strokeRect(
    Math.round(ox),
    Math.round(oy),
    Math.round(ow),
    Math.round(oh)
  );
  ctx.restore();
}
