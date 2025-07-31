"use client";

import * as React from "react";
import { ArrowLeft,File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation'
import { CardUpload } from "@/features/upload-id-card/components/CardUpload";

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <header className="p-4">
        <Button
          onClick={() => router.push('/verified')}
          variant="ghost" size="icon">
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </header>

      {/* 3. ส่ง State และ Functions ทั้งหมดไปเป็น Props */}
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

      <footer className="p-4 mt-auto">
        <Button
          className="w-full max-w-md mx-auto flex h-12 text-base bg-gradient-to-b from-[#1F4293] to-[#246AEC] text-white transition-colors duration-200 hover:from-[#1A377A] hover:to-[#1F58C7] disabled:from-gray-500 disabled:to-gray-500 disabled:text-white"
          disabled={!selectedFile || isUploading}
        >
          Confirm
        </Button>
      </footer>
    </div>
  );
}
