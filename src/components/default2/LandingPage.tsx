"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import { OurServiceModal } from "./OurServiceModal";
import { EnvelopeVisual, PostcardStack } from "./PostcardStack";
import { ENVELOPES, INITIAL_CENTER_INDEX, type Envelope } from "@/data/envelopes";
import { useLocale, type Locale } from "@/lib/locale";
import { preventArtworkContextMenu } from "@/lib/artwork-protection";

const FEATURED_INDEX = Math.max(INITIAL_CENTER_INDEX, 0);
const SIDE_HEIGHT = "var(--envelope-side-height)";
const ROW_GAP = "0.4rem";
const CAROUSEL_LOOP_COPIES = 3;
const CAROUSEL_CENTER_COPY = 1;

const LANDING_COPY: Record<
  Locale,
  { intro: string; limit: string; scrollDown: string; skipToMain: string }
> = {
  en: {
    intro:
      "This letter first started in England and gave luck to the recipients around the world. This inspired GREETINGS FOLKs to start an online letter service.",
    limit:
      "Only 40 letters are sent each day, and anyone can send one free of charge. Once sent, a letter cannot be cancelled and can only be opened by its recipient.",
    scrollDown: "scroll down",
    skipToMain: "skip to main content",
  },
  ko: {
    intro:
      "이 편지는 영국에서 최초로 시작되어 일 년에 한 바퀴를 돌면서 받는 사람에게 행운을 전하던 행운의 편지 이야기에서 영감을 받아 시작한 GREETINGS FOLKs의 온라인 편지 서비스입니다.",
    limit:
      "매일 단 40통만 전해지는 특별한 편지이며 누구나 무료로 편지를 쓰고 보낼 수 있습니다. 한 번 보낸 편지는 취소할 수 없으며, 오직 받는 사람만 열어 읽을 수 있습니다.",
    scrollDown: "아래로 스크롤",
    skipToMain: "메인 컨텐츠로 바로가기",
  },
};

function envelopeKey(envelope: Envelope) {
  return envelope.src ?? envelope.layers?.[0].src ?? envelope.alt;
}

function wrapEnvelopeIndex(index: number) {
  return ((index % ENVELOPES.length) + ENVELOPES.length) % ENVELOPES.length;
}

function envelopeWidth(envelope: Envelope) {
  return `(${SIDE_HEIGHT} * ${envelope.width} / ${envelope.height})`;
}

function activeEnvelopeOffset(activeIndex: number) {
  const offsetParts: string[] = [];

  for (let index = 0; index < activeIndex; index += 1) {
    offsetParts.push(envelopeWidth(ENVELOPES[wrapEnvelopeIndex(index)]));
  }

  for (let index = 0; index < activeIndex; index += 1) {
    offsetParts.push(ROW_GAP);
  }

  offsetParts.push(`${envelopeWidth(ENVELOPES[wrapEnvelopeIndex(activeIndex)])} / 2`);

  return `calc(${offsetParts.join(" + ")})`;
}

const TYPE_PAUSE_AFTER = [
  "in England ",
  "world.",
  "day, ",
  "charge.",
  "sent, ",
  "돌면서",
  "시작한",
  "서비스입니다.",
  "편지이며",
  "수 있습니다.",
  "없으며,",
] as const;
const TYPE_MS = 60;
const TYPE_SPACE_MS = 12;
const TYPE_BREAK_MS = 360;
const TYPE_COMMA_PAUSE_MS = 1000;
const TYPE_END_PAUSE_MS = 1000;
const TYPEWRITER_AUDIO_SRC = "/audio/typewriter_machine_trimmed.mp3";
const TYPEWRITER_AUDIO_VOLUME = 0.45;

function typeDelay(full: string, index: number) {
  const typed = full.slice(0, index);
  if (TYPE_PAUSE_AFTER.some((phrase) => typed.endsWith(phrase))) {
    return TYPE_COMMA_PAUSE_MS;
  }

  if (full[index] === "\n") {
    return TYPE_BREAK_MS;
  }

  if (full[index] === " ") {
    return TYPE_SPACE_MS;
  }

  return TYPE_MS;
}

