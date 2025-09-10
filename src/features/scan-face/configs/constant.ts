const SHARPEN_KERNEL: number[][] = [
  [0, -1, 0],
  [-1, 5, -1],
  [0, -1, 0],
];

export const CONFIG = {
  DISPLAY: {
    WIDTH: 1280,
    HEIGHT: 720,
  },
  SHARPEN: {
    ENABLED: true,
    KERNEL: SHARPEN_KERNEL,
  },
  FACE_SIZE: {
    FAR_THRESHOLD: 180,
    NEAR_THRESHOLD: 320,
  },
  BRIGHTNESS: {
    DARK_THRESHOLD: 60,
    BRIGHT_THRESHOLD: 190,
  },
  POSITION: {
    CENTER_TOLERANCE: 0.15,
  },
  TIMING: {
    STEP1_HOLD_SECONDS: 2.0,
    // ลด hold time เพื่อให้รวดเร็วกว่า
    STEP2_YAW_HOLD_SECONDS: 0.8, // ลดจาก 1.2
    STEP2_PITCH_HOLD_SECONDS: 0.6, // ลดจาก 1.0

    // เพิ่ม progressive timing
    EASY_HOLD_SECONDS: 0.5, // สำหรับผู้ใช้ใหม่

    BLINK_MIN_SECONDS: 0.3,
    MOUTH_OPEN_MIN_SECONDS: 0.6,
    MOUTH_OPEN_MAX_SECONDS: 2.0,
    MOUTH_CLOSE_MIN_SECONDS: 0.6,
  },
  SMOOTHING: {
    BOX_EMA_ALPHA: 0.3,
    // ลด EMA alpha เพื่อให้ responsive กว่า
    YAW_EMA_ALPHA: 0.25, // เพิ่มจาก 0.15
    PITCH_EMA_ALPHA: 0.25, // เพิ่มจาก 0.15

    // เพิ่มค่าใหม่สำหรับ zero position
    ZERO_EMA_ALPHA: 0.05, // ใช้สำหรับ baseline ให้ stable กว่า

    BLINK_BASE_EMA_ALPHA: 0.1,
    MOUTH_BASE_EMA_ALPHA: 0.1,
  },
  THRESHOLDS: {
    // ลดค่า threshold ให้อ่อนโยนกว่าเดิม
    YAW_ENTER_DEG: 6.0, // ลดจาก 8.0
    YAW_EXIT_DEG: 3.0, // ลดจาก 5.0
    YAW_ZERO_UPDATE_BAND: 15.0, // เพิ่มจาก 8.0 เพื่อให้ stable กว่า
    PITCH_ENTER_DEG: 4.5, // ลดจาก 6.0
    PITCH_EXIT_DEG: 2.0, // ลดจาก 3.0
    PITCH_ZERO_UPDATE_BAND: 8.0, // เพิ่มจาก 4.0

    BLINK_THRESH_FRACTION: 0.72,
    MOUTH_OPEN_DELTA: 0.12,
  },
  CAMERA: {
    MIRRORED_INPUT: true,
  },
  LANDMARKS: {
    SHOW_IN_STEP2: true,
  },
} as const;
