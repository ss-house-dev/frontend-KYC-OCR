'use client'

import * as React from "react";
import { Camera, UploadCloud, ChevronRight, Link } from "lucide-react";
import { useRouter } from 'next/navigation'
import { CardBox } from '@/features/verify-id-card/components/CardBox';


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
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${step.id === currentStep
                            ? "bg-[#153885] text-white"
                            : "border-2 border-gray-300 bg-white text-gray-400"
                            }`}
                    >
                        {step.id}
                    </div>
                    <p
                        className={`mt-2 text-xs font-semibold transition-all duration-300 ${step.id === currentStep ? "text-black" : "text-gray-500"
                            }`}
                    >
                        {step.title}
                    </p>
                </div>
            ))}
        </div>
    </div>
);

export function VerifyIDCardSection() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-lg ">
                <Stepper currentStep={1} />
                <div className="w-full bg-white rounded-xl shadow-md p-8 ">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#0F2D73]">Verify Your Identity</h1>
                        <p className="mt-2 text-gray-600">
                            Choose one option to verify your ID card
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Scan ID Card */}
                        <CardBox
                            onClick={() => router.push('/scan-id-card')}
                            title="Scan ID Card"
                            description="Use your Camera to scan"
                            icon={Camera}
                        />
                        {/* Upload from device */}
                        <CardBox
                            onClick={() => router.push('/upload-id-card')}
                            title="Upload from device"
                            description="Choose file from your device"
                            icon={UploadCloud}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

