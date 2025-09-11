export type BBox = [number, number, number, number]; // x,y,w,h

export function shouldCapture(
  lastAt: number | null,
  intervalMs: number
): boolean {
  if (lastAt == null) return true;
  return performance.now() - lastAt >= intervalMs;
}

export async function captureToBlobURL(
  video: HTMLVideoElement,
  opts: { type?: string; quality?: number } = {}
): Promise<string | null> {
  const type = opts.type ?? "image/jpeg";
  const quality = opts.quality ?? 0.75;

  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return null;

  try {
    // @ts-ignore
    if (typeof OffscreenCanvas !== "undefined") {
      // @ts-ignore
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(video, 0, 0, w, h);
      // @ts-ignore
      const blob = await canvas.convertToBlob({ type, quality });
      if (!blob) return null;
      return URL.createObjectURL(blob);
    }
  } catch {
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);

  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, type, quality)
  );
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
