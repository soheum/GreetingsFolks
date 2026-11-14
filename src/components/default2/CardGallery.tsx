"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ENVELOPES, type Envelope } from "@/data/envelopes";
import { useLocale } from "@/lib/locale";
import { preventArtworkContextMenu } from "@/lib/artwork-protection";
import { EnvelopeVisual, PostcardStack } from "./PostcardStack";
import { ViewDetailsModal } from "./ViewDetailsModal";

const CATEGORIES = [
  { id: "celebrations", label: "Celebrations", flats: [2, 8, 7, 10] },
  { id: "get-well", label: "Get well", flats: [4] },
  { id: "thinking-of-you", label: "Thinking of you", flats: [6, 5, 1] },
  { id: "congratulations", label: "Congratulations", flats: [8, 10] },
  { id: "good-luck", label: "Good luck", flats: [1, 9, 10] },
] as const;

/** 모두보기 grid order (flat numbers). */
const ALL_GRID_ORDER = [1, 7, 8, 5, 4, 6, 3, 9, 2, 10] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

const STEPS = CATEGORIES.flatMap((category) =>
  category.flats.map((_, index) => ({
    categoryId: category.id,
    index,
  })),
);

const OPEN_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const ROW_GAP = "1.5rem";
/** One of the three columns, matching the gap on either side of the row. */
const SLOT = "((100cqi - 6rem) / 3)";

function flatNumber(envelope: Envelope) {
  const src =
    envelope.layers?.find((layer) => layer.anchor === "fill")?.src ??
    envelope.src ??
    "";
  return Number(src.match(/flat_(\d+)/)?.[1] ?? 0);
}

function envelopesFor(flats: readonly number[]) {
  return flats.flatMap((flat) => {
    const envelope = ENVELOPES.find((item) => flatNumber(item) === flat);
    return envelope ? [envelope] : [];
  });
}

function firstStepOf(categoryId: CategoryId) {
  return STEPS.findIndex((step) => step.categoryId === categoryId);
}

/** Shift the row so the active slot's center sits on the page center. */
function rowShift(activeIndex: number) {
  return `translateX(calc(-1 * (${activeIndex} * (${SLOT} + ${ROW_GAP}) + ${SLOT} / 2)))`;
}

function isSmallScreen() {
  return window.matchMedia("(max-width: 767px)").matches;
}

/** Pixel sizes of `flat_N_closed.webp` and `flat_N_letter.webp`. */
const GRID_ART: Record<number, { envelope: [number, number]; letter: [number, number] }> = {
  1: { envelope: [821, 559], letter: [1702, 1138] },
  2: { envelope: [1845, 1302], letter: [1245, 1779] },
  3: { envelope: [1922, 1316], letter: [1292, 1807] },
  4: { envelope: [1533, 1151], letter: [1433, 1020] },
  5: { envelope: [1512, 1131], letter: [1442, 1043] },
  6: { envelope: [1375, 1177], letter: [1316, 1127] },
  7: { envelope: [1903, 1290], letter: [1795, 1203] },
  8: { envelope: [1912, 1295], letter: [1795, 1202] },
  9: { envelope: [1133, 1802], letter: [1067, 1776] },
  10: { envelope: [1465, 2053], letter: [1165, 1721] },
};

const GRID_CELL_ASPECT = 4 / 3;

/**
 * Lays the letter over the envelope's top-right corner. Envelope and letter
 * share a bottom edge so letters line up across a grid row. Sizes are in
 * envelope heights.
 */
function letterWithEnvelopeLayout(flat: number) {
  const art = GRID_ART[flat] ?? GRID_ART[7];
  const [ew, eh] = art.envelope;
  const [lw, lh] = art.letter;
  const tallLetter = lh > lw;
  const tallEnvelope = eh > ew;

  const envelopeWidth = ew / eh;
  const letterHeight = tallLetter && !tallEnvelope ? 1.0 : tallEnvelope ? 0.92 : 0.88;
  const letterWidth = (letterHeight * lw) / lh;
  /** Share of the letter's width that sits over the envelope. */
  const overlap = tallEnvelope ? 0.98 : tallLetter ? 0.9 : 0.68;

  const letterLeft = envelopeWidth - letterWidth * overlap;
  const boxWidth = Math.max(envelopeWidth, letterLeft + letterWidth);
  const boxHeight = Math.max(1, letterHeight);

  const pct = (value: number, total: number) => `${(value / total) * 100}%`;
  const boxAspect = boxWidth / boxHeight;

  return {
    box:
      boxAspect > GRID_CELL_ASPECT
        ? { width: "100%", height: pct(GRID_CELL_ASPECT, boxAspect) }
        : { width: pct(boxAspect, GRID_CELL_ASPECT), height: "100%" },
    envelope: {
      left: "0%",
      top: pct(boxHeight - 1, boxHeight),
      width: pct(envelopeWidth, boxWidth),
      height: pct(1, boxHeight),
    },
    letter: {
      left: pct(letterLeft, boxWidth),
      top: pct(boxHeight - letterHeight, boxHeight),
      width: pct(letterWidth, boxWidth),
      height: pct(letterHeight, boxHeight),
    },
  };
}

