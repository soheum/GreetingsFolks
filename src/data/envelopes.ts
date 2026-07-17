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
  topFlap?: EnvelopeTopFlap;
  src?: string;
  layers?: readonly EnvelopeLayer[];
};

export const ENVELOPES: readonly Envelope[] = [
  {
    title: "Full Moon Dalhangari",
    subtitle: "May abundant fortune always be by your side",
    description:
"The white moon jar is a large form of white porcelain that emerged in the late Joseon period. It embodies the beauty of restraint and simplicity and reflects the gentle milky tone, graceful curves, and generous, unadorned form that defines Joseon ceramics.",
    alt: "Yellow envelope",
    width: 1907,
    height: 2693,
    featured: false,
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
        topPercent: 54,
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
      "Inspired by the wild raspberry in Chochungdo (草蟲圖)*, this postcard reimagines the fruit as a modern strawberry through the language of minhwa. Traditionally, the Chochungdo (草蟲圖)* symbolises the prosperity of descendants.",
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
        topPercent: 62,
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
      "The White Tiger is one of the Four Guardian Deities presiding over the western realms of palaces and the heavens. This card carries a heartfelt wish of steady support for the year ahead, offered to someone celebrating their birthday.",
    alt: "Pink envelope",
    width: 1920,
    height: 2418,
    featured: false,
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
        topPercent: 54,
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
      "A two-fold card that captures the pine trees of Irworobongdo* in a dimensional form. The front illustrates a serene forest of green pines under falling snow, while the back portrays the innocent joy of a jade rabbit playing across a snowy field.",
    alt: "Purple envelope",
    width: 1907,
    height: 2342,
    featured: false,
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
        topPercent: 54,
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
      "In Sipjangsaengdo (the painting of longevity symbols), the reishi mushroom appears as a symbol of fulfilment, longevity, and immortality. This captures an autumn scene of a hedgehog carrying these, bringing wishes to the recipient.",
    alt: "Brown envelope",
    width: 1907,
    height: 2479,
    featured: false,
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
        topPercent: 52,
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
    title: "Jade Rabbit's Easter",
    subtitle: "With huge happiness",
    description:
      "An easter card inspired by a 19th-century tale of the jade rabbit beneath the cassia tree, pounds herbs on the round moon to make an elixir of immortality—a symbol of hope. They hold Easter eggs and dance together, arms linked in joy.",
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
        topPercent: 62,
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
     "The plants from Chochungdo (草蟲圖)* are reinterpreted using minhwa and botanical illustration. Vertical lines inspired by Joseon-era letter paper brings a sense of tradition into a modern format. Chochungdo (草蟲圖)* symbolises the prosperity.",
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
        topPercent: 62,
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
      "A tall gray envelope for announcements worth sharing, perfect when you want your message to arrive with hope and good news.",
    alt: "Gray tall envelope",
    width: 1133,
    height: 2728,
    featured: false,
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
        topPercent: 46,
        backSrc: "/images/flat_9_letter_back.webp",
        backWidth: 1067,
        backHeight: 1776,
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
