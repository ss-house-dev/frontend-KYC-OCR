import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { LM, FaceScanState, DetectionResult } from "../configs/type";
import { CONFIG } from "../configs/constant";
import {
  FaceMeshState,
  EMAManager,
  DetectionProcessor,
  StepProcessor,
} from "../utils/faceMesh";

import { shouldCapture, captureToBlobURL } from "../utils/capture";
import {
  MovementGroup,
  Phase,
  MOVEMENT_TO_PHASES,
  randomTwoGroups,
  groupOfPhase,
} from "../utils/movements";
import { captureStore } from "../state/captureStore";
import {
  HeadMotionTracker,
  type HeadPhase,
} from "../utils/motion/HeadMotionTracker";
import { FaceSubmit } from "../services/api-face";

/* ===== Android detect ===== */
const isAndroid =
  typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

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
  const [state, _setState] = useState<FaceScanState>({
    step: 1,
    phase: "-",
    fps: 0,
    isReady: false,
  });

  /* ===== mount guard & safe setters ===== */
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setStateSafe = useCallback(
    (updater: React.SetStateAction<FaceScanState>) => {
      if (!mountedRef.current) return;
      _setState(updater);
    },
    []
  );

  /* ===== throttle UI updates ===== */
  const lastUIAtRef = useRef(0);
  const UI_INTERVAL_MS = 150;
  function setUIThrottled(patch: Partial<FaceScanState>) {
    const now = performance.now();
    if (now - lastUIAtRef.current > UI_INTERVAL_MS) {
      setStateSafe((prev) => ({ ...prev, ...patch }));
      lastUIAtRef.current = now;
    }
  }

  const [failed, _setFailed] = useState(false);
  const failedRef = useRef(false);
  const setFailed = useCallback((v: boolean) => {
    if (!mountedRef.current) return;
    _setFailed(v);
  }, []);
  useEffect(() => {
    failedRef.current = failed;
  }, [failed]);

  const [detectionResult, __setDetectionResult] =
    useState<DetectionResult>(INITIAL_DET);
  const detectionResultRef = useRef<DetectionResult>(INITIAL_DET);
  const lastDetUIRef = useRef(0);
  function updateDetectionResultUI(det: DetectionResult) {
    const now = performance.now();
    const criticalChange =
      (detectionResultRef.current.bbox == null && det.bbox != null) ||
      (detectionResultRef.current.bbox != null && det.bbox == null);
    if (now - lastDetUIRef.current > 200 || criticalChange) {
      if (!mountedRef.current) return;
      __setDetectionResult(det);
      lastDetUIRef.current = now;
    }
    detectionResultRef.current = det;
  }

  // จบครบ 2 กลุ่ม -> ให้ container พาไปหน้า face-verification
  const [done, __setDone] = useState(false);
  const setDoneSafe = useCallback((v: boolean) => {
    if (!mountedRef.current) return;
    __setDone(v);
  }, []);

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
    const detector = new DetectionProcessor(stateObj, emaObj, setStateSafe);
    const stepProcessor = new StepProcessor(stateObj, emaObj);
    managers.current = {
      state: stateObj,
      ema: emaObj,
      detector,
      stepProcessor,
    };
  }, [setStateSafe]);

  useEffect(() => {
    initManagers();
  }, [initManagers]);

  /* ===== การสุ่ม movement 2 กลุ่ม ===== */
  const selectedGroupsRef = useRef<MovementGroup[] | null>(null);
  const allowedPhasesRef = useRef<Phase[]>([]);
  const completedGroupsRef = useRef<Set<MovementGroup>>(new Set());
  const prevPhaseRef = useRef<Phase | null>(null);

  const [selectedGroups, _setSelectedGroups] = useState<MovementGroup[] | null>(
    null
  );
  const setSelectedGroupsSafe = useCallback((v: MovementGroup[] | null) => {
    if (!mountedRef.current) return;
    _setSelectedGroups(v);
  }, []);

  const [completedGroups, _setCompletedGroups] = useState<MovementGroup[]>([]);
  const setCompletedGroupsSafe = useCallback((v: MovementGroup[]) => {
    if (!mountedRef.current) return;
    _setCompletedGroups(v);
  }, []);

  /* ===== ตัวจับเวลา/สถานะขั้น ===== */
  const stepStartAtRef = useRef<number | null>(null);
  const prevStepRef = useRef<number>(0);

  /* ===== แคปภาพ ===== */
  const lastCapAtRef = useRef<Partial<Record<MovementGroup, number>>>({});
  const CAP_INTERVAL_MS = isAndroid ? 800 : 400;
  const CAP_LIMIT_PER_GROUP = 3;

  /* ===== FPS EMA + auto degrade ===== */
  const fpsEmaRef = useRef<number>(0);
  const lastFpsUIRef = useRef(0);
  function ema(next: number, prev: number, alpha = 0.2) {
    return prev === 0 ? next : alpha * next + (1 - alpha) * prev;
  }

  // ดีเลย์ตอนเปลี่ยนเฟส
  const phaseDelayTimerRef = useRef<number | null>(null);
  const isPhaseDelayActiveRef = useRef(false);

  function clearPhaseDelayTimer() {
    if (phaseDelayTimerRef.current != null) {
      clearTimeout(phaseDelayTimerRef.current);
      phaseDelayTimerRef.current = null;
    }
  }

  function schedulePhaseAdvance(nextPhase: Phase, delayMs = 0) {
    // ถ้ามีดีเลย์ค้างอยู่ ไม่ต้องตั้งซ้ำ
    if (isPhaseDelayActiveRef.current) return;

    if (delayMs <= 0) {
      managers.current.state.subPhase = nextPhase;
      return;
    }
    isPhaseDelayActiveRef.current = true;
    clearPhaseDelayTimer();
    phaseDelayTimerRef.current = window.setTimeout(() => {
      managers.current.state.subPhase = nextPhase;
      isPhaseDelayActiveRef.current = false;
      phaseDelayTimerRef.current = null;
    }, delayMs);
  }

  /** หาพิกัดปลายจมูก (px) โดยอิงการ mirror ให้ตรงกับที่ผู้ใช้เห็น */
  function getNosePxFromDet(
    det: DetectionResult,
    canvasW: number,
    canvasH: number,
    mirrored: boolean
  ): { x: number; y: number } | null {
    const noseIdx = 1; // Mediapipe FaceMesh nose tip
    const lm = det.landmarks as LM[] | null;
    if (!lm || !lm[noseIdx]) return null;
    const nx = lm[noseIdx].x * canvasW;
    const ny = lm[noseIdx].y * canvasH;
    return {
      x: mirrored ? canvasW - nx : nx,
      y: ny,
    };
  }

  // ✅ Tracker (ย้ายมาใช้ใน pipeline หลัก)
  const trackerRef = useRef<HeadMotionTracker | null>(null);
  const passCooldownRef = useRef(0);
  const PASS_COOLDOWN_MS = 800;

  useEffect(() => {
    trackerRef.current = new HeadMotionTracker({
      emaAlphaPos: 0.25,
      emaAlphaVel: 0.2,
      targetEnter: 0.06,
      targetExit: 0.04,
      minHoldMs: 450,
      dirTol: 0.02,
      swapYawLR: false, // ตั้งตามที่ใช้อยู่
    });
    return () => {
      trackerRef.current = null;
    };
  }, []);

  function gotoNextAllowedPhase() {
    const allowed = allowedPhasesRef.current;
    if (!allowed || allowed.length === 0) return;

    const cur = managers.current.state.subPhase as Phase;
    const idx = allowed.indexOf(cur);

    // ถ้ากำลังรอดีเลย์อยู่ ไม่ให้เปลี่ยนเฟสซ้ำ
    if (isPhaseDelayActiveRef.current) return;

    // ถ้าปัจจุบันยังไม่อยู่ใน allowed ให้ไปตัวแรก
    if (idx === -1) {
      managers.current.state.subPhase = allowed[0];
      return;
    }

    // ยังมีตัวถัดไป
    if (idx < allowed.length - 1) {
      const next = allowed[idx + 1];

      // ✅ กำหนดเงื่อนไขดีเลย์: หลังผ่าน yaw_left ให้รอ 2 วิ ก่อนจะไป yaw_right
      if (cur === "yaw_left" && next === "yaw_right") {
        schedulePhaseAdvance(next, 2000); // 2000 ms
      } else {
        schedulePhaseAdvance(next, 0);
      }
    }
    // ถ้าอยู่ตัวท้ายแล้ว ปล่อยให้ logic จบกลุ่มจัดการต่อไป
  }

  const processDetectionResults = useCallback(
    (results: any) => {
      if (!mountedRef.current) return;
      if (!canvasRef.current || !videoRef.current) return;
      if (!managers.current.detector || !managers.current.stepProcessor) return;
      if (!faceMeshRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;

      // FPS
      const fps = managers.current.detector.calculateFPS();
      if (fps !== null) {
        const now = performance.now();
        fpsEmaRef.current = ema(fps, fpsEmaRef.current);
        (window as any).__fpsEma = fpsEmaRef.current;

        if (now - lastFpsUIRef.current > 500) {
          setUIThrottled({ fps: Math.round(fpsEmaRef.current) });
          lastFpsUIRef.current = now;
        }

        if (fpsEmaRef.current < 14) {
          faceMeshRef.current?.setOptions({
            refineLandmarks: false,
            minTrackingConfidence: 0.6,
          });
        } else if (
          fpsEmaRef.current > 20 &&
          managers.current.state.currentStep === 2
        ) {
          faceMeshRef.current?.setOptions({ refineLandmarks: true });
        }
      }

      // === Normalize landmarks -> LM[][] ===
      const faceLms: LM[][] = Array.isArray(results?.multiFaceLandmarks)
        ? (results.multiFaceLandmarks as LM[][])
        : [];

      // === Detection (array) ===
      const dets: DetectionResult[] =
        faceLms.length > 0
          ? managers.current.detector.processLandmarks(faceLms, canvas)
          : [];

      const firstDet: DetectionResult = dets[0] ?? { ...INITIAL_DET };
      if (dets.length === 0) {
        managers.current.ema.boxEma.reset();
      }
      updateDetectionResultUI(firstDet);

      // === Step process ===
      const { currentStep } = managers.current.state;
      if (currentStep === 1) {
        managers.current.stepProcessor.processStep1(
          [firstDet],
          canvas.width,
          canvas.height
        );
      } else if (currentStep === 2) {
        // เดิมยังใช้ StepProcessor เพื่อ logic อื่น ๆ ของ Step2
        managers.current.stepProcessor.processStep2(firstDet);

        // ✅ ใหม่: ใช้ HeadMotionTracker ตัดสิน pass และสั่งเปลี่ยนเฟส
        const subPhase = managers.current.state.subPhase as HeadPhase;
        if (subPhase && firstDet.landmarks) {
          const nose = getNosePxFromDet(
            firstDet,
            canvas.width,
            canvas.height,
            CONFIG.CAMERA.MIRRORED_INPUT
          );
          if (nose) {
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const dx = nose.x - cx;
            const dy = nose.y - cy;

            const tracker = trackerRef.current;
            if (tracker) {
              const out = tracker.update({
                dx,
                dy,
                canvasW: canvas.width,
                canvasH: canvas.height,
                phase: subPhase,
                now: performance.now(),
              });

              const now = performance.now();
              if (
                out.pass &&
                now - passCooldownRef.current > PASS_COOLDOWN_MS
              ) {
                passCooldownRef.current = now;
                gotoNextAllowedPhase();
              }
            }
          }
        }
      }

      // ==== เปลี่ยนขั้น / สุ่ม movement / เริ่มจับเวลา ====
      const stepNow = managers.current.state.currentStep;
      if (prevStepRef.current !== stepNow) {
        prevStepRef.current = stepNow;
        if (stepNow === 1 || stepNow === 2) {
          stepStartAtRef.current = performance.now();
        } else {
          stepStartAtRef.current = null;
        }

        if (stepNow === 2) {
          faceMeshRef.current?.setOptions({ refineLandmarks: true });

          const groups = randomTwoGroups();
          selectedGroupsRef.current = groups;
          setSelectedGroupsSafe(groups);

          const allowed = PHASE_ORDER.filter((ph) =>
            groups.includes(groupOfPhase(ph))
          );
          allowedPhasesRef.current = allowed;

          completedGroupsRef.current.clear();
          setCompletedGroupsSafe([]);

          if (allowed.length) {
            managers.current.state.subPhase = allowed[0];
            prevPhaseRef.current = allowed[0];
          }
          lastCapAtRef.current = {};
        } else {
          faceMeshRef.current?.setOptions({ refineLandmarks: false });
        }
      }

      // Timeout ต่อขั้น
      if ((stepNow === 1 || stepNow === 2) && stepStartAtRef.current != null) {
        const elapsed = performance.now() - stepStartAtRef.current;
        if (elapsed >= STEP_TIMEOUT_MS) {
          setFailed(true);
          return;
        }
      }

      // ===== Capture (ทั้งจอ) =====
      if (stepNow >= 2 && captureStore.get().step1Sample == null) {
        captureToBlobURL(video, { quality: 0.75 }).then((url) => {
          if (url) captureStore.setStep1Sample(url);
        });
      }

      // Step2 → แคปเฉพาะกลุ่มที่ถูกสุ่ม
      if (stepNow === 2 && firstDet.bbox && selectedGroupsRef.current) {
        const phaseNow = managers.current.state.subPhase as Phase;
        const grp = groupOfPhase(phaseNow);
        if (selectedGroupsRef.current.includes(grp)) {
          const lastAt = lastCapAtRef.current[grp] ?? null;
          if (shouldCapture(lastAt, CAP_INTERVAL_MS)) {
            lastCapAtRef.current[grp] = performance.now();
            const has = captureStore.get().movements[grp].length;
            if (has < CAP_LIMIT_PER_GROUP) {
              captureToBlobURL(video, { quality: 0.75 }).then((url) => {
                if (url) captureStore.push(grp, url, CAP_LIMIT_PER_GROUP);
              });
            }
          }
        }
      }

      // จำกัดเฟสให้อยู่ใน allowed
      if (stepNow === 2 && allowedPhasesRef.current.length > 0) {
        const phaseNow = managers.current.state.subPhase as Phase;
        if (!allowedPhasesRef.current.includes(phaseNow)) {
          managers.current.state.subPhase = allowedPhasesRef.current[0];
        }
      }

      // mark จบกลุ่มเมื่อเปลี่ยนเฟสจริง
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
            setCompletedGroupsSafe(Array.from(completedGroupsRef.current));
          }
        }
        prevPhaseRef.current = cur;

        if (completedGroupsRef.current.size >= 2) {
          managers.current.state.currentStep = 3;
          setDoneSafe(true);
        }
      }

      if (managers.current.state.currentStep === 3 && !done) {
        setDoneSafe(true);
      }

      // อัปเดต UI step/phase แบบ throttle
      setUIThrottled({
        step: managers.current.state.currentStep,
        phase:
          stepNow === 2
            ? (managers.current.state.subPhase as Phase)
            : ("-" as const),
      });
    },
    [
      setStateSafe,
      setFailed,
      setSelectedGroupsSafe,
      setCompletedGroupsSafe,
      setDoneSafe,
      done,
      canvasRef,
      videoRef,
    ]
  );

