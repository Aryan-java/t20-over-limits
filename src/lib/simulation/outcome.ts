// Pure ball-outcome simulation. Extracted from BallByBallEngine with the same
// base probabilities and extras behaviour, plus the intelligence layer
// (matchup, pressure, form, conditions, tactics) fed through one pipeline.

import { Player } from "@/types/cricket";
import { BowlingDelivery } from "@/types/tactics";
import { Modifiers, combineModifiers, neutral } from "./pipeline";
import { computeMatchup, MatchupReport, Phase } from "./matchup";
import { computePressure, PressureInput, PressureReport } from "./pressure";
import { getPlayerTraits } from "./traits";
import { Rng, defaultRng } from "./rng";

export interface ConditionModifierInput {
  boundaryMultiplier?: number;
  sixMultiplier?: number;
  runScoringMultiplier?: number;
  paceWicketMultiplier?: number;
  spinWicketMultiplier?: number;
  extrasMultiplier?: number;
  dotBallMultiplier?: number;
}

export interface BallOutcome {
  runs: number;
  isWicket: boolean;
  extras?: { type: "wide" | "no-ball" | "bye" | "leg-bye"; runs: number };
}

export interface BallContextInput {
  batter: Player;
  bowler: Player;
  delivery: BowlingDelivery;
  phase: Phase;
  /** Weather / pitch modifiers from useMatchConditions (optional). */
  conditions?: ConditionModifierInput | null;
  /** Tactics modifiers (aggression, field preset, delivery) — optional. */
  tactics?: Modifiers | null;
  /** Situation used for the pressure model. */
  situation: PressureInput;
  /** Batting side is playing at its home venue. */
  homeAdvantage?: boolean;
  rng?: Rng;
}

export interface BallContext {
  matchup: MatchupReport;
  pressure: PressureReport;
  modifiers: Modifiers;
  phase: Phase;
  delivery: BowlingDelivery;
  bowlerType: "pace" | "spin";
}

/** Build the structured context for a delivery (also useful for the UI). */
export function buildBallContext(input: BallContextInput): BallContext {
  const batTraits = getPlayerTraits(input.batter);
  const bowlTraits = getPlayerTraits(input.bowler);

  const matchup = computeMatchup(batTraits, bowlTraits, input.delivery, input.phase);
  const pressure = computePressure(input.situation);

  const conditionMods: Modifiers = { ...neutral };
  if (input.conditions) {
    const c = input.conditions;
    conditionMods.boundaryMul *= c.boundaryMultiplier ?? 1;
    conditionMods.sixMul *= c.sixMultiplier ?? 1;
    conditionMods.singleMul *= c.runScoringMultiplier ?? 1;
    conditionMods.dotMul *= c.dotBallMultiplier ?? 1;
    conditionMods.extrasMul *= c.extrasMultiplier ?? 1;
    conditionMods.wicketMul *=
      bowlTraits.bowlerType === "pace"
        ? c.paceWicketMultiplier ?? 1
        : c.spinWicketMultiplier ?? 1;
  }

  const phaseMods: Modifiers = { ...neutral };
  if (input.phase === "powerplay") {
    phaseMods.boundaryMul *= 1.5;
    phaseMods.sixMul *= 1.3;
    phaseMods.singleMul *= 1.2;
    phaseMods.dotMul *= 0.8;
    phaseMods.wicketMul *= 1.1;
  } else if (input.phase === "death") {
    phaseMods.boundaryMul *= 1.3;
    phaseMods.sixMul *= 1.6;
    phaseMods.wicketMul *= 1.4;
    phaseMods.singleMul *= 0.8;
    phaseMods.dotMul *= 1.1;
  }

  const homeMods: Modifiers = { ...neutral };
  if (input.homeAdvantage) {
    homeMods.boundaryMul *= 1.05;
    homeMods.singleMul *= 1.03;
    homeMods.wicketMul *= 0.96;
  }

  // Phase effects are intentionally NOT softened away — they are applied first
  // and the rest of the influences are combined and clamped around them.
  const influences = combineModifiers([
    matchup.modifiers,
    pressure.modifiers,
    conditionMods,
    input.tactics ?? neutral,
    homeMods,
  ]);

  const modifiers = combineModifiers([phaseMods, influences], 1);

  return {
    matchup,
    pressure,
    modifiers,
    phase: input.phase,
    delivery: input.delivery,
    bowlerType: bowlTraits.bowlerType,
  };
}

