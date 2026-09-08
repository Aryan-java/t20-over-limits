// Optional player-traits system.
// Traits are derived deterministically from a player's role, skills and name so
// that existing saved players (which have no trait data) still get sensible,
// stable values. Any explicit traits attached to a player object win.

import { Player } from "@/types/cricket";
import { PLAYER_DATABASE } from "@/data/playerDatabase";

export type BowlerType = "pace" | "spin";
export type PlayerRole = "Batsman" | "Bowler" | "All-rounder" | "Wicket-keeper";

export interface PlayerTraits {
  /** 0-100: how well the batter handles pace bowling */
  vsPace: number;
  /** 0-100: how well the batter handles spin bowling */
  vsSpin: number;
  /** 0-100: scoring ability inside the powerplay */
  powerplay: number;
  /** 0-100: scoring ability in the death overs */
  deathBatting: number;
  /** 0-100: higher = more vulnerable to the short ball */
  shortBallWeakness: number;
  /** 0-100: raw boundary-hitting power */
  boundaryHitting: number;
  /** 0-100: ability to keep strike ticking with singles */
  strikeRotation: number;
  /** 0-100: bowling effectiveness at the death */
  deathBowling: number;
  /** 0-100: yorker accuracy */
  yorkerAccuracy: number;
  /** 0-100: overall control (fewer extras / loose balls) */
  bowlingControl: number;
  bowlerType: BowlerType;
  role: PlayerRole;
}

/** Players carrying explicit traits (optional; nothing in storage has these yet). */
export type PlayerWithTraits = Player & { traits?: Partial<PlayerTraits> };

const KNOWN_SPINNERS = [
  "ashwin", "jadeja", "chahal", "kuldeep", "axar", "narine", "rashid", "mishra",
  "kumble", "harbhajan", "warne", "murali", "muralitharan", "santner", "maxwell",
  "zampa", "tahir", "sundar", "bishnoi", "varun", "chakravarthy", "hasaranga",
  "mujeeb", "nabi", "moeen", "shreyas gopal", "piyush", "badoni", "markande",
  "sai kishore", "noor ahmad", "kartikeya", "ravi bishnoi", "krishnappa",
  "amit mishra", "ashutosh", "manav", "swapnil", "mayank markande", "jayant",
  "shahbaz", "abhishek sharma", "riyan parag", "washington",
];

const normalize = (name: string) => name.trim().toLowerCase();

/** Deterministic pseudo-random in [0,1) from a string + salt. */
function hash01(name: string, salt: string): number {
  const s = `${normalize(name)}::${salt}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** +/- spread around a base value, deterministic per player. */
const vary = (base: number, name: string, salt: string, spread: number) =>
  clamp(Math.round(base + (hash01(name, salt) - 0.5) * 2 * spread), 1, 99);

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const roleByName = new Map<string, PlayerRole>();
for (const p of PLAYER_DATABASE) roleByName.set(normalize(p.name), p.role as PlayerRole);

export function getPlayerRole(player: Player): PlayerRole {
  const known = roleByName.get(normalize(player.name));
  if (known) return known;
  const bat = player.baseBatSkill ?? player.batSkill;
  const bowl = player.baseBowlSkill ?? player.bowlSkill;
  if (bat >= 60 && bowl >= 60) return "All-rounder";
  if (bowl > bat) return "Bowler";
  return "Batsman";
}

export function getBowlerType(player: Player): BowlerType {
  const n = normalize(player.name);
  if (KNOWN_SPINNERS.some((s) => n.includes(s))) return "spin";
  // Deterministic fallback: roughly 1 in 3 bowlers are spinners.
  return hash01(player.name, "bowler-type") < 0.32 ? "spin" : "pace";
}

const traitCache = new Map<string, PlayerTraits>();

/** Derive (and cache) traits for a player. Explicit `traits` on the player override. */
export function getPlayerTraits(player: PlayerWithTraits): PlayerTraits {
  const key = `${normalize(player.name)}|${player.batSkill}|${player.bowlSkill}`;
  const cached = traitCache.get(key);
  const base = cached ?? deriveTraits(player);
  if (!cached) traitCache.set(key, base);
  return player.traits ? { ...base, ...player.traits } : base;
}

function deriveTraits(player: Player): PlayerTraits {
  const role = getPlayerRole(player);
  const bat = player.baseBatSkill ?? player.batSkill;
  const bowl = player.baseBowlSkill ?? player.bowlSkill;
  const name = player.name;
  const bowlerType = getBowlerType(player);

  const isKeeperOrBat = role === "Batsman" || role === "Wicket-keeper";
  const batBias = isKeeperOrBat ? 4 : role === "All-rounder" ? 0 : -6;

  return {
    vsPace: vary(bat + batBias, name, "vs-pace", 8),
    vsSpin: vary(bat + batBias - 2, name, "vs-spin", 10),
    powerplay: vary(bat, name, "pp", 10),
    deathBatting: vary(bat + (bat > 80 ? 4 : 0), name, "death-bat", 12),
    shortBallWeakness: vary(100 - bat * 0.7, name, "short-ball", 12),
    boundaryHitting: vary(bat + (role === "All-rounder" ? 4 : 0), name, "power", 12),
    strikeRotation: vary(bat * 0.85 + 12, name, "rotate", 10),
    deathBowling: vary(bowl + (bowlerType === "pace" ? 3 : -4), name, "death-bowl", 12),
    yorkerAccuracy: vary(bowl + (bowlerType === "pace" ? 5 : -10), name, "yorker", 12),
    bowlingControl: vary(bowl, name, "control", 8),
    bowlerType,
    role,
  };
}
