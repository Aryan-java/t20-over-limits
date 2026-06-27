import { Player, RecentMatchPerformance, PlayerPerformanceHistory } from "@/types/cricket";

const MAX_RECENT = 5;
const MAX_ADJUST = 8; // max ±delta to base skill

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Per-match batting score 0-100 (50 = neutral). Returns null if didn't bat meaningfully. */
function battingScore(p: RecentMatchPerformance): number | null {
  if (!p.batted || p.balls < 3) return null;
  const sr = (p.runs * 100) / p.balls;
  // Run contribution: 40 runs ≈ +25, 80+ runs ≈ +50
  const runsPts = clamp(p.runs * 0.625, 0, 50);
  // Strike rate contribution around 130 baseline
  let srPts = 0;
  if (sr >= 180) srPts = 30;
  else if (sr >= 150) srPts = 20;
  else if (sr >= 130) srPts = 10;
  else if (sr >= 110) srPts = 0;
  else if (sr >= 90) srPts = -10;
  else srPts = -20;
  // Cheap wicket penalty
  if (p.runs < 10 && p.balls >= 5) srPts -= 10;
  return clamp(20 + runsPts + srPts, 0, 100);
}

/** Per-match bowling score 0-100. Null if didn't bowl. */
function bowlingScore(p: RecentMatchPerformance): number | null {
  if (!p.bowled || p.oversBowled < 1) return null;
  const econ = p.runsConceded / Math.max(p.oversBowled, 0.1);
  const wktPts = clamp(p.wickets * 18, 0, 60); // 3 wickets ≈ +54
  let econPts = 0;
  if (econ < 6) econPts = 25;
  else if (econ < 7.5) econPts = 15;
  else if (econ < 9) econPts = 5;
  else if (econ < 10.5) econPts = -5;
  else if (econ < 12) econPts = -15;
  else econPts = -25;
  return clamp(25 + wktPts + econPts, 0, 100);
}

export function computeForm(recent: RecentMatchPerformance[]): {
  batAdjust: number;
  bowlAdjust: number;
  formRating: number;
} {
  if (recent.length === 0) {
    return { batAdjust: 0, bowlAdjust: 0, formRating: 50 };
  }
  const batScores = recent.map(battingScore).filter((s): s is number => s !== null);
  const bowlScores = recent.map(bowlingScore).filter((s): s is number => s !== null);
  const batAvg = batScores.length ? batScores.reduce((a, b) => a + b, 0) / batScores.length : 50;
  const bowlAvg = bowlScores.length ? bowlScores.reduce((a, b) => a + b, 0) / bowlScores.length : 50;

  // Weight by sample size (more recent matches = stronger pull). Scale at 5 matches.
  const batWeight = Math.min(1, batScores.length / 3);
  const bowlWeight = Math.min(1, bowlScores.length / 3);

  const batAdjust = Math.round(((batAvg - 50) / 50) * MAX_ADJUST * batWeight);
  const bowlAdjust = Math.round(((bowlAvg - 50) / 50) * MAX_ADJUST * bowlWeight);

  const both = [
    batScores.length ? batAvg : null,
    bowlScores.length ? bowlAvg : null,
  ].filter((s): s is number => s !== null);
  const formRating = both.length ? Math.round(both.reduce((a, b) => a + b, 0) / both.length) : 50;

  return {
    batAdjust: clamp(batAdjust, -MAX_ADJUST, MAX_ADJUST),
    bowlAdjust: clamp(bowlAdjust, -MAX_ADJUST, MAX_ADJUST),
    formRating,
  };
}

/** Apply a completed match's stats to a player and recompute form-adjusted skills. */
export function applyMatchToPlayer(player: Player, matchStats: {
  runs: number; balls: number; wickets: number; runsConceded: number; oversBowled: number;
  batted: boolean; bowled: boolean;
}): Player {
  const base = player.performanceHistory || {
    last5MatchesRuns: 0,
    last5MatchesWickets: 0,
    totalMatches: 0,
    totalRuns: 0,
    totalWickets: 0,
    averageRuns: 0,
    averageWickets: 0,
    formRating: 50,
    recentMatches: [],
    batFormAdjustment: 0,
    bowlFormAdjustment: 0,
  };

  const newRecent: RecentMatchPerformance = {
    runs: matchStats.runs,
    balls: matchStats.balls,
    wickets: matchStats.wickets,
    runsConceded: matchStats.runsConceded,
    oversBowled: matchStats.oversBowled,
    batted: matchStats.batted,
    bowled: matchStats.bowled,
    matchDate: new Date().toISOString(),
  };

  const recentMatches = [...(base.recentMatches || []), newRecent].slice(-MAX_RECENT);
  const last5 = recentMatches;
  const { batAdjust, bowlAdjust, formRating } = computeForm(recentMatches);

  const baseBat = player.baseBatSkill ?? player.batSkill;
  const baseBowl = player.baseBowlSkill ?? player.bowlSkill;

  const updatedHistory: PlayerPerformanceHistory = {
    last5MatchesRuns: last5.reduce((s, m) => s + m.runs, 0),
    last5MatchesWickets: last5.reduce((s, m) => s + m.wickets, 0),
    totalMatches: base.totalMatches + 1,
    totalRuns: base.totalRuns + matchStats.runs,
    totalWickets: base.totalWickets + matchStats.wickets,
    averageRuns: (base.totalRuns + matchStats.runs) / (base.totalMatches + 1),
    averageWickets: (base.totalWickets + matchStats.wickets) / (base.totalMatches + 1),
    formRating,
    recentMatches,
    batFormAdjustment: batAdjust,
    bowlFormAdjustment: bowlAdjust,
  };

  return {
    ...player,
    baseBatSkill: baseBat,
    baseBowlSkill: baseBowl,
    batSkill: clamp(baseBat + batAdjust, 0, 99),
    bowlSkill: clamp(baseBowl + bowlAdjust, 0, 99),
    performanceHistory: updatedHistory,
  };
}
