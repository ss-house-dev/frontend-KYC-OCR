declare namespace cv {
 export class Mat {
    rows: number;
    cols: number;
    constructor(rows: number, cols: number, type: number);
    delete(): void;
  }

  export function imread(image: HTMLCanvasElement | HTMLImageElement): Mat;
  export function resize(src: Mat, dst: Mat, dsize: any, fx: number, fy: number, interpolation: number): void;
  export function sumElems(src: Mat): any;
  export function Laplacian(src: Mat, dst: Mat, ddepth: number): void;
  export function matchTemplate(src: Mat, template: Mat, result: Mat, method: number, mask: any): void;
  export function minMaxLoc(src: Mat): any;
  export const COLOR_RGBA2GRAY: number;
  export const CV_8UC1: number;
  export const INTER_AREA: number;
  export const TM_CCOEFF_NORMED: number;
}
