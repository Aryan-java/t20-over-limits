// Fixture-based multiplayer engine entry point.
// Kept separate from mp-engine so the existing A/B room flow is unchanged.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { z } from "npm:zod@3";
import { makeRng, playBall, selectBatter, validateBowler, type MatchState, type Side, type BowlingDecision } from "../_shared/mpEngine.ts";
import {
  adaptFixtureForEngine,
  createFixtureMatchState,
  type FixtureTeamInput,
  type FixtureLineupInput,
} from "../_shared/fixtureEngineAdapter.ts";

const Body = z.object({
  action: z.enum(["get_state", "start", "play", "select_batter", "set_batting_decision", "substitute_impact", "pause", "resume"]),
  matchId: z.string().uuid(),
  expectedVersion: z.number().int().min(0).optional(),
  batterId: z.string().min(1).max(80).optional(),
  aggression: z.number().int().min(0).max(100).optional(),
  outgoingPlayerId: z.string().min(1).max(80).optional(),
  impactPlayerId: z.string().min(1).max(80).optional(),
  bowling: z.object({
    field: z.enum(["attacking", "balanced", "defensive", "death"]),
    bowlerId: z.string().min(1).max(80),
    strategy: z.object({
      normal: z.number().min(0), yorker: z.number().min(0), bouncer: z.number().min(0),
      slower: z.number().min(0), knuckle: z.number().min(0),
    }),
  }).optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Not authenticated" }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) return json({ error: "Server configuration is incomplete" }, 500);

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(authorization.slice(7));
    const userId = claims?.claims?.sub as string | undefined;
    if (claimsError || !userId) return json({ error: "Not authenticated" }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { action, matchId, expectedVersion } = parsed.data;
    if (action === "start" && expectedVersion === undefined) {
      return json({ error: "expectedVersion is required to start a fixture" }, 400);
    }

    const db = createClient(url, serviceKey);
    const { data: match, error: matchError } = await db
      .from("multiplayer_matches").select("*").eq("id", matchId).maybeSingle();
    if (matchError) throw matchError;
    if (!match) return json({ error: "Fixture match not found" }, 404);

    const { data: member, error: memberError } = await db
      .from("multiplayer_room_members").select("user_id")
      .eq("room_id", match.room_id).eq("user_id", userId).maybeSingle();
    if (memberError) throw memberError;
    if (!member) return json({ error: "Not a member of this room" }, 403);

    if (action === "get_state") return json({ matchId: match.id, fixtureId: match.fixture_id, status: match.status, version: match.version, state: match.state });
    if (expectedVersion === undefined) return json({ error: "expectedVersion is required" }, 400);
    if (match.version !== expectedVersion) return json({ error: "Stale version — refresh" }, 409);
    if (action === "start" && match.status !== "ready") return json({ error: "Fixture match is not ready to start" }, 409);
    if (action === "pause" && match.status !== "live") return json({ error: "Only a live match can be paused" }, 409);
    if (action === "resume" && match.status !== "paused") return json({ error: "Match is not paused" }, 409);
    if (!["start", "pause", "resume"].includes(action) && !["live", "innings_break"].includes(match.status)) return json({ error: "Fixture match is not in progress" }, 409);

    const [{ data: room, error: roomError }, { data: fixture, error: fixtureError },
      { data: lineups, error: lineupError }, { data: secret, error: secretError }] = await Promise.all([
      db.from("multiplayer_rooms").select("id,host_user_id,settings")
        .eq("id", match.room_id).maybeSingle(),
      db.from("multiplayer_fixtures").select("*")
        .eq("id", match.fixture_id).eq("room_id", match.room_id).maybeSingle(),
      db.from("multiplayer_fixture_lineups").select("*")
        .eq("fixture_id", match.fixture_id).eq("room_id", match.room_id),
      db.from("multiplayer_room_secrets").select("seed")
        .eq("room_id", match.room_id).maybeSingle(),
    ]);
    if (roomError) throw roomError;
    if (fixtureError) throw fixtureError;
    if (lineupError) throw lineupError;
    if (secretError) throw secretError;
    if (!room || !fixture || !secret?.seed) return json({ error: "Fixture setup is incomplete" }, 409);
    if (fixture.status !== "live") return json({ error: "Fixture has not been activated" }, 409);
    if (["start", "pause", "resume"].includes(action) && room.host_user_id !== userId) return json({ error: "Only the room host can control this fixture" }, 403);

    const [{ data: home, error: homeError }, { data: away, error: awayError },
      { data: owners, error: ownersError }] = await Promise.all([
      db.from("multiplayer_teams").select("id,name,squad")
        .eq("id", fixture.home_team_id).eq("room_id", match.room_id).maybeSingle(),
      db.from("multiplayer_teams").select("id,name,squad")
        .eq("id", fixture.away_team_id).eq("room_id", match.room_id).maybeSingle(),
      db.from("multiplayer_team_members").select("team_id,user_id,role")
        .eq("room_id", match.room_id).in("team_id", [fixture.home_team_id, fixture.away_team_id])
        .eq("role", "owner"),
    ]);
    if (homeError) throw homeError;
    if (awayError) throw awayError;
    if (ownersError) throw ownersError;
    if (!home || !away) return json({ error: "Fixture teams could not be loaded" }, 409);

    const homeLineup = lineups?.find((l) => l.team_id === home.id);
    const awayLineup = lineups?.find((l) => l.team_id === away.id);
    if (!homeLineup || !awayLineup) return json({ error: "Both teams must confirm their Playing XI" }, 409);
    const ownerIds = new Map((owners ?? []).map((o) => [o.team_id, o.user_id]));
    if (ownerIds.get(home.id) !== homeLineup.owner_user_id || ownerIds.get(away.id) !== awayLineup.owner_user_id) {
      return json({ error: "A team owner changed after lineup confirmation; reconfirm both XIs" }, 409);
    }

    const teamInput = (team: any): FixtureTeamInput => ({
      id: team.id, name: team.name, squad: team.squad,
    });
    const lineupInput = (lineup: any): FixtureLineupInput => ({
      teamId: lineup.team_id,
      playingXI: lineup.playing_xi,
      impactPlayers: lineup.impact_players ?? [],
    });
    const settings = (match.settings ?? {}) as Record<string, unknown>;
    const overs = Number(settings.overs ?? (room.settings as Record<string, unknown> | null)?.overs ?? 20);
    const context = adaptFixtureForEngine({
      overs,
      home: teamInput(home),
      away: teamInput(away),
      homeLineup: lineupInput(homeLineup),
      awayLineup: lineupInput(awayLineup),
    });

    if (action === "pause" || action === "resume") {
      const targetStatus = action === "pause" ? "paused" : "live";
      const committed = await db.rpc("mp_commit_fixture_state", {
        p_match: match.id, p_actor: userId, p_expected_version: expectedVersion,
        p_state: match.state, p_status: targetStatus, p_delivery: null, p_result: null, p_winner_team: null,
      });
      if (committed.error) return json({ error: committed.error.message }, committed.error.message.toLowerCase().includes("version") ? 409 : 400);
      return json({ ok: true, version: committed.data, status: targetStatus, state: match.state });
    }

    if (action !== "start") {
      const state = match.state as MatchState;
      if (!state || !state.innings || !state.innings[state.current]) return json({ error: "Match state is invalid" }, 500);
      const context = adaptFixtureForEngine({ overs: state.overs, home: teamInput(home), away: teamInput(away), homeLineup: lineupInput(homeLineup), awayLineup: lineupInput(awayLineup) });
      const fixtureState = state as MatchState & { impactSubstitutions?: Partial<Record<Side, { outgoing: string; incoming: string }>> };
      for (const side of ["A", "B"] as Side[]) {
        const substitution = fixtureState.impactSubstitutions?.[side];
        if (!substitution) continue;
        const index = context.orders[side].indexOf(substitution.outgoing);
        if (index >= 0) context.orders[side][index] = substitution.incoming;
      }
      const inn = state.innings[state.current];
      const bowlingSide: Side = inn.battingSide === "A" ? "B" : "A";
      const ownerFor = (teamId: string) => ownerIds.get(teamId);
      if (action === "substitute_impact") {
        const teamSide = (["A", "B"] as Side[]).find((side) => ownerFor(context.teamIds[side]) === userId);
        if (!teamSide) return json({ error: "Only a participating team owner can make an Impact Player substitution" }, 403);
        const outgoing = parsed.data.outgoingPlayerId;
        const incoming = parsed.data.impactPlayerId;
        if (!outgoing || !incoming) return json({ error: "Choose an outgoing XI player and an Impact Player" }, 400);
        const currentSubs = fixtureState.impactSubstitutions ?? {};
        if (currentSubs[teamSide]) return json({ error: "Each team may make only one Impact Player substitution" }, 409);
        if (!context.orders[teamSide].includes(outgoing)) return json({ error: "Outgoing player must be in the confirmed Playing XI" }, 400);
        if (!context.impactPlayers[teamSide].includes(incoming)) return json({ error: "Incoming player must be in the confirmed Impact Player list" }, 400);
        // A bowling-side replacement cannot interrupt an over already in progress.
        // The current bowler must complete the over before leaving the XI.
        if (inn.battingSide !== teamSide && inn.currentBowler === outgoing && inn.balls % 6 !== 0) {
          return json({ error: "The current bowler must complete the over before an Impact Player substitution" }, 409);
        }
        // A player may already have batted or bowled; the replacement only
        // affects future participation. Preserve any completed batting record.
        const nextState = structuredClone(state) as MatchState & { impactSubstitutions?: Partial<Record<Side, { outgoing: string; incoming: string }>> };
        nextState.impactSubstitutions = { ...(nextState.impactSubstitutions ?? {}), [teamSide]: { outgoing, incoming } };
        for (const innings of nextState.innings) {
          if (innings.battingSide !== teamSide) continue;
          const slot = innings.order.indexOf(outgoing);
          if (slot >= 0) {
            const outgoingLine = innings.batters[outgoing];
            const alreadyBatted = (innings.batted ?? []).includes(outgoing)
              || !!outgoingLine && (outgoingLine.balls > 0 || outgoingLine.runs > 0 || outgoingLine.out);
            if (!alreadyBatted) {
              innings.order[slot] = incoming;
              delete innings.batters[outgoing];
              innings.batters[incoming] ??= { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
              if (innings.striker === outgoing) innings.striker = incoming;
              if (innings.nonStriker === outgoing) innings.nonStriker = incoming;
              innings.batted = (innings.batted ?? []).map((id) => id === outgoing ? incoming : id);
            }
          }
        }
        const committed = await db.rpc("mp_commit_fixture_state", {
          p_match: match.id, p_actor: userId, p_expected_version: expectedVersion,
          p_state: nextState, p_status: match.status, p_delivery: null, p_result: null, p_winner_team: null,
        });
        if (committed.error) return json({ error: committed.error.message }, committed.error.message.toLowerCase().includes("version") ? 409 : 400);
        return json({ ok: true, version: committed.data, state: nextState, substitution: { teamSide, outgoing, incoming } });
      }
      if (action === "set_batting_decision") {
        if (ownerFor(context.teamIds[inn.battingSide]) !== userId) return json({ error: "Only the batting team owner can set batting aggression" }, 403);
        if (parsed.data.aggression === undefined) return json({ error: "Aggression from 0 to 100 is required" }, 400);
        const nextState = structuredClone(state) as MatchState & { battingDecision?: { aggression: number } };
        nextState.battingDecision = { aggression: parsed.data.aggression };
        const committed = await db.rpc("mp_commit_fixture_state", {
          p_match: match.id, p_actor: userId, p_expected_version: expectedVersion,
          p_state: nextState, p_status: match.status, p_delivery: null, p_result: null, p_winner_team: null,
        });
        if (committed.error) return json({ error: committed.error.message }, committed.error.message.toLowerCase().includes("version") ? 409 : 400);
        return json({ ok: true, version: committed.data, state: nextState });
      }
      if (action === "select_batter") {
        if (ownerFor(context.teamIds[inn.battingSide]) !== userId) return json({ error: "Only the batting team owner can select the next batter" }, 403);
        if (!parsed.data.batterId) return json({ error: "Choose a batter" }, 400);
        const selected = selectBatter(state, parsed.data.batterId);
        if ("error" in selected) return json({ error: selected.error }, 400);
        const committed = await db.rpc("mp_commit_fixture_state", { p_match: match.id, p_actor: userId, p_expected_version: expectedVersion, p_state: selected.state, p_status: "live", p_delivery: null, p_result: null, p_winner_team: null });
        if (committed.error) return json({ error: committed.error.message }, committed.error.message.toLowerCase().includes("version") ? 409 : 400);
        return json({ ok: true, version: committed.data, state: selected.state });
      }
      if (ownerFor(context.teamIds[bowlingSide]) !== userId) return json({ error: "Only the bowling team owner can play the next ball" }, 403);
      if (!parsed.data.bowling) return json({ error: "Bowling plan is required" }, 400);
      if (inn.awaitingBatter) return json({ error: "Waiting for the batting team to select the next batter" }, 409);
      const bowling = parsed.data.bowling as BowlingDecision;
      const invalidBowler = validateBowler(inn, state.overs, bowling.bowlerId, context.orders[bowlingSide]);
      if (invalidBowler) return json({ error: invalidBowler }, 400);
      const rng = makeRng(String(secret.seed) + ":fixture:" + match.fixture_id + ":v" + expectedVersion);
      const battingDecision = (state as MatchState & { battingDecision?: { aggression: number } }).battingDecision;
      const played = playBall(state, context.squads, context.orders, { aggression: battingDecision?.aggression ?? 50 }, bowling, rng);
      delete (played.state as MatchState & { battingDecision?: { aggression: number } }).battingDecision;
      const countResult = await db.from("multiplayer_deliveries").select("id", { count: "exact", head: true }).eq("match_id", match.id).eq("innings_number", state.current + 1);
      if (countResult.error) throw countResult.error;
      const deliveryNumber = (countResult.count ?? 0) + 1;
      // The engine keeps only 18 recent balls; archive numbering remains match-long.
      played.ball.n = deliveryNumber;
      played.state.lastBall = played.ball;
      const recent = played.state.innings[state.current].recent;
      if (recent.length) recent[recent.length - 1].n = deliveryNumber;
      const legalBallsBeforeDelivery = state.innings[state.current].balls;
      const delivery = {
        innings_number: state.current + 1,
        delivery_number: deliveryNumber,
        over_number: Math.floor(legalBallsBeforeDelivery / 6) + 1,
        ball_in_over: (legalBallsBeforeDelivery % 6) + 1,
        payload: played.ball,
      };
      const status = played.state.result ? "completed" : played.state.current !== state.current ? "innings_break" : "live";
      const winnerTeam = played.state.result && played.state.result.winner === "A" ? context.teamIds.A : played.state.result && played.state.result.winner === "B" ? context.teamIds.B : null;
      const committed = await db.rpc("mp_commit_fixture_state", { p_match: match.id, p_actor: userId, p_expected_version: expectedVersion, p_state: played.state, p_status: status, p_delivery: delivery, p_result: played.state.result ? { winner: played.state.result.winner, text: played.state.result.text, winnerTeamId: winnerTeam, overs: played.state.overs, innings: played.state.innings.map((inn) => ({ battingSide: inn.battingSide, runs: inn.runs, wickets: inn.wickets, balls: inn.balls, oversLimitBalls: played.state.overs * 6 })) } : null, p_winner_team: winnerTeam });
      if (committed.error) return json({ error: committed.error.message }, committed.error.message.toLowerCase().includes("version") ? 409 : 400);
      return json({ ok: true, version: committed.data, state: played.state, ball: played.ball, status });
    }

    const rng = makeRng(`${secret.seed}:fixture:${match.fixture_id}:toss`);
    const tossWinnerTeamId = rng() < 0.5 ? context.teamIds.A : context.teamIds.B;
    const decision = rng() < 0.5 ? "bat" : "bowl";
    const state = createFixtureMatchState(overs, context, tossWinnerTeamId, decision);
    const { data: nextVersion, error: commitError } = await db.rpc("mp_commit_fixture_state", {
      p_match: match.id,
      p_actor: userId,
      p_expected_version: expectedVersion,
      p_state: state,
      p_status: "live",
      p_delivery: null,
      p_result: null,
      p_winner_team: null,
    });
    if (commitError) {
      const conflict = commitError.message.toLowerCase().includes("version");
      return json({ error: conflict ? "Already started — refresh" : commitError.message }, conflict ? 409 : 400);
    }

    return json({
      ok: true,
      matchId: match.id,
      version: nextVersion,
      state,
      teams: { A: { id: home.id, name: home.name }, B: { id: away.id, name: away.name } },
      impactPlayers: context.impactPlayers,
    });
  } catch (error) {
    console.error("mp-fixture-engine error", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
