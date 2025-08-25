import { useEffect, useRef, useState, useCallback } from 'react';
import { LM, FaceScanState, DetectionResult } from '../configs/type';
import { CONFIG } from '../configs/constant';
import { 
  FaceMeshState, 
  EMAManager, 
  DetectionProcessor, 
  StepProcessor 
} from '../utils/faceMesh';

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

  const [detectionResult, setDetectionResult] = useState<DetectionResult>({
    landmarks: null,
    bbox: null,
    brightness: 128,
    yawDeg: null,
    pitchDeg: null,
    earValue: null,
    marValue: null,
  });

  // Initialize managers
  const managers = useRef({
    state: new FaceMeshState(),
    ema: new EMAManager(),
    detector: null as DetectionProcessor | null,
    stepProcessor: null as StepProcessor | null,
  });

  // Initialize processors
  useEffect(() => {
    managers.current.detector = new DetectionProcessor(managers.current.state, managers.current.ema, setState);
    managers.current.stepProcessor = new StepProcessor(managers.current.state, managers.current.ema);
  }, []);

  const processDetectionResults = useCallback((results: any) => {
    if (!canvasRef.current || !managers.current.detector || !managers.current.stepProcessor) return;

    const canvas = canvasRef.current;
    
    // Update FPS
    const fps = managers.current.detector.calculateFPS();
    if (fps !== null) setState(prev => ({ ...prev, fps }));

    // Process landmarks
    const landmarks: LM[] | null = results.multiFaceLandmarks?.[0] || null;
    let detectionData: DetectionResult;

    if (landmarks) {
      detectionData = managers.current.detector.processLandmarks(landmarks, canvas);
    } else {
      managers.current.ema.boxEma.reset();
      detectionData = {
        landmarks: null,
        bbox: null,
        brightness: 128,
        yawDeg: null,
        pitchDeg: null,
        earValue: null,
        marValue: null,
      };
    }

    setDetectionResult(detectionData);

    // Process steps
    const { currentStep } = managers.current.state;
    if (currentStep === 1) {
      managers.current.stepProcessor.processStep1(detectionData, canvas.width, canvas.height);
    } else if (currentStep === 2) {
      managers.current.stepProcessor.processStep2(detectionData);
    }

    // Update UI state
    setState(prev => ({
      ...prev,
      step: managers.current.state.currentStep,
      phase: currentStep === 2 ? managers.current.state.subPhase : "-",
    }));
  }, []);

  const setupCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const [{ FaceMesh }, { Camera }] = await Promise.all([
        import('@mediapipe/face_mesh'),
        import('@mediapipe/camera_utils'),
      ]);

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        selfieMode: CONFIG.CAMERA.MIRRORED_INPUT,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(processDetectionResults);

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await faceMesh.send({ image: videoRef.current });
          }
        },
        width: CONFIG.DISPLAY.WIDTH,
        height: CONFIG.DISPLAY.HEIGHT,
      });

      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: CONFIG.DISPLAY.WIDTH,
          height: CONFIG.DISPLAY.HEIGHT,
        },
        audio: false,
      });

      await camera.start();
      setState(prev => ({ ...prev, isReady: true }));

      return () => {
        try {
          camera?.stop?.();
          faceMesh?.close?.();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      };
    } catch (error) {
      console.error('Camera setup error:', error);
      throw error;
    }
  }, [processDetectionResults]);

  const resetStep2 = useCallback(() => {
    managers.current.state.reset();
    managers.current.ema.reset();
  }, []);

  return {
    state,
    detectionResult,
    setupCamera,
    resetStep2,
  };
}