"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  FormEvent,
  KeyboardEvent,
  ReactNode,
  WheelEvent,
} from "react";
import { Button } from "./Button";
import { ViewDetailsModal } from "./ViewDetailsModal";
import {
  ENVELOPES,
  INITIAL_CENTER_INDEX,
  type Envelope,
  type EnvelopeLayer,
  type EnvelopeTopFlap,
} from "@/data/envelopes";
import { useLocale } from "@/lib/locale";
import { canonicalCardImage } from "@/lib/card-images";

const CENTER_HEIGHT = "var(--envelope-center-height)";
const SIDE_HEIGHT = "var(--envelope-side-height)";
const ZOOM_SCALE = 2;
const LETTER_OPEN_SCALE = 2;
const ROW_GAP = "1.6rem";
const WHEEL_COOLDOWN_MS = 650;
const NEIGHBOR_HIDE_MS = 500;
const ZOOM_GROW_MS = 1300;
const ZOOM_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const CAROUSEL_CHROME_OFFSET = "var(--carousel-chrome-offset)";
const ZOOMED_CHROME_OFFSET = "4rem";
/** Upward shift after the envelope flips to the address side */
const ADDRESSING_TRANSLATE_Y = "-36vh";
const CLOSING_FLAP_TRANSLATE_Y = "-20vh";
const LETTER_FLIP_REVEAL_MS = 3000;
const LETTER_LIFT_SETTLE_MS = 2400;
const LETTER_RIGHT_FLAP_OPEN_MS = 1400;
const LETTER_LEFT_FLAP_OPEN_MS = 1400;
const LETTER_LIFT_ROTATE_SETTLE_MS = 2800;
const LETTER_LIFT_ROTATE_RIGHT_MS = 2800;
const LETTER_LIFT_ROTATE_FLIP_MS = 4200;
const LETTER_FOLD_OPEN_MS = 6000;
/** flat_4 / flat_5: fold the opened letter shut before insert */
const LETTER_FOLD_CLOSE_MS = 1000;
/** Beat after fold shut before dropping into the envelope */
const LETTER_FOLD_CLOSE_PAUSE_MS = 700;
const LETTER_TRI_FOLD_OPEN_MS = 3600;
const LETTER_INSERT_LIFT_MS = 1200;
const LETTER_INSERT_FLIP_MS = 800;
const LETTER_INSERT_DROP_MS = 1200;
const LETTER_INSERT_TOTAL_MS =
  LETTER_INSERT_LIFT_MS + LETTER_INSERT_FLIP_MS + LETTER_INSERT_DROP_MS;
const FLAP_CLOSE_MS = 700;
const ENVELOPE_CENTER_PAUSE_MS = 450;
const ENVELOPE_BACK_FLIP_MS = 1000;
const SUCCESS_TILT_MS = 800;
/** Hold the tilted pose before the postbox appears */
const SUCCESS_TILT_HOLD_MS = 500;
const SUCCESS_POSTBOX_MS = 300;
/** Envelope moves up into the slot (and fades out) */
const SUCCESS_POSTING_MS = 1600;
const LETTER_SIZE_MULTIPLIER = 1.125;
/** Shift the address-side peek letter up (percent of back panel height) */
const BACK_PEEK_LETTER_TOP_NUDGE = 20;
/** Scale the address-side peek letter vs normal letter width (1.1 = 10% bigger) */
const BACK_PEEK_LETTER_SCALE = 1.05;
/** Pause after last Recipient keystroke before revealing the stamp */
const STAMP_REVEAL_IDLE_MS = 1200;
/** Recipient field on the envelope back (centered) */
const ADDRESS_FORM_WIDTH = 52;
/** flat_9 / flat_10 — wider field on taller backs */
const ADDRESS_FORM_WIDTH_TALL = 70;
/** Shift flat_9 / flat_10 back art (+ address layer) down; % of envelope height */
const BACK_FACE_Y_OFFSET_TALL = 6;
/** Shift flat_4 / flat_5 back art (+ address layer) down; % of envelope height */
const BACK_FACE_Y_OFFSET_FOLD = 16;
/**
 * flat_10 layer offsets (cqh so they scale with the card).
 * Back/bottom sit on the card bottom (like other envelopes). Top flap is
 * pushed down so it still seams with that lowered back and covers the letter
 * during the send close.
 */
const FLAT_10_BACK_INSET = "0cqh";
const FLAT_10_BOTTOM_INSET = FLAT_10_BACK_INSET;
const FLAT_10_TOP_FLAP_TOP = "4cqh";
/** flat_1_bottom position (centered slightly left of 50%) */
const FLAT_1_BOTTOM_TRANSLATE_X = "-49.8%";
const FLAT_1_BOTTOM_TRANSLATE_Y = "0%";
const CAROUSEL_LOOP_COPIES = 3;
const CAROUSEL_CENTER_COPY = 1;
/** Wait for the carousel slide to settle, then a short beat, before opening the flap */
const CAROUSEL_FLAP_PAUSE_MS = 400;
/** Advance to `open` while the flap CSS animation is still running (keeps reveal snappy) */
const CAROUSEL_FLAP_OPEN_MS = 100;

