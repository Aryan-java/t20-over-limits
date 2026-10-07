import type { BallEvent, Innings, Over } from "@/types/cricket";

/** Runs a ball adds to the team total — mirrors the engine (total += ball.runs; extras.runs is bookkeeping only). */
export const ballTeamRuns = (b: BallEvent) => b.runs || 0;

/**
 * Append a delivery to innings.overs. `legalBallsBefore` is innings.ballsBowled before this delivery,
 * so wides/no-balls stay in the current over without advancing it.
 */
export function appendBallToOvers(overs: Over[] = [], ball: BallEvent, legalBallsBefore: number, bowlerName: string): Over[] {
  const overNumber = Math.floor(legalBallsBefore / 6) + 1;
  const next = [...overs];
  const last = next[next.length - 1];
  const r = ballTeamRuns(ball);
  if (last && last.overNumber === overNumber) {
    const balls = [...last.balls, ball];
    const runs = last.runs + r;
    next[next.length - 1] = { ...last, balls, runs, wickets: last.wickets + (ball.isWicket ? 1 : 0), maidenOver: false };
  } else {
    next.push({ overNumber, bowler: bowlerName, balls: [ball], runs: r, wickets: ball.isWicket ? 1 : 0, maidenOver: false });
  }
  return next;
}

export interface OverPoint {
  over: number;
  runs: number;
  wickets: number;
  cumulative: number;
  legalBalls: number;
  phase: "powerplay" | "middle" | "death";
}

const isLegal = (b: BallEvent) => !(b.extras && (b.extras.type === "wide" || b.extras.type === "no-ball"));

/** Deterministic per-over series (includes current partial over). */
export function buildOverSeries(innings: Innings | null | undefined, totalOvers: number): OverPoint[] {
  if (!innings?.overs?.length) return [];
  let cumulative = 0;
  return [...innings.overs]
    .filter((o) => o.balls.length > 0)
    .sort((a, b) => a.overNumber - b.overNumber)
    .map((ov) => {
      const runs = ov.balls.reduce((s, b) => s + ballTeamRuns(b), 0);
      const wickets = ov.balls.filter((b) => b.isWicket).length;
      cumulative += runs;
      const n = ov.overNumber;
      const phase: OverPoint["phase"] = n <= 6 ? "powerplay" : n > totalOvers - 4 ? "death" : "middle";
      return { over: n, runs, wickets, cumulative, legalBalls: ov.balls.filter(isLegal).length, phase };
    });
}

export interface WormRow { over: number; first?: number; second?: number; firstWicket?: number; secondWicket?: number }

/** Merge two innings by actual overNumber; missing overs stay undefined (no manufactured points). */
export function buildWorm(first: OverPoint[], second: OverPoint[]): WormRow[] {
  const map = new Map<number, WormRow>();
  const get = (o: number) => map.get(o) ?? (map.set(o, { over: o }), map.get(o)!);
  first.forEach((p) => { const r = get(p.over); r.first = p.cumulative; if (p.wickets) r.firstWicket = p.cumulative; });
  second.forEach((p) => { const r = get(p.over); r.second = p.cumulative; if (p.wickets) r.secondWicket = p.cumulative; });
  return [...map.values()].sort((a, b) => a.over - b.over);
}
