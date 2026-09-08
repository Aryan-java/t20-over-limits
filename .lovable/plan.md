# T20 Over Limits — Upgrade Plan

Goal: raise the game to a polished, deep cricket sim without breaking anything that works today. Every phase ships standalone and leaves the app playable.

## What already exists (verified in the code)

- **Match simulation**: `BallByBallEngine.tsx` (~1340 lines) — ball outcomes, phases (powerplay/middle/death), extras, free hits, super over, DRS, impact player, form bonuses, conditions modifiers, Man of the Match, commentary generator.
- **Tactics**: `types/tactics.ts` with bowling variations, aggression and field presets feeding probability multipliers; `TacticalPanel.tsx`, `FieldPlacementEditor.tsx`, `DRSReviewDialog.tsx`.
- **Tournament**: store already has round-robin single/double fixtures, IPL playoffs (Q1/Eliminator/Q2/Final), points table with NRR, Orange/Purple Cap, playoff regeneration; UI in `TournamentTab.tsx`, `PointsTable.tsx`, `FixturesTab.tsx`.
- **Records**: `AllTimeStats.tsx` + `useAllTimeStats.ts` (paginated Cloud reads), player profiles, Best XI, comparison tool.
- **Presentation**: `LiveScoreboard`, `MatchCharts` (worm/Manhattan/wagon wheel), `PartnershipAnalysis`, `WinPrediction`, `RunRateGraph`, `CoinTossAnimation`, `PostMatchReport` (AI), `RealisticCommentary`, conditions/venue panels, milestone badge component.
- **Data**: IPL 2026 squads, player database with base + form-adjusted skills, venues, weather/pitch model.

So the upgrade is mostly **assembly, depth and polish**, not greenfield. There is no home/dashboard screen today (app opens on the Teams tab), the live screen is functional but scattered, and matchups/pressure/crowd systems do not exist.

## Risks to protect

1. `BallByBallEngine` is the single biggest file and holds all match state. Any refactor risks breaking live matches and stats persistence.
   - Mitigation: **extract, don't rewrite.** Move pure probability math into `src/lib/simulation/` with identical behaviour first, verified by a seeded regression harness, then add new factors behind explicit multipliers.
2. Persisted store shape (`zustand` + localStorage, currently migration v5). New player/match fields must be optional and seeded by a new migration version, or saved tournaments break.
3. Cloud stats writes (`saveAllTimeStats`) — new fields must not change the existing row schema without a migration and GRANTs.
4. Records aggregate by player **name**; keep that invariant when adding new record types.

## Phase 1 — Simulation core extraction + regression safety net

- New `src/lib/simulation/` : `probabilities.ts` (pure `simulateBallOutcome`), `rng.ts` (seedable RNG), `context.ts` (typed BallContext: batter, bowler, phase, conditions, tactics, match state).
- Engine calls the extracted functions; no behaviour change.
- Add a headless harness script that simulates N full innings with a fixed seed and prints score distribution, dismissal mix, extras rate, boundary %. This becomes the guard for every later phase.

## Phase 2 — Cricket intelligence layer

- **Player traits** (`src/data/playerTraits.ts`, optional per player, safe defaults derived from role + skills): pace/spin ratings, powerplay/death splits, against-short-ball, boundary-hitting, strike-rotation, death-bowling, yorker accuracy, control.
- **Matchup engine**: batter trait vs bowler type/variation → multipliers on wicket/boundary/dot.
- **Pressure model**: required run rate gap, dot-ball streak, wickets in hand, chase phase → nudges wicket and dot probability for both sides; exposed as a 0-100 "pressure index" the UI can show.
- **Form + conditions** already exist; they get folded into the same multiplier pipeline so effects are ordered and capped (no runaway compounding).

## Phase 3 — Deeper tactics with visible impact

- Per-batter tactic (anchor / rotate / target this bowler) and per-bowler plan carried in match state, not just global sliders.
- Field placement contributes properly: gaps sampled per shot direction, catch chance tied to fielders in the zone, boundary saves.
- A **Tactics Impact readout** on the live screen showing how the current settings shift expected runs/wicket chance, so choices feel material.

## Phase 4 — Live match screen redesign

Single professional layout: large score/overs, RR and RRR, required runs off balls, striker/non-striker cards with SR, bowler card with figures, current over dots, last 6 balls, partnership, fall of wickets, win probability bar, commentary feed, pressure meter. Existing components (`LiveScoreboard`, `WinPrediction`, `MatchCharts`, `PartnershipAnalysis`) are re-composed, not replaced. Controls and dialogs stay wired exactly as they are.

## Phase 5 — Home / dashboard

New route `/` dashboard (existing tabbed workspace stays reachable): season header, next fixture with Start Match, recent results, points-table preview, top performers (Orange/Purple cap), quick links. Reads existing store selectors and `useAllTimeStats` — no new backend.

## Phase 6 — Atmosphere and commentary

Crowd reaction states (buildup, roar, groan, tension), milestone celebrations (50/100/5-fer/hat-trick) using the existing milestone badge, rivalry moments (same batter-bowler repeat duels), pressure-aware commentary lines. Commentary generator becomes context-driven templates plus the existing AI report at the end.

## Phase 7 — Tournament and records depth

- Tournament: custom formats (group count, teams per group, semi-finals path alongside IPL playoffs), qualification-scenario text ("wins to qualify"), per-tournament statistics page.
- Records: team records (highest/lowest total, biggest win, best chase), match records (most sixes, closest finish), bowling records (best figures, most maidens, best economy), batting milestones — added to the existing dual-table records architecture.

## Data-model changes

- `Player`: optional `traits` object; existing fields untouched.
- `Innings`: optional `pressureIndex` history and `crowdState`; optional per-ball `shotZone` for wagon wheel accuracy.
- `Match`: optional `tacticsLog` (settings over time) for post-match analysis.
- `Tournament`: optional `config` (groups, semis vs playoffs) with the current IPL layout as default.
- Store migration bumped to v6 seeding all new optional fields.
- Cloud: additive columns/tables only for the new team/match record types, each with RLS and GRANTs; existing `player_all_time_stats` writes unchanged.

## Testing strategy

1. Seeded simulation harness: score/wicket/extras distributions compared against a baseline snapshot after every phase — realistic T20 ranges (par 165-185, ~6-7 wickets, ~8% extras).
2. Browser smoke run per phase: generate teams, play a full match to completion, confirm result, scorecard and stats persistence.
3. Tournament run: full league + playoffs, verify points table, NRR and qualification.
4. Records cross-check: player profile totals must equal records-leaderboard totals (the name-aggregation invariant).
5. Persistence check: load with an existing saved store to confirm the v6 migration is non-destructive.

## Sequencing

Phases 1-2 first (they de-risk everything else), then 3-4 (the visible gameplay/UI jump), then 5, then 6-7. Each phase ends with the harness plus a browser smoke run before moving on.
