import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PLAYER_DATABASE } from "@/data/playerDatabase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Member } from "@/types/multiplayer";

type Team = { id: string; name: string; squad: any[] };
type Tournament = { id: string; name: string; status: string; settings: any };
type Fixture = { id: string; tournament_id: string; round_number: number; fixture_number: number; home_team_id: string; away_team_id: string; status: string; winner_team_id?: string | null; result?: any };
type Lineup = { fixture_id: string; team_id: string; playing_xi: string[]; impact_players: string[]; owner_user_id: string };

export default function FixtureTournamentPanel({ roomId, userId, isHost, members }: { roomId: string; userId: string; isHost: boolean; members: Member[] }) {
  const db = supabase as any;
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [owners, setOwners] = useState<Record<string, string>>({});
  const [selectedTournament, setSelectedTournament] = useState("");
  const [teamName, setTeamName] = useState("");
  const [playerQuery, setPlayerQuery] = useState("");
  const [teamOwner, setTeamOwner] = useState("");
  const [tournamentName, setTournamentName] = useState("My Tournament");
  const [squadNames, setSquadNames] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [lineupFixture, setLineupFixture] = useState("");
  const [xi, setXi] = useState<string[]>([]);
  const [impact, setImpact] = useState<string[]>([]);
  const [activeMatch, setActiveMatch] = useState<{ id: string; version: number; status: string; state: any } | null>(null);
  const [selectedBowler, setSelectedBowler] = useState("");
  const [aggression, setAggression] = useState("50");
  const [outgoingPlayer, setOutgoingPlayer] = useState("");
  const [incomingImpact, setIncomingImpact] = useState("");
  const byName = useMemo(() => new Map(PLAYER_DATABASE.map((p) => [p.name, p])), []);

  const refresh = useCallback(async () => {
    const [t, ts, fs, ls, os] = await Promise.all([
      db.from("multiplayer_teams").select("id,name,squad").eq("room_id", roomId).order("created_at"),
      db.from("multiplayer_tournaments").select("id,name,status,settings").eq("room_id", roomId).order("created_at", { ascending: false }),
      db.from("multiplayer_fixtures").select("id,tournament_id,round_number,fixture_number,home_team_id,away_team_id,status,winner_team_id,result").eq("room_id", roomId).order("round_number").order("fixture_number"),
      db.from("multiplayer_fixture_lineups").select("fixture_id,team_id,playing_xi,impact_players,owner_user_id").eq("room_id", roomId),
      db.from("multiplayer_team_members").select("team_id,user_id").eq("room_id", roomId).eq("role", "owner"),
    ]);
    for (const x of [t,ts,fs,ls,os]) if (x.error) { console.error(x.error); toast({ title: "Could not load tournament data", description: x.error.message, variant: "destructive" }); return; }
    setTeams(t.data ?? []); setTournaments(ts.data ?? []); setFixtures(fs.data ?? []); setLineups(ls.data ?? []);
    setOwners(Object.fromEntries((os.data ?? []).map((x: any) => [x.team_id, x.user_id])));
    const liveFixtureIds = (fs.data ?? []).filter((fixture: any) => fixture.status === "live").map((fixture: any) => fixture.id);
    if (liveFixtureIds.length) {
      const { data: matches, error: matchError } = await db.from("multiplayer_matches").select("id,version,status,state").in("fixture_id", liveFixtureIds).limit(1);
      if (!matchError && matches?.[0]) setActiveMatch(matches[0]);
    }
    if (!selectedTournament && ts.data?.[0]) setSelectedTournament(ts.data[0].id);
  }, [db, roomId, selectedTournament]);

  useEffect(() => { void refresh(); }, [refresh]);
  const tournament = tournaments.find((t) => t.id === selectedTournament);
  const tournamentFixtures = fixtures.filter((f) => f.tournament_id === selectedTournament);
  const standings = teams.map((team) => {
    const played = tournamentFixtures.filter((f) => f.status === "completed" && (f.home_team_id === team.id || f.away_team_id === team.id));
    const won = played.filter((f) => f.winner_team_id === team.id).length;
    const tied = played.filter((f) => f.winner_team_id == null && !!f.result).length;
    return { team, played: played.length, won, tied, lost: played.length - won - tied, points: won * 2 + tied };
  }).sort((a, b) => b.points - a.points || b.won - a.won || a.team.name.localeCompare(b.team.name));
  const teamById = (id: string) => teams.find((t) => t.id === id);
  const runRpc = async (name: string, args: Record<string, unknown>) => {
    const { data, error } = await db.rpc(name, args);
    if (error) { toast({ title: "Action failed", description: error.message, variant: "destructive" }); return null; }
    await refresh(); return data ?? true;
  };

  const createTeam = async () => {
    if (!teamName.trim() || squadNames.length < 18 || squadNames.length > 25 || !teamOwner) return;
    setBusy(true);
    const squad = squadNames.map((n) => { const p = byName.get(n)!; return { id: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0,80), name:p.name, batSkill:p.batSkill, bowlSkill:p.bowlSkill, isOverseas:p.isOverseas, imageUrl:p.imageUrl }; });
    await runRpc("mp_create_team", { p_room: roomId, p_owner: teamOwner, p_name: teamName.trim(), p_squad: squad });
    setTeamName(""); setSquadNames([]); setBusy(false);
  };
  const createTournament = async () => {
    if (!tournamentName.trim()) return;
    setBusy(true);
    const id = await runRpc("mp_create_tournament", { p_room: roomId, p_name: tournamentName.trim(), p_format: "round_robin", p_settings: { overs: 20 } });
    if (typeof id === "string") setSelectedTournament(id);
    setBusy(false);
  };
  const registerAndGenerate = async () => {
    if (!tournament || teams.length < 2) return;
    setBusy(true);
    for (const team of teams) {
      const { error } = await db.rpc("mp_register_tournament_team", { p_room: roomId, p_tournament: tournament.id, p_team: team.id, p_seed: null });
      if (error) { toast({ title: "Registration stopped", description: error.message, variant: "destructive" }); setBusy(false); await refresh(); return; }
    }
    await runRpc("mp_generate_round_robin", { p_room: roomId, p_tournament: tournament.id });
    setBusy(false);
  };
  const submitLineup = async () => {
    const fixture = fixtures.find((f) => f.id === lineupFixture);
    if (!fixture) return;
    const myTeamId = [fixture.home_team_id, fixture.away_team_id].find((id) => owners[id] === userId);
    const team = myTeamId ? teamById(myTeamId) : null;
    if (!team) return;
    setBusy(true);
    await runRpc("mp_submit_fixture_lineup", { p_room: roomId, p_fixture: fixture.id, p_team: team.id, p_xi: xi, p_impact: impact });
    setBusy(false);
  };
  const activateFixture = async () => {
    if (!tournament) return;
    setBusy(true);
    const matchId = await runRpc("mp_advance_fixture", { p_room: roomId, p_tournament: tournament.id });
    if (typeof matchId === "string") {
      const { data, error } = await db.from("multiplayer_matches").select("id,version,status,state").eq("id", matchId).single();
      if (error) toast({ title: "Fixture activated, match load failed", description: error.message, variant: "destructive" });
      else setActiveMatch(data);
    }
    setBusy(false);
  };
  const startFixture = async () => {
    if (!activeMatch) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("mp-fixture-engine", { body: { action: "start", matchId: activeMatch.id, expectedVersion: activeMatch.version } });
    if (error) toast({ title: "Could not start fixture", description: error.message, variant: "destructive" });
    else { setActiveMatch({ ...activeMatch, version: data.version, status: "live", state: data.state }); toast({ title: "Fixture started", description: "Toss completed. Fixture engine is live." }); }
    setBusy(false);
  };
  const selectedFixture = fixtures.find((f) => f.id === lineupFixture);
  const myLineupTeamId = selectedFixture && [selectedFixture.home_team_id, selectedFixture.away_team_id].find((id) => owners[id] === userId);
  const myLineupTeam = myLineupTeamId ? teamById(myLineupTeamId) : null;
  const activeFixture = fixtures.find((f) => f.status === "live" && f.tournament_id === selectedTournament);
  const activeInnings = activeMatch?.state?.innings?.[activeMatch.state.current];
  const battingTeamId = activeInnings ? (activeInnings.battingSide === "A" ? activeFixture?.home_team_id : activeFixture?.away_team_id) : undefined;
  const bowlingTeamId = activeInnings ? (activeInnings.battingSide === "A" ? activeFixture?.away_team_id : activeFixture?.home_team_id) : undefined;
  const battingOwner = !!battingTeamId && owners[battingTeamId] === userId;
  const bowlingOwner = !!bowlingTeamId && owners[bowlingTeamId] === userId;
  const battingTeam = battingTeamId ? teamById(battingTeamId) : undefined;
  const bowlingTeam = bowlingTeamId ? teamById(bowlingTeamId) : undefined;
  const battingLineup = activeFixture && battingTeamId ? lineups.find((l) => l.fixture_id === activeFixture.id && l.team_id === battingTeamId) : undefined;
  const bowlingLineup = activeFixture && bowlingTeamId ? lineups.find((l) => l.fixture_id === activeFixture.id && l.team_id === bowlingTeamId) : undefined;
  const fixtureAction = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!activeMatch) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("mp-fixture-engine", { body: { action, matchId: activeMatch.id, expectedVersion: activeMatch.version, ...extra } });
    if (error) toast({ title: "Fixture action failed", description: error.message, variant: "destructive" });
    else setActiveMatch({ ...activeMatch, version: data.version ?? activeMatch.version, status: data.status ?? activeMatch.status, state: data.state ?? activeMatch.state });
    setBusy(false);
  };

  return <Card className="border-primary/30">
    <CardHeader><CardTitle className="flex items-center gap-2">Tournament mode <Badge variant="outline">New multi-team flow</Badge></CardTitle></CardHeader>
    <CardContent className="space-y-5">
      {isHost && <div className="grid md:grid-cols-2 gap-4">
        <section className="space-y-2 rounded-lg border p-3">
          <h3 className="font-semibold">Create tournament team</h3>
          <Input placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} maxLength={60} />
          <Select value={teamOwner} onValueChange={setTeamOwner}><SelectTrigger><SelectValue placeholder="Assign team owner" /></SelectTrigger><SelectContent>{members.filter((m) => !Object.values(owners).includes(m.user_id)).map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.display_name}</SelectItem>)}</SelectContent></Select>
          <p className="text-xs text-muted-foreground">Squad: {squadNames.length}/25 (minimum 18), overseas limit 8.</p>
          <Input placeholder="Search player database" value={playerQuery} onChange={(e) => setPlayerQuery(e.target.value)} />
          <div className="max-h-48 overflow-y-auto grid sm:grid-cols-2 gap-1">{PLAYER_DATABASE.filter((p) => p.name.toLowerCase().includes(playerQuery.toLowerCase())).slice(0,120).map((p) => <label key={p.name} className="flex items-center gap-2 text-xs p-1"><Checkbox checked={squadNames.includes(p.name)} disabled={!squadNames.includes(p.name) && (squadNames.length >= 25 || (p.isOverseas && squadNames.filter((n) => byName.get(n)?.isOverseas).length >= 8))} onCheckedChange={(v) => setSquadNames((old) => v ? [...old,p.name] : old.filter((n) => n !== p.name))} /><span>{p.name}{p.isOverseas ? " ✈" : ""}</span></label>)}</div>
          <Button disabled={busy || !teamName.trim() || !teamOwner || squadNames.length < 18} onClick={createTeam}>Create team</Button>
        </section>
        <section className="space-y-2 rounded-lg border p-3">
          <h3 className="font-semibold">Create round-robin tournament</h3>
          <Input value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} maxLength={80} />
          <Button disabled={busy || teams.length < 2 || !tournamentName.trim()} onClick={createTournament}>Create tournament</Button>
          <Select value={selectedTournament} onValueChange={setSelectedTournament}><SelectTrigger><SelectValue placeholder="Select tournament" /></SelectTrigger><SelectContent>{tournaments.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} · {t.status}</SelectItem>)}</SelectContent></Select>
          {tournament && <Button variant="secondary" disabled={busy || tournament.status !== "setup"} onClick={registerAndGenerate}>Register all teams & generate fixtures</Button>}
        </section>
      </div>}
      <section className="space-y-2">
        <h3 className="font-semibold">Teams ({teams.length})</h3>
        {teams.map((t) => <div key={t.id} className="flex justify-between text-sm border-b py-1"><span>{t.name} · {t.squad.length} players</span><span className="text-muted-foreground">{members.find((m) => m.user_id === owners[t.id])?.display_name ?? "Owner unavailable"}</span></div>)}
      </section>
      {tournament && <section className="space-y-2">
        <h3 className="font-semibold">{tournament.name} · Fixtures ({tournamentFixtures.length})</h3>
        {tournamentFixtures.map((f) => <div key={f.id} className="flex flex-wrap items-center gap-2 rounded border p-2 text-sm"><span className="flex-1">R{f.round_number} · {teamById(f.home_team_id)?.name} vs {teamById(f.away_team_id)?.name}</span><Badge variant="outline">{f.status}</Badge><span className="text-xs text-muted-foreground">Lineups {lineups.filter((l) => l.fixture_id === f.id).length}/2</span></div>)}
        {isHost && ["ready","live"].includes(tournament.status) && <Button disabled={busy || fixtures.some((f) => f.tournament_id === selectedTournament && f.status === "live")} onClick={activateFixture}>Activate next fixture</Button>}
      </section>}
      {tournament && tournamentFixtures.some((f) => f.status === "completed") && <section className="space-y-2">
        <h3 className="font-semibold">Points table</h3>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-muted-foreground"><th className="p-2 text-left">Team</th><th className="p-2">P</th><th className="p-2">W</th><th className="p-2">T</th><th className="p-2">L</th><th className="p-2">Pts</th></tr></thead><tbody>{standings.map((row) => <tr key={row.team.id} className="border-b"><td className="p-2 font-medium">{row.team.name}</td><td className="p-2 text-center">{row.played}</td><td className="p-2 text-center">{row.won}</td><td className="p-2 text-center">{row.tied}</td><td className="p-2 text-center">{row.lost}</td><td className="p-2 text-center font-semibold">{row.points}</td></tr>)}</tbody></table></div>
        <p className="text-xs text-muted-foreground">Scoring: win = 2 points, tie/no winner = 1 point. Net run rate is not calculated yet.</p>
      </section>}
      {selectedFixture && myLineupTeam && <section className="space-y-2 rounded-lg border p-3">
        <h3 className="font-semibold">Confirm XI: {myLineupTeam.name}</h3>
        <p className="text-xs text-muted-foreground">Select 11 players and up to 4 Impact Players. Maximum 4 overseas players in XI.</p>
        <div className="max-h-56 overflow-y-auto grid sm:grid-cols-2 gap-1">{myLineupTeam.squad.map((p: any) => <div key={p.id} className="flex items-center gap-2 text-sm"><Checkbox checked={xi.includes(p.id)} disabled={impact.includes(p.id) || (!xi.includes(p.id) && xi.length >= 11)} onCheckedChange={(v) => setXi((old) => v ? [...old,p.id] : old.filter((x) => x !== p.id))} /><span className="flex-1">{p.name}</span><Button size="sm" variant={impact.includes(p.id) ? "default" : "outline"} disabled={xi.includes(p.id) || (!impact.includes(p.id) && impact.length >= 4)} onClick={() => setImpact((old) => old.includes(p.id) ? old.filter((x) => x !== p.id) : [...old,p.id])}>IP</Button></div>)}</div>
        <p className="text-xs">XI {xi.length}/11 · Impact {impact.length}/4</p>
        <Button disabled={busy || xi.length !== 11 || xi.filter((id) => myLineupTeam.squad.find((p: any) => p.id === id)?.isOverseas).length > 4} onClick={submitLineup}>Confirm fixture XI</Button>
      </section>}
      <section className="space-y-2">
        <Select value={lineupFixture} onValueChange={(id) => { setLineupFixture(id); const old = lineups.find((l) => l.fixture_id === id && l.owner_user_id === userId); setXi(old?.playing_xi ?? []); setImpact(old?.impact_players ?? []); }}><SelectTrigger><SelectValue placeholder="Choose fixture to submit your XI" /></SelectTrigger><SelectContent>{fixtures.filter((f) => f.tournament_id === selectedTournament && ["scheduled","ready"].includes(f.status)).map((f) => <SelectItem key={f.id} value={f.id}>R{f.round_number}: {teamById(f.home_team_id)?.name} vs {teamById(f.away_team_id)?.name}</SelectItem>)}</SelectContent></Select>
      </section>
      {activeMatch && <section className="rounded-lg border p-3 space-y-3">
        <h3 className="font-semibold">Active fixture match</h3>
        <p className="text-sm">Status: {activeMatch.status} · Version {activeMatch.version}</p>
        <Button disabled={busy || activeMatch.status !== "ready"} onClick={startFixture}>Start fixture & conduct toss</Button>
        <Button variant="outline" disabled={busy} onClick={async () => { const { data, error } = await supabase.functions.invoke("mp-fixture-engine", { body: { action: "get_state", matchId: activeMatch.id } }); if (error) toast({ title: "Refresh failed", description: error.message, variant: "destructive" }); else setActiveMatch({ ...activeMatch, status: data.status, version: data.version, state: data.state }); }}>Refresh match state</Button>
        {activeInnings && <p className="text-sm">Score: {activeInnings.runs}/{activeInnings.wickets} · {activeInnings.balls} legal balls · {activeInnings.battingSide === "A" ? "Home" : "Away"} batting</p>}
        {activeInnings && battingOwner && <div className="space-y-2 border-t pt-2"><h4 className="font-medium">Batting · {battingTeam?.name}</h4><div className="flex gap-2"><Input type="number" min="0" max="100" value={aggression} onChange={(e) => setAggression(e.target.value)} className="w-24" /><Button size="sm" disabled={busy || Number(aggression) < 0 || Number(aggression) > 100} onClick={() => fixtureAction("set_batting_decision", { aggression: Number(aggression) })}>Set aggression</Button></div>
        {activeInnings.awaitingBatter && <Select onValueChange={(batterId) => fixtureAction("select_batter", { batterId })}><SelectTrigger><SelectValue placeholder="Select next batter" /></SelectTrigger><SelectContent>{(activeInnings.order ?? []).filter((id: string) => !(activeInnings.batted ?? []).includes(id)).map((id: string) => <SelectItem key={id} value={id}>{battingTeam?.squad.find((p: any) => p.id === id)?.name ?? id}</SelectItem>)}</SelectContent></Select>}</div>}
        {activeInnings && bowlingOwner && bowlingLineup && <div className="space-y-2 border-t pt-2"><h4 className="font-medium">Bowling · {bowlingTeam?.name}</h4><Select value={selectedBowler} onValueChange={setSelectedBowler}><SelectTrigger><SelectValue placeholder="Select bowler" /></SelectTrigger><SelectContent>{bowlingLineup.playing_xi.map((id) => { const bowlingSide = activeInnings?.battingSide === "A" ? "B" : "A"; const sub = activeMatch?.state?.impactSubstitutions?.[bowlingSide]; const mapped = sub?.outgoing === id ? sub.incoming : id; return <SelectItem key={mapped} value={mapped}>{bowlingTeam?.squad.find((p: any) => p.id === mapped)?.name ?? mapped}</SelectItem>; })}</SelectContent></Select><Button disabled={busy || !selectedBowler || !!activeInnings.awaitingBatter || activeMatch.status !== "live"} onClick={() => fixtureAction("play", { bowling: { field: "balanced", bowlerId: selectedBowler, strategy: { normal: 20, yorker: 20, bouncer: 20, slower: 20, knuckle: 20 } } })}>Play next ball</Button></div>}
        {(battingOwner || bowlingOwner) && <div className="space-y-2 border-t pt-2"><h4 className="font-medium">Impact Player substitution</h4><Select value={outgoingPlayer} onValueChange={setOutgoingPlayer}><SelectTrigger><SelectValue placeholder="Outgoing XI player" /></SelectTrigger><SelectContent>{(battingOwner ? battingLineup : bowlingLineup)?.playing_xi.map((id) => <SelectItem key={id} value={id}>{(battingOwner ? battingTeam : bowlingTeam)?.squad.find((p: any) => p.id === id)?.name ?? id}</SelectItem>)}</SelectContent></Select><Select value={incomingImpact} onValueChange={setIncomingImpact}><SelectTrigger><SelectValue placeholder="Incoming Impact Player" /></SelectTrigger><SelectContent>{(battingOwner ? battingLineup : bowlingLineup)?.impact_players.map((id) => <SelectItem key={id} value={id}>{(battingOwner ? battingTeam : bowlingTeam)?.squad.find((p: any) => p.id === id)?.name ?? id}</SelectItem>)}</SelectContent></Select><Button variant="secondary" disabled={busy || !outgoingPlayer || !incomingImpact || activeMatch.status !== "live"} onClick={() => fixtureAction("substitute_impact", { outgoingPlayerId: outgoingPlayer, impactPlayerId: incomingImpact })}>Make substitution</Button></div>}
        {activeMatch.state?.innings?.map((inn: any, i: number) => {
          const sideTeam = teamById(inn.battingSide === "A" ? activeFixture?.home_team_id ?? "" : activeFixture?.away_team_id ?? "");
          const bowlingTeamForInn = teamById(inn.battingSide === "A" ? activeFixture?.away_team_id ?? "" : activeFixture?.home_team_id ?? "");
          return <div key={i} className="border-t pt-2 space-y-2"><b className="text-sm">Innings {i + 1}: {sideTeam?.name ?? (inn.battingSide === "A" ? "Home" : "Away")} — {inn.runs}/{inn.wickets} ({Math.floor(inn.balls / 6)}.{inn.balls % 6})</b>
            <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b text-muted-foreground"><th className="p-1 text-left">Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th></tr></thead><tbody>{Object.entries(inn.batters ?? {}).map(([id, line]: [string, any]) => <tr key={id} className="border-b"><td className="p-1">{sideTeam?.squad.find((p: any) => p.id === id)?.name ?? id}{line.out ? " · out" : ""}</td><td className="text-center">{line.runs}</td><td className="text-center">{line.balls}</td><td className="text-center">{line.fours}</td><td className="text-center">{line.sixes}</td></tr>)}</tbody></table></div>
            <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b text-muted-foreground"><th className="p-1 text-left">Bowler</th><th>O</th><th>R</th><th>W</th></tr></thead><tbody>{Object.entries(inn.bowlers ?? {}).map(([id, line]: [string, any]) => <tr key={id} className="border-b"><td className="p-1">{bowlingTeamForInn?.squad.find((p: any) => p.id === id)?.name ?? id}</td><td className="text-center">{Math.floor(line.balls / 6)}.{line.balls % 6}</td><td className="text-center">{line.runs}</td><td className="text-center">{line.wickets}</td></tr>)}</tbody></table></div>
          </div>;
        })}
        {isHost && activeMatch.status === "live" && <Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); const { data, error } = await supabase.functions.invoke("mp-fixture-engine", { body: { action: "pause", matchId: activeMatch.id, expectedVersion: activeMatch.version } }); if (error) toast({ title: "Pause failed", description: error.message, variant: "destructive" }); else setActiveMatch({ ...activeMatch, status: data.status, version: data.version }); setBusy(false); }}>Pause fixture</Button>}
        {isHost && activeMatch.status === "paused" && <Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); const { data, error } = await supabase.functions.invoke("mp-fixture-engine", { body: { action: "resume", matchId: activeMatch.id, expectedVersion: activeMatch.version } }); if (error) toast({ title: "Resume failed", description: error.message, variant: "destructive" }); else setActiveMatch({ ...activeMatch, status: data.status, version: data.version }); setBusy(false); }}>Resume fixture</Button>}
      </section>}
      <Button variant="ghost" size="sm" onClick={refresh}>Refresh tournament data</Button>
    </CardContent>
  </Card>;
}
