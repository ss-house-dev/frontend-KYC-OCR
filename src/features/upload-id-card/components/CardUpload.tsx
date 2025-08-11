"use client";

import * as React from "react";
import { UploadCloud, X, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CardUploadProps {
  isUploading: boolean;
  uploadProgress: number;
  selectedFile: File | null;
  filePreview: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDropzoneClick: () => void;
  onCancelOrRemove: () => void;
}

export const CardUpload = React.forwardRef<HTMLInputElement, CardUploadProps>(
  ({ 
    isUploading, 
    uploadProgress, 
    selectedFile,
    filePreview,
    onFileChange,
    onDrop,
    onDragOver,
    onDropzoneClick,
    onCancelOrRemove
  }, fileInputRef) => {
  return (
    <div className="flex items-center justify-center p-4 mb-10">
      <div className="w-full max-w-md rounded-2xl shadow-lg bg-white p-6">
        <h2 className="text-xl text-[#0F2D73] font-bold">Upload from device</h2>
        <p className="text-sm text-gray-500 pt-1">Please upload your files here</p>
        <div className="mt-4">
          <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept=".jpg, .png, .pdf" />

          {/* Uploading picture */}
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
              <Button variant="outline" size="sm" onClick={onCancelOrRemove} className="mt-4 rounded-lg border-gray-300 text-gray-600">Cancel</Button>
            </div>
          ) : (
            <div
              onClick={onDropzoneClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
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

          <p className="mt-4 text-xs text-gray-500">Only support .jpg, .png and .pdf files</p>

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
                  onClick={onCancelOrRemove}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 rounded-full flex-shrink-0 transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});