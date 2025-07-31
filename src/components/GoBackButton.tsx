
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonHeaderProps {
  onClick: () => void;
}

export function BackButtonHeader({ onClick }: BackButtonHeaderProps) {

  return (
    <header className="p-4">
      <Button
        onClick={onClick}
        variant="ghost"
        size="icon"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>
    </header>
  );
}