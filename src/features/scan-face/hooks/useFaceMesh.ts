import { useEffect, useRef, useState, useCallback } from "react";
import { LM, FaceScanState, DetectionResult } from "../configs/type";
import { CONFIG } from "../configs/constant";
import {
  FaceMeshState,
  EMAManager,
  DetectionProcessor,
  StepProcessor,
} from "../utils/faceMesh";

import {
  cropFaceToDataURL,
  shouldCapture,
  cropFacePortraitToDataURL,
} from "../utils/capture";
import {
  MovementGroup,
  Phase,
  MOVEMENT_TO_PHASES,
  randomTwoGroups,
  groupOfPhase,
} from "../utils/movements";
import { captureStore } from "../state/captureStore";

/* ===== Timeout ต่อขั้น ===== */
const STEP_TIMEOUT_MS = 30_000;

/* ===== ลำดับเฟสมาตรฐานของเครื่อง ===== */
const PHASE_ORDER: Phase[] = [
  "yaw_left",
  "yaw_right",
  "pitch_up",
  "pitch_down",
  "blink",
  "mouth",
];

/* ===== ค่าเริ่มต้นของ detection ===== */
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

  const [failed, setFailed] = useState(false);
  const failedRef = useRef(false);
  useEffect(() => {
    failedRef.current = failed;
  }, [failed]);

  const [detectionResult, setDetectionResult] =
    useState<DetectionResult>(INITIAL_DET);

  // จบครบ 2 กลุ่ม -> ให้ container พาไปหน้า face-verification
  const [done, setDone] = useState(false);

  /* ===== session refs ===== */
  const faceMeshRef = useRef<any | null>(null);
  const cameraRef = useRef<any | null>(null);
  const processingRef = useRef(false);
  const sessionIdRef = useRef(0);
  const closingRef = useRef(false);

  /* ===== managers ===== */
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
  useEffect(() => {
    initManagers();
  }, [initManagers]);

  /* ===== การสุ่ม movement 2 กลุ่ม ===== */
  const selectedGroupsRef = useRef<MovementGroup[] | null>(null);
  const allowedPhasesRef = useRef<Phase[]>([]);
  const completedGroupsRef = useRef<Set<MovementGroup>>(new Set());
  const prevPhaseRef = useRef<Phase | null>(null);

  const [selectedGroups, setSelectedGroups] = useState<MovementGroup[] | null>(
    null
  );
  const [completedGroups, setCompletedGroups] = useState<MovementGroup[]>([]);

  /* ===== ตัวจับเวลา/สถานะขั้น ===== */
  const stepStartAtRef = useRef<number | null>(null);
  const prevStepRef = useRef<number>(0);

  /* ===== แคปภาพ ===== */
  const lastCapAtRef = useRef<Partial<Record<MovementGroup, number>>>({});
  const CAP_INTERVAL_MS = 500; // หน่วงเวลาอย่างน้อย 400ms
  const CAP_LIMIT_PER_GROUP = 10;

  const processDetectionResults = useCallback((results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    if (!managers.current.detector || !managers.current.stepProcessor) return;
    if (!faceMeshRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // FPS
    const fps = managers.current.detector.calculateFPS();
    if (fps !== null) setState((prev) => ({ ...prev, fps }));

    // Detection
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

    // Step process
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

    // เปลี่ยนขั้น → เริ่มจับเวลาใหม่ (เฉพาะ 1/2)
    const stepNow = managers.current.state.currentStep;
    if (prevStepRef.current !== stepNow) {
      prevStepRef.current = stepNow;
      if (stepNow === 1 || stepNow === 2) {
        stepStartAtRef.current = performance.now();
      } else {
        stepStartAtRef.current = null;
      }

      // เข้าสtep2 → สุ่มกลุ่ม + ทำ allowedPhases โดย "กรองจากลำดับมาตรฐาน"
      if (stepNow === 2) {
        const groups = randomTwoGroups();
        selectedGroupsRef.current = groups;
        setSelectedGroups(groups);

        const allowed = PHASE_ORDER.filter((ph) =>
          groups.includes(groupOfPhase(ph))
        );
        allowedPhasesRef.current = allowed;

        completedGroupsRef.current.clear();
        setCompletedGroups([]);

        // เริ่มที่เฟสแรกของ allowed
        if (allowed.length) {
          managers.current.state.subPhase = allowed[0];
          prevPhaseRef.current = allowed[0];
        }

        // เคลียร์ตัวจับเวลาแคป
        lastCapAtRef.current = {};
      }
    }

    // Timeout ต่อขั้น (เฉพาะ Step 1/2)
    if ((stepNow === 1 || stepNow === 2) && stepStartAtRef.current != null) {
      const elapsed = performance.now() - stepStartAtRef.current;
      if (elapsed >= STEP_TIMEOUT_MS) {
        setFailed(true);
        return;
      }
    }

    if (stepNow >= 2 && captureStore.get().step1Sample == null) {
      if (detectionData.bbox) {
        const url = cropFacePortraitToDataURL(
          video,
          detectionData.bbox as any,
          { targetSize: 320, quality: 0.92, scale: 1.5, yShiftRatio: -0.06 }
        );
        if (url) captureStore.setStep1Sample(url);
      }
    }

    // --- ระหว่าง Step2 → แคปเฉพาะกลุ่มที่ถูกสุ่ม (พอร์ตเทรต) ---
    if (stepNow === 2 && detectionData.bbox && selectedGroupsRef.current) {
      const phaseNow = managers.current.state.subPhase as Phase;
      const grp = groupOfPhase(phaseNow);
      if (selectedGroupsRef.current.includes(grp)) {
        const lastAt = lastCapAtRef.current[grp] ?? null;
        if (shouldCapture(lastAt, CAP_INTERVAL_MS)) {
          lastCapAtRef.current[grp] = performance.now();
          const has = captureStore.get().movements[grp].length;
          if (has < CAP_LIMIT_PER_GROUP) {
            const url = cropFacePortraitToDataURL(
              video,
              detectionData.bbox as any,
              { targetSize: 320, quality: 0.92, scale: 1.5, yShiftRatio: -0.06 }
            );
            if (url) captureStore.push(grp, url, CAP_LIMIT_PER_GROUP);
          }
        }
      }
    }

    // บังคับให้ step2 อยู่ใน allowed เท่านั้น
    if (stepNow === 2 && allowedPhasesRef.current.length > 0) {
      const phaseNow = managers.current.state.subPhase as Phase;
      if (!allowedPhasesRef.current.includes(phaseNow)) {
        managers.current.state.subPhase = allowedPhasesRef.current[0];
      }
    }

    // ==== ตรวจการ "เปลี่ยนเฟสจริง" เพื่อ mark ว่าจบกลุ่ม ====
    if (stepNow === 2 && allowedPhasesRef.current.length > 0) {
      const cur = managers.current.state.subPhase as Phase;
      const prev = prevPhaseRef.current;

      if (prev && prev !== cur) {
        const prevGroup = groupOfPhase(prev);
        const phasesOfPrev = MOVEMENT_TO_PHASES[prevGroup];
        const isPrevLastOfGroup =
          phasesOfPrev[phasesOfPrev.length - 1] === prev;
        if (isPrevLastOfGroup) {
          completedGroupsRef.current.add(prevGroup);
          setCompletedGroups(Array.from(completedGroupsRef.current));
        }
      }
      prevPhaseRef.current = cur;

      // ครบสองกลุ่มแล้ว → DONE
      if (completedGroupsRef.current.size >= 2) {
        managers.current.state.currentStep = 3;
        setDone(true);
      }
    }

    // เผื่อกรณีเครื่องตั้ง currentStep=3 เอง (เรา sync UI ให้แน่ใจ)
    if (managers.current.state.currentStep === 3 && !done) {
      setDone(true);
    }

    // Update UI state
    setState((prev) => ({
      ...prev,
      step: managers.current.state.currentStep,
      phase:
        stepNow === 2
          ? (managers.current.state.subPhase as Phase)
          : ("-" as const),
    }));
  }, []);

  // ปิด session ปลอดภัย/idempotent
  const stopCurrentSession = useCallback(async () => {
    if (closingRef.current) return;
    closingRef.current = true;

    sessionIdRef.current += 1;

    try {
      try {
        cameraRef.current?.stop?.();
      } catch {}
      cameraRef.current = null;

      const t0 = performance.now();
      while (processingRef.current && performance.now() - t0 < 1000) {
        await new Promise((r) => setTimeout(r, 16));
      }
    } finally {
      try {
        faceMeshRef.current?.close?.();
      } catch {}
      faceMeshRef.current = null;

      processingRef.current = false;
      closingRef.current = false;
    }
  }, []);

  // Setup camera + FaceMesh
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
        if (sessionIdRef.current !== mySessionId) return;
        processDetectionResults(res);
      });

      const cam = new Camera(videoRef.current!, {
        onFrame: async () => {
          if (sessionIdRef.current !== mySessionId) return;
          if (failedRef.current) return;
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

      return () => {
        void stopCurrentSession();
      };
    } catch (error) {
      console.error("Camera setup error:", error);
      throw error;
    }
  }, [processDetectionResults, stopCurrentSession]);

  // Try again → กลับไปเริ่มใหม่จาก Setup เสมอ
  const restartFromSetup = useCallback(async () => {
    await stopCurrentSession();

    initManagers();
    setFailed(false);
    setDone(false);
    setDetectionResult({ ...INITIAL_DET });
    setState({ step: 1, phase: "-", fps: 0, isReady: false });

    selectedGroupsRef.current = null;
    allowedPhasesRef.current = [];
    completedGroupsRef.current = new Set();
    setSelectedGroups(null);
    setCompletedGroups([]);
    prevPhaseRef.current = null;

    stepStartAtRef.current = null;
    prevStepRef.current = 0;

    lastCapAtRef.current = {};
    captureStore.clear();

    try {
      await setupCamera();
    } catch (e) {
      console.error("Restart setup error:", e);
    }
  }, [setupCamera, stopCurrentSession, initManagers]);

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

    done,
    selectedGroups,
    completedGroups,
  };
}
