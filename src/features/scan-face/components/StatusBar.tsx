import React from "react";
import { FaceScanState } from "../configs/type";

interface StatusBarProps {
  state: FaceScanState;
}

export function StatusBar({ state }: StatusBarProps) {
  return (
    <div className="text-sm opacity-80 text-center">
      STEP: <b>{state.step}</b> &nbsp;|&nbsp; PHASE: <b>{state.phase}</b>{" "}
      &nbsp;|&nbsp; FPS: <b>{state.fps}</b>
    </div>
  );
}
