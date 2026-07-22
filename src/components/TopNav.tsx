"use client";

import Image from "next/image";
import { Button } from "./Button";
import { useLocale, type Locale } from "@/lib/locale";

export function TopNav() {
  const { locale, setLocale, t } = useLocale();

  const localeButtonClass = (value: Locale) =>
    `font-display cursor-pointer text-sm tracking-[0.05em] uppercase transition-colors ${
      locale === value
        ? "font-normal text-[#ec0000]"
        : "font-normal text-neutral-900 hover:text-red-600"
    }`;

  return (
    <header className="sticky top-0 z-50 shrink-0 bg-[#F3F9F9]">
      <nav className="relative mx-auto flex h-24 max-w-6xl items-center justify-between px-6">
        <Button variant="nav" weight="normal" href="#">
          {t.ourService}
        </Button>
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="Language"
        >
          <button
            type="button"
            className={localeButtonClass("en")}
            aria-pressed={locale === "en"}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
          <span aria-hidden className="text-sm text-neutral-400">
            /
          </span>
          <button
            type="button"
            className={localeButtonClass("ko")}
            aria-pressed={locale === "ko"}
            onClick={() => setLocale("ko")}
          >
            KR
          </button>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Image
            src="/images/logo.webp"
            alt="Greetings Folks"
            width={484}
            height={182}
            className="pointer-events-auto h-16 w-auto"
            priority
          />
        </div>
      </nav>
    </header>
  );
}
