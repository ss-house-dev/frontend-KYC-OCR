"use client";
import { useEffect, useRef } from "react";
import { FaceDetection } from "@mediapipe/face_detection";
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

export default function FacePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const faceDet = new FaceDetection({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });
    faceDet.setOptions({ model: "short", selfieMode: true });

    const faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      selfieMode: true,
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceDet.send({ image: videoRef.current! });
        await faceMesh.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      // cleanup
      videoRef.current?.pause();
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay muted playsInline width={640} height={480} />
      <canvas ref={canvasRef} width={640} height={480}></canvas>
    </div>
  );
}
