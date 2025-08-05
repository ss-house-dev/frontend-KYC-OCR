// src/screens/VerifyIdentityScreen.jsx

import React from 'react';
import FormField from '@/components/FormField'; // <-- Import FormField here


const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const IconInfo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);

// The main screen component
export default function VerifyIdentityScreen() {
  return (
    <div className="bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen">
        
        {/* Header */}
        <header className="relative flex items-center justify-center p-4">
          <button className="absolute left-4 top-1/2 -translate-y-1/2">
            <IconArrowLeft />
          </button>
          <h1 className="text-xl font-bold">Verify Your Identity</h1>
        </header>

        <div className="p-4">
          {/* Info Banner */}
          <div className="flex items-start space-x-2.5 rounded-lg bg-[#246AEC] text-white p-3 mb-5">
            <IconInfo />
            <p className="text-sm font-medium">
              Your data will be used only for identity verification and handled securely.
            </p>
          </div>
          
          {/* ID Card Image */}
          <img 
            src="http://googleusercontent.com/file_content/0"
            alt="Thai National ID Card" 
            className="rounded-xl w-full mb-5"
          />

          <div className="space-y-4">
            {/* --- Data Group 1 --- */}
            <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
              <FormField label="ID Card" value="140-990-3549-297" charCount="13/13" />
              <FormField label="Date of Issue" value="23-01-2019" />
              <FormField label="Date of Expiry" value="22-12-2027" />
              <FormField label="Laser ID" placeholder="Enter Laser ID number" charCount="14/14" />
            </div>

            {/* --- Data Group 2 --- */}
            <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4 space-y-4">
              <FormField label="Full name" value="วิชญ์พิสิฐ" charCount="06/50" />
              <FormField label="Last name" value="เผ่าบริรักษ์" charCount="06/50" />
              <FormField label="Date of Birth" value="23-12-2003" />
            </div>

            {/* --- Data Group 3 --- */}
            <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-4">
               <FormField label="Address" value="205 หมู่ 4 ต.เมืองเก่า อ.เมือง จ.ขอนแก่น" charCount="67/100" />
            </div>
          </div>

          {/* Confirm Button */}
          <div className="mt-6">
            <button className="w-full h-12 rounded-xl bg-gray-800 text-white font-semibold text-base hover:bg-gray-900 active:bg-gray-700">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}