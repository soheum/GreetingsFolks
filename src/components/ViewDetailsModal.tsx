"use client";

import Image from "next/image";
import { useEffect } from "react";
import { Button } from "./Button";
import { getViewDetailsCopy } from "@/data/view-details";
import { useLocale } from "@/lib/locale";

type ViewDetailsModalProps = {
  open: boolean;
  envelopeTitle: string;
  onClose: () => void;
};

export function ViewDetailsModal({
  open,
  envelopeTitle,
  onClose,
}: ViewDetailsModalProps) {
  const { locale } = useLocale();
  const copy = getViewDetailsCopy(envelopeTitle, locale);

  useEffect(() => {
    if (!open) {
      return;
    }

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
    };
  }, [open, onClose]);

  if (!open || !copy) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-details-title"
      onWheel={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Close details"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-[min(100dvh-2rem,42rem)] w-full max-w-[24rem] flex-col overflow-hidden shadow-xl sm:h-[min(100dvh-3rem,48rem)] sm:max-w-[26rem]">
        <Image
          src="/images/view_details.png"
          alt=""
          aria-hidden
          fill
          priority
          className="pointer-events-none object-cover"
          sizes="(max-width: 640px) 24rem, 26rem"
        />

        <Button
          variant="outline"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 !min-w-0 size-10 !px-4 py-2.5 text-black sm:top-5 sm:right-5"
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

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto overscroll-contain px-8 pt-14 pb-8 sm:px-10 sm:pt-16 sm:pb-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <h2
                id="view-details-title"
                className="text-[#DF0000]"
              >
                {copy.title}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">{copy.subtitle}</p>

              <div className="mt-6 space-y-3 leading-relaxed text-neutral-700 [&_p]:text-sm">
                {copy.body.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {copy.imageSrc ? (
                <div className="relative mt-8 aspect-square w-full max-w-xs overflow-hidden">
                  <Image
                    src={copy.imageSrc}
                    alt={copy.imageCaption}
                    fill
                    className="object-cover"
                    sizes="20rem"
                  />
                </div>
              ) : (
                <div
                  aria-hidden
                  className="mt-8 aspect-square w-full max-w-xs border border-dashed border-neutral-300 bg-neutral-100/70"
                />
              )}
              <p className="mt-2 font-meta text-xs text-neutral-600">{copy.imageCaption} <br/> {copy.sourceCredit}</p>

              <div className="mt-8 space-y-1 text-neutral-600 [&_p]:text-sm">
                <p className="font-medium text-neutral-800">
                  {copy.meaningsLabel}
                </p>
                <p>{copy.meanings}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-6 py-4 sm:px-8">
            <Image
              src="/images/logo_left.webp"
              alt=""
              aria-hidden
              width={444}
              height={366}
              className="h-auto w-14 shrink-0 sm:w-16"
            />
            <div className="min-w-0 flex-1" aria-hidden />
            <Image
              src="/images/logo_right.webp"
              alt=""
              aria-hidden
              width={444}
              height={366}
              className="h-auto w-14 shrink-0 sm:w-16"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
