// Per-batsman INTENT — how he approaches his innings, and how that intent
// adapts to the live match situation. Used by BallByBallEngine.simulateBallOutcome
// to bias dot/single/boundary/six/wicket probabilities on every delivery.

import type { Player, Innings, Match } from "@/types/cricket";

export type BatsmanIntent = 'anchor' | 'rotator' | 'aggressor' | 'finisher';

export interface IntentModifiers {
  dotMul: number;
  singleMul: number;
  boundaryMul: number;
  sixMul: number;
  wicketMul: number;
}

const NEUTRAL: IntentModifiers = {
  dotMul: 1, singleMul: 1, boundaryMul: 1, sixMul: 1, wicketMul: 1,
};

/** Heuristic base intent from a player's skill profile. Deterministic per player. */
export function baseIntentFor(p: Player): BatsmanIntent {
  const bat = p.batSkill ?? 50;
  const bowl = p.bowlSkill ?? 50;

  // Bowlers / tail enders → anchor mentality but they're hardly classy anchors.
  // We still call them "anchor" so they block; engine wicket bias does the rest.
  if (bat < 45) return 'anchor';

  // Pure top-order specialists with high batSkill and low bowlSkill → anchors
  // (Kohli/Williamson/Rahul style: build the innings).
  if (bat >= 80 && bowl < 35) return 'anchor';

  // Power hitters: very high bat, some bowl (Russell/Pollard/Hardik) or known
  // openers — treat anyone with bat ≥ 85 not already classed as a finisher.
  if (bat >= 85 && bowl >= 60) return 'finisher';

  // All-rounders and middle-order finishers
  if (bat >= 70 && bowl >= 55) return 'finisher';

  // Aggressive top order (Warner, Buttler, Salt-ish): high bat, low-to-mid bowl
  if (bat >= 82) return 'aggressor';

  // Rest of the order: rotate strike
  return 'rotator';
}

const INTENT_MODS: Record<BatsmanIntent, IntentModifiers> = {
  anchor: {
    dotMul: 1.25,
    singleMul: 1.15,
    boundaryMul: 0.70,
    sixMul: 0.45,
    wicketMul: 0.70,
  },
  rotator: {
    dotMul: 0.92,
    singleMul: 1.30,
    boundaryMul: 0.95,
    sixMul: 0.85,
    wicketMul: 0.90,
  },
  aggressor: {
    dotMul: 0.85,
    singleMul: 0.90,
    boundaryMul: 1.45,
    sixMul: 1.55,
    wicketMul: 1.35,
  },
  finisher: {
    // Default = "wait for the moment". `resolveIntent` flips this to attack late.
    dotMul: 1.05,
    singleMul: 1.15,
    boundaryMul: 1.05,
    sixMul: 1.20,
    wicketMul: 1.00,
  },
};

export function intentModifiers(intent: BatsmanIntent): IntentModifiers {
  return INTENT_MODS[intent] ?? NEUTRAL;
}

/**
 * Effective intent for the situation. Even an "anchor" goes all-out if RRR is
 * climbing; even an "aggressor" anchors briefly if 7 wickets are down with overs
 * left. This is what the engine actually applies to the ball.
 */
export function resolveIntent(
  base: BatsmanIntent,
  ctx: {
    match: Match;
    innings: Innings;
    striker: Player;
  },
): BatsmanIntent {
  const { match, innings, striker } = ctx;
  const overNum = innings.ballsBowled / 6;
  const oversLeft = Math.max(0, match.overs - overNum);
  const wicketsLeft = 10 - innings.wickets;

  // Phase
  const isPowerplay = overNum < 6;
  const isDeath = overNum >= match.overs - 4;

  // Required run rate (chase only)
  let rrr = 0;
  if (match.currentInnings === 2 && match.firstInnings) {
    const target = match.firstInnings.totalRuns + 1;
    const need = target - innings.totalRuns;
    const ballsLeft = match.overs * 6 - innings.ballsBowled;
    rrr = ballsLeft > 0 ? (need * 6) / ballsLeft : 99;
  }

  // 1. Tail-end collapse — protect wicket
  if (wicketsLeft <= 3 && oversLeft > 4 && rrr < 11) {
    return 'anchor';
  }

  // 2. Desperate chase — everyone attacks
  if (rrr >= 12 && oversLeft <= 8) return 'aggressor';
  if (rrr >= 10 && isDeath) return 'aggressor';

  // 3. Death overs — finishers and aggressors crank up; anchors become rotators
  if (isDeath) {
    if (base === 'anchor') return 'rotator';
    if (base === 'finisher') return 'aggressor';
    return base;
  }

  // 4. Powerplay — set batters who are aggressors stay so; anchors stay; finishers
  // play themselves in (act like rotators early).
  if (isPowerplay) {
    if (base === 'finisher') return 'rotator';
    return base;
  }

  // 5. Middle overs — set batsmen (10+ balls, SR > 130) push harder
  if (striker.balls >= 10) {
    const sr = (striker.runs / striker.balls) * 100;
    if (sr > 140 && base === 'rotator') return 'aggressor';
    if (sr < 80 && base === 'aggressor') return 'rotator';
  }

  return base;
}

export const INTENT_LABEL: Record<BatsmanIntent, string> = {
  anchor: 'Anchor',
  rotator: 'Rotator',
  aggressor: 'Aggressor',
  finisher: 'Finisher',
};

export const INTENT_COLOR: Record<BatsmanIntent, string> = {
  anchor: 'border-sky-500/50 text-sky-300 bg-sky-500/10',
  rotator: 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10',
  aggressor: 'border-red-500/50 text-red-300 bg-red-500/10',
  finisher: 'border-amber-500/50 text-amber-300 bg-amber-500/10',
};
