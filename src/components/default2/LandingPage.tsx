"use client";

import Image from "next/image";
import {
  Fragment,
  useEffect,
  useId,
  useState,
  type CSSProperties,
} from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "../Button";
import { OurServiceModal } from "./OurServiceModal";
import { EnvelopeVisual, PostcardStack } from "./PostcardStack";
import { ENVELOPES, type Envelope } from "@/data/envelopes";
import { useLocale } from "@/lib/locale";
import { preventArtworkContextMenu } from "@/lib/artwork-protection";

const SIDE_HEIGHT = "var(--envelope-side-height)";
const ROW_GAP = "0.4rem";
const MARQUEE_COPIES = 3;
const MARQUEE_SECONDS_PER_ENVELOPE = 16;

function envelopeKey(envelope: Envelope) {
  return envelope.src ?? envelope.layers?.[0].src ?? envelope.alt;
}

function envelopeWidth(envelope: Envelope) {
  return `(${SIDE_HEIGHT} * ${envelope.width} / ${envelope.height})`;
}

/** Width of one full set of envelopes, including the gap after each one. */
function envelopeSetWidth() {
  const parts = ENVELOPES.map(
    (envelope) => `${envelopeWidth(envelope)} + ${ROW_GAP}`,
  );
  return `calc(${parts.join(" + ")})`;
}

function EnvelopeMarquee() {
  return (
    <div
      className="envelope-marquee absolute left-0 top-0 flex w-max items-start"
      style={
        {
          gap: ROW_GAP,
          "--marquee-distance": envelopeSetWidth(),
          "--marquee-duration": `${ENVELOPES.length * MARQUEE_SECONDS_PER_ENVELOPE}s`,
        } as CSSProperties
      }
    >
      {Array.from({ length: ENVELOPES.length * MARQUEE_COPIES }, (_, index) => {
        const envelope = ENVELOPES[index % ENVELOPES.length];
        const isFirstCopy = index < ENVELOPES.length;

        return (
          <div
            key={`${index}-${envelopeKey(envelope)}`}
            className="relative shrink-0"
            style={{ height: SIDE_HEIGHT }}
            aria-hidden={!isFirstCopy}
          >
            <EnvelopeVisual
              envelope={envelope}
              eager={isFirstCopy}
              isCarouselActive={false}
              peekFromTop
            />
          </div>
        );
      })}
    </div>
  );
}

function LanguageSwitcher({
  className = "",
  onSelect,
}: {
  className?: string;
  onSelect?: () => void;
}) {
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
        onClick={() => {
          setLocale("ko");
          onSelect?.();
        }}
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
        onClick={() => {
          setLocale("en");
          onSelect?.();
        }}
      >
        EN
      </button>
    </div>
  );
}

type KoreanView = "service" | "story";

const KOREAN_VIEWS: { id: KoreanView; label: string }[] = [
  { id: "service", label: "서비스 소개" },
  { id: "story", label: "우리의 이야기" },
];

function KoreanViewMenu({
  view,
  onChange,
}: {
  view: KoreanView;
  onChange: (view: KoreanView) => void;
}) {
  return (
    <div
      className="flex items-center justify-center gap-3"
      role="group"
      aria-label="메뉴"
    >
      {KOREAN_VIEWS.map((item, index) => (
        <Fragment key={item.id}>
          {index > 0 ? (
            <span aria-hidden className="text-base text-neutral-400">
              |
            </span>
          ) : null}
          <button
            type="button"
            className={`font-display cursor-pointer text-base tracking-[0.05em] transition-colors ${
              view === item.id
                ? "text-[#ec0000]"
                : "text-neutral-900 hover:text-red-600"
            }`}
            aria-pressed={view === item.id}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

function TopBarLogo() {
  return (
    <Image
      src="/images/GF_print_logo.png"
      alt="Greetings Folks"
      width={1562}
      height={670}
      priority
      className="h-36 w-auto max-w-[calc(100vw-8rem)] object-contain mix-blend-multiply sm:h-[10.5rem]"
    />
  );
}

export function LandingPage() {
  const { locale, t } = useLocale();
  const searchParams = useSearchParams();
  const [serviceOpen, setServiceOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [koreanView, setKoreanView] = useState<KoreanView>(
    searchParams.get("view") === "story" ? "story" : "service",
  );
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

  return (
    <div
      className={
        locale === "ko"
          ? "default2-landing relative min-h-dvh bg-white overscroll-x-none"
          : "default2-landing relative flex h-dvh flex-col overflow-hidden bg-white touch-pan-y overscroll-x-none"
      }
      onContextMenu={preventArtworkContextMenu}
    >
      <div
        className={
          locale === "ko"
            ? "absolute inset-x-0 top-0 z-10"
            : "relative z-10 shrink-0"
        }
      >
        <header className="relative flex h-40 w-full shrink-0 items-center justify-between px-6 sm:h-48 sm:px-8 md:px-10 xl:px-12 2xl:px-16">
          <div className="hidden md:block">
            {locale === "ko" ? null : (
              <Button variant="nav" weight="normal" onClick={openService}>
                {t.ourService}
              </Button>
            )}
          </div>

          <div className="w-10 md:hidden" aria-hidden />

          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <TopBarLogo />
          </div>

          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

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
        </header>

        {locale === "ko" ? (
          <KoreanViewMenu view={koreanView} onChange={setKoreanView} />
        ) : null}

        <p
          role="status"
          className="bg-[#ec0000] px-4 py-2.5 text-center text-sm leading-snug whitespace-pre-line text-white md:hidden"
        >
          {t.desktopOnlyBanner}
        </p>
      </div>

      {menuOpen ? (
        <div
          id={menuId}
          className="fixed inset-0 z-50 flex flex-col bg-white md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="relative flex h-40 w-full shrink-0 items-center justify-between px-6 sm:h-48 sm:px-8">
            <div className="w-10" aria-hidden />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <TopBarLogo />
            </div>
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center"
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
            {locale === "ko" ? null : (
              <Button
                variant="nav"
                weight="normal"
                className="justify-start"
                onClick={openService}
              >
                {t.ourService}
              </Button>
            )}
            <LanguageSwitcher onSelect={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      {locale === "ko" ? (
        koreanView === "service" ? (
          <div key="service" className="relative">
            <Image
              src="/How_Korean.webp"
              alt="안녕하세요, 친애하는 친구들 — 그리팅스 포크스 이용방법"
              width={2548}
              height={2200}
              priority
              sizes="100vw"
              className="relative z-0 h-auto w-full"
            />
            {/* Negative margin % is relative to width; 7% of width ≈ 8% of the image height, just below "[0/20]". */}
            <div className="relative z-20 -mt-[7%] flex flex-col items-center gap-6">
              <Button variant="primary" href="/cards">
                편지 보내러 가기
              </Button>
              <div className="pointer-events-none relative h-[12vh] w-full overflow-hidden">
                <EnvelopeMarquee />
              </div>
            </div>
          </div>
        ) : (
          <Image
            key="story"
            src="/Aboutus_Korean.webp"
            alt="그리팅스 포크스 — 소흠과 지혜의 편지"
            width={2548}
            height={2700}
            sizes="100vw"
            className="h-auto w-full"
          />
        )
      ) : (
        <PostcardStack embedded />
      )}

      <OurServiceModal open={serviceOpen} onClose={() => setServiceOpen(false)} />
    </div>
  );
}
