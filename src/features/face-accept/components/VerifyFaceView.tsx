"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function VerifyFaceView() {
  const [isChecked, setIsChecked] = useState(false);
  const router = useRouter();

  const onCheckboxChange = (checked: boolean) => setIsChecked(checked);

  const onStartScan = () => {
    if (!isChecked) return;
    console.log("Start scan");
    router.push("/scan-face");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-inter">
      <main className="flex-1 px-5 pt-8 max-w-md w-full mx-auto">
        <div className="w-full mb-1 flex items-baseline justify-between text-[#4B5563] font-normal">
          <span className="text-lg">Step 2 of 3</span>
          <span className="text-lg">Face Verification</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 max-w-md">
          <div className="h-1 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1E40AF]" />
          <div className="h-1 rounded-full bg-gradient-to-r from-[#2563EB] to-[#1E40AF]" />
          <div className="h-1 rounded-full bg-[#E5E7EB]" />
        </div>

        <div className="text-center">
          <h2 className="font-semibold text-[#0F2D73] text-[18px]">
            Please prepare for face scan.
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Make sure your face is clearly visible.
          </p>
        </div>

        <ul className="mt-0 divide-y divide-gray-200">
          <li className="flex gap-4 py-4">
            <Image
              src="/face-accept/hold-your-phone.png"
              alt="Hold phone"
              width={76}
              height={76}
              className="rounded-md object-contain"
              priority
            />
            <p className="text-[14px] leading-5 text-gray-700">
              Hold your phone slightly above eye level while scanning for a
              clear view of your face.
            </p>
          </li>
          <li className="flex gap-4 py-4">
            <Image
              src="/face-accept/face-clear.png"
              alt="Face clear"
              width={76}
              height={76}
              className="rounded-md object-contain"
            />
            <p className="text-[14px] leading-5 text-gray-700">
              Please remove sunglasses, mask, hat or any items covering your
              face.
            </p>
          </li>
          <li className="flex gap-4 py-4">
            <Image
              src="/face-accept/against-the-light.png"
              alt="Lighting"
              width={76}
              height={76}
              className="rounded-md object-contain"
            />
            <p className="text-[14px] leading-5 text-gray-700">
              Avoid overly bright or dark lighting and do not scan against the
              light.
            </p>
          </li>
          <li className="flex gap-4 py-4 pb-0">
            <Image
              src="/face-accept/no-one-background.png"
              alt="No background people"
              width={76}
              height={76}
              className="rounded-md object-contain"
            />
            <p className="text-sm leading-5 text-[#4B5563]">
              Ensure no one is in the background while scanning.
            </p>
          </li>
        </ul>
      </main>

      {/* Footer ไม่ลอย: เอา fixed ออก และจัดความกว้างให้เท่ากับ main */}
      <footer className="w-full  border-gray-200">
        <div className="max-w-md w-full mx-auto p-5 pt-0 pb-6 mt-20">
          <label className="group flex items-start gap-3 cursor-pointer">
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
              for identity verification,{" "}
              <span className="transition-colors group-has-[input:checked]:text-[#3A89F7]">
                PDPA
              </span>{" "}
              compliance, and as per its privacy policy.
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
