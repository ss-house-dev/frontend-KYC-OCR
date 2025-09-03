import Image from "next/image";

export default function FaceVerificationPage() {

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center px-6 py-10">
      {/* Top badge */}
      <div className="mt-6 mb-6">
        <div className="w-28 h-28 rounded-full grid place-items-center">
          <Image
            src="/verification-complete/checkmark-complete.png"
            alt="Verification Complete"
            width={112}
            height={112}
            className="rounded-full"
          />
        </div>
      </div>

      {/* Headings */}
      <h1 className="text-[22px] sm:text-2xl font-semibold text-neutral-900 text-center">
        KYC Verification Complete
      </h1>
      <p className="mt-3 text-[30px] text-neutral-600 text-center">
        We’ve received all your documents
      </p>
      <p className="mt-1 text-[30px] text-neutral-600 text-center">
        We’ll send the verification result to your email within 24 hours
      </p>

      {/* Info card */}
      <div className="w-full max-w-md mt-8">
        <div className="flex items-start gap-3 rounded-2xl bg-[#F4F7FF] px-4 py-4">
          <div className="shrink-0 mt-[2px]">
            <div className="w-6 h-6 rounded-full bg-[#2E6BFF] grid place-items-center">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
          <p className="text-[15px] leading-snug text-neutral-700">
            Your information is encrypted and securely stored following industry
            standards
          </p>
        </div>
      </div>
    </div>
  );
}
