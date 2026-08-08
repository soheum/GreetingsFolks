"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./Button";
import { useLocale } from "@/lib/locale";

type OurServiceModalProps = {
  open: boolean;
  onClose: () => void;
};

export function OurServiceModal({ open, onClose }: OurServiceModalProps) {
  const { t, locale } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const fullText = useMemo(
    () => [t.ourServiceTitle, t.ourServiceIntro, ...t.ourServiceBody].join("\n\n"),
    [t.ourServiceTitle, t.ourServiceIntro, t.ourServiceBody],
  );

  useEffect(() => {
    if (!open) {
      setScrollProgress(0);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  // Same scrollProgress drives panel rise + typed characters.
  // Korean copy is longer, so the letter needs to finish higher.
  const PINK_START_Y = 55;
  const PINK_END_Y = locale === "ko" ? -25 : -35;
  const pinkOffsetY =
    PINK_START_Y + (PINK_END_Y - PINK_START_Y) * scrollProgress;

  // First portion of scroll only raises the paper (still mostly behind the image).
  // Typing starts after that so it isn't "used up" while the letter is off-screen.
  const TYPE_START = 0.05;
  const typeProgress = Math.max(
    0,
    Math.min(1, (scrollProgress - TYPE_START) / (1 - TYPE_START)),
  );
  const visibleCount = Math.floor(typeProgress * fullText.length);
  const visibleText = fullText.slice(0, visibleCount);
  const paragraphs = visibleText.length > 0 ? visibleText.split("\n\n") : [];
  const showCaret = typeProgress > 0 && typeProgress < 1;
  const letterFontFamily =
    locale === "ko"
      ? '"Gowun Batang", Batang, serif'
      : '"Traveling Typewriter", "Alike Angular", ui-monospace, monospace';

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#F3F9F9]"
      role="dialog"
      aria-modal="true"
      aria-label={t.ourService}
      onWheel={(event) => event.stopPropagation()}
    >
      <Button
        variant="outline"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-30 !min-w-0 size-10 !px-4 py-2.5 text-black sm:top-6 sm:right-6 md:top-8 md:right-8"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-black"
        >
          <path
            fill="currentColor"
            d="M6.23 5.17a.75.75 0 0 1 1.06 0L12 9.88l4.71-4.71a.75.75 0 1 1 1.06 1.06L13.06 10.94l4.71 4.71a.75.75 0 1 1-1.06 1.06L12 12l-4.71 4.71a.75.75 0 0 1-1.06-1.06l4.71-4.71-4.71-4.71a.75.75 0 0 1 0-1.06Z"
          />
        </svg>
      </Button>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        onScroll={(event) => {
          const el = event.currentTarget;
          const maxScroll = el.scrollHeight - el.clientHeight;
          setScrollProgress(
            maxScroll > 0 ? Math.min(1, Math.max(0, el.scrollTop / maxScroll)) : 0,
          );
        }}
      >
        {/* Tall track = slower typing per scroll distance (keeps type + rise in sync) */}
        <div className="relative h-[320vh]">
          <div className="sticky top-0 h-dvh overflow-hidden">
            <div
              className="absolute top-1/2 left-1/2 z-[5] w-[min(92vw,40rem)] overflow-hidden rounded-sm px-8 py-10 shadow-sm sm:px-10 sm:py-12"
              style={{
                transform: `translate(-50%, calc(-50% + ${pinkOffsetY}vh))`,
                fontFamily: letterFontFamily,
              }}
            >
              <Image
                src="/images/view_details.png"
                alt=""
                aria-hidden
                fill
                className="pointer-events-none object-cover"
                sizes="(max-width: 640px) 92vw, 40rem"
              />
              <div className="relative z-10">
                <div className="mb-6 flex justify-center">
                  <Image
                    src="/images/logo.webp"
                    alt="Greetings Folks"
                    width={484}
                    height={182}
                    className="h-auto w-36 sm:w-44"
                    priority
                  />
                </div>
                <p className="sr-only">
                  {t.ourServiceTitle} {t.ourServiceIntro}{" "}
                  {t.ourServiceBody.join(" ")}
                </p>
                {/* Left-aligned typewriter: ghost reserves final height so glyphs don't shift */}
                <div className="relative text-left" style={{ fontFamily: letterFontFamily }}>
                  <div className="invisible" aria-hidden>
                    {[t.ourServiceTitle, t.ourServiceIntro, ...t.ourServiceBody].map(
                      (paragraph, index) => (
                        <p
                          key={index}
                          style={{ fontFamily: letterFontFamily }}
                          className={
                            index === 0
                              ? "text-sm font-normal text-neutral-900"
                              : index === 1
                                ? "mt-4 text-sm leading-relaxed text-neutral-700"
                                : "mt-3 text-sm leading-relaxed text-neutral-700"
                          }
                        >
                          {paragraph}
                        </p>
                      ),
                    )}
                  </div>
                  <div className="absolute inset-0" aria-hidden={showCaret}>
                    {paragraphs.map((paragraph, index) => {
                      const isLast = index === paragraphs.length - 1;

                      return (
                        <p
                          key={index}
                          style={{ fontFamily: letterFontFamily }}
                          className={
                            index === 0
                              ? "text-sm font-normal text-neutral-900"
                              : index === 1
                                ? "mt-4 text-sm leading-relaxed text-neutral-700"
                                : "mt-3 text-sm leading-relaxed text-neutral-700"
                          }
                        >
                          {paragraph}
                          {isLast && showCaret ? (
                            <span
                              aria-hidden
                              className="ml-0.5 inline-block animate-pulse text-neutral-500"
                            >
                              |
                            </span>
                          ) : null}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center overflow-hidden">
              <Image
                src="/images/type_3.png"
                alt=""
                aria-hidden
                width={3016}
                height={1282}
                priority
                className="h-auto w-[min(92vw,56rem)] max-w-none translate-y-[22%]"
                sizes="(max-width: 768px) 92vw, 56rem"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
