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
  composeShape?: "oval-bottom" | "taper-bottom" | "taper-heave";
  /**
   * Open motion when writing.
   * - omit / default with backSrc: lift + flip to letter back
   * - "lift-settle": lift up then down on the front (no flip); compose on front
   * - "fold-open": lift, then top cover flaps open while settling down; compose on inside
   * - "lift-rotate-settle": lift, rotate 90° clockwise (e.g. -90 → upright), settle; compose on front
   * - "lift-rotate-flip": same as lift-rotate-settle, then Y-flip to letter back; compose on back
   * - "lift-rotate-right": upright letter lifts, then rotates 90° clockwise; compose on front
   * - "tri-fold-open": left panel opens, then right cover opens; compose on center
   */
  letterOpenMotion?:
    | "lift-settle"
    | "fold-open"
    | "lift-rotate-settle"
    | "lift-rotate-flip"
    | "lift-rotate-right"
    | "tri-fold-open";
  /** Message field layout (default two side-by-side columns). */
  composeLayout?: "single" | "fold-split";
  /**
   * Absolute inset for the write box (Tailwind arbitrary value), e.g. "inset-[10%_12%_14%]".
   * Overrides the default rectangular inset when no composeShape is set.
   */
  composeInset?: string;
  /** Letter message line-height (unitless). Overrides --text-letter--line-height for this letter only. */
  composeLineHeight?: number;
  /** Letter message font-size (CSS length). Overrides --text-letter for this letter only. Prefer cqw (e.g. "6cqw") so text still tracks the letter. */
  composeFontSize?: string;
  /** Opened letter face for fold-open motion (or full open art for tri-fold center crop). */
  insideSrc?: string;
  insideWidth?: number;
  insideHeight?: number;
  /** Tri-fold: left inside panel. */
  insideLeftSrc?: string;
  insideLeftWidth?: number;
  insideLeftHeight?: number;
  /** Tri-fold: mid-open composite (shown behind the left flap while it opens). */
  insideMidSrc?: string;
  insideMidWidth?: number;
  insideMidHeight?: number;
  /** Tri-fold: right inside panel. */
  insideRightSrc?: string;
  insideRightWidth?: number;
  insideRightHeight?: number;
  /** Closed outside flap (right), above the letter base/center. */
  outsideRightSrc?: string;
  outsideRightWidth?: number;
  outsideRightHeight?: number;
  /** Closed outside flap (left), topmost over right outside. */
  outsideLeftSrc?: string;
  outsideLeftWidth?: number;
  outsideLeftHeight?: number;
  /** Extra scale applied to the letter while writing/opening. */
  letterWriteScale?: number;
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
  /** Optional small footnote under the description (e.g. artwork credit). */
  descriptionNote?: string;
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
    subtitle: "May abundant fortune always be with you",
    description:
      "A card to hold your heartfelt words, inspired by the graceful beauty of Korea.",
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
        widthPercent: 80,
        topPercent: 72,
        backSrc: "/images/flat_6_letter_back.webp",
        backWidth: 1318,
        backHeight: 1132,
        composeLayout: "single",
        composeShape: "oval-bottom",
        composeFontSize: "4.7cqw",
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
      "A card inspired by the wild raspberry in Chochungdo (草蟲圖)*,\nsymbolising abundance, longevity and prosperity",
    descriptionNote:
      'Chochungdo(草蟲圖)* by Shin Saimdang, or "paintings of grasses and insects," delicately captures the small lives of nature.',
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
        // Open/center base: pocket inside (not the full sealed flat_1.webp)
        src: "/images/flat_1_bottom_inside.webp",
        width: 1907,
        height: 1305,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_1_letter.webp",
        width: 1702,
        height: 1138,
        anchor: "center",
        zIndex: 5,
        widthPercent: 82,
        topPercent: 72,
        backSrc: "/images/flat_1_letter_back.webp",
        backWidth: 1814,
        backHeight: 1225,
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
    title: "Birthday Guard",
    subtitle: "A guardian of your birthday",
    description:
      "A birthday card with a heartfelt message from a mystical white tiger",
    alt: "Pink envelope",
    width: 1920,
    height: 2418,
    featured: false,
    sendable: true,
    zoomScale: 1.8,
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
      topPercent: 3,
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
        letterOpenMotion: "lift-rotate-flip",
        composeLayout: "single",
        composeInset: "inset-[5%_5%_5%]",
        composeFontSize: "4.2cqw",
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
    zoomScale: 1.8,
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
        composeInset: "inset-[9%_15%_2%]",
        composeFontSize: "4.7cqw",
        composeLineHeight: 2.2,
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
        topPercent: 73,
        letterOpenMotion: "fold-open",
        composeLayout: "fold-split",
        composeShape: "taper-heave",
        composeFontSize: "4.7cqw",
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
      "A card inspired by the evening blooms of Chochungdo*,\nsymbolising success, fortune and abundance",
    descriptionNote:
      'Chochungdo(草蟲圖)* by Shin Saimdang, or "paintings of grasses and insects," delicately captures the small lives of nature.',
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
        width: 1433,
        height: 1020,
        anchor: "center",
        zIndex: 5,
        widthPercent: 74,
        topPercent: 70,
        letterOpenMotion: "fold-open",
        composeLayout: "fold-split",
        composeShape: "taper-bottom",
        composeFontSize: "4cqw",
        insideSrc: "/images/flat_5_letter_inside.webp",
        insideWidth: 1422,
        insideHeight: 2043,
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
      "A Joseon-style botanical card inspired by Chochungdo*,\nsymbolising prosperity in bloom",
    descriptionNote:
      'Chochungdo(草蟲圖)* by Shin Saimdang, or "paintings of grasses and insects," delicately captures the small lives of nature.',
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
    title: "Swallow Sijeonji",
    subtitle: "With good news",
    description:
      "Good news carried by a swallow and Sijeonji, the popular woodblock-printed letter paper of the Joseon Dynasty",
    alt: "Gray tall envelope",
    width: 1133,
    height: 2728,
    featured: false,
    sendable: true,
    zoomTranslateY: "-13vh",
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
        widthPercent: 80,
        topPercent: 72,
        letterOpenMotion: "lift-rotate-right",
        composeLayout: "single",
        /* Upright write area on landscape letter: inset-[top_right_bottom_left] */
        composeInset: "inset-[20%_4%_21%_4%]",
        composeLineHeight: 2.6,
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
  {
    title: "Winter Pinetree",
    subtitle: "Evergreen Happiness",
    description:
      "Featuring the evergreen pines of Irworobongdo* and a playful rabbit beneath a snowy moon",
    alt: "Blue winter pine envelope",
    width: 1455,
    height: 3324,
    featured: false,
    sendable: true,
    zoomTranslateY: "-13vh",
    topFlap: {
      insideSrc: "/images/flat_10_top_inside.webp",
      insideWidth: 1455,
      insideHeight: 1256,
      backSrc: "/images/flat_10_back.webp",
      backWidth: 1458,
      backHeight: 2039,
      outsideSrc: "/images/flat_10_top_outside.webp",
      outsideWidth: 1455,
      outsideHeight: 1259,
      widthPercent: 100,
      topPercent: 0,
      zIndex: 60,
    },
    layers: [
      {
        src: "/images/flat_10.webp",
        width: 1455,
        height: 3324,
        anchor: "fill",
        zIndex: 0,
      },
      {
        src: "/images/flat_10_letter_center.webp",
        width: 1226,
        height: 1812,
        anchor: "center",
        zIndex: 5,
        widthPercent: 78,
        topPercent: 65,
        letterOpenMotion: "lift-settle",
        composeLayout: "single",
        composeInset: "inset-[0%_4%_0%_4%]",
        composeFontSize: "4.7cqw",
        outsideRightSrc: "/images/flat_10_letter_outside_right.webp",
        outsideRightWidth: 1136,
        outsideRightHeight: 1837,
        outsideLeftSrc: "/images/flat_10_letter_outside_left.webp",
        outsideLeftWidth: 1175,
        outsideLeftHeight: 1838,
        insideRightSrc: "/images/flat_10_letter_inside_right.webp",
        insideRightWidth: 1127,
        insideRightHeight: 1812,
        insideLeftSrc: "/images/flat_10_letter_inside_left.webp",
        insideLeftWidth: 1175,
        insideLeftHeight: 1812,
      },
      {
        src: "/images/flat_10_bottom.webp",
        width: 1463,
        height: 1451,
        anchor: "bottom",
        // Above letter (5); below closed top flap (60)
        zIndex: 40,
      },
    ],
  },
];

export const INITIAL_CENTER_INDEX = ENVELOPES.findIndex(
  (envelope) => envelope.featured,
);
