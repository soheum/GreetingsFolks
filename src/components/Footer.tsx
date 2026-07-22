"use client";

import Image from "next/image";
import { useLocale } from "@/lib/locale";

export function Footer() {
  const { locale, t } = useLocale();

  return (
    <footer className="bg-[#ffe8e8]">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-14 md:gap-6 sm:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8 lg:gap-12">
          <div className="order-2 flex flex-col items-center text-center md:order-1">
            {locale === "ko" ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-footer">
                  <span className="font-medium">GREETINGS FOLKs</span>는
                  <br />
                  옛것의 아름다운 마음이 깃든 생활품에서
                  <br />
                  영감을 받아 현대적인 라이프스타일로
                  <br />
                  재해석한 문구 브랜드입니다.
                </p>
                <p className="text-footer">
                  문구 구매는 2026년 4월 3일부로 마무리되었지만
                  <br />
                  그리팅스 포크스는 아카이브로 이어갑니다.
                </p>
                <p className="text-footer">
                  카드를 골라 당신의 마음을 글로 전해보세요!
                </p>
              </div>
            ) : (
              <div className="hidden md:block" aria-hidden />
            )}
          </div>

          <div className="order-1 flex flex-col items-center justify-start text-center md:order-2">
            <Image
              src="/images/logo.webp"
              alt="Greetings Folks"
              width={484}
              height={182}
              className="h-auto w-48 sm:w-56 md:w-64"
              priority
            />
          </div>

          <div className="order-3 flex flex-col items-center text-center">
            {locale === "en" ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-footer">
                  <span className="font-medium">GREETINGS FOLKs</span> is
                  <br />
                  a stationery brand that interprets the timeless
                  <br />
                  charm and heartfelt spirit of traditional
                  <br />
                  paintings and objects into a modern lifestyle.
                </p>
                <p className="text-footer">
                  Our official orders closed on 3rd April 2026
                  <br />
                  and we continue our path as an archive.
                </p>
                <p className="text-footer">
                  Pick up your card &amp; ink your love into words!
                </p>
              </div>
            ) : (
              <div className="hidden md:block" aria-hidden />
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-8 md:gap-12">
          <Image
            src="/images/logo_left.png"
            alt=""
            aria-hidden
            width={444}
            height={366}
            className="h-auto w-28 shrink-0 sm:w-40 md:w-52"
          />
          <div className="min-w-0 space-y-1 text-center">
            <p className="text-footer font-medium tracking-wide uppercase">
              {t.footerCollab}
            </p>
            <p className="text-footer">{t.footerCollabKoLine}</p>
            <a
              href="mailto:ink@greetingsfolks.com"
              className="text-footer inline-block transition-opacity hover:opacity-70"
            >
              ink@greetingsfolks.com
            </a>
          </div>
          <Image
            src="/images/logo_right.png"
            alt=""
            aria-hidden
            width={444}
            height={366}
            className="h-auto w-28 shrink-0 sm:w-40 md:w-52"
          />
        </div>
      </div>

      <div className="bg-[#DF0000] px-6 py-3 text-center">
        <p className="text-footer !text-white">
          Copyright © 2026 GREETINGS FOLKs All rights reserved
        </p>
      </div>
    </footer>
  );
}
