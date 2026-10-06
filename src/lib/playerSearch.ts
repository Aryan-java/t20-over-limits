import { PLAYER_DATABASE, PlayerData } from "@/data/playerDatabase";

/** Lowercase, strip accents, turn punctuation/hyphens into spaces, collapse whitespace. */
export const normalizeName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** PLAYER_DATABASE with duplicate names removed (duplicate names broke list rendering). */
export const UNIQUE_PLAYERS: PlayerData[] = (() => {
  const seen = new Set<string>();
  return PLAYER_DATABASE.filter((p) => {
    const k = normalizeName(p.name);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
})();

/** True when every word typed appears in the name (any order, partial, case/accent/punctuation-insensitive). */
export function matchesPlayerName(name: string, query: string): boolean {
  const q = normalizeName(query);
  if (!q) return true;
  const n = normalizeName(name);
  if (n.includes(q)) return true;
  const compactN = n.replace(/ /g, "");
  if (compactN.includes(q.replace(/ /g, ""))) return true;
  return q.split(" ").every((t) => n.includes(t));
}
