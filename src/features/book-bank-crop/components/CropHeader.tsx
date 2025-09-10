"use client";

import { Button } from "@/components/ui/button";

export default function CropHeader({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <Button
        variant="ghost"
        className="px-2"
        onClick={onBack}
        aria-label="Back"
      >
        ←
      </Button>
      <h1 className="text-lg font-semibold mx-auto">{title}</h1>
      <div className="w-5" />
    </div>
  );
}
