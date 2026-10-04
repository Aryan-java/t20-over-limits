// Client-side view of the server-authoritative multiplayer model.
// Shapes mirror supabase/functions/_shared/mpEngine.ts.
export type Side = "A" | "B";
export type MemberRole = "team_owner" | "spectator" | "unassigned";
export type RoomStatus = "lobby" | "ready" | "live" | "innings_break" | "paused" | "completed";
export type Delivery = "normal" | "yorker" | "bouncer" | "slower" | "knuckle";
export type FieldPreset = "attacking" | "balanced" | "defensive" | "death";

export interface MPPlayer { id: string; name: string; batSkill: number; bowlSkill: number; isOverseas?: boolean; imageUrl?: string }
export interface MPTeam { name: string; squad: MPPlayer[] }

export interface Room {
  id: string; code: string; host_user_id: string; status: RoomStatus; paused_from: string | null;
  settings: { overs: number }; team_a: MPTeam | null; team_b: MPTeam | null;
  setups: Partial<Record<Side, { xi: string[]; impact: string[] }>>;
}
export interface Member { id: string; room_id: string; user_id: string; display_name: string; role: MemberRole; team_side: Side | null; ready: boolean; joined_at: string }
export interface RoomEvent { id: number; room_id: string; actor_user_id: string | null; type: string; payload: Record<string, any>; created_at: string }

export interface BatLine { runs: number; balls: number; fours: number; sixes: number; out: boolean; how?: string }
export interface BowlLine { balls: number; runs: number; wickets: number; wides: number; noBalls: number }
export interface BallRecord { n: number; over: string; bowler: string; batter: string; runs: number; wicket: boolean; how?: string; extra?: "wide" | "no-ball" | "bye" | "leg-bye"; delivery: Delivery; freeHit?: boolean; text: string }
export interface Innings {
  battingSide: Side; runs: number; wickets: number; balls: number; extras: number;
  striker: string | null; nonStriker: string | null; order: string[]; nextIdx: number;
  batters: Record<string, BatLine>; bowlers: Record<string, BowlLine>;
  currentBowler: string | null; lastOverBowler: string | null; freeHit: boolean;
  recent: BallRecord[]; overRuns: number[]; target?: number; done: boolean;
  batted?: string[]; awaitingBatter?: boolean;
}
export interface MatchState {
  overs: number; current: 0 | 1; toss: { winner: Side; decision: "bat" | "bowl" };
  innings: Innings[]; result?: { winner: Side | "tie"; text: string }; lastBall?: BallRecord;
}
export interface BattingDecision { aggression: number }
export interface BowlingDecision { field: FieldPreset; bowlerId: string; strategy: Record<Delivery, number> }
export interface DecisionStatus { version: number; batting: boolean; bowling: boolean }

export const otherSide = (s: Side): Side => (s === "A" ? "B" : "A");
export const oversStr = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;
export const maxOversPerBowler = (overs: number) => Math.max(1, Math.ceil(overs / 5));

export function bowlerError(inn: Innings, overs: number, bowlerId: string, xi: string[]): string | null {
  if (!xi.includes(bowlerId)) return "Bowler must be in your XI";
  if (inn.balls % 6 !== 0 && inn.currentBowler) return inn.currentBowler === bowlerId ? null : "Current bowler must finish the over";
  if (inn.lastOverBowler === bowlerId) return "Can't bowl consecutive overs";
  const b = inn.bowlers[bowlerId];
  if (b && Math.floor(b.balls / 6) >= maxOversPerBowler(overs)) return "Out of overs";
  return null;
}