function generateRefNumber() {
  return `#${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function letterWidthPercent(layer: EnvelopeLayer) {
  return Math.min((layer.widthPercent ?? 50) * LETTER_SIZE_MULTIPLIER, 100);
}

function addressingEnvelopeScale(envelope: Envelope) {
  const letterLayer = envelope.layers?.find(
    (layer) => layer.anchor === "center",
  );
  const baseScale = envelope.zoomScale ?? LETTER_OPEN_SCALE;

  if (!letterLayer) {
    return baseScale;
  }

  // Sideways letters use a small widthPercent for the open sheet; that must not
  // shrink the envelope on the address side (flat_2 / flat_3 looked off-center).
  const letterRotate = Math.abs(letterLayer.rotate ?? 0);
  if (letterRotate === 90) {
    return baseScale;
  }

  return baseScale * (letterWidthPercent(letterLayer) / 100);
}

function envelopeZoomScale(envelope: Envelope) {
  return envelope.zoomScale ?? ZOOM_SCALE;
}

function envelopeZoomTranslateY(envelope: Envelope) {
  return envelope.zoomTranslateY ?? "0px";
}

function letterHasBack(layer: EnvelopeLayer) {
  return Boolean(layer.backSrc && layer.backWidth && layer.backHeight);
}

function letterUsesLiftSettle(layer: EnvelopeLayer) {
  return layer.letterOpenMotion === "lift-settle";
}

function letterUsesLiftRotateSettle(layer: EnvelopeLayer) {
  return (
    layer.letterOpenMotion === "lift-rotate-settle" ||
    layer.letterOpenMotion === "lift-rotate-flip"
  );
}

function letterUsesLiftRotateFlip(layer: EnvelopeLayer) {
  return (
    layer.letterOpenMotion === "lift-rotate-flip" && letterHasBack(layer)
  );
}

function letterUsesLiftRotateRight(layer: EnvelopeLayer) {
  return layer.letterOpenMotion === "lift-rotate-right";
}

function letterUsesFoldOpen(layer: EnvelopeLayer) {
  return (
    layer.letterOpenMotion === "fold-open" &&
    Boolean(layer.insideSrc && layer.insideWidth && layer.insideHeight)
  );
}

function letterUsesTriFoldOpen(layer: EnvelopeLayer) {
  return (
    layer.letterOpenMotion === "tri-fold-open" &&
    Boolean(
      layer.insideLeftSrc &&
        layer.insideLeftWidth &&
        layer.insideLeftHeight &&
        layer.insideRightSrc &&
        layer.insideRightWidth &&
        layer.insideRightHeight &&
        layer.insideSrc &&
        layer.insideWidth &&
        layer.insideHeight,
    )
  );
}

function letterComposesOnFront(layer: EnvelopeLayer) {
  if (letterUsesLiftRotateFlip(layer)) {
    return false;
  }
  return (
    !letterHasBack(layer) ||
    letterUsesLiftSettle(layer) ||
    letterUsesLiftRotateSettle(layer) ||
    letterUsesLiftRotateRight(layer) ||
    letterUsesFoldOpen(layer) ||
    letterUsesTriFoldOpen(layer)
  );
}

/** Front-compose letters that still need a mid insert step (reorient), not a Y-flip */
function letterNeedsInsertReorient(layer: EnvelopeLayer) {
  return letterUsesLiftRotateSettle(layer) || letterUsesLiftRotateRight(layer);
}

/** Fold letters need a close step before dropping into the envelope */
function letterNeedsFoldClose(layer: EnvelopeLayer) {
  return letterUsesFoldOpen(layer);
}

function letterOpenRevealMs(layer: EnvelopeLayer) {
  if (letterUsesTriFoldOpen(layer)) {
    return LETTER_TRI_FOLD_OPEN_MS;
  }
  if (letterUsesFoldOpen(layer)) {
    return LETTER_FOLD_OPEN_MS;
  }
  if (letterUsesLiftRotateFlip(layer)) {
    return LETTER_LIFT_ROTATE_FLIP_MS;
  }
  if (letterUsesLiftRotateSettle(layer)) {
    return LETTER_LIFT_ROTATE_SETTLE_MS;
  }
  if (letterUsesLiftRotateRight(layer)) {
    return LETTER_LIFT_ROTATE_RIGHT_MS;
  }
  if (letterUsesLiftSettle(layer)) {
    let ms = LETTER_LIFT_SETTLE_MS;
    if (letterHasRightFlapOpen(layer)) ms += LETTER_RIGHT_FLAP_OPEN_MS;
    if (letterHasLeftFlapOpen(layer)) ms += LETTER_LEFT_FLAP_OPEN_MS;
    return ms;
  }
  if (letterHasBack(layer)) {
    return LETTER_FLIP_REVEAL_MS;
  }
  return 0;
}

function envelopeLetterLayer(envelope: Envelope) {
  return envelope.layers?.find((layer) => layer.anchor === "center");
}

function letterHasRightFlapOpen(layer: EnvelopeLayer) {
  return Boolean(
    layer.outsideRightSrc &&
      layer.outsideRightWidth &&
      layer.outsideRightHeight &&
      layer.insideRightSrc &&
      layer.insideRightWidth &&
      layer.insideRightHeight,
  );
}

function letterHasLeftFlapOpen(layer: EnvelopeLayer) {
  return Boolean(
    layer.outsideLeftSrc &&
      layer.outsideLeftWidth &&
      layer.outsideLeftHeight &&
      layer.insideLeftSrc &&
      layer.insideLeftWidth &&
      layer.insideLeftHeight,
  );
}

/** Closed stack: center → right → left (left on top; right still opens first). */
function letterClosedStack(
  layer: EnvelopeLayer,
  priority?: boolean,
  children?: ReactNode,
  options?: { hingedRight?: boolean; hingedLeft?: boolean },
) {
  const hasOutside =
    Boolean(
      layer.outsideRightSrc &&
        layer.outsideRightWidth &&
        layer.outsideRightHeight,
    ) ||
    Boolean(
      layer.outsideLeftSrc && layer.outsideLeftWidth && layer.outsideLeftHeight,
    );
  const hingedRight = Boolean(
    options?.hingedRight && letterHasRightFlapOpen(layer),
  );
  const hingedLeft = Boolean(
    options?.hingedLeft && letterHasLeftFlapOpen(layer),
  );
  const hasClosedCover = Boolean(
    layer.closedCoverSrc &&
      layer.closedCoverWidth &&
      layer.closedCoverHeight,
  );

  // Optional single closed pack when not hinging open yet
  if (hasClosedCover && !hingedRight && !hingedLeft) {
    return (
      <>
        <Image
          src={layer.closedCoverSrc!}
          alt=""
          aria-hidden
          width={layer.closedCoverWidth}
          height={layer.closedCoverHeight}
          priority={priority}
          className="h-auto w-full"
        />
        {children}
      </>
    );
  }

  if (!hasOutside) {
    return (
      <>
        <Image
          src={layer.src}
          alt=""
          aria-hidden
          width={layer.width}
          height={layer.height}
          priority={priority}
          className="h-auto w-full"
        />
        {children}
      </>
    );
  }

  return (
    <div
      className="letter-closed-stack"
      style={
        {
          "--letter-stack-aspect": `${layer.width} / ${layer.height}`,
        } as CSSProperties
      }
    >
      <Image
        src={layer.src}
        alt=""
        aria-hidden
        width={layer.width}
        height={layer.height}
        priority={priority}
        className="letter-closed-stack__layer letter-closed-stack__center"
      />
      {children}
      {hingedLeft ? (
        <div className="letter-left-flap">
          <div className="letter-left-flap-inner">
            <div className="letter-left-flap-face letter-left-flap-face--outside">
              <Image
                src={layer.outsideLeftSrc!}
                alt=""
                aria-hidden
                width={layer.outsideLeftWidth}
                height={layer.outsideLeftHeight}
                priority={priority}
                className="letter-side-flap-image"
              />
            </div>
            <div className="letter-left-flap-face letter-left-flap-face--inside">
              <Image
                src={layer.insideLeftSrc!}
                alt=""
                aria-hidden
                width={layer.insideLeftWidth}
                height={layer.insideLeftHeight}
                priority={priority}
                className="letter-side-flap-image"
              />
            </div>
          </div>
        </div>
      ) : layer.outsideLeftSrc &&
        layer.outsideLeftWidth &&
        layer.outsideLeftHeight ? (
        <Image
          src={layer.outsideLeftSrc}
          alt=""
          aria-hidden
          width={layer.outsideLeftWidth}
          height={layer.outsideLeftHeight}
          priority={priority}
          className="letter-closed-stack__layer letter-closed-stack__left"
        />
      ) : null}
      {hingedRight ? (
        <div className="letter-right-flap">
          <div className="letter-right-flap-inner">
            <div className="letter-right-flap-face letter-right-flap-face--outside">
              <Image
                src={layer.outsideRightSrc!}
                alt=""
                aria-hidden
                width={layer.outsideRightWidth}
                height={layer.outsideRightHeight}
                priority={priority}
                className="letter-side-flap-image"
              />
            </div>
            <div className="letter-right-flap-face letter-right-flap-face--inside">
              <Image
                src={layer.insideRightSrc!}
                alt=""
                aria-hidden
                width={layer.insideRightWidth}
                height={layer.insideRightHeight}
                priority={priority}
                className="letter-side-flap-image"
              />
            </div>
          </div>
        </div>
      ) : layer.outsideRightSrc &&
        layer.outsideRightWidth &&
        layer.outsideRightHeight ? (
        <Image
          src={layer.outsideRightSrc}
          alt=""
          aria-hidden
          width={layer.outsideRightWidth}
          height={layer.outsideRightHeight}
          priority={priority}
          className="letter-closed-stack__layer letter-closed-stack__right"
        />
      ) : null}
    </div>
  );
}

type ZoomPhase = "hiding" | "growing" | "done";
type ComposeStage =
  | "writing"
  | "closing-lift"
  | "closing-flip"
  | "closing-insert"
  | "closing-flap"
  | "flipping-back"
  | "addressing"
  | "sending"
  | "success";
type SuccessPhase = "tilt" | "postbox" | "posting" | "done";
type ServiceClass = "first" | "second";

type InsertStep = "lift" | "flip" | "insert" | "done";
type TopFlapStep = "open" | "opening" | "closing" | "closed";

function hasCarouselFlapReveal(envelope: Envelope) {
  const flap = envelope.topFlap;
  return Boolean(
    flap?.insideSrc && flap.outsideSrc && flap.backSrc,
  );
}

const SERVICE_CLASS_OPTIONS: ServiceClass[] = ["first", "second"];

function getInsertStep(composeStage: ComposeStage | null): InsertStep | null {
  if (composeStage === "closing-lift") {
    return "lift";
  }

  if (composeStage === "closing-flip") {
    return "flip";
  }

  if (composeStage === "closing-insert") {
    return "insert";
  }

  if (
    composeStage === "closing-flap" ||
    composeStage === "flipping-back" ||
    composeStage === "addressing" ||
    composeStage === "sending"
  ) {
    return "done";
  }

  return null;
}

function getTopFlapStep(composeStage: ComposeStage | null): TopFlapStep | null {
  if (composeStage === "closing-flap") {
    return "closing";
  }

  if (
    composeStage === "addressing" ||
    composeStage === "sending" ||
    composeStage === "success" ||
    composeStage === "flipping-back"
  ) {
    return "closed";
  }

  if (
    composeStage === "writing" ||
    composeStage === "closing-lift" ||
    composeStage === "closing-flip" ||
    composeStage === "closing-insert"
  ) {
    return "open";
  }

  return null;
}

function combineCardMessage(left: string, right: string) {
  const trimmedLeft = left.trimEnd();
  const trimmedRight = right.trim();

  if (!trimmedLeft) {
    return trimmedRight;
  }

  if (!trimmedRight) {
    return trimmedLeft;
  }

  return `${trimmedLeft}\n\n${trimmedRight}`;
}

function hasCardMessage(left: string, right: string) {
  return Boolean(left.trim() || right.trim());
}

function splitTextToFitColumn(text: string, reference: HTMLTextAreaElement) {
  const measure = document.createElement("textarea");
  const styles = window.getComputedStyle(reference);

  measure.style.position = "absolute";
  measure.style.visibility = "hidden";
  measure.style.pointerEvents = "none";
  measure.style.top = "0";
  measure.style.left = "-9999px";
  measure.style.overflow = "hidden";
  measure.style.resize = "none";
  measure.style.height = `${reference.clientHeight}px`;
  measure.style.width = `${reference.clientWidth}px`;
  measure.style.font = styles.font;
  measure.style.lineHeight = styles.lineHeight;
  measure.style.letterSpacing = styles.letterSpacing;
  measure.style.padding = styles.padding;
  measure.style.boxSizing = styles.boxSizing;
  measure.style.border = styles.border;
  measure.style.whiteSpace = styles.whiteSpace;
  measure.style.wordBreak = styles.wordBreak;

  document.body.appendChild(measure);

  let left = text;
  measure.value = left;

  while (left.length > 0 && measure.scrollHeight > measure.clientHeight) {
    left = left.slice(0, -1);
    measure.value = left;
  }

  document.body.removeChild(measure);

  const overflow = text.slice(left.length);
  return { left, overflow };
}

/** One continuous message across fold panels: fill top, remainder in bottom. */
function reflowFoldSplit(
  fullText: string,
  topEl: HTMLTextAreaElement,
  bottomEl: HTMLTextAreaElement,
) {
  const { left: top, overflow } = splitTextToFitColumn(fullText, topEl);
  const { left: bottom } = splitTextToFitColumn(overflow, bottomEl);
  return { top, bottom };
}

function envelopeKey(envelope: Envelope) {
  return envelope.src ?? envelope.layers?.[0].src ?? envelope.alt;
}

function wrapEnvelopeIndex(index: number) {
  return ((index % ENVELOPES.length) + ENVELOPES.length) % ENVELOPES.length;
}

function envelopeImageSrc(envelope: Envelope) {
  const fillSrc =
    envelope.layers?.find((layer) => layer.anchor === "fill")?.src ??
    envelope.src ??
    "";
  return canonicalCardImage(fillSrc);
}

function isFlat1Envelope(envelope: Envelope) {
  return Boolean(
    envelope.layers?.some(
      (layer) =>
        layer.src.includes("/flat_1_") || layer.src.includes("/flat_1."),
    ) || envelope.topFlap?.outsideSrc.includes("/flat_1_"),
  );
}

function envelopeHeight(
  index: number,
  activeIndex: number,
  zoomedIndex: number | null,
) {
  if (zoomedIndex !== null && index !== zoomedIndex) {
    return SIDE_HEIGHT;
  }

  if (index === activeIndex || (zoomedIndex !== null && index === zoomedIndex)) {
    return CENTER_HEIGHT;
  }

  return SIDE_HEIGHT;
}

function envelopeWidth(envelope: Envelope, height: string) {
  return `(${height} * ${envelope.width} / ${envelope.height})`;
}

function envelopeWidthForOffset(
  index: number,
  activeIndex: number,
  zoomedIndex: number | null = null,
) {
  const envelope = ENVELOPES[wrapEnvelopeIndex(index)];
  const height = envelopeHeight(index, activeIndex, zoomedIndex);
  return envelopeWidth(envelope, height);
}

function activeEnvelopeOffset(
  activeIndex: number,
  zoomedIndex: number | null = null,
) {
  const offsetParts: string[] = [];

  for (let index = 0; index < activeIndex; index += 1) {
    offsetParts.push(envelopeWidthForOffset(index, activeIndex, zoomedIndex));
  }

  for (let index = 0; index < activeIndex; index += 1) {
    offsetParts.push(ROW_GAP);
  }

  offsetParts.push(
    `${envelopeWidthForOffset(activeIndex, activeIndex, zoomedIndex)} / 2`,
  );

  return `calc(${offsetParts.join(" + ")})`;
}

function LetterFlipLayer({
  layer,
  envelope,
  priority = false,
  onLetterClick,
  isSendable = false,
  messageLeft,
  messageRight,
  composeStage,
  onMessageLeftChange,
  onMessageRightChange,
}: {
  layer: EnvelopeLayer;
  envelope: Envelope;
  priority?: boolean;
  onLetterClick?: () => void;
  isSendable?: boolean;
  messageLeft?: string;
  messageRight?: string;
  composeStage?: ComposeStage | null;
  onMessageLeftChange?: (message: string) => void;
  onMessageRightChange?: (message: string) => void;
}) {
  const { t } = useLocale();
  const leftRef = useRef<HTMLTextAreaElement>(null);
  const rightRef = useRef<HTMLTextAreaElement>(null);
  const topPercent = layer.topPercent ?? 50;
  const hasBack = letterHasBack(layer);
  const usesLiftSettle = letterUsesLiftSettle(layer);
  const usesLiftRotateSettle = letterUsesLiftRotateSettle(layer);
  const usesLiftRotateFlip = letterUsesLiftRotateFlip(layer);
  const usesLiftRotateRight = letterUsesLiftRotateRight(layer);
  const usesFoldOpen = letterUsesFoldOpen(layer);
  const usesTriFoldOpen = letterUsesTriFoldOpen(layer);
  const composeOnFront = letterComposesOnFront(layer);
  const isSingleColumn = layer.composeLayout === "single";
  const isFoldSplit = layer.composeLayout === "fold-split";
  const backSrc = layer.backSrc;
  const backWidth = layer.backWidth;
  const backHeight = layer.backHeight;
  const insideSrc = layer.insideSrc;
  const insideWidth = layer.insideWidth;
  const insideHeight = layer.insideHeight;
  const canWrite = isSendable && composeStage === "writing";
  const insertStep = getInsertStep(composeStage ?? null);
  const isInserting = insertStep !== null;
  const showComposeMessage =
    isSendable &&
    composeStage === "writing"
      ? true
      : isSendable &&
        !usesFoldOpen &&
        (composeStage === "closing-lift" ||
          composeStage === "closing-flip" ||
          // flat_9: keep text on the letter through the reorient + drop
          (usesLiftRotateRight && composeStage === "closing-insert"));
  const leftValue = messageLeft ?? "";
  const rightValue = messageRight ?? "";
  const textareaClassName = isFoldSplit
    ? "card-message-input h-full min-w-0 flex-1 resize-none border-0 bg-transparent px-1 py-1 text-neutral-800 shadow-none outline-none focus:border-0 focus:shadow-none focus:outline-none focus-visible:outline-none"
    : "card-message-input h-full min-w-0 flex-1 resize-none border-0 bg-transparent px-1 pt-1 pb-3 text-neutral-800 shadow-none outline-none focus:border-0 focus:shadow-none focus:outline-none focus-visible:outline-none";

  const handleLeftChange = (value: string) => {
    const el = leftRef.current;

    if (isFoldSplit) {
      const rightEl = rightRef.current;
      if (!el || !rightEl) {
        onMessageLeftChange?.(value);
        return;
      }

      const previousBottom = rightValue;
      const { top, bottom } = reflowFoldSplit(value + rightValue, el, rightEl);
      onMessageLeftChange?.(top);
      onMessageRightChange?.(bottom);

      if (bottom.length > previousBottom.length && value.length >= top.length) {
        const spilled = bottom.length - previousBottom.length;
        requestAnimationFrame(() => {
          rightRef.current?.focus();
          const position = Math.min(spilled, bottom.length);
          rightRef.current?.setSelectionRange(position, position);
        });
      }
      return;
    }

    if (!el) {
      onMessageLeftChange?.(value);
      if (isSingleColumn) {
        onMessageRightChange?.("");
      }
      return;
    }

    const { left, overflow } = splitTextToFitColumn(value, el);
    onMessageLeftChange?.(left);

    if (isSingleColumn) {
      onMessageRightChange?.("");
      return;
    }

    if (overflow) {
      const rightEl = rightRef.current;
      if (!rightEl) {
        return;
      }

      const { left: fittedRight } = splitTextToFitColumn(
        overflow + rightValue,
        rightEl,
      );
      onMessageRightChange?.(fittedRight);
      requestAnimationFrame(() => {
        rightRef.current?.focus();
        const position = Math.min(overflow.length, fittedRight.length);
        rightRef.current?.setSelectionRange(position, position);
      });
    }
  };

  const appendToRightColumn = (text: string) => {
    if (isSingleColumn) {
      return;
    }

    if (isFoldSplit) {
      const topEl = leftRef.current;
      const rightEl = rightRef.current;
      if (!topEl || !rightEl) {
        return;
      }

      const previousBottom = rightValue;
      const { top, bottom } = reflowFoldSplit(
        leftValue + rightValue + text,
        topEl,
        rightEl,
      );
      onMessageLeftChange?.(top);
      onMessageRightChange?.(bottom);
      requestAnimationFrame(() => {
        rightRef.current?.focus();
        const spilled = Math.max(bottom.length - previousBottom.length, 0);
        const position = Math.min(spilled, bottom.length);
        rightRef.current?.setSelectionRange(position, position);
      });
      return;
    }

    const rightEl = rightRef.current;
    if (!rightEl) {
      return;
    }

    const selectionStart = rightEl.selectionStart ?? rightValue.length;
    const selectionEnd = rightEl.selectionEnd ?? rightValue.length;
    const candidate =
      rightValue.slice(0, selectionStart) + text + rightValue.slice(selectionEnd);
    const { left: fittedRight } = splitTextToFitColumn(candidate, rightEl);

    onMessageRightChange?.(fittedRight);
    requestAnimationFrame(() => {
      rightRef.current?.focus();
      const position = Math.min(selectionStart + text.length, fittedRight.length);
      rightRef.current?.setSelectionRange(position, position);
    });
  };

  const handleLeftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    const isPrintable =
      event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;

    if (!isPrintable) {
      return;
    }

    const typingAtEnd =
      el.selectionStart === leftValue.length && el.selectionEnd === leftValue.length;
    if (!typingAtEnd) {
      return;
    }

    if (isFoldSplit) {
      const rightEl = rightRef.current;
      if (!rightEl) {
        return;
      }

      const previousBottom = rightValue;
      const { top, bottom } = reflowFoldSplit(
        leftValue + event.key + rightValue,
        el,
        rightEl,
      );
      if (top.length >= leftValue.length + 1) {
        return;
      }

      event.preventDefault();
      onMessageLeftChange?.(top);
      onMessageRightChange?.(bottom);
      requestAnimationFrame(() => {
        rightRef.current?.focus();
        const spilled = Math.max(bottom.length - previousBottom.length, 1);
        const position = Math.min(spilled, bottom.length);
        rightRef.current?.setSelectionRange(position, position);
      });
      return;
    }

    const { left, overflow } = splitTextToFitColumn(leftValue + event.key, el);
    if (!overflow) {
      return;
    }

    event.preventDefault();
    onMessageLeftChange?.(left);
    if (!isSingleColumn) {
      appendToRightColumn(overflow);
    }
  };

  const handleRightChange = (value: string) => {
    if (isFoldSplit) {
      const topEl = leftRef.current;
      const el = rightRef.current;
      if (!topEl || !el) {
        onMessageRightChange?.(value);
        return;
      }

      const { top, bottom } = reflowFoldSplit(leftValue + value, topEl, el);
      onMessageLeftChange?.(top);
      onMessageRightChange?.(bottom);
      return;
    }

    const el = rightRef.current;
    if (!el) {
      onMessageRightChange?.(value);
      return;
    }

    const { left } = splitTextToFitColumn(value, el);
    onMessageRightChange?.(left);
  };

  const handleRightKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;

    if (
      event.key === "Backspace" &&
      target.selectionStart === 0 &&
      target.selectionEnd === 0
    ) {
      if (isFoldSplit) {
        event.preventDefault();
        const topEl = leftRef.current;
        const bottomEl = rightRef.current;
        if (!topEl || !bottomEl || leftValue.length === 0) {
          leftRef.current?.focus();
          return;
        }

        const { top, bottom } = reflowFoldSplit(
          leftValue.slice(0, -1) + rightValue,
          topEl,
          bottomEl,
        );
        onMessageLeftChange?.(top);
        onMessageRightChange?.(bottom);
        requestAnimationFrame(() => {
          leftRef.current?.focus();
          leftRef.current?.setSelectionRange(top.length, top.length);
        });
        return;
      }

      if (rightValue.length === 0) {
        leftRef.current?.focus();
        return;
      }
    }

    const isPrintable =
      event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;

    if (!isPrintable) {
      return;
    }

    const typingAtEnd =
      target.selectionStart === rightValue.length &&
      target.selectionEnd === rightValue.length;
    if (!typingAtEnd) {
      return;
    }

    const { left, overflow } = splitTextToFitColumn(rightValue + event.key, target);
    if (!overflow) {
      return;
    }

    event.preventDefault();
    onMessageRightChange?.(left);
  };

  const composeInsetClass =
    layer.composeShape === "oval-bottom"
      ? "letter-compose--oval-bottom"
      : layer.composeShape === "taper-bottom"
        ? "letter-compose--taper-bottom"
        : layer.composeShape === "taper-heave"
          ? "letter-compose--taper-heave"
          : usesTriFoldOpen
            ? (layer.composeInset ?? "inset-[10%_8%_12%_8%]")
            : usesFoldOpen
              ? "inset-[15%_15%_15%_20%]"
              : (layer.composeInset ?? "inset-[4%_8%_4%]");
  const composeColumnsClass =
    layer.composeShape === "oval-bottom"
      ? "letter-compose-columns flex h-full w-full gap-1"
      : isFoldSplit
        ? "letter-compose-columns letter-compose-columns--fold-split flex min-h-0 w-full flex-1 flex-col"
        : layer.composeShape === "taper-bottom" ||
            layer.composeShape === "taper-heave"
          ? "letter-compose-columns flex h-full w-full gap-1"
          : usesLiftRotateSettle ||
              usesLiftRotateRight ||
              usesLiftRotateFlip ||
              usesTriFoldOpen ||
              isSingleColumn
            ? `letter-compose-columns flex ${
                usesLiftRotateSettle || usesLiftRotateRight || usesTriFoldOpen
                  ? "h-full"
                  : "h-[80%]"
              } w-full`
            : "letter-compose-columns flex h-[80%] w-full gap-1";
  const composeClassName = `letter-compose absolute ${composeInsetClass} flex min-h-0 flex-col px-[0%] ${
    layer.composeShape === "oval-bottom"
      ? "justify-start pt-[2%] pb-[0%]"
      : layer.composeShape === "taper-bottom" ||
          layer.composeShape === "taper-heave" ||
          isFoldSplit
        ? "justify-start pt-[0%] pb-[0%]"
        : usesLiftRotateSettle || usesLiftRotateRight || usesTriFoldOpen
          ? "justify-start pt-[0%] pb-[0%]"
          : usesFoldOpen
            ? "justify-start pt-[0%] pb-[2%]"
            : "justify-end pt-[10%] pb-[2%]"
  } ${
    !showComposeMessage
      ? "pointer-events-none opacity-0"
      : canWrite
        ? hasBack ||
          usesLiftSettle ||
          usesLiftRotateSettle ||
          usesLiftRotateRight ||
          usesLiftRotateFlip ||
          usesFoldOpen ||
          usesTriFoldOpen
          ? "letter-compose--ready"
          : "letter-compose--visible"
        : "letter-compose--visible pointer-events-none"
  }`;

  const composeTextStyle =
    layer.composeLineHeight != null || layer.composeFontSize
      ? ({
          ...(layer.composeLineHeight != null
            ? { "--text-letter--line-height": String(layer.composeLineHeight) }
            : null),
          ...(layer.composeFontSize
            ? { "--text-letter": layer.composeFontSize }
            : null),
        } as CSSProperties)
      : undefined;

  const composeFields = (
    <div className={composeColumnsClass} style={composeTextStyle}>
      <label className="sr-only" htmlFor="card-message-left">
        {isSingleColumn || isFoldSplit
          ? "Write your card message"
          : "Write your card message, left column"}
      </label>
      <textarea
        ref={leftRef}
        id="card-message-left"
        value={leftValue}
        readOnly={!canWrite}
        onChange={(event) => handleLeftChange(event.target.value)}
        onKeyDown={handleLeftKeyDown}
        placeholder={t.writeLetterPlaceholder}
        className={textareaClassName}
      />
      {!isSingleColumn ? (
        <>
          <label className="sr-only" htmlFor="card-message-right">
            {isFoldSplit
              ? "Write your card message, continued"
              : "Write your card message, right column"}
          </label>
          <textarea
            ref={rightRef}
            id="card-message-right"
            value={rightValue}
            readOnly={!canWrite}
            onChange={(event) => handleRightChange(event.target.value)}
            onKeyDown={handleRightKeyDown}
            placeholder={isFoldSplit ? "" : "Continue here..."}
            className={textareaClassName}
          />
        </>
      ) : null}
    </div>
  );

  if (isSendable) {
    if (
      usesTriFoldOpen &&
      layer.insideLeftSrc &&
      layer.insideLeftWidth &&
      layer.insideLeftHeight &&
      layer.insideRightSrc &&
      layer.insideRightWidth &&
      layer.insideRightHeight &&
      insideSrc &&
      insideWidth &&
      insideHeight
    ) {
      const leftW = layer.insideLeftWidth;
      const rightW = layer.insideRightWidth;
      const centerW = Math.max(insideWidth - leftW - rightW, 1);
      const leftPct = (leftW / insideWidth) * 100;
      const centerPct = (centerW / insideWidth) * 100;
      const rightPct = (rightW / insideWidth) * 100;
      const openWidthPercent = Math.min(
        letterWidthPercent(layer) * (insideWidth / layer.width),
        98,
      );
      const sceneClass = isInserting
        ? `letter-tri-fold-scene letter-tri-fold-scene--done letter-insert-scene letter-insert-scene--${insertStep}`
        : "letter-tri-fold-scene";

      return (
        <div
          className={`${sceneClass} absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0`}
          style={
            {
              "--letter-top": `${topPercent}%`,
              "--letter-z-base": layer.zIndex,
              "--letter-z-top": 50,
              "--tri-closed-width": `${letterWidthPercent(layer)}%`,
              "--tri-open-width": `${openWidthPercent}%`,
              "--tri-closed-aspect": `${layer.width} / ${layer.height}`,
              "--tri-open-aspect": `${insideWidth} / ${insideHeight}`,
              "--tri-left-pct": `${leftPct}%`,
              "--tri-center-pct": `${centerPct}%`,
              "--tri-right-pct": `${rightPct}%`,
              width: "var(--tri-closed-width)",
              transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
            } as CSSProperties
          }
        >
          <div className="letter-tri-fold-mover">
            <div className="letter-tri-fold-spread">
              {layer.insideMidSrc &&
              layer.insideMidWidth &&
              layer.insideMidHeight ? (
                <div className="letter-tri-fold-mid">
                  <Image
                    src={layer.insideMidSrc}
                    alt=""
                    aria-hidden
                    width={layer.insideMidWidth}
                    height={layer.insideMidHeight}
                    priority={priority}
                    className="h-auto w-full"
                  />
                </div>
              ) : null}

              <div className="letter-tri-fold-center">
                <div className="letter-tri-fold-center-art">
                  <Image
                    src={insideSrc}
                    alt=""
                    aria-hidden
                    width={insideWidth}
                    height={insideHeight}
                    priority={priority}
                    className="letter-tri-fold-center-image"
                    style={
                      {
                        width: `${(insideWidth / centerW) * 100}%`,
                        marginLeft: `${(-leftW / centerW) * 100}%`,
                      } as CSSProperties
                    }
                  />
                </div>
              </div>

              <div className="letter-tri-fold-left">
                <div className="letter-tri-fold-left-inner">
                  <Image
                    src={layer.insideLeftSrc}
                    alt=""
                    aria-hidden
                    width={leftW}
                    height={layer.insideLeftHeight}
                    priority={priority}
                    className="h-auto w-full"
                  />
                </div>
              </div>

              <div className="letter-tri-fold-right">
                <div className="letter-tri-fold-right-inner">
                  <div className="letter-tri-fold-right-face letter-tri-fold-right-face--inside">
                    <Image
                      src={layer.insideRightSrc}
                      alt=""
                      aria-hidden
                      width={rightW}
                      height={layer.insideRightHeight}
                      priority={priority}
                      className="h-auto w-full"
                    />
                  </div>
                  <div className="letter-tri-fold-right-face letter-tri-fold-right-face--outside">
                    <Image
                      src={layer.src}
                      alt=""
                      aria-hidden
                      width={layer.width}
                      height={layer.height}
                      priority={priority}
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="letter-tri-fold-closed">
                <Image
                  src={layer.src}
                  alt=""
                  aria-hidden
                  width={layer.width}
                  height={layer.height}
                  priority={priority}
                  className="h-auto w-full"
                />
              </div>

              {/* Above flaps/cover so text is visible immediately */}
              <div
                className={`${composeClassName} letter-tri-fold-compose`}
                onClick={(event) => event.stopPropagation()}
              >
                {composeFields}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (usesFoldOpen && insideSrc && insideWidth && insideHeight) {
      const isFoldClosing =
        insertStep === "lift" || insertStep === "flip";
      const isFoldInsertDrop =
        insertStep === "insert" || insertStep === "done";

      if (isFoldInsertDrop) {
        return (
          <div
            className={`letter-insert-scene letter-insert-scene--${insertStep} absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0`}
            style={
              {
                "--letter-top": `${topPercent}%`,
                "--letter-z-base": layer.zIndex,
                "--letter-z-top": 50,
                width: `${letterWidthPercent(layer)}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
              } as CSSProperties
            }
          >
            <div
              className={`letter-insert-card letter-insert-card--${insertStep} letter-insert-card--front block h-auto w-full`}
            >
              <div className="relative block h-auto w-full">
                <Image
                  src={layer.src}
                  alt=""
                  aria-hidden
                  width={layer.width}
                  height={layer.height}
                  priority={priority}
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          className={`letter-fold-open-scene absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0${
            isFoldClosing
              ? ` letter-fold-open-scene--closing letter-fold-open-scene--${insertStep}`
              : ""
          }`}
          style={
            {
              "--letter-top": `${topPercent}%`,
              "--letter-z-base": layer.zIndex,
              "--letter-z-top": 50,
              "--letter-fold-close-duration": `${LETTER_FOLD_CLOSE_MS}ms`,
              width: `${letterWidthPercent(layer)}%`,
              transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
            } as CSSProperties
          }
        >
          <div className="letter-fold-open-mover">
            <div className="letter-fold-closed">
              <div className="letter-fold-closed-inner">
                <Image
                  src={layer.src}
                  alt=""
                  aria-hidden
                  width={layer.width}
                  height={layer.height}
                  priority={priority}
                  className="h-auto w-full"
                />
              </div>
            </div>
            <div className="letter-fold-opened">
              <div className="letter-fold-opened-inner">
                <Image
                  src={insideSrc}
                  alt=""
                  aria-hidden
                  width={insideWidth}
                  height={insideHeight}
                  priority={priority}
                  className="h-auto w-full"
                />
              </div>
            </div>
            {/* Outside the fold grid so text is not clipped/hidden until expand */}
            <div
              className={composeClassName}
              onClick={(event) => event.stopPropagation()}
            >
              {composeFields}
            </div>
          </div>
        </div>
      );
    }

    if (usesLiftRotateRight) {
      const insertMoverClass = isInserting
        ? `letter-lift-rotate-right-mover letter-lift-rotate-right-mover--${insertStep}`
        : "letter-lift-rotate-right-mover";
      const insertSpinClass = isInserting
        ? `letter-lift-rotate-right-spin letter-lift-rotate-right-spin--${insertStep}`
        : "letter-lift-rotate-right-spin";
      const sceneClass = isInserting
        ? `letter-insert-scene letter-insert-scene--${insertStep}`
        : "letter-lift-rotate-right-scene";

      return (
        <div
          className={`absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0 ${sceneClass}`}
          style={
            {
              "--letter-top": `${topPercent}%`,
              "--letter-z-base": layer.zIndex,
              "--letter-z-top": 50,
              "--letter-open-scale": 1,
              width: `${letterWidthPercent(layer)}%`,
              transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
            } as CSSProperties
          }
        >
          <div className={insertMoverClass}>
            <div className={insertSpinClass}>
              <div className="relative block h-auto w-full">
                <Image
                  src={layer.src}
                  alt=""
                  aria-hidden
                  width={layer.width}
                  height={layer.height}
                  priority={priority}
                  className="h-auto w-full"
                />
              </div>
              {/* Landscape write frame inside spin (−90°): opens/closes with the letter */}
              <div
                className="letter-lift-rotate-right-compose-frame"
                style={
                  {
                    "--letter-w": layer.width,
                    "--letter-h": layer.height,
                  } as CSSProperties
                }
              >
                <div
                  className={composeClassName}
                  onClick={(event) => event.stopPropagation()}
                >
                  {composeFields}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (usesLiftRotateSettle) {
      const insertMoverClass = isInserting
        ? `letter-lift-rotate-settle-mover letter-lift-rotate-settle-mover--${insertStep}`
        : "letter-lift-rotate-settle-mover";
      const insertSpinClass = isInserting
        ? `letter-lift-rotate-settle-spin letter-lift-rotate-settle-spin--${insertStep}`
        : "letter-lift-rotate-settle-spin";
      const flipCardClass = usesLiftRotateFlip
        ? isInserting
          ? `letter-lift-rotate-flip-card letter-lift-rotate-flip-card--${insertStep}`
          : "letter-lift-rotate-flip-card"
        : "relative block h-auto w-full";
      const sceneClass = isInserting
        ? `letter-insert-scene letter-insert-scene--${insertStep}`
        : `letter-lift-rotate-settle-scene${
            usesLiftRotateFlip ? " letter-lift-rotate-settle-scene--flip" : ""
          }`;

      const frontFace = (
        <div
          className={
            usesLiftRotateFlip
              ? "letter-flip-face relative block h-auto w-full"
              : "relative block h-auto w-full"
          }
        >
          <Image
            src={layer.src}
            alt=""
            aria-hidden
            width={layer.width}
            height={layer.height}
            priority={priority}
            className="h-auto w-full"
          />
          {composeOnFront ? (
            <div
              className={composeClassName}
              onClick={(event) => event.stopPropagation()}
            >
              {composeFields}
            </div>
          ) : null}
        </div>
      );

      const backFace =
        usesLiftRotateFlip && backSrc && backWidth && backHeight ? (
          <div className="letter-flip-face letter-flip-face--back block h-auto w-full">
            <Image
              src={backSrc}
              alt=""
              aria-hidden
              width={backWidth}
              height={backHeight}
              priority={priority}
              className="h-auto w-full"
            />
            <div
              className={composeClassName}
              onClick={(event) => event.stopPropagation()}
            >
              {composeFields}
            </div>
          </div>
        ) : null;

      return (
        <div
          className={`absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0 ${sceneClass}`}
          style={
            {
              "--letter-top": `${topPercent}%`,
              "--letter-z-base": layer.zIndex,
              "--letter-z-top": 50,
              "--letter-open-scale": 1,
              width: `${letterWidthPercent(layer)}%`,
              transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
            } as CSSProperties
          }
        >
          {/* translateX = visual vertical while parent is rotated -90° */}
          <div className={insertMoverClass}>
            <div className={insertSpinClass}>
              <div className={flipCardClass}>
                {frontFace}
                {backFace}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const opensRightFlap = usesLiftSettle && letterHasRightFlapOpen(layer);
    const opensLeftFlap = usesLiftSettle && letterHasLeftFlapOpen(layer);
    const opensSideFlaps = opensRightFlap || opensLeftFlap;

    return (
      <div
        className={`absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0 ${
          isInserting
            ? `letter-insert-scene letter-insert-scene--${insertStep}`
            : usesLiftSettle
              ? `letter-lift-settle-scene${
                  opensSideFlaps ? " letter-lift-settle-scene--side-flaps" : ""
                }`
              : hasBack
                ? "letter-flip-scene"
                : ""
        }`}
        style={{
          "--letter-top": `${topPercent}%`,
          "--letter-z-base": layer.zIndex,
          "--letter-z-top": 50,
          "--letter-open-scale": 1,
          width: `${letterWidthPercent(layer)}%`,
          transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
        } as CSSProperties}
      >
        <div
          className={`block h-auto w-full ${
            isInserting
              ? `letter-insert-card letter-insert-card--${insertStep}${
                  composeOnFront ? " letter-insert-card--front" : ""
                }`
              : usesLiftSettle
                ? "letter-lift-settle-card"
                : hasBack
                  ? "letter-flip-card"
                  : "relative"
          }`}
        >
          <div
            className={`relative block h-auto w-full ${
              hasBack && !usesLiftSettle ? "letter-flip-face" : ""
            }`}
          >
            {letterClosedStack(
              layer,
              priority,
              composeOnFront ? (
                <div
                  className={composeClassName}
                  onClick={(event) => event.stopPropagation()}
                >
                  {composeFields}
                </div>
              ) : null,
              {
                hingedRight: opensRightFlap && !isInserting,
                hingedLeft: opensLeftFlap && !isInserting,
              },
            )}
          </div>
          {hasBack && !usesLiftSettle && backSrc && backWidth && backHeight ? (
            <div className="letter-flip-face letter-flip-face--back block h-auto w-full">
              <Image
                src={backSrc}
                alt=""
                aria-hidden
                width={backWidth}
                height={backHeight}
                priority={priority}
                className="h-auto w-full"
              />
              <div
                className={composeClassName}
                onClick={(event) => event.stopPropagation()}
              >
                {composeFields}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!hasBack || !backSrc || !backWidth || !backHeight) {
    return (
      <Button
        variant="unstyled"
        aria-label={`Close ${envelope.title} letter`}
        onClick={(event) => {
          event.stopPropagation();
          onLetterClick?.();
        }}
        className="absolute left-1/2 top-[var(--letter-top)] cursor-pointer border-0 bg-transparent p-0"
        style={{
          "--letter-top": `${topPercent}%`,
          zIndex: layer.zIndex,
          width: `${letterWidthPercent(layer)}%`,
          transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
        } as CSSProperties}
      >
        <Image
          src={layer.src}
          alt=""
          aria-hidden
          width={layer.width}
          height={layer.height}
          priority={priority}
          className="h-auto w-full"
        />
      </Button>
    );
  }

  return (
    <Button
      variant="unstyled"
      aria-label={`Close ${envelope.title} letter`}
      onClick={(event) => {
        event.stopPropagation();
        onLetterClick?.();
      }}
      className="letter-flip-scene absolute left-1/2 top-[var(--letter-top)] cursor-pointer border-0 bg-transparent p-0"
      style={{
        "--letter-top": `${topPercent}%`,
        "--letter-z-base": layer.zIndex,
        "--letter-z-top": 50,
        "--letter-open-scale": 1,
        width: `${letterWidthPercent(layer)}%`,
        transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
      } as CSSProperties}
    >
      <span className="letter-flip-card block h-auto w-full">
        <Image
          src={layer.src}
          alt=""
          aria-hidden
          width={layer.width}
          height={layer.height}
          priority={priority}
          className="letter-flip-face h-auto w-full"
        />
        <Image
          src={backSrc}
          alt=""
          aria-hidden
          width={backWidth}
          height={backHeight}
          priority={priority}
          className="letter-flip-face letter-flip-face--back h-auto w-full"
        />
      </span>
    </Button>
  );
}

function TopFlapLayer({
  flap,
  priority = false,
  step,
  isReady = true,
}: {
  flap: EnvelopeTopFlap;
  priority?: boolean;
  step: TopFlapStep;
  isReady?: boolean;
}) {
  const widthPercent = flap.widthPercent ?? 100;
  const topPercent = flap.topPercent ?? 0;
  const matchesFlat10Back = flap.outsideSrc.includes("/flat_10_");
  const isFlat2Flap = flap.outsideSrc.includes("/flat_2_");
  // flat_2: no open flap art — hide the whole flap once open
  if (isFlat2Flap && step === "open") {
    return null;
  }

  return (
    <div
      className={`envelope-top-flap envelope-top-flap--${step} ${
        isReady ? "envelope-top-flap--ready" : ""
      } pointer-events-none absolute left-1/2 top-[var(--top-flap-top)]`}
      style={
        {
          "--top-flap-top": matchesFlat10Back
            ? FLAT_10_TOP_FLAP_TOP
            : `${topPercent}%`,
          width: `${widthPercent}%`,
          aspectRatio: `${flap.insideWidth} / ${flap.insideHeight}`,
          transform: "translateX(-50%)",
        } as CSSProperties
      }
    >
      <div className="envelope-top-flap-card h-full w-full">
        <Image
          src={flap.insideSrc}
          alt=""
          aria-hidden
          width={flap.insideWidth}
          height={flap.insideHeight}
          priority={priority}
          className="envelope-top-flap-face h-auto w-full"
        />
        {step !== "open" ? (
          <Image
            src={flap.outsideSrc}
            alt=""
            aria-hidden
            width={flap.outsideWidth}
            height={flap.outsideHeight}
            priority={priority}
            className="envelope-top-flap-face envelope-top-flap-face--outside h-auto w-full"
          />
        ) : null}
      </div>
    </div>
  );
}

function EnvelopeVisual({
  envelope,
  priority = false,
  onLetterClick,
  onCarouselSelect,
  isZoomedEnvelope = false,
  isCarouselActive = false,
  isLoopResetting = false,
  isClosing = false,
  isTopFlapCompositionReady = false,
  composeStage = null,
  messageLeft = "",
  messageRight = "",
  senderName = "",
  recipientEmail = "",
  onMessageLeftChange,
  onMessageRightChange,
  onSendClick,
  onSenderNameChange,
  onRecipientEmailChange,
  onAddressSubmit,
  onPreviousClick,
}: {
  envelope: Envelope;
  priority?: boolean;
  onLetterClick?: () => void;
  onCarouselSelect?: () => void;
  isZoomedEnvelope?: boolean;
  /** Home carousel: only the centered card is open with the letter visible */
  isCarouselActive?: boolean;
  /** Infinite-loop remap: same card, new slot — don't replay flap/letter entrance */
  isLoopResetting?: boolean;
  isClosing?: boolean;
  isTopFlapCompositionReady?: boolean;
  composeStage?: ComposeStage | null;
  messageLeft?: string;
  messageRight?: string;
  senderName?: string;
  recipientEmail?: string;
  onMessageLeftChange?: (message: string) => void;
  onMessageRightChange?: (message: string) => void;
  onSendClick?: () => void;
  onSenderNameChange?: (name: string) => void;
  onRecipientEmailChange?: (email: string) => void;
  onAddressSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onPreviousClick?: () => void;
}) {
  const { t } = useLocale();
  const frameStyle = {
    aspectRatio: `${envelope.width} / ${envelope.height}`,
  } as CSSProperties;
  const [showStamp, setShowStamp] = useState(false);
  const stampRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const senderFilled = senderName.trim().length > 0;

    if (stampRevealTimerRef.current) {
      clearTimeout(stampRevealTimerRef.current);
      stampRevealTimerRef.current = null;
    }

    if (!senderFilled) {
      setShowStamp(false);
      return;
    }

    // Reveal after Sender typing goes idle
    stampRevealTimerRef.current = setTimeout(() => {
      setShowStamp(true);
      stampRevealTimerRef.current = null;
    }, STAMP_REVEAL_IDLE_MS);

    return () => {
      if (stampRevealTimerRef.current) {
        clearTimeout(stampRevealTimerRef.current);
        stampRevealTimerRef.current = null;
      }
    };
  }, [senderName]);

  const supportsCarouselFlapOpen = hasCarouselFlapReveal(envelope);
  const [carouselFlapStep, setCarouselFlapStep] =
    useState<TopFlapStep>("closed");
  const carouselFlapSessionRef = useRef(false);
  const [playLetterEntrance, setPlayLetterEntrance] = useState(true);

  useEffect(() => {
    if (isZoomedEnvelope || !supportsCarouselFlapOpen) {
      return;
    }

    if (!isCarouselActive) {
      carouselFlapSessionRef.current = false;
      setPlayLetterEntrance(true);
      setCarouselFlapStep("closed");
      return;
    }

    if (carouselFlapSessionRef.current) {
      return;
    }
    carouselFlapSessionRef.current = true;

    // Loop remap: new DOM slot for the same card — snap open, no letter fade-in
    if (isLoopResetting) {
      setPlayLetterEntrance(false);
      setCarouselFlapStep("open");
      return;
    }

    setPlayLetterEntrance(true);
    setCarouselFlapStep("closed");
    const openTimer = setTimeout(() => {
      setCarouselFlapStep("opening");
    }, CAROUSEL_FLAP_PAUSE_MS);
    const openedTimer = setTimeout(() => {
      setCarouselFlapStep("open");
    }, CAROUSEL_FLAP_PAUSE_MS + CAROUSEL_FLAP_OPEN_MS);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(openedTimer);
    };
  }, [
    isCarouselActive,
    isLoopResetting,
    isZoomedEnvelope,
    supportsCarouselFlapOpen,
  ]);

  const isSealedCarousel = !isZoomedEnvelope && !isCarouselActive;
  const topFlapStep =
    isZoomedEnvelope && envelope.topFlap
      ? (getTopFlapStep(composeStage) ?? "open")
      : supportsCarouselFlapOpen && !isZoomedEnvelope
        ? carouselFlapStep
        : isSealedCarousel && envelope.topFlap
          ? "closed"
          : null;
  const showCarouselLetter =
    !isSealedCarousel &&
    (!supportsCarouselFlapOpen ||
      carouselFlapStep === "opening" ||
      carouselFlapStep === "open");
  const shouldRenderComposedFlapBase = Boolean(
    envelope.topFlap?.bottomInsideSrc &&
      envelope.topFlap.bottomInsideWidth &&
      envelope.topFlap.bottomInsideHeight &&
      // flat_1 also uses backSrc as the sealed base — stacking both looks washed/transparent
      !(supportsCarouselFlapOpen && isFlat1Envelope(envelope)) &&
      (isZoomedEnvelope ||
        isSealedCarousel ||
        (supportsCarouselFlapOpen &&
          (carouselFlapStep === "closed" ||
            carouselFlapStep === "opening"))),
  );
  const isComposedFlapVisible = Boolean(
    topFlapStep && (isTopFlapCompositionReady || isSealedCarousel),
  );
  const hasBackFace = Boolean(
    envelope.topFlap?.backSrc &&
      envelope.topFlap.backWidth &&
      envelope.topFlap.backHeight,
  );
  const backFlipState =
    composeStage === "flipping-back"
      ? "flipping"
      : composeStage === "addressing" ||
          composeStage === "sending" ||
          composeStage === "success"
        ? "done"
        : null;
  const isAddressing =
    composeStage === "addressing" || composeStage === "sending";
  const backImageHeightPercent =
    hasBackFace && envelope.topFlap?.backWidth && envelope.topFlap.backHeight
      ? `${(envelope.topFlap.backHeight * envelope.width * 100) / (envelope.topFlap.backWidth * envelope.height)}%`
      : "100%";
  const letterLayer = envelope.layers?.find(
    (layer) => layer.anchor === "center",
  );
  const showBackPeekLetter =
    Boolean(
      letterLayer &&
        (letterLayer.src.includes("/flat_7_") ||
          letterLayer.src.includes("/flat_8_")),
    ) &&
    (composeStage === "flipping-back" ||
      composeStage === "addressing" ||
      composeStage === "sending" ||
      composeStage === "success");
  const stampSrc =
    isFlat1Envelope(envelope) ||
    envelope.layers?.some((layer) => layer.src.includes("/flat_2.webp"))
      ? "/images/stamp_white.webp"
      : "/images/stamp.webp";
  const usesTallAddressForm = envelope.layers?.some(
    (layer) =>
      layer.src.includes("/flat_9.webp") || layer.src.includes("/flat_10.webp"),
  );
  const usesFoldBackOffset = envelope.layers?.some(
    (layer) =>
      layer.src.includes("/flat_4.webp") || layer.src.includes("/flat_5.webp"),
  );
  const backFaceYOffset = usesTallAddressForm
    ? BACK_FACE_Y_OFFSET_TALL
    : usesFoldBackOffset
      ? BACK_FACE_Y_OFFSET_FOLD
      : 0;
  const addressFormWidth = usesTallAddressForm
    ? ADDRESS_FORM_WIDTH_TALL
    : ADDRESS_FORM_WIDTH;
  const addressForm = isAddressing ? (
    <form
      id="recipient-address-form"
      className="absolute inset-0 z-40"
      onSubmit={onAddressSubmit}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={`${
          hasBackFace ? "absolute bottom-0 left-0 w-full" : "absolute inset-0"
        }`}
        style={
          hasBackFace
            ? {
                height: backImageHeightPercent,
                transform:
                  backFaceYOffset > 0
                    ? `translateY(${backFaceYOffset}%)`
                    : undefined,
              }
            : undefined
        }
      >
        <Image
          src={stampSrc}
          alt=""
          aria-hidden
          width={160}
          height={160}
          className={`pointer-events-none absolute right-[3%] top-[3%] z-50 w-[30%] max-w-[8.5rem] transition-opacity duration-300 ${
            showStamp ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-[2%] py-[1%]"
          style={{
            width: `${addressFormWidth}%`,
          }}
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1">
            <label
              htmlFor="recipient-email"
              className="shrink-0 text-[0.5rem] uppercase text-[#ec0000] [font-family:var(--font-meta)]"
            >
              {t.recipient}
            </label>
            <input
              id="recipient-email"
              type="email"
              required
              value={recipientEmail}
              disabled={composeStage === "sending"}
              onChange={(event) =>
                onRecipientEmailChange?.(event.target.value)
              }
              placeholder="friend@example.com"
              className="min-w-0 border-0 bg-transparent text-right text-[0.5rem] text-neutral-700 outline-none placeholder:text-neutral-400 disabled:opacity-60 [font-family:var(--font-meta)]"
            />
            <label
              htmlFor="sender-name"
              className="shrink-0 text-[0.5rem] uppercase text-[#ec0000] [font-family:var(--font-meta)]"
            >
              {t.sender}
            </label>
            <input
              id="sender-name"
              type="text"
              required
              autoComplete="name"
              value={senderName}
              disabled={composeStage === "sending"}
              onChange={(event) => onSenderNameChange?.(event.target.value)}
              onBlur={() => {
                if (senderName.trim()) {
                  setShowStamp(true);
                }
              }}
              placeholder={t.yourName}
              className="min-w-0 border-0 bg-transparent text-right text-[0.5rem] text-neutral-700 outline-none placeholder:text-neutral-400 disabled:opacity-60 [font-family:var(--font-meta)]"
            />
          </div>
        </div>
      </div>
    </form>
  ) : null;

  if (envelope.layers) {
    return (
      <div
        className={`relative h-full w-auto shrink-0 ${
          isClosing && !envelope.sendable ? "envelope-visual--closing" : ""
        }`}
        style={{
          ...frameStyle,
          containerType: "size",
          transform: "translateZ(0)",
        }}
        role="img"
        aria-label={envelope.alt}
      >
        <div
          className={`envelope-back-flip-card ${
            backFlipState ? `envelope-back-flip-card--${backFlipState}` : ""
          }`}
        >
          <div className="envelope-front-face">
            {isSealedCarousel && onCarouselSelect ? (
              <Button
                variant="unstyled"
                aria-label={`Select ${envelope.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onCarouselSelect();
                }}
                className="absolute inset-0 z-30 cursor-pointer border-0 bg-transparent p-0"
              />
            ) : null}
            {hasCarouselFlapReveal(envelope) && envelope.topFlap?.backSrc ? (
              <Image
                src={envelope.topFlap.backSrc}
                alt=""
                aria-hidden
                width={envelope.topFlap.backWidth!}
                height={envelope.topFlap.backHeight!}
                priority={priority}
                style={{
                  zIndex: 0,
                  bottom: envelope.topFlap.backSrc.includes("/flat_10_")
                    ? FLAT_10_BACK_INSET
                    : undefined,
                }}
                className={`pointer-events-none absolute left-0 z-0 h-auto w-full ${
                  envelope.topFlap.backSrc.includes("/flat_10_")
                    ? ""
                    : "bottom-2"
                }`}
              />
            ) : null}
            {envelope.layers.map((layer) => {
              if (layer.anchor === "center") {
                if (!showCarouselLetter && !isZoomedEnvelope) {
                  return null;
                }

                const topPercent = layer.topPercent ?? 50;
                const hasBack = letterHasBack(layer);
                const shouldUseLetterLayer =
                  isZoomedEnvelope &&
                  (hasBack
                    ? !envelope.sendable || composeStage !== null
                    : Boolean(envelope.sendable && composeStage !== null));

                if (shouldUseLetterLayer) {
                  return (
                    <LetterFlipLayer
                      key={layer.src}
                      layer={layer}
                      envelope={envelope}
                      priority={priority}
                      onLetterClick={onLetterClick}
                      isSendable={envelope.sendable}
                      composeStage={composeStage}
                      messageLeft={messageLeft}
                      messageRight={messageRight}
                      onMessageLeftChange={onMessageLeftChange}
                      onMessageRightChange={onMessageRightChange}
                    />
                  );
                }

                return (
                  <Button
                    key={layer.src}
                    variant="unstyled"
                    aria-label={`Open ${envelope.title} letter`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onLetterClick?.();
                    }}
                    className={`${
                      playLetterEntrance ? "carousel-letter-open" : ""
                    } group absolute left-1/2 top-[var(--letter-top)] cursor-pointer border-0 bg-transparent p-0`}
                    style={{
                      "--letter-top": `${topPercent}%`,
                      zIndex: layer.zIndex,
                      width: `${letterWidthPercent(layer)}%`,
                      transform: "translate(-50%, -50%)",
                    } as CSSProperties}
                  >
                    <span className="carousel-letter-rise relative block h-auto w-full">
                      <span
                        className="relative top-0 block h-auto w-full transition-[top] duration-500 ease-out group-hover:top-[calc(-5cqh)]"
                        style={{
                          transform: `rotate(${layer.rotate ?? 0}deg)`,
                        }}
                      >
                        {letterClosedStack(layer, priority)}
                      </span>
                    </span>
                  </Button>
                );
              }

              if (
                layer.anchor === "fill" &&
                envelope.topFlap &&
                // flat_10 open look is back + bottom + flap (full fill jumps the seam)
                (layer.src.includes("/flat_10.webp") ||
                  topFlapStep === "closing" ||
                  topFlapStep === "closed" ||
                  topFlapStep === "opening")
              ) {
                return null;
              }

              const softBottomOpacity =
                layer.anchor === "bottom" &&
                (layer.src.includes("flat_7") || layer.src.includes("flat_8"));

              if (layer.anchor === "bottom") {
                // Match front-face backSrc seam inset for flat_10 only
                const isFlat10Bottom = layer.src.includes("/flat_10_");
                // flat_9 bottom sits slightly left of the back art
                const nudgeRight = layer.src.includes("/flat_9_bottom");
                // flat_1_bottom: slightly wider + optional Y nudge at all flap steps
                const isFlat1Bottom = layer.src.includes("/flat_1_bottom");

                return (
                  <div
                    key={layer.src}
                    className={`pointer-events-none absolute ${
                      isFlat1Bottom ? "left-1/2" : "left-0"
                    } ${isFlat10Bottom ? "" : "bottom-0"}`}
                    style={{
                      zIndex: layer.zIndex,
                      bottom: isFlat10Bottom ? FLAT_10_BOTTOM_INSET : undefined,
                      width: isFlat1Bottom ? "101%" : "100%",
                      transform: isFlat1Bottom
                        ? `translateX(${FLAT_1_BOTTOM_TRANSLATE_X}) translateY(${FLAT_1_BOTTOM_TRANSLATE_Y})`
                        : nudgeRight
                          ? "translateX(1.5%)"
                          : undefined,
                    }}
                  >
                    <Image
                      src={layer.src}
                      alt=""
                      aria-hidden
                      width={layer.width}
                      height={layer.height}
                      priority={priority}
                      className={`h-auto w-full${
                        softBottomOpacity ? " opacity-93" : ""
                      }`}
                    />
                  </div>
                );
              }

              return (
                <Image
                  key={layer.src}
                  src={layer.src}
                  alt=""
                  aria-hidden
                  width={layer.width}
                  height={layer.height}
                  priority={priority}
                  style={{ zIndex: layer.zIndex }}
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom"
                />
              );
            })}
            {shouldRenderComposedFlapBase && envelope.topFlap?.bottomInsideSrc && (
              <Image
                src={envelope.topFlap.bottomInsideSrc}
                alt=""
                aria-hidden
                width={envelope.topFlap.bottomInsideWidth!}
                height={envelope.topFlap.bottomInsideHeight!}
                priority={priority}
                style={{ zIndex: 1 }}
                className={`envelope-composed-base ${
                  isComposedFlapVisible ? "envelope-composed-base--ready" : ""
                } pointer-events-none absolute bottom-0 left-0 h-auto w-full`}
              />
            )}
            {envelope.topFlap && topFlapStep && (
              <TopFlapLayer
                flap={envelope.topFlap}
                priority={priority}
                step={topFlapStep}
                isReady={
                  supportsCarouselFlapOpen || isSealedCarousel
                    ? true
                    : isComposedFlapVisible
                }
              />
            )}
          </div>
          {hasBackFace && (
            <div className="envelope-back-face">
              <Image
                src={envelope.topFlap!.backSrc!}
                alt=""
                aria-hidden
                width={envelope.topFlap!.backWidth!}
                height={envelope.topFlap!.backHeight!}
                priority={priority}
                style={{
                  zIndex: 0,
                  transform:
                    backFaceYOffset > 0
                      ? `translateY(${backFaceYOffset}%)`
                      : undefined,
                }}
                className="pointer-events-none absolute bottom-2 left-0 z-0 h-auto w-full"
              />
              {showBackPeekLetter && letterLayer ? (
                <div
                  className="pointer-events-none absolute bottom-2 left-0 z-10 w-full opacity-20"
                  style={{
                    height: backImageHeightPercent,
                    transform:
                      backFaceYOffset > 0
                        ? `translateY(${backFaceYOffset}%)`
                        : undefined,
                  }}
                >
                  <Image
                    src={letterLayer.src}
                    alt=""
                    aria-hidden
                    width={letterLayer.width}
                    height={letterLayer.height}
                    priority={priority}
                    className="absolute left-1/2 top-[var(--letter-top)] h-auto"
                    style={
                      {
                        "--letter-top": `${Math.max((letterLayer.topPercent ?? 50) - BACK_PEEK_LETTER_TOP_NUDGE, 12)}%`,
                        width: `${Math.min(letterWidthPercent(letterLayer) * BACK_PEEK_LETTER_SCALE, 100)}%`,
                        transform: `translate(-50%, -50%) rotate(${letterLayer.rotate ?? 0}deg)`,
                      } as CSSProperties
                    }
                  />
                </div>
              ) : null}
              {addressForm}
            </div>
          )}
        </div>
        {!hasBackFace && addressForm}
      </div>
    );
  }

  return (
    <Image
      src={envelope.src!}
      alt={envelope.alt}
      width={envelope.width}
      height={envelope.height}
      className={`h-full w-auto object-contain object-bottom ${
        isClosing && !envelope.sendable ? "envelope-visual--closing" : ""
      }`}
      priority={priority}
    />
  );
}

