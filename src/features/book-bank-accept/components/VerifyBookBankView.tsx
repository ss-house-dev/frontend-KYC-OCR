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
interface VerifyBookBankViewProps {
  isChecked: boolean;
  onCheckboxChange: (checked: boolean) => void;
  onStartScan: () => void;
  onBack: () => void;
}

export default function VerifyBookBankView({
  isChecked,
  onCheckboxChange,
  onStartScan,
}: VerifyBookBankViewProps) {
  return (
    <div className="flex flex-col h-screen bg-white font-inter">
      <main className="flex-grow flex flex-col p-6 pt-8">
        <div className="w-full mb-8">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[18px]  text-gray-600 whitespace-nowrap">
              Step 1 of 3
            </span>
            <span className="text-[18px]  text-gray-600 whitespace-nowrap">
              Add Book Bank
            </span>
          </div>

          <div className="mt-2 flex items-center gap-6">
            <div className="h-1.5 w-[120px] rounded-full bg-blue-600" />
            <div className="h-1.5 w-[120px] rounded-full bg-blue-600" />
            <div className="h-1.5 w-[120px] rounded-full bg-blue-600" />
          </div>
        </div>

        <div className="mb-6 flex flex-col items-center text-center">
          <h2
            className="font-bold m-0 inline whitespace-nowrap"
            style={{ color: "#0F2D73", fontSize: "20px", lineHeight: "20px" }}
          >
            Please have your Book Bank ready.
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Make sure your Book Bank is clearly visible.
          </p>
        </div>
        <div className="w-40 h-40 mx-auto my-4">
          <Image
            src="\book-bank-accept\book-bank-sample.svg"
            alt="ID Card Illustration"
            width={160}
            height={160}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="flex items-center justify-center">
            <Image
              src="\book-bank-accept\book-bank-sample-correct.svg"
              alt="Correct Example"
              width={100}
              height={75}
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-center">
            <Image
              src="\book-bank-accept\book-bank-sample-blurry.svg"
              alt="Blurry Example"
              width={100}
              height={75}
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-center">
            <Image
              src="\book-bank-accept\book-bank-sample-glare.svg"
              alt="Glare Example"
              width={100}
              height={75}
              className="object-contain"
            />
          </div>
        </div>

        <div className="space-y-3 text-left">
          <div className="flex ">
            <span className="flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0 rounded-full ">
              <svg
                className="w-4 h-4 text-gray-600"
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
            <span className="text-gray-600" style={{ fontSize: "13px" }}>
              Place your Book Bank within the camera frame.
            </span>
          </div>
          <div className="flex items-center">
            <span className="flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0 rounded-full ">
              <svg
                className="w-4 h-4 text-gray-600"
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
            <span className="text-gray-600" style={{ fontSize: "13px" }}>
              Please make sure your camera is steady to avoid blurry images.
            </span>
          </div>
          <div className="flex items-center">
            <span className="flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0 rounded-full ">
              <svg
                className="w-4 h-4 text-gray-600"
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
            <span className="text-gray-600" style={{ fontSize: "13px" }}>
              Please make sure you are in a well-lit area for optimal results.
            </span>
          </div>
          <div className="flex items-center">
            <span className="flex items-center justify-center w-5 h-5 mr-3 flex-shrink-0 rounded-full">
              <svg
                className="w-4 h-4 text-gray-600"
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
              You’re allowed to upload{" "}
              <a
                href="https://www.facebook.com/wyp.ch23/about"
                className="text-[#007AFF] hover:underline focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 rounded-sm"
              >
                E-book bank
              </a>
            </span>
          </div>
        </div>
      </main>
      <footer className="p-6  bg-white">
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
            I consent to Kyra KYC processing my personal and biometric data for
            identity verification, AML compliance, and as per its privacy
            policy.
          </span>
        </label>
        <div className="mt-4"></div>
        <button
          onClick={onStartScan}
          disabled={!isChecked}
          className={`w-full py-3 rounded-lg text-white  text-base transition-colors duration-300 ${
            isChecked
              ? "bg-gradient-to-b from-[#1F4293] to-[#246AEC] hover:from-[#246AEC] hover:to-[#1F4293]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Get Started
        </button>
      </footer>
    </div>
  );
}
