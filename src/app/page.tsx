// src/app/page.tsx
import IdCardOcrUploader from "@/components/IdCardOcrUploader";
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900">
      <IdCardOcrUploader />
    </main>
  );
}