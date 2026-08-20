"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Button } from "./Button";
import { ViewDetailsModal } from "./ViewDetailsModal";
import type { Envelope, EnvelopeLayer, EnvelopeTopFlap } from "@/data/envelopes";
import { postFallImage, postFallNudgeY } from "@/lib/card-images";
import { useLocale } from "@/lib/locale";

const FALL_MS = 1100;
const HANDOFF_MS = 900;
const FRAME_MS = 600;
const ZOOM_MS = 1300;
const FLAP_MS = 1400;
const LETTER_FLIP_MS = 3000;
const LETTER_TRI_FOLD_MS = 3600;
const LETTER_LIFT_SETTLE_MS = 2400;
const LETTER_LIFT_ROTATE_SETTLE_MS = 2800;
const LETTER_LIFT_ROTATE_RIGHT_MS = 2800;
const LETTER_LIFT_ROTATE_FLIP_MS = 4200;
const LETTER_RIGHT_FLAP_OPEN_MS = 1400;
const LETTER_LEFT_FLAP_OPEN_MS = 1400;

/** Match PostcardStack letter sizing while writing */
const LETTER_SIZE_MULTIPLIER = 1.125;
/** Extra downward offset for the sealed see-through letter (percent of envelope height) */
const SEALED_LETTER_TOP_NUDGE = 8;

/** Fall ends tilted so straighten is visible on click */
const FALL_END_ROTATE_DEG = -8;

type ReceiveStage =
  | "landing"
  | "handing-off"
  | "framing"
  | "zooming"
  | "opening-flap"
  | "opening-letter"
  | "reading";

type HandoffPose = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type ReceivedCardProps = {
  message: string;
  cardTitle: string;
  cardImage: string;
  envelope: Envelope;
};

type FlapMode = "closed" | "opening" | "open";

function letterWidthPercent(layer: EnvelopeLayer) {
  return Math.min((layer.widthPercent ?? 50) * LETTER_SIZE_MULTIPLIER, 100);
}

function splitMessageColumns(message: string) {
  // Matches combineCardMessage in PostcardStack: left + "\n\n" + right
  const separator = "\n\n";
  const index = message.indexOf(separator);

  if (index === -1) {
    return { left: message, right: "" };
  }

  return {
    left: message.slice(0, index),
    right: message.slice(index + separator.length),
  };
}

