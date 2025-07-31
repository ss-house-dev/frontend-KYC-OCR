import * as React from 'react';
import { Button } from '@/components/ui/button'; // แก้ไข path ให้ถูกต้อง

// กำหนด Type 
interface ConfirmFooterProps {
  onClick: () => void;
  disabled: boolean;
}

// รับ props 
export function ConfirmFooter({ onClick, disabled }: ConfirmFooterProps) {
  return (
    <div className="p-4 mt-auto">
      <Button
        onClick={onClick}
        disabled={disabled}
        className="w-full max-w-md mx-auto flex h-12 text-base bg-gradient-to-b from-[#1F4293] to-[#246AEC] text-white transition-colors duration-200 hover:from-[#1A377A] hover:to-[#1F58C7] disabled:from-gray-500 disabled:to-gray-500 disabled:text-white"
      >
        Confirm
      </Button>
    </div>
  );
}