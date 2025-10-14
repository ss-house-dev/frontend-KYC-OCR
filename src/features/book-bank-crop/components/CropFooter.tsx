"use client";

import { Button } from "@/components/ui/button";

export default function CropFooter({
  onRetake,
  onConfirm,
}: {
  onRetake: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="p-4 flex gap-3 border-t bg-white">
      <Button
        variant="outline"
        className="flex-1 border-[#2152b6]/40 text-[#2152b6]"
        onClick={onRetake}
      >
        Retry
      </Button>
      <Button className="flex-1 bg-[#2152b6]" onClick={onConfirm}>
        Confirm
      </Button>
    </div>
  );
}
