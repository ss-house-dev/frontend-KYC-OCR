// src/types/opencv.d.ts
export {}; // ทำให้ไฟล์เป็น module แต่ยังประกาศ global ได้

// src/types/opencv.d.ts
// Ambient types แบบมินิมอลพอให้ TS เงียบและ autocomplete นิดหน่อย

declare namespace cv {
  const CV_8UC1: number;
  const CV_8UC3: number;
  const CV_8UC4: number;
  const COLOR_BGR2RGBA: number;
  const COLOR_GRAY2RGBA: number;

  class Mat {
    constructor(rows?: number, cols?: number, type?: number);
    cols: number;
    rows: number;
    data: Uint8Array;
    type(): number;
    channels(): number;
    copyTo(dst: Mat): void;
    delete(): void;
    ucharPtr(row: number, col: number): Uint8Array;
  }

  // ฟังก์ชันที่คุณใช้บ่อย
  function LUT(src: Mat, lut: Mat, dst: Mat): void;
  function cvtColor(src: Mat, dst: Mat, code: number, dstCn?: number): void;
  function matFromImageData(imgData: ImageData): Mat;
  function getPerspectiveTransform(src: Mat, dst: Mat): Mat;
  function warpPerspective(
    src: Mat, dst: Mat, M: Mat, dsize: { width: number; height: number },
    flags?: number, borderMode?: number, borderValue?: any
  ): void;

  // ของประกอบอื่น ๆ ที่โค้ดคุณใช้อยู่
  class MatVector { delete(): void; size(): number; get(i: number): Mat; }
  class RectVector { delete(): void; size(): number; get(i: number): any; }
  class CascadeClassifier {
    load(path: string): boolean;
    detectMultiScale(
      image: Mat, objects: RectVector, scaleFactor: number, minNeighbors: number,
      flags: number, minSize: any, maxSize: any
    ): void;
  }
  function mean(src: Mat): number[];
  function Laplacian(src: Mat, dst: Mat, ddepth: number, ksize?: number, scale?: number, delta?: number, borderType?: number): void;
  function meanStdDev(src: Mat, mean: Mat, stddev: Mat): void;
  function Canny(src: Mat, edges: Mat, threshold1: number, threshold2: number): void;
  function GaussianBlur(src: Mat, dst: Mat, ksize: { width: number; height: number }, sigmaX: number, sigmaY?: number, borderType?: number): void;
  function findContours(src: Mat, contours: MatVector, hierarchy: Mat, mode: number, method: number): void;
  function contourArea(contour: Mat, oriented?: boolean): number;
  function arcLength(curve: Mat, closed: boolean): number;
  function approxPolyDP(curve: Mat, approxCurve: Mat, epsilon: number, closed: boolean): void;

  const RETR_EXTERNAL: number;
  const CHAIN_APPROX_SIMPLE: number;
  const BORDER_DEFAULT: number;
  const CV_64F: number;

  // FS (virtual filesystem)
  const FS: {
    createDataFile: (parent: string, name: string, data: Uint8Array, canRead: boolean, canWrite: boolean, canOwn: boolean) => void;
    lookupPath: (path: string) => any;
  };
}

// ผูกตัวแปร global ให้ TS รู้ว่ามีอยู่ตอนรัน
declare const cv: typeof cv;

export {};


declare global {
  const cv: any;
  interface Window { cv: any; }


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