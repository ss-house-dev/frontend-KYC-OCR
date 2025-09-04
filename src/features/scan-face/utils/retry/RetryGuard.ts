// features/scan-face/utils/retry/RetryGuard.ts
export type RetryKey =
  | "step1-detector"
  | "step1-facemesh"
  | "step2-detector"
  | "step2-facemesh";

export class RetryGuard {
  private limit: number;
  private count = 0;
  private _locked = false;
  readonly key: RetryKey;

  constructor(key: RetryKey, limit = 10) {
    this.key = key;
    this.limit = limit;
  }

  /** ส่ง true ถ้าล็อกแล้ว (ถึงเพดานพลาด) */
  hit(success: boolean): boolean {
    if (this._locked) return true;
    if (success) this.count = 0;
    else {
      this.count++;
      if (this.count >= this.limit) this._locked = true;
    }
    return this._locked;
  }

  reset() {
    this.count = 0;
    this._locked = false;
  }

  get failures() { return this.count; }
  get locked() { return this._locked; }
}

export class FailureCenter {
  private guards: Record<RetryKey, RetryGuard>;

  constructor(limit = 10) {
    this.guards = {
      "step1-detector": new RetryGuard("step1-detector", limit),
      "step1-facemesh": new RetryGuard("step1-facemesh", limit),
      "step2-detector": new RetryGuard("step2-detector", limit),
      "step2-facemesh": new RetryGuard("step2-facemesh", limit),
    };
  }

  /** บันทึกผลของคีย์ใดคีย์หนึ่ง แล้วรายงานว่าล็อกภาพรวมหรือยัง */
  hit(key: RetryKey, success: boolean): boolean {
    this.guards[key].hit(success);
    return this.isLocked();
  }

  isLocked(): boolean {
    return Object.values(this.guards).some(g => g.locked);
  }

  resetAll() {
    Object.values(this.guards).forEach(g => g.reset());
  }

  get snapshot() {
    return Object.fromEntries(Object.entries(this.guards).map(([k, g]) => [k, { failures: g.failures, locked: g.locked }])) as
      Record<RetryKey, { failures: number; locked: boolean }>;
  }
}
