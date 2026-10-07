import { test, expect } from "bun:test";
import { appendBallToOvers, buildOverSeries, buildWorm } from "../src/lib/overData";
import type { BallEvent, Innings, Over } from "../src/types/cricket";

type Spec = { runs: number; w?: boolean; extra?: "wide" | "no-ball" | "bye" };
// Simulates engine: legal-ball counter only advances on non wide/no-ball
function play(specs: Spec[]): { overs: Over[]; legal: number; total: number } {
  let overs: Over[] = []; let legal = 0; let total = 0;
  for (const s of specs) {
    const ball: BallEvent = { ballNumber: legal, bowler: "B", batsman: "X", runs: s.runs, isWicket: !!s.w,
      extras: s.extra ? { type: s.extra, runs: s.runs } : undefined, commentary: "" };
    overs = appendBallToOvers(overs, ball, legal, "B");
    total += s.runs;
    if (s.extra !== "wide" && s.extra !== "no-ball") legal++;
  }
  return { overs, legal, total };
}
const inn = (overs: Over[]) => ({ overs } as unknown as Innings);
const o1: Spec[] = [{ runs: 1 }, { runs: 1, extra: "wide" }, { runs: 4 }, { runs: 0 }, { runs: 0, w: true }, { runs: 1 }, { runs: 0 }]; // 7
const o2: Spec[] = [{ runs: 6 }, { runs: 4 }, { runs: 1 }, { runs: 1 }, { runs: 0 }, { runs: 0 }]; // 12
const o3: Spec[] = [{ runs: 1, extra: "bye" }, { runs: 1 }, { runs: 2 }, { runs: 0 }, { runs: 0 }, { runs: 0 }]; // 4

test("manhattan & worm from actual balls incl. extras and wicket", () => {
  const { overs, total, legal } = play([...o1, ...o2, ...o3]);
  const s = buildOverSeries(inn(overs), 20);
  expect(s.map((p) => p.runs)).toEqual([7, 12, 4]);
  expect(s.map((p) => p.cumulative)).toEqual([7, 19, 23]);
  expect(s.map((p) => p.over)).toEqual([1, 2, 3]);
  expect(s.map((p) => p.wickets)).toEqual([1, 0, 0]);
  expect(s[0].legalBalls).toBe(6);
  expect(legal).toBe(18);
  expect(s.at(-1)!.cumulative).toBe(total);
});

test("partial current over included", () => {
  const { overs } = play([...o1, { runs: 4 }, { runs: 2, extra: "no-ball" }]);
  const s = buildOverSeries(inn(overs), 20);
  expect(s.map((p) => p.runs)).toEqual([7, 6]);
  expect(s[1].legalBalls).toBe(1);
});

test("two innings with different lengths merge by over number", () => {
  const a = buildOverSeries(inn(play([...o1, ...o2, ...o3]).overs), 20);
  const b = buildOverSeries(inn(play([...o2, { runs: 1 }]).overs), 20);
  const w = buildWorm(a, b);
  expect(w.map((r) => r.first)).toEqual([7, 19, 23]);
  expect(w.map((r) => r.second)).toEqual([12, 13, undefined]);
  expect(w[0].firstWicket).toBe(7);
  expect(buildOverSeries(inn([]), 20)).toEqual([]);
});
