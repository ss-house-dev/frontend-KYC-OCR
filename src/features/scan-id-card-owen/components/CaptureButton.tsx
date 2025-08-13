import * as React from 'react';

interface CaptureButtonProps {
    onClick: () => void;
    isReady: boolean;
}

export function CaptureButton({ onClick, isReady }: CaptureButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={!isReady}
            className={`absolute -bottom-44 left-1/2 -translate-x-1/2
                  w-14 h-14 rounded-full border-4 border-gray-300 shadow-lg
                  transition-all duration-300
                  ${isReady
                    ? "bg-white opacity-100 blur-0 cursor-pointer" 
                    : "bg-white/60 cursor-not-allowed"          
                }`}
        />
    );
}