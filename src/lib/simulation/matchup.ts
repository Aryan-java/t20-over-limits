// Batter-vs-bowler matchup engine.
// Produces small, bounded multipliers on dot / boundary / six / wicket / single
// probabilities based on trait interactions with the bowler type, the delivery
// bowled and the phase of the innings.

import { BowlingDelivery } from "@/types/tactics";
import { PlayerTraits } from "./traits";
import { Modifiers, neutral } from "./pipeline";

export type Phase = "powerplay" | "middle" | "death";

export interface MatchupReport {
  modifiers: Modifiers;
  /** -100 (bowler dominant) .. +100 (batter dominant) */
  advantage: number;
  notes: string[];
}

/** Map a trait score (0-100) to a gentle multiplier around 1. */
const scale = (score: number, strength: number) => 1 + ((score - 50) / 50) * strength;

export function computeMatchup(
  batter: PlayerTraits,
  bowler: PlayerTraits,
  delivery: BowlingDelivery,
  phase: Phase,
): MatchupReport {
  const m: Modifiers = { ...neutral };
  const notes: string[] = [];

  // --- Batter vs bowler type ---
  const vsType = bowler.bowlerType === "pace" ? batter.vsPace : batter.vsSpin;
  const edge = (vsType - bowler.bowlingControl) / 100; // roughly -1 .. +1
  m.boundaryMul *= 1 + edge * 0.25;
  m.sixMul *= 1 + edge * 0.3;
  m.wicketMul *= 1 - edge * 0.25;
  m.dotMul *= 1 - edge * 0.18;
  if (edge > 0.2) notes.push(`Strong against ${bowler.bowlerType}`);
  if (edge < -0.2) notes.push(`Struggles against ${bowler.bowlerType}`);

  // --- Phase-specific batting ability ---
  if (phase === "powerplay") {
    m.boundaryMul *= scale(batter.powerplay, 0.2);
    m.dotMul *= scale(100 - batter.powerplay, 0.15);
  } else if (phase === "death") {
    m.sixMul *= scale(batter.deathBatting, 0.25);
    m.boundaryMul *= scale(batter.deathBatting, 0.18);
    // Death-bowling specialists claw runs back.
    m.dotMul *= scale(bowler.deathBowling, 0.2);
    m.boundaryMul *= scale(100 - bowler.deathBowling, 0.15);
    if (bowler.deathBowling > 78) notes.push("Death-overs specialist bowling");
  } else {
    m.singleMul *= scale(batter.strikeRotation, 0.15);
    m.dotMul *= scale(100 - batter.strikeRotation, 0.12);
  }

  // --- Delivery-specific interactions ---
  switch (delivery) {
    case "bouncer":
      m.wicketMul *= scale(batter.shortBallWeakness, 0.35);
      m.sixMul *= scale(100 - batter.shortBallWeakness, 0.25);
      m.extrasMul *= scale(100 - bowler.bowlingControl, 0.25);
      if (batter.shortBallWeakness > 65) notes.push("Vulnerable to the short ball");
      break;
    case "yorker":
      m.dotMul *= scale(bowler.yorkerAccuracy, 0.25);
      m.wicketMul *= scale(bowler.yorkerAccuracy, 0.2);
      // A missed yorker is a low full toss.
      m.boundaryMul *= scale(100 - bowler.yorkerAccuracy, 0.3);
      m.extrasMul *= scale(100 - bowler.yorkerAccuracy, 0.2);
      break;
    case "slower":
    case "knuckle":
      m.wicketMul *= scale(bowler.bowlingControl, 0.2);
      m.boundaryMul *= scale(100 - bowler.bowlingControl, 0.2);
      // Good players of spin read the slower ball better.
      m.dotMul *= scale(100 - batter.vsSpin, 0.12);
      break;
    default:
      m.extrasMul *= scale(100 - bowler.bowlingControl, 0.15);
      break;
  }

  const advantage = Math.round(
    clampNum(((vsType - bowler.bowlingControl) + (batter.boundaryHitting - bowler.deathBowling) * 0.5) * 1.2, -100, 100),
  );

  return { modifiers: m, advantage, notes };
}

const clampNum = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
