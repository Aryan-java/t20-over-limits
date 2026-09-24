// Shared player search: indexing, ranked + typo-tolerant matching, and squad-rule checks.
import { PLAYER_DATABASE, PlayerData } from "@/data/playerDatabase";
import { IPL_TEAMS_2025 } from "@/data/iplSquads";
import { getPlayerCountry } from "@/data/playerCountries";
import { getBowlerType } from "@/lib/simulation/traits";
import type { Player } from "@/types/cricket";

export const SQUAD_MIN = 18;
export const SQUAD_MAX = 25;
export const SQUAD_OVERSEAS_MAX = 8;

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const teamByPlayer = new Map<string, string>();
for (const t of IPL_TEAMS_2025) for (const n of t.squad) teamByPlayer.set(norm(n), t.name);

export interface SearchablePlayer {
  data: PlayerData;
  name: string;
  nameNorm: string;
  tokens: string[];
  initials: string;
  team?: string;
  countryCode: string;
  countryFlag: string;
  bowlerType: "pace" | "spin";
  /** Non-name keywords (role, origin, bowling type, team). */
  keywords: string;
}

const ROLE_ALIASES: Record<string, string> = {
  Batsman: "batsman batter bat",
  Bowler: "bowler bowl",
  "All-rounder": "all rounder allrounder ar",
  "Wicket-keeper": "wicket keeper wicketkeeper wk keeper",
};

export function buildIndex(players: PlayerData[]): SearchablePlayer[] {
  return players.map((p) => {
    const nameNorm = norm(p.name);
    const tokens = nameNorm.split(" ");
    const c = getPlayerCountry(p.name, p.isOverseas);
    const bowlerType = p.bowlSkill >= 40 ? getBowlerType({ name: p.name } as Player) : "pace";
    const team = teamByPlayer.get(nameNorm);
    const keywords = norm(
      [
        ROLE_ALIASES[p.role] ?? p.role,
        p.isOverseas ? "overseas os foreign" : "indian india domestic",
        c.code,
        p.bowlSkill >= 40 ? `${bowlerType} ${bowlerType === "spin" ? "spinner" : "seamer fast"}` : "",
        team ?? "",
      ].join(" "),
    );
    return {
      data: p, name: p.name, nameNorm, tokens,
      initials: tokens.map((t) => t[0]).join(""),
      team, countryCode: c.code, countryFlag: c.flag, bowlerType, keywords,
    };
  });
}

let defaultIndex: SearchablePlayer[] | null = null;
export const getDefaultIndex = () => (defaultIndex ??= buildIndex(PLAYER_DATABASE));

/** Bounded Levenshtein (returns max+1 when exceeded). */
function lev(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const allowedTypos = (len: number) => (len <= 3 ? 0 : len <= 6 ? 1 : 2);

/** Score one query term against a player. 0 = no match. */
function scoreTerm(term: string, p: SearchablePlayer): number {
  if (p.nameNorm === term) return 1000;
  if (p.nameNorm.startsWith(term)) return 800;
  let best = 0;
  for (const t of p.tokens) {
    if (t === term) best = Math.max(best, 700);
    else if (t.startsWith(term)) best = Math.max(best, 600);
  }
  if (best) return best;
  if (term.length >= 2 && p.initials === term) return 550;
  if (term.length >= 3 && p.nameNorm.includes(term)) return 450;
  const kw = p.keywords.split(" ");
  if (kw.includes(term)) return 350;
  if (term.length >= 3 && kw.some((k) => k.startsWith(term))) return 300;
  const max = allowedTypos(term.length);
  if (max > 0) {
    for (const t of p.tokens) {
      const d = lev(term, t.slice(0, Math.max(term.length, t.length)), max);
      if (d <= max) best = Math.max(best, 250 - d * 60);
      // prefix typo ("virta" for "virat k...")
      if (t.length > term.length && lev(term, t.slice(0, term.length), max) <= max) best = Math.max(best, 180);
    }
  }
  return best;
}

/** Ranked search. Every term must match (AND); ties break by overall rating then name. */
export function searchPlayers(query: string, index: SearchablePlayer[] = getDefaultIndex()): SearchablePlayer[] {
  const q = norm(query);
  const rating = (p: SearchablePlayer) => Math.max(p.data.batSkill, p.data.bowlSkill);
  if (!q) return [...index].sort((a, b) => a.name.localeCompare(b.name));
  const terms = q.split(" ");
  const whole = q.includes(" ") ? q : null;
  const out: { p: SearchablePlayer; s: number }[] = [];
  for (const p of index) {
    let s = 0;
    if (whole && p.nameNorm === whole) s = 5000;
    else if (whole && p.nameNorm.startsWith(whole)) s = 4000;
    else {
      for (const t of terms) {
        const ts = scoreTerm(t, p);
        if (!ts) { s = 0; break; }
        s += ts;
      }
    }
    if (s > 0) out.push({ p, s });
  }
  out.sort((a, b) => b.s - a.s || rating(b.p) - rating(a.p) || a.p.name.localeCompare(b.p.name));
  return out.map((o) => o.p);
}

/** Explain why a player can't join a squad. Returns null when allowed. */
export function squadBlockReason(
  player: { name: string; isOverseas: boolean },
  squad: { name: string; isOverseas: boolean }[],
): string | null {
  if (squad.some((p) => norm(p.name) === norm(player.name))) return "Already in squad";
  if (squad.length >= SQUAD_MAX) return `Squad full (${SQUAD_MAX} max)`;
  if (player.isOverseas && squad.filter((p) => p.isOverseas).length >= SQUAD_OVERSEAS_MAX)
    return `Overseas limit reached (${SQUAD_OVERSEAS_MAX} max)`;
  return null;
}
