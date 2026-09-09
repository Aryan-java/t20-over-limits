// Phase 2: deeper tactical gameplay.
// Turns per-batter tactics, bowler plans and the actual field placement into
// bounded `Modifiers` that flow through the same clamped pipeline as every
// other influence (form, conditions, matchup, pressure).

import {
  BatterTacticsState,
  BowlerPlan,
  BOWLER_PLAN_STRATEGY,
  BowlingStrategy,
  FieldPreset,
  FielderPosition,
} from "@/types/tactics";
import { Modifiers, neutral, combineModifiers } from "./pipeline";
import { Phase } from "./matchup";
import { PressureReport } from "./pressure";
import { PlayerTraits } from "./traits";

// ---------------------------------------------------------------- batter ---

export interface BatterTacticInput {
  tactics: BatterTacticsState;
  bowlerType: "pace" | "spin";
  bowlerId?: string | null;
  phase: Phase;
  /** Batter has faced fewer than ~8 balls. */
  isNewBatter?: boolean;
}

export function computeBatterTacticModifiers(input: BatterTacticInput): {
  modifiers: Modifiers;
  notes: string[];
} {
  const m: Modifiers = { ...neutral };
  const notes: string[] = [];
  const t = input.tactics ?? { tactic: "rotate", instruction: "none", targetBowlerId: null };

  switch (t.tactic) {
    case "anchor":
      m.dotMul *= 1.22;
      m.singleMul *= 1.05;
      m.boundaryMul *= 0.7;
      m.sixMul *= 0.55;
      m.wicketMul *= 0.7;
      notes.push("Anchoring — low risk");
      break;
    case "attack":
      m.dotMul *= 0.8;
      m.singleMul *= 0.9;
      m.boundaryMul *= 1.35;
      m.sixMul *= 1.5;
      m.wicketMul *= 1.35;
      notes.push("Going after the bowling");
      break;
    case "rotate":
    default:
      m.singleMul *= 1.2;
      m.dotMul *= 0.9;
      m.boundaryMul *= 0.95;
      m.sixMul *= 0.9;
      m.wicketMul *= 0.92;
      notes.push("Rotating strike");
      break;
  }

  // Matchup instruction.
  switch (t.instruction) {
    case "attack-pace":
      if (input.bowlerType === "pace") {
        m.boundaryMul *= 1.2;
        m.sixMul *= 1.25;
        m.wicketMul *= 1.15;
        m.dotMul *= 0.9;
        notes.push("Targeting the quicks");
      } else {
        m.dotMul *= 1.05;
        m.boundaryMul *= 0.95;
      }
      break;
    case "attack-spin":
      if (input.bowlerType === "spin") {
        m.boundaryMul *= 1.2;
        m.sixMul *= 1.3;
        m.wicketMul *= 1.15;
        m.dotMul *= 0.9;
        notes.push("Targeting the spinners");
      } else {
        m.dotMul *= 1.05;
        m.boundaryMul *= 0.95;
      }
      break;
    case "see-off":
      m.dotMul *= 1.25;
      m.boundaryMul *= 0.65;
      m.sixMul *= 0.5;
      m.wicketMul *= 0.65;
      m.singleMul *= 0.95;
      notes.push("Seeing off the spell");
      break;
    default:
      break;
  }

  // Target a specific bowler.
  if (t.targetBowlerId && input.bowlerId && t.targetBowlerId === input.bowlerId) {
    m.boundaryMul *= 1.18;
    m.sixMul *= 1.22;
    m.wicketMul *= 1.12;
    m.dotMul *= 0.9;
    notes.push("Targeting this bowler");
  }

  // A brand new batter can't go berserk immediately.
  if (input.isNewBatter) {
    m.boundaryMul *= 0.9;
    m.sixMul *= 0.85;
    m.dotMul *= 1.08;
    m.wicketMul *= 1.1;
  }

  return { modifiers: m, notes };
}

// ---------------------------------------------------------------- bowler ---

/** Delivery mix for a plan — single source of truth is BOWLER_PLAN_STRATEGY. */
export function strategyForPlan(plan: BowlerPlan): BowlingStrategy {
  return { ...BOWLER_PLAN_STRATEGY[plan] };
}

export interface BowlerPlanInput {
  plan: BowlerPlan;
  phase: Phase;
  batter?: PlayerTraits;
  bowler?: PlayerTraits;
}

