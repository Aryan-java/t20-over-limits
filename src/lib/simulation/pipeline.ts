// One controlled probability pipeline.
// Every source of influence (form, conditions, tactics, matchup, pressure,
// phase, home advantage) produces a `Modifiers` object; they are combined here
// and clamped so compounding can never produce absurd outcomes.

export interface Modifiers {
  dotMul: number;
  singleMul: number;
  boundaryMul: number;
  sixMul: number;
  wicketMul: number;
  extrasMul: number;
}

export const neutral: Modifiers = {
  dotMul: 1,
  singleMul: 1,
  boundaryMul: 1,
  sixMul: 1,
  wicketMul: 1,
  extrasMul: 1,
};

/** Hard caps per channel — the combined effect of everything stays inside these. */
export const MODIFIER_CAPS: Record<keyof Modifiers, [number, number]> = {
  dotMul: [0.55, 1.85],
  singleMul: [0.6, 1.5],
  boundaryMul: [0.4, 2.2],
  sixMul: [0.3, 2.6],
  wicketMul: [0.45, 2.4],
  extrasMul: [0.5, 2.0],
};

const clamp = (v: number, [min, max]: [number, number]) => Math.min(max, Math.max(min, v));

/**
 * Multiply modifier sets together, then soften and clamp.
 * `softening` (0-1) pulls each combined multiplier back toward 1 so that many
 * mild influences don't stack into an extreme.
 */
export function combineModifiers(sets: Modifiers[], softening = 0.85): Modifiers {
  const out: Modifiers = { ...neutral };
  for (const s of sets) {
    if (!s) continue;
    out.dotMul *= safe(s.dotMul);
    out.singleMul *= safe(s.singleMul);
    out.boundaryMul *= safe(s.boundaryMul);
    out.sixMul *= safe(s.sixMul);
    out.wicketMul *= safe(s.wicketMul);
    out.extrasMul *= safe(s.extrasMul);
  }
  (Object.keys(out) as (keyof Modifiers)[]).forEach((k) => {
    const soft = 1 + (out[k] - 1) * softening;
    out[k] = clamp(soft, MODIFIER_CAPS[k]);
  });
  return out;
}

const safe = (v: number) => (Number.isFinite(v) && v > 0 ? v : 1);
