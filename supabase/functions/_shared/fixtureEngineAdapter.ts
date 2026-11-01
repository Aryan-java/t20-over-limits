import { newInnings, type MatchState, type MPPlayer, type Side } from "./mpEngine.ts";

export interface FixtureTeamInput {
  id: string;
  name: string;
  squad: MPPlayer[];
}
export interface FixtureLineupInput {
  teamId: string;
  playingXI: string[];
  impactPlayers?: string[];
}
export interface FixtureEngineInput {
  overs: number;
  home: FixtureTeamInput;
  away: FixtureTeamInput;
  homeLineup: FixtureLineupInput;
  awayLineup: FixtureLineupInput;
}
export interface FixtureEngineContext {
  teamIds: Record<Side, string>;
  teamNames: Record<Side, string>;
  squads: Record<Side, MPPlayer[]>;
  orders: Record<Side, string[]>;
  impactPlayers: Record<Side, string[]>;
}
export interface FixtureEngineStart {
  context: FixtureEngineContext;
  state: MatchState;
}

function validateTeam(team: FixtureTeamInput, label: string): Map<string, MPPlayer> {
  if (!team.id || !team.name.trim()) throw new Error(`${label} team needs an id and name`);
  if (!Array.isArray(team.squad) || team.squad.length < 11) throw new Error(`${label} squad must contain at least 11 players`);
  const overseasCount = team.squad.filter((player) => player.isOverseas === true).length;
  if (overseasCount > 8) throw new Error(label + " squad exceeds the eight overseas-player limit");
  const byId = new Map<string, MPPlayer>();
  for (const player of team.squad) {
    if (!player.id || !player.name || !Number.isFinite(player.batSkill) || !Number.isFinite(player.bowlSkill)
      || player.batSkill < 0 || player.batSkill > 100 || player.bowlSkill < 0 || player.bowlSkill > 100) {
      throw new Error(`${label} squad contains an invalid player`);
    }
    if (byId.has(player.id)) throw new Error(`${label} squad contains duplicate player ids`);
    byId.set(player.id, player);
  }
  return byId;
}

function validateLineup(
  lineup: FixtureLineupInput,
  teamId: string,
  players: Map<string, MPPlayer>,
  label: string,
): { xi: string[]; impact: string[] } {
  if (lineup.teamId !== teamId) throw new Error(`${label} lineup belongs to a different team`);
  const xi = lineup.playingXI;
  const impact = lineup.impactPlayers ?? [];
  if (!Array.isArray(xi) || xi.length !== 11 || new Set(xi).size !== 11) {
    throw new Error(`${label} lineup must contain exactly 11 unique players`);
  }
  if (!Array.isArray(impact) || impact.length > 4 || new Set(impact).size !== impact.length) {
    throw new Error(`${label} impact list must contain up to 4 unique players`);
  }
  if (xi.some((id) => !players.has(id)) || impact.some((id) => !players.has(id))) {
    throw new Error(`${label} lineup contains a player outside its squad`);
  }
  if (xi.some((id) => impact.includes(id))) throw new Error(`${label} player cannot be both in the XI and impact list`);
  const overseas = xi.filter((id) => players.get(id)?.isOverseas).length;
  if (overseas > 4) throw new Error(`${label} Playing XI exceeds the four overseas-player limit`);
  return { xi: [...xi], impact: [...impact] };
}

/**
 * Maps a tournament fixture's home/away teams into the existing A/B engine.
 * The legacy engine remains unchanged; A always means fixture home and B away.
 */
export function adaptFixtureForEngine(input: FixtureEngineInput): FixtureEngineContext {
  if (!Number.isInteger(input.overs) || input.overs < 1 || input.overs > 50) {
    throw new Error("Overs must be an integer between 1 and 50");
  }
  if (input.home.id === input.away.id) throw new Error("A fixture must contain two different teams");
  const homePlayers = validateTeam(input.home, "Home");
  const awayPlayers = validateTeam(input.away, "Away");
  const homeXI = validateLineup(input.homeLineup, input.home.id, homePlayers, "Home");
  const awayXI = validateLineup(input.awayLineup, input.away.id, awayPlayers, "Away");

  return {
    teamIds: { A: input.home.id, B: input.away.id },
    teamNames: { A: input.home.name, B: input.away.name },
    squads: { A: [...input.home.squad], B: [...input.away.squad] },
    orders: { A: homeXI.xi, B: awayXI.xi },
    impactPlayers: { A: homeXI.impact, B: awayXI.impact },
  };
}

/** Converts a fixture team UUID to the legacy engine's winner value. */
export function fixtureWinnerToSide(teamId: string | null, context: FixtureEngineContext): Side | "tie" | null {
  if (teamId === null) return "tie";
  if (teamId === context.teamIds.A) return "A";
  if (teamId === context.teamIds.B) return "B";
  throw new Error("Winner team does not belong to this fixture");
}

/** Creates the legacy engine state after the toss, using fixture-specific XIs. */
export function createFixtureMatchState(
  overs: number,
  context: FixtureEngineContext,
  tossWinnerTeamId: string,
  decision: "bat" | "bowl",
): MatchState {
  const tossWinner = fixtureWinnerToSide(tossWinnerTeamId, context);
  if (tossWinner === null || tossWinner === "tie") throw new Error("Toss winner must be a fixture team");
  const battingSide: Side = decision === "bat" ? tossWinner : tossWinner === "A" ? "B" : "A";
  return {
    overs,
    current: 0,
    toss: { winner: tossWinner, decision },
    innings: [newInnings(battingSide, context.orders[battingSide])],
  };
}
