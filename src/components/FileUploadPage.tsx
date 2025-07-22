"use client"; // จำเป็นต้องใช้ Client Component เพราะมีการใช้ State และ Event Handlers

import * as React from "react";
import { ArrowLeft, UploadCloud, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * A responsive file upload page component built with Next.js, Tailwind CSS, and shadcn/ui.
 * It features a drag-and-drop zone and file selection handling.
 */
export function FileUploadPage() {
  // State สำหรับเก็บไฟล์ที่ผู้ใช้เลือก
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  // Ref สำหรับเชื่อมกับ input element
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handler เมื่อมีการเลือกไฟล์
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File is too large! Maximum size is 10 MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handler สำหรับการลากไฟล์มาวาง
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
        if (file.size > 10 * 1024 * 1024) {
            alert("File is too large! Maximum size is 10 MB.");
            return;
        }
        setSelectedFile(file);
    }
  };

  // ป้องกันพฤติกรรมปกติของ browser เมื่อลากไฟล์ข้าม
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // เมื่อคลิกที่ dropzone ให้ไป trigger การคลิกที่ input file
  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };
  
  // ฟังก์ชันสำหรับลบไฟล์ที่เลือก
  const handleRemoveFile = () => {
    setSelectedFile(null);
    // รีเซ็ตค่าใน input เพื่อให้สามารถเลือกไฟล์เดิมซ้ำได้
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      {/* Header with back arrow */}
      <header className="p-4">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-lg">
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
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
            />
            
            {/* Dropzone Area */}
            <div
              onClick={handleDropzoneClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="mt-2 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {selectedFile ? (
                // แสดงผลเมื่อมีไฟล์ถูกเลือกแล้ว
                <div className="text-center">
                    <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 font-semibold text-gray-700 break-all">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <Button variant="link" size="sm" onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }} className="text-red-500 hover:text-red-600 h-auto p-0 mt-2">
                        Remove file
                    </Button>
                </div>
              ) : (
                // แสดงผลเมื่อยังไม่มีไฟล์
                <div className="text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 font-semibold text-gray-600">
                    Upload picture here
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Max 10 MB files are allowed
                  </p>
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-gray-500">
              Only support .jpg, .png and .pdf files
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer with Confirm button */}
      <footer className="p-4">
        <Button
          className="w-full max-w-md mx-auto flex h-12 text-base"
          disabled={!selectedFile}
        >
          Confirm
        </Button>
      </footer>
    </div>
  );
}
