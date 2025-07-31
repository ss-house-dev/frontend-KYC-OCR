"use client";

import * as React from "react";
import { CardUpload } from "@/features/upload-id-card/components/CardUpload";
import { ConfirmButton } from "@/features/upload-id-card/components/ConfirmButton";
import { useRouter } from 'next/navigation';

export function UploadIDCardSection() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);

  const allowedFileTypes = ["image/jpg", "image/png", "application/pdf"];
  const allowedExtensions = [".jpg", ".png", ".pdf"];

  const simulateUpload = (file: File) => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFile(file);

    // การแสดงภาพตัวอย่าง
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    }
    intervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // เช็คขนาดไฟล์ที่อัปโหลด จากการคลิกเลือกไฟล์
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large! Maximum size is 10 MB.");
        return;
      }
      const allowedExtensions = ['.jpg', '.png', '.pdf'];
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

      if (!allowedExtensions.includes(fileExtension)) {
        alert("Please upload only .jpg, .png, or .pdf files.");
        // รีเซ็ต input เพื่อให้เลือกไฟล์เดิมซ้ำได้
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      simulateUpload(file);
    }
  };

  // เช็คขนาดไฟล์ที่อัปโหลด จากการลากไฟล์มาวาง
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isUploading || selectedFile) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large! Maximum size is 10 MB.");
        return;
      }
      const allowedExtensions = ['.jpg', '.png', '.pdf'];
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

      if (!allowedExtensions.includes(fileExtension)) {
        alert("Please upload only .jpg, .png, or .pdf files.");
        return;
      }
      simulateUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // ล้างไฟล์ที่อัปโหลด
  const handleDropzoneClick = () => {
    if (isUploading || selectedFile) return;
    fileInputRef.current?.click();
  };

  const handleCancelOrRemove = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const router = useRouter();

  const handleConfirmClick = () => {
    if (!selectedFile || isUploading) {
      console.log("Cannot confirm, button should be disabled.");
      return;
    }
    router.push('/preview-id-card');
    console.log("Confirm button clicked!", selectedFile.name);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* ส่ง State และ Functions ทั้งหมดไปเป็น Props */}
      <CardUpload
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        selectedFile={selectedFile}
        filePreview={filePreview}
        ref={fileInputRef}
        onFileChange={handleFileChange}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDropzoneClick={handleDropzoneClick}
        onCancelOrRemove={handleCancelOrRemove}
      />
      <ConfirmButton
        onClick={handleConfirmClick}
        disabled={!selectedFile || isUploading}
      />
    </div>
  );
}
