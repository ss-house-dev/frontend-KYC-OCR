// src/components/verify-identity-page.tsx

import * as React from "react";
import { Camera, UploadCloud, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {Card} from "@/components/ui/card";

// Data for the stepper component
const steps = [
  { id: 1, title: "ID Card" },
  { id: 2, title: "Personal Info" },
  { id: 3, title: "Address" },
  { id: 4, title: "Source of income" },
  { id: 5, title: "Face ID" },
  { id: 6, title: "Declaration & Consent" },
];


const Stepper = ({ currentStep }: { currentStep: number }) => (
  <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
    <div className="absolute top-5 left-13 right-13 h-1 bg-gray-300"></div>
    <div className="relative flex justify-between">
      {steps.map((step) => (
        <div key={step.id} className="flex flex-col items-center w-24 text-center">
          <div
            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
              step.id === currentStep
                ? "bg-blue-600 text-white"
                : "border-2 border-gray-300 bg-white text-gray-400"
            }`}
          >
            {step.id}
          </div>
          <p
            className={`mt-2 text-xs font-semibold transition-all duration-300 ${
              step.id === currentStep ? "text-blue-600" : "text-gray-500"
            }`}
          >
            {step.title}
          </p>
        </div>
      ))}
    </div>
  </div>
);


export function VerifyIdentityPage() {
    function onNavigateToUpload(event: React.MouseEvent<HTMLDivElement, MouseEvent>): void {
        event.preventDefault();
        alert("Navigate to upload ID card page or open file dialog.");
    }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-lg ">
        <Stepper currentStep={1} />
        <div className="w-full bg-white rounded-xl shadow-md p-8 ">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Verify Your Identity</h1>
            <p className="mt-2 text-gray-600">
              Choose one option to verify your ID card
            </p>
          </div>

          <div className="space-y-4">
            {/* Scan ID Card */}
            <Card className="p-4 flex items-center space-x-6 cursor-pointer hover:bg-gray-100/70 transition duration-200">
              <div className="bg-blue-600 p-4 rounded-lg">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-base sm:text-lg text-gray-800">Scan ID Card</h2>
                <p className="text-xs sm:text-sm text-gray-500">Use your Camera to scan</p>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </Card>

            {/* Upload from device */}
            
            <Card 
            className="p-4 flex items-center space-x-6 cursor-pointer hover:bg-gray-100/70 transition duration-200">
              <div className="bg-blue-600 p-4 rounded-lg">
                <UploadCloud className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-base sm:text-lg text-gray-800">Upload from device</h2>
                <p className="text-xs sm:text-sm text-gray-500">Choose file from your device</p>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

}