export function computeBowlerPlanModifiers(input: BowlerPlanInput): {
  modifiers: Modifiers;
  notes: string[];
} {
  const m: Modifiers = { ...neutral };
  const notes: string[] = [];

  switch (input.plan) {
    case "attack":
      m.wicketMul *= 1.2;
      m.boundaryMul *= 1.12;
      m.dotMul *= 0.97;
      notes.push("Attacking plan");
      break;
    case "defensive":
      m.wicketMul *= 0.88;
      m.boundaryMul *= 0.82;
      m.sixMul *= 0.85;
      m.singleMul *= 1.1;
      m.dotMul *= 1.05;
      notes.push("Containing plan");
      break;
    case "yorkers":
      m.dotMul *= 1.12;
      m.sixMul *= 0.8;
      m.extrasMul *= 1.1;
      if (input.bowler) {
        const acc = (input.bowler.yorkerAccuracy - 50) / 50;
        m.wicketMul *= 1 + acc * 0.2;
        m.boundaryMul *= 1 - acc * 0.15;
      }
      notes.push("Yorker plan");
      break;
    case "bouncers":
      m.extrasMul *= 1.2;
      m.dotMul *= 1.05;
      if (input.batter) {
        const w = (input.batter.shortBallWeakness - 50) / 50;
        m.wicketMul *= 1 + w * 0.3;
        m.sixMul *= 1 - w * 0.2;
      }
      notes.push("Short-ball plan");
      break;
    case "variations":
      m.dotMul *= 1.1;
      m.boundaryMul *= 0.9;
      if (input.bowler) m.wicketMul *= 1 + ((input.bowler.bowlingControl - 50) / 50) * 0.2;
      notes.push("Mixing up the pace");
      break;
    case "target-weakness": {
      const weakness = input.batter
        ? Math.max(
            input.batter.shortBallWeakness,
            100 - (input.bowler?.bowlerType === "spin" ? input.batter.vsSpin : input.batter.vsPace),
          )
        : 50;
      const w = (weakness - 50) / 50;
      m.wicketMul *= 1 + w * 0.35;
      m.dotMul *= 1 + w * 0.12;
      m.boundaryMul *= 1 - w * 0.15;
      if (w > 0.2) notes.push("Exploiting a known weakness");
      else notes.push("No obvious weakness to attack");
      break;
    }
    case "balanced":
    default:
      break;
  }

  return { modifiers: m, notes };
}

// ----------------------------------------------------------------- field ---

const KEEPER_IDS = new Set(["wk"]);
const CENTER = 0.5;
const BOUNDARY_R = 0.48;
const INNER_R = 0.22;

export interface FieldReport {
  modifiers: Modifiers;
  /** Fielders outside the 30-yard circle (keeper excluded). */
  deepCount: number;
  /** Catchers inside the circle (keeper excluded). */
  inFieldCount: number;
  /** Largest uncovered angular gap on the boundary, in degrees. */
  largestGapDeg: number;
  notes: string[];
}

/**
 * Actual placement matters: how many fielders are in the deep, how many are up
 * for the catch, and how evenly the boundary is covered. Deterministic — the
 * same field always yields the same modifiers.
 */
export function computeFieldModifiers(
  fielders: FielderPosition[],
  preset: FieldPreset,
): FieldReport {
  const m: Modifiers = { ...neutral };
  const notes: string[] = [];
  const outfielders = (fielders ?? []).filter((f) => !KEEPER_IDS.has(f.id));

  if (outfielders.length === 0) {
    return { modifiers: m, deepCount: 0, inFieldCount: 0, largestGapDeg: 360, notes };
  }

  const polar = outfielders.map((f) => {
    const dx = f.x - CENTER;
    const dy = f.y - CENTER;
    const r = Math.sqrt(dx * dx + dy * dy);
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return { r, deg };
  });

  const deepCount = polar.filter((p) => p.r >= INNER_R * 1.15).length;
  const inFieldCount = outfielders.length - deepCount;

  // Boundary riders cut off fours/sixes; a packed infield creates catches and dots.
  const deepEdge = (deepCount - 4) / 5; // -0.8 .. +1.2 typically
  m.boundaryMul *= 1 - deepEdge * 0.18;
  m.sixMul *= 1 - deepEdge * 0.1;
  m.singleMul *= 1 + deepEdge * 0.12;

  const inEdge = (inFieldCount - 5) / 5;
  m.wicketMul *= 1 + inEdge * 0.16;
  m.dotMul *= 1 + inEdge * 0.1;
  m.singleMul *= 1 - inEdge * 0.1;

  // Boundary coverage: a big uncovered arc is easy runs.
  const deepAngles = polar.filter((p) => p.r >= INNER_R * 1.15).map((p) => p.deg).sort((a, b) => a - b);
  let largestGapDeg = 360;
  if (deepAngles.length > 0) {
    largestGapDeg = 0;
    for (let i = 0; i < deepAngles.length; i++) {
      const next = i === deepAngles.length - 1 ? deepAngles[0] + 360 : deepAngles[i + 1];
      largestGapDeg = Math.max(largestGapDeg, next - deepAngles[i]);
    }
  }
  const gapEdge = Math.min(1, Math.max(0, (largestGapDeg - 90) / 120));
  m.boundaryMul *= 1 + gapEdge * 0.22;
  m.sixMul *= 1 + gapEdge * 0.15;
  if (gapEdge > 0.5) notes.push(`Big gap on the boundary (${Math.round(largestGapDeg)}°)`);

  // Fielders pushed right to the rope save more but concede the single.
  const avgDepth = polar.reduce((s, p) => s + p.r, 0) / polar.length;
  const depthEdge = (avgDepth - 0.26) / BOUNDARY_R;
  m.boundaryMul *= 1 - depthEdge * 0.2;
  m.singleMul *= 1 + depthEdge * 0.15;
  m.wicketMul *= 1 - depthEdge * 0.12;

  if (deepCount >= 6) notes.push("Boundary protected");
  if (inFieldCount >= 7) notes.push("Catchers around the bat");

  return { modifiers: m, deepCount, inFieldCount, largestGapDeg, notes };
}

