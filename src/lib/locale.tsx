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
  ourServiceTitle: string;
  ourServiceIntro: string;
  ourServiceBody: string[];
  viewDetails: string;
  sendCard: string;
  send: string;
  sending: string;
  pickAnother: string;
  back: string;
  yourLetter: string;
  /** Use `{days}` for the service-class range, e.g. 1-2 */
  cardOnItsWay: string;
  serviceDaysFirst: string;
  serviceDaysSecond: string;
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
  desktopOnlyBanner: string;
  footerAbout: string;
  footerArchive: string;
  footerCta: string;
  footerCollab: string;
  footerCollabKoLine: string;
};

const UI: Record<Locale, UiMessages> = {
  en: {
    ourService: "OUR SERVICE",
    ourServiceTitle: "Greetings folks,",
    ourServiceIntro:
"This letter first started in England and gave luck to the recipients around the world, and now this inspired GREETINGS FOLKs to start an online letter service.",
    ourServiceBody: [
      "GREETINGS FOLKs was founded by a graphic designer whose years in London deepened her appreciation for Korea's timeless beauty.",
      "What began as a stationery brand officially came to a close on 3 April 2026, but we’d like to return the love and warmth that we’ve received from so many people.",
      "Our first project is with SohHeum Hwang who is a London-based UI·UX designer.",
      "",
      "============================================",
      "How It Works",
      "Only 40 letters are sent each day, and anyone can send one free of charge.",
      "Choose a card with a beautiful story based on Korean heritage, write your words, and send it by First Class (1–2 days) or Second Class (3–5 days). It will arrive by email.",
      "Once sent, a letter cannot be cancelled and can only be opened by its recipient.",
      "============================================",
      "I hope your sincerity reaches someone precious to you.",
      "May your heartfelt message reach them",
      "With warmest hearts",
      "Soheum Hwang & GREETINGS FOLKs",
    ],
    viewDetails: "View details",
    sendCard: "Send card",
    send: "Send",
    sending: "Sending...",
    pickAnother: "Pick another",
    back: "Back",
    yourLetter: "Your letter:",
    cardOnItsWay:
      "Your card is on its way! It will arrive in {days} working days",
    serviceDaysFirst: "1-2",
    serviceDaysSecond: "3-5",
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
    desktopOnlyBanner:
      "This service is only available on desktop.\nPlease use your computer to send a card.",
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
    ourServiceTitle: "친애하는 당신에게,",
    ourServiceIntro:
      "이 편지는 영국에서 최초로 시작되어 일 년에 한 바퀴를 돌면서 받는 사람에게 행운을 전하던 행운의 편지 이야기에서 영감을 받아 시작한 GREETINGS FOLKs의 온라인 편지 서비스입니다.",
    ourServiceBody: [
      "런던에서 그래픽 디자이너로 활동하며 아름다운 마음이 담긴 옛것을 사랑하는 마음으로 시작한 문구 브랜드 GREETINGS FOLKs는 2026년 4월 3일 공식적인 판매를 마쳤지만 브랜드를 아껴주던 마음을 보답하고자 새로운 방식으로 이어가고 싶었습니다.",
      "우리의 첫 번째 프로젝트는 런던을 기반으로 활동하는 UI·UX 디자이너 황소흠남과 함께합니다.",
      "",
      "============================================",
      "이용 방법",
      "매일 단 40통만 전해지는 특별한 편지이며 누구나 무료로 편지를 쓰고 보낼 수 있습니다.",
      "아름다운 의미가 담긴 카드를 고른 뒤 편지를 작성하면, 익일특급 (1–2일) 또는 일반 배송(3–5일)으로 이메일로 전해집니다.",
      "한 번 보낸 편지는 취소할 수 없으며, 오직 받는 사람만 열어 읽을 수 있습니다.",
      "============================================",
      "",
      "",
      "당신의 진심이 소중한 누군가에게 닿기를 바랍니다.",
      "행복하길 바라는 마음을 가득 담아,",
      "황소흠 & GREETINGS FOLKs",
    ],
    viewDetails: "자세히 보기",
    sendCard: "카드 보내기",
    send: "보내기",
    sending: "보내는 중...",
    pickAnother: "다른 카드 고르기",
    back: "뒤로",
    yourLetter: "당신의 편지:",
    cardOnItsWay: "편지가 발송됐습니다! 약 {days}일 후에 도착할 예정입니다",
    serviceDaysFirst: "1-2",
    serviceDaysSecond: "3-5",
    sendReply: "답장 보내기",
    serviceType: "배송 옵션:",
    serviceFirst: "익익특급 (영업일 1–2일)",
    serviceSecond: "일반우편 (영업일 3–5일)",
    recipient: "받는 사람",
    recipientEmail: "받는 사람 이메일",
    sender: "보내는 사람",
    yourName: "보내는 사람 이름",
    writeLetterPlaceholder: "여기에 편지를 적으세요",
    openLetterHint: "편지를 클릭하면 카드가 열립니다",
    desktopOnlyBanner:
      "이 서비스는 데스크톱에서만 이용할 수 있습니다.\n카드를 보내려면 컴퓨터를 사용해 주세요.",
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
  descriptionNote?: string;
};

const CHOCHUNGDO_NOTE_KO =
  "초충도(草蟲圖)*는 신사임당의 그림으로, ‘풀과 벌레의 그림’이라 불리며 자연의 작은 생명들을 섬세하게 담아냅니다.";

const ENVELOPE_KO: Record<string, EnvelopeCopy> = {
  "Full Moon Dalhangari": {
    title: "둥근 달 항아리",
    subtitle: "넉넉한 복이 항상 곁에 깃들길",
    description:
      "당신의 진심을 담아 전할 수 있는 고요한 한국의 미를 담은 카드",
  },
  Strawberry: {
    title: "딸기",
    subtitle: "행복한 일이 이어지길",
    description:
      "풍요와 장수, 번영의 의미를 담은 초충도의 산딸기에서 영감을 받은 카드",
    descriptionNote: CHOCHUNGDO_NOTE_KO,
  },
  "Birthday Guard": {
    title: "생일 수호",
    subtitle: "새로운 한해를 지켜줄 생일의 수호",
    description:
      "영험한 힘을 지닌 백호의 사랑스런 생일 수호 메세지가 담긴 생일 카드",
  },
  "Letter Sijeonji": {
    title: "시전지 편지지",
    subtitle: "행복을 담아",
    description:
      "조선시대 유행한 목판화 ‘시전지’를 현대적으로 재해석한 편지지",
  },
  "Heave-ho!": {
    title: "영차! 고슴도치와 영지버섯",
    subtitle: "오래도록 건강하고 풍요롭길",
    description:
      "가을이 되어 불로장생을 상징하는 영지버섯을 나르는 고슴도치를 담은 귀여운 카드",
  },
  "Blue Night Flowers": {
    title: "푸른 이파람",
    subtitle: "풍요로운 복이 함께 하길",
    description:
      "성공과 복 그리고 풍요를 담은 초충도의 꽃이 밤에 아름답게 핀 카드",
    descriptionNote: CHOCHUNGDO_NOTE_KO,
  },
  "Jade Rabbit's Easter": {
    title: "옥토끼가 전해주는 부활절",
    subtitle: "큰 행복과 기쁨이 함께 하길",
    description:
      "계수나무 아래 희망을 상징하는 옥토끼 춤추며 전하는 부활절 카드",
  },
  "Shin Saimdang's Garden": {
    title: "신사임당의 가든",
    subtitle: "출세와 다산, 풍요로운 복이 함께 하길",
    description:
      "초충도에서 영감을 받아 복이 피어나길 바라는 마음을 담은 조선시대 풍의 보타니컬 카드",
    descriptionNote: CHOCHUNGDO_NOTE_KO,
  },
  "Swallow Sijeonji": {
    title: "제비와 시전지",
    subtitle: "반가운 소식을 담아",
    description:
      "제비가 전해주는 좋은소식과 조선시대 유행한 목판화 ‘시전지’",
  },
  "Winter Pinetree": {
    title: "겨울 소나무",
    subtitle: "추운 겨울에도 끄덕없는 행복을 담아",
    description:
      "일월오봉도의 소나무와 눈 덮인 달 아래 장난치는 토끼를 담은 카드",
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
    descriptionNote?: string;
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
          descriptionNote: envelope.descriptionNote,
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
