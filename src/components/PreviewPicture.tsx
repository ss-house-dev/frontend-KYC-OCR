'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PreviewPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'camera' | 'upload' | null>(null);
  const [status, setStatus] = useState<'preview' | 'processing'>('preview');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // เมื่อหน้านี้ถูกโหลด, ให้ดึงรูปจาก sessionStorage
  useEffect(() => {
    const imageSrc = sessionStorage.getItem('capturedIdCardImage');
    const source = sessionStorage.getItem('imageSource') as 'camera' | 'upload' | null;
    if (imageSrc && source) {
      setCapturedImage(imageSrc);
      setImageSource(source);
    } else {
      // ถ้าไม่มีรูป, ให้กลับไปหน้าถ่ายรูป
      router.replace('/');
    }
  }, [router]);

  // ฟังก์ชันสำหรับกลับไปถ่ายใหม่
  const handleRetakeOrReupload = () => {
    sessionStorage.removeItem('capturedIdCardImage');
    sessionStorage.removeItem('imageSource'); // อย่าลืมลบ key ที่มาของรูปด้วย

    // ตรวจสอบที่มาของรูปเพื่อกลับไปยังหน้าที่ถูกต้อง
    if (imageSource === 'upload') {
      router.push('/upload-id-card'); // แก้ไข path ไปยังหน้าอัปโหลดของคุณ
    } else {
      router.push('/'); // กลับไปหน้าถ่ายรูป (default)
    }
  };

  // ฟังก์ชันสำหรับยืนยันและส่งข้อมูล (เหมือนเดิม)
  const handleSubmit = async () => {
    if (!capturedImage) return;
    setStatus('processing');
    setError(null);
    // ... โค้ดส่วนที่เหลือสำหรับส่งข้อมูลไป API ...
  };

  // ข้อมูลสมมติสำหรับแสดงผล
  const extractedData = [
    { label: "13-digit Citizen ID number", verified: true },
    { label: "Full name", verified: true },
    { label: "Date of Birth", verified: true },
    { label: "Address", verified: true },
  ];

  if (status === 'processing') {
    return <div className="flex items-center justify-center min-h-screen"><h2 className="text-2xl font-bold animate-pulse">กำลังดึงข้อมูลจากภาพ...</h2></div>;
  }

  return (

    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <Card className="flex-col rounded-2xl shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-bold">Preview ID Card</CardTitle>
                <CardDescription className="text-sm text-gray-500 pt-1">
                  Please check your ID Card
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                <X className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured ID Card" className="rounded-lg border-2 border-dashed border-gray-200" />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center animate-pulse">
                  <p className="text-gray-500">Loading Image...</p>
                </div>
              )}
              {error && <p className="mt-2 p-2 text-center text-sm bg-red-100 text-red-700 rounded-lg">{error}</p>}
            </div>
            <div className="space-y-3 mb-6">
              {extractedData.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <p className="text-gray-700">{item.label}</p>
                  {item.verified && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleRetakeOrReupload} // เรียกใช้ฟังก์ชันใหม่
            variant="outline"
            className="w-full h-12 text-base border-gray-300 text-gray-800 hover:bg-gray-100"
          >
            {/* แสดงข้อความตามที่มาของรูปภาพ */}
            {imageSource === 'upload' ? 'Re upload' : 'Retake'}
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-full h-12 text-base bg-gradient-to-b from-[#1F4293] to-[#246AEC] text-white"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
