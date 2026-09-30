// Deterministic, serialisable multiplayer ball resolver.
// Mirrors simulateBallOutcome in src/components/BallByBallEngine.tsx and the
// tactics modifiers in src/types/tactics.ts, but uses a seeded RNG so the
// server produces one authoritative outcome for every client.

export type Side = "A" | "B";
export type Delivery = "normal" | "yorker" | "bouncer" | "slower" | "knuckle";
export type FieldPreset = "attacking" | "balanced" | "defensive" | "death";

export interface MPPlayer { id: string; name: string; batSkill: number; bowlSkill: number; isOverseas?: boolean; imageUrl?: string }
export interface BatLine { runs: number; balls: number; fours: number; sixes: number; out: boolean; how?: string }
export interface BowlLine { balls: number; runs: number; wickets: number; wides: number; noBalls: number }
export interface BallRecord {
  n: number; over: string; bowler: string; batter: string; runs: number; wicket: boolean;
  how?: string; extra?: "wide" | "no-ball" | "bye" | "leg-bye"; delivery: Delivery; freeHit?: boolean; text: string;
}
export interface Innings {
  battingSide: Side; runs: number; wickets: number; balls: number; extras: number;
  striker: string | null; nonStriker: string | null; order: string[]; nextIdx: number;
  batters: Record<string, BatLine>; bowlers: Record<string, BowlLine>;
  currentBowler: string | null; lastOverBowler: string | null; freeHit: boolean;
  recent: BallRecord[]; overRuns: number[]; target?: number; done: boolean;
}
export interface MatchState {
  overs: number; current: 0 | 1; toss: { winner: Side; decision: "bat" | "bowl" };
  innings: Innings[]; result?: { winner: Side | "tie"; text: string }; lastBall?: BallRecord;
}
export interface BattingDecision { aggression: number }
export interface BowlingDecision { field: FieldPreset; bowlerId: string; strategy: Record<Delivery, number> }

