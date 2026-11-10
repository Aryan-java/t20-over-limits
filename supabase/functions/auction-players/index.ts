import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { apiMetadata, buildPlayerRecords, parseApiQuery, parseBearerToken } from "./api.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("T20_AUCTION_API_TOKEN") ?? "";
  const supplied = parseBearerToken(req.headers.get("authorization"));
  if (!expected || !supplied || supplied !== expected) return json({ error: "Unauthorized" }, 401);

  const parsed = parseApiQuery(req.url);
  if ("error" in parsed) return json({ error: parsed.error }, 400);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Server data access is not configured" }, 500);

    const client = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { resource, search, limit, offset } = parsed.value;

    if (resource === "innings") {
      let query = client
        .from("player_innings")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: true });
      if (search) query = query.ilike("player_name", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (error) throw error;
      return json({ data: data ?? [], total: count ?? null, limit, offset, resource, ...apiMetadata() });
    }

    let statsQuery = client
      .from("player_all_time_stats")
      .select("*", { count: "exact" })
      .order("player_name", { ascending: true })
      .order("player_id", { ascending: true });
    if (search) statsQuery = statsQuery.ilike("player_name", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
    const { data: statsRows, error: statsError, count } = await statsQuery.range(offset, offset + limit - 1);
    if (statsError) throw statsError;

    const playerIds = (statsRows ?? []).map((row) => row.player_id);
    let inningsRows: Array<Record<string, unknown>> = [];
    for (let idsFrom = 0; idsFrom < playerIds.length; idsFrom += 50) {
      const idChunk = playerIds.slice(idsFrom, idsFrom + 50);
      for (let rowsFrom = 0; ; rowsFrom += 1000) {
        const { data, error } = await client
          .from("player_innings")
          .select("*")
          .in("player_id", idChunk)
          .order("created_at", { ascending: true })
          .range(rowsFrom, rowsFrom + 999);
        if (error) throw error;
        inningsRows.push(...((data ?? []) as Array<Record<string, unknown>>));
        if (!data || data.length < 1000) break;
      }
    }

    return json({
      data: buildPlayerRecords((statsRows ?? []) as Array<Record<string, unknown>>, inningsRows),
      total: count ?? null,
      limit,
      offset,
      resource,
      ...apiMetadata(),
    });
  } catch (error) {
    console.error("auction-players request failed", error instanceof Error ? error.message : "unknown error");
    return json({ error: "Unable to retrieve player statistics" }, 500);
  }
});