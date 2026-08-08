"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { Button } from "./Button";
import { OurServiceModal } from "./OurServiceModal";
import { useLocale, type Locale } from "@/lib/locale";

export function TopNav() {
  const { locale, setLocale, t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const openService = () => {
    setMenuOpen(false);
    setServiceOpen(true);
  };

  const localeButtonClass = (value: Locale) =>
    `font-display cursor-pointer text-sm tracking-[0.05em] uppercase transition-colors ${
      locale === value
        ? "font-normal text-[#ec0000]"
        : "font-normal text-neutral-900 hover:text-red-600"
    }`;

  const renderLanguageSwitcher = (closeOnSelect = false) => (
    <div className="flex items-center gap-2" role="group" aria-label="Language">
      <button
        type="button"
        className={localeButtonClass("en")}
        aria-pressed={locale === "en"}
        onClick={() => {
          setLocale("en");
          if (closeOnSelect) {
            setMenuOpen(false);
          }
        }}
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
        onClick={() => {
          setLocale("ko");
          if (closeOnSelect) {
            setMenuOpen(false);
          }
        }}
      >
        KR
      </button>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-50 shrink-0 bg-[#F3F9F9] px-6 sm:px-8 md:px-10 lg:px-10 xl:px-12 2xl:px-16">
        <nav className="relative mx-auto flex h-24 max-w-full items-center justify-between sm:h-24 md:h-24 lg:h-24 xl:h-32 2xl:h-36">
          {/* Desktop: OUR SERVICE (left) */}
          <div className="hidden md:block">
            <Button variant="nav" weight="normal" onClick={openService}>
              {t.ourService}
            </Button>
          </div>

          {/* Mobile: spacer so logo stays centered */}
          <div className="w-10 md:hidden" aria-hidden />

          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Image
              src="/images/logo.webp"
              alt="Greetings Folks"
              width={484}
              height={182}
              className="pointer-events-auto h-12 w-auto sm:h-14 md:h-14 lg:h-14 xl:h-20 2xl:h-24"
              priority
            />
          </div>

          {/* Desktop: language (right) */}
          <div className="hidden md:block">{renderLanguageSwitcher()}</div>

          {/* Mobile: hamburger (right) */}
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Image
              src="/Hamburger.svg"
              alt=""
              aria-hidden
              width={24}
              height={24}
              className="h-6 w-6"
            />
          </button>
        </nav>

        {/* Mobile menu overlay */}
        {menuOpen ? (
          <div
            id={menuId}
            className="fixed inset-0 z-50 flex flex-col bg-white md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex h-24 shrink-0 items-center justify-between px-6">
              <div className="w-10" aria-hidden />
              <Image
                src="/images/logo.webp"
                alt="Greetings Folks"
                width={484}
                height={182}
                className="h-12 w-auto"
                priority
              />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <Image
                  src="/Hamburger.svg"
                  alt=""
                  aria-hidden
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </button>
            </div>
            <div className="flex flex-1 flex-col items-start gap-8 px-6 pb-10 pt-8">
              <Button
                variant="nav"
                weight="normal"
                className="justify-start"
                onClick={openService}
              >
                {t.ourService}
              </Button>
              {renderLanguageSwitcher(true)}
            </div>
          </div>
        ) : null}
      </header>

      <OurServiceModal
        open={serviceOpen}
        onClose={() => setServiceOpen(false)}
      />
    </>
  );
}
