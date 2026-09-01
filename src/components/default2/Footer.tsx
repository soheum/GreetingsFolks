"use client";

import Image from "next/image";
import { useLocale } from "@/lib/locale";

export function Footer({ className }: { className?: string } = {}) {
  const { locale } = useLocale();
  return (
    <footer className={`bg-[#ffe8e8] ${className ?? ""}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14 sm:gap-5 sm:py-16 md:gap-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4 lg:gap-6">
          <div className="order-2 flex w-full flex-col items-center text-center md:order-1">
            <div className="flex w-full max-w-sm flex-col items-center gap-2 [&_br]:hidden md:max-w-none md:[&_br]:inline">
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
          </div>

          <div className="order-1 flex flex-col items-center justify-start text-center md:order-2">
            {locale === "ko" ? (
              <Image
                src="/images/logo_kr.png"
                alt="그리팅스 포크스"
                width={1000}
                height={376}
                className="h-auto w-52 sm:w-64 md:w-72"
                priority
              />
            ) : (
              <Image
                src="/images/logo.webp"
                alt="Greetings Folks"
                width={484}
                height={182}
                className="h-auto w-52 sm:w-64 md:w-72"
                priority
              />
            )}
          </div>

          <div className="order-3 flex w-full flex-col items-center text-center">
            <div className="flex w-full max-w-sm flex-col items-center gap-2 [&_br]:hidden md:max-w-none md:[&_br]:inline">
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
          </div>
        </div>

        <p className="text-footer text-center">Collaborated with</p>

        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6">
          <Image
            src="/images/logo_left.webp"
            alt=""
            aria-hidden
            width={444}
            height={366}
            className="hidden h-auto w-24 shrink-0 sm:block sm:w-36 md:w-44"
          />
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-2 sm:gap-5 md:gap-6">
              <div className="mx-auto w-full max-w-sm space-y-1 sm:max-w-[16rem]">
                <p className="text-footer font-bold">
                  <a
                    href="https://www.soheum.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-70"
                  >
                    Soheum Hwang | 황소흠
                  </a>
                </p>
                <p className="text-footer">
                  Product designer based in London, and a strong believer that
                  creativity thrives at the intersection of contrasting values.
                </p>
                <p className="text-footer">런던에서 활동하고 있는 프로덕트 디자이너</p>
                <p className="text-footer">
                <a href="mailto:sohheum@gmail.com" className="hover:underline">sohheum@gmail.com</a>
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-1 sm:max-w-[16rem]">
                <p className="text-footer font-bold">
                  <a
                    href="https://greetingsfolks.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-opacity hover:opacity-70"
                  >
                    Jihye Lee | 이지혜
                  </a>
                </p>
                <p className="text-footer">
                  Graphic designer, painter and founder of GREETINGS FOLKs.
                  <br />
                  Strategic thinking with creative heart.
                </p>
                <p className="text-footer">
                  그래픽 디자이너, 페인터 그리고 그리팅스 포크스
                </p>
                <p className="text-footer">
                <a href="mailto:ink@greetingsfolks.com" className="hover:underline">ink@greetingsfolks.com</a>
                </p>              
              </div>
            </div>

        
          </div>
          <Image
            src="/images/logo_right.webp"
            alt=""
            aria-hidden
            width={444}
            height={366}
            className="hidden h-auto w-24 shrink-0 sm:block sm:w-36 md:w-44"
          />
        </div>

        <div className="flex items-center justify-center gap-10 sm:hidden">
          <Image
            src="/images/logo_left.webp"
            alt=""
            aria-hidden
            width={444}
            height={366}
            className="h-auto w-24"
          />
          <Image
            src="/images/logo_right.webp"
            alt=""
            aria-hidden
            width={444}
            height={366}
            className="h-auto w-24"
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
