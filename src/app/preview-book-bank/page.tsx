import PreviewBookBankSection from "@/features/preview-book-bank/containers/PreviewBookBankSection";
import BackLink from "@/components/BackLink";
import { ChevronLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen">
        <header className="relative flex items-center justify-center p-5 border-b border-gray-200">
          <BackLink href="/book-bank-accept" type="bookbank">
            <ChevronLeft />
            <span className="sr-only">Back</span>
          </BackLink>
          <h1 className="text-xl font-bold text-[#0F2D73]">
            Book Bank Verification
          </h1>
        </header>
        <main>
          <PreviewBookBankSection />
        </main>
      </div>
    </div>
  );
}
