export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 12,
  color = "rgba(255,255,255,1)",
  thickness = 2
) {
  ctx.save();
  ctx.lineWidth = thickness;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.stroke();
  ctx.restore();
}

export function banner(ctx: CanvasRenderingContext2D, text: string, y = 80) {
  if (!text) return;
  ctx.save();
  ctx.font = "16px system-ui, sans-serif";
  const padX = 10,
    padY = 8;
  const tw = ctx.measureText(text).width;
  const th = 18;
  const w = ctx.canvas.width;
  const x1 = Math.max(0, Math.floor((w - tw) / 2) - padX);
  const y1 = Math.max(0, y);
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(x1, y1, tw + padX * 2, th + padY * 2);
  ctx.fillStyle = "#fff";
  ctx.fillText(text, x1 + padX, y1 + th);
  ctx.restore();
}

export function putLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number
) {
  if (!text) return;
  ctx.save();
  ctx.font = "14px system-ui, sans-serif";
  const pad = 4;
  const tw = ctx.measureText(text).width;
  const th = 16;
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(x, y - th - pad * 2, tw + pad * 2, th + pad * 2);
  ctx.fillStyle = "#fff";
  ctx.fillText(text, x + pad, y - pad);
  ctx.restore();
}

export function alertFrame(
  ctx: CanvasRenderingContext2D,
  color = "rgba(255,0,0,1)",
  thickness = 4
) {
  ctx.save();
  ctx.lineWidth = thickness;
  ctx.strokeStyle = color;
  ctx.strokeRect(2, 2, ctx.canvas.width - 4, ctx.canvas.height - 4);
  ctx.restore();
}

export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  radius = 1,
  color = "white"
) {
  ctx.save();
  ctx.fillStyle = color;
  const w = ctx.canvas.width,
    h = ctx.canvas.height;
  for (const p of landmarks) {
    const cx = Math.floor(p.x * w),
      cy = Math.floor(p.y * h);
    if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function applySharpenToImageData(
  img: ImageData,
  kernel: number[][]
): ImageData {
  const w = img.width,
    h = img.height,
    data = img.data;
  const out = new Uint8ClampedArray(data.length);

  const idx = (x: number, y: number, c: number) => (y * w + x) * 4 + c;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sum += data[idx(x + kx, y + ky, c)] * kernel[ky + 1][kx + 1];
          }
        }
        let val = Math.round(sum);
        val = Math.max(0, Math.min(255, val));
        out[idx(x, y, c)] = val;
      }
      out[idx(x, y, 3)] = data[idx(x, y, 3)];
    }
  }

  // Copy border pixels unchanged
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < 4; c++) {
      out[idx(x, 0, c)] = data[idx(x, 0, c)];
      out[idx(x, h - 1, c)] = data[idx(x, h - 1, c)];
    }
  }
  for (let y = 0; y < h; y++) {
    for (let c = 0; c < 4; c++) {
      out[idx(0, y, c)] = data[idx(0, y, c)];
      out[idx(w - 1, y, c)] = data[idx(w - 1, y, c)];
    }
  }

  return new ImageData(out, w, h);
}
