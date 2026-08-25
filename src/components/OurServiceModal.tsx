"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./Button";
import { useLocale } from "@/lib/locale";

type OurServiceModalProps = {
  open: boolean;
  onClose: () => void;
};

function getTypingState(
  scrollProgress: number,
  locale: "en" | "ko",
  fullText: string,
) {
  const TYPE_START = locale === "ko" ? 0.22 : 0.12;
  const typeProgress = Math.max(
    0,
    Math.min(1, (scrollProgress - TYPE_START) / (1 - TYPE_START)),
  );
  const visibleCount =
    typeProgress >= 0.985
      ? fullText.length
      : Math.floor(typeProgress * fullText.length);

  return { TYPE_START, typeProgress, visibleCount };
}

const SCROLL_SOUND_IDLE_MS = 160;
const TYPEWRITER_VOLUME = 0.45;

let typewriterBytesPromise: Promise<ArrayBuffer> | null = null;

function getTypewriterBytes() {
  if (!typewriterBytesPromise) {
    typewriterBytesPromise = fetch("/audio/typewriter_machine_trimmed.mp3").then((response) => {
      if (!response.ok) {
        throw new Error("Failed to load typewriter audio");
      }
      return response.arrayBuffer();
    });
  }
  return typewriterBytesPromise;
}

if (typeof window !== "undefined") {
  getTypewriterBytes();
}

export function OurServiceModal({ open, onClose }: OurServiceModalProps) {
  const { t, locale } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wantSoundRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const fullText = useMemo(
    () => [t.ourServiceTitle, t.ourServiceIntro, ...t.ourServiceBody].join("\n\n"),
    [t.ourServiceTitle, t.ourServiceIntro, t.ourServiceBody],
  );

  const stopSource = () => {
    const source = sourceRef.current;
    if (!source) {
      return;
    }
    try {
      source.stop();
    } catch {
      // Already stopped.
    }
    source.disconnect();
    sourceRef.current = null;
  };

  const startSource = () => {
    const ctx = audioCtxRef.current;
    const buffer = bufferRef.current;
    const gain = gainRef.current;
    if (!ctx || !buffer || !gain || sourceRef.current) {
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    source.start();
    sourceRef.current = source;
  };

  const stopTypewriterSound = () => {
    wantSoundRef.current = false;
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    stopSource();
  };

  const pulseTypewriterSound = () => {
    wantSoundRef.current = true;
    const ctx = audioCtxRef.current;
    if (ctx?.state === "suspended") {
      void ctx.resume().then(() => {
        if (wantSoundRef.current && bufferRef.current) {
          startSource();
        }
      });
    } else if (bufferRef.current) {
      startSource();
    }

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      wantSoundRef.current = false;
      stopSource();
      idleTimerRef.current = null;
    }, SCROLL_SOUND_IDLE_MS);
  };

  useEffect(() => {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const ctx = new AudioContextClass();
    const gain = ctx.createGain();
    gain.gain.value = TYPEWRITER_VOLUME;
    gain.connect(ctx.destination);
    audioCtxRef.current = ctx;
    gainRef.current = gain;

    let cancelled = false;
    void getTypewriterBytes()
      .then((bytes) => ctx.decodeAudioData(bytes.slice(0)))
      .then((buffer) => {
        if (cancelled) {
          return;
        }
        bufferRef.current = buffer;
        if (wantSoundRef.current) {
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          source.connect(gain);
          source.start();
          sourceRef.current = source;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      const source = sourceRef.current;
      if (source) {
        try {
          source.stop();
        } catch {
          // Already stopped.
        }
        source.disconnect();
        sourceRef.current = null;
      }
      void ctx.close();
      audioCtxRef.current = null;
      bufferRef.current = null;
      gainRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setScrollProgress(0);
      lastScrollTopRef.current = 0;
      stopTypewriterSound();
      return;
    }

    // Unlock audio from the click that opened the modal (scroll itself is not a gesture).
    void audioCtxRef.current?.resume();

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
      stopTypewriterSound();
    };
  }, [open, onClose]);

  // Replay typing if language changes while the modal is open
  useEffect(() => {
    if (!open) {
      return;
    }
    setScrollProgress(0);
    lastScrollTopRef.current = 0;
    scrollRef.current?.scrollTo({ top: 0 });
    stopTypewriterSound();
  }, [locale, open]);

  const { typeProgress, visibleCount } = getTypingState(
    scrollProgress,
    locale,
    fullText,
  );

  // Same scrollProgress drives panel rise + typed characters.
  const PINK_START_Y = 55;
  // Extra How It Works copy made the letter taller — rise so the sign-off
  // clears the typewriter. Tune per locale (KO letter is shorter).
  const PINK_END_Y = locale === "ko" ? -40 : -50;
  const pinkOffsetY =
    PINK_START_Y + (PINK_END_Y - PINK_START_Y) * scrollProgress;

  const visibleText = fullText.slice(0, visibleCount);
  const paragraphs = visibleText.length > 0 ? visibleText.split("\n\n") : [];
  const showCaret = typeProgress > 0 && typeProgress < 1;
  const letterFontFamily =
    locale === "ko"
      ? '"Gowun Batang", Batang, serif'
      : '"Traveling Typewriter", "Alike Angular", ui-monospace, monospace';

  if (!open) {
    return null;
  }

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
          const progress =
            maxScroll > 0
              ? Math.min(1, Math.max(0, el.scrollTop / maxScroll))
              : 0;
          setScrollProgress(progress);

          const scrollingDown = el.scrollTop > lastScrollTopRef.current;
          lastScrollTopRef.current = el.scrollTop;

          const { typeProgress: nextTypeProgress } = getTypingState(
            progress,
            locale,
            fullText,
          );
          if (scrollingDown && nextTypeProgress > 0) {
            pulseTypewriterSound();
          } else {
            stopTypewriterSound();
          }
        }}
      >
        {/* Tall track = slower typing per scroll distance (keeps type + rise in sync) */}
        <div className="relative h-[440vh]">
          <div className="sticky top-0 h-dvh overflow-hidden">
            <div
              className="absolute top-1/2 left-1/2 z-[5] w-[min(92vw,40rem)] overflow-hidden rounded-sm px-16 py-6 pb-16 shadow-sm sm:px-16 sm:py-10 sm:pb-22"
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
                                ? "mt-6 text-sm leading-relaxed text-neutral-700"
                                : "mt-5 text-sm leading-relaxed text-neutral-700"
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
                                ? "mt-6 text-sm leading-relaxed text-neutral-700"
                                : "mt-5 text-sm leading-relaxed text-neutral-700"
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
              <div className="relative w-[min(92vw,56rem)] translate-y-[0%]">
                <Image
                  src="/images/type_3.png"
                  alt=""
                  aria-hidden
                  width={3016}
                  height={1282}
                  priority
                  className="h-auto w-full max-w-none"
                  sizes="(max-width: 768px) 92vw, 56rem"
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute right-[7%] top-[75%] z-20 h-auto w-[7.5%] cursor-pointer border-0 bg-transparent p-0 pointer-events-auto transition-transform duration-150 ease-out hover:-translate-y-2 active:-translate-y-3"
                >
                  <Image
                    src="/images/type_button.png"
                    alt=""
                    aria-hidden
                    width={164}
                    height={262}
                    priority
                    className="h-auto w-full"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
