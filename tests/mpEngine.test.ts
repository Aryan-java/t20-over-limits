import { describe, expect, test } from "bun:test";
import { makeRng, newInnings, playBall, validateBowler, type MatchState, type MPPlayer, type Side } from "../supabase/functions/_shared/mpEngine.ts";

const squad = (p: string): MPPlayer[] => Array.from({ length: 11 }, (_, i) => ({ id: `${p}${i}`, name: `${p} ${i}`, batSkill: 90 - i * 5, bowlSkill: 40 + i * 5 }));
const squads: Record<Side, MPPlayer[]> = { A: squad("A"), B: squad("B") };
const orders: Record<Side, string[]> = { A: squads.A.map((p) => p.id), B: squads.B.map((p) => p.id) };
const strat = { normal: 40, yorker: 20, bouncer: 15, slower: 15, knuckle: 10 };

function simulate(seed: string, overs = 2) {
  let s: MatchState = { overs, current: 0, toss: { winner: "A", decision: "bat" }, innings: [newInnings("A", orders.A)] };
  let v = 0; let innSwitch = -1;
  while (!s.result && v < 500) {
    const inn = s.innings[s.current];
    const bs: Side = inn.battingSide === "A" ? "B" : "A";
    const bowler = orders[bs].slice(6).find((id) => !validateBowler(inn, overs, id, orders[bs]))!;
    const prev = s.current;
    const r = playBall(s, squads, orders, { aggression: 60 }, { field: "balanced", bowlerId: bowler, strategy: strat }, makeRng(`${seed}:${v}`));
    // wide never changes strike
    if (r.ball.extra === "wide" && r.state.current === prev) expect(r.state.innings[prev].striker).toBe(inn.striker);
    s = r.state; v++;
    if (s.current !== prev) innSwitch = v;
  }
  return { s, v, innSwitch };
}

describe("multiplayer engine", () => {
  test("same seed gives identical match (both clients see same result)", () => {
    expect(JSON.stringify(simulate("x").s)).toBe(JSON.stringify(simulate("x").s));
  });
  test("completes match with innings transition and target", () => {
    const { s, innSwitch } = simulate("y");
    expect(s.result).toBeDefined();
    expect(innSwitch).toBeGreaterThan(0);
    expect(s.innings[1].target).toBe(s.innings[0].runs + 1);
  });
  test("bowler rules: no consecutive overs, XI only", () => {
    const inn = newInnings("A", orders.A);
    inn.lastOverBowler = "B10";
    expect(validateBowler(inn, 20, "B10", orders.B)).toBeTruthy();
    expect(validateBowler(inn, 20, "A1", orders.B)).toBeTruthy();
    expect(validateBowler(inn, 20, "B9", orders.B)).toBeNull();
  });
});
