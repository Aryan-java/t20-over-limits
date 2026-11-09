import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PLAYER_DATABASE } from "../../../src/data/playerDatabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const normalize = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function performanceScore(stats: Record<string, any> | undefined, batSkill: number, bowlSkill: number) {
  if (!stats) return batSkill + bowlSkill;
  const runs = Number(stats.total_runs || 0);
  const wickets = Number(stats.total_wickets || 0);
  const balls = Number(stats.balls_faced || 0);
  const dismissals = Math.max(1, Number(stats.matches_batted || 0) - Number(stats.not_outs || 0));
  const average = runs / dismissals;
  const strikeRate = balls > 0 ? runs / balls * 100 : 0;
  const bowlBalls = Number(stats.balls_bowled || 0);
  const economy = bowlBalls > 0 ? Number(stats.runs_conceded || 0) / (bowlBalls / 6) : 0;
  return runs + wickets * 25 + average * 2 + strikeRate * 0.45 - economy * 2;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("T20_AUCTION_API_TOKEN") || "";
  const supplied = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!expected || supplied !== expected) return json({ error: "Unauthorized" }, 401);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Supabase service configuration is missing" }, 500);

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const allStats: Record<string, any>[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("player_all_time_stats")
        .select("*")
        .range(from, from + 999);
      if (error) throw error;
      allStats.push(...(data || []));
      if (!data || data.length < 1000) break;
    }

    const statsByName = new Map<string, Record<string, any>>();
    for (const row of allStats) {
      const key = String(row.player_name || "").toLowerCase().trim();
      if (!key) continue;
      const previous = statsByName.get(key);
      if (!previous) {
        statsByName.set(key, row);
      } else {
        // Aggregate duplicate all-time rows for the same player name.
        const sumFields = [
          "matches_batted", "total_runs", "balls_faced", "fifties", "hundreds",
          "fours", "sixes", "not_outs", "matches_bowled", "total_wickets",
          "balls_bowled", "runs_conceded", "maidens",
        ];
        const merged = { ...previous, ...row };
        for (const field of sumFields) merged[field] = Number(previous[field] || 0) + Number(row[field] || 0);
        merged.highest_score = Math.max(Number(previous.highest_score || 0), Number(row.highest_score || 0));
        merged.image_url = previous.image_url || row.image_url;
        statsByName.set(key, merged);
      }
    }

    const players = PLAYER_DATABASE.map((player) => {
      const stats = statsByName.get(player.name.toLowerCase().trim());
      const score = performanceScore(stats, player.batSkill, player.bowlSkill);
      return {
        id: normalize(player.name),
        name: player.name,
        base_price: Math.round(player.price * 10000000),
        is_overseas: player.isOverseas,
        nationality: player.isOverseas ? "Overseas" : "India",
        role: player.role,
        photo_url: player.imageUrl || stats?.image_url || null,
        performance_score: score,
        stats: {
          ...(stats || {}),
          bat_skill: player.batSkill,
          bowl_skill: player.bowlSkill,
          has_recorded_performance: !!stats,
        },
      };
    });

    return json({
      players,
      total: players.length,
      stats_players: statsByName.size,
      source: "T20 Over Limits PLAYER_DATABASE + player_all_time_stats",
    });
  } catch (error) {
    console.error("auction-players error", error);
    return json({ error: error instanceof Error ? error.message : "Could not load player data" }, 500);
  }
});
