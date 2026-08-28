"use client";

import { useEffect, useState } from "react";

/** Matches Tailwind `md` (768px) — below this, zoom is softened. */
export const MOBILE_ZOOM_MQ = "(max-width: 767px)";
/** Applied on top of each envelope's zoomScale / defaults while on mobile. */
export const MOBILE_ZOOM_FACTOR = 0.7;

function mobileZoomFactorFromWindow(): number {
  if (typeof window === "undefined") {
    return 1;
  }
  return window.matchMedia(MOBILE_ZOOM_MQ).matches ? MOBILE_ZOOM_FACTOR : 1;
}

/** True below the md breakpoint. Safe to call from event handlers after mount. */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia(MOBILE_ZOOM_MQ).matches;
}

/** 1 on desktop; MOBILE_ZOOM_FACTOR below the md breakpoint. */
export function useMobileZoomFactor(): number {
  const [factor, setFactor] = useState(mobileZoomFactorFromWindow);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_ZOOM_MQ);
    const sync = () => {
      setFactor(mq.matches ? MOBILE_ZOOM_FACTOR : 1);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return factor;
}

/**
 * iOS Safari zooms the page when focusing inputs under 16px. The keyboard
 * check/Done control only blurs the field, so the page can stay zoomed.
 * Briefly lock maximum-scale to snap back.
 */
export function resetMobileViewportZoom() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  if (!window.matchMedia(MOBILE_ZOOM_MQ).matches) {
    return;
  }

  const viewport = document.querySelector('meta[name="viewport"]');
  if (!(viewport instanceof HTMLMetaElement)) {
    return;
  }

  const original = viewport.content;
  const locked = /maximum-scale\s*=/.test(original)
    ? original.replace(/maximum-scale\s*=\s*[^,\s]+/i, "maximum-scale=1")
    : `${original}, maximum-scale=1`;

  viewport.content = locked;
  window.scrollTo(0, 0);

  window.setTimeout(() => {
    viewport.content = original;
  }, 300);
}
