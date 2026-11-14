"use client";

import { CardGallery } from "@/components/default2/CardGallery";
import { LocaleProvider } from "@/lib/locale";

export default function CardsPage() {
  return (
    <LocaleProvider defaultLocale="ko">
      <CardGallery />
    </LocaleProvider>
  );
}
