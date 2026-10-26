/**
 * Pure record-book calculations for the All-Time Records page.
 * Player career records come from the saved all-time stats rows (already aggregated by name);
 * appearance, win, award and team records come from completed match history.
 */

export interface StatRow {
  player_name: string;
  matches_batted: number; total_runs: number; balls_faced: number; highest_score: number;
  fifties: number; hundreds: number; fours: number; sixes: number; not_outs: number;
  matches_bowled: number; total_wickets: number; balls_bowled: number; runs_conceded: number;
  best_bowling_wickets: number; best_bowling_runs: number; maidens: number;
}

export interface RecordEntry { name: string; value: number; display: string; detail?: string }
export interface RecordResult { id: string; title: string; unit: string; note?: string; entries: RecordEntry[]; unavailable?: string }

export const THRESHOLDS = { avgInnings: 5, srBalls: 100, bowlBalls: 120 };

const n = (v: any) => (typeof v === "number" && isFinite(v) ? v : 0);

/** Top entries sorted by score; keeps everyone tied with the last place shown. */
export function rank<T>(items: T[], score: (t: T) => number, toEntry: (t: T) => RecordEntry, opts: { asc?: boolean; limit?: number; tiebreak?: (a: T, b: T) => number } = {}): RecordEntry[] {
  const { asc = false, limit = 5, tiebreak } = opts;
  const valid = items.filter((t) => isFinite(score(t)));
  valid.sort((a, b) => {
    const d = asc ? score(a) - score(b) : score(b) - score(a);
    return d !== 0 ? d : tiebreak ? tiebreak(a, b) : 0;
  });
  if (valid.length <= limit) return valid.map(toEntry);
  const cut = score(valid[limit - 1]);
  let end = limit;
  while (end < valid.length && score(valid[end]) === cut && !tiebreak) end++;
  return valid.slice(0, end).map(toEntry);
}

const e = (name: string, value: number, display: string, detail?: string): RecordEntry => ({ name, value, display, detail });

export function playerRecords(rows: StatRow[]): { batting: RecordResult[]; bowling: RecordResult[] } {
  const bat = rows.filter((r) => n(r.matches_batted) > 0);
  const bowl = rows.filter((r) => n(r.matches_bowled) > 0);
  const outs = (r: StatRow) => n(r.matches_batted) - n(r.not_outs);
  const pos = <T,>(arr: T[], f: (t: T) => number) => arr.filter((t) => f(t) > 0);

  const batting: RecordResult[] = [
    { id: "runs", title: "Most Runs", unit: "runs", entries: rank(pos(bat, (r) => n(r.total_runs)), (r) => n(r.total_runs), (r) => e(r.player_name, r.total_runs, `${r.total_runs}`, `${r.matches_batted} inns`)) },
    { id: "hs", title: "Highest Individual Score", unit: "runs", entries: rank(pos(bat, (r) => n(r.highest_score)), (r) => n(r.highest_score), (r) => e(r.player_name, r.highest_score, `${r.highest_score}`)) },
    { id: "avg", title: "Best Batting Average", unit: "avg", note: `Min ${THRESHOLDS.avgInnings} innings, 1 dismissal`,
      entries: rank(bat.filter((r) => n(r.matches_batted) >= THRESHOLDS.avgInnings && outs(r) > 0), (r) => r.total_runs / outs(r), (r) => e(r.player_name, r.total_runs / outs(r), (r.total_runs / outs(r)).toFixed(2), `${r.total_runs} runs`)) },
    { id: "sr", title: "Best Strike Rate", unit: "SR", note: `Min ${THRESHOLDS.srBalls} balls faced`,
      entries: rank(bat.filter((r) => n(r.balls_faced) >= THRESHOLDS.srBalls), (r) => (r.total_runs / r.balls_faced) * 100, (r) => e(r.player_name, (r.total_runs / r.balls_faced) * 100, ((r.total_runs / r.balls_faced) * 100).toFixed(2), `${r.balls_faced} balls`)) },
    { id: "50s", title: "Most 50s", unit: "50s", entries: rank(pos(bat, (r) => n(r.fifties)), (r) => n(r.fifties), (r) => e(r.player_name, r.fifties, `${r.fifties}`)) },
    { id: "100s", title: "Most 100s", unit: "100s", entries: rank(pos(bat, (r) => n(r.hundreds)), (r) => n(r.hundreds), (r) => e(r.player_name, r.hundreds, `${r.hundreds}`)) },
    { id: "4s", title: "Most Fours", unit: "4s", entries: rank(pos(bat, (r) => n(r.fours)), (r) => n(r.fours), (r) => e(r.player_name, r.fours, `${r.fours}`)) },
    { id: "6s", title: "Most Sixes", unit: "6s", entries: rank(pos(bat, (r) => n(r.sixes)), (r) => n(r.sixes), (r) => e(r.player_name, r.sixes, `${r.sixes}`)) },
  ];
  const ov = (b: number) => `${Math.floor(b / 6)}.${b % 6}`;
  const bowling: RecordResult[] = [
    { id: "wkts", title: "Most Wickets", unit: "wkts", entries: rank(pos(bowl, (r) => n(r.total_wickets)), (r) => n(r.total_wickets), (r) => e(r.player_name, r.total_wickets, `${r.total_wickets}`, `${ov(n(r.balls_bowled))} ov`)) },
    { id: "bbi", title: "Best Bowling Figures", unit: "W/R", note: "Single innings",
      entries: rank(pos(bowl, (r) => n(r.best_bowling_wickets)), (r) => r.best_bowling_wickets * 1000 - r.best_bowling_runs, (r) => e(r.player_name, r.best_bowling_wickets, `${r.best_bowling_wickets}/${r.best_bowling_runs}`)) },
    { id: "bavg", title: "Best Bowling Average", unit: "avg", note: `Min ${THRESHOLDS.bowlBalls / 6} overs, 1 wicket`,
      entries: rank(bowl.filter((r) => n(r.balls_bowled) >= THRESHOLDS.bowlBalls && n(r.total_wickets) > 0), (r) => r.runs_conceded / r.total_wickets, (r) => e(r.player_name, r.runs_conceded / r.total_wickets, (r.runs_conceded / r.total_wickets).toFixed(2), `${r.total_wickets} wkts`), { asc: true }) },
    { id: "econ", title: "Best Economy", unit: "RPO", note: `Min ${THRESHOLDS.bowlBalls / 6} overs`,
      entries: rank(bowl.filter((r) => n(r.balls_bowled) >= THRESHOLDS.bowlBalls), (r) => (r.runs_conceded / r.balls_bowled) * 6, (r) => e(r.player_name, (r.runs_conceded / r.balls_bowled) * 6, ((r.runs_conceded / r.balls_bowled) * 6).toFixed(2), `${ov(r.balls_bowled)} ov`), { asc: true }) },
    { id: "maidens", title: "Most Maidens", unit: "maidens", entries: rank(pos(bowl, (r) => n(r.maidens)), (r) => n(r.maidens), (r) => e(r.player_name, r.maidens, `${r.maidens}`)) },
  ];
  return { batting, bowling };
}