export function PostcardStack() {
  const { t, envelopeCopy } = useLocale();
  const [activeIndex, setActiveIndex] = useState(
    ENVELOPES.length * CAROUSEL_CENTER_COPY + INITIAL_CENTER_INDEX,
  );
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [zoomPhase, setZoomPhase] = useState<ZoomPhase | null>(null);
  const [isLoopResetting, setIsLoopResetting] = useState(false);
  const [composeStage, setComposeStage] = useState<ComposeStage | null>(null);
  const [messageLeft, setMessageLeft] = useState("");
  const [messageRight, setMessageRight] = useState("");
  const [senderName, setSenderName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [serviceClass, setServiceClass] = useState<ServiceClass | null>(null);
  const [deliveryDaysLabel, setDeliveryDaysLabel] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [successPhase, setSuccessPhase] = useState<SuccessPhase | null>(null);
  const [isTopFlapCompositionReady, setIsTopFlapCompositionReady] =
    useState(false);
  const lastWheelAt = useRef(0);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isZooming = zoomPhase !== null;
  const isComposing = composeStage !== null;
  // Freeze carousel math while zooming so width/offset don't drift as the card grows.
  const activeOffset = activeEnvelopeOffset(activeIndex, null);
  const activeEnvelopeIndex = wrapEnvelopeIndex(activeIndex);
  const activeEnvelope = ENVELOPES[activeEnvelopeIndex];
  const activeCopy = envelopeCopy(activeEnvelope);
  const zoomedEnvelope =
    zoomedIndex === null ? null : ENVELOPES[wrapEnvelopeIndex(zoomedIndex)];

  const clearZoomTimers = useCallback(() => {
    if (zoomTimerRef.current !== null) {
      clearTimeout(zoomTimerRef.current);
      zoomTimerRef.current = null;
    }
  }, []);

  const clearActionTimers = useCallback(() => {
    actionTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    actionTimersRef.current = [];
  }, []);

  const scheduleAction = useCallback((callback: () => void, delayMs: number) => {
    const timerId = setTimeout(callback, delayMs);
    actionTimersRef.current.push(timerId);
  }, []);

  const closeZoom = useCallback(() => {
    clearZoomTimers();
    clearActionTimers();
    setZoomedIndex(null);
    setZoomPhase(null);
    setComposeStage(null);
    setMessageLeft("");
    setMessageRight("");
    setSenderName("");
    setRecipientEmail("");
    setServiceClass(null);
    setDeliveryDaysLabel("");
    setRefNumber("");
    setSendError(null);
    setSuccessPhase(null);
    setIsTopFlapCompositionReady(false);
  }, [clearActionTimers, clearZoomTimers]);

  useEffect(
    () => () => {
      clearZoomTimers();
      clearActionTimers();
    },
    [clearActionTimers, clearZoomTimers],
  );

  useEffect(() => {
    document.body.classList.toggle("envelope-zoom-active", zoomedIndex !== null);

    return () => {
      document.body.classList.remove("envelope-zoom-active");
    };
  }, [zoomedIndex]);

  useEffect(() => {
    if (isZooming) {
      return;
    }

    const firstMiddleIndex = ENVELOPES.length * CAROUSEL_CENTER_COPY;
    const firstTrailingIndex = ENVELOPES.length * (CAROUSEL_CENTER_COPY + 1);

    if (activeIndex >= firstMiddleIndex && activeIndex < firstTrailingIndex) {
      return;
    }

    const timerId = setTimeout(() => {
      setIsLoopResetting(true);
      setActiveIndex(firstMiddleIndex + wrapEnvelopeIndex(activeIndex));
      requestAnimationFrame(() => {
        setIsLoopResetting(false);
      });
    }, 720);

    return () => {
      clearTimeout(timerId);
    };
  }, [activeIndex, isZooming]);

  const startWriting = useCallback(
    (index: number) => {
      const envelope = ENVELOPES[wrapEnvelopeIndex(index)];

      if (!envelope.sendable || composeStage !== null) {
        return;
      }

      setComposeStage("writing");
      setIsTopFlapCompositionReady(false);

      if (envelope.topFlap) {
        const letterLayer = envelopeLetterLayer(envelope);
        const revealDelay = letterLayer ? letterOpenRevealMs(letterLayer) : 0;
        scheduleAction(() => {
          setIsTopFlapCompositionReady(true);
        }, revealDelay);
      }
    },
    [composeStage, scheduleAction],
  );

  const openZoom = useCallback(
    (index: number) => {
      if (zoomedIndex !== null) {
        return;
      }

      setActiveIndex(index);
      setZoomedIndex(index);
      setZoomPhase("hiding");
      setComposeStage(null);
      setMessageLeft("");
      setMessageRight("");
      setSenderName("");
      setRecipientEmail("");
      setServiceClass(null);
      setDeliveryDaysLabel("");
      setSendError(null);
      setIsTopFlapCompositionReady(false);

      zoomTimerRef.current = setTimeout(() => {
        setZoomPhase("growing");
        zoomTimerRef.current = setTimeout(() => {
          setZoomPhase("done");
          zoomTimerRef.current = null;
        }, ZOOM_GROW_MS);
      }, NEIGHBOR_HIDE_MS);
    },
    [zoomedIndex],
  );

  const handleLetterClick = useCallback(
    (index: number) => {
      if (isComposing) {
        return;
      }

      if (zoomedIndex === null) {
        openZoom(index);
        return;
      }

      if (zoomedIndex === index && zoomPhase === "done") {
        const envelope = ENVELOPES[wrapEnvelopeIndex(index)];

        if (envelope.sendable && composeStage === null) {
          startWriting(index);
        }
      }
    },
    [composeStage, isComposing, openZoom, startWriting, zoomPhase, zoomedIndex],
  );

  // Chain the flip straight after the zoom finishes so no second click is needed.
  useEffect(() => {
    if (zoomPhase !== "done" || zoomedIndex === null || composeStage !== null) {
      return;
    }

    const envelope = ENVELOPES[wrapEnvelopeIndex(zoomedIndex)];

    if (envelope.sendable) {
      startWriting(zoomedIndex);
    }
  }, [zoomPhase, zoomedIndex, composeStage, startWriting]);

  const enterAddressing = useCallback(() => {
    setRefNumber(generateRefNumber());
    setComposeStage("addressing");
  }, []);

  const handleStartAddressing = useCallback(() => {
    if (!hasCardMessage(messageLeft, messageRight)) {
      return;
    }

    clearActionTimers();
    setSendError(null);

    const letterLayer = zoomedEnvelope
      ? envelopeLetterLayer(zoomedEnvelope)
      : undefined;
    const needsFoldClose = Boolean(
      letterLayer && letterNeedsFoldClose(letterLayer),
    );
    const skipLetterFlip = Boolean(
      letterLayer &&
        letterComposesOnFront(letterLayer) &&
        !letterNeedsInsertReorient(letterLayer) &&
        !needsFoldClose,
    );
    const insertFlipDelay = skipLetterFlip
      ? 0
      : needsFoldClose
        ? LETTER_FOLD_CLOSE_MS
        : LETTER_INSERT_FLIP_MS;
    const foldClosePause = needsFoldClose ? LETTER_FOLD_CLOSE_PAUSE_MS : 0;
    const insertTotalMs =
      LETTER_INSERT_LIFT_MS +
      insertFlipDelay +
      foldClosePause +
      LETTER_INSERT_DROP_MS;

    setComposeStage("closing-lift");

    if (skipLetterFlip) {
      scheduleAction(() => {
        setComposeStage("closing-insert");
      }, LETTER_INSERT_LIFT_MS);
    } else {
      scheduleAction(() => {
        setComposeStage("closing-flip");
      }, LETTER_INSERT_LIFT_MS);

      scheduleAction(() => {
        setComposeStage("closing-insert");
      }, LETTER_INSERT_LIFT_MS + insertFlipDelay + foldClosePause);
    }

    if (zoomedEnvelope?.topFlap) {
      scheduleAction(() => {
        setComposeStage("closing-flap");
      }, insertTotalMs);

      if (zoomedEnvelope.topFlap.backSrc) {
        scheduleAction(() => {
          setComposeStage("flipping-back");
        }, insertTotalMs + FLAP_CLOSE_MS + ENVELOPE_CENTER_PAUSE_MS);

        scheduleAction(() => {
          enterAddressing();
        }, insertTotalMs + FLAP_CLOSE_MS + ENVELOPE_CENTER_PAUSE_MS + ENVELOPE_BACK_FLIP_MS);
        return;
      }

      scheduleAction(() => {
        enterAddressing();
      }, insertTotalMs + FLAP_CLOSE_MS);
      return;
    }

    scheduleAction(() => {
      enterAddressing();
    }, insertTotalMs);
  }, [
    clearActionTimers,
    enterAddressing,
    messageLeft,
    messageRight,
    scheduleAction,
    zoomedEnvelope,
  ]);

  const handleBottomSendCard = useCallback(() => {
    if (zoomedIndex === null || zoomPhase !== "done") {
      return;
    }

    if (composeStage === "success") {
      closeZoom();
      return;
    }

    if (composeStage === "addressing" || composeStage === "sending") {
      (
        document.getElementById("recipient-address-form") as HTMLFormElement | null
      )?.requestSubmit();
      return;
    }

    if (composeStage === "writing") {
      handleStartAddressing();
      return;
    }

    startWriting(zoomedIndex);
  }, [
    closeZoom,
    composeStage,
    handleStartAddressing,
    startWriting,
    zoomPhase,
    zoomedIndex,
  ]);

  const handleSendCard = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (
        !zoomedEnvelope?.sendable ||
        !senderName.trim() ||
        !recipientEmail.trim() ||
        !serviceClass ||
        !hasCardMessage(messageLeft, messageRight)
      ) {
        return;
      }

      setComposeStage("sending");
      setSendError(null);
      setDeliveryDaysLabel(
        serviceClass === "second" ? t.serviceDaysSecond : t.serviceDaysFirst,
      );

      try {
        const response = await fetch("/api/send-card", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderName: senderName.trim(),
            recipientEmail: recipientEmail.trim(),
            message: combineCardMessage(messageLeft, messageRight).trim(),
            cardTitle: zoomedEnvelope.title,
            cardImage: envelopeImageSrc(zoomedEnvelope),
            refNumber,
            serviceClass,
          }),
        });

        const result = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to send your card.");
        }

        setComposeStage("success");
        setSuccessPhase("tilt");
        const postboxAt = SUCCESS_TILT_MS + SUCCESS_TILT_HOLD_MS;
        const postingAt = postboxAt + SUCCESS_POSTBOX_MS;
        const doneAt = postingAt + SUCCESS_POSTING_MS;
        scheduleAction(() => {
          setSuccessPhase("postbox");
        }, postboxAt);
        scheduleAction(() => {
          setSuccessPhase("posting");
        }, postingAt);
        scheduleAction(() => {
          setSuccessPhase("done");
        }, doneAt);
      } catch (error) {
        setSendError(
          error instanceof Error ? error.message : "Unable to send your card.",
        );
        setComposeStage("addressing");
        setSuccessPhase(null);
      }
    },
    [
      messageLeft,
      messageRight,
      recipientEmail,
      refNumber,
      scheduleAction,
      senderName,
      serviceClass,
      t.serviceDaysFirst,
      t.serviceDaysSecond,
      zoomedEnvelope,
    ],
  );

  const isSuccessFinale = successPhase !== null;
  const isSuccessChromeHidden =
    successPhase === "tilt" ||
    successPhase === "postbox" ||
    successPhase === "posting";
  const showSuccessPostbox = isSuccessFinale;
  const showZoomClose =
    (zoomPhase === "growing" || zoomPhase === "done") && !isSuccessChromeHidden;

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLElement>) => {
      if (isComposing || isZooming) {
        event.preventDefault();
        return;
      }

      const primaryDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (Math.abs(primaryDelta) <= 10) {
        return;
      }

      event.preventDefault();

      const now = Date.now();
      if (now - lastWheelAt.current < WHEEL_COOLDOWN_MS) {
        return;
      }

      lastWheelAt.current = now;
      closeZoom();
      setActiveIndex((currentIndex) => {
        if (primaryDelta > 0) {
          return currentIndex + 1;
        }

        return currentIndex - 1;
      });
    },
    [closeZoom, isComposing, isZooming],
  );

  return (
    <section
      className="postcard-stack relative min-h-0 flex-1 overscroll-x-none bg-[#F3F9F9]"
      onWheel={handleWheel}
    >
      <div
        className={`absolute inset-0 overflow-hidden transition-colors duration-300 ${
          showSuccessPostbox ? "bg-[#DF0000]" : "bg-[#F3F9F9]"
        }`}
      >
        {isZooming && showZoomClose && (
          <Button
            variant="outline"
            onClick={closeZoom}
            aria-label="Close"
            className="absolute top-6 right-6 z-50 !min-w-0 size-10 !px-4 py-2.5 text-black"
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
        )}

        <Button
          variant="unstyled"
          aria-label="Close zoomed envelope"
          aria-hidden={
            !(zoomPhase === "growing" || zoomPhase === "done") ||
            isSuccessFinale
          }
          tabIndex={
            (zoomPhase === "growing" || zoomPhase === "done") &&
            !isSuccessFinale
              ? 0
              : -1
          }
          className={`absolute inset-0 z-10 bg-[#f3f9f9] transition-opacity ease-out ${
            (zoomPhase === "growing" || zoomPhase === "done") &&
            !showSuccessPostbox
              ? "pointer-events-auto opacity-100 duration-[900ms]"
              : "pointer-events-none opacity-0 duration-300"
          }`}
          onClick={() => {
            if (!isComposing) {
              closeZoom();
            }
          }}
        />

        {showSuccessPostbox && (
          <div className="post-landing pointer-events-none absolute inset-0 z-[15] flex items-end justify-center overflow-hidden md:items-center">
            <div className="post-stage relative">
              <Image
                src="/images/post_bottom_mobile.jpg"
                alt=""
                aria-hidden
                width={1080}
                height={1920}
                priority
                unoptimized
                className="absolute inset-0 z-0 h-full w-full object-contain md:hidden"
              />
              <Image
                src="/images/post_bottom.jpg"
                alt=""
                aria-hidden
                width={1920}
                height={1080}
                priority
                unoptimized
                className="absolute inset-0 z-0 hidden h-full w-full object-contain md:block"
              />
            </div>
          </div>
        )}

        <div
          className="absolute left-1/2 z-20 flex items-end"
          style={{
            bottom: isZooming ? ZOOMED_CHROME_OFFSET : CAROUSEL_CHROME_OFFSET,
            gap: ROW_GAP,
            transform: `translateX(calc(-1 * ${activeOffset}))`,
            transition: isLoopResetting
              ? undefined
              : isZooming
                ? `bottom ${ZOOM_GROW_MS}ms ${ZOOM_EASE}`
                : `bottom ${ZOOM_GROW_MS}ms ${ZOOM_EASE}, transform 700ms ${ZOOM_EASE}`,
          }}
        >
          {Array.from(
            { length: ENVELOPES.length * CAROUSEL_LOOP_COPIES },
            (_, index) => {
              const envelopeIndex = wrapEnvelopeIndex(index);
              return {
                envelope: ENVELOPES[envelopeIndex],
                envelopeIndex,
                index,
              };
            },
          ).map(({ envelope, index }) => {
            const isActive = index === activeIndex;
            const isHiddenNeighbor = zoomedIndex !== null && index !== zoomedIndex;
            const height = envelopeHeight(index, activeIndex, zoomedIndex);
            const isZoomTarget = zoomedIndex === index;
            const isSendableZoomTarget =
              isZoomTarget &&
              envelope.sendable &&
              zoomPhase === "done" &&
              composeStage !== null;
            const shouldAddressingZoom =
              isZoomTarget &&
              (composeStage === "flipping-back" ||
                composeStage === "addressing" ||
                composeStage === "sending" ||
                composeStage === "success");
            const addressingScale = addressingEnvelopeScale(envelope);
            const zoomScale = envelopeZoomScale(envelope);
            const zoomTranslateY = envelopeZoomTranslateY(envelope);
            const isZoomGrown =
              isZoomTarget &&
              (zoomPhase === "growing" || zoomPhase === "done");
            const isSuccessTarget = isZoomTarget && successPhase !== null;
            const zoomTransform = isSuccessTarget
              ? undefined
              : isZoomTarget
                ? shouldAddressingZoom
                  ? `translateY(${ADDRESSING_TRANSLATE_Y}) scale(${addressingScale})`
                  : composeStage === "closing-flap"
                    ? `translateY(${CLOSING_FLAP_TRANSLATE_Y}) scale(${zoomScale})`
                    : isZoomGrown
                      ? `translateY(${zoomTranslateY}) scale(${zoomScale})`
                      : undefined
                : undefined;
            const successMotionMs =
              successPhase === "posting" || successPhase === "done"
                ? SUCCESS_POSTING_MS
                : SUCCESS_TILT_MS;
            const zoomTransition = isZoomTarget
              ? isSuccessTarget
                ? `transform ${successMotionMs}ms ${ZOOM_EASE}, opacity ${successMotionMs}ms ${ZOOM_EASE}`
                : `transform ${ZOOM_GROW_MS}ms ${ZOOM_EASE}, opacity ${NEIGHBOR_HIDE_MS}ms ${ZOOM_EASE}`
              : `opacity ${NEIGHBOR_HIDE_MS}ms ${ZOOM_EASE}`;
            const successFadingOut =
              successPhase === "posting" || successPhase === "done";

            return (
              <div
                key={`${index}-${envelopeKey(envelope)}`}
                className={`relative shrink-0${
                  isSuccessTarget
                    ? ` send-success-envelope send-success-envelope--${successPhase}`
                    : ""
                }`}
                style={
                  {
                    height,
                    opacity: isHiddenNeighbor || (isSuccessTarget && successFadingOut)
                      ? 0
                      : 1,
                    pointerEvents: isHiddenNeighbor ? "none" : undefined,
                    zIndex: isActive ? 20 : 10,
                    transform: zoomTransform,
                    transformOrigin: "center center",
                    transition: zoomTransition,
                    ...(isSuccessTarget
                      ? {
                          "--send-success-scale": String(addressingScale),
                        }
                      : {}),
                  } as CSSProperties
                }
              >
                <EnvelopeVisual
                  envelope={envelope}
                  priority={isActive}
                  onLetterClick={() => handleLetterClick(index)}
                  onCarouselSelect={
                    isActive || isZooming
                      ? undefined
                      : () => setActiveIndex(index)
                  }
                  isZoomedEnvelope={zoomPhase === "done" && zoomedIndex === index}
                  isCarouselActive={isActive}
                  isLoopResetting={isLoopResetting}
                  isClosing={
                    isSendableZoomTarget &&
                    (composeStage === "closing-lift" ||
                      composeStage === "closing-flip" ||
                      composeStage === "closing-insert" ||
                      composeStage === "closing-flap")
                  }
                  isTopFlapCompositionReady={
                    isSendableZoomTarget && isTopFlapCompositionReady
                  }
                  composeStage={isSendableZoomTarget ? composeStage : null}
                  messageLeft={isSendableZoomTarget ? messageLeft : ""}
                  messageRight={isSendableZoomTarget ? messageRight : ""}
                  senderName={isSendableZoomTarget ? senderName : ""}
                  recipientEmail={isSendableZoomTarget ? recipientEmail : ""}
                  onMessageLeftChange={
                    isSendableZoomTarget ? setMessageLeft : undefined
                  }
                  onMessageRightChange={
                    isSendableZoomTarget ? setMessageRight : undefined
                  }
                  onSendClick={
                    isSendableZoomTarget ? handleStartAddressing : undefined
                  }
                  onSenderNameChange={
                    isSendableZoomTarget ? setSenderName : undefined
                  }
                  onRecipientEmailChange={
                    isSendableZoomTarget ? setRecipientEmail : undefined
                  }
                  onAddressSubmit={
                    isSendableZoomTarget ? handleSendCard : undefined
                  }
                  onPreviousClick={isSendableZoomTarget ? closeZoom : undefined}
                />
              </div>
            );
          })}
        </div>

        {showSuccessPostbox && (
          <div className="post-landing pointer-events-none absolute inset-0 z-30 flex items-end justify-center overflow-hidden md:items-center">
            <div className="post-stage relative">
              <Image
                src="/images/post_top_mobile.webp"
                alt=""
                aria-hidden
                width={1080}
                height={1920}
                priority
                unoptimized
                className="pointer-events-none absolute inset-0 z-20 h-full w-full object-contain md:hidden"
              />
              <Image
                src="/images/post_top_send.webp"
                alt=""
                aria-hidden
                width={1920}
                height={1080}
                priority
                unoptimized
                className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full object-contain md:block"
              />
            </div>
          </div>
        )}
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-30 flex flex-col items-center justify-center bg-white px-10 py-12 text-center transition-opacity duration-500 ease-out md:px-6 md:pb-6 md:pt-4 ${
          isZooming
            ? "pointer-events-none opacity-0"
            : "pointer-events-auto opacity-100"
        }`}
        style={{ minHeight: "var(--carousel-chrome-offset)" }}
        aria-hidden={isZooming}
      >
        <div key={activeIndex} className="flex max-w-lg flex-col items-center md:max-w-none">
          <h2>{activeCopy.title}</h2>
          <p className="text-sm text-neutral-500">{activeCopy.subtitle}</p>
          <p className="mt-2 text-sm leading-snug text-neutral-600 md:hidden">
            {activeCopy.description}
          </p>
          {activeCopy.descriptionNote ? (
            <p className="mt-1.5 text-xs leading-snug text-neutral-500 md:hidden">
              {activeCopy.descriptionNote}
            </p>
          ) : null}
          <div className="mt-3 flex items-center justify-center gap-3 md:mt-5">
            <Button variant="outline" onClick={() => setDetailsOpen(true)}>
              {t.viewDetails}
            </Button>
            <Button variant="primary" onClick={() => openZoom(activeIndex)}>
              {t.sendCard}
              <span aria-hidden className="text-sm leading-none">
                ↗
              </span>
            </Button>
          </div>
        </div>
      </div>

      {sendError &&
        isZooming &&
        zoomPhase === "done" &&
        zoomedEnvelope?.sendable &&
        (composeStage === "addressing" || composeStage === "sending") && (
          <p className="text-status absolute inset-x-0 bottom-24 z-40 px-6 text-center">
            {sendError}
          </p>
        )}

      <div
        className={`absolute inset-x-0 bottom-0 z-40 flex flex-col items-center gap-4 border-t border-neutral-200 bg-white px-6 py-4 transition-opacity duration-700 ease-out md:flex-row md:justify-between ${
          isZooming &&
          (zoomPhase === "growing" || zoomPhase === "done") &&
          zoomedEnvelope &&
          !isSuccessChromeHidden
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={
          !(
            isZooming &&
            (zoomPhase === "growing" || zoomPhase === "done") &&
            zoomedEnvelope &&
            !isSuccessChromeHidden
          )
        }
      >
        {zoomedEnvelope ? (
          <>
            {composeStage === "success" ? (
              <p className="min-w-0 flex-1 text-center text-sm text-neutral-900 md:text-left [font-family:var(--font-meta)]">
                {t.cardOnItsWay.replace(
                  "{days}",
                  deliveryDaysLabel ||
                    (serviceClass === "second"
                      ? t.serviceDaysSecond
                      : t.serviceDaysFirst),
                )}
              </p>
            ) : (
              <fieldset className="flex min-w-0 flex-1 flex-col items-center gap-2 border-0 p-0 md:flex-row md:flex-wrap md:items-center md:justify-start md:gap-x-6 md:gap-y-2">
                <legend className="text-eyebrow sr-only">{t.serviceType}</legend>
                <span aria-hidden className="text-eyebrow shrink-0">
                  {t.serviceType}
                </span>
                <div className="flex flex-col items-center gap-2 md:flex-row md:flex-wrap md:items-center md:gap-x-6 md:gap-y-2">
                  {SERVICE_CLASS_OPTIONS.map((option) => {
                    const selected = serviceClass === option;
                    const label =
                      option === "first" ? t.serviceFirst : t.serviceSecond;

                    return (
                      <label
                        key={option}
                        className="flex cursor-pointer items-center gap-2 text-sm text-neutral-900"
                        onClick={() => setServiceClass(option)}
                      >
                        <input
                          type="radio"
                          name="service-class"
                          value={option}
                          checked={selected}
                          onChange={() => setServiceClass(option)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className="flex h-4 w-4 shrink-0 items-center justify-center border border-neutral-900 bg-white"
                        >
                          {selected ? (
                            <span className="block h-2 w-2 bg-neutral-900" />
                          ) : null}
                        </span>
                        {label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}
            <div className="flex shrink-0 items-center gap-3">
              <Button
                variant="primary"
                onClick={handleBottomSendCard}
                disabled={
                  (composeStage === "writing" &&
                    (!hasCardMessage(messageLeft, messageRight) ||
                      !serviceClass)) ||
                  ((composeStage === "addressing" ||
                    composeStage === "sending") &&
                    !serviceClass)
                }
              >
                {composeStage === "sending" && (
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                )}
                {composeStage === "success"
                  ? t.pickAnother
                  : composeStage === "sending"
                    ? t.sending
                    : composeStage === "addressing"
                      ? t.send
                      : t.sendCard}
                {composeStage !== "sending" && composeStage !== "success" && (
                  <span aria-hidden className="text-sm leading-none">
                    ↗
                  </span>
                )}
              </Button>
            </div>
          </>
        ) : null}
      </div>

      <ViewDetailsModal
        open={detailsOpen}
        envelopeTitle={activeEnvelope.title}
        onClose={() => setDetailsOpen(false)}
      />
    </section>
  );
}
