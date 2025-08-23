export class EMA {
  private alpha: number;
  private v: number | null = null;

  constructor(alpha: number) {
    this.alpha = alpha;
  }

  reset() {
    this.v = null;
  }

  update(x: number) {
    this.v = this.v == null ? x : this.alpha * x + (1 - this.alpha) * this.v;
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
