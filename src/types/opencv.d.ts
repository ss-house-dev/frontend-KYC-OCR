// src/types/opencv.d.ts
export {}; // ทำให้ไฟล์เป็น module แต่ยังประกาศ global ได้

declare global {
  // ---- โครงสร้างของ Mat ----
  interface CVMat {
    rows: number;
    cols: number;
    // บัฟเฟอร์ที่ OpenCV.js ใส่มาจริง ๆ (แล้วแต่ชนิด)
    data?: Uint8Array;
    data8U?: Uint8Array;
    data32F?: Float32Array;
    data64F?: Float64Array;
    delete(): void;
  }
  interface CVMatConstructor {
    // OpenCV.js อนุญาต new cv.Mat() ได้โดยไม่ส่งอาร์กิวเมนต์
    new (rows?: number, cols?: number, type?: number): CVMat;
  }

  // ---- โครงสร้างของ MatVector ----
  interface CVMatVector {
    size(): number;
    get(index: number): CVMat;
    delete(): void;
  }
  interface CVMatVectorConstructor {
    new (): CVMatVector;
  }

  // ---- อินเทอร์เฟซ OpenCV หลัก (สิ่งที่อยู่บนตัวแปร global `cv`) ----
  interface OpenCV {
    // คอนสตรักเตอร์
    Mat: CVMatConstructor;
    MatVector: CVMatVectorConstructor;

    // ฟังก์ชันที่ใช้งาน
    imread(image: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement): CVMat;
    cvtColor(src: CVMat, dst: CVMat, code: number): void;
    mean(src: CVMat): number[]; // scalar เป็น array ยาว 4
    meanStdDev(src: CVMat, mean: CVMat, stddev: CVMat): void;
    Laplacian(src: CVMat, dst: CVMat, ddepth: number): void;
    Canny(src: CVMat, edges: CVMat, threshold1: number, threshold2: number): void;
    findContours(
      image: CVMat,
      contours: CVMatVector,
      hierarchy: CVMat,
      mode: number,
      method: number
    ): void;
    arcLength(curve: CVMat, closed: boolean): number;
    approxPolyDP(curve: CVMat, approxCurve: CVMat, epsilon: number, closed: boolean): void;
    boundingRect(points: CVMat): { x: number; y: number; width: number; height: number };

    // ค่าคงที่ที่อ้างถึงในโค้ด
    COLOR_RGBA2GRAY: number;
    CV_8UC1: number;
    CV_64F: number;
    INTER_AREA: number;
    TM_CCOEFF_NORMED: number;
    RETR_EXTERNAL: number;
    CHAIN_APPROX_SIMPLE: number;
  }

  /** ตัวแปร global ที่โหลดมาจาก opencv.js */
  const cv: OpenCV;
}