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
import {
  MovementGroup,
  Phase,
  MOVEMENT_TO_PHASES,
  randomTwoGroups,
  groupOfPhase,
} from "../utils/movements";
import { shouldCapture, captureToBlobURL } from "../utils/capture";
import { captureStore } from "../state/captureStore";
import {
  HeadMotionTracker,
  type HeadPhase,
} from "../utils/motion/HeadMotionTracker";
import { FaceSubmit } from "../services/api-face";

/* ==========================
 *        Platform flags
 * ========================== */
const isAndroid =
  typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

/* ==========================
 *     Step / Phase config
 * ========================== */
const STEP_TIMEOUT_MS = 30_000;

const PHASE_ORDER: Phase[] = [
  "yaw_left",
  "yaw_right",
  // "pitch_up",
  // "pitch_down",
  "blink",
  "mouth",
];

/* ==========================
 *   Detection default value
 * ========================== */
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
  /* --------------------------------------
   *          UI / global state
   * -------------------------------------- */
  const [state, _setState] = useState<FaceScanState>({
    step: 1,
    phase: "-",
    fps: 0,
    isReady: false,
  });

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

  const lastUIAtRef = useRef(0);
  const UI_INTERVAL_MS = 300;
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

  // ผลตรวจหลายใบหน้า (สำหรับ overlay/validator)
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>(
    []
  );
  const lastDetListUIRef = useRef(0);
  function setDetectionsThrottled(list: DetectionResult[]) {
    const now = performance.now();
    if (now - lastDetListUIRef.current > 150) {
      if (!mountedRef.current) return;
      setDetectionResults(list);
      lastDetListUIRef.current = now;
    }
  }

  const [done, __setDone] = useState(false);
  const setDoneSafe = useCallback((v: boolean) => {
    if (!mountedRef.current) return;
    __setDone(v);
  }, []);

  /* --------------------------------------
   *      Session / pipelines handles
   * -------------------------------------- */
  const faceMeshRef = useRef<any | null>(null);
  const cameraRef = useRef<any | null>(null);
  const processingRef = useRef(false);
  const sessionIdRef = useRef(0);
  const closingRef = useRef(false);

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

  /* --------------------------------------
   *      Movement / Phase selections
   * -------------------------------------- */
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

  /* --------------------------------------
   *           Step timers/guards
   * -------------------------------------- */
  const stepStartAtRef = useRef<number | null>(null);
  const prevStepRef = useRef<number>(0);

  /* --------------------------------------
   *          Capture throttling
   * -------------------------------------- */
  const lastCapAtRef = useRef<Partial<Record<MovementGroup, number>>>({});
  const CAP_INTERVAL_MS = isAndroid ? 800 : 400;
  const CAP_LIMIT_PER_GROUP = 2;

  /* --------------------------------------
   *          FPS / Performance knobs
   * -------------------------------------- */
  const fpsEmaRef = useRef<number>(0);
  const lastFpsUIRef = useRef(0);
  const frameGateMsRef = useRef<number>(isAndroid ? 45 : 28);
  const lastProcessAtRef = useRef<number>(0);

  function ema(next: number, prev: number, alpha = 0.2) {
    return prev === 0 ? next : alpha * next + (1 - alpha) * prev;
  }

  const phaseDelayTimerRef = useRef<number | null>(null);
  const isPhaseDelayActiveRef = useRef(false);
  function clearPhaseDelayTimer() {
    if (phaseDelayTimerRef.current != null) {
      clearTimeout(phaseDelayTimerRef.current);
      phaseDelayTimerRef.current = null;
    }
  }
  function schedulePhaseAdvance(nextPhase: Phase, delayMs = 0) {
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

  /** หาพิกัดปลายจมูก (mirror ให้ตรงกับภาพที่ user เห็น) */
  function getNosePxFromDet(
    det: DetectionResult,
    canvasW: number,
    canvasH: number,
    mirrored: boolean
  ): { x: number; y: number } | null {
    const noseIdx = 1;
    const lm = det.landmarks as LM[] | null;
    if (!lm || !lm[noseIdx]) return null;
    const nx = lm[noseIdx].x * canvasW;
    const ny = lm[noseIdx].y * canvasH;
    return { x: mirrored ? canvasW - nx : nx, y: ny };
  }

  // Tracker ทิศทางศีรษะ (ใช้เฉพาะ step2)
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
      swapYawLR: false,
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

    if (isPhaseDelayActiveRef.current) return;

    if (idx === -1) {
      managers.current.state.subPhase = allowed[0];
      return;
    }

    if (idx < allowed.length - 1) {
      const next = allowed[idx + 1];
      if (cur === "yaw_left" && next === "yaw_right") {
        schedulePhaseAdvance(next, 2000);
      } else {
        schedulePhaseAdvance(next, 0);
      }
    }
  }

  /* --------------------------------------
   *        Core per-frame processing
   * -------------------------------------- */
  const processDetectionResults = useCallback(
    (results: any) => {
      if (!mountedRef.current) return;
      if (!canvasRef.current || !videoRef.current) return;
      if (!managers.current.detector || !managers.current.stepProcessor) return;
      if (!faceMeshRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;

      // === Calculate & show FPS (EMA) ===
      const fps = managers.current.detector.calculateFPS();
      if (fps !== null) {
        const now = performance.now();
        fpsEmaRef.current = ema(fps, fpsEmaRef.current);

        if (now - lastFpsUIRef.current > 500) {
          setUIThrottled({ fps: Math.round(fpsEmaRef.current) });
          lastFpsUIRef.current = now;
        }

        // Adaptive knobs
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

        if (fpsEmaRef.current < 12) {
          frameGateMsRef.current = 85;
        } else if (fpsEmaRef.current < 18) {
          frameGateMsRef.current = 70;
        } else if (fpsEmaRef.current < 24) {
          frameGateMsRef.current = 55;
        } else {
          frameGateMsRef.current = 45;
        }
      }

      // === Landmarks normalize ===
      const faceLms: LM[][] = Array.isArray(results?.multiFaceLandmarks)
        ? (results.multiFaceLandmarks as LM[][])
        : [];

      const dets: DetectionResult[] =
        faceLms.length > 0
          ? managers.current.detector.processLandmarks(faceLms, canvas)
          : [];

      const firstDet: DetectionResult = dets[0] ?? { ...INITIAL_DET };
      if (dets.length === 0) {
        managers.current.ema.boxEma.reset();
      }

      // Overlay/Step1 ใช้ผลทั้งชุด
      setDetectionsThrottled(dets);

      // === Step processing ===
      const { currentStep } = managers.current.state;
      if (currentStep === 1) {
        managers.current.stepProcessor.processStep1(
          dets,
          canvas.width,
          canvas.height
        );
      } else if (currentStep === 2) {
        managers.current.stepProcessor.processStep2(firstDet);

        // ใช้ HeadMotionTracker เพื่อตัดสิน pass/advance phase
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

      // === เปลี่ยน step → เตรียมค่าต่าง ๆ ===
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

      // === Step timeout ===
      if ((stepNow === 1 || stepNow === 2) && stepStartAtRef.current != null) {
        const elapsed = performance.now() - stepStartAtRef.current;
        if (elapsed >= STEP_TIMEOUT_MS) {
          setFailed(true);
          return;
        }
      }

      // === Capture sample (ครั้งแรกของ step2) ===
      if (stepNow >= 2 && captureStore.get().step1Sample == null) {
        captureToBlobURL(video, { quality: 0.75 }).then((url) => {
          if (url) captureStore.setStep1Sample(url);
        });
      }

      // === Capture ต่อกลุ่ม (เฉพาะ step2) ===
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

      // === Guard: จำกัด phase เฉพาะ allowed ===
      if (stepNow === 2 && allowedPhasesRef.current.length > 0) {
        const phaseNow = managers.current.state.subPhase as Phase;
        if (!allowedPhasesRef.current.includes(phaseNow)) {
          managers.current.state.subPhase = allowedPhasesRef.current[0];
        }
      }

      // === เมื่อ “เปลี่ยนเฟสจริง” เช็คว่าจบกลุ่มหรือยัง ===
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

  /* --------------------------------------
   *            Auto-submit on done
   * -------------------------------------- */
  const { data: session } = useSession();
  const kycRequestId = session?.kycRequestId;

  useEffect(() => {
    async function sendIfReady() {
      const st = captureStore.get();
      const allMovements = Object.values(st.movements).flat();

      if (!kycRequestId || allMovements.length < 3 || !st.step1Sample) {
        return;
      }

      async function urlToFile(url: string, filename: string): Promise<File> {
        const res = await fetch(url);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
      }

      const files = await Promise.all(
        allMovements.map((url, i) => urlToFile(url, `movement_${i}.jpg`))
      );
      const file = await urlToFile(st.step1Sample, "step1Sample.jpg");

      try {
        await FaceSubmit({
          files,
          file,
          kycRequestId,
          onProgress: () => {},
        });
      } catch (err) {
        console.error("❌ Upload error:", err);
      }
    }
    sendIfReady();
  }, [done, kycRequestId]);

  /* --------------------------------------
   *        Stop / restart session
   * -------------------------------------- */
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

  /* --------------------------------------
   *      Camera + FaceMesh bootstrap
   * -------------------------------------- */
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
        maxNumFaces: 2,
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

      const targetW = 640; // เดิม Android 480 / Desktop 1280
      const targetH = 360;

      const cam = new Camera(videoRef.current!, {
        onFrame: async () => {
          const now = performance.now();
          if (now - lastProcessAtRef.current < frameGateMsRef.current) return;

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
            lastProcessAtRef.current = performance.now();
            processingRef.current = false;
          }
        },
        width: targetW,
        height: targetH,
      });
      cameraRef.current = cam;

      await cam.start();

      // apply constraints (best-effort)
      try {
        const stream = (videoRef.current as HTMLVideoElement)
          .srcObject as MediaStream;
        const track = stream?.getVideoTracks?.()[0];
        await track?.applyConstraints?.({
          width: { exact: targetW },
          height: { exact: targetH },
          frameRate: { ideal: 24, max: 30 },
          facingMode: "user",
        });
      } catch {}

      setStateSafe((prev) => ({ ...prev, isReady: true }));

      // Android: auto-upscale ถ้า FPS ดี
      if (isAndroid) {
        setTimeout(async () => {
          if (!mountedRef.current || sessionIdRef.current !== mySessionId)
            return;
          const fpsNow = fpsEmaRef.current;
          if (fpsNow > 26) {
            try {
              const stream = (videoRef.current as HTMLVideoElement)
                .srcObject as MediaStream;
              const track = stream?.getVideoTracks?.()[0];
              await track?.applyConstraints?.({
                width: { exact: 800 }, // อัปทีละสเต็ปเล็ก ๆ
                height: { exact: 450 },
                frameRate: { ideal: 24, max: 30 },
              });
            } catch {}
          }
        }, 3000);
      }

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

  /* --------------------------------------
   *      Visibility → หยุด/เริ่มกล้องจริง
   * -------------------------------------- */
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

  /* --------------------------------------
   *         Public restart/reset APIs
   * -------------------------------------- */
  const restartFromSetup = useCallback(async () => {
    await stopCurrentSession();

    initManagers();
    setFailed(false);
    setDoneSafe(false);
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

    fpsEmaRef.current = 0;
    frameGateMsRef.current = 60
    lastProcessAtRef.current = 0;

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

  /* --------------------------------------
   *            Returned API
   * -------------------------------------- */
  return {
    state,
    detectionResults,
    setupCamera,
    resetStep2,

    failed,
    restartFromSetup,

    done,
    selectedGroups,
    completedGroups,
  };
}
