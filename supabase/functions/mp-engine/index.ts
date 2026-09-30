// Server-authoritative multiplayer engine: start match + play next ball.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { makeRng, newInnings, playBall, validateBowler, type MatchState, type MPPlayer, type Side } from "../_shared/mpEngine.ts";

const Body = z.object({
  action: z.enum(["start", "play"]),
  roomId: z.string().uuid(),
  expectedVersion: z.number().int().min(0),
});

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Not authenticated" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: claims, error: authErr } = await userClient.auth.getClaims(auth.slice(7));
    const uid = claims?.claims?.sub as string | undefined;
    if (authErr || !uid) return json({ error: "Not authenticated" }, 401);

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { action, roomId, expectedVersion } = parsed.data;

    const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: room }, { data: ms }, { data: members }, { data: secret }] = await Promise.all([
      db.from("multiplayer_rooms").select("*").eq("id", roomId).maybeSingle(),
      db.from("multiplayer_match_state").select("*").eq("room_id", roomId).maybeSingle(),
      db.from("multiplayer_room_members").select("user_id, role, team_side, display_name").eq("room_id", roomId),
      db.from("multiplayer_room_secrets").select("seed").eq("room_id", roomId).maybeSingle(),
    ]);
    if (!room || !ms || !secret) return json({ error: "Room not found" }, 404);
    const me = members?.find((m) => m.user_id === uid);
    if (!me) return json({ error: "Not a member of this room" }, 403);
    if (ms.version !== expectedVersion) return json({ error: "Stale version — refresh" }, 409);

    const setups = room.setups as Record<Side, { xi: string[]; impact: string[] }>;
    const squads: Record<Side, MPPlayer[]> = {
      A: ((room.team_a as any)?.squad ?? []) as MPPlayer[],
      B: ((room.team_b as any)?.squad ?? []) as MPPlayer[],
    };
    const orders: Record<Side, string[]> = { A: setups?.A?.xi ?? [], B: setups?.B?.xi ?? [] };
    const overs = Number((room.settings as any)?.overs ?? 20);

    const commit = async (state: MatchState, status: string, type: string, event: Record<string, unknown>) => {
      const { data, error } = await db.rpc("mp_commit_state", {
        p_room: roomId, p_actor: uid, p_expected_version: expectedVersion, p_state: state as any,
        p_status: status, p_event_type: type, p_event: event as any,
      });
      if (error) return json({ error: error.message.includes("Version") ? "Already played — refresh" : error.message }, 409);
      return json({ ok: true, version: data, state });
    };

    if (action === "start") {
      if (room.host_user_id !== uid) return json({ error: "Only the host can start the match" }, 403);
      if (!["lobby", "ready"].includes(room.status)) return json({ error: "Match already started" }, 409);
      const owners = (members ?? []).filter((m) => m.role === "team_owner");
      if (!owners.some((o) => o.team_side === "A") || !owners.some((o) => o.team_side === "B"))
        return json({ error: "Both teams need an owner" }, 400);
      if (orders.A.length !== 11 || orders.B.length !== 11) return json({ error: "Both owners must submit their Playing XI" }, 400);
      const rng = makeRng(`${secret.seed}:toss`);
      const winner: Side = rng() < 0.5 ? "A" : "B";
      const decision = rng() < 0.55 ? "bowl" : "bat";
      const batFirst: Side = decision === "bat" ? winner : winner === "A" ? "B" : "A";
      const state: MatchState = { overs, current: 0, toss: { winner, decision }, innings: [newInnings(batFirst, orders[batFirst])] };
      return await commit(state, "live", "match_started", { tossWinner: winner, decision });
    }

    // play
    if (room.status !== "live") return json({ error: room.status === "paused" ? "Match is paused" : "Match is not live" }, 409);
    const state = ms.state as unknown as MatchState;
    const inn = state.innings[state.current];
    const bowlSide: Side = inn.battingSide === "A" ? "B" : "A";
    const mySide = me.role === "team_owner" ? (me.team_side as Side) : null;
    if (mySide !== bowlSide) return json({ error: "Only the bowling team can play the next ball" }, 403);
    const { data: decisions } = await db.from("multiplayer_pending_decisions").select("*").eq("room_id", roomId).eq("version", expectedVersion);
    const bat = decisions?.find((d) => d.kind === "batting" && d.side === inn.battingSide);
    const bowl = decisions?.find((d) => d.kind === "bowling" && d.side === bowlSide);
    if (!bat || !bowl) return json({ error: "Waiting for both teams to lock in their decisions" }, 409);
    const bw = bowl.payload as any;
    const bErr = validateBowler(inn, overs, bw.bowlerId, orders[bowlSide]);
    if (bErr) return json({ error: bErr }, 400);

    const rng = makeRng(`${secret.seed}:${expectedVersion}`);
    const { state: next, ball } = playBall(state, squads, orders, bat.payload as any, bw, rng);
    const status = next.result ? "completed" : "live";
    return await commit(next, status, next.result ? "match_completed" : "ball_played", { ball, result: next.result ?? null });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