/** Minimal shape of a saved match; every field optional to tolerate older formats. */
export interface HistMatch {
  id?: string; isCompleted?: boolean; result?: string | null; completedAt?: string | Date; matchDate?: string | Date;
  team1?: { id?: string; name?: string; squad?: any[] }; team2?: { id?: string; name?: string; squad?: any[] };
  team1Setup?: { playingXI?: any[]; substitutedOutPlayer?: any }; team2Setup?: { playingXI?: any[]; substitutedOutPlayer?: any };
  firstInnings?: { battingTeam?: string; totalRuns?: number; wickets?: number } | null;
  secondInnings?: { battingTeam?: string; totalRuns?: number; wickets?: number } | null;
  manOfTheMatch?: { name?: string } | null;
}

/** Winner from the engine's result text ("X won by N runs/wickets"); null when unknown/tied. */
export function parseWinner(m: HistMatch): { name: string; margin: number; kind: "runs" | "wickets" } | null {
  const r = m.result || "";
  const names = [m.team1?.name, m.team2?.name].filter(Boolean) as string[];
  const match = /^(.*) won by (\d+) (runs?|wickets?)/i.exec(r.trim());
  if (!match) return null;
  const name = match[1].trim();
  if (!names.includes(name)) return null;
  return { name, margin: parseInt(match[2], 10), kind: /run/i.test(match[3]) ? "runs" : "wickets" };
}

function lineup(m: HistMatch, side: 1 | 2): string[] {
  const setup = side === 1 ? m.team1Setup : m.team2Setup;
  const team = side === 1 ? m.team1 : m.team2;
  const xi = setup?.playingXI || (team?.squad || []).filter((p: any) => p?.isPlaying);
  const names = xi.map((p: any) => p?.name).filter(Boolean);
  if (setup?.substitutedOutPlayer?.name) names.push(setup.substitutedOutPlayer.name);
  return Array.from(new Set(names));
}

