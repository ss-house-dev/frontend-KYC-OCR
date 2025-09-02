export class EMA {
  private alpha: number;
  private v: number | null = null;
  private lastChange: number = 0;

  constructor(alpha: number) {
    this.alpha = alpha;
  }

  reset() {
    this.v = null;
    this.lastChange = 0;
  }

  // update(x: number) {
  //   this.v = this.v == null ? x : this.alpha * x + (1 - this.alpha) * this.v;
  //   return this.v;
  // }

  update(x: number) {
    if (this.v == null) {
      this.v = x;
    } else {
      // คำนวณการเปลี่ยนแปลง
      const change = Math.abs(x - this.v);

      // ถ้ามีการเปลี่ยนแปลงมาก (movement) ใช้ alpha สูงกว่า
      const adaptiveAlpha =
        change > 3.0
          ? Math.min(this.alpha * 1.8, 0.8) // เพิ่ม responsiveness
          : this.alpha;

      this.v = adaptiveAlpha * x + (1 - adaptiveAlpha) * this.v;
      this.lastChange = change;
    }
    return this.v;
  }

  get value() {
    return this.v;
  }
}

// เพิ่ม EMA แยกสำหรับ zero position ที่ stable กว่า
export class StableEMA {
  private alpha: number;
  private v: number | null = null;
  private updateCount: number = 0;

  constructor(alpha: number = 0.05) {
    this.alpha = alpha;
  }

  reset() {
    this.v = null;
    this.updateCount = 0;
  }

  update(x: number) {
    this.updateCount++;
    
    if (this.v == null) {
      this.v = x;
    } else {
      // ใน 30 frame แรก ใช้ alpha สูงกว่าเพื่อ converge เร็ว
      const currentAlpha = this.updateCount < 30 ? 
        this.alpha * 4 : 
        this.alpha;
        
      this.v = currentAlpha * x + (1 - currentAlpha) * this.v;
    }
    return this.v;
  }

  get value() {
    return this.v;
  }
}

export class EMAVec {
  private alpha: number;
  private v: [number, number, number, number] | null = null;

  constructor(alpha: number) {
    this.alpha = alpha;
  }

  reset() {
    this.v = null;
  }

  update(
    vec: [number, number, number, number]
  ): [number, number, number, number] {
    if (!this.v) {
      this.v = [vec[0], vec[1], vec[2], vec[3]];
    } else {
      this.v = [
        this.alpha * vec[0] + (1 - this.alpha) * this.v[0],
        this.alpha * vec[1] + (1 - this.alpha) * this.v[1],
        this.alpha * vec[2] + (1 - this.alpha) * this.v[2],
        this.alpha * vec[3] + (1 - this.alpha) * this.v[3],
      ];
    }
    return [this.v[0], this.v[1], this.v[2], this.v[3]];
  }
  get value() {
    return this.v;
  }
}
