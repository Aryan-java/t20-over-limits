// Tactical state shared across the live match UI and the simulation engine.

export type BowlingDelivery = 'normal' | 'yorker' | 'bouncer' | 'slower' | 'knuckle';
export type FieldPreset = 'attacking' | 'balanced' | 'defensive' | 'death';

export interface BowlingStrategy {
  // Probability weights (0-100) – they don't have to sum to 100; we normalise.
  normal: number;
  yorker: number;
  bouncer: number;
  slower: number;
  knuckle: number;
}

export const defaultBowlingStrategy: BowlingStrategy = {
  normal: 50,
  yorker: 15,
  bouncer: 15,
  slower: 15,
  knuckle: 5,
};

export interface FielderPosition {
  id: string;
  name: string;
  // Normalised coordinates inside the field circle [0,1] x [0,1]
  x: number;
  y: number;
}

export interface TacticsState {
  bowlingStrategy: BowlingStrategy;
  // 0 = ultra defensive, 50 = balanced, 100 = full attack
  battingAggression: number;
  fieldPreset: FieldPreset;
  fielders: FielderPosition[];
  drsRemaining: { batting: number; bowling: number };
}

// Outcome modifiers applied to the base probabilities in simulateBallOutcome.
export interface TacticsModifiers {
  boundaryMul: number;
  sixMul: number;
  dotMul: number;
  wicketMul: number;
  singleMul: number;
  extrasMul: number;
}

export const neutralModifiers: TacticsModifiers = {
  boundaryMul: 1,
  sixMul: 1,
  dotMul: 1,
  wicketMul: 1,
  singleMul: 1,
  extrasMul: 1,
};

export function pickDelivery(strategy: BowlingStrategy): BowlingDelivery {
  const entries = Object.entries(strategy) as [BowlingDelivery, number][];
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0) || 1;
  let r = Math.random() * total;
  for (const [k, w] of entries) {
    r -= Math.max(0, w);
    if (r <= 0) return k;
  }
  return 'normal';
}

export function computeTacticsModifiers(
  delivery: BowlingDelivery,
  aggression: number,
  field: FieldPreset,
): TacticsModifiers {
  const m: TacticsModifiers = { ...neutralModifiers };

  // Delivery type effects.
  switch (delivery) {
    case 'yorker':
      m.dotMul *= 1.4;
      m.boundaryMul *= 0.55;
      m.sixMul *= 0.4;
      m.wicketMul *= 1.25; // bowled / LBW chance
      m.extrasMul *= 1.15; // can leak as full toss
      break;
    case 'bouncer':
      m.dotMul *= 1.15;
      m.sixMul *= 1.2; // hook/pull for six
      m.boundaryMul *= 0.9;
      m.wicketMul *= 1.15; // top edge
      m.extrasMul *= 1.3; // wides above shoulder
      break;
    case 'slower':
      m.dotMul *= 1.2;
      m.boundaryMul *= 0.85;
      m.sixMul *= 0.85;
      m.wicketMul *= 1.2; // mistimed shot
      break;
    case 'knuckle':
      m.dotMul *= 1.1;
      m.wicketMul *= 1.1;
      m.boundaryMul *= 0.9;
      break;
  }

  // Batting aggression scale: -1 (defensive) .. 0 (balanced) .. +1 (attack)
  const a = (aggression - 50) / 50;
  m.boundaryMul *= 1 + a * 0.5;
  m.sixMul *= 1 + a * 0.7;
  m.wicketMul *= 1 + a * 0.6;
  m.dotMul *= 1 - a * 0.25;
  m.singleMul *= 1 - Math.abs(a) * 0.1;

  // Field preset effects.
  switch (field) {
    case 'attacking':
      m.wicketMul *= 1.2;
      m.boundaryMul *= 1.15; // gaps in the deep
      m.dotMul *= 0.95;
      break;
    case 'defensive':
      m.boundaryMul *= 0.75;
      m.sixMul *= 0.85;
      m.singleMul *= 1.15;
      m.wicketMul *= 0.9;
      m.dotMul *= 1.05;
      break;
    case 'death':
      m.boundaryMul *= 0.85;
      m.sixMul *= 0.9;
      m.dotMul *= 1.1;
      m.extrasMul *= 1.1;
      m.wicketMul *= 1.05;
      break;
    case 'balanced':
    default:
      break;
  }

  return m;
}

// ============ PHASE 2: deeper tactical gameplay ============

/** Instruction given to the batter currently on strike. */
export type BatterTactic = 'anchor' | 'rotate' | 'attack';

/** Optional matchup-aware instruction for the batter. */
export type BatterMatchupInstruction = 'none' | 'attack-pace' | 'attack-spin' | 'see-off';

/** High-level plan chosen for the current bowler. */
export type BowlerPlan =
  | 'attack'
  | 'balanced'
  | 'defensive'
  | 'yorkers'
  | 'bouncers'
  | 'variations'
  | 'target-weakness';

export interface BatterTacticsState {
  tactic: BatterTactic;
  instruction: BatterMatchupInstruction;
  /** Bowler id the batter is instructed to target (optional). */
  targetBowlerId?: string | null;
}

export const defaultBatterTactics: BatterTacticsState = {
  tactic: 'rotate',
  instruction: 'none',
  targetBowlerId: null,
};

/** Delivery mixes behind each bowler plan. Existing presets keep working. */
export const BOWLER_PLAN_STRATEGY: Record<BowlerPlan, BowlingStrategy> = {
  attack: { normal: 45, yorker: 15, bouncer: 25, slower: 10, knuckle: 5 },
  balanced: { normal: 50, yorker: 15, bouncer: 15, slower: 15, knuckle: 5 },
  defensive: { normal: 55, yorker: 20, bouncer: 5, slower: 15, knuckle: 5 },
  yorkers: { normal: 20, yorker: 55, bouncer: 10, slower: 10, knuckle: 5 },
  bouncers: { normal: 25, yorker: 10, bouncer: 50, slower: 10, knuckle: 5 },
  variations: { normal: 25, yorker: 10, bouncer: 10, slower: 35, knuckle: 20 },
  'target-weakness': { normal: 35, yorker: 20, bouncer: 25, slower: 15, knuckle: 5 },
};

export const BOWLER_PLAN_LABEL: Record<BowlerPlan, string> = {
  attack: 'Attack',
  balanced: 'Balanced',
  defensive: 'Defensive',
  yorkers: 'Yorkers',
  bouncers: 'Short ball',
  variations: 'Variations',
  'target-weakness': 'Target weakness',
};

/** One recorded tactical change during a match (optional / backwards compatible). */
export interface TacticsLogEntry {
  innings: 1 | 2;
  over: number;
  ball: number;
  type: 'batter' | 'bowler-plan' | 'field' | 'aggression' | 'ai';
  label: string;
  detail?: string;
  at: string;
}
