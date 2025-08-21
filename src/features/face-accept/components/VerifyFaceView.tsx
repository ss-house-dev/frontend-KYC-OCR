"use client";

import { useState } from "react";
import Image from "next/image";

export default function VerifyFaceView() {
  const [isChecked, setIsChecked] = useState(false);

  const onCheckboxChange = (checked: boolean) => setIsChecked(checked);

  const onStartScan = () => {
    if (!isChecked) return;
    console.log("Start scan");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-inter gap-[86px]">
      <main className="flex-1 px-5 pt-8  max-w-md w-full mx-auto">
        <div className="w-full mb-6 flex items-baseline justify-between text-gray-600">
          <span className="text-[15px]">Step 2 of 3</span>
          <span className="text-[15px]">Face Verification</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 max-w-md">
          <div className="h-1.5 rounded-full bg-blue-600" />
          <div className="h-1.5 rounded-full bg-blue-600" />
          <div className="h-1.5 rounded-full bg-gray-300" />
        </div>

        <div className="text-center">
          <h2 className="font-semibold text-[#0F2D73] text-[18px]">
            Please prepare for face scan.
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Make sure your face is clearly visible.
          </p>
        </div>

        <ul className="mt-6 divide-y divide-gray-200">
          <li className="flex gap-4 p-4">
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
          <li className="flex gap-4 p-4">
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
          <li className="flex gap-4 p-4">
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
          <li className="flex gap-4 p-4">
            <Image
              src="/face-accept/no-one-background.png"
              alt="No background people"
              width={76}
              height={76}
              className="rounded-md object-contain"
            />
            <p className="text-[14px] leading-5 text-gray-700">
              Ensure no one is in the background during the scan.
            </p>
          </li>
        </ul>
      </main>

      <footer className="p-6  bg-white">
        <svg
          className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span className="text-sm text-black" style={{ fontSize: "14px" }}>
          <label
            htmlFor="consent-checkbox"
            className="flex items-start space-x-3 cursor-pointer"
          >
            <div className="relative flex-shrink-0 mt-1">
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onCheckboxChange(e.target.checked)}
                className="sr-only"
              />

              <label
                htmlFor="consent-checkbox"
                className="block h-5 w-5 absolute left-0 top-0 cursor-pointer border rounded-[6px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1849D6]/40"
                style={{
                  borderColor: isChecked ? "#1849D6" : "#D1D5DB",
                  backgroundColor: isChecked ? "#1849D6" : "#fff",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: "5px",
                    width: "8px",
                    height: "12px",
                    borderRight: `2px solid ${
                      isChecked ? "#fff" : "transparent"
                    }`,
                    borderBottom: `2px solid ${
                      isChecked ? "#fff" : "transparent"
                    }`,
                    transform: "rotate(45deg)",
                    pointerEvents: "none",
                  }}
                />
              </label>
            </div>

            <svg
              className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span className="text-sm text-black" style={{ fontSize: "14px" }}>
              I consent to Kyra KYC processing my personal and biometric data
              for identity verification, AML compliance, and as per its privacy
              policy.
            </span>
          </label>
          <div className="mt-4"></div>
          <button
            onClick={onStartScan}
            disabled={!isChecked}
            className={`w-full py-3 rounded-lg text-white  text-base transition-colors duration-300 ${
              isChecked ? "bg-[#2152b6]" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Get Started
          </button>
        </span>
      </footer>
    </div>
  );
}
