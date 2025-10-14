"use client";

import React, { useRef, useImperativeHandle, forwardRef } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";

export type BookBankCropperRef = {
  getCroppedDataURL: () => string | null;
};

type Props = {
  image: string;
  aspect: number; // เช่น 3/4
};

const BookBankCropper = forwardRef<BookBankCropperRef, Props>(
  ({ image, aspect }, ref) => {
    const cropperRef = useRef<ReactCropperElement>(null);

    useImperativeHandle(ref, () => ({
      getCroppedDataURL: () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return null;
        // เอา canvas ที่ครอปแล้ว (กำหนดขนาดผลลัพธ์ตามต้องการ)
        const canvas = cropper.getCroppedCanvas({
          imageSmoothingQuality: "high",
        });
        return canvas?.toDataURL("image/jpeg", 0.92) ?? null;
      },
    }));

    return (
      <div className="relative" style={{ height: "calc(100dvh - 180px)" }}>
        <Cropper
          ref={cropperRef}
          src={image}
          dragMode="none"
          movable={false}
          zoomable={false}
          scalable={false}
          rotatable={false}
          // ปลดล็อกอัตราส่วน
          aspectRatio={undefined}
          autoCropArea={0.85}
          viewMode={1}
          guides={true}
          background={false}
          responsive={true}
          checkOrientation={false}
          cropBoxMovable={true}
          cropBoxResizable={true}
          // กันกรอบเล็กเกิน
          minCropBoxWidth={180}
          minCropBoxHeight={120}
          style={{ height: "100%", width: "100%" }}
          className="bb-cropper"
        />
      </div>
    );
  }
);

BookBankCropper.displayName = "BookBankCropper";
export default BookBankCropper;
