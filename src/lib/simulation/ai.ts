// Context-aware AI suggestions for tactics. These only ever *suggest*; the user
// keeps full manual control of the sliders and presets.

import { BowlingStrategy, FieldPreset } from "@/types/tactics";
import { Phase } from "./matchup";
import { PressureReport } from "./pressure";
import { PlayerTraits } from "./traits";

export interface TacticsSuggestion {
  bowlingStrategy: BowlingStrategy;
  battingAggression: number;
  fieldPreset: FieldPreset;
  reason: string;
}

export function suggestTactics(
  phase: Phase,
  pressure: PressureReport,
  batter?: PlayerTraits,
  bowler?: PlayerTraits,
): TacticsSuggestion {
  let strategy: BowlingStrategy = { normal: 50, yorker: 15, bouncer: 15, slower: 15, knuckle: 5 };
  let field: FieldPreset = "balanced";
  let aggression = 50;
  let reason = "Balanced approach.";

  if (phase === "powerplay") {
    strategy = { normal: 60, yorker: 10, bouncer: 15, slower: 10, knuckle: 5 };
    field = "attacking";
    aggression = 62;
    reason = "Powerplay: attack the field restrictions, bowl fuller for wickets.";
  } else if (phase === "death") {
    strategy = { normal: 20, yorker: 45, bouncer: 15, slower: 15, knuckle: 5 };
    field = "death";
    aggression = 82;
    reason = "Death overs: yorker-heavy plan, batters swinging hard.";
  } else {
    strategy = { normal: 45, yorker: 10, bouncer: 15, slower: 25, knuckle: 5 };
    field = "defensive";
    aggression = 48;
    reason = "Middle overs: change of pace, build the innings.";
  }

  // Situation overrides.
  if (pressure.runsRequired != null && pressure.ballsRemaining > 0) {
    const rrr = (pressure.runsRequired * 6) / pressure.ballsRemaining;
    if (rrr > 11) {
      aggression = Math.max(aggression, 88);
      reason = "Chase is slipping away — all-out attack required.";
    } else if (rrr < 6 && pressure.index < 45) {
      aggression = Math.min(aggression, 45);
      reason = "Chase under control — low risk, rotate strike.";
    }
  }

  if (pressure.index >= 78) {
    field = phase === "death" ? "death" : "defensive";
    strategy = { ...strategy, yorker: strategy.yorker + 10, normal: Math.max(10, strategy.normal - 10) };
  }

  // Exploit a known weakness.
  if (batter && bowler && batter.shortBallWeakness > 68 && bowler.bowlerType === "pace") {
    strategy = { ...strategy, bouncer: strategy.bouncer + 15, normal: Math.max(10, strategy.normal - 15) };
    reason += " Target the short-ball weakness.";
  }

  return { bowlingStrategy: strategy, battingAggression: aggression, fieldPreset: field, reason };
}
