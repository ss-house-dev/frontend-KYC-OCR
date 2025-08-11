"use client";

import { UploadIDCardSection } from "@/features/upload-id-card/containers/UploadIDCardSection";
import { useRouter } from 'next/navigation';
import {GoBackButton} from "@/components/GoBackButton";

export default function Home() {

  const router = useRouter();
  const handleGoBack = () => {
    router.push('/verify-id-card');
  };

  return (
    <main className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <GoBackButton onClick={handleGoBack} />
      <UploadIDCardSection />
    </main>
  );
}