// ------------------------------------------------------------- estimates ---

export interface TacticalImpactEstimate {
  /** Percent change vs a neutral field/plan (estimate, not a result). */
  runRatePct: number;
  dotPct: number;
  wicketRiskPct: number;
  boundaryPct: number;
}

/** Combine tactical modifier sets into a compact, user-readable estimate. */
export function estimateTacticalImpact(sets: Modifiers[]): TacticalImpactEstimate {
  const m = combineModifiers(sets);
  // A rough scoring-rate proxy from the outcome weights the engine uses.
  const runRate =
    (1 * 35 * m.singleMul + 2 * 15 + 4 * 15 * m.boundaryMul + 6 * 6 * m.sixMul) /
    (1 * 35 + 2 * 15 + 4 * 15 + 6 * 6);
  const pct = (v: number) => Math.round((v - 1) * 100);
  return {
    runRatePct: pct(runRate),
    dotPct: pct(m.dotMul),
    wicketRiskPct: pct(m.wicketMul),
    boundaryPct: pct(m.boundaryMul),
  };
}

// -------------------------------------------------------- recommendations ---

export interface TacticalRecommendation {
  id: string;
  title: string;
  detail: string;
  target: "batting" | "bowling" | "field";
}

export interface RecommendationInput {
  phase: Phase;
  pressure: PressureReport;
  battingSideIsUser?: boolean;
  isNewBatter?: boolean;
  batter?: PlayerTraits;
  bowler?: PlayerTraits;
  fieldPreset: FieldPreset;
  deepCount?: number;
}

/** Suggestions only — the user's manual choices are never overwritten by these. */
export function recommendTactics(input: RecommendationInput): TacticalRecommendation[] {
  const out: TacticalRecommendation[] = [];
  const rrr = input.pressure.requiredRunRate;

  if (input.phase === "death") {
    out.push({
      id: "death-yorkers",
      title: "Use yorkers at the death",
      detail: "Full and straight is the hardest length to hit in the last overs.",
      target: "bowling",
    });
    if ((input.deepCount ?? 0) < 5) {
      out.push({
        id: "protect-boundary",
        title: "Protect the boundary",
        detail: "Push more fielders to the rope — the death field is leaking fours.",
        target: "field",
      });
    }
  }

  if (input.isNewBatter) {
    out.push({
      id: "attack-new-batter",
      title: "Attack the new batter",
      detail: "Bring the catchers up and squeeze before they get set.",
      target: "bowling",
    });
  }

  if (input.batter && input.batter.shortBallWeakness > 65) {
    out.push({
      id: "short-ball",
      title: "Test them with the short ball",
      detail: "This batter is uncomfortable against pace into the body.",
      target: "bowling",
    });
  }

  if (input.pressure.index >= 70) {
    out.push({
      id: "rotate-strike",
      title: "Rotate strike",
      detail: "Dots are piling the pressure on — take the ones and twos on offer.",
      target: "batting",
    });
  }

  if (rrr != null && rrr > 11) {
    out.push({
      id: "all-out-attack",
      title: "All-out attack",
      detail: `Required rate is ${rrr.toFixed(1)} — boundaries are the only way back.`,
      target: "batting",
    });
  } else if (rrr != null && rrr < 6.5) {
    out.push({
      id: "anchor-chase",
      title: "Anchor the chase",
      detail: "The rate is under control — bat time and avoid needless risk.",
      target: "batting",
    });
  }

  if (input.phase === "powerplay") {
    out.push({
      id: "powerplay-attack",
      title: "Cash in during the powerplay",
      detail: "Only two fielders out — a good time for an attacking intent.",
      target: "batting",
    });
  }

  return out.slice(0, 4);
}
