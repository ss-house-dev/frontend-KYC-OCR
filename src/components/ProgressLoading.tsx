import React from "react";

interface ProgressLoadingProps {
  progress: number;
}

const ProgressLoading: React.FC<ProgressLoadingProps> = ({ progress }) => {
  // คำนวณเส้นรอบวงของวงกลม (2 * PI * R)
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  // คำนวณส่วนของเส้นที่จะแสดงตาม progress
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full h-48 bg-white rounded-xl mb-5 border-2 border-dashed border-[#1849D6] flex flex-col items-center justify-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-200"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          {/* วงกลมแสดง Progress */}
          <circle
            className="text-blue-600 transition-all duration-300 ease-linear"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        {/* ข้อความเปอร์เซ็นต์ */}
        <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-gray-700">
          {progress}%
        </span>
      </div>
      <p className="mt-3 text-base text-gray-500">loading...</p>
    </div>
  );
};

export default ProgressLoading;
