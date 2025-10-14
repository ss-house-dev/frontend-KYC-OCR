import { Suspense } from "react";
import VerifyFaceView from "@/features/face-accept/components/VerifyFaceView";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyFaceView />
    </Suspense>
  );
}
