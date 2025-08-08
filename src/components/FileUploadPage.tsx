"use client";

import * as React from "react";
import { ArrowLeft, UploadCloud, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from 'next/navigation'

export function FileUploadPage() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);

  const allowedFileTypes = ["image/jpg", "image/png", "application/pdf"];
  const allowedExtensions = [".jpg", ".png", ".pdf"];

  // State สำหรับจัดการสถานะ loading ตอนกด Confirm
  const [isConfirming, setIsConfirming] = React.useState(false);

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

  // ฟังก์ชันสำหรับจัดการการยืนยันไฟล์
  const handleConfirm = () => {
    // ตรวจสอบว่ามีไฟล์ที่เลือกและเป็นไฟล์รูปภาพหรือไม่
    if (!selectedFile || !selectedFile.type.startsWith('image/')) {
      alert('Please select an image file (.jpg, .png) to preview.');
      return;
    }

    setIsConfirming(true); // เริ่มสถานะ loading

    const reader = new FileReader();

    // เมื่ออ่านไฟล์เสร็จสิ้น
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string;
      sessionStorage.setItem('capturedIdCardImage', imageSrc);
      sessionStorage.setItem('imageSource', 'upload'); // ระบุว่ามาจากหน้าอัปโหลด
      router.push('/preview-id-card');
    };

    // หากเกิดข้อผิดพลาด
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      alert('Failed to read the file. Please try again.');
      setIsConfirming(false); // ปิดสถานะ loading
    };

    // เริ่มอ่านไฟล์ในรูปแบบ Data URL (Base64)
    reader.readAsDataURL(selectedFile);
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
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="flex-col w-full max-w-md rounded-2xl shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-[#0F2D73] font-bold">Upload from device</CardTitle>
                <CardDescription className="text-sm text-gray-500 pt-1">
                  Please upload your files here
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".jpg, .png, .pdf" />

            {/* uploading picture */}
            {isUploading ? (
              <div className="mt-2 flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-200 rounded-xl">
                <div className="relative h-20 w-20">
                  <svg className="h-full w-full" viewBox="0 0 100 100">
                    <circle className="stroke-current text-gray-200" cx="50" cy="50" r="45" strokeWidth="10" fill="transparent" />
                    <circle className="stroke-current text-blue-600" cx="50" cy="50" r="45" strokeWidth="10" fill="transparent" strokeDasharray={283} strokeDashoffset={283 - (uploadProgress / 100) * 283} strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-gray-800">{`${Math.round(uploadProgress)}%`}</span>
                </div>
                <p className="mt-4 font-semibold text-gray-700">Uploading...</p>
                <Button variant="outline" size="sm" onClick={handleCancelOrRemove} className="mt-4 rounded-lg border-gray-300 text-gray-600">Cancel</Button>
              </div>
            ) : (
              <div
                onClick={handleDropzoneClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`group flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-300 ${selectedFile
                  ? 'border-gray-300'
                  : 'border-blue-700 cursor-pointer hover:border-solid hover:border-blue-600 hover:bg-[#F0F1F9]'
                  }`}
              >
                <div className="text-center">
                  <UploadCloud className={`mx-auto h-12 w-12 transition-colors duration-300 ${selectedFile ? 'text-gray-400' : 'text-[#1849D6]'}`} />
                  <p className={`mt-4 font-semibold ${selectedFile ? 'text-gray-400' : 'text-gray-600'}`}>Upload picture here</p>
                  <p className={`mt-1 ${selectedFile ? 'text-gray-300' : 'text-gray-400'}`}>Max 10 MB files are allowed</p>
                </div>
              </div>
            )}

            <p className="mt-4 text-xs text-gray-500">
              Only support .jpg, .png and .pdf files
            </p>

            {/* แสดงตัวอย่างไฟล์ที่อัปโหลด */}
            {selectedFile && !isUploading && (
              <div className="mt-4 w-full max-w-md p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-1 items-center space-x-3 text-left min-w-0">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <FileIcon className="h-10 w-10 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    onClick={handleCancelOrRemove}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 rounded-full flex-shrink-0 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="p-4 mt-auto">
        <Button
          onClick={handleConfirm} // เพิ่ม onClick handler
          className="w-full max-w-md mx-auto flex h-12 text-base bg-gradient-to-b from-[#1F4293] to-[#246AEC] text-white transition-colors duration-200 hover:from-[#1A377A] hover:to-[#1F58C7] disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-400"
          // ปรับเงื่อนไข disabled ให้รวม isConfirming และเช็คว่าเป็นไฟล์รูปภาพหรือไม่
          disabled={!selectedFile || isUploading || isConfirming || !selectedFile.type.startsWith('image/')}
        >
          {isConfirming ? 'Confirming...' : 'Confirm'}
        </Button>
      </footer>
    </div>
  );
}
