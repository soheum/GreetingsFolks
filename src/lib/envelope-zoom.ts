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