function TypewriterCopy({
  intro,
  limit,
  active,
  skip = false,
  onDone,
}: {
  intro: string;
  limit: string;
  active: boolean;
  skip?: boolean;
  onDone: () => void;
}) {
  const full = `${intro}\n${limit}`;
  const [index, setIndex] = useState(skip ? full.length : 0);
  const doneRef = useRef(skip);
  const onDoneRef = useRef(onDone);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundWantedRef = useRef(false);
  onDoneRef.current = onDone;

  const stopTypewriterSound = () => {
    soundWantedRef.current = false;
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = 0;
    audio.pause();
  };

  const duckTypewriterSound = () => {
    soundWantedRef.current = false;
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = 0;
  };

  const playTypewriterSound = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    soundWantedRef.current = true;
    audio.volume = TYPEWRITER_AUDIO_VOLUME;
    void audio.play().catch(() => {});
  };

  useEffect(() => {
    const audio = new Audio(TYPEWRITER_AUDIO_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audioRef.current = audio;

    const unlock = () => {
      audio.volume = soundWantedRef.current ? TYPEWRITER_AUDIO_VOLUME : 0;
      void audio
        .play()
        .then(() => {
          if (!soundWantedRef.current) {
            audio.volume = 0;
          }
        })
        .catch(() => {});
    };

    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);

    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      soundWantedRef.current = false;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (skip) {
      stopTypewriterSound();
      setIndex(full.length);
      doneRef.current = true;
      return;
    }

    doneRef.current = false;
    setIndex(0);
  }, [full, skip]);

  useEffect(() => {
    if (skip || !active) {
      stopTypewriterSound();
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stopTypewriterSound();
      setIndex(full.length);
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current();
      }
      return;
    }

    if (index >= full.length) {
      stopTypewriterSound();
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current();
      }
      return;
    }

    const delay = typeDelay(full, index);
    if (delay >= TYPE_BREAK_MS) {
      duckTypewriterSound();
    } else {
      playTypewriterSound();
    }

    const timerId = window.setTimeout(() => {
      setIndex((current) => current + 1);
    }, delay);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [active, full, index, skip]);

  const introLength = intro.length;
  const introTyped = intro.slice(0, Math.min(index, introLength));
  const limitTyped = index <= introLength ? "" : full.slice(introLength + 1, index);
  const cursorOnIntro = index <= introLength;

  return (
    <>
      <p className="sr-only">
        {intro} {limit}
      </p>
      <p className="font-meta max-w-xl text-lg leading-relaxed text-neutral-700" aria-hidden>
        {introTyped}
        {cursorOnIntro ? <span className="default2-type-cursor" /> : null}
      </p>
      {cursorOnIntro ? null : (
        <p className="font-meta mt-8 max-w-xl text-lg leading-relaxed text-neutral-700" aria-hidden>
          {limitTyped}
          <span className="default2-type-cursor" />
        </p>
      )}
    </>
  );
}

const SCROLL_DOWN_LOOPS = 3;

function ScrollDownLetters({
  text,
  active,
}: {
  text: string;
  active: boolean;
}) {
  const [count, setCount] = useState(0);
  const [loop, setLoop] = useState(0);

  useEffect(() => {
    setCount(0);
    setLoop(0);
  }, [text]);

  useEffect(() => {
    if (!active) {
      setCount(0);
      setLoop(0);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      return;
    }

    if (count < text.length) {
      const timerId = window.setTimeout(() => {
        setCount((current) => current + 1);
      }, 90);
      return () => {
        window.clearTimeout(timerId);
      };
    }

    if (loop + 1 >= SCROLL_DOWN_LOOPS) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setCount(0);
      setLoop((current) => current + 1);
    }, 1100);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [active, count, loop, text]);

  return (
    <span className="relative inline-block">
      <span className="invisible" aria-hidden>
        {text}
      </span>
      <span className="absolute inset-x-0 top-0 whitespace-pre">{text.slice(0, count)}</span>
    </span>
  );
}

function EnvelopePeek({ activeIndex }: { activeIndex: number }) {
  const activeOffset = activeEnvelopeOffset(activeIndex);

  return (
    <div
      className="absolute left-1/2 top-0 flex items-start"
      style={{
        gap: ROW_GAP,
        transform: `translateX(calc(-1 * ${activeOffset}))`,
      }}
    >
      {Array.from({ length: ENVELOPES.length * CAROUSEL_LOOP_COPIES }, (_, index) => {
        const envelope = ENVELOPES[wrapEnvelopeIndex(index)];
        const isActive = index === activeIndex;

        return (
          <div
            key={`${index}-${envelopeKey(envelope)}`}
            className="relative shrink-0"
            style={{
              height: SIDE_HEIGHT,
              zIndex: isActive ? 20 : 10,
            }}
          >
            <EnvelopeVisual
              envelope={envelope}
              priority={isActive}
              eager={
                index === activeIndex - 1 ||
                index === activeIndex ||
                index === activeIndex + 1
              }
              isCarouselActive={false}
              peekFromTop
            />
          </div>
        );
      })}
    </div>
  );
}

function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`flex items-center justify-center gap-2 ${className}`.trim()}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        className={`font-display cursor-pointer text-base tracking-[0.05em] uppercase transition-colors ${
          locale === "ko"
            ? "font-normal text-[#ec0000]"
            : "font-normal text-neutral-900 hover:text-red-600"
        }`}
        aria-pressed={locale === "ko"}
        onClick={() => setLocale("ko")}
      >
        한국어
      </button>
      <span aria-hidden className="text-base text-neutral-400">
        /
      </span>
      <button
        type="button"
        className={`font-display cursor-pointer text-base tracking-[0.05em] uppercase transition-colors ${
          locale === "en"
            ? "font-normal text-[#ec0000]"
            : "font-normal text-neutral-900 hover:text-red-600"
        }`}
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}

