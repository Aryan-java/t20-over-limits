export type ApiResource = "players" | "innings";

export interface ApiQuery {
  resource: ApiResource;
  search: string;
  limit: number;
  offset: number;
}

export function parseBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+([^\s]+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

export function parseApiQuery(url: string): { value: ApiQuery } | { error: string } {
  const params = new URL(url).searchParams;
  const resourceValue = params.get("resource") || "players";
  if (resourceValue !== "players" && resourceValue !== "innings") {
    return { error: "resource must be players or innings" };
  }

  const limitText = params.get("limit");
  const offsetText = params.get("offset");
  const limit = limitText === null ? 100 : Number(limitText);
  const offset = offsetText === null ? 0 : Number(offsetText);
  if (!Number.isInteger(limit) || limit < 1 || limit > 250) {
    return { error: "limit must be an integer from 1 to 250" };
  }
  if (!Number.isSafeInteger(offset) || offset < 0) {
    return { error: "offset must be a non-negative integer" };
  }

  const search = (params.get("search") ?? params.get("q") ?? "").trim();
  if (search.length > 100) return { error: "search must be 100 characters or fewer" };

  return { value: { resource: resourceValue, search, limit, offset } };
}

export function buildPlayerRecords(
  statsRows: Array<Record<string, unknown>>,
  inningsRows: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const inningsByPlayerId = new Map<string, Array<Record<string, unknown>>>();
  for (const innings of inningsRows) {
    const playerId = String(innings.player_id ?? "");
    if (!playerId) continue;
    const group = inningsByPlayerId.get(playerId) ?? [];
    group.push(innings);
    inningsByPlayerId.set(playerId, group);
  }

  return statsRows.map((stats) => {
    const playerId = String(stats.player_id ?? "");
    const innings = inningsByPlayerId.get(playerId) ?? [];
    const teamHistory = new Set<string>();
    for (const row of innings) {
      if (typeof row.team_name === "string" && row.team_name.trim()) teamHistory.add(row.team_name);
    }
    if (typeof stats.team_name === "string" && stats.team_name.trim()) teamHistory.add(stats.team_name);

    return {
      ...stats,
      team_history: [...teamHistory],
      innings,
      // Neither persisted table contains a match-status field.
      match_status: null,
    };
  });
}

export function apiMetadata() {
  return {
    schema_version: 1,
    match_status_available: false,
    player_matching: "Exact player_id only; same-name records are not merged.",
  };
}