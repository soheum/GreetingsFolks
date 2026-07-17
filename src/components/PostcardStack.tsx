"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, KeyboardEvent, WheelEvent } from "react";
import { Button } from "./Button";
import {
  ENVELOPES,
  INITIAL_CENTER_INDEX,
  type Envelope,
  type EnvelopeLayer,
  type EnvelopeTopFlap,
} from "@/data/envelopes";

const CENTER_HEIGHT = "54vh";
const SIDE_HEIGHT = "28vh";
const ZOOM_SCALE = 2;
const LETTER_OPEN_SCALE = 2;
const ROW_GAP = "0.25rem";
const WHEEL_COOLDOWN_MS = 650;
const NEIGHBOR_HIDE_MS = 500;
const ZOOM_GROW_MS = 1300;
const ZOOM_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const CAROUSEL_CHROME_OFFSET = "13rem";
const ZOOMED_CHROME_OFFSET = "8rem";
const LETTER_FLIP_REVEAL_MS = 3000;
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
const MAX_MESSAGE_LENGTH = 420;
const LETTER_SIZE_MULTIPLIER = 1.125;
/** Shift the address-side peek letter up (percent of back panel height) */
const BACK_PEEK_LETTER_TOP_NUDGE = 12;
/** Scale the address-side peek letter vs normal letter width (1.1 = 10% bigger) */
const BACK_PEEK_LETTER_SCALE = 1.05;
const CAROUSEL_LOOP_COPIES = 3;
const CAROUSEL_CENTER_COPY = 1;

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function generateRefNumber() {
  return `#${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}
const MAX_COLUMN_LENGTH = MAX_MESSAGE_LENGTH / 2;

function letterWidthPercent(layer: EnvelopeLayer) {
  return Math.min((layer.widthPercent ?? 50) * LETTER_SIZE_MULTIPLIER, 100);
}

function addressingEnvelopeScale(envelope: Envelope) {
  const letterLayer = envelope.layers?.find(
    (layer) => layer.anchor === "center" && layer.backSrc,
  );

  if (!letterLayer) {
    return LETTER_OPEN_SCALE;
  }

  return LETTER_OPEN_SCALE * (letterWidthPercent(letterLayer) / 100);
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

type InsertStep = "lift" | "flip" | "insert" | "done";
type TopFlapStep = "open" | "closing" | "closed";

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

  let left = text.slice(0, MAX_COLUMN_LENGTH);
  measure.value = left;

  while (left.length > 0 && measure.scrollHeight > measure.clientHeight) {
    left = left.slice(0, -1);
    measure.value = left;
  }

  document.body.removeChild(measure);

  const overflow = text.slice(left.length, MAX_COLUMN_LENGTH) + text.slice(MAX_COLUMN_LENGTH);
  return { left, overflow };
}

function envelopeKey(envelope: Envelope) {
  return envelope.src ?? envelope.layers?.[0].src ?? envelope.alt;
}

function wrapEnvelopeIndex(index: number) {
  return ((index % ENVELOPES.length) + ENVELOPES.length) % ENVELOPES.length;
}

function envelopeImageSrc(envelope: Envelope) {
  return (
    envelope.layers?.find((layer) => layer.anchor === "fill")?.src ??
    envelope.src ??
    ""
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
  const leftRef = useRef<HTMLTextAreaElement>(null);
  const rightRef = useRef<HTMLTextAreaElement>(null);
  const topPercent = layer.topPercent ?? 50;
  const backSrc = layer.backSrc!;
  const backWidth = layer.backWidth!;
  const backHeight = layer.backHeight!;
  const canWrite = isSendable && composeStage === "writing";
  const insertStep = getInsertStep(composeStage ?? null);
  const isInserting = insertStep !== null;
  const showComposeMessage =
    isSendable &&
    (composeStage === "writing" ||
      composeStage === "closing-lift" ||
      composeStage === "closing-flip");
  const leftValue = messageLeft ?? "";
  const rightValue = messageRight ?? "";
  const textareaClassName =
    "card-message-input h-full min-w-0 flex-1 resize-none border-0 bg-transparent px-1 pt-1 pb-3 text-neutral-800 shadow-none outline-none focus:border-0 focus:shadow-none focus:outline-none focus-visible:outline-none";

  const handleLeftChange = (value: string) => {
    const el = leftRef.current;
    if (!el) {
      onMessageLeftChange?.(value.slice(0, MAX_COLUMN_LENGTH));
      return;
    }

    const { left, overflow } = splitTextToFitColumn(value, el);
    onMessageLeftChange?.(left);

    if (overflow) {
      const rightEl = rightRef.current;
      if (!rightEl) {
        return;
      }

      const { left: fittedRight } = splitTextToFitColumn(overflow + rightValue, rightEl);
      onMessageRightChange?.(fittedRight);
      requestAnimationFrame(() => {
        rightRef.current?.focus();
        const position = Math.min(overflow.length, fittedRight.length);
        rightRef.current?.setSelectionRange(position, position);
      });
    }
  };

  const appendToRightColumn = (text: string) => {
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

    const { left, overflow } = splitTextToFitColumn(leftValue + event.key, el);
    if (!overflow) {
      return;
    }

    event.preventDefault();
    onMessageLeftChange?.(left);
    appendToRightColumn(overflow);
  };

  const handleRightChange = (value: string) => {
    const el = rightRef.current;
    if (!el) {
      onMessageRightChange?.(value.slice(0, MAX_COLUMN_LENGTH));
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
      target.selectionEnd === 0 &&
      rightValue.length === 0
    ) {
      leftRef.current?.focus();
      return;
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

  if (isSendable) {
    return (
      <div
        className={`absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0 ${
          isInserting
            ? `letter-insert-scene letter-insert-scene--${insertStep}`
            : "letter-flip-scene"
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
              ? `letter-insert-card letter-insert-card--${insertStep}`
              : "letter-flip-card"
          }`}
        >
          <Image
            src={layer.src}
            alt=""
            aria-hidden
            width={layer.width}
            height={layer.height}
            priority={priority}
            className="letter-flip-face h-auto w-full"
          />
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
              className={`letter-compose absolute inset-[8%_8%_9%] flex flex-col justify-end pt-[10%] pb-[2%] px-[0%] ${
                !showComposeMessage
                  ? "pointer-events-none opacity-0"
                  : canWrite
                    ? "letter-compose--ready"
                    : "letter-compose--visible pointer-events-none"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="letter-compose-columns flex h-[80%] w-full gap-1">
                <label className="sr-only" htmlFor="card-message-left">
                  Write your card message, left column
                </label>
                <textarea
                  ref={leftRef}
                  id="card-message-left"
                  value={leftValue}
                  maxLength={MAX_COLUMN_LENGTH}
                  readOnly={!canWrite}
                  onChange={(event) => handleLeftChange(event.target.value)}
                  onKeyDown={handleLeftKeyDown}
                  placeholder="Write your letter here..."
                  className={textareaClassName}
                />
                <label className="sr-only" htmlFor="card-message-right">
                  Write your card message, right column
                </label>
                <textarea
                  ref={rightRef}
                  id="card-message-right"
                  value={rightValue}
                  maxLength={MAX_COLUMN_LENGTH}
                  readOnly={!canWrite}
                  onChange={(event) => handleRightChange(event.target.value)}
                  onKeyDown={handleRightKeyDown}
                  placeholder={leftValue.length >= MAX_COLUMN_LENGTH ? "Continue here..." : ""}
                  className={textareaClassName}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
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

  return (
    <div
      className={`envelope-top-flap envelope-top-flap--${step} ${
        isReady ? "envelope-top-flap--ready" : ""
      } pointer-events-none absolute left-1/2 top-[var(--top-flap-top)]`}
      style={
        {
          "--top-flap-top": `${topPercent}%`,
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
        <Image
          src={flap.outsideSrc}
          alt=""
          aria-hidden
          width={flap.outsideWidth}
          height={flap.outsideHeight}
          priority={priority}
          className="envelope-top-flap-face envelope-top-flap-face--outside h-auto w-full"
        />
      </div>
    </div>
  );
}

function EnvelopeVisual({
  envelope,
  priority = false,
  onLetterClick,
  isZoomedEnvelope = false,
  isClosing = false,
  isTopFlapCompositionReady = false,
  composeStage = null,
  messageLeft = "",
  messageRight = "",
  recipientEmail = "",
  refNumber = "",
  sentOn = "",
  expectedDelivery = "",
  onMessageLeftChange,
  onMessageRightChange,
  onSendClick,
  onRecipientEmailChange,
  onAddressSubmit,
  onPreviousClick,
}: {
  envelope: Envelope;
  priority?: boolean;
  onLetterClick?: () => void;
  isZoomedEnvelope?: boolean;
  isClosing?: boolean;
  isTopFlapCompositionReady?: boolean;
  composeStage?: ComposeStage | null;
  messageLeft?: string;
  messageRight?: string;
  recipientEmail?: string;
  refNumber?: string;
  sentOn?: string;
  expectedDelivery?: string;
  onMessageLeftChange?: (message: string) => void;
  onMessageRightChange?: (message: string) => void;
  onSendClick?: () => void;
  onRecipientEmailChange?: (email: string) => void;
  onAddressSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  onPreviousClick?: () => void;
}) {
  const frameStyle = {
    aspectRatio: `${envelope.width} / ${envelope.height}`,
  } as CSSProperties;
  const topFlapStep =
    isZoomedEnvelope && envelope.topFlap
      ? (getTopFlapStep(composeStage) ?? "open")
      : null;
  const shouldRenderComposedFlapBase = Boolean(
    isZoomedEnvelope &&
      envelope.topFlap?.bottomInsideSrc &&
      envelope.topFlap.bottomInsideWidth &&
      envelope.topFlap.bottomInsideHeight,
  );
  const isComposedFlapVisible = Boolean(
    topFlapStep && isTopFlapCompositionReady,
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
    Boolean(letterLayer) &&
    (composeStage === "flipping-back" ||
      composeStage === "addressing" ||
      composeStage === "sending" ||
      composeStage === "success");
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
        style={hasBackFace ? { height: backImageHeightPercent } : undefined}
      >
        <Image
          src="/images/stamp.webp"
          alt=""
          aria-hidden
          width={160}
          height={160}
          className="pointer-events-none absolute right-[3%] top-[3%] z-50 w-[30%] max-w-[8.5rem]"
        />
        <div className="absolute bottom-0 left-0 flex h-[60%] w-full flex-col justify-end mb-6">
          <div className="mx-[4%] py-[2%] rounded-md bg-white shadow-[0_12px_30px_rgba(0,0,0,0.1)]">
            <div className="relative flex flex-col px-[3.5%] py-[1%]">
              <span
                aria-hidden
                className="absolute left-[2%] right-[2%] top-0 border-t-[0.5px] border-[#ec0000]"
              />
              <p className="text-label text-[#ec0000]">Recipient</p>
              <label htmlFor="recipient-email" className="sr-only">
                Recipient email
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
                className="text-letter mt-1 w-full border-0 bg-transparent text-neutral-700 outline-none placeholder:text-neutral-400 disabled:opacity-60"
              />
            </div>
            <div className="relative flex flex-col px-[3.5%] py-[1%]">
              <span
                aria-hidden
                className="absolute left-[2%] right-[2%] top-0 border-t-[0.5px] border-[#ec0000]"
              />
              <p className="text-label text-[#ec0000]">Ref Number</p>
              <p className="text-letter mt-1 truncate text-neutral-700">
                {refNumber}
              </p>
            </div>
            <div className="relative grid grid-cols-2 px-[3.5%] py-[1%]">
              <span
                aria-hidden
                className="absolute left-[2%] right-[2%] top-0 border-t-[0.5px] border-[#ec0000]"
              />
              <span
                aria-hidden
                className="absolute bottom-0 left-[2%] right-[2%] border-b-[0.5px] border-[#ec0000]"
              />
              <div className="flex flex-col py-[1%] pr-[3.5%]">
                <p className="text-label text-[#ec0000]">Sent On</p>
                <p className="text-letter mt-1 text-neutral-700">{sentOn}</p>
              </div>
              <div className="relative flex flex-col py-[1%] pl-[3.5%]">
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 top-0 border-l-[0.5px] border-[#ec0000]"
                />
                <p className="text-label text-[#ec0000]">Expected Delivery</p>
                <p className="text-letter mt-1 text-neutral-700">
                  {expectedDelivery}
                </p>
              </div>
            </div>
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
            {envelope.layers.map((layer) => {
              if (layer.anchor === "center") {
                const topPercent = layer.topPercent ?? 50;
                const shouldFlip =
                  isZoomedEnvelope &&
                  layer.backSrc &&
                  layer.backWidth &&
                  layer.backHeight &&
                  (!envelope.sendable || composeStage !== null);

                if (shouldFlip) {
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
                    className="group absolute left-1/2 top-[var(--letter-top)] cursor-pointer border-0 bg-transparent p-0"
                    style={{
                      "--letter-top": `${topPercent}%`,
                      zIndex: layer.zIndex,
                      width: `${letterWidthPercent(layer)}%`,
                      transform: "translate(-50%, -50%)",
                    } as CSSProperties}
                  >
                    <span
                      className="relative top-0 block h-auto w-full transition-[top] duration-500 ease-out group-hover:top-[calc(-5cqh)]"
                      style={{
                        transform: `rotate(${layer.rotate ?? 0}deg)`,
                      }}
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
                    </span>
                  </Button>
                );
              }

              if (
                layer.anchor === "fill" &&
                envelope.topFlap &&
                (topFlapStep === "closing" || topFlapStep === "closed")
              ) {
                return null;
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
                  className={
                    layer.anchor === "fill"
                      ? "pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom"
                      : layer.anchor === "bottom"
                        ? "pointer-events-none absolute bottom-0 left-0 h-auto w-full opacity-93"
                        : "pointer-events-none absolute bottom-0 left-0 h-auto w-full"
                  }
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
                isReady={isComposedFlapVisible}
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
                className="pointer-events-none absolute bottom-2 left-0 h-auto w-full"
              />
              {showBackPeekLetter && letterLayer ? (
                <div
                  className="pointer-events-none absolute bottom-2 left-0 z-10 w-full opacity-20"
                  style={{ height: backImageHeightPercent }}
                >
                  <Image
                    src={letterLayer.src}
                    alt=""
                    aria-hidden
                    width={letterLayer.width}
                    height={letterLayer.height}
                    priority={priority}
                    className="absolute left-1/2 top-[var(--letter-top)] h-auto -translate-x-1/2 -translate-y-1/2"
                    style={
                      {
                        "--letter-top": `${Math.max((letterLayer.topPercent ?? 50) - BACK_PEEK_LETTER_TOP_NUDGE, 12)}%`,
                        width: `${Math.min(letterWidthPercent(letterLayer) * BACK_PEEK_LETTER_SCALE, 100)}%`,
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
  const [activeIndex, setActiveIndex] = useState(
    ENVELOPES.length * CAROUSEL_CENTER_COPY + INITIAL_CENTER_INDEX,
  );
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
  const [zoomPhase, setZoomPhase] = useState<ZoomPhase | null>(null);
  const [isLoopResetting, setIsLoopResetting] = useState(false);
  const [composeStage, setComposeStage] = useState<ComposeStage | null>(null);
  const [messageLeft, setMessageLeft] = useState("");
  const [messageRight, setMessageRight] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [sentOn, setSentOn] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
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
    setRecipientEmail("");
    setRefNumber("");
    setSentOn("");
    setExpectedDelivery("");
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
        scheduleAction(() => {
          setIsTopFlapCompositionReady(true);
        }, LETTER_FLIP_REVEAL_MS);
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
      setRecipientEmail("");
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
    const now = new Date();
    setRefNumber(generateRefNumber());
    setSentOn(formatDisplayDate(now));
    setExpectedDelivery(
      formatDisplayDate(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    );
    setComposeStage("addressing");
  }, []);

  const handleStartAddressing = useCallback(() => {
    if (!hasCardMessage(messageLeft, messageRight)) {
      return;
    }

    clearActionTimers();
    setSendError(null);
    setComposeStage("closing-lift");

    scheduleAction(() => {
      setComposeStage("closing-flip");
    }, LETTER_INSERT_LIFT_MS);

    scheduleAction(() => {
      setComposeStage("closing-insert");
    }, LETTER_INSERT_LIFT_MS + LETTER_INSERT_FLIP_MS);

    if (zoomedEnvelope?.topFlap) {
      scheduleAction(() => {
        setComposeStage("closing-flap");
      }, LETTER_INSERT_TOTAL_MS);

      if (zoomedEnvelope.topFlap.backSrc) {
        scheduleAction(() => {
          setComposeStage("flipping-back");
        }, LETTER_INSERT_TOTAL_MS + FLAP_CLOSE_MS + ENVELOPE_CENTER_PAUSE_MS);

        scheduleAction(() => {
          enterAddressing();
        }, LETTER_INSERT_TOTAL_MS + FLAP_CLOSE_MS + ENVELOPE_CENTER_PAUSE_MS + ENVELOPE_BACK_FLIP_MS);
        return;
      }

      scheduleAction(() => {
        enterAddressing();
      }, LETTER_INSERT_TOTAL_MS + FLAP_CLOSE_MS);
      return;
    }

    scheduleAction(() => {
      enterAddressing();
    }, LETTER_INSERT_TOTAL_MS);
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
        !recipientEmail.trim() ||
        !hasCardMessage(messageLeft, messageRight)
      ) {
        return;
      }

      setComposeStage("sending");
      setSendError(null);

      try {
        const response = await fetch("/api/send-card", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientEmail: recipientEmail.trim(),
            message: combineCardMessage(messageLeft, messageRight).trim(),
            cardTitle: zoomedEnvelope.title,
            cardImage: envelopeImageSrc(zoomedEnvelope),
            refNumber,
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
      className="relative min-h-0 flex-1 overscroll-x-none bg-[#F3F9F9]"
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
            const isZoomGrown =
              isZoomTarget &&
              (zoomPhase === "growing" || zoomPhase === "done");
            const isSuccessTarget = isZoomTarget && successPhase !== null;
            const zoomTransform = isSuccessTarget
              ? undefined
              : isZoomTarget
                ? shouldAddressingZoom
                  ? `translateY(-28vh) scale(${addressingScale})`
                  : composeStage === "closing-flap"
                    ? `translateY(-20vh) scale(${ZOOM_SCALE})`
                    : isZoomGrown
                      ? `scale(${ZOOM_SCALE})`
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
                  isZoomedEnvelope={zoomPhase === "done" && zoomedIndex === index}
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
                  recipientEmail={isSendableZoomTarget ? recipientEmail : ""}
                  refNumber={isSendableZoomTarget ? refNumber : ""}
                  sentOn={isSendableZoomTarget ? sentOn : ""}
                  expectedDelivery={
                    isSendableZoomTarget ? expectedDelivery : ""
                  }
                  onMessageLeftChange={
                    isSendableZoomTarget ? setMessageLeft : undefined
                  }
                  onMessageRightChange={
                    isSendableZoomTarget ? setMessageRight : undefined
                  }
                  onSendClick={
                    isSendableZoomTarget ? handleStartAddressing : undefined
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
                src="/images/post_top_mobile.png"
                alt=""
                aria-hidden
                width={1080}
                height={1920}
                priority
                unoptimized
                className="pointer-events-none absolute inset-0 z-20 h-full w-full object-contain md:hidden"
              />
              <Image
                src="/images/post_top_send.png"
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
        className={`absolute inset-x-0 bottom-0 z-30 flex min-h-52 flex-col items-center justify-center bg-white px-6 pb-10 pt-5 text-center transition-opacity duration-500 ease-out ${
          isZooming
            ? "pointer-events-none opacity-0"
            : "pointer-events-auto opacity-100"
        }`}
        aria-hidden={isZooming}
      >
        <div key={activeIndex} className="flex flex-col items-center">
          <h2>{activeEnvelope.title}</h2>
          <p className="text-lead">{activeEnvelope.subtitle}</p>
          <p className="mt-2 h-[4.875rem] max-w-xl line-clamp-4 whitespace-pre-line">
            {activeEnvelope.description}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Button variant="outline">View details</Button>
            <Button variant="primary" onClick={() => openZoom(activeIndex)}>
              Send card
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
        className={`absolute inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-neutral-200 bg-white px-6 py-4 transition-opacity duration-700 ease-out ${
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
            <h3 className="truncate">{zoomedEnvelope.title}</h3>
            <div className="flex shrink-0 items-center gap-3">
              <Button variant="outline">View details</Button>
              <Button
                variant="primary"
                onClick={handleBottomSendCard}
                disabled={
                  composeStage === "writing" &&
                  !hasCardMessage(messageLeft, messageRight)
                }
              >
                {composeStage === "sending" && (
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                )}
                {composeStage === "success"
                  ? "Pick another"
                  : composeStage === "sending"
                    ? "Sending..."
                    : composeStage === "addressing"
                      ? "Send"
                      : "Send card"}
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
    </section>
  );
}