export function LandingPage() {
  const { locale, t } = useLocale();
  const copy = LANDING_COPY[locale];
  const rootRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [gallery, setGallery] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [playIntro, setPlayIntro] = useState(true);
  const [startType, setStartType] = useState(false);
  const [typedDone, setTypedDone] = useState(false);
  const [showChrome, setShowChrome] = useState(false);
  const peekIndex = ENVELOPES.length * CAROUSEL_CENTER_COPY + FEATURED_INDEX;

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setStartType(true);
    }, 200);

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  const skipToMain = () => {
    setStartType(true);
    setTypedDone(true);
    setShowChrome(true);
    setPlayIntro(false);
  };

  useEffect(() => {
    if (!typedDone || showChrome) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setShowChrome(true);
    }, TYPE_END_PAUSE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [showChrome, typedDone]);

  useEffect(() => {
    if (!showChrome) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setPlayIntro(false);
    }, 900);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [showChrome]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const scrollerEl = root.closest("[data-default2-scroll]");
    const scroller = scrollerEl instanceof HTMLElement ? scrollerEl : null;

    const readProgress = () => {
      if (scroller) {
        const viewport = scroller.clientHeight;
        if (viewport <= 0) {
          return 0;
        }

        return Math.min(Math.max(scroller.scrollTop / viewport, 0), 1);
      }

      const scrollable = root.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        return 0;
      }

      const scrolled = Math.min(
        Math.max(-root.getBoundingClientRect().top, 0),
        scrollable,
      );
      return scrolled / scrollable;
    };

    const onScroll = () => {
      const next = readProgress();
      setProgress((current) => (Math.abs(current - next) < 0.0005 ? current : next));
    };

    onScroll();
    const target: EventTarget = scroller ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (progress > 0.3) {
      setGallery(true);
    } else if (progress < 0.18) {
      setGallery(false);
    }
  }, [progress]);

  const envelopePeek = 12 + progress * 30;

  const scrollToGallery = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const root = rootRef.current;
    const scroller = root?.closest("[data-default2-scroll]");
    if (scroller instanceof HTMLElement) {
      scroller.scrollTo({ top: scroller.clientHeight, behavior: "smooth" });
      return;
    }
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <div
      ref={rootRef}
      className="default2-landing relative bg-white"
      onContextMenu={preventArtworkContextMenu}
    >
      <div className="h-dvh snap-start snap-always" aria-hidden />
      <div className="h-dvh snap-start snap-always" aria-hidden />

      <div className="absolute inset-0">
        <div className="sticky top-0 flex h-dvh flex-col overflow-hidden touch-pan-y overscroll-x-none">
        <header
          className={`relative flex w-full shrink-0 items-center justify-between overflow-hidden px-6 transition-[opacity,max-height,padding] duration-500 sm:px-8 md:px-10 lg:px-10 xl:px-12 2xl:px-16 ${
            gallery
              ? "pointer-events-none max-h-0 py-0 opacity-0"
              : `max-h-32 py-10 sm:py-12 ${playIntro ? "" : "opacity-100"}`
          } ${
            playIntro && !gallery
              ? showChrome
                ? "default2-intro-nav"
                : "default2-intro-nav-wait"
              : ""
          }`}
          aria-hidden={gallery}
        >
          <Button variant="nav" weight="normal" onClick={() => setServiceOpen(true)}>
            {t.ourService}
          </Button>

          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Image
              src="/images/GF_Logotype_Stamp.png"
              alt="Greetings Folks"
              width={2157}
              height={185}
              priority
              className="h-7 w-auto max-w-[min(40vw,28rem)] object-contain mix-blend-multiply sm:h-8"
            />
          </div>

          <LanguageSwitcher />
        </header>

        {gallery ? (
          <PostcardStack embedded />
        ) : (
          <>
            <div className="relative mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col items-center px-8 text-center">
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
                <TypewriterCopy
                  intro={copy.intro}
                  limit={copy.limit}
                  active={startType}
                  skip={!playIntro}
                  onDone={() => setTypedDone(true)}
                />
              </div>
              <div
                className={`mb-3 flex shrink-0 flex-col items-center gap-3 transition-opacity duration-500 sm:mb-4 ${
                  playIntro || showChrome
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                <button
                  type="button"
                  onClick={showChrome ? scrollToGallery : skipToMain}
                  aria-label={showChrome ? copy.scrollDown : copy.skipToMain}
                  className="flex cursor-pointer items-center text-sm text-neutral-700"
                >
                  {showChrome ? (
                    <ScrollDownLetters text={copy.scrollDown} active={showChrome} />
                  ) : (
                    copy.skipToMain
                  )}
                </button>
                {playIntro && !showChrome ? <LanguageSwitcher /> : null}
              </div>
            </div>

            <div
              className={`relative mt-auto min-h-[12vh] w-full shrink-0 overflow-hidden pointer-events-none ${
                showChrome
                  ? playIntro
                    ? "default2-intro-envelopes"
                    : ""
                  : "opacity-0"
              }`}
              style={{ height: `${envelopePeek}vh` }}
            >
              <EnvelopePeek activeIndex={peekIndex} />
            </div>
          </>
        )}
        </div>
      </div>

      <OurServiceModal open={serviceOpen} onClose={() => setServiceOpen(false)} />
    </div>
  );
}
