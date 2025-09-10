"use client";
import React from "react";
import Image from "next/image";

const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" />
  </svg>
);

interface VerifyIdViewProps {
  isChecked: boolean;
  onCheckboxChange: (checked: boolean) => void;
  onStartScan: () => void;
  onBack: () => void;
}

export default function VerifyIdView({
  isChecked,
  onCheckboxChange,
  onStartScan,
}: VerifyIdViewProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-white font-inter">
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
        <main className="flex flex-grow flex-col p-6 pt-8 ">
          <div className="mb-6 w-full">
            <div className="flex items-baseline justify-between gap-4">
              <span className="whitespace-nowrap text-[18px] text-black">
                Step 1 of 3
              </span>
              <span className="whitespace-nowrap text-[18px] text-gray-600">
                ID Card Verification
              </span>
            </div>

            <div className="mt-2 flex items-center gap-6">
              <div className="h-1.5 w-[120px] rounded-full bg-blue-600" />
              <div className="h-1.5 w-30 rounded-full bg-gray-300" />
              <div className="h-1.5 w-30 rounded-full bg-gray-300" />
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <h2
              className="font-bold"
              style={{ color: "#0F2D73", fontSize: "20px" }}
            >
              Please have your ID card ready
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Make sure your ID card is clearly visible.
            </p>
          </div>

          <div className="mx-auto my-4 h-30 w-44">
            <Image
              src="/id-accept/card-sample.svg"
              alt="ID Card Illustration"
              width={160}
              height={160}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="my-4 grid grid-cols-3 gap-5">
            <div className="flex items-center justify-center">
              <Image
                src="/id-accept/card-sample-correct.svg"
                alt="Correct Example"
                width={100}
                height={75}
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/id-accept/card-sample-blurry.svg"
                alt="Blurry Example"
                width={100}
                height={75}
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-center">
              <Image
                src="/id-accept/card-sample-glare.svg"
                alt="Glare Example"
                width={100}
                height={75}
                className="object-contain"
              />
            </div>
          </div>

          <div className="text-left space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="flex items-center" key={i}>
                <span className="mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                  <svg
                    className="h-4 w-4 text-gray-600"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="11"
                      fill="#fff"
                      stroke="#9ca3af"
                      strokeWidth="2"
                    />
                    <text
                      x="12"
                      y="17"
                      textAnchor="middle"
                      fontSize="16"
                      fill="#9ca3af"
                      fontWeight="bold"
                    >
                      !
                    </text>
                  </svg>
                </span>
                <span className="text-[13px] text-gray-600">
                  {i === 0 && "Place your ID card within the camera frame."}
                  {i === 1 &&
                    "Please make sure your camera is steady to avoid blurry images."}
                  {i === 2 &&
                    "Please make sure you are in a well-lit area for optimal results."}
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur  border-gray-200">
        <div className="mx-auto w-full max-w-[480px] p-6 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <label className="flex cursor-pointer items-start gap-3">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onCheckboxChange(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="block h-5 w-5 rounded-[6px] border transition-colors
                     border-[#D1D5DB] bg-white
                     peer-focus-visible:ring-2 peer-focus-visible:ring-[#1849D6]/40
                     peer-checked:border-[#1849D6] peer-checked:bg-[#1849D6]"
              />
              <svg
                className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 opacity-0 transition-opacity
                     peer-checked:opacity-100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <span className="text-sm text-black">
              I consent to Kyra KYC processing my personal and biometric data
              for identity verification, AML compliance, and as per its privacy
              policy.
            </span>
          </label>

          <div className="mt-4" />
          <button
            onClick={onStartScan}
            disabled={!isChecked}
            className={`w-full rounded-lg py-3 text-base text-white transition-colors duration-300 ${
              isChecked ? "bg-[#2152b6]" : "cursor-not-allowed bg-gray-400"
            }`}
          >
            Get Started
          </button>
        </div>
      </footer>
    </div>
  );
}
