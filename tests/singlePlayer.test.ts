import { test, expect } from "bun:test";
import { matchesPlayerName, UNIQUE_PLAYERS } from "../src/lib/playerSearch";
import { buildRandomTeams, maxRandomTeams, availablePlayers, MIN_SQUAD, MAX_SQUAD, MAX_OVERSEAS } from "../src/lib/randomTeams";
import { PLAYER_DATABASE } from "../src/data/playerDatabase";

test("search finds real names by exact, prefix, partial, case, multi-word", () => {
  const find = (q: string) => UNIQUE_PLAYERS.filter(p => matchesPlayerName(p.name, q)).map(p => p.name);
  expect(find("AB de Villiers")).toContain("AB de Villiers");
  expect(find("ajin")).toContain("Ajinkya Rahane");
  expect(find("RUSSELL")).toContain("Andre Russell");
  expect(find("villiers ab")).toContain("AB de Villiers");
  expect(find("fraser mcgurk")).toContain("Jake Fraser-McGurk");
  expect(find("washington")).toEqual(["Washington Sundar"]);
});

test("random teams obey squad rules with no duplicates", () => {
  const max = maxRandomTeams(availablePlayers([]));
  expect(max).toBeGreaterThan(10);
  for (const n of [1, 4, 10, max]) {
    const { teams, error } = buildRandomTeams(n, []);
    expect(error).toBeUndefined();
    expect(teams.length).toBe(n);
    const all = teams.flatMap(t => t.players.map(p => p.name));
    expect(new Set(all).size).toBe(all.length);
    for (const t of teams) {
      expect(t.players.length).toBeGreaterThanOrEqual(MIN_SQUAD);
      expect(t.players.length).toBeLessThanOrEqual(MAX_SQUAD);
      expect(t.players.filter(p => p.isOverseas).length).toBeLessThanOrEqual(MAX_OVERSEAS);
      t.players.forEach(p => expect(PLAYER_DATABASE.some(d => d.name === p.name)).toBe(true));
    }
    expect(new Set(teams.map(t => t.name)).size).toBe(n);
  }
  expect(buildRandomTeams(max + 1, []).error).toBeTruthy();
});
