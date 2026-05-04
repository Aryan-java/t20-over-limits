// ESPN Cricinfo player image map
// URL pattern: https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/{folder}/{id}.jpg
// folder = floor(id / 100) * 100

const buildUrl = (id: number): string => {
  const folder = Math.floor(id / 100) * 100;
  return `https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/${folder}/${id}.jpg`;
};

// Mapping of normalized player name → Cricinfo ID
const CRICINFO_IDS: Record<string, number> = {
  // CSK
  "ms dhoni": 28081,
  "ruturaj gaikwad": 1060380,
  "shivam dube": 1125957,
  "ravindra jadeja": 234675,
  "deepak chahar": 447261,
  "matheesha pathirana": 1194795,
  "noor ahmad": 793467,
  "moeen ali": 8917,
  "devon conway": 379140,
  "rachin ravindra": 959767,

  // MI
  "rohit sharma": 34102,
  "suryakumar yadav": 446507,
  "tilak varma": 1170265,
  "naman dhir": 1349361,
  "jasprit bumrah": 625383,
  "trent boult": 277912,
  "ryan rickelton": 605661,
  "hardik pandya": 625371,
  "will jacks": 897549,

  // RCB
  "virat kohli": 253802,
  "rajat patidar": 626869,
  "faf du plessis": 44828,
  "phil salt": 669365,
  "josh hazlewood": 288284,
  "mohammed siraj": 940973,
  "yash dayal": 1151286,
  "liam livingstone": 403902,
  "glenn maxwell": 325026,

  // KKR
  "shreyas iyer": 642519,
  "andre russell": 276298,
  "sunil narine": 230558,
  "rinku singh": 723105,
  "varun chakravarthy": 1108375,
  "angkrish raghuvanshi": 1252585,
  "mitchell starc": 311592,
  "venkatesh iyer": 851403,

  // DC
  "rishabh pant": 931581,
  "axar patel": 554691,
  "tristan stubbs": 595978,
  "jake fraser-mcgurk": 1168049,
  "kl rahul": 422108,
  "kuldeep yadav": 559235,
  "ishant sharma": 236779,
  "fionn hand": 1209292,

  // SRH
  "heinrich klaasen": 436757,
  "travis head": 530011,
  "abhishek sharma": 1070183,
  "pat cummins": 489889,
  "nitish kumar reddy": 1175489,
  "mohammed shami": 481896,
  "jaydev unadkat": 390481,

  // RR
  "sanju samson": 425943,
  "jos buttler": 308967,
  "dhruv jurel": 1175489,
  "yashasvi jaiswal": 1151278,
  "riyan parag": 1079470,
  "shimron hetmyer": 670025,
  "sandeep sharma": 438362,

  // PBKS
  "shashank singh": 1070188,
  "prabhsimran singh": 1175485,
  "arshdeep singh": 1125976,
  "yuzvendra chahal": 430246,
  "marco jansen": 696401,
  "shreyas gopal": 423838,

  // GT
  "shubman gill": 1070173,
  "sai sudharsan": 1151286,
  "washington sundar": 719715,
  "rashid khan": 793463,
  "prasidh krishna": 917159,
  "shahrukh khan": 1159843,
  "gerald coetzee": 1148670,

  // LSG
  "nicholas pooran": 604302,
  "quinton de kock": 379143,
  "deepak hooda": 626869,
  "ravi bishnoi": 1175441,
  "avesh khan": 694211,
  "mitchell marsh": 272450,
  "mark wood": 311598,

  // Legends
  "sachin tendulkar": 35320,
  "sourav ganguly": 28779,
  "vvs laxman": 30750,
  "rahul dravid": 28114,
  "anil kumble": 30176,
  "harbhajan singh": 27945,
  "yuvraj singh": 35263,
  "virender sehwag": 35263,
  "gautam gambhir": 28763,
  "suresh raina": 33141,
  "zaheer khan": 35358,
  "irfan pathan": 32540,
  "yusuf pathan": 234666,
  "dinesh karthik": 30045,
  "ambati rayudu": 33399,
  "s badrinath": 26258,

  // Foreign Legends
  "shane warne": 8166,
  "ricky ponting": 7133,
  "adam gilchrist": 5334,
  "andrew flintoff": 13530,
  "shaun pollock": 47493,
  "chris gayle": 51880,
  "brendon mccullum": 37737,
  "david warner": 219889,
  "ab de villiers": 44936,
  "lasith malinga": 49758,
  "kumar sangakkara": 50710,
  "mahela jayawardene": 49289,
  "kevin pietersen": 19296,
  "daniel vettori": 38101,
  "dwayne bravo": 51871,
  "kieron pollard": 51710,

  // Other actives
  "ben stokes": 311158,
  "kane williamson": 277906,
  "steven smith": 267192,
  "joe root": 303669,
  "babar azam": 348144,
  "rohit sharma ": 34102,
  "ravichandran ashwin": 26421,
  "bhuvneshwar kumar": 326016,
  "shikhar dhawan": 28235,
  "ishan kishan": 720471,
  "sam curran": 662973,
  "jonny bairstow": 297433,
  "aaron finch": 5311,
  "jofra archer": 669855,
  "kagiso rabada": 550215,
  "anrich nortje": 481979,
  "lockie ferguson": 493773,
  "tim southee": 226492,
  "tim david": 892371,
  "marcus stoinis": 325012,
  "david miller": 321777,
};

/**
 * Returns the ESPN Cricinfo image URL for a player name, or undefined if unmapped.
 */
export const getPlayerCricinfoImage = (name: string): string | undefined => {
  if (!name) return undefined;
  const key = name.toLowerCase().trim();
  const id = CRICINFO_IDS[key];
  return id ? buildUrl(id) : undefined;
};
