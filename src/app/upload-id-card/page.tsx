"use client";

import { FileUploadPage } from "@/components/FileUploadPage";
import { UploadIDCardSection } from "@/features/upload-id-card/containers/UploadIDCardSection";
import { useRouter } from 'next/navigation';
import GoBackButton from "@/components/GoBackButton";

export default function Home() {

  const router = useRouter();

  const handleGoBack = () => {
    router.push('/verify-id-card');
  };

  return (
    <main >
      <GoBackButton onClick={handleGoBack} />
      <UploadIDCardSection />
      {/* <FileUploadPage /> */}
    </main>
  );
}