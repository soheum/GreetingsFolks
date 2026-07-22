export type EnvelopeLayer = {
  src: string;
  width: number;
  height: number;
  anchor: "fill" | "bottom" | "center";
  zIndex: number;
  rotate?: number;
  widthPercent?: number;
  topPercent?: number;
  backSrc?: string;
  backWidth?: number;
  backHeight?: number;
  /** Text area shape on the letter (default rectangular inset). */
  composeShape?: "oval-bottom" | "taper-bottom";
  /**
   * Open motion when writing.
   * - omit / default with backSrc: lift + flip to letter back
   * - "lift-settle": lift up then down on the front (no flip); compose on front
   * - "fold-open": lift, then top cover flaps open while settling down; compose on inside
   * - "lift-rotate-settle": lift, rotate 90° clockwise (e.g. -90 → upright), settle; compose on front
   */
  letterOpenMotion?: "lift-settle" | "fold-open" | "lift-rotate-settle";
  /** Message field layout (default two side-by-side columns). */
  composeLayout?: "single" | "fold-split";
  /**
   * Absolute inset for the write box (Tailwind arbitrary value), e.g. "inset-[10%_12%_14%]".
   * Overrides the default rectangular inset when no composeShape is set.
   */
  composeInset?: string;
  /** Letter message line-height (unitless). Overrides --text-letter--line-height for this letter only. */
  composeLineHeight?: number;
  /** Opened letter face for fold-open motion. */
  insideSrc?: string;
  insideWidth?: number;
  insideHeight?: number;
};

export type EnvelopeTopFlap = {
  insideSrc: string;
  insideWidth: number;
  insideHeight: number;
  bottomInsideSrc?: string;
  bottomInsideWidth?: number;
  bottomInsideHeight?: number;
  backSrc?: string;
  backWidth?: number;
  backHeight?: number;
  outsideSrc: string;
  outsideWidth: number;
  outsideHeight: number;
  widthPercent?: number;
  topPercent?: number;
  zIndex?: number;
};

export type Envelope = {
  title: string;
  subtitle: string;
  description: string;
  alt: string;
  width: number;
  height: number;
  featured: boolean;
  sendable?: boolean;
  /** Envelope zoom when opening to write (default 2). Lower for taller letters. */
  zoomScale?: number;
  /** Extra upward shift while zoomed (e.g. "-16vh"). */
  zoomTranslateY?: string;
  topFlap?: EnvelopeTopFlap;
  src?: string;
  layers?: readonly EnvelopeLayer[];
};

