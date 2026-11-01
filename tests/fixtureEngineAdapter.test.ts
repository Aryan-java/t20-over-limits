import { describe, expect, test } from "bun:test";
import { makeRng, playBall, selectBatter, type BowlingDecision } from "../supabase/functions/_shared/mpEngine.ts";
import {
  adaptFixtureForEngine,
  createFixtureMatchState,
  fixtureWinnerToSide,
  type FixtureEngineInput,
} from "../supabase/functions/_shared/fixtureEngineAdapter.ts";

const squad = (prefix: string) => Array.from({ length: 15 }, (_, i) => ({
  id: `${prefix}-${i}`,
  name: `${prefix} Player ${i}`,
  batSkill: 70 + (i % 5),
  bowlSkill: 65 + (i % 7),
  isOverseas: i === 14,
}));

const input = (): FixtureEngineInput => {
  const home = squad("home");
  const away = squad("away");
  return {
    overs: 20,
    home: { id: "team-home", name: "Home XI", squad: home },
    away: { id: "team-away", name: "Away XI", squad: away },
    homeLineup: { teamId: "team-home", playingXI: home.slice(0, 11).map((p) => p.id), impactPlayers: home.slice(11, 13).map((p) => p.id) },
    awayLineup: { teamId: "team-away", playingXI: away.slice(0, 11).map((p) => p.id), impactPlayers: away.slice(11, 13).map((p) => p.id) },
  };
};

describe("fixture engine adapter", () => {
  test("maps home and away to A and B without changing player ids", () => {
    const context = adaptFixtureForEngine(input());
    expect(context.teamIds).toEqual({ A: "team-home", B: "team-away" });
    expect(context.teamNames).toEqual({ A: "Home XI", B: "Away XI" });
    expect(context.orders.A).toHaveLength(11);
    expect(context.orders.B).toHaveLength(11);
    expect(context.orders.A[0]).toBe("home-0");
    expect(context.impactPlayers.B).toEqual(["away-11", "away-12"]);
  });

  test("starts innings for the team that wins the toss and chooses to bat", () => {
    const context = adaptFixtureForEngine(input());
    const state = createFixtureMatchState(20, context, "team-away", "bat");
    expect(state.toss.winner).toBe("B");
    expect(state.innings[0].battingSide).toBe("B");
    expect(state.innings[0].order).toEqual(context.orders.B);
  });

  test("maps a fixture team winner back to the A/B result", () => {
    const context = adaptFixtureForEngine(input());
    expect(fixtureWinnerToSide("team-home", context)).toBe("A");
    expect(fixtureWinnerToSide("team-away", context)).toBe("B");
    expect(fixtureWinnerToSide(null, context)).toBe("tie");
    expect(() => fixtureWinnerToSide("unrelated-team", context)).toThrow();
  });

  test("rejects a lineup that does not belong to its fixture team", () => {
    const bad = input();
    bad.awayLineup.teamId = "team-home";
    expect(() => adaptFixtureForEngine(bad)).toThrow("belongs to a different team");
  });

  test("rejects duplicate or incomplete XIs", () => {
    const bad = input();
    bad.homeLineup.playingXI[10] = bad.homeLineup.playingXI[0];
    expect(() => adaptFixtureForEngine(bad)).toThrow("exactly 11 unique");
  });

  test("rejects a fifth overseas player in the XI", () => {
    const bad = input();
    bad.home.squad.forEach((p, i) => { p.isOverseas = i < 5; });
    expect(() => adaptFixtureForEngine(bad)).toThrow("four overseas");
  });
  test("fixture-created state can resolve a seeded ball using fixture XIs", () => {
    const context = adaptFixtureForEngine(input());
    const state = createFixtureMatchState(2, context, "team-home", "bat");
    const bowlingSide = state.innings[0].battingSide === "A" ? "B" : "A";
    const bowling: BowlingDecision = {
      field: "balanced",
      bowlerId: context.orders[bowlingSide][0],
      strategy: { normal: 100, yorker: 0, bouncer: 0, slower: 0, knuckle: 0 },
    };
    const first = playBall(state, context.squads, context.orders, { aggression: 50 }, bowling, makeRng("fixture-test-seed"));
    const second = playBall(state, context.squads, context.orders, { aggression: 50 }, bowling, makeRng("fixture-test-seed"));
    expect(first.ball).toEqual(second.ball);
    expect(first.state.innings[0].balls).toBeGreaterThanOrEqual(0);
    expect(first.state.lastBall).toEqual(first.ball);
  });

  test("fixture engine supports the existing pending-batter selection contract", () => {
    const context = adaptFixtureForEngine(input());
    const state = createFixtureMatchState(20, context, "team-home", "bat");
    const innings = state.innings[0];
    innings.awaitingBatter = true;
    innings.striker = null;
    const next = selectBatter(state, context.orders.A[2]);
    expect("error" in next).toBe(false);
    if (!("error" in next)) {
      expect(next.state.innings[0].striker).toBe(context.orders.A[2]);
      expect(next.state.innings[0].awaitingBatter).toBe(false);
    }
  });
});
