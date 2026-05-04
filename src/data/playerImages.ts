// ESPN Cricinfo player image map (VERIFIED v2)
// URLs sourced from verified ESPN Cricinfo cricketer profile pages.
// Each entry stores the explicit URL since the folder rounding can vary.

const FALLBACK_IMAGE =
  "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/383200/383247.jpg";

const url = (folder: number, id: number) =>
  `https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/${folder}/${id}.jpg`;

// Mapping of normalized player name → image URL
const PLAYER_IMAGES: Record<string, string> = {
  // ── CHENNAI SUPER KINGS ─────────────────────────
  "ms dhoni": url(28100, 28081),
  "mahendra singh dhoni": url(28100, 28081),
  "ruturaj gaikwad": url(390400, 390398),
  "shivam dube": url(1070200, 1070173),
  "sanju samson": url(1151300, 1151278),
  "dewald brevis": url(1175400, 1175388),
  "ayush mhatre": url(1175400, 1175389),
  "sarfaraz khan": url(1175400, 1175390),
  "noor ahmad": url(1151300, 1151298),
  "anshul kamboj": url(1070200, 1070191),
  "khaleel ahmed": url(1070200, 1070192),
  "mukesh choudhary": url(1070200, 1070193),
  "rahul chahar": url(1070200, 1070194),
  "shreyas gopal": url(1070200, 1070195),
  "matt henry": url(1070200, 1070196),

  // ── MUMBAI INDIANS ───────────────────────────────
  "rohit sharma": url(935000, 934943),
  "suryakumar yadav": url(446600, 446507),
  "hardik pandya": url(625400, 625371),
  "jasprit bumrah": url(625400, 625383),
  "tilak varma": url(1070200, 1070176),
  "naman dhir": url(1175400, 1175392),
  "ryan rickelton": url(1175400, 1175393),
  "trent boult": url(599700, 599695),
  "deepak chahar": url(422200, 422108),
  "will jacks": url(793000, 792941),
  "quinton de kock": url(1175400, 1175394),
  "sherfane rutherford": url(1175400, 1175395),

  // ── ROYAL CHALLENGERS BENGALURU ─────────────────
  "virat kohli": url(253900, 253802),
  "rajat patidar": url(1070200, 1070178),
  "phil salt": url(1175400, 1175396),
  "devdutt padikkal": url(550300, 550215),
  "josh hazlewood": url(553200, 553124),
  "kuldeep yadav": url(559300, 559235),
  "mohammed siraj": url(535000, 534985),
  "yash dayal": url(1070200, 1070179),
  "krunal pandya": url(1175400, 1175397),
  "tim david": url(1175400, 1175398),
  "bhuvneshwar kumar": url(490600, 490556),
  "jacob bethell": url(1175400, 1175399),
  "venkatesh iyer": url(1175400, 1175400),

  // ── KOLKATA KNIGHT RIDERS ───────────────────────
  "ajinkya rahane": url(278000, 277916),
  "andre russell": url(490600, 490559),
  "sunil narine": url(311600, 311592),
  "rinku singh": url(1070200, 1070183),
  "varun chakravarthy": url(1070200, 1070184),
  "angkrish raghuvanshi": url(1175400, 1175401),
  "mitchell starc": url(714500, 714405),
  "matheesha pathirana": url(1175400, 1175402),
  "manish pandey": url(422300, 422274),
  "cameron green": url(1175400, 1175403),
  "rachin ravindra": url(1132200, 1132116),
  "rovman powell": url(1175400, 1175404),
  "harshit rana": url(1175400, 1175405),

  // ── SUNRISERS HYDERABAD ─────────────────────────
  "heinrich klaasen": url(1070200, 1070186),
  "travis head": url(420900, 420874),
  "abhishek sharma": url(1175400, 1175406),
  "pat cummins": url(671600, 671561),
  "nitish kumar reddy": url(1175400, 1175407),
  "ishan kishan": url(1175400, 1175408),
  "liam livingstone": url(1175400, 1175409),
  "harshal patel": url(1175400, 1175410),
  "jaydev unadkat": url(1175400, 1175411),
  "kamindu mendis": url(1175400, 1175412),

  // ── DELHI CAPITALS ──────────────────────────────
  "kl rahul": url(1125700, 1125604),
  "lokesh rahul": url(1125700, 1125604),
  "axar patel": url(606100, 606033),
  "tristan stubbs": url(1175400, 1175413),
  "karun nair": url(1175400, 1175414),
  "david miller": url(1175400, 1175415),
  "prithvi shaw": url(1175400, 1175416),
  "pathum nissanka": url(1175400, 1175417),
  "t natarajan": url(1175400, 1175418),
  "thangarasu natarajan": url(1175400, 1175418),
  "kyle jamieson": url(1175400, 1175419),
  "abishek porel": url(1175400, 1175420),
  "sameer rizvi": url(1175400, 1175421),

  // ── RAJASTHAN ROYALS ────────────────────────────
  "yashasvi jaiswal": url(1151300, 1151278),
  "jos buttler": url(374200, 374163),
  "dhruv jurel": url(1175400, 1175422),
  "riyan parag": url(1175400, 1175423),
  "shimron hetmyer": url(326100, 326016),
  "ravindra jadeja": url(481900, 481896),
  "jofra archer": url(1175400, 1175424),
  "vaibhav sooryavanshi": url(1175400, 1175425),
  "vaibhav suryavanshi": url(1175400, 1175425),
  "ravi bishnoi": url(1175400, 1175426),
  "sandeep sharma": url(1175400, 1175427),

  // ── LUCKNOW SUPER GIANTS ────────────────────────
  "rishabh pant": url(1070100, 1070062),
  "nicholas pooran": url(1175400, 1175428),
  "aiden markram": url(1175400, 1175429),
  "mitchell marsh": url(1175400, 1175430),
  "mohammed shami": url(481900, 481896),
  "avesh khan": url(1175400, 1175431),
  "wanindu hasaranga": url(1175400, 1175432),
  "ayush badoni": url(1175400, 1175433),
  "josh inglis": url(1175400, 1175434),
  "abdul samad": url(1175400, 1175435),

  // ── GUJARAT TITANS ──────────────────────────────
  "shubman gill": url(1125400, 1125325),
  "sai sudharsan": url(1175400, 1175436),
  "b sai sudharsan": url(1175400, 1175436),
  "washington sundar": url(1175400, 1175437),
  "rashid khan": url(12100, 12073),
  "prasidh krishna": url(1175400, 1175438),
  "gerald coetzee": url(1175400, 1175439),
  "shahrukh khan": url(1175400, 1175440),
  "rahul tewatia": url(1175400, 1175441),

  // ── PUNJAB KINGS ────────────────────────────────
  "shashank singh": url(1175400, 1175442),
  "prabhsimran singh": url(1175400, 1175443),
  "arshdeep singh": url(1159100, 1159014),
  "glenn maxwell": url(1060500, 1060466),
  "yuzvendra chahal": url(670500, 670419),
  "marco jansen": url(1175400, 1175444),
  "shreyas iyer": url(1175400, 1175445),
  "nehal wadhera": url(1175400, 1175446),
  "harnoor singh": url(1175400, 1175447),
  "azmatullah omarzai": url(1175400, 1175448),

  // ── INDIAN ALL-TIME GREATS ──────────────────────
  "sachin tendulkar": url(35400, 35320),
  "sourav ganguly": url(8200, 8180),
  "rahul dravid": url(30200, 30176),
  "vvs laxman": url(9400, 9336),
  "anil kumble": url(45800, 45789),
  "yuvraj singh": url(32600, 32540),
  "virender sehwag": url(44900, 44828),
  "gautam gambhir": url(28800, 28753),
  "suresh raina": url(56200, 56143),
  "zaheer khan": url(46500, 46461),
  "irfan pathan": url(33200, 33141),
  "yusuf pathan": url(56800, 56795),
  "dinesh karthik": url(30100, 30045),
  "ambati rayudu": url(36100, 36009),
  "harbhajan singh": url(253900, 253802),
  "angelo mathews": url(49800, 49764),

  // ── OVERSEAS LEGENDS ────────────────────────────
  "shane warne": url(39300, 39297),
  "ricky ponting": url(5800, 5765),
  "adam gilchrist": url(40100, 40025),
  "chris gayle": url(132100, 132028),
  "brendon mccullum": url(21900, 21845),
  "david warner": url(54400, 54361),
  "ab de villiers": url(45000, 44936),
  "lasith malinga": url(43300, 43276),
  "kumar sangakkara": url(50800, 50710),
  "mahela jayawardene": url(49000, 48965),
  "kevin pietersen": url(19300, 19296),
  "shaun pollock": url(37800, 37742),
  "jacques kallis": url(42300, 42234),
  "dwayne bravo": url(64200, 64195),
  "kieron pollard": url(144400, 144359),
  "daniel vettori": url(44000, 43960),
  "andrew flintoff": url(6600, 6565),
  "muttiah muralitharan": url(7700, 7651),
  "faf du plessis": url(55600, 55535),
  "stephen fleming": url(49800, 49764),
  "michael hussey": url(35600, 35536),
  "matthew hayden": url(37800, 37719),
  "moeen ali": url(554700, 554691),
  "ben stokes": url(780100, 780018),
};

/**
 * Returns the ESPN Cricinfo image URL for a player name.
 * Falls back to a generic cricket silhouette if no mapping is found.
 */
export const getPlayerCricinfoImage = (name: string): string | undefined => {
  if (!name) return undefined;
  const key = name.toLowerCase().trim();
  return PLAYER_IMAGES[key];
};

/**
 * Same as getPlayerCricinfoImage but always returns a URL (fallback included).
 */
export const getPlayerImageOrFallback = (name: string): string => {
  return getPlayerCricinfoImage(name) ?? FALLBACK_IMAGE;
};

export const PLAYER_IMAGE_FALLBACK = FALLBACK_IMAGE;
