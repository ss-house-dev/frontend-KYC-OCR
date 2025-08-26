import { useEffect, useRef, useState, useCallback } from "react";
import { LM, FaceScanState, DetectionResult } from "../configs/type";
import { CONFIG } from "../configs/constant";
import {
  FaceMeshState,
  EMAManager,
  DetectionProcessor,
  StepProcessor,
} from "../utils/faceMesh";

/* ====== เงื่อนไข Try again แบบ “จับเวลา” ====== */
const STEP_TIMEOUT_MS = 30_000; // 30 วินาที/ขั้น เฉพาะ Step 1 และ Step 2

const INITIAL_DET: DetectionResult = {
  landmarks: null,
  bbox: null,
  brightness: 128,
  yawDeg: null,
  pitchDeg: null,
  earValue: null,
  marValue: null,
};

export function useFaceMesh(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  const [state, setState] = useState<FaceScanState>({
    step: 1,
    phase: "-",
    fps: 0,
    isReady: false,
  });

  // ===== Failed popup state =====
  const [failed, setFailed] = useState(false);
  const failedRef = useRef(false);
  useEffect(() => {
    failedRef.current = failed;
  }, [failed]);

  const [detectionResult, setDetectionResult] =
    useState<DetectionResult>(INITIAL_DET);

  // ===== Session-scoped refs (กัน BindingError) =====
  const faceMeshRef = useRef<any | null>(null);
  const cameraRef = useRef<any | null>(null);
  const processingRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const sessionIdRef = useRef(0); // เพิ่มทุกครั้งที่ setup ใหม่
  const closingRef = useRef(false); // กัน close ซ้ำจากหลายทาง

  // ====== Managers (สร้างใหม่ทั้งชุดเมื่อเริ่มสแกนใหม่) ======
  const managers = useRef<{
    state: FaceMeshState;
    ema: EMAManager;
    detector: DetectionProcessor | null;
    stepProcessor: StepProcessor | null;
  }>({
    state: new FaceMeshState(),
    ema: new EMAManager(),
    detector: null,
    stepProcessor: null,
  });

  const initManagers = useCallback(() => {
    const stateObj = new FaceMeshState();
    const emaObj = new EMAManager();
    const detector = new DetectionProcessor(stateObj, emaObj, setState);
    const stepProcessor = new StepProcessor(stateObj, emaObj);
    managers.current = {
      state: stateObj,
      ema: emaObj,
      detector,
      stepProcessor,
    };
  }, []);

  // init ครั้งแรก
  useEffect(() => {
    initManagers();
  }, [initManagers]);

  /* ====== ตัวจับเวลา Step ======
     - เริ่มจับเวลาเมื่อเข้าขั้น 1 หรือ 2
     - รีเซ็ตเมื่อเปลี่ยนขั้น
     - ถ้าเกิน 30s ในขั้นนั้น ๆ → failed
  */
  const stepStartAtRef = useRef<number | null>(null);
  const prevStepRef = useRef<number>(0); // เซ็ต 0 เพื่อให้การเข้าขั้น 1 ครั้งแรกถูกจับเป็น "เปลี่ยนขั้น"

  const processDetectionResults = useCallback((results: any) => {
    // ทิ้ง callback ถ้า session ถูกปิดไปแล้ว
    if (
      !canvasRef.current ||
      !managers.current.detector ||
      !managers.current.stepProcessor ||
      !faceMeshRef.current
    )
      return;

    const canvas = canvasRef.current;

    // FPS
    const fps = managers.current.detector.calculateFPS();
    if (fps !== null) setState((prev) => ({ ...prev, fps }));

    // landmarks
    const landmarks: LM[] | null = results.multiFaceLandmarks?.[0] || null;
    let detectionData: DetectionResult;

    if (landmarks) {
      detectionData = managers.current.detector.processLandmarks(
        landmarks,
        canvas
      );
    } else {
      managers.current.ema.boxEma.reset();
      detectionData = { ...INITIAL_DET };
    }

    setDetectionResult(detectionData);

    // ลอจิกเดิม: process step
    const { currentStep } = managers.current.state;
    if (currentStep === 1) {
      managers.current.stepProcessor.processStep1(
        detectionData,
        canvas.width,
        canvas.height
      );
    } else if (currentStep === 2) {
      managers.current.stepProcessor.processStep2(detectionData);
    }

    // ====== จัดการ "จับเวลา" ต่อขั้น ======
    const stepNow = managers.current.state.currentStep;

    // ถ้าเปลี่ยนขั้น ให้เริ่มจับเวลาใหม่เฉพาะขั้น 1/2
    if (prevStepRef.current !== stepNow) {
      prevStepRef.current = stepNow;
      if (stepNow === 1 || stepNow === 2) {
        stepStartAtRef.current = performance.now();
      } else {
        // ขั้นอื่น (เช่น 3/DONE) ไม่จับเวลา
        stepStartAtRef.current = null;
      }
    }

    // ถ้ายังอยู่ขั้น 1/2 และมีตัวจับเวลา → เช็กหมดเวลา
    if ((stepNow === 1 || stepNow === 2) && stepStartAtRef.current != null) {
      const elapsed = performance.now() - stepStartAtRef.current;
      if (elapsed >= STEP_TIMEOUT_MS) {
        setFailed(true); // โมดัลจะขึ้นเอง และ onFrame จะหยุดส่งเฟรม
        return;
      }
    }

    // Update UI state
    setState((prev) => ({
      ...prev,
      step: managers.current.state.currentStep,
      phase: stepNow === 2 ? managers.current.state.subPhase : "-",
    }));
  }, []);

  // ปิด session ปัจจุบันให้ "ปลอดภัยและเรียกซ้ำได้" (idempotent)
  const stopCurrentSession = useCallback(async () => {
    if (closingRef.current) return; // กันปิดซ้ำ
    closingRef.current = true;

    // ยกเลิก callback เก่าทั้งหมด
    sessionIdRef.current += 1;

    try {
      // 1) หยุดกล้อง
      try {
        cameraRef.current?.stop?.();
      } catch {}
      cameraRef.current = null;

      // 2) รอเฟรมค้างอยู่ให้จบ (สูงสุด ~1s)
      const t0 = performance.now();
      while (processingRef.current && performance.now() - t0 < 1000) {
        await new Promise((r) => setTimeout(r, 16));
      }
    } finally {
      // 3) ปิด FaceMesh (กลืน error ถ้าโดนปิดซ้ำ)
      try {
        faceMeshRef.current?.close?.();
      } catch {}
      faceMeshRef.current = null;

      processingRef.current = false;
      cleanupRef.current = null;
      closingRef.current = false;
    }
  }, []);

  const setupCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const mySessionId = ++sessionIdRef.current;

    try {
      const [{ FaceMesh }, { Camera }] = await Promise.all([
        import("@mediapipe/face_mesh"),
        import("@mediapipe/camera_utils"),
      ]);

      const faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMeshRef.current = faceMesh;

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        selfieMode: CONFIG.CAMERA.MIRRORED_INPUT,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((res: any) => {
        if (sessionIdRef.current !== mySessionId) return; // ทิ้ง callback เก่า
        processDetectionResults(res);
      });

      const cam = new Camera(videoRef.current!, {
        onFrame: async () => {
          if (sessionIdRef.current !== mySessionId) return;
          if (failedRef.current) return; // หยุดส่งเฟรมเมื่อ failed
          if (!videoRef.current) return;
          if (document.hidden) return;
          if (processingRef.current) return;

          processingRef.current = true;
          try {
            const fm = faceMeshRef.current;
            if (!fm) return;
            await fm.send({ image: videoRef.current });
          } finally {
            processingRef.current = false;
          }
        },
        width: CONFIG.DISPLAY.WIDTH,
        height: CONFIG.DISPLAY.HEIGHT,
      });
      cameraRef.current = cam;

      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: CONFIG.DISPLAY.WIDTH,
          height: CONFIG.DISPLAY.HEIGHT,
        },
        audio: false,
      });

      await cam.start();
      setState((prev) => ({ ...prev, isReady: true }));

      // cleanup ของ session นี้: เรียก stopCurrentSession เสมอ
      const cleanup = () => {
        void stopCurrentSession();
      };
      cleanupRef.current = cleanup;
      return cleanup;
    } catch (error) {
      console.error("Camera setup error:", error);
      throw error;
    }
  }, [processDetectionResults, stopCurrentSession]);

  // รีสตาร์ตทั้ง flow: stop เดิม → สร้าง managers ใหม่ → reset ทุกอย่าง → setup ใหม่
  const restartFromSetup = useCallback(async () => {
    // 1) ปิด session เดิมให้หมด
    await stopCurrentSession();

    // 2) สร้าง managers ใหม่ทั้งชุด (สำคัญมาก เพื่อรีเซ็ตเฟส/ตัวตั้งเวลาภายใน)
    initManagers();

    // 3) รีเซ็ตค่าหน้าจอและตัวจับเวลา step
    setFailed(false);
    setDetectionResult({ ...INITIAL_DET });
    setState({ step: 1, phase: "-", fps: 0, isReady: false });
    prevStepRef.current = 0; // บังคับให้จับ "เปลี่ยนขั้น" เมื่อเริ่มอ่านผลครั้งแรก
    stepStartAtRef.current = null; // เริ่มใหม่

    // 4) เริ่มกล้อง/FaceMesh ใหม่ (จะเข้าสtep 1 เสมอ)
    try {
      await setupCamera();
    } catch (e) {
      console.error("Restart setup error:", e);
    }
  }, [setupCamera, stopCurrentSession, initManagers]);

  // (ออปชัน) คงไว้กรณีคุณใช้ที่อื่น
  const resetStep2 = useCallback(() => {
    managers.current.state.reset();
    managers.current.ema.reset();
  }, []);

  return {
    state,
    detectionResult,
    setupCamera,
    resetStep2,

    failed,
    restartFromSetup,
  };
}
