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
  // **(1) เพิ่ม State สำหรับเก็บ URL ภาพตัวอย่าง**
  const [filePreview, setFilePreview] = React.useState<string | null>(null);

  const simulateUpload = (file: File) => {
    // รีเซ็ตค่าเก่าก่อนเริ่มอัปโหลดใหม่
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }

    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFile(file);

    // **(2) สร้าง URL สำหรับภาพตัวอย่างถ้าเป็นไฟล์รูปภาพ**
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    }

    intervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsUploading(false); // อัปโหลดเสร็จ
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large! Maximum size is 10 MB.");
        return;
      }
      simulateUpload(file);
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
      simulateUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDropzoneClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleCancelOrRemove = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // **(3) ล้าง URL ภาพตัวอย่างเมื่อลบไฟล์ เพื่อป้องกัน memory leak**
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

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="flex-col w-full max-w-md rounded-2xl shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-blue-900 font-bold">Upload from device</CardTitle>
                <CardDescription className="text-sm text-gray-500 pt-1">
                  Please upload your files here
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".jpg,.jpeg,.png,.pdf" />

            {/* **(4) แก้ไข Logic: ใน Card จะแสดงแค่ Loading หรือ Dropzone** */}
            {isUploading ? (
              // UI ขณะกำลังอัปโหลด 
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
              // UI เริ่มต้น (Dropzone)
              <div 
                onClick={handleDropzoneClick} 
                onDrop={handleDrop} 
                onDragOver={handleDragOver} 
                className="mt-2 group flex flex-col items-center justify-center p-8 border-2 border-dashed border-blue-700 rounded-xl cursor-pointer transition-all duration-300 hover:border-solid hover:border-blue-600 hover:bg-[#F0F1F9]"
              >
                <div className="text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-blue-700 transition-colors duration-300 group-hover:text-blue-700" />
                  <p className="mt-4 font-semibold text-gray-600">Upload picture here</p>
                  <p className="mt-1 text-xs text-gray-500">Max 10 MB files are allowed</p>
                </div>
              </div>
            )}

            <p className="mt-4 text-xs text-gray-500">
              Only support .jpg, .png and .pdf files
            </p>
            {/* ส่วนแสดงไฟล์หลัง upload */}
            {selectedFile && !isUploading && (
              <div className="mt-4 w-full max-w-md p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-left">
                    {/* แสดงภาพตัวอย่างถ้ามี, หรือแสดงไอคอนไฟล์ทั่วไป */}
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                      <FileIcon className="h-10 w-10 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCancelOrRemove} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="p-4 mt-auto">
        <Button className="w-full max-w-md mx-auto flex h-12 text-base " disabled={!selectedFile || isUploading}>
          Confirm
        </Button>
      </footer>
    </div>
  );
}