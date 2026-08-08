export type ViewDetailsLocale = "en" | "ko";

export type ViewDetailsCopy = {
  title: string;
  subtitle: string;
  body: string[];
  imageCaption: string;
  sourceTitle: string;
  sourceCredit: string;
  meaningsLabel: string;
  meanings: string;
};

type ViewDetailsEntry = Record<ViewDetailsLocale, ViewDetailsCopy>;

/** Reference images for View details, keyed by envelope.title. */
const VIEW_DETAILS_IMAGE: Partial<Record<string, string>> = {
  Strawberry: "/images/flat_1_more.webp",
  "Birthday Guard": "/images/flat_2_more.webp",
  "Letter Sijeonji": "/images/flat_9_more.webp",
  "Heave-ho!": "/images/flat_4_more.webp",
  "Blue Night Flowers": "/images/flat_8_more.webp",
  "Full Moon Dalhangari": "/images/flat_6_more.webp",
  "Jade Rabbit's Easter": "/images/flat_7_more.webp",
  "Shin Saimdang's Garden": "/images/flat_8_more.webp",
  "Swallow Sijeonji": "/images/flat_9_more.webp",
  "Winter Pinetree": "/images/flat_10_more.webp",
};

const NMK_ENG = (relicId: string) =>
  `https://www.museum.go.kr/ENG/contents/E0402000000.do?searchId=search&schM=view&relicId=${relicId}`;
const NMK_KO = (relicId: string) =>
  `https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?schM=view&searchId=search&relicId=${relicId}`;

const GOGUNG_IRWOROBONGDO =
  "https://gogung.go.kr/gogung/pgm/psgudMng/view.do?psgudSn=363400&menuNo=800065&gubunCd=&pageIndex=988&searchClCd=&searchCondition=&searchKeyword=";

/** Museum collection page for the reference image + caption, keyed by envelope.title. */
const VIEW_DETAILS_IMAGE_HREF: Partial<
  Record<string, Record<ViewDetailsLocale, string>>
> = {
  "Winter Pinetree": {
    en: GOGUNG_IRWOROBONGDO,
    ko: GOGUNG_IRWOROBONGDO,
  },
  "Birthday Guard": {
    en: NMK_ENG("875"),
    ko: NMK_KO("875"),
  },
  "Full Moon Dalhangari": {
    en: NMK_ENG("941"),
    ko: NMK_KO("941"),
  },
  Strawberry: {
    en: NMK_ENG("2061"),
    ko: NMK_KO("2061"),
  },
  "Blue Night Flowers": {
    en: NMK_ENG("2061"),
    ko: NMK_KO("2061"),
  },
  "Shin Saimdang's Garden": {
    en: NMK_ENG("2061"),
    ko: NMK_KO("2061"),
  },
  "Heave-ho!": {
    en: NMK_KO("36553219"),
    ko: NMK_KO("36553219"),
  },
  "Letter Sijeonji": {
    en: `${NMK_KO("100098")}#`,
    ko: `${NMK_KO("100098")}#`,
  },
  "Swallow Sijeonji": {
    en: `${NMK_KO("100098")}#`,
    ko: `${NMK_KO("100098")}#`,
  },
};

/**
 * Long-form View details copy keyed by envelope.title.
 */
