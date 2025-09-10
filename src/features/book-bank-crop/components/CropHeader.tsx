"use client";

import Link from "next/link";

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

export default function CropHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="relative flex items-center justify-center p-5 border-b border-gray-200">
      <Link
        href="/book-bank-accept"
        aria-label="Back"
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg
             focus-visible:outline focus-visible:outline-2
             focus-visible:outline-offset-2 focus-visible:outline-[#2152b6]"
      >
        <IconArrowLeft />
        <span className="sr-only">Back</span>
      </Link>
      <h1 className="text-xl font-semibold mx-auto text-[#0F2D73]">{title}</h1>
      <div className="w-5" />
    </div>
  );
}
