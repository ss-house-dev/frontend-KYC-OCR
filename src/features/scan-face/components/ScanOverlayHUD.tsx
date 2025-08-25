"use client";
import React, { useMemo } from "react";
import OverlayBanner from "./OverlayBanner";
import { DetectionResult, FaceScanState } from "../configs/type";
import { Step1Validator } from "../utils/validators/step1Validator";
import { Step2Validator } from "../utils/validators/step2Validator";
import { CONFIG } from "../configs/constant";

type Props = {
  state: FaceScanState;
  detection: DetectionResult;
  visible?: boolean;
};

export default function ScanOverlayHUD({
  state,
  detection,
  visible = true,
}: Props) {
  const { topMsg, midMsg, bottomMsg } = useMemo(() => {
    let topMsg: string | null = null;
    let midMsg: string | null = null;
    let bottomMsg: string | null = null;

    if (state.step === 1) {
      const faceCount = detection.landmarks ? 1 : 0;
      const validation = Step1Validator.validateStep1(
        faceCount,
        detection.brightness,
        detection.bbox,
        CONFIG.DISPLAY.WIDTH,
        CONFIG.DISPLAY.HEIGHT
      );
      topMsg = validation.message ?? null;
    } else if (state.step === 2) {
      midMsg = Step2Validator.getPhaseInstruction(state.phase as any) ?? null;
    } else if (state.step === 3) {
      topMsg = "DONE";
    }
    return { topMsg, midMsg, bottomMsg };
  }, [state, detection]);

  return (
    <>
      <OverlayBanner
        text={topMsg}
        y={80}
        className="translate-y-8"
        visible={visible}
      />
      <OverlayBanner
        text={midMsg}
        y={120}
        className="translate-y-8"
        visible={visible}
      />
      <OverlayBanner
        text={bottomMsg}
        y={150}
        className="translate-y-8"
        visible={visible}
      />
    </>
  );
}
