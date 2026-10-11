import { test, expect } from "bun:test";
import { playerRecords, historyRecords, parseWinner, rank, THRESHOLDS } from "../src/lib/recordBook";

const row = (name: string, o: any = {}) => ({ player_name: name, matches_batted: 0, total_runs: 0, balls_faced: 0, highest_score: 0, fifties: 0, hundreds: 0, fours: 0, sixes: 0, not_outs: 0, matches_bowled: 0, total_wickets: 0, balls_bowled: 0, runs_conceded: 0, best_bowling_wickets: 0, best_bowling_runs: 0, maidens: 0, ...o });

test("empty datasets", () => {
  const p = playerRecords([]);
  [...p.batting, ...p.bowling].forEach(r => expect(r.entries).toEqual([]));
  const h = historyRecords([]);
  expect(h.matchCount).toBe(0);
  h.team.forEach(r => expect(r.unavailable).toBeTruthy());
});

test("thresholds and calculations", () => {
  const rows = [
    row("A", { matches_batted: 10, not_outs: 2, total_runs: 400, balls_faced: 300 }),
    row("B", { matches_batted: 3, not_outs: 0, total_runs: 300, balls_faced: 90 }), // below both thresholds
    row("C", { matches_bowled: 10, balls_bowled: 120, runs_conceded: 150, total_wickets: 10, best_bowling_wickets: 4, best_bowling_runs: 20 }),
    row("D", { matches_bowled: 2, balls_bowled: 30, runs_conceded: 20, total_wickets: 4, best_bowling_wickets: 4, best_bowling_runs: 12 }),
  ];
  const p = playerRecords(rows);
  const get = (id: string) => [...p.batting, ...p.bowling].find(r => r.id === id)!;
  expect(get("avg").entries.map(e => e.name)).toEqual(["A"]);
  expect(get("avg").entries[0].display).toBe("50.00");
  expect(get("sr").entries[0].display).toBe("133.33");
  expect(get("runs").entries.map(e => e.name)).toEqual(["A", "B"]);
  expect(get("econ").entries.map(e => e.name)).toEqual(["C"]);
  expect(get("econ").entries[0].display).toBe("7.50");
  expect(get("bbi").entries.map(e => e.display)).toEqual(["4/12", "4/20"]);
  expect(THRESHOLDS.bowlBalls).toBe(120);
});

test("ties at the cutoff are all kept", () => {
  const items = [5, 4, 3, 3, 3, 3, 1].map((v, i) => ({ v, i }));
  const out = rank(items, x => x.v, x => ({ name: String(x.i), value: x.v, display: "" }), { limit: 3 });
  expect(out.map(e => e.value)).toEqual([5, 4, 3, 3, 3, 3]);
});

const m = (t1: string, t2: string, result: string | null, d: number, extra: any = {}) => ({
  isCompleted: true, result, completedAt: new Date(2026, 0, d).toISOString(),
  team1: { name: t1 }, team2: { name: t2 },
  team1Setup: { playingXI: [{ name: t1 + "1" }] }, team2Setup: { playingXI: [{ name: t2 + "1" }] },
  firstInnings: { battingTeam: t1, totalRuns: 180, wickets: 5 }, secondInnings: { battingTeam: t2, totalRuns: 150, wickets: 9 }, ...extra,
});

test("history: winners, streaks, margins, older formats", () => {
  expect(parseWinner(m("X", "Y", "Z won by 3 runs", 1) as any)).toBeNull();
  expect(parseWinner(m("X", "Y", "Match Tied - Super Over!", 1) as any)).toBeNull();
  const hist = [
    m("X", "Y", "X won by 30 runs", 1, { manOfTheMatch: { name: "X1" } }),
    m("X", "Y", "X won by 5 wickets", 2),
    m("Y", "X", "Y won by 2 runs", 3),
    m("X", "Y", "Match Tied - Super Over!", 4),
    { result: null, team1: { name: "X" } } as any, // incomplete/old entry ignored
  ];
  const h = historyRecords(hist as any);
  expect(h.matchCount).toBe(4);
  const t = (id: string) => h.team.find(r => r.id === id)!;
  expect(t("tw").entries[0]).toMatchObject({ name: "X", value: 2 });
  expect(t("ws").entries[0]).toMatchObject({ name: "X", value: 2 });
  expect(t("bwr").entries[0].display).toBe("30 runs");
  expect(t("bww").entries[0].display).toBe("5 wkts");
  expect(h.appearance.find(r => r.id === "mp")!.entries[0].value).toBe(4);
  expect(h.appearance.find(r => r.id === "potm")!.entries[0]).toMatchObject({ name: "X1", value: 1 });
});
