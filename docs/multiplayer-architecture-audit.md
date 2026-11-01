# Multiplayer Architecture Audit and Expansion Plan

## Current implementation

The existing multiplayer mode is a two-team, room-scoped match system backed by Supabase.

- `multiplayer_rooms` stores room metadata, two JSON team payloads (`team_a`, `team_b`), two-side setup state, and host identity.
- `multiplayer_room_members` assigns at most one owner to side A and one owner to side B through a unique index on `(room_id, team_side)`.
- `multiplayer_match_state` stores exactly one match state per room.
- `multiplayer_pending_decisions` stores one batting and one bowling decision per room and uses side A/B.
- SQL RPCs validate team ownership and match decisions using A/B branches.
- The Edge Function and shared engine consume the same A/B model.
- The React room hook subscribes to room, member, match-state, and event changes.

## Constraints that prevent multi-team tournaments

1. The room schema stores only `team_a` and `team_b`.
2. Member `team_side` is constrained to A/B, and a unique index limits the room to two team owners.
3. Match state is keyed by `room_id`, so a room cannot safely hold multiple independent fixtures.
4. Pending decisions are keyed by `(room_id, kind)` and refer to A/B.
5. SQL procedures `mp_set_teams`, `mp_assign_member`, `mp_submit_team_setup`, `mp_submit_decision`, and the match-start flow encode two-side assumptions.
6. Client types and components assume `Side = "A" | "B"`, `team_a`, `team_b`, and two owner slots.
7. The existing auth helpers reject unauthenticated users. Anonymous/no-account participation is not currently supported by these database functions.
8. The current match state stores a limited recent-delivery window; it is not a durable per-fixture ball-by-ball archive.

## Design direction

Use an additive migration and gradual compatibility layer. Do not drop or repurpose the existing A/B columns in the first migration.

### Proposed entities

- `multiplayer_teams`: one row per team in a room; includes owner/member relationship and team metadata.
- `multiplayer_tournaments`: tournament configuration and lifecycle for a room.
- `multiplayer_fixtures`: scheduled fixture order, participating team IDs, status, and result.
- `multiplayer_matches`: one match record per fixture, including innings and lifecycle metadata.
- `multiplayer_deliveries`: durable ordered ball-by-ball records per innings.
- Later phases: trades, room chat, and tournament event/audit records.

### Migration principles

- Keep existing A/B fields and RPCs working while the new entities are introduced.
- Use UUID foreign keys and explicit uniqueness constraints for team membership, fixture ordering, and per-innings delivery numbering.
- Enforce ownership and lifecycle transitions inside SQL RPCs / server-side engine calls, not only in React.
- Apply RLS policies deliberately; do not grant broad client writes to tournament or match tables.
- Keep service-role-only writes for authoritative match state and delivery commits.
- Add indexes for room, tournament, fixture, team, and chronological delivery lookups.
- Provide a backfill/compatibility strategy before any old columns or functions are retired.
- Do not claim no-login participation until a secure participant identity and abuse-control design is implemented. Simply granting access to anon would be unsafe.

## Recommended implementation sequence

1. Establish tests and retain the current two-team behavior as a regression baseline.
2. Add additive multi-team/tournament schema and secure read/write RPC boundaries.
3. Add team/member ownership mapping and room-capacity configuration.
4. Add tournament creation, fixture generation, standings, and sequential fixture activation.
5. Add fixture-specific lineups and readiness confirmation.
6. Adapt the server-authoritative match engine to use fixture/team IDs rather than A/B room-global assumptions.
7. Persist every delivery and calculate scorecards/statistics from durable records.
8. Add trades, chat, forfeits, records, and archive behavior.
9. Test RLS, concurrent actions, reconnects, host handover, and single-player regression before release.

## Risks requiring explicit testing

- Race conditions during team assignment, fixture activation, and match actions.
- RLS leakage of private lineup/decision data.
- Duplicate player ownership and duplicate fixture/delivery records.
- Host departure during lobby and live play.
- Room capacity enforcement under concurrent joins.
- Reconnect and stale-version handling.
- Existing deployed Supabase schema may differ from repository migrations; verify the live database before applying any migration.

## Current status

This is an architecture audit only. No Supabase database has been modified, no production migration has been applied, and no gameplay behavior has changed.
