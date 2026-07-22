"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "ko";

type UiMessages = {
  ourService: string;
  viewDetails: string;
  sendCard: string;
  send: string;
  sending: string;
  pickAnother: string;
  sendReply: string;
  serviceType: string;
  serviceFirst: string;
  serviceSecond: string;
  recipient: string;
  recipientEmail: string;
  sender: string;
  yourName: string;
  writeLetterPlaceholder: string;
  openLetterHint: string;
  footerAbout: string;
  footerArchive: string;
  footerCta: string;
  footerCollab: string;
  footerCollabKoLine: string;
};

const UI: Record<Locale, UiMessages> = {
  en: {
    ourService: "OUR SERVICE",
    viewDetails: "View details",
    sendCard: "Send card",
    send: "Send",
    sending: "Sending...",
    pickAnother: "Pick another",
    sendReply: "Send reply",
    serviceType: "Service type:",
    serviceFirst: "First class (1-2 working days)",
    serviceSecond: "Second class (3-5 working days)",
    recipient: "Recipient",
    recipientEmail: "Recipient email",
    sender: "Sender",
    yourName: "Your name",
    writeLetterPlaceholder: "Write your letter here...",
    openLetterHint: "Click on the letter to open the card",
    footerAbout:
      "GREETINGS FOLKs is a stationery brand that interprets the timeless charm and heartfelt spirit of traditional paintings and objects into a modern lifestyle.",
    footerArchive:
      "Our official orders closed on 3rd April 2026 and we continue our path as an archive.",
    footerCta: "Pick up your card & ink your love into words!",
    footerCollab: "COLLABORATIONs and INQUIRIEs email only",
    footerCollabKoLine: "협업문의 & 문의는 이메일로만 받습니다",
  },
  ko: {
    ourService: "서비스 소개",
    viewDetails: "자세히 보기",
    sendCard: "카드 보내기",
    send: "보내기",
    sending: "보내는 중...",
    pickAnother: "다른 카드 고르기",
    sendReply: "답장 보내기",
    serviceType: "배송 옵션:",
    serviceFirst: "1종 (영업일 1–2일)",
    serviceSecond: "2종 (영업일 3–5일)",
    recipient: "받는 사람",
    recipientEmail: "받는 사람 이메일",
    sender: "보내는 사람",
    yourName: "보내는 사람 이름",
    writeLetterPlaceholder: "편지를 작성해 주세요...",
    openLetterHint: "편지를 클릭하면 카드가 열립니다",
    footerAbout:
      "GREETINGS FOLKs는 옛것의 아름다운 마음이 깃든 생활품에서 영감을 받아 현대적인 라이프스타일로 재해석한 문구 브랜드입니다.",
    footerArchive:
      "문구 구매는 2026년 4월 3일부로 마무리되었지만 그리팅스 포크스는 아카이브로 이어갑니다.",
    footerCta: "카드를 골라 당신의 마음을 글로 전해보세요!",
    footerCollab: "협업·문의는 이메일로만 받습니다",
    footerCollabKoLine: "COLLABORATIONs and INQUIRIEs email only",
  },
};

type EnvelopeCopy = {
  title: string;
  subtitle: string;
  description: string;
};

const ENVELOPE_KO: Record<string, EnvelopeCopy> = {
  "Full Moon Dalhangari": {
    title: "보름달 달항아리",
    subtitle: "풍요로운 복이 늘 함께하기를",
    description:
      "한국의 단아한 아름다움에서 영감을 받아, 진심을 담아 전하는 카드입니다.",
  },
  Strawberry: {
    title: "산딸기",
    subtitle: "일상의 순간마다 행복이 함께하기를",
    description:
      "초충도(草蟲圖)*의 산딸기에서 영감을 받은 카드로, 풍요·장수·번영을 상징합니다.",
  },
  "Birthday Guardian": {
    title: "생일의 수호",
    subtitle: "당신의 생일을 지키는 수호자",
    description: "신비로운 백호가 전하는 진심 어린 생일 카드입니다.",
  },
  "Letter Sijeonji": {
    title: "편지 시전지",
    subtitle: "행복이 가득 담긴",
    description:
      "조선 시대에 사랑받던 목판 인쇄 편지지, 시전지를 재해석한 편지 카드입니다.",
  },
  "Heave-ho!": {
    title: "힘차게!",
    subtitle: "건강과 풍요와 함께",
    description:
      "장수를 상징하는 영지버섯을 짊어진 고슴도치가 등장하는 사랑스러운 카드입니다.",
  },
  "Blue Night Flowers": {
    title: "푸른 밤꽃",
    subtitle: "풍요로운 복이 함께하기를",
    description:
      "초충도*의 저녁 꽃에서 영감을 받은 카드로, 성공·행운·풍요를 상징합니다.",
  },
  "Jade Rabbit's Easter": {
    title: "옥토끼의 부활절",
    subtitle: "큰 행복과 함께",
    description:
      "계수나무 아래서 춤추는 옥토끼들이 이번 부활절에 희망을 전합니다.",
  },
  "Shin Saimdang's Garden": {
    title: "신사임당의 정원",
    subtitle: "풍성한 축복이 함께하기를",
    description:
      "초충도*에서 영감을 받은 조선풍 식물 카드로, 피어나는 번영을 담았습니다.",
  },
  "Swallow sijeonji": {
    title: "제비 시전지",
    subtitle: "반가운 소식과 함께",
    description:
      "제비가 전하는 기쁜 소식과 조선 시대 목판 편지지 시전지를 담은 카드입니다.",
  },
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: UiMessages;
  envelopeCopy: (envelope: {
    title: string;
    subtitle: string;
    description: string;
  }) => EnvelopeCopy;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next === "ko" ? "ko" : "en";
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: UI[locale],
      envelopeCopy: (envelope) => {
        if (locale === "ko") {
          return ENVELOPE_KO[envelope.title] ?? envelope;
        }
        return {
          title: envelope.title,
          subtitle: envelope.subtitle,
          description: envelope.description,
        };
      },
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