// ---------- RNG ----------
function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}
export function makeRng(seed: string): () => number {
  let a = hashStr(seed);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- tactics (same numbers as src/types/tactics.ts) ----------
function pickDelivery(s: Record<Delivery, number>, rng: () => number): Delivery {
  const e = Object.entries(s) as [Delivery, number][];
  const tot = e.reduce((a, [, w]) => a + Math.max(0, w), 0) || 1;
  let r = rng() * tot;
  for (const [k, w] of e) { r -= Math.max(0, w); if (r <= 0) return k; }
  return "normal";
}
function mods(d: Delivery, aggression: number, field: FieldPreset) {
  const m = { boundaryMul: 1, sixMul: 1, dotMul: 1, wicketMul: 1, singleMul: 1, extrasMul: 1 };
  if (d === "yorker") { m.dotMul *= 1.4; m.boundaryMul *= 0.55; m.sixMul *= 0.4; m.wicketMul *= 1.25; m.extrasMul *= 1.15; }
  if (d === "bouncer") { m.dotMul *= 1.15; m.sixMul *= 1.2; m.boundaryMul *= 0.9; m.wicketMul *= 1.15; m.extrasMul *= 1.3; }
  if (d === "slower") { m.dotMul *= 1.2; m.boundaryMul *= 0.85; m.sixMul *= 0.85; m.wicketMul *= 1.2; }
  if (d === "knuckle") { m.dotMul *= 1.1; m.wicketMul *= 1.1; m.boundaryMul *= 0.9; }
  const a = (aggression - 50) / 50;
  m.boundaryMul *= 1 + a * 0.5; m.sixMul *= 1 + a * 0.7; m.wicketMul *= 1 + a * 0.6; m.dotMul *= 1 - a * 0.25; m.singleMul *= 1 - Math.abs(a) * 0.1;
  if (field === "attacking") { m.wicketMul *= 1.2; m.boundaryMul *= 1.15; m.dotMul *= 0.95; }
  if (field === "defensive") { m.boundaryMul *= 0.75; m.sixMul *= 0.85; m.singleMul *= 1.15; m.wicketMul *= 0.9; m.dotMul *= 1.05; }
  if (field === "death") { m.boundaryMul *= 0.85; m.sixMul *= 0.9; m.dotMul *= 1.1; m.extrasMul *= 1.1; m.wicketMul *= 1.05; }
  return m;
}

// ---------- outcome (port of simulateBallOutcome) ----------
function outcome(bat: MPPlayer, bowl: MPPlayer, overIdx: number, totalOvers: number, d: Delivery, bd: BattingDecision, bw: BowlingDecision, rng: () => number) {
  const diff = bat.batSkill - bowl.bowlSkill;
  let dot = Math.max(20, 45 - diff * 0.3), wkt = Math.max(3, 8 - diff * 0.1), four = Math.max(8, 15 + diff * 0.2), six = Math.max(2, 6 + diff * 0.15), one = 35;
  const two = 15;
  const pp = overIdx < Math.max(1, Math.round(totalOvers * 0.3));
  const death = overIdx >= totalOvers - Math.max(1, Math.round(totalOvers * 0.2));
  if (pp) { four *= 1.5; six *= 1.3; one *= 1.2; dot *= 0.8; wkt *= 1.1; }
  if (death) { four *= 1.3; six *= 1.6; wkt *= 1.4; one *= 0.8; dot *= 1.1; }
  const m = mods(d, bd.aggression, bw.field);
  four *= m.boundaryMul; six *= m.sixMul * m.boundaryMul; dot *= m.dotMul; wkt *= m.wicketMul; one *= m.singleMul;
  const extrasChance = (death ? 10 : 8) * m.extrasMul;
  if (rng() * 100 < extrasChance) {
    const t = rng();
    if (t < 0.4) return { runs: 1, wicket: false, extra: "wide" as const };
    if (t < 0.7) return { runs: rng() < 0.7 ? 1 : rng() < 0.5 ? 5 : 7, wicket: false, extra: "no-ball" as const };
    if (t < 0.85) return { runs: rng() < 0.8 ? 1 : 4, wicket: false, extra: "bye" as const };
    return { runs: rng() < 0.8 ? 1 : rng() < 0.6 ? 2 : 4, wicket: false, extra: "leg-bye" as const };
  }
  const o = [
    { runs: 0, wicket: false, w: dot }, { runs: 1, wicket: false, w: one }, { runs: 2, wicket: false, w: two },
    { runs: 3, wicket: false, w: 3 }, { runs: 4, wicket: false, w: four }, { runs: 6, wicket: false, w: six }, { runs: 0, wicket: true, w: wkt },
  ];
  const tot = o.reduce((s, x) => s + x.w, 0);
  let r = rng() * tot;
  for (const x of o) { r -= x.w; if (r <= 0) return { runs: x.runs, wicket: x.wicket }; }
  return { runs: 0, wicket: false };
}

// ---------- state helpers ----------
export function newInnings(side: Side, order: string[], target?: number): Innings {
  const batters: Record<string, BatLine> = {};
  order.forEach((id) => (batters[id] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false }));
  return { battingSide: side, runs: 0, wickets: 0, balls: 0, extras: 0, striker: order[0], nonStriker: order[1], order, nextIdx: 2,
    batters, bowlers: {}, currentBowler: null, lastOverBowler: null, freeHit: false, recent: [], overRuns: [], target, done: false };
}
export const maxOversPerBowler = (overs: number) => Math.max(1, Math.ceil(overs / 5));
export const oversStr = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

/** Returns an error string if the bowler is not allowed for the next ball. */
export function validateBowler(inn: Innings, overs: number, bowlerId: string, bowlingXI: string[]): string | null {
  if (!bowlingXI.includes(bowlerId)) return "Bowler must be in your XI";
  const midOver = inn.balls % 6 !== 0 && inn.currentBowler;
  if (midOver) return inn.currentBowler === bowlerId ? null : "The current bowler must finish the over";
  if (inn.lastOverBowler === bowlerId) return "A bowler cannot bowl consecutive overs";
  const b = inn.bowlers[bowlerId];
  if (b && Math.floor(b.balls / 6) >= maxOversPerBowler(overs)) return "This bowler has used all their overs";
  return null;
}

const HOW = ["bowled", "caught", "caught", "caught behind", "lbw", "run out", "stumped"];

