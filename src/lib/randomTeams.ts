import { PlayerData } from "@/data/playerDatabase";
import { UNIQUE_PLAYERS, normalizeName } from "@/lib/playerSearch";

export const MIN_SQUAD = 18;
export const MAX_SQUAD = 25;
export const MAX_OVERSEAS = 8;
export const TARGET_SQUAD = 20;

const PREFIXES = ["Royal", "Coastal", "Desert", "Thunder", "Golden", "Mighty", "Electric", "Rising", "Northern", "Southern", "Blazing", "Iron", "Crimson", "Emerald", "Midnight", "Storm", "Silver", "Wild", "Urban", "Imperial"];
const PLACES = ["Ahmedabad", "Kochi", "Pune", "Indore", "Ranchi", "Nagpur", "Guwahati", "Lucknow", "Jaipur", "Chennai", "Kolkata", "Delhi", "Mumbai", "Hyderabad", "Bengaluru", "Mohali", "Dharamshala", "Vizag", "Cuttack", "Raipur"];
const MASCOTS = ["Strikers", "Titans", "Warriors", "Chargers", "Tuskers", "Panthers", "Falcons", "Rhinos", "Cobras", "Hurricanes", "Mavericks", "Gladiators", "Sultans", "Lions", "Hawks", "Rangers", "Knights", "Dragons", "Sharks", "Wolves"];

// Rough role balance for a 20-player squad
const ROLE_TARGET: Record<PlayerData["role"], number> = { "Wicket-keeper": 2, Batsman: 6, "All-rounder": 5, Bowler: 7 };

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Players not already owned by an existing team. */
export function availablePlayers(takenNames: string[]): PlayerData[] {
  const taken = new Set(takenNames.map(normalizeName));
  return UNIQUE_PLAYERS.filter((p) => !taken.has(normalizeName(p.name)));
}

/** Largest team count that can be built with valid squads from the free player pool. */
export function maxRandomTeams(pool: PlayerData[]): number {
  const indian = pool.filter((p) => !p.isOverseas).length;
  // each squad needs at least MIN_SQUAD players, of which at most MAX_OVERSEAS overseas
  const byTotal = Math.floor(pool.length / MIN_SQUAD);
  const byIndian = Math.floor(indian / (MIN_SQUAD - MAX_OVERSEAS));
  return Math.max(0, Math.min(byTotal, byIndian));
}

export interface RandomTeamSpec { name: string; players: PlayerData[] }

export function buildRandomTeams(
  count: number,
  takenNames: string[],
  existingTeamNames: string[] = [],
  rnd: () => number = Math.random,
): { teams: RandomTeamSpec[]; error?: string } {
  const pool = availablePlayers(takenNames);
  const max = maxRandomTeams(pool);
  if (count < 1) return { teams: [], error: "Choose at least 1 team." };
  if (count > max) {
    return { teams: [], error: `Only ${pool.length} unassigned players are left — enough for at most ${max} team${max === 1 ? "" : "s"}.` };
  }

  // Squad size: as close to TARGET_SQUAD as the pool allows, never below MIN_SQUAD
  const size = Math.max(MIN_SQUAD, Math.min(TARGET_SQUAD, MAX_SQUAD, Math.floor(pool.length / count)));
  const remaining = shuffle(pool, rnd);
  const take = (pred: (p: PlayerData) => boolean, n: number, into: PlayerData[], osLeft: { n: number }) => {
    for (let i = 0; i < remaining.length && n > 0; ) {
      const p = remaining[i];
      if (pred(p) && (!p.isOverseas || osLeft.n > 0)) {
        into.push(p);
        remaining.splice(i, 1);
        if (p.isOverseas) osLeft.n--;
        n--;
      } else i++;
    }
  };

  // Indians reserved so later teams can still reach MIN_SQUAD
  const teams: RandomTeamSpec[] = [];
  const usedNames = new Set(existingTeamNames.map((n) => n.toLowerCase()));
  for (let t = 0; t < count; t++) {
    const squad: PlayerData[] = [];
    const os = { n: Math.min(MAX_OVERSEAS, Math.round(size * 0.35)) };
    for (const role of Object.keys(ROLE_TARGET) as PlayerData["role"][]) {
      take((p) => p.role === role, Math.round((ROLE_TARGET[role] * size) / TARGET_SQUAD), squad, os);
    }
    if (squad.length < size) take(() => true, size - squad.length, squad, os);
    if (squad.length < MIN_SQUAD) return { teams: [], error: "Not enough suitable players to build valid squads." };

    let name = "";
    for (let tries = 0; tries < 50 && (!name || usedNames.has(name.toLowerCase())); tries++) {
      const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
      name = rnd() < 0.5 ? `${pick(PREFIXES)} ${pick(MASCOTS)}` : `${pick(PLACES)} ${pick(MASCOTS)}`;
    }
    if (usedNames.has(name.toLowerCase())) name = `${name} ${t + 1}`;
    usedNames.add(name.toLowerCase());
    teams.push({ name, players: squad });
  }
  return { teams };
}
