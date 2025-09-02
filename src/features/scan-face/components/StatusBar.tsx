import React from "react";
import { FaceScanState } from "../configs/type";
import Image from "next/image";

interface StatusBarProps {
  state: FaceScanState;
  step1Valid: boolean;
}

const phaseIcons: Record<string, string> = {
  yaw_left: "/phase-face/head-left.gif",
  yaw_right: "/phase-face/head-right.gif",
  pitch_up: "/phase-face/head-up.gif",
  pitch_down: "/phase-face/head-down.gif",
  blink: "/phase-face/blink.gif",
  mouth: "/phase-face/mouth.gif",
};

export function StatusBar({ state, step1Valid }: StatusBarProps) {
  const phaseIcon = phaseIcons[state.phase];

  const iconSrc = step1Valid
    ? phaseIcons[state.phase]
    : "/phase-face/alert.gif";

  return (
    <div className="relative w-full h-full text-center">
      {iconSrc && (
        <Image
          src={iconSrc}
          alt={state.phase}
          width={100}
          height={100}
          className="inline-block mt-6 mb-2"
          unoptimized
        />
      )}
    </div>
  );
}
