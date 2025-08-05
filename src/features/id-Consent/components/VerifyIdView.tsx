"use client";

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
    <div className="flex flex-col h-screen bg-white font-inter">
      <main className="flex-grow flex flex-col p-6 pt-8">

        <div className="flex  w-full mb-8 ">
          <div className="flex-1 flex flex-col items-center">
            <div
              className="flex flex-col items-start"
              style={{ width: "100px" }}
            >
              <span className="text-sm font-bold text-gray-400">
                Step 1 of 3
              </span>
              <div
                className="mt-1 bg-blue-600 rounded-full"
                style={{ width: "100px", height: "4px" }}
              ></div>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-end">
            <div
              className="mt-1 bg-gray-300 rounded-full"
              style={{ width: "100px", height: "4px" }}
            ></div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="w-[100px]">
              <span className="block text-sm font-semibold text-gray-400 text-right">
                Verify ID Card
              </span>
              <div className="mt-1 h-[4px] bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="mb-6 flex flex-col items-center text-center">
          <h2
            className="font-bold"
            style={{ color: "#0F2D73", fontSize: "20px" }}
          >
            Please have your ID card ready
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Make sure your ID card is clearly visible.
          </p>
        </div>

        <div className="w-40 h-40 mx-auto my-4">
          <img
            src="/id-Consent/Artboard 6 1.svg"
            alt="ID Card Illustration"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="flex items-center justify-center">
            <img
              src="/id-Consent/Artboard 7 1.svg"
              alt="Correct Example"
              className="object-contain"
              style={{ width: "100px", height: "75px" }}
            />
          </div>
          <div className="flex items-center justify-center">
            <img
              src="/id-Consent/Artboard 8 1.svg"
              alt="Blurry Example"
              className="object-contain"
              style={{ width: "100px", height: "75px" }}
            />
          </div>
          <div className="flex items-center justify-center">
            <img
              src="/id-Consent/Artboard 9 1.svg"
              alt="Glare Example"
              className="object-contain"
              style={{ width: "100px", height: "75px" }}
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
              Please make sure you are in a well-lit area for optimal results.
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
              Place your ID card within the camera frame.
            </span>
          </div>
        </div>
      </main>
      <footer className="p-6  bg-white">

        <label
          htmlFor="consent-checkbox"
          className="flex items-start space-x-3 cursor-pointer"
        >
          <div className="round relative flex-shrink-0 mt-1">
            <input
              id="consent-checkbox"
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onCheckboxChange(e.target.checked)}
              className="hidden"
            />
            <label
              htmlFor="c</svg>onsent-checkbox"
              className="block bg-white border border-gray-300 rounded-full cursor-pointer h-5 w-5 absolute left-0 top-0"
              style={{
                borderColor: isChecked ? "#1849D6" : "#ccc",
                backgroundColor: isChecked ? "#1849D6" : "#fff",
              }}
            >
              <span
                style={{
                  borderLeft: `2px solid ${isChecked ? "#fff" : "#9ca3af "}`,
                  borderBottom: `2px solid ${isChecked ? "#fff" : "#9ca3af "}`,
                  content: '""',
                  height: "6px",
                  left: "3px",
                  opacity: isChecked ? 1 : 0.5,
                  position: "absolute",
                  top: "5px",
                  transform: "rotate(-45deg)",
                  width: "12px",
                  display: "block",
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
            I consent to the collection and verification of my national ID
            information for the purposes of identity verification and AML
            compliance.
          </span>
        </label>
        <div className="mt-4"></div>
        <button
          onClick={onStartScan}
          disabled={!isChecked}
          className={`w-full py-3 rounded-lg text-white font-bold text-base transition-colors duration-300 ${
            isChecked
              ? "bg-gradient-to-b from-[#1F4293] to-[#246AEC] hover:from-[#246AEC] hover:to-[#1F4293]"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Start Scanning
        </button>
      </footer>
    </div>
  );
}
