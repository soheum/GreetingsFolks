import { Footer } from "@/components/default2/Footer";
import { LandingPage } from "@/components/default2/LandingPage";

export default function Default2Home() {
  return (
    <div
      data-default2-scroll
      className="h-dvh overflow-y-auto overflow-x-hidden snap-y snap-mandatory overscroll-y-contain"
    >
      <main className="bg-white">
        <LandingPage />
      </main>
      <div className="snap-start snap-always">
        <Footer />
      </div>
    </div>
  );
}
