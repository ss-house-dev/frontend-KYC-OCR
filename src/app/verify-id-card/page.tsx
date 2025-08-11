import { VerifyIdentityPage } from "@/components/VerifyIdentityPage";
import { VerifyIDCardSection } from "@/features/verify-id-card/containers/VerifyIDCardSection";

export default function Home() {
  return (
    <main >
      {/* <VerifyIdentityPage /> */}
      <VerifyIDCardSection />
    </main>
  );
}