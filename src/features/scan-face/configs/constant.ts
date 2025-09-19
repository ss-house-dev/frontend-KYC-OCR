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

  UI: {
    DRAW_CROSSHAIR: true,
    // ถ้าอยากเลื่อนบวกลง ให้เปลี่ยนค่านี้แทนการฮาร์ดโค้ดในไฟล์วาด
    CROSSHAIR_OFFSET_Y_FRAC: 0.0, // 0 = จุดศูนย์กลางจริง ตรงกับฝั่งคำนวณ
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
    CENTER_TOLERANCE: 0.12, // กระชับขึ้นนิด ให้ยืนกลางจอมากขึ้น
  },

  TIMING: {
    STEP1_HOLD_SECONDS: 2.0,

    // ถือท่าหันซ้าย/ขวา/พยักขึ้น/ลง ให้นิ่งพอประมาณ แต่ยังเร็ว
    STEP2_YAW_HOLD_SECONDS: 0.8,
    STEP2_PITCH_HOLD_SECONDS: 0.6,

    EASY_HOLD_SECONDS: 0.5,

    BLINK_MIN_SECONDS: 0.28, // 0.25–0.30 กำลังดี
    MOUTH_OPEN_MIN_SECONDS: 0.6,
    MOUTH_OPEN_MAX_SECONDS: 2.0,
    MOUTH_CLOSE_MIN_SECONDS: 0.6,
  },

  SMOOTHING: {
    BOX_EMA_ALPHA: 0.3,

    // ทำให้การอ่านมุมนิ่งแต่ยังตามทัน — 0.20–0.30
    YAW_EMA_ALPHA: 0.25,
    PITCH_EMA_ALPHA: 0.25,

    // baseline ศูนย์กลาง ให้นิ่งมาก ๆ
    ZERO_EMA_ALPHA: 0.05,

    BLINK_BASE_EMA_ALPHA: 0.1,
    MOUTH_BASE_EMA_ALPHA: 0.1,

    // ✅ ใช้ใน StepProcessor.isYawMoving()/isPitchMoving()
    YAW_MOMENTUM_MIN: 4.0,
    PITCH_MOMENTUM_MIN: 3.5,
  },

  THRESHOLDS: {
    // เข้าง่ายกว่าเดิมเล็กน้อย แต่มี hysteresis กันสั่น
    YAW_ENTER_DEG: 6.0,
    YAW_EXIT_DEG: 3.0,
    YAW_ZERO_UPDATE_BAND: 15.0,

    PITCH_ENTER_DEG: 4.5,
    PITCH_EXIT_DEG: 2.0,
    PITCH_ZERO_UPDATE_BAND: 8.0,

    BLINK_THRESH_FRACTION: 0.72,
    MOUTH_OPEN_DELTA: 0.12,

    // ✅ ใช้ใน brightnessOK()
    BRIGHTNESS_MIN: 70,
    BRIGHTNESS_MAX: 210,
  },

  CAMERA: {
    MIRRORED_INPUT: true,
    // ✅ แก้เคสหันซ้ายแต่ pass ขวา: -1 กลับทิศ yaw ให้ตรงภาพ selfie
    YAW_SIGN: -1,
  },

  LANDMARKS: {
    MODE: "all", // "nose" | "all"
    SHOW_IN_STEP1: true,
    SHOW_IN_STEP2: true,
    COLOR: "#22c55e",
    RADIUS: 1.5,
  },
} as const;
