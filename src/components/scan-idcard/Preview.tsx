import React from 'react';

interface PreviewProps {
  croppedImage: string | null;
  error: string | null;
  onRetry: () => void;
  onSubmit: () => void;
  isProcessing?: boolean;
}

export default function Preview({ croppedImage, error, onRetry, onSubmit, isProcessing }: PreviewProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-gray-900">
      <h2 className="text-xl font-bold text-white mb-4">ตรวจสอบภาพบัตรประชาชน</h2>
      {croppedImage ? (
        <img src={croppedImage} alt="Preview" className="rounded-lg shadow-lg mb-4 max-w-xs" />
      ) : (
        <div className="w-64 h-40 bg-gray-700 rounded-lg flex items-center justify-center text-white">ไม่มีภาพ</div>
      )}
      {error && <div className="text-red-500 font-semibold mb-2">{error}</div>}
      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          onClick={onRetry}
          disabled={isProcessing}
        >
          ถ่ายใหม่
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={onSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? 'กำลังส่งข้อมูล...' : 'ยืนยัน'}
        </button>
      </div>
    </div>
  );
}
