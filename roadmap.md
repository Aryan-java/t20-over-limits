# Roadmap
- [x] Multiplayer: secure schema/RLS/RPCs + live updates
- [x] Multiplayer: server ball engine (mp-engine function, seeded, version-guarded, bowling-owner only)
- [x] Multiplayer: client types, sign-in hook, room live-sync hook (presence, reconnect resync)
- [x] Multiplayer screens: sign in, home (create/join), lobby + host controls, team setup, live match + decision panels + PLAY NEXT BALL, activity feed, /multiplayer route + nav link
- [x] Multiplayer: engine tests + signed-out access checks; host override
- [ ] Multiplayer: two-account live test (needs a second confirmed account)

## Multiplayer parity with single-player (open)
- [x] Owners build own squads (18-25, max 8 overseas, no duplicates; server-checked)
- [x] Bowling owner plays each ball; plans stick; pauses only for next-batter choice
- [ ] Port the full single-player engine (DRS, conditions, commentary, Impact swap, stats saving) into a shared module the server runs
- [ ] Server re-checks player ratings against the player database
- [ ] Two-account live test (needs second confirmed account)
