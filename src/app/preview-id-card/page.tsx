import PreviewIDCardSection from "@/features/preview-id-card/containers/PreviewIDCardSection";

const IconArrowLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 19.5L8.25 12l7.5-7.5"
    />
  </svg>
);

export default function Home() {
  return (
    <div className="bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen">
        <header className="relative flex items-center justify-center p-5 border-b border-gray-200">
          <button className="absolute left-4 top-1/2 -translate-y-1/2">
            <IconArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-[#0F2D73]">
            Verify Your Identity
          </h1>
        </header>
        <main>
          
          <PreviewIDCardSection />
        </main>
      </div>
    </div>
  );
}
