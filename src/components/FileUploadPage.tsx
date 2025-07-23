"use client";

import * as React from "react";
import { ArrowLeft, UploadCloud, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress"; // **(1) Import Progress component**

export function FileUploadPage() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false); // **(2) State สำหรับสถานะการอัปโหลด**
  const [uploadProgress, setUploadProgress] = React.useState(0); // **(3) State สำหรับเปอร์เซ็นต์**
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // ใช้ useRef เพื่อเก็บ interval ID จะได้ยกเลิกได้
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // **(4) ฟังก์ชันจำลองการอัปโหลด**
  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFile(file); // แสดงชื่อไฟล์ทันที

    // จำลองความคืบหน้าการอัปโหลด
    intervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          if(intervalRef.current) clearInterval(intervalRef.current);
          setIsUploading(false); // อัปโหลดเสร็จ
          return 100;
        }
        return prev + 10; // เพิ่มทีละ 10%
      });
    }, 200); // อัปเดตทุก 0.2 วินาที
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large! Maximum size is 10 MB.");
        return;
      }
      simulateUpload(file); // เริ่มจำลองการอัปโหลด
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large! Maximum size is 10 MB.");
        return;
      }
      simulateUpload(file); // เริ่มจำลองการอัปโหลด
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDropzoneClick = () => {
    // ไม่ให้คลิกได้ตอนกำลังอัปโหลด
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  // **(5) ฟังก์ชันยกเลิกการอัปโหลด/ลบไฟล์**
  const handleCancelOrRemove = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current); // หยุดการจำลอง
    }
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="p-4">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="flex-col w-full max-w-md rounded-2xl shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold">Upload from device</CardTitle>
                <CardDescription className="text-sm text-gray-500 pt-1">
                  Please upload your files here
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                <X className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".jpg,.jpeg,.png,.pdf" />

            {/* **(6) ส่วนแสดงผลตามสถานะ **/}
            {isUploading ? (
              // UI ขณะกำลังอัปโหลด
              <div className="mt-2 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl">
                 <div className="text-center">
                    <div className="relative w-20 h-20">
                         <Progress value={uploadProgress} className="w-full h-full rounded-full" />
                         <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-gray-700">
                             {uploadProgress}%
                         </span>
                    </div>
                    <p className="mt-4 font-semibold text-gray-700">Uploading...</p>
                    <Button variant="link" size="sm" onClick={handleCancelOrRemove} className="text-red-500 hover:text-red-600 h-auto p-0 mt-2">
                        Cancel
                    </Button>
                </div>
              </div>
            ) : selectedFile ? (
              // UI เมื่ออัปโหลดเสร็จ (ไฟล์ที่ถูกเลือก)
              <div className="mt-2 text-center p-4 border border-gray-200 rounded-xl">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-left">
                        <FileIcon className="h-8 w-8 text-gray-400" />
                        <div>
                             <p className="font-semibold text-gray-700 break-all">{selectedFile.name}</p>
                             <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleCancelOrRemove}>
                        <X className="h-5 w-5 text-gray-500" />
                    </Button>
                 </div>
              </div>
            ) : (
              // UI เริ่มต้น (Dropzone)
              <div
                onClick={handleDropzoneClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="mt-2 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 font-semibold text-gray-600">Upload picture here</p>
                  <p className="mt-1 text-xs text-gray-500">Max 10 MB files are allowed</p>
                </div>
              </div>
            )}

            <p className="mt-4 text-xs text-gray-500">
              Only support .jpg, .png and .pdf files
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="p-4">
        <Button className="w-full max-w-md mx-auto flex h-12 text-base" disabled={!selectedFile || isUploading}>
          Confirm
        </Button>
      </footer>
    </div>
  );
}