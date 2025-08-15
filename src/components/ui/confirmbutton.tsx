import React from "react";
import { cn } from "@/lib/utils";

interface ConfirmButtonProps {
  disabled?: boolean;
  onClick?: () => void;
}

export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  disabled,
  onClick,
}) => {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-3 rounded-lg mt-6 transition-colors font-medium",
        disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-black text-white hover:bg-gray-800"
      )}
    >
      Confirm
    </button>
  );
};
