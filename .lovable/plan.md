# Multiplayer Mode — Implementation Plan

Single-player stays untouched. Multiplayer is a new, sign-in-only area with rooms, lobby, and a live match where the server decides every ball.

## What users will see
- New **Multiplayer** tab: Sign in / Sign up (email + password), then **Create Room** or **Join by 6-character code**.
- **Lobby**: host, members, role badges (Host, Team Owner, Spectator, Unassigned), assigned teams, ready ticks, online dots, activity feed.
- **Host controls**: pick the two teams, assign/reassign owners, kick, transfer host, start / pause / resume.
- **Owner setup**: each owner picks their own Playing XI, 4 impact players and openers at the same time; toss uses existing rules.
- **Live match**: "You control X", opponent, phase, private tactic panels (batting intent vs bowling plan / field / bowler), and a big **PLAY NEXT BALL** button shown only to the bowling owner, enabled only when both sides have submitted. Messages like "Waiting for India" and "Only the bowling team can play the next ball".
- Match pauses automatically if the bowling owner goes offline.

## Database (new tables, all with RLS, members-only reads)
- `multiplayer_rooms` — code (unique, random 6 chars), host_user_id, status (lobby / ready / live / innings_break / paused / completed), settings, team_a/team_b snapshot, `version`, `seed`.
- `multiplayer_room_members` — room_id, user_id, display_name, role (checked enum), team_side, ready, last_seen. Unique (room_id, user_id) and partial unique (room_id, team_side) so one owner per team.
- `multiplayer_match_state` — public authoritative state (scores, innings, current batters/bowler, ball number, version).
- `multiplayer_pending_decisions` — per room/side/ball private tactics; RLS lets only that side's owner read it.
- `multiplayer_events` — append-only log (join, assign, "batting submitted" without payload, ball result, pause...).
- Indexes on code, status, membership, events(room_id, created_at). Realtime enabled on rooms, members, match_state, events (not pending decisions).
- No client INSERT/UPDATE/DELETE policies on these tables; every change goes through server functions.
- Existing `game_sessions` / `game_players` left as-is (unused by code), so no data loss.

## Server actions
- SECURITY DEFINER Postgres functions (fixed search_path, `auth.uid()` checks, input validation): `create_room`, `join_room`, `leave_room`, `assign_team_owner`, `kick_member`, `transfer_host`, `set_ready`, `submit_team_setup`, `submit_batting_decision`, `submit_bowling_decision`, `pause_match`, `resume_match`, `heartbeat`.
- `play_next_ball` Edge Function: verifies caller is bowling owner, phase is live, both decisions present, `expected_version` matches; runs the shared deterministic resolver with a seed derived from room seed + ball number; commits state + event with an atomic version-guarded update (a replay or double click is rejected).
- `start_match` also runs through the Edge Function (toss + initial state).

## Technical details
- Extract ball outcome logic from `BallByBallEngine.tsx` into a pure, seedable module (`src/lib/engine/resolveBall.ts`) reused by the single-player engine (Math.random as default RNG, so behavior is unchanged) and copied into `supabase/functions/_shared/` for the Edge Function. Tactics modifiers from `src/types/tactics.ts` are reused the same way.
- Frontend: `src/types/multiplayer.ts`, `useAuth`, `useMultiplayerRoom` (realtime subscriptions in useEffect with cleanup, resync on reconnect, presence for online status), components `MultiplayerAuth`, `MultiplayerHome`, `MultiplayerLobby`, `MultiplayerTeamSetup`, `MultiplayerMatchView`, `MultiplayerMatchControls`, `ActivityFeed`. Route `/multiplayer/:code`.
- Email sign-in enabled; email confirmation kept on (users confirm via email first).

## Verification
- Build/type check; migrations applied; SQL-level auth matrix tests using test users (owner own vs opponent side, spectator, unassigned, batting owner cannot play ball, replayed version rejected, non-member rejected).
- Two Playwright sessions in one room receiving the same ball result; reconnect resync check.

## Limitations to expect
- Server resolver mirrors the extracted engine; weather/venue modifiers included, AI commentary kept lightweight in multiplayer.
- Offline bowling owner pauses the match; no auto-simulation.
