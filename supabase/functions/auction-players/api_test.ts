import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildPlayerRecords, parseApiQuery, parseBearerToken } from "./api.ts";

Deno.test("parses bearer auth without accepting malformed headers", () => {
  assertEquals(parseBearerToken("Bearer abc123"), "abc123");
  assertEquals(parseBearerToken("bearer abc123"), "abc123");
  assertEquals(parseBearerToken("Bearer abc 123"), null);
  assertEquals(parseBearerToken(null), null);
});

Deno.test("validates resources and bounded pagination", () => {
  assertEquals(parseApiQuery("https://example.test/?resource=players&search=Rohit&limit=25&offset=10"), {
    value: { resource: "players", search: "Rohit", limit: 25, offset: 10 },
  });
  assertEquals(parseApiQuery("https://example.test/?resource=unknown"), {
    error: "resource must be players or innings",
  });
  assertEquals(parseApiQuery("https://example.test/?limit=251"), {
    error: "limit must be an integer from 1 to 250",
  });
});

Deno.test("joins persisted innings by exact player ID and does not merge same-name players", () => {
  const records = buildPlayerRecords(
    [
      { player_id: "one", player_name: "Alex Lee", team_name: "Team A", total_runs: 12 },
      { player_id: "two", player_name: "Alex Lee", team_name: "Team B", total_runs: 30 },
    ],
    [
      { player_id: "one", player_name: "Alex Lee", team_name: "Team C", runs: 12 },
      { player_id: "two", player_name: "Alex Lee", team_name: "Team D", runs: 30 },
    ],
  );

  assertEquals(records.length, 2);
  assertEquals(records[0].player_id, "one");
  assertEquals((records[0].innings as unknown[]).length, 1);
  assertEquals(records[0].team_history, ["Team C", "Team A"]);
  assertEquals(records[1].player_id, "two");
  assertEquals((records[1].innings as unknown[]).length, 1);
  assertEquals(records[1].team_history, ["Team D", "Team B"]);
  assertEquals(records[0].match_status, null);
});