export const VIEW_DETAILS: Record<string, ViewDetailsEntry> = {
  "Winter Pinetree": {
    en: {
      title: "Winter Pinetree",
      subtitle: "Evergreen Happiness",
      body: [
        "Irworobongdo, the painting of the sun, moon and five peaks, was traditionally depicted on folding screens featuring pine trees. Placed behind the royal throne in the main hall of Joseon palaces, it symbolised the king and his authority. The ever-green pine trees represent longevity, integrity, and resilience.",
        "This is a two-fold card that captures the pine trees of Irworobongdo in a dimensional form. The front illustrates a serene forest of green pines under falling snow, while the back portrays the innocent joy of a jade rabbit playing across a snowy field.",
        "The envelope reinterprets a type of Joseon Dynasty time envelopes in a modern way, layered with white paper to evoke a softly shimmering, snow-filled sky.",
      ],
      imageCaption: "Irworobongdo",
      sourceTitle: "Irworobongdo",
      sourceCredit: "From the collection of the National Palace Museum of Korea",
      meaningsLabel: "Meaning",
      meanings: "King's Authority · Longevity · Talent · Life",
    },
    ko: {
      title: "겨울 소나무",
      subtitle: "추운 겨울에도 끄덕없는 행복을 담아",
      body: [
        "일월오봉도는 다섯 개의 산봉우리와 해 달 소나무 등을 소재로 주로 병풍에 그려졌습니다. 조선시대 궁궐 정전의 어좌 뒤편에 놓였던 일월오봉도는 왕과 권력을 상징하며 항상 푸르른 소나무는 장수 기개 그리고 강한 생명력을 나타냅니다.",
        "일월오봉도의 소나무를 입체적으로 담은 2단 접이식 카드입니다. 카드 앞면에는 푸른 소나무 숲에 눈이 내린 모습을, 뒷면에는 설원을 뛰어노는 옥토끼의 천진함을 담았습니다.",
        "봉투는 선비의 봉투를 현대적으로 재해석하여 하얀 비단지를 덧대어 눈 내리는 반짝이는 하늘을 담았습니다.",
      ],
      imageCaption: "일월오봉도",
      sourceTitle: "일월오봉도",
      sourceCredit: "국립중앙박물관 소장",
      meaningsLabel: "상징",
      meanings: "왕의 권의 · 장수 · 기재 · 생명",
    },
  },
  "Birthday Guard": {
    en: {
      title: "Birthday Guard",
      subtitle: "A guardian of your birthday",
      body: [
        "The White Tiger is one of the Four Guardian Deities presiding over the western realms of palaces and the heavens. With its mystical strength, it is believed to ward off negative energies, stand by one's side, and invite good fortune—embodying power, courage, and protection. This card carries a heartfelt wish of steady support for the year ahead, offered to someone celebrating their birthday.",
        "This birthday card features a White Tiger, painted in the minhwa tradition using a finely split four-tip brush. The envelope is inspired by bojagi.",
      ],
      imageCaption: "A chest badge embroidered with two tigers",
      sourceTitle: "A chest badge embroidered with two tigers",
      sourceCredit: "From the collection of the National Palace Museum of Korea",
      meaningsLabel: "Meaning",
      meanings: "Auspiciousness · Spiritual power · Valour",
    },
    ko: {
      title: "생일 수호",
      subtitle: "새로운 한해를 지켜줄 생일의 수호",
      body: [
        "백호는 흰 털을 가진 호랑이. 사신 중 하나로 궁궐과 하늘 등의 서쪽을 관장하는 신력입니다. 백호는 영험한 힘으로 나쁜 기운을 물리치고, 사람의 곁을 지키며 복을 불러오는 존재로 힘과 용기, 그리고 수호의 상징이었습니다. 이러한 백호의 의미를 담아, 생일이라는 특별한 날을 맞은 이에게 한 해의 시작을 든든하게 응원하는 마음을 담은 카드입니다.",
        "호랑이 털을 그리는 민화의 붓을 4갈래로 섬세하게 갈라 민화의 호랑이 털을 그리는 기법을 이용하여 그린 생일 축하 카드와 보자기에서 영감받은 봉투 입니다.",
      ],
      imageCaption: "두 마리 호랑이가 수놓아진 흉배",
      sourceTitle: "두 마리 호랑이가 수놓아진 흉배",
      sourceCredit: "국림중앙박물관 소장",
      meaningsLabel: "상징",
      meanings: "상서로움과 영험함, 용맹",
    },
  },
  "Full Moon Dalhangari": {
    en: {
      title: "Full Moon Dalhangari",
      subtitle: "May abundant fortune always be with you",
      body: [
        "White moon jar is a large form of white porcelain that emerged in the late Joseon period. It embodies the beauty of restraint and simplicity and reflects the gentle milky tone, graceful curves, and generous, unadorned form that defines Joseon ceramics.",
        "This moon jar card is crafted from paper that blends fine earthy flecks with the texture of hanji, evoking the quiet presence of the moon itself. GREETINGS FOLKs sealed in the same manner as a potter's mark on porcelain.",
        "Reinterpreting the traditional bojagi through a contemporary lens, the envelope is soft yellow paper reminiscent of moonlight.",
      ],
      imageCaption: "White Dalhangari (White Moon Jar)",
      sourceTitle: "White Dalhangari (White Moon Jar)",
      sourceCredit: "From the collection of the National Museum of Korea",
      meaningsLabel: "Meaning",
      meanings: "Serene beauty · Blessings · Abundance",
    },
    ko: {
      title: "둥근 달 항아리",
      subtitle: "넉넉한 복이 항상 곁에 깃들길",
      body: [
        "절제와 담백의 미를 담은 백자 달항아리는 조선 후기에 형성된 커다란 백자 항아리 양식으로 조선 시대 백자의 온화한 백색과 유려한 곡선, 넉넉하고 꾸밈없는 형태를 모두 갖춘 항아리입니다.",
        "흙의 티끌과 한지의 결이 어우러진 종이로 만든 고요한 달을 닮은 달항아리 카드입니다. 카드 앞면에는 달항아리 모양을 엠보싱으로 새겼고 뒷면에는 마치 도자기에 제작자의 도장을 새기듯 덜 찍히고 더 찍히는 자연스러움이 매력적인 카드입니다.",
        "옛 보자기를 우리의 시선을 담은 현대적인 봉투로 재해석하였으며 달빛을 닮은 밝은 노란빛 종이로 제작되었습니다.",
      ],
      imageCaption: "백자 달항아리",
      sourceTitle: "백자 달항아리",
      sourceCredit: "국립중앙박물관 소장",
      meaningsLabel: "상징",
      meanings: "고요한 아름다움 · 복 · 풍요로움",
    },
  },
  "Blue Night Flowers": {
    en: {
      title: "Blue Night Flowers",
      subtitle: "May abundant fortune be with you",
      body: [
        'Chochungdo (草蟲圖) by Shin Saimdang, or "paintings of grasses and insects," delicately captures the small lives of nature.',
        "This card reinterprets the bindweed from one corner of Chochungdo through a blend of minhwa and botanical illustration.",
        "Inspired by the traditional bojagi, the envelope is reimagined in a contemporary form. Its blue silk lining reflects the colours of a summer night fading into autumn, bringing quiet elegance.",
      ],
      imageCaption: "Chochungdo (草蟲圖)",
      sourceTitle: "Chochungdo (草蟲圖)",
      sourceCredit: "From the collection of the National Museum of Korea",
      meaningsLabel: "Meaning",
      meanings: "Success · Fortune · Abundance with fertility",
    },
    ko: {
      title: "푸른 이파람",
      subtitle: "출세와 다산, 풍요로운 복이 함께 하길",
      body: [
        "신사임당의 초충도(草蟲圖)는 풀과 벌레를 그린 그림이라는 뜻으로, 자연의 작은 생명들을 세밀하게 담아낸 작품입니다.",
        "초충도 한켠에 작게 피어나는 메꽃을 민화와 식물화(Botanical Illustration) 기법으로 재해석해 담았습니다.",
        "봉투는 옛 보자기에서 영감을 받아 현대적으로 재해석하여 여름에서 가을로 넘어가는 밤의 질감을 담았습니다. 안쪽에는 꽃빛을 은은히 반사하는 파란 실크지를 덧대어 단아하면서도 화려한 분위기를 더했습니다.",
      ],
      imageCaption: "신사임당의 초충도",
      sourceTitle: "신사임당의 초충도",
      sourceCredit: "국립중앙박물관 소장",
      meaningsLabel: "상징",
      meanings: "출세 · 길상 · 다산과 풍요",
    },
  },
  "Heave-ho!": {
    en: {
      title: "Heave-ho!",
      subtitle: "With health and abundance",
      body: [
        "This playful minhwa of a hedgehog harvesting ripe cucumbers celebrates both humour and abundance. Its many spines symbolise fertility, prosperity, a bountiful harvest, and good fortune.",
        "In Sip Jangsaeng Do (the painting of longevity symbols), the reishi mushroom resembles auspicious clouds, symbolising fulfilment (yeoui), longevity, and immortality.",
        "This single-fold card captures an autumn scene delivered by a hedgehog carrying reishi mushrooms. Your handwritten message completes the card.",
        "The envelope reinterprets the traditional bojagi in deep brown and warm orange tones, capturing the rich contrasts of autumn.",
      ],
      imageCaption: "A hedgehog stealing cucumbers",
      sourceTitle: "A hedgehog stealing cucumbers",
      sourceCredit: "From Collection of Gansong Art Museum",
      meaningsLabel: "Meaning",
      meanings: "Abundance · health (longevity)",
    },
    ko: {
      title: "영차! 고슴도치와 영지버섯",
      subtitle: "오래도록 건강하고 풍요롭길",
      body: [
        "여름에 싱그럽게 익은 오이를 서리하는 고슴도치를 담은 민화는 해학을 전할 뿐 아니라, 촘촘히 박힌 가시가 다산, 풍요, 풍년과 재복을 상징합니다.",
        "십장생도(長生圖, 장수를 기원하는 그림)에 등장하는 영지버섯은 상서로운 구름을 닮은 모양으로, 여의(如意: 뜻한 바가 이루어진다)와 장수, 불로를 기원하는 상징으로 그려졌습니다.",
        "영지버섯을 나르는 고슴도치가 전해주는 가을을 담은 카드입니다. 풍요롭게 영지버섯이 결실을 맺은 가을 들판이 한눈에 펼쳐지는 풍경에 메세지로 완성하는 카드입니다.",
        "봉투는 전통적인 보자기를 짙은 갈색과 따뜻한 오렌지색으로 재해석하여 가을의 풍부함을 담았습니다.",
      ],
      imageCaption: "오이를 서리하는 고슴도치 (刺蝟負瓜)",
      sourceTitle: "오이를 서리하는 고슴도치 (刺蝟負瓜)",
      sourceCredit: "간송미술관 소장",
      meaningsLabel: "상징",
      meanings: "풍요 · 건강 (불로장생)",
    },
  },
  Strawberry: {
    en: {
      title: "Strawberry",
      subtitle: "May happiness come in everyday moments",
      body: [
        'Chochungdo (草蟲圖) by Shin Saimdang, or "paintings of grasses and insects," delicately captures the small lives of nature. Among its elements, the wild raspberry stands out because of its richness, vitality, and lively charm.',
        "Here, the wild raspberry is reinterpreted as the modern strawberry and painted in the minhwa style. The repeating strawberry pattern brings a lively, humorous touch to traditional beauty.",
        "The envelope is inspired by the traditional bojagi, reimagined in a contemporary form. Like a wrapping cloth with contrasting sides, it pairs a fresh strawberry-red outer paper with an inner lining of a traditional-inspired strawberry pattern.",
      ],
      imageCaption: "Chochungdo (草蟲圖)",
      sourceTitle: "Chochungdo (草蟲圖)",
      sourceCredit: "From the collection of the National Museum of Korea",
      meaningsLabel: "Meaning",
      meanings: "Success · Fortune · Abundance with fertility",
    },
    ko: {
      title: "딸기",
      subtitle: "행복한 일이 이어지길",
      body: [
        "신사임당의 초충도(草蟲圖)는 풀과 벌레를 그린 그림이라는 뜻으로, 자연의 작은 생명들을 세밀하게 담아낸 작품입니다. 특히 그 한편에 등장하는 산딸기는 탐스럽고 생동감 있게 표현되어 예로부터 많은 이들에게 사랑받았습니다.",
        "산딸기를 오늘날의 딸기로 새롭게 해석해 민화 기법으로 그렸습니다. 딸기가 반복되어 이어진 패턴은 전통적인 아름다움 속에 발랄하고 치키(checky)한 매력을 더해, 일상 속에서도 특별함을 느낄 수 있는 엽서로 제작되었습니다.",
        "엽서를 담는 봉투는 옛 보자기를 현대적으로 재해석했습니다. 앞 뒤 색이 다른 보자기처럼, 딸기가 연상되는 싱그러운 빨간색 종이와 전통적이면서 발랄한 딸기패턴의 속지가 매력적인 봉투입니다.",
      ],
      imageCaption: "신사임당의 초충도",
      sourceTitle: "신사임당의 초충도",
      sourceCredit: "국립중앙박물관 소장",
      meaningsLabel: "상징",
      meanings: "출세 · 길상 · 다산과 풍요",
    },
  },
  "Shin Saimdang's Garden": {
    en: {
      title: "Shin Saimdang's Garden",
      subtitle: "Abundant blessings be with you.",
      body: [
        'Chochungdo (草蟲圖) by Shin Saimdang means "paintings of grasses and insects." It closely observes small forms of life in nature. The plants and flowers are full of light and vitality, which is why the work has been long admired.',
        "In this piece, the plants from Chochungdo are reinterpreted using minhwa and botanical illustration. Vertical lines inspired by Joseon-era letter paper are added to bring a sense of tradition into a modern format. The result is a postcard that feels both classic and current.",
        "The envelope is inspired by traditional bojagi. It is reimagined in modern form, using the texture of jade-coloured linen and a simple, refined shape.",
      ],
      imageCaption: "Chochungdo (草蟲圖)",
      sourceTitle: "Chochungdo (草蟲圖)",
      sourceCredit: "From the collection of the National Museum of Korea",
      meaningsLabel: "Meaning",
      meanings: "Success · Fortune · Abundance with fertility",
    },
    ko: {
      title: "신사임당의 가든",
      subtitle: "출세와 다산, 풍요로운 복이 함께 하길",
      body: [
        "신사임당의 초충도(草蟲圖)는 풀과 벌레를 그린 그림이라는 뜻으로, 자연의 작은 생명들을 세밀하게 담아낸 작품입니다. 초충도에 등장하는 식물과 꽃들은 마치 햇빛을 머금은 듯한 생명력과 생동감으로 표현되어 예로부터 많은 이들에게 사랑받았습니다.",
        "초충도에 등장하는 식물들을 민화와 Botanical Illustration(식물 일러스트) 기법으로 재해석하여 그렸습니다. 여기에 시전지(詩箋紙)의 세로선 디테일을 더해 전통적인 멋과 현대적 감각이 어우러진 엽서입니다.",
        "신사임당의 정원 엽서 봉투는 옛 보자기를 우리의 시선을 담아 현대적인 봉투로 재해석했습니다. 옥색 모시의 질감과 보자기 특유의 단아한 모양이 마치 선물을 곱게 싸던 옛 마음을 이어, 당신의 마음 또한 고이 담아 전할 수 있습니다.",
      ],
      imageCaption: "신사임당의 초충도",
      sourceTitle: "신사임당의 초충도",
      sourceCredit: "국립중앙박물관 소장",
      meaningsLabel: "상징",
      meanings: "출세 · 길상 · 다산과 풍요",
    },
  },
  "Jade Rabbit's Easter": {
    en: {
      title: "Jade Rabbit's Easter",
      subtitle: "With huge happiness",
      body: [
        "In the classic 19th-century tale of the jade rabbit beneath the cassia tree, it is said that the rabbit pounds herbs on the round moon to make an elixir of immortality—a symbol of hope.",
        "This story is reimagined in a modern way. The jade rabbits hold Easter eggs and dance together, arms linked in joy. Paired with the vertical lines of seonbi letter paper, it becomes a distinctive Easter postcard.",
        "The envelope draws from the traditional bojagi, reinterpreted in a modern form. Made from yellow paper with a ramie-like texture, it carries the glow of soft moonlight. Each one is carefully handcrafted, adding warmth and a quiet sense of joy to the spirit of Easter.",
      ],
      imageCaption: "Jade Rabbit Pounding Medicine in the 19th Century",
      sourceTitle: "Jade Rabbit Pounding Medicine in the 19th Century",
      sourceCredit: "From a Seoul Economic Daily article",
      meaningsLabel: "Meaning",
      meanings: "Growth of all things · Prosperity · Abundance · Fertility",
    },
    ko: {
      title: "옥토끼가 전해주는 부활절",
      subtitle: "큰 행복과 기쁨이 함께 하길",
      body: [
        "19세기 계수나무 아래 전해 내려오는 ‘약방아 찧는 옥토끼’ 설화에는, 희망을 상징하는 둥근 달에서 약초를 찧어 불사의 약을 만든다는 이야기가 담겨 있습니다.",
        "이 전래 이야기를 현대적으로 풀어 이스터 달걀을 들고 서로 어깨를 맞잡은 옥토끼들이 즐겁게 춤추며 부활절을 즐기는 모습을 엽서에 담았습니다. 선비들의 시전지(詩箋紙)와 옥토끼가 만나 더욱 특별한 부활절 엽서입니다.",
        "엽서를 감싸는 봉투는 모시질감의 밝은 달빛을 머금은 듯한 종이로 옛 보자기를 현대적인 봉투로 재해석했습니다.",
      ],
      imageCaption: "약방아 찧는 옥토끼 19세기",
      sourceTitle: "약방아 찧는 옥토끼 19세기",
      sourceCredit: "서울경제 기사 중",
      meaningsLabel: "상징",
      meanings: "만물의 생장 · 번창 · 풍요 · 다산",
    },
  },
  "Swallow Sijeonji": {
    en: {
      title: "Swallow Sijeonji",
      subtitle: "With good news",
      body: [
        "Swallow Sijeonji is inspired by the Sijeonji used during the Joseon Dynasty to share heartfelt words with family, friends, and loved ones.",
        "The card features embossed lines on soft pink paper, echoing the texture of hanji. A stamped swallow and vertical lines add depth and a contemporary touch, while the imprinting and natural blurring create a distinctive aesthetic.",
        "The envelope reinterprets the letter envelopes of the Joseon Dynasty. Writing on its embossed surface allows the ink to gently bleed into the paper, much like traditional meok (black ink), creating a tactile experience you can both see and feel.",
      ],
      imageCaption: "Sijeonji",
      sourceTitle: "Sijeonji",
      sourceCredit: "From the collection of the National Museum of Korea",
      meaningsLabel: "Meaning",
      meanings: "Joy · Celebration · Good luck · Good news",
    },
    ko: {
      title: "제비와 시전지",
      subtitle: "반가운 소식을 담아",
      body: [
        "제비 시전지는 조선 시대에 가족, 친구, 사랑하는 사람들에게 진심 어린 마음을 전하기 위해 사용되었던 시전지에서 영감을 받았습니다.",
        "카드는 부드러운 핑크색 종이에 엠보싱 선으로 깊이감과 현대적인 감각을 더하며, 도장의 자연스러운 번짐은 독특한 아름다움을 선사합니다.",
        "봉투는 조선 시대의 편지 봉투를 새롭게 해석했습니다. 양각된 표면에 글씨를 쓰면 먹물이 은은하게 번져 마치 전통적인 먹처럼 시각적, 촉각적인 경험을 선사합니다.",
      ],
      imageCaption: "시전지",
      sourceTitle: "시전지",
      sourceCredit: "국립중앙박물관",
      meaningsLabel: "상징",
      meanings: "기쁨 · 축하 · 행운 · 좋은 소식",
    },
  },
  "Letter Sijeonji": {
    en: {
      title: "Letter Sijeonji",
      subtitle: "Filled with happiness",
      body: [
        "Letter Sijeonji is inspired by the Sijeonji used during the Joseon Dynasty to share heartfelt words with family, friends, and loved ones.",
        "The distinctive texture and fibers of Hanji remain intact, creating a naturally bumpy surface when writing with a pencil or pen. The natural imperfections — where the imprint becomes lighter or darker depending on the pressure applied — adds a touch of analog romance.",
        "The envelope is made of dark yet clear purple paper, inspired by traditional bojagi with different colors on the front and back. The envelope inside is a blue silk liner embossed with flowers and butterflies.",
      ],
      imageCaption: "Sijeonji",
      sourceTitle: "Sijeonji",
      sourceCredit: "From the collection of the National Museum of Korea",
      meaningsLabel: "Meaning",
      meanings: "Joy · Celebration · Good luck · Good news",
    },
    ko: {
      title: "시전지 편지지",
      subtitle: "행복을 담아",
      body: [
        "편지 시전지는 조선 시대에 가족, 친구, 사랑하는 사람들에게 진심 어린 마음을 전하기 위해 사용되었던 시전지에서 영감을 받았습니다.",
        "한지 특유의 질감과 섬유질이 그대로 남아 있어 연필이나 펜으로 글씨를 쓸 때 자연스러운 울퉁불퉁한 표면이 느껴집니다. 필압에 따라 인쇄가 옅어지거나 진해지는 자연스러운 불완전함은 아날로그적인 낭만을 더합니다.",
        "봉투는 앞면과 뒷면의 색상이 다른 전통 보자기에서 영감을 받아 짙으면서도 투명한 보라색 종이로 제작되었습니다. 봉투 안쪽에는 꽃과 나비가 양각으로 새겨진 푸른색 비단 안감이 있습니다.",
      ],
      imageCaption: "시전지",
      sourceTitle: "시전지",
      sourceCredit: "국립중앙박물관",
      meaningsLabel: "상징",
      meanings: "기쁨 · 축하 · 행운 · 좋은 소식",
    },
  },
};

export type ViewDetailsContent = ViewDetailsCopy & {
  imageSrc?: string;
  imageHref?: string;
};

export function getViewDetailsCopy(
  envelopeTitle: string,
  locale: ViewDetailsLocale,
): ViewDetailsContent | null {
  const entry = VIEW_DETAILS[envelopeTitle];
  if (!entry) {
    return null;
  }
  const copy = entry[locale] ?? entry.en;
  const hrefs = VIEW_DETAILS_IMAGE_HREF[envelopeTitle];
  return {
    ...copy,
    imageSrc: VIEW_DETAILS_IMAGE[envelopeTitle],
    imageHref: hrefs?.[locale] ?? hrefs?.en,
  };
}
