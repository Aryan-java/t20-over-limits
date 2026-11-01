// Fixture-based multiplayer engine entry point.
// Kept separate from mp-engine so the existing A/B room flow is unchanged.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { makeRng } from "../_shared/mpEngine.ts";
import {
  adaptFixtureForEngine,
  createFixtureMatchState,
  type FixtureTeamInput,
  type FixtureLineupInput,
} from "../_shared/fixtureEngineAdapter.ts";

const Body = z.object({
  action: z.enum(["get_state", "start"]),
  matchId: z.string().uuid(),
  expectedVersion: z.number().int().min(0).optional(),
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

    if (action === "get_state") {
      return json({
        matchId: match.id,
        fixtureId: match.fixture_id,
        status: match.status,
        version: match.version,
        state: match.state,
      });
    }

    if (match.status !== "ready") return json({ error: "Fixture match is not ready to start" }, 409);
    if (match.version !== expectedVersion) return json({ error: "Stale version — refresh" }, 409);

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
    if (room.host_user_id !== userId) return json({ error: "Only the room host can start this fixture" }, 403);
    if (fixture.status !== "live") return json({ error: "Fixture has not been activated" }, 409);

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