/** Simulate one delivery. Keeps the original base model and extras behaviour. */
export function simulateBall(input: BallContextInput): { outcome: BallOutcome; context: BallContext } {
  const rng = input.rng ?? defaultRng;
  const context = buildBallContext(input);
  const { batter, bowler } = input;

  const batsmanForm = batter.performanceHistory?.formRating || 50;
  const bowlerForm = bowler.performanceHistory?.formRating || 50;
  const batsmanLast5Runs = batter.performanceHistory?.last5MatchesRuns || 0;
  const bowlerLast5Wickets = bowler.performanceHistory?.last5MatchesWickets || 0;

  const formBonus = (batsmanForm - bowlerForm) * 0.15;
  const recentFormBonus = batsmanLast5Runs * 0.02 - bowlerLast5Wickets * 0.5;
  const totalDiff = batter.batSkill - bowler.bowlSkill + formBonus + recentFormBonus;

  const m = context.modifiers;
  const dotProb = Math.max(20, 45 - totalDiff * 0.3) * m.dotMul;
  const wicketProb = Math.max(3, 8 - totalDiff * 0.1) * m.wicketMul;
  const boundaryProb = Math.max(8, 15 + totalDiff * 0.2) * m.boundaryMul;
  const sixProb = Math.max(2, 6 + totalDiff * 0.15) * m.sixMul;
  const singleProb = 35 * m.singleMul;
  const doubleProb = 15;

  // Extras (unchanged distribution).
  const extrasChance = (input.phase === "death" ? 10 : 8) * m.extrasMul;
  if (rng() * 100 < extrasChance) {
    const t = rng();
    if (t < 0.4) return { outcome: { runs: 1, isWicket: false, extras: { type: "wide", runs: 1 } }, context };
    if (t < 0.7) {
      const noBallRuns = rng() < 0.7 ? 1 : rng() < 0.5 ? 4 : 6;
      return { outcome: { runs: noBallRuns, isWicket: false, extras: { type: "no-ball", runs: noBallRuns } }, context };
    }
    if (t < 0.85) {
      const byeRuns = rng() < 0.8 ? 1 : 4;
      return { outcome: { runs: byeRuns, isWicket: false, extras: { type: "bye", runs: byeRuns } }, context };
    }
    const legByeRuns = rng() < 0.8 ? 1 : rng() < 0.6 ? 2 : 4;
    return { outcome: { runs: legByeRuns, isWicket: false, extras: { type: "leg-bye", runs: legByeRuns } }, context };
  }

  const outcomes: (BallOutcome & { weight: number })[] = [
    { runs: 0, isWicket: false, weight: dotProb },
    { runs: 1, isWicket: false, weight: singleProb },
    { runs: 2, isWicket: false, weight: doubleProb },
    { runs: 3, isWicket: false, weight: 3 },
    { runs: 4, isWicket: false, weight: boundaryProb },
    { runs: 6, isWicket: false, weight: sixProb },
    { runs: 0, isWicket: true, weight: wicketProb },
  ];

  const total = outcomes.reduce((s, o) => s + o.weight, 0);
  const roll = rng() * total;
  let sum = 0;
  for (const o of outcomes) {
    sum += o.weight;
    if (roll <= sum) return { outcome: { runs: o.runs, isWicket: o.isWicket }, context };
  }
  return { outcome: { runs: 0, isWicket: false }, context };
}
