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
    <div className="min-h-screen flex flex-col bg-white font-inter">
      <main className="flex-1 px-5 pt-8 max-w-md w-full mx-auto">
        <div className="w-full mb-1 flex items-baseline justify-between text-[#4B5563] font-normal">
          <span className="text-lg">Step 1 of 3</span>
          <span className="text-lg">ID Card Verification</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 max-w-md">
          <div className="h-1 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1E40AF]" />
          <div className="h-1 rounded-full bg-[#E5E7EB]" />
          <div className="h-1 rounded-full bg-[#E5E7EB]" />
        </div>

        <div className="text-center">
          <h2 className="font-semibold text-[#0F2D73] text-[18px]">
            Please have your ID card ready
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Make sure your face is clearly visible.
          </p>
        </div>

        <ul className="mt-0 divide-y divide-gray-200">
          <li className="flex gap-4 py-4">
            <Image
              src="/id-accept/id-card-fully.svg"
              alt="Hold phone"
              width={76}
              height={76}
              className="rounded-md object-contain"
              priority
            />
            <p className="text-[14px] leading-5 text-gray-700">
              The ID card must be clearly visible with all information fully
              captured.
            </p>
          </li>
          <li className="flex gap-4 py-4">
            <Image
              src="/id-accept/id-card-prepared-area.svg"
              alt="Face clear"
              width={76}
              height={76}
              className="rounded-md object-contain"
            />
            <p className="text-[14px] leading-5 text-gray-700">
              Please make sure your id card is in well area for optimal results.
            </p>
          </li>
          <li className="flex gap-4 py-4">
            <Image
              src="/id-accept/id-card-blurry.svg"
              alt="Lighting"
              width={76}
              height={76}
              className="rounded-md object-contain"
            />
            <p className="text-[14px] leading-5 text-gray-700">
              Please make sure your camera is steady to avoid blurry images.
            </p>
          </li>
          <li className="flex gap-4 py-4 pb-0">
            <Image
              src="/id-accept/id-crad-unobscured.svg"
              alt="No background people"
              width={76}
              height={76}
              className="rounded-md object-contain"
            />
            <p className="text-sm leading-5 text-[#4B5563]">
              Ensure your ID card is unobscured
            </p>
          </li>
        </ul>
      </main>

      {/* Footer ไม่ลอย: เอา fixed ออก และจัดความกว้างให้เท่ากับ main */}
      <footer className="w-full  border-gray-200">
        <div className="max-w-md w-full mx-auto p-5 pt-0 pb-6 mt-20">
          <label className="flex items-start gap-3 cursor-pointer">
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
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <span className="text-sm text-black font-normal">
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