export function historyRecords(history: HistMatch[]): { appearance: RecordResult[]; team: RecordResult[]; matchCount: number } {
  const done = history.filter((m) => m && m.isCompleted !== false && m.result && m.team1?.name && m.team2?.name);
  const played = new Map<string, number>();
  const wins = new Map<string, number>();
  const potm = new Map<string, number>();
  const tPlayed = new Map<string, number>();
  const tWins = new Map<string, number>();
  const totals: { team: string; runs: number; wkts: number; vs: string }[] = [];
  const winsByRuns: { team: string; m: number; vs: string }[] = [];
  const winsByWkts: { team: string; m: number; vs: string }[] = [];
  const inc = (map: Map<string, number>, k: string) => map.set(k, (map.get(k) || 0) + 1);

  const sorted = [...done].sort((a, b) => new Date(a.completedAt || a.matchDate || 0).getTime() - new Date(b.completedAt || b.matchDate || 0).getTime());
  const streak = new Map<string, { cur: number; best: number }>();

  for (const m of sorted) {
    const t1 = m.team1!.name!, t2 = m.team2!.name!;
    const w = parseWinner(m);
    [t1, t2].forEach((t) => inc(tPlayed, t));
    const l1 = lineup(m, 1), l2 = lineup(m, 2);
    l1.forEach((p) => inc(played, p)); l2.forEach((p) => inc(played, p));
    if (w) {
      inc(tWins, w.name);
      (w.name === t1 ? l1 : l2).forEach((p) => inc(wins, p));
      const loser = w.name === t1 ? t2 : t1;
      (w.kind === "runs" ? winsByRuns : winsByWkts).push({ team: w.name, m: w.margin, vs: loser });
    }
    for (const t of [t1, t2]) {
      const s = streak.get(t) || { cur: 0, best: 0 };
      s.cur = w && w.name === t ? s.cur + 1 : 0;
      s.best = Math.max(s.best, s.cur);
      streak.set(t, s);
    }
    if (m.manOfTheMatch?.name) inc(potm, m.manOfTheMatch.name);
    for (const inn of [m.firstInnings, m.secondInnings]) {
      if (inn?.battingTeam && typeof inn.totalRuns === "number" && Number.isFinite(inn.totalRuns) && inn.totalRuns >= 0) totals.push({ team: inn.battingTeam, runs: inn.totalRuns, wkts: n(inn.wickets), vs: inn.battingTeam === t1 ? t2 : t1 });
    }
  }

  const fromMap = (map: Map<string, number>, unit: string) => rank([...map.entries()].filter(([, v]) => v > 0), ([, v]) => v, ([k, v]) => e(k, v, `${v}`, unit));
  const empty = done.length === 0 ? "No completed matches saved yet" : undefined;
  const appearance: RecordResult[] = [
    { id: "mp", title: "Most Matches Played", unit: "matches", entries: fromMap(played, ""), unavailable: empty },
    { id: "mw", title: "Most Wins", unit: "wins", note: "Playing for the winning team", entries: fromMap(wins, ""), unavailable: empty },
    { id: "potm", title: "Most Player of the Match", unit: "awards", entries: fromMap(potm, ""), unavailable: empty || (potm.size === 0 ? "No awards saved in match history" : undefined) },
  ];
  const team: RecordResult[] = [
    { id: "tm", title: "Most Matches", unit: "matches", entries: fromMap(tPlayed, ""), unavailable: empty },
    { id: "tw", title: "Most Wins", unit: "wins", entries: fromMap(tWins, ""), unavailable: empty },
    { id: "ht", title: "Highest Ever Team Score", unit: "runs", entries: rank(totals, (t) => t.runs, (t) => e(t.team, t.runs, `${t.runs}/${t.wkts}`, `vs ${t.vs}`)), unavailable: totals.length === 0 ? "No valid team scores yet" : undefined },
    { id: "lt", title: "Lowest Ever Team Score", unit: "runs", entries: rank(totals, (t) => t.runs, (t) => e(t.team, t.runs, `${t.runs}/${t.wkts}`, `vs ${t.vs}`), { asc: true }), unavailable: totals.length === 0 ? "No valid team scores yet" : undefined },
    { id: "bwr", title: "Biggest Win (by runs)", unit: "runs", entries: rank(winsByRuns, (t) => t.m, (t) => e(t.team, t.m, `${t.m} runs`, `vs ${t.vs}`)), unavailable: empty },
    { id: "bww", title: "Biggest Win (by wickets)", unit: "wkts", entries: rank(winsByWkts, (t) => t.m, (t) => e(t.team, t.m, `${t.m} wkts`, `vs ${t.vs}`)), unavailable: empty },
    { id: "ws", title: "Longest Winning Streak", unit: "wins", entries: rank([...streak.entries()].filter(([, s]) => s.best > 0), ([, s]) => s.best, ([k, s]) => e(k, s.best, `${s.best}`)), unavailable: empty },
  ];
  return { appearance, team, matchCount: done.length };
}
