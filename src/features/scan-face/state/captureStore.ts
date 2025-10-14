export type MovementGroup = "yaw" | "pitch" | "blink" | "mouth";

type CaptureState = {
  step1Sample: string | null;               // dataURL
  movements: Record<MovementGroup, string[]>; // 10 รูป/กลุ่ม
};

const _state: CaptureState = {
  step1Sample: null,
  movements: { yaw: [], pitch: [], blink: [], mouth: [] },
};

export const captureStore = {
  clear() {
    _state.step1Sample = null;
    _state.movements = { yaw: [], pitch: [], blink: [], mouth: [] };
  },
  setStep1Sample(dataUrl: string) {
    _state.step1Sample = dataUrl;
  },
  push(group: MovementGroup, dataUrl: string, limit = 2) {
    const arr = _state.movements[group];
    if (arr.length < limit) arr.push(dataUrl);
  },
  get() {
    return _state;
  },
  totalCount() {
    const movementCount = Object.values(_state.movements).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    return (_state.step1Sample ? 1 : 0) + movementCount;
  },
  isComplete(required = 5) {
    return this.totalCount() >= required;
  },
};

