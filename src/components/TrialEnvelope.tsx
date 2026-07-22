"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { Button } from "./Button";
import { ENVELOPES, type Envelope, type EnvelopeLayer } from "@/data/envelopes";

const LETTER_OPEN_SCALE = 1.5;
const LETTER_FLIP_MS = 3000;
const MAX_MESSAGE_LENGTH = 420;
const MAX_COLUMN_LENGTH = MAX_MESSAGE_LENGTH / 2;
const LETTER_SIZE_MULTIPLIER = 1.125;

const FLAT_1_ENVELOPE = ENVELOPES.find(
  (envelope) =>
    envelope.layers?.some((layer) => layer.src === "/images/flat_1.webp"),
)!;

type TrialStage = "idle" | "writing";

function letterWidthPercent(layer: EnvelopeLayer) {
  return Math.min((layer.widthPercent ?? 50) * LETTER_SIZE_MULTIPLIER, 100);
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

  const overflow =
    text.slice(left.length, MAX_COLUMN_LENGTH) + text.slice(MAX_COLUMN_LENGTH);
  return { left, overflow };
}

function TrialLetter({
  layer,
  stage,
  messageLeft,
  messageRight,
  onMessageLeftChange,
  onMessageRightChange,
  onClick,
}: {
  layer: EnvelopeLayer;
  stage: TrialStage;
  messageLeft: string;
  messageRight: string;
  onMessageLeftChange: (value: string) => void;
  onMessageRightChange: (value: string) => void;
  onClick: () => void;
}) {
  const leftRef = useRef<HTMLTextAreaElement>(null);
  const rightRef = useRef<HTMLTextAreaElement>(null);
  const topPercent = layer.topPercent ?? 50;
  const backSrc = layer.backSrc!;
  const backWidth = layer.backWidth!;
  const backHeight = layer.backHeight!;
  const isWriting = stage === "writing";
  const showCompose = isWriting;
  const canWrite = isWriting;

  const textareaClassName =
    "card-message-input h-full min-w-0 flex-1 resize-none border-0 bg-transparent px-1 pt-1 pb-3 text-neutral-800 shadow-none outline-none focus:border-0 focus:shadow-none focus:outline-none focus-visible:outline-none";

  const handleLeftChange = (value: string) => {
    const el = leftRef.current;
    if (!el) {
      onMessageLeftChange(value.slice(0, MAX_COLUMN_LENGTH));
      return;
    }

    const { left, overflow } = splitTextToFitColumn(value, el);
    onMessageLeftChange(left);

    if (overflow) {
      const rightEl = rightRef.current;
      if (!rightEl) return;

      const { left: fittedRight } = splitTextToFitColumn(
        overflow + messageRight,
        rightEl,
      );
      onMessageRightChange(fittedRight);
      requestAnimationFrame(() => {
        rightRef.current?.focus();
        const position = Math.min(overflow.length, fittedRight.length);
        rightRef.current?.setSelectionRange(position, position);
      });
    }
  };

  const appendToRightColumn = (text: string) => {
    const rightEl = rightRef.current;
    if (!rightEl) return;

    const selectionStart = rightEl.selectionStart ?? messageRight.length;
    const selectionEnd = rightEl.selectionEnd ?? messageRight.length;
    const candidate =
      messageRight.slice(0, selectionStart) +
      text +
      messageRight.slice(selectionEnd);
    const { left: fittedRight } = splitTextToFitColumn(candidate, rightEl);

    onMessageRightChange(fittedRight);
    requestAnimationFrame(() => {
      rightRef.current?.focus();
      const position = Math.min(
        selectionStart + text.length,
        fittedRight.length,
      );
      rightRef.current?.setSelectionRange(position, position);
    });
  };

  const handleLeftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    const isPrintable =
      event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;

    if (!isPrintable) return;

    const typingAtEnd =
      el.selectionStart === messageLeft.length &&
      el.selectionEnd === messageLeft.length;
    if (!typingAtEnd) return;

    const { left, overflow } = splitTextToFitColumn(messageLeft + event.key, el);
    if (!overflow) return;

    event.preventDefault();
    onMessageLeftChange(left);
    appendToRightColumn(overflow);
  };

  const handleRightChange = (value: string) => {
    const el = rightRef.current;
    if (!el) {
      onMessageRightChange(value.slice(0, MAX_COLUMN_LENGTH));
      return;
    }

    const { left } = splitTextToFitColumn(value, el);
    onMessageRightChange(left);
  };

  const handleRightKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget;

    if (
      event.key === "Backspace" &&
      target.selectionStart === 0 &&
      target.selectionEnd === 0 &&
      messageRight.length === 0
    ) {
      leftRef.current?.focus();
      return;
    }

    const isPrintable =
      event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;

    if (!isPrintable) return;

    const typingAtEnd =
      target.selectionStart === messageRight.length &&
      target.selectionEnd === messageRight.length;
    if (!typingAtEnd) return;

    const { left, overflow } = splitTextToFitColumn(messageRight + event.key, target);
    if (!overflow) return;

    event.preventDefault();
    onMessageRightChange(left);
  };

  const isIdle = stage === "idle";

  const sceneClass = isWriting ? "letter-flip-scene" : "";
  const cardClass = isWriting ? "letter-flip-card" : "";

  const buttonStyle = {
    "--letter-top": `${topPercent}%`,
    "--letter-z-base": layer.zIndex,
    "--letter-z-top": 50,
    "--letter-open-scale": LETTER_OPEN_SCALE,
    width: `${letterWidthPercent(layer)}%`,
    transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
    zIndex: isIdle ? layer.zIndex : undefined,
  } as CSSProperties;

  if (isIdle) {
    return (
      <Button
        variant="unstyled"
        aria-label="Open letter"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className="group absolute left-1/2 top-[var(--letter-top)] cursor-pointer border-0 bg-transparent p-0"
        style={buttonStyle}
      >
        <span className="relative top-0 block h-auto w-full transition-[top] duration-500 ease-out group-hover:top-[calc(-5cqh)]">
          <Image
            src={layer.src}
            alt=""
            aria-hidden
            width={layer.width}
            height={layer.height}
            priority
            className="h-auto w-full"
          />
        </span>
      </Button>
    );
  }

  return (
    <div
      className={`absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0 ${sceneClass}`}
      style={buttonStyle}
    >
      <div className={`block h-auto w-full ${cardClass}`}>
        <Image
          src={layer.src}
          alt=""
          aria-hidden
          width={layer.width}
          height={layer.height}
          priority
          className="letter-flip-face h-auto w-full"
        />
        <div className="letter-flip-face letter-flip-face--back block h-auto w-full">
          <Image
            src={backSrc}
            alt=""
            aria-hidden
            width={backWidth}
            height={backHeight}
            priority
            className="h-auto w-full"
          />
          <div
            className={`letter-compose absolute ${
              layer.composeShape === "oval-bottom"
                ? "letter-compose--oval-bottom"
                : layer.composeShape === "taper-bottom"
                  ? "letter-compose--taper-bottom"
                  : "inset-[8%_8%_9%]"
            } flex flex-col px-[0%] ${
              layer.composeShape === "oval-bottom" ||
              layer.composeShape === "taper-bottom"
                ? "justify-start pb-[0%] pt-[0%]"
                : "justify-end pb-[2%] pt-[10%]"
            } ${
              !showCompose
                ? "pointer-events-none opacity-0"
                : canWrite
                  ? "letter-compose--ready"
                  : "letter-compose--visible pointer-events-none"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`letter-compose-columns flex w-full gap-1 ${
                layer.composeShape === "oval-bottom" ||
                layer.composeShape === "taper-bottom"
                  ? "h-full"
                  : "h-[80%]"
              }`}
            >
              <label className="sr-only" htmlFor="trial-message-left">
                Write your card message, left column
              </label>
              <textarea
                ref={leftRef}
                id="trial-message-left"
                value={messageLeft}
                maxLength={MAX_COLUMN_LENGTH}
                readOnly={!canWrite}
                onChange={(event) => handleLeftChange(event.target.value)}
                onKeyDown={handleLeftKeyDown}
                placeholder="Write your letter here..."
                className={textareaClassName}
              />
              <label className="sr-only" htmlFor="trial-message-right">
                Write your card message, right column
              </label>
              <textarea
                ref={rightRef}
                id="trial-message-right"
                value={messageRight}
                maxLength={MAX_COLUMN_LENGTH}
                readOnly={!canWrite}
                onChange={(event) => handleRightChange(event.target.value)}
                onKeyDown={handleRightKeyDown}
                placeholder={
                  messageLeft.length >= MAX_COLUMN_LENGTH
                    ? "Continue here..."
                    : ""
                }
                className={textareaClassName}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrialTopFlap({
  envelope,
  isReady,
}: {
  envelope: Envelope;
  isReady: boolean;
}) {
  const flap = envelope.topFlap!;
  const widthPercent = flap.widthPercent ?? 100;
  const topPercent = flap.topPercent ?? 0;

  return (
    <div
      className={`envelope-top-flap envelope-top-flap--open ${
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
          priority
          className="envelope-top-flap-face h-auto w-full"
        />
        <Image
          src={flap.outsideSrc}
          alt=""
          aria-hidden
          width={flap.outsideWidth}
          height={flap.outsideHeight}
          priority
          className="envelope-top-flap-face envelope-top-flap-face--outside h-auto w-full"
        />
      </div>
    </div>
  );
}

export function TrialEnvelope() {
  const envelope = FLAT_1_ENVELOPE;
  const [stage, setStage] = useState<TrialStage>("idle");
  const [messageLeft, setMessageLeft] = useState("");
  const [messageRight, setMessageRight] = useState("");
  const [isTopFlapReady, setIsTopFlapReady] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const openLetter = useCallback(() => {
    clearTimers();
    setStage("writing");
    setIsTopFlapReady(false);

    schedule(() => {
      if (envelope.topFlap) {
        setIsTopFlapReady(true);
      }
    }, LETTER_FLIP_MS);
  }, [clearTimers, envelope.topFlap, schedule]);

  const handleLetterClick = useCallback(() => {
    if (stage === "idle") {
      openLetter();
    }
  }, [openLetter, stage]);

  const fillLayer = envelope.layers!.find((layer) => layer.anchor === "fill")!;
  const letterLayer = envelope.layers!.find((layer) => layer.anchor === "center")!;
  const bottomLayer = envelope.layers!.find((layer) => layer.anchor === "bottom")!;
  const showComposedBase =
    envelope.topFlap?.bottomInsideSrc && stage === "writing";

  const frameStyle = {
    aspectRatio: `${envelope.width} / ${envelope.height}`,
  } as CSSProperties;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F3F9F9] p-6">
      <div
        className="relative h-[min(74vh,900px)] w-auto shrink-0"
        style={{ ...frameStyle, containerType: "size" }}
        role="img"
        aria-label={envelope.alt}
      >
        <Image
          src={fillLayer.src}
          alt=""
          aria-hidden
          width={fillLayer.width}
          height={fillLayer.height}
          priority
          style={{ zIndex: fillLayer.zIndex }}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom"
        />

        {showComposedBase && envelope.topFlap?.bottomInsideSrc && (
          <Image
            src={envelope.topFlap.bottomInsideSrc}
            alt=""
            aria-hidden
            width={envelope.topFlap.bottomInsideWidth!}
            height={envelope.topFlap.bottomInsideHeight!}
            priority
            style={{ zIndex: 1 }}
            className={`envelope-composed-base ${
              isTopFlapReady ? "envelope-composed-base--ready" : ""
            } pointer-events-none absolute bottom-0 left-0 h-auto w-full`}
          />
        )}

        <TrialLetter
          layer={letterLayer}
          stage={stage}
          messageLeft={messageLeft}
          messageRight={messageRight}
          onMessageLeftChange={setMessageLeft}
          onMessageRightChange={setMessageRight}
          onClick={handleLetterClick}
        />

        <Image
          src={bottomLayer.src}
          alt=""
          aria-hidden
          width={bottomLayer.width}
          height={bottomLayer.height}
          priority
          style={{ zIndex: bottomLayer.zIndex }}
          className="pointer-events-none absolute bottom-0 left-0 h-auto w-full"
        />

        {stage === "writing" && envelope.topFlap && (
          <TrialTopFlap envelope={envelope} isReady={isTopFlapReady} />
        )}
      </div>
    </div>
  );
}