function LetterWithEnvelope({ envelope }: { envelope: Envelope }) {
  const flat = flatNumber(envelope);
  const layout = letterWithEnvelopeLayout(flat);

  return (
    <div className="relative flex aspect-[4/3] w-full items-end justify-center">
      <div className="relative" style={layout.box}>
        <div className="absolute" style={layout.envelope}>
          <Image
            src={`/images/flat_${flat}_closed.webp`}
            alt=""
            fill
            sizes="(min-width: 768px) 22vw, 60vw"
            className="object-fill"
          />
        </div>
        <div className="absolute" style={layout.letter}>
          <Image
            src={`/images/flat_${flat}_letter.webp`}
            alt=""
            fill
            sizes="(min-width: 768px) 20vw, 55vw"
            className="object-fill drop-shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
          />
        </div>
      </div>
    </div>
  );
}

export function CardGallery() {
  const { t, envelopeCopy } = useLocale();
  const [stepIndex, setStepIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [detailsTitle, setDetailsTitle] = useState<string | null>(null);
  const [composeIndex, setComposeIndex] = useState<number | null>(null);
  const exitCompose = useCallback(() => setComposeIndex(null), []);

  const step = STEPS[stepIndex] ?? STEPS[0];
  const category =
    CATEGORIES.find((item) => item.id === step.categoryId) ?? CATEGORIES[0];
  const envelopes = envelopesFor(category.flats);
  const activeIndex = Math.min(step.index, envelopes.length - 1);

  const stepBy = (delta: number) => {
    setStepIndex((current) => {
      const next = current + delta;
      if (next < 0 || next >= STEPS.length) {
        return current;
      }
      return next;
    });
  };

  if (composeIndex != null) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden">
        <PostcardStack
          initialComposeIndex={composeIndex}
          onExitCompose={exitCompose}
        />
      </div>
    );
  }

  return (
    <div
      className="card-gallery artwork-protected flex h-dvh flex-col bg-white"
      onContextMenu={preventArtworkContextMenu}
    >
      <header className="flex shrink-0 items-center gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="font-display shrink-0 text-sm tracking-[0.05em] text-[#ec0000] hover:text-red-600"
        >
          서비스 소개
        </Link>
        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-x-5 gap-y-2 overflow-x-auto"
          aria-label="Card categories"
        >
          {CATEGORIES.map((item) => {
            const selected = !showAll && item.id === category.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`font-display shrink-0 cursor-pointer text-sm tracking-[0.02em] whitespace-nowrap transition-colors ${
                  selected
                    ? "text-neutral-900"
                    : "text-neutral-400 hover:text-neutral-700"
                }`}
                aria-pressed={selected}
                onClick={() => {
                  setShowAll(false);
                  const next = firstStepOf(item.id);
                  if (next >= 0) {
                    setStepIndex(next);
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            className={`font-display shrink-0 cursor-pointer text-sm tracking-[0.02em] whitespace-nowrap transition-colors ${
              showAll
                ? "text-neutral-900"
                : "text-neutral-400 hover:text-neutral-700"
            }`}
            aria-pressed={showAll}
            onClick={() => setShowAll(true)}
          >
            View all
          </button>
        </nav>
        <Link
          href="/?view=story"
          className="font-display shrink-0 text-sm tracking-[0.05em] text-[#ec0000] hover:text-red-600"
        >
          우리의 이야기
        </Link>
      </header>

      {showAll ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-x-12 gap-y-14 px-8 pt-10 pb-20 sm:grid-cols-2 md:grid-cols-3 md:px-12">
            {envelopesFor(ALL_GRID_ORDER).map((envelope) => {
              const copy = envelopeCopy(envelope);
              return (
                <li key={envelope.title}>
                  <button
                    type="button"
                    className="group flex w-full cursor-pointer flex-col items-center text-center"
                    onClick={() => setDetailsTitle(envelope.title)}
                  >
                    <LetterWithEnvelope envelope={envelope} />
                    <p className="mt-5 text-sm tracking-[0.04em] text-[#ec0000] uppercase group-hover:text-red-600">
                      {copy.title}
                    </p>
                    <p className="mt-1.5 text-xs text-neutral-700">{copy.subtitle}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
      <div className="relative min-h-0 flex-1 [container-type:inline-size]">
        <button
          type="button"
          className="gallery-cursor-prev absolute inset-y-0 left-0 z-0 w-1/2"
          aria-label="Previous card"
          onClick={() => stepBy(-1)}
        />
        <button
          type="button"
          className="gallery-cursor-next absolute inset-y-0 right-0 z-0 w-1/2"
          aria-label="Next card"
          onClick={() => stepBy(1)}
        />
        <div className="pointer-events-none relative z-10 flex h-full items-end overflow-hidden pb-10">
          <div
            key={category.id}
            className="flex items-end"
            style={{
              gap: ROW_GAP,
              marginLeft: "50%",
              transform: rowShift(activeIndex),
              transition: `transform 700ms ${OPEN_EASE}`,
            }}
          >
            {envelopes.map((envelope, index) => {
              const isActive = index === activeIndex;
              const copy = envelopeCopy(envelope);
              const slimCard = envelope.width / envelope.height < 0.55;
              const logoClass = slimCard
                ? "pointer-events-none absolute bottom-1 h-10 w-auto max-w-[36%]"
                : "pointer-events-none absolute bottom-1 h-12 w-auto max-w-[36%]";

              return (
                <div
                  key={`${category.id}-${envelope.title}`}
                  className="flex shrink-0 items-end justify-center"
                  style={{
                    width: `calc${SLOT}`,
                    zIndex: isActive ? 20 : 0,
                  }}
                >
                  <div
                    className="relative"
                    style={{
                      height: isActive
                        ? "var(--envelope-center-height)"
                        : "var(--envelope-side-height)",
                      transition: `height 700ms ${OPEN_EASE}`,
                    }}
                  >
                    <div
                      className="pointer-events-auto h-full cursor-default [&_*]:pointer-events-none"
                      aria-current={isActive ? "true" : undefined}
                      aria-label={copy.title}
                    >
                      <EnvelopeVisual
                        envelope={envelope}
                        priority={isActive}
                        eager
                        isCarouselActive
                        isLoopResetting
                      />
                    </div>
                    {isActive ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-[4%] z-30 px-[4%]">
                        <div className="relative bg-white bg-[url('/images/paper_texture_1.jpg')] bg-[length:100%_auto] bg-bottom bg-no-repeat px-4 py-4 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                          <Image
                            src="/images/logo_left.webp"
                            alt=""
                            aria-hidden
                            width={444}
                            height={366}
                            className={`${logoClass} left-1`}
                          />
                          <Image
                            src="/images/logo_right.webp"
                            alt=""
                            aria-hidden
                            width={444}
                            height={366}
                            className={`${logoClass} right-1`}
                          />
                          <p className="text-sm tracking-[0.04em] text-[#ec0000] uppercase">
                            {copy.title}
                          </p>
                          <p className="mt-1 text-sm text-neutral-500">{copy.subtitle}</p>
                          <div className="mt-4 flex items-center justify-center gap-5 text-sm text-neutral-900">
                            <button
                              type="button"
                              className="pointer-events-auto cursor-pointer tracking-[0.02em] hover:text-[#ec0000]"
                              onClick={() => setDetailsTitle(envelope.title)}
                            >
                              {t.viewDetails}
                            </button>
                            <button
                              type="button"
                              className="pointer-events-auto cursor-pointer tracking-[0.02em] hover:text-[#ec0000] max-md:cursor-not-allowed max-md:opacity-40"
                              onClick={() => {
                                if (isSmallScreen()) {
                                  return;
                                }
                                const indexInAll = ENVELOPES.indexOf(envelope);
                                if (indexInAll >= 0) {
                                  setComposeIndex(indexInAll);
                                }
                              }}
                            >
                              {t.sendCard}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      <ViewDetailsModal
        open={detailsTitle != null}
        envelopeTitle={detailsTitle ?? ""}
        onClose={() => setDetailsTitle(null)}
      />
    </div>
  );
}
