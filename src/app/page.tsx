"use client";

import { Footer } from "@/components/default2/Footer";
import { LandingPage } from "@/components/default2/LandingPage";
import { LocaleProvider } from "@/lib/locale";

export default function Home() {
  return (
    <LocaleProvider defaultLocale="ko">
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
    </LocaleProvider>
  );
}
