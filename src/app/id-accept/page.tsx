import { Suspense } from "react";
import VerifyIdContainer from "@/features/id-accept/containers/VerifyIdContainer";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyIdContainer />
    </Suspense>
  );
}