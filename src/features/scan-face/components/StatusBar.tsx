import React from "react";
import { FaceScanState } from "../configs/type";
import Image from "next/image";

interface StatusBarProps {
  state: FaceScanState;
}

const phaseIcons: Record<string, string> = {
  yaw_left: "/phase-face/left-right.gif",
  yaw_right: "/phase-face/left-right.gif",
  pitch_up: "/phase-face/up-down.gif",
  pitch_down: "/phase-face/up-down.gif",
  blink: "/phase-face/blink.gif",
  mouth: "/phase-face/mouth.gif",
};

export function StatusBar({ state }: StatusBarProps) {
  const phaseIcon = phaseIcons[state.phase];
  return (
    <div className="relative w-full h-full text-center">
      {phaseIcon && (
        <Image
          src={phaseIcon}
          alt={state.phase}
          width={100}
          height={100}
          className="inline-block mt-4 mb-2"
          unoptimized
        />
      )}

      {/* STEP: <b>{state.step}</b> &nbsp;|&nbsp; PHASE:
      <b>{state.phase}</b> &nbsp;|&nbsp; FPS: <b>{state.fps}</b> */}
    </div>
  );
}
