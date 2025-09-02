"use client";
import React, { useMemo } from "react";
import OverlayBanner from "./OverlayBanner";
import { DetectionResult, FaceScanState } from "../configs/type";
import { Step1Validator } from "../utils/validators/step1Validator";
import { Step2Validator } from "../utils/validators/step2Validator";
import { CONFIG } from "../configs/constant";

type Props = {
  state: FaceScanState;
  detectionResults: DetectionResult[];
  visible?: boolean;
};

export default function ScanOverlayHUD({
  state,
  detectionResults,
  visible = true,
}: Props) {
  const message = useMemo(() => {
    if (state.step === 1) {
      const validation = Step1Validator.validateStep1(
        detectionResults,
        CONFIG.DISPLAY.WIDTH,
        CONFIG.DISPLAY.HEIGHT
      );
      return validation.message ?? null;
    } else if (state.step === 2) {
      return Step2Validator.getPhaseInstruction(state.phase as any) ?? null;
    } else if (state.step === 3) {
      return " ";
    }
    return null;
  }, [state, detectionResults]);

  return (
    <>
      <OverlayBanner
        text={message}
        y={120}
        className="translate-y-4"
        visible={visible}
      />
    </>
  );
}