export function playBall(state: MatchState, squads: Record<Side, MPPlayer[]>, bd: BattingDecision, bw: BowlingDecision, rng: () => number): { state: MatchState; ball: BallRecord } {
  const s: MatchState = structuredClone(state);
  const inn = s.innings[s.current];
  const bowlSide: Side = inn.battingSide === "A" ? "B" : "A";
  const find = (side: Side, id: string) => squads[side].find((p) => p.id === id)!;
  if (inn.balls % 6 === 0 || !inn.currentBowler) inn.currentBowler = bw.bowlerId;
  const bowler = find(bowlSide, inn.currentBowler!);
  const striker = find(inn.battingSide, inn.striker!);
  const d = pickDelivery(bw.strategy, rng);
  const overIdx = Math.floor(inn.balls / 6);
  const o = outcome(striker, bowler, overIdx, s.overs, d, bd, bw, rng);
  const bl = (inn.bowlers[bowler.id] ??= { balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 });
  const bt = inn.batters[striker.id];
  const wasFreeHit = inn.freeHit;
  let wicket = o.wicket && !wasFreeHit;
  let how: string | undefined;
  let text = "";
  const legal = o.extra !== "wide" && o.extra !== "no-ball";
  inn.runs += o.runs;
  if (o.extra) {
    inn.extras += o.extra === "no-ball" ? 1 : o.runs;
    if (o.extra === "wide") { bl.runs += o.runs; bl.wides++; text = "Wide ball."; }
    if (o.extra === "no-ball") { bl.runs += o.runs; bl.noBalls++; const off = o.runs - 1; bt.runs += off; bt.balls++; if (off === 4) bt.fours++; text = `No-ball! ${off ? off + " off the bat. " : ""}Free hit next.`; }
    if (o.extra === "bye" || o.extra === "leg-bye") { bt.balls++; text = `${o.runs} ${o.extra}${o.runs > 1 ? "s" : ""}.`; }
  } else if (wicket) {
    how = HOW[Math.floor(rng() * HOW.length)];
    bt.balls++; bt.out = true; bt.how = `${how} (${bowler.name})`;
    if (how !== "run out") bl.wickets++;
    inn.wickets++;
    text = `OUT! ${striker.name} ${how}.`;
  } else {
    if (o.wicket && wasFreeHit) text = "Would have been out, but it's a free hit!";
    bl.runs += o.runs; bt.runs += o.runs; bt.balls++;
    if (o.runs === 4) bt.fours++;
    if (o.runs === 6) bt.sixes++;
    text ||= o.runs === 0 ? "Dot ball." : o.runs === 4 ? "FOUR!" : o.runs === 6 ? "SIX!" : `${o.runs} run${o.runs > 1 ? "s" : ""}.`;
  }
  if (legal) { inn.balls++; bl.balls++; }
  inn.freeHit = o.extra === "no-ball";
  // Strike: odd runs swap (not on wides), wicket brings new batter at striker end.
  const ranRuns = o.extra === "no-ball" ? o.runs - 1 : o.runs;
  if (!wicket && o.extra !== "wide" && ranRuns % 2 === 1) [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
  if (wicket) inn.striker = inn.nextIdx < inn.order.length ? inn.order[inn.nextIdx++] : null;
  const overDone = legal && inn.balls % 6 === 0;
  inn.overRuns[overIdx] = (inn.overRuns[overIdx] ?? 0) + o.runs;
  if (overDone) {
    // Swap ends. After a last-ball wicket the survivor keeps strike, new batter at non-striker.
    [inn.striker, inn.nonStriker] = [inn.nonStriker, inn.striker];
    inn.lastOverBowler = inn.currentBowler; inn.currentBowler = null;
  }
  const ball: BallRecord = { n: inn.recent.length ? inn.recent[inn.recent.length - 1].n + 1 : 1, over: oversStr(inn.balls), bowler: bowler.name, batter: striker.name,
    runs: o.runs, wicket, how, extra: o.extra, delivery: d, freeHit: wasFreeHit, text };
  inn.recent = [...inn.recent, ball].slice(-18);
  s.lastBall = ball;

  const allOut = inn.wickets >= inn.order.length - 1 || !inn.striker || !inn.nonStriker;
  const oversUp = inn.balls >= s.overs * 6;
  const chased = inn.target !== undefined && inn.runs >= inn.target;
  if (allOut || oversUp || chased) {
    inn.done = true;
    if (s.current === 0) {
      s.current = 1;
      s.innings.push(newInnings(bowlSide, (squads as any).__order[bowlSide], inn.runs + 1));
    } else {
      const first = s.innings[0];
      if (inn.runs >= inn.target!) s.result = { winner: inn.battingSide, text: `won by ${inn.order.length - 1 - inn.wickets} wickets` };
      else if (inn.runs === first.runs) s.result = { winner: "tie", text: "Match tied" };
      else s.result = { winner: first.battingSide, text: `won by ${first.runs - inn.runs} runs` };
    }
  }
  return { state: s, ball };
}
