// src/app/scan-idcard/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import IdCardScanner from '@/components/scan-idcard/IdCardScanner';
import Preview from '@/components/scan-idcard/Preview'; // สมมติว่ามีคอมโพเนนต์นี้อยู่

const ScanIdCardPage = () => {
  const [status, setStatus] = useState<'capturing' | 'preview' | 'processing'>('capturing');
  const [error, setError] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [frameColor, setFrameColor] = useState<'red' | 'green'>('red'); // <-- แก้ไข Type ให้ตรง
  const [sharpnessMsg, setSharpnessMsg] = useState('กำลังเตรียมกล้อง...');
  const router = useRouter();

  const handleCapture = (image: string) => {
    setCroppedImage(image);
    setStatus('preview');
  };

  // --- ส่วนที่แก้ไข ---
  // รับค่ามา 2 ตัว (message และ newColor) เพื่ออัปเดต state ทั้งสอง
  const handleStatusChange = (message: string, newColor: 'red' | 'green') => {
    setSharpnessMsg(message);
    setFrameColor(newColor);
  };
  // --- สิ้นสุดส่วนที่แก้ไข ---

  const handleRetry = () => {
    setStatus('capturing');
    setCroppedImage(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!croppedImage) {
      setError('กรุณาถ่ายภาพบัตร');
      return;
    }
    setStatus('processing');
    try {
      // Your submission logic here
      console.log("Submitting image...");
      setTimeout(() => {
        router.push('/next-step');
      }, 2000);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการส่งข้อมูล');
      setStatus('preview');
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-900">
      <div className="w-full h-full min-h-screen p-4 bg-gray-800 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-center text-white mb-4">
          ยืนยันตัวตนด้วยบัตรประชาชน
        </h1>
        {status === 'capturing' ? (
          <IdCardScanner
            onCapture={handleCapture}
            onStatusChange={handleStatusChange}
            frameColor={frameColor}
            sharpnessMsg={sharpnessMsg}
          />
        ) : (
          <Preview
            croppedImage={croppedImage}
            error={error}
            onRetry={handleRetry}
            onSubmit={handleSubmit}
            isProcessing={status === 'processing'} // ส่งสถานะ processing ไปด้วย
          />
        )}
      </div>
    </main>
  );
};

export default ScanIdCardPage;