function ReceiveTopFlap({
  flap,
  mode,
}: {
  flap: EnvelopeTopFlap;
  mode: FlapMode;
}) {
  const widthPercent = flap.widthPercent ?? 100;
  const isFlat2Flap = flap.outsideSrc.includes("/flat_2_");
  // Receive seat: flat_2 flap sits a touch high vs the pocket — nudge down (send fold keeps 0).
  const topPercent = (flap.topPercent ?? 0) + (isFlat2Flap ? 2.5 : 0);
  // Match PostcardStack flat_10 seam (same inset sealed + open)
  const matchesFlat10Back = flap.outsideSrc.includes("/flat_10_");
  // flat_2: no open flap art — hide the whole flap once open
  if (isFlat2Flap && mode === "open") {
    return null;
  }
  const showInside = mode === "open";

  const modeClass =
    mode === "closed"
      ? "envelope-top-flap--closed envelope-top-flap--ready"
      : mode === "opening"
        ? "envelope-top-flap--opening envelope-top-flap--ready"
        : "envelope-top-flap--open envelope-top-flap--ready";

  return (
    <div
      className={`envelope-top-flap ${modeClass} pointer-events-none absolute left-1/2 top-[var(--top-flap-top)]`}
      style={
        {
          "--top-flap-top": matchesFlat10Back ? "4cqh" : `${topPercent}%`,
          width: `${widthPercent}%`,
          aspectRatio: `${flap.insideWidth} / ${flap.insideHeight}`,
          transform: "translateX(-50%)",
        } as CSSProperties
      }
    >
      <div className="envelope-top-flap-card h-full w-full">
        {showInside ? (
          <Image
            src={flap.insideSrc}
            alt=""
            aria-hidden
            width={flap.insideWidth}
            height={flap.insideHeight}
            priority
            className="envelope-top-flap-face h-auto w-full"
          />
        ) : null}
        {/* Drop outside once fully open — sealed/opening still need it for the fold */}
        {mode !== "open" ? (
          <div className="envelope-top-flap-face envelope-top-flap-face--outside h-auto w-full">
            <Image
              src={flap.outsideSrc}
              alt=""
              aria-hidden
              width={flap.outsideWidth}
              height={flap.outsideHeight}
              priority
              className="h-auto w-full"
            />
            {mode !== "closed" ? (
              <Image
                src="/images/sticker.webp"
                alt=""
                aria-hidden
                width={256}
                height={256}
                priority
                unoptimized
                className="envelope-flap-sticker"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReceiveLetter({
  layer,
  message,
  mode,
}: {
  layer: EnvelopeLayer;
  message: string;
  mode: "pocketed" | "flipping" | "flipped";
}) {
  const topPercent = layer.topPercent ?? 50;
  const hasBack = Boolean(layer.backSrc && layer.backWidth && layer.backHeight);
  const usesLiftSettle = layer.letterOpenMotion === "lift-settle";
  const usesLiftRotateSettle =
    layer.letterOpenMotion === "lift-rotate-settle" ||
    layer.letterOpenMotion === "lift-rotate-flip";
  const usesLiftRotateFlip =
    layer.letterOpenMotion === "lift-rotate-flip" && hasBack;
  const usesLiftRotateRight = layer.letterOpenMotion === "lift-rotate-right";
  const usesFoldOpen =
    layer.letterOpenMotion === "fold-open" &&
    Boolean(layer.insideSrc && layer.insideWidth && layer.insideHeight);
  const usesTriFoldOpen =
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
    );
  const composeOnFront = usesLiftRotateFlip
    ? false
    : !hasBack ||
      usesLiftSettle ||
      usesLiftRotateSettle ||
      usesLiftRotateRight ||
      usesFoldOpen ||
      usesTriFoldOpen;
  const backSrc = layer.backSrc;
  const backWidth = layer.backWidth;
  const backHeight = layer.backHeight;
  const insideSrc = layer.insideSrc;
  const insideWidth = layer.insideWidth;
  const insideHeight = layer.insideHeight;
  const { left, right } = splitMessageColumns(message);
  const isSingleColumn = layer.composeLayout === "single";
  const isFoldSplit = layer.composeLayout === "fold-split";
  const composeInsetClass =
    layer.composeShape === "oval-bottom"
      ? "letter-compose--oval-bottom"
      : layer.composeShape === "taper-bottom"
        ? "letter-compose--taper-bottom"
        : layer.composeShape === "taper-heave"
          ? "letter-compose--taper-heave"
          : (layer.composeInset ?? "inset-[8%_8%_9%]");
  const composeColumnsClass =
    layer.composeShape === "oval-bottom"
      ? "letter-compose-columns flex h-full w-full gap-1"
      : isFoldSplit
        ? "letter-compose-columns letter-compose-columns--fold-split flex min-h-0 w-full flex-1 flex-col"
        : layer.composeShape === "taper-bottom" ||
            layer.composeShape === "taper-heave"
          ? "letter-compose-columns flex h-full w-full gap-1"
          : isSingleColumn
            ? "letter-compose-columns flex h-[80%] w-full"
            : "letter-compose-columns flex h-[80%] w-full gap-1";
  const usesShapedCompose =
    layer.composeShape === "oval-bottom" ||
    layer.composeShape === "taper-bottom" ||
    layer.composeShape === "taper-heave";

  if (mode === "pocketed") {
    return (
      <div
        className="absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0"
        style={
          {
            "--letter-top": `${topPercent}%`,
            width: `${letterWidthPercent(layer)}%`,
            transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
            zIndex: layer.zIndex,
          } as CSSProperties
        }
      >
        <Image
          src={layer.src}
          alt=""
          aria-hidden
          width={layer.width}
          height={layer.height}
          priority
          className="h-auto w-full"
        />
      </div>
    );
  }

  const composeClass =
    mode === "flipping"
      ? "letter-compose letter-compose--ready"
      : "letter-compose letter-compose--visible";

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

  const messageFields = (
    <div
      className={`${composeClass} absolute ${composeInsetClass} flex flex-col px-[0%] ${
        usesShapedCompose
          ? "justify-start pb-[0%] pt-[0%]"
          : "justify-end pb-[2%] pt-[10%]"
      }`}
      style={composeTextStyle}
    >
      <div
        className={
          isFoldSplit
            ? "letter-compose-columns flex w-full flex-col gap-3"
            : composeColumnsClass
        }
      >
        {isSingleColumn || isFoldSplit ? (
          <p className="card-message-input min-w-0 whitespace-pre-wrap text-neutral-800">
            {[left, right].filter(Boolean).join("\n\n") || message}
          </p>
        ) : (
          <>
            <p className="card-message-input h-full min-w-0 flex-1 whitespace-pre-wrap text-neutral-800">
              {left}
            </p>
            <p className="card-message-input h-full min-w-0 flex-1 whitespace-pre-wrap text-neutral-800">
              {right}
            </p>
          </>
        )}
      </div>
    </div>
  );

  // lift-rotate-flip composes on the back face (composeOnFront=false) but still
  // needs the settle/flip scene — same path as PostcardStack flat_2.
  if (composeOnFront || usesLiftRotateSettle || usesLiftRotateRight) {
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
      const done = mode === "flipped";
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
      return (
        <div
          className={`letter-tri-fold-scene absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0 ${
            done ? "letter-tri-fold-scene--done letter-flip-scene--elevated" : ""
          }`}
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
                    priority
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
                    priority
                    className="letter-tri-fold-center-image"
                    style={
                      {
                        width: `${(insideWidth / centerW) * 100}%`,
                        marginLeft: `${(-leftW / centerW) * 100}%`,
                      } as CSSProperties
                    }
                  />
                </div>
                {messageFields}
              </div>

              <div className="letter-tri-fold-left">
                <div className="letter-tri-fold-left-inner">
                  <Image
                    src={layer.insideLeftSrc}
                    alt=""
                    aria-hidden
                    width={leftW}
                    height={layer.insideLeftHeight}
                    priority
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
                      priority
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
                      priority
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
                  priority
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (usesFoldOpen && insideSrc && insideWidth && insideHeight) {
      const done = mode === "flipped";
      return (
        <div
          className={`letter-fold-open-scene absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0 ${
            done ? "letter-fold-open-card--done letter-flip-scene--elevated" : ""
          }`}
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
          <div className="letter-fold-open-mover">
            <div className="letter-fold-closed">
              <div className="letter-fold-closed-inner">
                <Image
                  src={layer.src}
                  alt=""
                  aria-hidden
                  width={layer.width}
                  height={layer.height}
                  priority
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
                  priority
                  className="h-auto w-full"
                />
                {messageFields}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (usesLiftRotateRight) {
      // Keep lift-rotate-right-scene when done so compose-frame CSS still applies.
      const sceneClass = `letter-lift-rotate-right-scene${
        mode === "flipped" ? " letter-flip-scene--elevated" : ""
      }`;
      const doneClass =
        mode === "flipped" ? " letter-lift-rotate-right-card--done" : "";

      return (
        <div
          className={`${sceneClass}${doneClass} absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0`}
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
          <div className="letter-lift-rotate-right-mover">
            <div className="letter-lift-rotate-right-spin">
              <div className="relative block h-auto w-full">
                <Image
                  src={layer.src}
                  alt=""
                  aria-hidden
                  width={layer.width}
                  height={layer.height}
                  priority
                  className="h-auto w-full"
                />
              </div>
              {/* Inside spin (−90°): text turns with the letter into landscape */}
              <div
                className="letter-lift-rotate-right-compose-frame"
                style={
                  {
                    "--letter-w": layer.width,
                    "--letter-h": layer.height,
                  } as CSSProperties
                }
              >
                {messageFields}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (usesLiftRotateSettle) {
      // Keep settle-scene classes when reading so lift CSS vars stay applied.
      // flat_2 flip settles during the flip; other settle cards ease down after.
      const sceneClass = `letter-lift-rotate-settle-scene${
        usesLiftRotateFlip ? " letter-lift-rotate-settle-scene--flip" : ""
      }${mode === "flipped" ? " letter-flip-scene--elevated" : ""}`;
      const doneClass =
        mode === "flipped"
          ? usesLiftRotateFlip
            ? " letter-lift-rotate-settle-card--receive-settled"
            : " letter-lift-rotate-settle-card--receive-center"
          : "";
      const flipCardClass = usesLiftRotateFlip
        ? mode === "flipped"
          ? "letter-lift-rotate-flip-card letter-lift-rotate-flip-card--done"
          : "letter-lift-rotate-flip-card"
        : "relative block h-auto w-full";

      return (
        <div
          className={`${sceneClass}${doneClass} absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0`}
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
          <div className="letter-lift-rotate-settle-mover">
            <div className="letter-lift-rotate-settle-spin">
              <div className={flipCardClass}>
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
                    priority
                    className="h-auto w-full"
                  />
                  {composeOnFront ? messageFields : null}
                </div>
                {usesLiftRotateFlip && backSrc && backWidth && backHeight ? (
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
                    {messageFields}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (usesLiftSettle) {
      const opensRightFlap = Boolean(
        layer.outsideRightSrc &&
          layer.outsideRightWidth &&
          layer.outsideRightHeight &&
          layer.insideRightSrc &&
          layer.insideRightWidth &&
          layer.insideRightHeight,
      );
      const opensLeftFlap = Boolean(
        layer.outsideLeftSrc &&
          layer.outsideLeftWidth &&
          layer.outsideLeftHeight &&
          layer.insideLeftSrc &&
          layer.insideLeftWidth &&
          layer.insideLeftHeight,
      );
      const opensSideFlaps = opensRightFlap || opensLeftFlap;
      const sceneClass =
        mode === "flipped"
          ? `letter-flip-scene--elevated${
              opensSideFlaps ? " letter-lift-settle-scene--side-flaps" : ""
            }`
          : `letter-lift-settle-scene${
              opensSideFlaps ? " letter-lift-settle-scene--side-flaps" : ""
            }`;
      const cardClass =
        mode === "flipped"
          ? "letter-lift-settle-card letter-lift-settle-card--done block h-auto w-full"
          : "letter-lift-settle-card block h-auto w-full";

      return (
        <div
          className={`${sceneClass} absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0`}
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
          <div className={cardClass}>
            <div
              className={
                layer.outsideLeftSrc || layer.outsideRightSrc
                  ? "letter-closed-stack"
                  : "relative block h-auto w-full"
              }
              style={
                layer.outsideLeftSrc || layer.outsideRightSrc
                  ? ({
                      "--letter-stack-aspect": `${layer.width} / ${layer.height}`,
                    } as CSSProperties)
                  : undefined
              }
            >
              <Image
                src={layer.src}
                alt=""
                aria-hidden
                width={layer.width}
                height={layer.height}
                priority
                className={
                  layer.outsideLeftSrc || layer.outsideRightSrc
                    ? "letter-closed-stack__layer letter-closed-stack__center"
                    : "h-auto w-full"
                }
              />
              {messageFields}
              {opensLeftFlap ? (
                <div className="letter-left-flap">
                  <div className="letter-left-flap-inner">
                    <div className="letter-left-flap-face letter-left-flap-face--outside">
                      <Image
                        src={layer.outsideLeftSrc!}
                        alt=""
                        aria-hidden
                        width={layer.outsideLeftWidth}
                        height={layer.outsideLeftHeight}
                        priority
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
                        priority
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
                  priority
                  className="letter-closed-stack__layer letter-closed-stack__left"
                />
              ) : null}
              {opensRightFlap ? (
                <div className="letter-right-flap">
                  <div className="letter-right-flap-inner">
                    <div className="letter-right-flap-face letter-right-flap-face--outside">
                      <Image
                        src={layer.outsideRightSrc!}
                        alt=""
                        aria-hidden
                        width={layer.outsideRightWidth}
                        height={layer.outsideRightHeight}
                        priority
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
                        priority
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
                  priority
                  className="letter-closed-stack__layer letter-closed-stack__right"
                />
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0 ${
          mode === "flipped" ? "letter-flip-scene--elevated" : ""
        }`}
        style={
          {
            "--letter-top": `${topPercent}%`,
            "--letter-z-base": layer.zIndex,
            "--letter-z-top": 50,
            zIndex: 50,
            width: `${letterWidthPercent(layer)}%`,
            transform: `translate(-50%, -50%) rotate(${layer.rotate ?? 0}deg)`,
          } as CSSProperties
        }
      >
        <div className="relative block h-auto w-full">
          <Image
            src={layer.src}
            alt=""
            aria-hidden
            width={layer.width}
            height={layer.height}
            priority
            className="h-auto w-full"
          />
          {messageFields}
        </div>
      </div>
    );
  }

  const cardClass =
    mode === "flipping"
      ? "letter-flip-card letter-flip-card--receive block h-auto w-full"
      : "letter-flip-card letter-flip-card--receive-done block h-auto w-full";

  return (
    <div
      className={`letter-flip-scene letter-flip-scene--receive absolute left-1/2 top-[var(--letter-top)] border-0 bg-transparent p-0 ${
        mode === "flipped" ? "letter-flip-scene--elevated" : ""
      }`}
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
      <div className={cardClass}>
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
            src={backSrc!}
            alt=""
            aria-hidden
            width={backWidth!}
            height={backHeight!}
            priority
            className="h-auto w-full"
          />
          {messageFields}
        </div>
      </div>
    </div>
  );
}

function motionClassForStage(stage: Exclude<ReceiveStage, "landing">) {
  switch (stage) {
    case "handing-off":
      return "receive-envelope-motion--handoff";
    case "framing":
      return "receive-envelope-motion--framing";
    case "zooming":
      return "receive-envelope-motion--zooming";
    default:
      return "receive-envelope-motion--focused";
  }
}

function flapModeForStage(stage: Exclude<ReceiveStage, "landing">): FlapMode {
  if (stage === "opening-flap") {
    return "opening";
  }
  if (stage === "opening-letter" || stage === "reading") {
    return "open";
  }
  return "closed";
}

function letterModeForStage(
  stage: Exclude<ReceiveStage, "landing">,
): "pocketed" | "flipping" | "flipped" {
  if (stage === "opening-letter") {
    return "flipping";
  }
  if (stage === "reading") {
    return "flipped";
  }
  return "pocketed";
}

function ReceiveEnvelopeOpen({
  envelope,
  message,
  stage,
  pose,
  fallSrc,
  cardTitle,
}: {
  envelope: Envelope;
  message: string;
  stage: Exclude<ReceiveStage, "landing">;
  pose: HandoffPose;
  fallSrc: string;
  cardTitle: string;
}) {
  const { t, envelopeCopy } = useLocale();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const layers = envelope.layers!;
  const flap = envelope.topFlap!;
  const copy = envelopeCopy({
    title: envelope.title,
    subtitle: envelope.subtitle,
    description: envelope.description,
    descriptionNote: envelope.descriptionNote,
  });
  const fillLayer = layers.find((layer) => layer.anchor === "fill")!;
  const letterLayer = layers.find((layer) => layer.anchor === "center")!;
  const bottomLayer = layers.find((layer) => layer.anchor === "bottom")!;

  const flapMode = flapModeForStage(stage);
  const letterMode = letterModeForStage(stage);
  const showPostOverlay = stage === "handing-off";
  const isSealed = flapMode === "closed";
  const baseReady = flapMode === "opening" || flapMode === "open";
  // Closed look = bottom + top_outside + sticker (not fill — fill fights the sealed flap)
  // flat_10 open also skips fill so the seam stays on back + bottom
  const showFill =
    !isSealed && !fillLayer.src.includes("/flat_10.webp");

  const showBottomBar =
    stage === "framing" ||
    stage === "zooming" ||
    stage === "opening-flap" ||
    stage === "opening-letter" ||
    stage === "reading";

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportOrigin, setViewportOrigin] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const frame = viewportRef.current;
    if (!frame) {
      return;
    }

    const measure = () => {
      const rect = frame.getBoundingClientRect();
      setViewportOrigin({ top: rect.top, left: rect.left });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Handoff keeps fall-letter position/rotation but already uses the sender
  // carousel seat size (--envelope-center-height). Framing only recenters.
  const handoffCenterX =
    pose.left - viewportOrigin.left + pose.width / 2;
  const handoffCenterY =
    pose.top - viewportOrigin.top + pose.height / 2;
  const zoomScale = envelope.zoomScale ?? 2;
  const zoomTranslateY = envelope.zoomTranslateY ?? "0px";

  return (
    <section className="receive-envelope-stage relative flex min-h-0 flex-1 overflow-hidden bg-[#F3F9F9]">
      <div ref={viewportRef} className="absolute inset-0 overflow-hidden">
        <div
          className={`receive-envelope-motion ${motionClassForStage(stage)}`}
          style={
            {
              "--handoff-center-x": `${handoffCenterX}px`,
              "--handoff-center-y": `${handoffCenterY}px`,
              "--envelope-aspect": `${envelope.width} / ${envelope.height}`,
              "--envelope-w": envelope.width,
              "--envelope-h": envelope.height,
              "--fall-rotate": `${FALL_END_ROTATE_DEG}deg`,
              "--zoom-scale": String(zoomScale),
              "--zoom-translate-y": zoomTranslateY,
            } as CSSProperties
          }
          role="img"
          aria-label={envelope.alt}
        >
          <div
            className="receive-envelope-stack relative h-full w-full"
            style={{ containerType: "size" }}
          >
            {showFill ? (
              <Image
                src={fillLayer.src}
                alt=""
                aria-hidden
                width={fillLayer.width}
                height={fillLayer.height}
                priority
                style={{ zIndex: fillLayer.zIndex }}
                className="receive-envelope-fill pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom"
              />
            ) : null}

            {/* Match send carousel: back sits under the letter (fill skipped for flat_10) */}
            {flap.backSrc && flap.backWidth && flap.backHeight ? (
              <Image
                src={flap.backSrc}
                alt=""
                aria-hidden
                width={flap.backWidth}
                height={flap.backHeight}
                priority
                style={{
                  zIndex: 0,
                  bottom: flap.backSrc.includes("/flat_10_")
                    ? "0cqh"
                    : undefined,
                }}
                className={`pointer-events-none absolute left-0 z-0 h-auto w-full ${
                  flap.backSrc.includes("/flat_10_") ? "" : "bottom-2"
                }`}
              />
            ) : null}

            {flap.bottomInsideSrc &&
              flap.bottomInsideWidth &&
              flap.bottomInsideHeight && (
                <Image
                  src={flap.bottomInsideSrc}
                  alt=""
                  aria-hidden
                  width={flap.bottomInsideWidth}
                  height={flap.bottomInsideHeight}
                  priority
                  style={{ zIndex: 1 }}
                  className={`envelope-composed-base pointer-events-none absolute bottom-0 left-0 h-auto w-full ${
                    baseReady ? "envelope-composed-base--ready" : ""
                  }`}
                />
              )}

            {!isSealed ? (
              <ReceiveLetter
                layer={letterLayer}
                message={message}
                mode={letterMode}
              />
            ) : null}

            <Image
              src={bottomLayer.src}
              alt=""
              aria-hidden
              width={bottomLayer.width}
              height={bottomLayer.height}
              priority
              style={{
                zIndex: bottomLayer.zIndex,
                bottom: bottomLayer.src.includes("/flat_10_")
                  ? "0cqh"
                  : undefined,
                transform: bottomLayer.src.includes("/flat_9_bottom")
                  ? "translateX(1.5%)"
                  : undefined,
              }}
              className={`pointer-events-none absolute left-0 h-auto w-full ${
                bottomLayer.src.includes("/flat_10_") ? "" : "bottom-0"
              }`}
            />

            <ReceiveTopFlap flap={flap} mode={flapMode} />

            {isSealed ? (
              <>
                {letterLayer.src.includes("/flat_7_") ||
                letterLayer.src.includes("/flat_8_") ? (
                  <div
                    className="pointer-events-none absolute left-1/2 top-[var(--letter-top)] z-[70] opacity-20"
                    style={
                      {
                        "--letter-top": `${Math.min((letterLayer.topPercent ?? 50) + SEALED_LETTER_TOP_NUDGE, 88)}%`,
                        width: `${letterWidthPercent(letterLayer)}%`,
                        transform: `translate(-50%, -50%) rotate(${letterLayer.rotate ?? 0}deg)`,
                      } as CSSProperties
                    }
                  >
                    <Image
                      src={letterLayer.src}
                      alt=""
                      aria-hidden
                      width={letterLayer.width}
                      height={letterLayer.height}
                      priority
                      className="h-auto w-full"
                    />
                  </div>
                ) : null}
                {/* Same closed-flap 3D as ReceiveTopFlap so seal position matches */}
                <div
                  className="pointer-events-none absolute left-1/2 z-[80]"
                  style={
                    {
                      top: flap.outsideSrc.includes("/flat_10_")
                        ? "8cqh"
                        : `${flap.topPercent ?? 0}%`,
                      width: `${flap.widthPercent ?? 100}%`,
                      aspectRatio: `${flap.insideWidth} / ${flap.insideHeight}`,
                      transform: "translateX(-50%)",
                      perspective: "1200px",
                    } as CSSProperties
                  }
                >
                  <div
                    className="relative h-full w-full"
                    style={{
                      transformOrigin: "center 96%",
                      transform: "rotateX(180deg)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ transform: "rotateX(180deg)" }}
                    >
                      <Image
                        src="/images/sticker.webp"
                        alt=""
                        aria-hidden
                        width={256}
                        height={256}
                        priority
                        unoptimized
                        className="envelope-flap-sticker"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {showPostOverlay ? (
              <Image
                src={fallSrc}
                alt={cardTitle}
                width={636}
                height={529}
                priority
                unoptimized
                className="receive-post-handoff pointer-events-none absolute inset-0 z-[90] h-full w-full object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.28)]"
              />
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-neutral-200 bg-white px-6 py-4 transition-opacity duration-700 ease-out ${
          showBottomBar
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!showBottomBar}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-eyebrow shrink-0">{t.yourLetter}</span>
          <p className="min-w-0 truncate text-sm text-neutral-900">
            {copy.title}
          </p>
          <p className="min-w-0 truncate text-sm text-neutral-500">
            {copy.subtitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button variant="outline" onClick={() => setDetailsOpen(true)}>
            {t.viewDetails}
          </Button>
          <Button variant="primary" size="md" href="/">
            {t.sendReply}
            <span aria-hidden className="text-sm leading-none">
              ↗
            </span>
          </Button>
        </div>
      </div>

      <ViewDetailsModal
        open={detailsOpen}
        envelopeTitle={envelope.title}
        onClose={() => setDetailsOpen(false)}
      />
    </section>
  );
}

export function ReceivedCard({
  message,
  cardTitle,
  cardImage,
  envelope,
}: ReceivedCardProps) {
  const { t } = useLocale();
  const [stage, setStage] = useState<ReceiveStage>("landing");
  const [fallDone, setFallDone] = useState(false);
  const [pose, setPose] = useState<HandoffPose | null>(null);
  const letterBtnRef = useRef<HTMLButtonElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fallSrc = postFallImage(cardImage);
  const fallNudgeY = postFallNudgeY(cardImage);
  const letterLayer = envelope.layers?.find((layer) => layer.anchor === "center");

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    const id = setTimeout(() => setFallDone(true), FALL_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const open = stage !== "landing";
    document.body.classList.toggle("envelope-zoom-active", open);
    return () => {
      document.body.classList.remove("envelope-zoom-active");
    };
  }, [stage]);

  const startOpen = useCallback(() => {
    if (stage !== "landing" || !fallDone) {
      return;
    }

    const el = letterBtnRef.current;
    if (!el) {
      return;
    }

    const rect = el.getBoundingClientRect();
    setPose({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    clearTimers();
    setStage("handing-off");

    let t = HANDOFF_MS;
    schedule(() => setStage("framing"), t);

    t += FRAME_MS;
    schedule(() => setStage("zooming"), t);

    t += ZOOM_MS;
    schedule(() => setStage("opening-flap"), t);

    t += FLAP_MS;
    schedule(() => setStage("opening-letter"), t);

    const letterOpenMs =
      letterLayer?.letterOpenMotion === "tri-fold-open"
        ? LETTER_TRI_FOLD_MS
        : letterLayer?.letterOpenMotion === "fold-open"
          ? 6000
          : letterLayer?.letterOpenMotion === "lift-settle"
            ? LETTER_LIFT_SETTLE_MS +
              (letterLayer.outsideRightSrc && letterLayer.insideRightSrc
                ? LETTER_RIGHT_FLAP_OPEN_MS
                : 0) +
              (letterLayer.outsideLeftSrc && letterLayer.insideLeftSrc
                ? LETTER_LEFT_FLAP_OPEN_MS
                : 0)
            : letterLayer?.letterOpenMotion === "lift-rotate-flip"
              ? LETTER_LIFT_ROTATE_FLIP_MS
              : letterLayer?.letterOpenMotion === "lift-rotate-settle"
                ? LETTER_LIFT_ROTATE_SETTLE_MS
                : letterLayer?.letterOpenMotion === "lift-rotate-right"
                  ? LETTER_LIFT_ROTATE_RIGHT_MS
                  : LETTER_FLIP_MS;
    t += letterOpenMs;
    schedule(() => setStage("reading"), t);
  }, [
    stage,
    fallDone,
    clearTimers,
    schedule,
    letterLayer,
  ]);

  if (stage === "landing") {
    return (
      <section className="post-landing relative flex min-h-0 flex-1 items-end justify-center overflow-hidden bg-[#DF0000] md:items-center">
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

          {fallDone ? (
            <p className="pointer-events-none absolute top-[10%] left-1/2 z-30 w-[90%] -translate-x-1/2 text-center text-white">
              {t.openLetterHint}
            </p>
          ) : null}

          <button
            ref={letterBtnRef}
            type="button"
            aria-label={`Open ${cardTitle}`}
            disabled={!fallDone}
            onClick={startOpen}
            className={`letter-fall absolute left-1/2 z-10 w-[75%] border-0 bg-transparent p-0 md:w-[37.8%] ${
              fallDone ? "letter-fall--done cursor-pointer" : "cursor-default"
            }`}
            style={
              {
                "--letter-fall-nudge-y": fallNudgeY,
              } as CSSProperties
            }
          >
            <Image
              src={fallSrc}
              alt={cardTitle}
              width={636}
              height={529}
              priority
              unoptimized
              className="h-auto w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.28)]"
            />
          </button>

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
            src="/images/post_top.webp"
            alt=""
            aria-hidden
            width={1920}
            height={1080}
            priority
            unoptimized
            className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full object-contain md:block"
          />
        </div>
      </section>
    );
  }

  if (!pose) {
    return null;
  }

  return (
    <ReceiveEnvelopeOpen
      envelope={envelope}
      message={message}
      stage={stage}
      pose={pose}
      fallSrc={fallSrc}
      cardTitle={cardTitle}
    />
  );
}
