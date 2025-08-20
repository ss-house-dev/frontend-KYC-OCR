"use client";
import { useEffect, useRef } from "react";

const WIDTH = 640;
const HEIGHT = 480;

type LM = { x: number; y: number; z: number; visibility?: number };
type LMs = LM[];

declare global {
  interface Window {
    Camera: new (
      videoEl: HTMLVideoElement,
      opts: { onFrame: () => Promise<void> | void; width: number; height: number }
    ) => { start: () => Promise<void>; stop?: () => void };

    // รองรับทั้งสองทรง: window.FaceDetection หรือ window.FaceDetection.FaceDetection
    FaceDetection: any;
    FaceMesh: any;
  }
}

export default function FacePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    let alive = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.crossOrigin = "anonymous";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });

    // ผูก onResults ครั้งเดียว แล้วรอผลแบบ Promise
    function createAwaiter<F>(attach: (cb: (r: F) => void) => void) {
      let resolver: ((v: F) => void) | null = null;
      attach((r) => {
        if (resolver) {
          const done = resolver;
          resolver = null;
          done(r);
        }
      });
      return () => new Promise<F>((res) => (resolver = res));
    }

    let camera: InstanceType<typeof window.Camera> | null = null;

    (async () => {
      await Promise.all([
        loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"),
        loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js"),
        loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"),
      ]);

      // ดึง constructor ให้ครอบคลุมทั้งสองแบบ
      const FaceDetectionCtor =
        (window as any).FaceDetection?.FaceDetection ?? (window as any).FaceDetection;
      const FaceMeshCtor =
        (window as any).FaceMesh?.FaceMesh ?? (window as any).FaceMesh;

      if (!window.Camera || typeof FaceDetectionCtor !== "function" || typeof FaceMeshCtor !== "function") {
        throw new Error("MediaPipe globals not available (ctor not found)");
      }

      const faceDet = new FaceDetectionCtor({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
      });
      faceDet.setOptions({
        model: "short",
        minDetectionConfidence: 0.7,
        selfieMode: true,
      });

      const faceMesh = new FaceMeshCtor({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: true,
      });

      const nextFD = createAwaiter<any>((cb) => faceDet.onResults(cb));
      const nextFM = createAwaiter<any>((cb) => faceMesh.onResults(cb));

      camera = new window.Camera(video, {
        onFrame: async () => {
          if (!alive) return;

          await faceDet.send({ image: video });
          const fd = await nextFD();

          await faceMesh.send({ image: video });
          const fm = await nextFM();

          ctx.clearRect(0, 0, WIDTH, HEIGHT);
          ctx.save();
          ctx.setTransform(-1, 0, 0, 1, WIDTH, 0); // mirror
          ctx.drawImage(video, 0, 0, WIDTH, HEIGHT);

          // วาดกรอบจาก FaceDetection
          const dets = (fd?.detections ?? []) as any[];
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#ff3b3b";
          for (const det of dets) {
            const bb = det.boundingBox || det.locationData?.relativeBoundingBox;
            const rx = (bb?.xCenter ?? bb?.xMin ?? 0) - (bb?.width ?? 0) / 2;
            const ry = (bb?.yCenter ?? bb?.yMin ?? 0) - (bb?.height ?? 0) / 2;
            const rw = bb?.width ?? 0, rh = bb?.height ?? 0;
            const x = Math.max(0, Math.round(rx * WIDTH));
            const y = Math.max(0, Math.round(ry * HEIGHT));
            const w = Math.max(1, Math.round(rw * WIDTH));
            const h = Math.max(1, Math.round(rh * HEIGHT));
            ctx.strokeRect(x, y, w, h);
          }

          // วาด landmark จาก FaceMesh
          const lm2d = (fm?.multiFaceLandmarks?.[0] ?? []) as LMs;
          if (lm2d.length) {
            ctx.fillStyle = "#ffffff";
            for (const p of lm2d) {
              const x = Math.round(p.x * WIDTH);
              const y = Math.round(p.y * HEIGHT);
              if (x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT) ctx.fillRect(x, y, 2, 2);
            }
          }

          ctx.restore();
        },
        width: WIDTH,
        height: HEIGHT,
      });

      await camera.start();
    })().catch((e) => {
      console.error(e);
      alert(
        e?.message?.includes("Permission")
          ? "สิทธิ์กล้องไม่ผ่าน / ไม่ใช่ HTTPS / เบราว์เซอร์บล็อก ลองเช็คสิทธิ์กับโปรโตคอลอีกที"
          : `Init error: ${e.message || e}`
      );
    });

    return () => {
      alive = false;
      try { camera?.stop?.(); } catch {}
      const stream = video.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      video.pause();
    };
  }, []);

  return (
    <div style={{ width: WIDTH, height: HEIGHT, position: "relative" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width={WIDTH}
        height={HEIGHT}
        style={{ width: "100%", height: "100%", transform: "scaleX(-1)", objectFit: "cover" }}
      />
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
