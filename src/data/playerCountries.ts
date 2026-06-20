// Country mapping for overseas IPL 2026 players (flag emoji + label).
// Indian players default to 🇮🇳. Unknown overseas players fall back to 🌍.

export const COUNTRY_FLAG: Record<string, { flag: string; code: string }> = {
  AUS: { flag: "🇦🇺", code: "AUS" },
  ENG: { flag: "🇬🇧", code: "ENG" },
  SA: { flag: "🇿🇦", code: "SA" },
  NZ: { flag: "🇳🇿", code: "NZ" },
  WI: { flag: "🌴", code: "WI" },
  SL: { flag: "🇱🇰", code: "SL" },
  AFG: { flag: "🇦🇫", code: "AFG" },
  BAN: { flag: "🇧🇩", code: "BAN" },
  ZIM: { flag: "🇿🇼", code: "ZIM" },
  IRE: { flag: "🇮🇪", code: "IRE" },
  NAM: { flag: "🇳🇦", code: "NAM" },
  NED: { flag: "🇳🇱", code: "NED" },
  IND: { flag: "🇮🇳", code: "IND" },
};

// Map overseas players → nation code.
export const PLAYER_COUNTRY: Record<string, string> = {
  // Australia
  "Jamie Overton": "ENG", "Matt Short": "AUS", "Zak Foulkes": "NZ", "Matt Henry": "NZ",
  "Spencer Johnson": "AUS", "Mitchell Starc": "AUS", "Mitchell Marsh": "AUS",
  "Cameron Green": "AUS", "Marcus Stoinis": "AUS", "Cooper Connolly": "AUS",
  "Mitchell Owen": "AUS", "Xavier Bartlett": "AUS", "Pat Cummins": "AUS",
  "Travis Head": "AUS", "Josh Hazlewood": "AUS", "Josh Inglis": "AUS",
  "Tim David": "AUS", "Jason Behrendorff": "AUS", "Adam Zampa": "AUS",
  "Glenn Maxwell": "AUS", "Ben Dwarshuis": "AUS", "Nathan Ellis": "AUS",
  // England
  "Jos Buttler": "ENG", "Tom Banton": "ENG", "Luke Wood": "ENG", "Phil Salt": "ENG",
  "Jordan Cox": "ENG", "Jacob Bethell": "ENG", "Liam Livingstone": "ENG",
  "Brydon Carse": "ENG", "David Payne": "ENG", "Will Jacks": "ENG",
  "Sam Curran": "ENG", "Reece Topley": "ENG", "Harry Brook": "ENG",
  // South Africa
  "Dewald Brevis": "SA", "Lungi Ngidi": "SA", "Kagiso Rabada": "SA",
  "Tristan Stubbs": "SA", "David Miller": "SA", "Aiden Markram": "SA",
  "Anrich Nortje": "SA", "Heinrich Klaasen": "SA", "Marco Jansen": "SA",
  "Lhuan-dre Pretorius": "SA", "Donovan Ferreira": "SA", "Kwena Maphaka": "SA",
  "Nandre Burger": "SA", "Corbin Bosch": "SA", "Ryan Rickelton": "SA",
  "Quinton de Kock": "SA",
  // New Zealand
  "Kyle Jamieson": "NZ", "Mitchell Santner": "NZ", "Trent Boult": "NZ",
  "Glenn Phillips": "NZ", "Finn Allen": "NZ", "Rachin Ravindra": "NZ",
  "Tim Seifert": "NZ", "Lockie Ferguson": "NZ", "Adam Milne": "NZ",
  "Jacob Duffy": "NZ", "Kane Williamson": "NZ",
  // West Indies
  "Akeal Hosein": "WI", "Sherfane Rutherford": "WI", "Sunil Narine": "WI",
  "Rovman Powell": "WI", "Romario Shepherd": "WI", "Shimron Hetmyer": "WI",
  "Nicholas Pooran": "WI", "Andre Russell": "WI", "Jason Holder": "WI",
  // Sri Lanka
  "Pathum Nissanka": "SL", "Dushmantha Chameera": "SL", "Matheesha Pathirana": "SL",
  "Wanindu Hasaranga": "SL", "Dasun Shanaka": "SL", "Kamindu Mendis": "SL",
  "Eshan Malinga": "SL", "Nuwan Thushara": "SL",
  // Afghanistan
  "Noor Ahmad": "AFG", "Rashid Khan": "AFG", "Azmatullah Omarzai": "AFG",
  "Allah Ghazanfar": "AFG",
  // Zimbabwe
  "Blessing Muzarabani": "ZIM",
  // Other
  "Jofra Archer": "ENG",
};

export function getPlayerCountry(name: string, isOverseas: boolean): { flag: string; code: string } {
  if (!isOverseas) return COUNTRY_FLAG.IND;
  const code = PLAYER_COUNTRY[name];
  if (code && COUNTRY_FLAG[code]) return COUNTRY_FLAG[code];
  return { flag: "🌍", code: "OS" };
}
