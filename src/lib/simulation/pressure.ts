// Pressure model: turns the match situation into a 0-100 pressure index for the
// batting side, plus bounded probability modifiers for both sides.

import { Modifiers, neutral } from "./pipeline";

export interface PressureInput {
  innings: 1 | 2;
  runs: number;
  wickets: number;
  ballsBowled: number;
  totalOvers: number;
  /** Runs required to win (second innings only). */
  target?: number | null;
  /** Consecutive dot balls just faced by the striker's end. */
  dotStreak?: number;
}

export interface PressureReport {
  /** 0 = relaxed, 100 = extreme pressure on the batting side */
  index: number;
  requiredRunRate: number | null;
  currentRunRate: number;
  runsRequired: number | null;
  ballsRemaining: number;
  label: "Comfortable" | "Steady" | "Building" | "Tense" | "Crunch";
  factors: string[];
  modifiers: Modifiers;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function computePressure(input: PressureInput): PressureReport {
  const totalBalls = input.totalOvers * 6;
  const ballsRemaining = Math.max(0, totalBalls - input.ballsBowled);
  const oversFaced = input.ballsBowled / 6;
  const currentRunRate = oversFaced > 0 ? input.runs / oversFaced : 0;
  const wicketsInHand = Math.max(0, 10 - input.wickets);
  const factors: string[] = [];

  let runsRequired: number | null = null;
  let requiredRunRate: number | null = null;
  let score = 0;

  if (input.innings === 2 && input.target != null) {
    runsRequired = Math.max(0, input.target - input.runs);
    requiredRunRate = ballsRemaining > 0 ? (runsRequired * 6) / ballsRemaining : Infinity;

    // Required rate is the dominant driver in a chase.
    const rrr = Number.isFinite(requiredRunRate) ? (requiredRunRate as number) : 20;
    score += clamp((rrr - 7) * 7, -20, 45);
    if (rrr >= 12) factors.push(`Required rate ${rrr.toFixed(1)} — huge ask`);
    else if (rrr >= 9.5) factors.push(`Required rate climbing (${rrr.toFixed(1)})`);

    // Rate gap versus what they are actually managing.
    score += clamp((rrr - currentRunRate) * 3.5, -12, 20);

    // Endgame squeeze.
    if (ballsRemaining <= 30 && runsRequired > 0) {
      score += clamp((30 - ballsRemaining) * 0.6, 0, 18);
      factors.push(`${runsRequired} needed off ${ballsRemaining}`);
    }
  } else {
    // First innings: pressure comes from wickets and a stalled scoring rate.
    score += clamp((7.5 - currentRunRate) * 4, -10, 22);
    if (currentRunRate < 6 && input.ballsBowled > 24) factors.push("Scoring rate has stalled");
  }

  // Wickets in hand.
  score += clamp((6 - wicketsInHand) * 6, -18, 34);
  if (wicketsInHand <= 3) factors.push(`Only ${wicketsInHand} wickets left`);

  // Dot-ball streak.
  const dots = input.dotStreak ?? 0;
  if (dots >= 3) {
    score += clamp((dots - 2) * 4, 0, 14);
    factors.push(`${dots} dot balls in a row`);
  }

  // Death overs always add a little heat.
  const oversLeft = ballsRemaining / 6;
  if (oversLeft <= 4) score += 6;

  const index = Math.round(clamp(50 + score * 0.85, 0, 100));

  const label: PressureReport["label"] =
    index >= 85 ? "Crunch" :
    index >= 70 ? "Tense" :
    index >= 55 ? "Building" :
    index >= 35 ? "Steady" : "Comfortable";

  // Pressure raises risk-taking and mistakes; it does not make batting impossible.
  const p = (index - 50) / 50; // -1 .. +1
  const modifiers: Modifiers = { ...neutral };
  modifiers.wicketMul *= 1 + Math.max(0, p) * 0.35 + Math.min(0, p) * 0.1;
  modifiers.dotMul *= 1 + Math.max(0, p) * 0.12;
  modifiers.boundaryMul *= 1 + Math.max(0, p) * 0.15; // forced aggression
  modifiers.sixMul *= 1 + Math.max(0, p) * 0.18;
  modifiers.singleMul *= 1 - Math.max(0, p) * 0.1;
  modifiers.extrasMul *= 1 + Math.max(0, p) * 0.1;

  return {
    index,
    requiredRunRate: requiredRunRate != null && Number.isFinite(requiredRunRate) ? requiredRunRate : requiredRunRate,
    currentRunRate,
    runsRequired,
    ballsRemaining,
    label,
    factors,
    modifiers,
  };
}