const { data: session, status } = useSession();
const kycRequestId = session?.kycRequestId;

useEffect(() => {
  async function sendIfReady() {
    const state = captureStore.get();
    const allMovements = Object.values(state.movements).flat(); 
    
    if (!kycRequestId || allMovements.length < 5 || !state.step1Sample) {
      console.log("⏸️ Waiting for all files...");
      return;
    }

    // แปลง URL → File
    async function urlToFile(url: string, filename: string): Promise<File> {
      const res = await fetch(url);
      const blob = await res.blob();
      return new File([blob], filename, { type: blob.type });
    }

    const files = await Promise.all(
      allMovements.map((url, i) => urlToFile(url, `movement_${i}.jpg`))
    );
    const file = await urlToFile(state.step1Sample, "step1Sample.jpg");

    console.log("✅ Ready to submit", files.length, "files + 1 sample file");

    try {
      const res = await FaceSubmit({
        files,
        file,
        kycRequestId,
        onProgress: (pct) => console.log("Upload progress:", pct, "%"),
      });
      console.log("✅ Face files submitted:", res);
    } catch (err) {
      console.error("❌ Upload error:", err);
    }
  }

  sendIfReady();
}, [done, kycRequestId]);


useEffect(() => {
  console.log("=== SESSION DEBUG ===");
  console.log("Session status:", status);
  console.log("Session data:", session);
  console.log("kycRequestId:", kycRequestId);
  console.log("==================");
}, [session, kycRequestId, status]);


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
      clearPhaseDelayTimer();
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
        refineLandmarks: false,
        selfieMode: CONFIG.CAMERA.MIRRORED_INPUT,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((res: any) => {
        if (sessionIdRef.current !== mySessionId) return;
        if (!mountedRef.current) return;
        processDetectionResults(res);
      });

      const targetW = isAndroid ? 640 : 1280;
      const targetH = Math.round((targetW * 9) / 16);

      const cam = new Camera(videoRef.current!, {
        onFrame: async () => {
          if (sessionIdRef.current !== mySessionId) return;
          if (!mountedRef.current) return;
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
        width: targetW,
        height: targetH,
      });
      cameraRef.current = cam;

      await cam.start();
      setStateSafe((prev) => ({ ...prev, isReady: true }));

      return () => {
        void stopCurrentSession();
      };
    } catch (error) {
      console.error("Camera setup error:", error);
      throw error;
    }
  }, [
    processDetectionResults,
    setStateSafe,
    stopCurrentSession,
    videoRef,
    canvasRef,
  ]);

  // visibilitychange: หยุด/เริ่มกล้องจริง ๆ ลดงานพื้นหลัง
  useEffect(() => {
    function onVis() {
      try {
        if (document.hidden) {
          cameraRef.current?.stop?.();
        } else {
          cameraRef.current?.start?.();
        }
      } catch {}
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Try again → กลับไปเริ่มใหม่จาก Setup เสมอ
  const restartFromSetup = useCallback(async () => {
    await stopCurrentSession();

    initManagers();
    setFailed(false);
    setDoneSafe(false);
    updateDetectionResultUI({ ...INITIAL_DET });
    setStateSafe(() => ({ step: 1, phase: "-", fps: 0, isReady: false }));

    selectedGroupsRef.current = null;
    allowedPhasesRef.current = [];
    completedGroupsRef.current = new Set();
    setSelectedGroupsSafe(null);
    setCompletedGroupsSafe([]);
    prevPhaseRef.current = null;

    stepStartAtRef.current = null;
    prevStepRef.current = 0;

    lastCapAtRef.current = {};
    captureStore.clear();
    clearPhaseDelayTimer();

    try {
      await setupCamera();
    } catch (e) {
      console.error("Restart setup error:", e);
    }
  }, [
    stopCurrentSession,
    initManagers,
    setFailed,
    setDoneSafe,
    setStateSafe,
    setSelectedGroupsSafe,
    setCompletedGroupsSafe,
    setupCamera,
  ]);

  const resetStep2 = useCallback(() => {
    managers.current.state.reset();
    managers.current.ema.reset();
    trackerRef.current?.reset();
    passCooldownRef.current = 0;
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