export const ENVELOPES: readonly Envelope[] = [
  {
    title: "Full Moon Dalhangari",
    subtitle: "May abundant fortune always be by your side",
    description:
      "A card to hold your heartfelt words, inspired by graceful beauty of Korea.",
    alt: "Yellow envelope",
    width: 1907,
    height: 2693,
    featured: false,
    sendable: true,
    topFlap: {
      insideSrc: "/images/flat_6_top_inside.webp",
      insideWidth: 1378,
      insideHeight: 776,
      backSrc: "/images/flat_6_back.webp",
      backWidth: 1383,
      backHeight: 1157,
      outsideSrc: "/images/flat_6_top_outside.webp",
      outsideWidth: 1374,
      outsideHeight: 769,
      widthPercent: 100,
      topPercent: 0,
      zIndex: 60,
    },
    layers: [
      {
        src: "/images/flat_6.webp",
        width: 1907,
        height: 2693,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_6_letter.webp",
        width: 1316,
        height: 1127,
        anchor: "center",
        zIndex: 5,
        widthPercent: 76,
        topPercent: 68,
        backSrc: "/images/flat_6_letter_back.webp",
        backWidth: 1318,
        backHeight: 1132,
        composeLayout: "single",
        composeShape: "oval-bottom",
      },
      {
        src: "/images/flat_6_bottom.webp",
        width: 1911,
        height: 1642,
        anchor: "bottom",
        zIndex: 10,
      },
    ],
  },
  {
    title: "Strawberry",
    subtitle: "May happiness come in everyday moments",
    description:
      "A card inspired by the wild raspberry in Chochungdo (草蟲圖)*, symbolising abundance, longevity and prosperity",
    alt: "Red envelope",
    width: 1907,
    height: 2342,
    featured: false,
    sendable: true,
    topFlap: {
      insideSrc: "/images/flat_1_top_inside.webp",
      insideWidth: 1907,
      insideHeight: 1037,
      bottomInsideSrc: "/images/flat_1_bottom_inside.webp",
      bottomInsideWidth: 1907,
      bottomInsideHeight: 1305,
      backSrc: "/images/flat_1_back.webp",
      backWidth: 1903,
      backHeight: 1298,
      outsideSrc: "/images/flat_1_top_outside.webp",
      outsideWidth: 1904,
      outsideHeight: 1063,
      widthPercent: 100,
      topPercent: 0,
      zIndex: 60,
    },
    layers: [
      {
        src: "/images/flat_1.webp",
        width: 1907,
        height: 2342,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_1_letter.webp",
        width: 1814,
        height: 1225,
        anchor: "center",
        zIndex: 5,
        widthPercent: 82,
        topPercent: 72,
        backSrc: "/images/flat_1_letter_back.webp",
        backWidth: 1702,
        backHeight: 1138,
      },
      {
        src: "/images/flat_1_bottom.webp",
        width: 1929,
        height: 1304,
        anchor: "bottom",
        zIndex: 10,
      },
    ],
  },
  {
    title: "Birthday Guardian",
    subtitle: "A guardian of your birthday",
    description:
      "A birthday card with a heartfelt message from the mystical White Tiger",
    alt: "Pink envelope",
    width: 1920,
    height: 2418,
    featured: false,
    sendable: true,
    topFlap: {
      insideSrc: "/images/flat_2_top_inside.webp",
      insideWidth: 1920,
      insideHeight: 1050,
      backSrc: "/images/flat_2_back.webp",
      backWidth: 1852,
      backHeight: 1318,
      outsideSrc: "/images/flat_2_top_outside.webp",
      outsideWidth: 1847,
      outsideHeight: 1015,
      widthPercent: 100,
      topPercent: 0,
      zIndex: 60,
    },
    layers: [
      {
        src: "/images/flat_2.webp",
        width: 1920,
        height: 2418,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_2_letter.webp",
        width: 1245,
        height: 1779,
        anchor: "center",
        zIndex: 5,
        rotate: -90,
        widthPercent: 58,
        topPercent: 70,
        backSrc: "/images/flat_2_letter_back.webp",
        backWidth: 1238,
        backHeight: 1779,
      },
      {
        src: "/images/flat_2_bottom.webp",
        width: 1927,
        height: 1356,
        anchor: "bottom",
        zIndex: 10,
      },
    ],
  },
  {
    title: "Letter Sijeonji",
    subtitle: "Filled with happiness",
    description:
      "Letter paper reimagined from Sijeonji, the popular woodblock-printed stationery of the Joseon Dynasty",
    alt: "Purple envelope",
    width: 1907,
    height: 2342,
    featured: false,
    sendable: true,
    zoomScale: 1.4,
    topFlap: {
      insideSrc: "/images/flat_3_top_inside.webp",
      insideWidth: 1906,
      insideHeight: 1032,
      backSrc: "/images/flat_3_back.webp",
      backWidth: 1922,
      backHeight: 1316,
      outsideSrc: "/images/flat_3_top_outside.webp",
      outsideWidth: 1910,
      outsideHeight: 1053,
      widthPercent: 100,
      topPercent: 0,
      zIndex: 60,
    },
    layers: [
      {
        src: "/images/flat_3.webp",
        width: 1907,
        height: 2342,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_3_letter.webp",
        width: 1292,
        height: 1807,
        anchor: "center",
        zIndex: 5,
        rotate: -90,
        widthPercent: 60,
        topPercent: 73,
        letterOpenMotion: "lift-rotate-settle",
        composeLayout: "single",
        composeInset: "inset-[15%_10%_10%]",
        composeLineHeight: 1.7,
      },
      {
        src: "/images/flat_3_bottom.webp",
        width: 1903,
        height: 1300,
        anchor: "bottom",
        zIndex: 10,
      },
    ],
  },
  {
    title: "Heave-ho!",
    subtitle: "With health and abundance",
    description:
      "An adorable card featuring a hedgehog carrying reishi mushrooms, symbolising longevity",
    alt: "Brown envelope",
    width: 1907,
    height: 2479,
    featured: false,
    sendable: true,
    zoomScale: 1.4,
    topFlap: {
      insideSrc: "/images/flat_4_top_inside.webp",
      insideWidth: 1504,
      insideHeight: 851,
      backSrc: "/images/flat_4_back.webp",
      backWidth: 1533,
      backHeight: 1143,
      outsideSrc: "/images/flat_4_top_outside.webp",
      outsideWidth: 1526,
      outsideHeight: 866,
      widthPercent: 100,
      topPercent: 0,
      zIndex: 60,
    },
    layers: [
      {
        src: "/images/flat_4.webp",
        width: 1907,
        height: 2479,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_4_letter.webp",
        width: 1433,
        height: 1020,
        anchor: "center",
        zIndex: 5,
        widthPercent: 82,
        topPercent: 71,
        letterOpenMotion: "fold-open",
        insideSrc: "/images/flat_4_letter_inside.webp",
        insideWidth: 1422,
        insideHeight: 2043,
      },
      {
        src: "/images/flat_4_bottom.webp",
        width: 1912,
        height: 1405,
        anchor: "bottom",
        zIndex: 10,
      },
    ],
  },
  {
    title: "Blue Night Flowers",
    subtitle: "May abundant fortune be with you",
    description:
      "A card inspired by the evening blooms of Chochungdo*, symbolising success, fortune and abundance",
    alt: "Blue envelope",
    width: 1907,
    height: 2466,
    featured: false,
    sendable: true,
    zoomScale: 1.4,
    topFlap: {
      insideSrc: "/images/flat_5_top_inside.webp",
      insideWidth: 1492,
      insideHeight: 842,
      backSrc: "/images/flat_5_back.webp",
      backWidth: 1512,
      backHeight: 1141,
      outsideSrc: "/images/flat_5_top_outside.webp",
      outsideWidth: 1511,
      outsideHeight: 843,
      widthPercent: 100,
      topPercent: 0,
      zIndex: 60,
    },
    layers: [
      {
        src: "/images/flat_5.webp",
        width: 1907,
        height: 2466,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_5_letter.webp",
        width: 1442,
        height: 1043,
        anchor: "center",
        zIndex: 5,
        widthPercent: 76,
        topPercent: 71,
        letterOpenMotion: "fold-open",
        composeLayout: "fold-split",
        composeShape: "taper-bottom",
        insideSrc: "/images/flat_5_letter_inside.webp",
        insideWidth: 1444,
        insideHeight: 2025,
      },
      {
        src: "/images/flat_5_bottom.webp",
        width: 1495,
        height: 1117,
        anchor: "bottom",
        zIndex: 10,
      },
    ],
  },
  {
    title: "Jade Rabbit's Easter",
    subtitle: "With huge happiness",
    description:
      "Dancing jade rabbits beneath the cassia tree bring hope this Easter",
    alt: "Yellow linen envelope",
    width: 1897,
    height: 2334,
    featured: true,
    sendable: true,
    topFlap: {
      insideSrc: "/images/flat_7_top_inside.webp",
      insideWidth: 1897,
      insideHeight: 1041,
      backSrc: "/images/flat_7_back.webp",
      backWidth: 1902,
      backHeight: 1298,
      outsideSrc: "/images/flat_7_top_outside.webp",
      outsideWidth: 1903,
      outsideHeight: 1047,
      widthPercent: 100,
      topPercent: 0,
      zIndex: 60,
    },
    layers: [
      {
        src: "/images/flat_7.webp",
        width: 1897,
        height: 2334,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_7_letter.webp",
        width: 1795,
        height: 1203,
        anchor: "center",
        zIndex: 5,
        widthPercent: 82,
        topPercent: 72,
        backSrc: "/images/flat_7_letter_back.webp",
        backWidth: 1795,
        backHeight: 1203,
      },
      {
        src: "/images/flat_7_bottom.webp",
        width: 1900,
        height: 1290,
        anchor: "bottom",
        zIndex: 10,
      },
    ],
  },
  {
    title: "Shin Saimdang's Garden",
    subtitle: "Abundant blessings be with you",
    description:
      "A Joseon-style botanical card inspired by Chochungdo*, symbolising prosperity in bloom",
    alt: "Mint envelope",
    width: 1907,
    height: 2342,
    featured: false,
    sendable: true,
    topFlap: {
      insideSrc: "/images/flat_8_top_inside.webp",
      insideWidth: 1907,
      insideHeight: 1055,
      bottomInsideSrc: "/images/flat_8_bottom_inside.webp",
      bottomInsideWidth: 1907,
      bottomInsideHeight: 1301,
      backSrc: "/images/flat_8_back.webp",
      backWidth: 1892,
      backHeight: 1311,
      outsideSrc: "/images/flat_8_top_outside.webp",
      outsideWidth: 1890,
      outsideHeight: 1050,
      widthPercent: 100,
      topPercent: 0,
      zIndex: 60,
    },
    layers: [
      {
        src: "/images/flat_8.webp",
        width: 1907,
        height: 2342,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_8_letter.webp",
        width: 1795,
        height: 1202,
        anchor: "center",
        zIndex: 5,
        widthPercent: 82,
        topPercent: 72,
        backSrc: "/images/flat_8_letter_back.webp",
        backWidth: 1780,
        backHeight: 1199,
      },
      {
        src: "/images/flat_8_bottom.webp",
        width: 1912,
        height: 1295,
        anchor: "bottom",
        zIndex: 10,
      },
    ],
  },
  {
    title: "Swallow sijeonji",
    subtitle: "With good news",
    description:
      "Good news carried by a swallow and Sijeonji, the popular woodblock-printed letter paper of the Joseon Dynasty",
    alt: "Gray tall envelope",
    width: 1133,
    height: 2728,
    featured: false,
    sendable: true,
    zoomScale: 1.2,
    zoomTranslateY: "-14vh",
    topFlap: {
      insideSrc: "/images/flat_9_top_inside.webp",
      insideWidth: 1133,
      insideHeight: 933,
      backSrc: "/images/flat_9_back.webp",
      backWidth: 1125,
      backHeight: 1784,
      outsideSrc: "/images/flat_9_top_outside.webp",
      outsideWidth: 1124,
      outsideHeight: 955,
      widthPercent: 100,
      topPercent: 0,
      zIndex: 60,
    },
    layers: [
      {
        src: "/images/flat_9.webp",
        width: 1133,
        height: 2728,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_9_letter.webp",
        width: 1067,
        height: 1776,
        anchor: "center",
        zIndex: 5,
        widthPercent: 86,
        topPercent: 70,
        letterOpenMotion: "lift-settle",
        composeLayout: "single",
      },
      {
        src: "/images/flat_9_bottom.webp",
        width: 1131,
        height: 1485,
        anchor: "bottom",
        zIndex: 10,
      },
    ],
  },
];

export const INITIAL_CENTER_INDEX = ENVELOPES.findIndex(
  (envelope) => envelope.featured,
);
