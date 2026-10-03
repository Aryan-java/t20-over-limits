import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { rpc, engine } from "@/lib/mpApi";
import { defaultBowlingStrategy } from "@/types/tactics";
import { bowlerError, otherSide, oversStr, type Delivery, type DecisionStatus, type FieldPreset, type MatchState, type Member, type Room, type Side } from "@/types/multiplayer";

interface Props { room: Room; state: MatchState; version: number; me: Member; isHost: boolean; decisions: DecisionStatus | null; myDecisions: { kind: string; version: number; payload: any }[]; online: Set<string>; members: Member[] }

export default function MultiplayerMatch({ room, state, version, me, isHost, decisions, myDecisions, online, members }: Props) {
  const inn = state.innings[state.current];
  const batSide = inn.battingSide; const bowlSide = otherSide(batSide);
  const mySide = me.role === "team_owner" ? me.team_side : null;
  const names = useMemo(() => {
    const m: Record<string, string> = {};
    [...(room.team_a?.squad ?? []), ...(room.team_b?.squad ?? [])].forEach((p) => (m[p.id] = p.name));
    return m;
  }, [room]);
  const teamName = (s: Side) => (s === "A" ? room.team_a?.name : room.team_b?.name) ?? s;
  const live = room.status === "live";
  const bothIn = !!decisions && decisions.version === version && decisions.batting && decisions.bowling;
  const bowlOwner = members.find((m) => m.team_side === bowlSide);
  const bowlOnline = bowlOwner ? online.has(bowlOwner.user_id) : false;
  const [busy, setBusy] = useState(false);

  // Auto-pause if the bowling owner goes offline (host's client triggers it, server re-checks permission).
  useEffect(() => {
    if (!isHost || !live || !bowlOwner || bowlOnline || bowlOwner.user_id === me.user_id) return;
    const t = setTimeout(() => rpc("mp_set_paused", { p_room: room.id, p_paused: true }), 15000);
    return () => clearTimeout(t);
  }, [isHost, live, bowlOwner, bowlOnline, room.id, me.user_id]);

  const play = async () => { setBusy(true); await engine("play", room.id, version); setBusy(false); };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardContent className="pt-6 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            {mySide ? <Badge>You control {teamName(mySide)}</Badge> : <Badge variant="secondary">Spectating</Badge>}
            {mySide && <Badge variant="outline">Opponent: {teamName(otherSide(mySide))}</Badge>}
            <Badge variant="outline">Innings {state.current + 1}</Badge>
            {room.status === "paused" && <Badge variant="destructive">Paused</Badge>}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{teamName(batSide)} batting</p>
            <p className="text-4xl font-bold">{inn.runs}/{inn.wickets} <span className="text-lg text-muted-foreground">({oversStr(inn.balls)}/{state.overs})</span></p>
            {inn.target && <p className="text-sm">Target {inn.target} · need {Math.max(0, inn.target - inn.runs)} from {state.overs * 6 - inn.balls}</p>}
            {state.current === 1 && <p className="text-xs text-muted-foreground">{teamName(state.innings[0].battingSide)}: {state.innings[0].runs}/{state.innings[0].wickets}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[inn.striker, inn.nonStriker].filter(Boolean).map((id, i) => {
              const l = inn.batters[id!];
              return <div key={id} className="p-2 rounded bg-muted/30">{names[id!]}{i === 0 && " *"} — {l?.runs ?? 0} ({l?.balls ?? 0})</div>;
            })}
          </div>
          {inn.currentBowler && <p className="text-sm">Bowler: {names[inn.currentBowler]} {inn.bowlers[inn.currentBowler] && `${inn.bowlers[inn.currentBowler].wickets}-${inn.bowlers[inn.currentBowler].runs} (${oversStr(inn.bowlers[inn.currentBowler].balls)})`}</p>}
          {state.lastBall && <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 animate-card-enter"><b>{state.lastBall.over}</b> {state.lastBall.text}</div>}
          <div className="flex gap-1 flex-wrap">{inn.recent.slice(-12).map((b) => <span key={b.n} className={`text-xs px-2 py-1 rounded ${b.wicket ? "bg-destructive text-destructive-foreground" : b.runs >= 4 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{b.wicket ? "W" : b.extra === "wide" ? "wd" : b.runs}</span>)}</div>
          {state.result && <div className="p-4 rounded-lg bg-accent/20 text-lg font-bold text-center">{state.result.text}</div>}

          {!state.result && (
            <div className="pt-2 space-y-2">
              <p className="text-sm text-muted-foreground">
                Batting plan: {decisions?.batting ? "locked ✓" : `waiting for ${teamName(batSide)}`} · Bowling plan: {decisions?.bowling ? "locked ✓" : `waiting for ${teamName(bowlSide)}`}
              </p>
              {mySide === bowlSide ? (
                <Button size="lg" className="w-full h-14 text-lg font-bold" disabled={!live || !bothIn || busy} onClick={play}>PLAY NEXT BALL</Button>
              ) : (
                <p className="text-sm text-center p-3 rounded bg-muted/30">Only the bowling team ({teamName(bowlSide)}) can play the next ball{bowlOwner && !bowlOnline ? " — they are offline" : ""}.</p>
              )}
              {(isHost || mySide) && (
                <Button variant="outline" size="sm" onClick={() => rpc("mp_set_paused", { p_room: room.id, p_paused: room.status !== "paused" })}>
                  {room.status === "paused" ? "Resume" : "Pause"}
                </Button>
              )}
              {isHost && room.status === "paused" && (
                <Button variant="destructive" size="sm" className="ml-2" disabled={!bothIn || busy}
                  onClick={async () => { setBusy(true); await engine("override_play", room.id, version); setBusy(false); }}>
                  Host override: play one ball
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {mySide && !state.result && (
        mySide === batSide
          ? <BattingPanel key={`bat-${version}`} roomId={room.id} version={version} live={live} prev={myDecisions.find((d) => d.kind === "batting")?.payload} />
          : <BowlingPanel key={`bowl-${version}`} room={room} state={state} version={version} live={live} names={names} prev={myDecisions.find((d) => d.kind === "bowling")?.payload} />
      )}
    </div>
  );
}

function BattingPanel({ roomId, version, live, prev }: { roomId: string; version: number; live: boolean; prev?: any }) {
  const [agg, setAgg] = useState<number>(prev?.aggression ?? 50);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Batting plan (private)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm"><span>Defend</span><b>{agg}</b><span>Attack</span></div>
        <Slider value={[agg]} min={0} max={100} step={5} onValueChange={(v) => setAgg(v[0])} />
        <Button className="w-full" disabled={!live} onClick={() => rpc("mp_submit_decision", { p_room: roomId, p_kind: "batting", p_payload: { aggression: agg }, p_expected_version: version })}>Lock in</Button>
      </CardContent>
    </Card>
  );
}

const DELIVERIES: Delivery[] = ["normal", "yorker", "bouncer", "slower", "knuckle"];

function BowlingPanel({ room, state, version, live, names, prev }: { room: Room; state: MatchState; version: number; live: boolean; names: Record<string, string>; prev?: any }) {
  const inn = state.innings[state.current];
  const side = otherSide(inn.battingSide);
  const xi = room.setups[side]?.xi ?? [];
  const eligible = xi.filter((id) => !bowlerError(inn, state.overs, id, xi));
  const [field, setField] = useState<FieldPreset>(prev?.field ?? "balanced");
  const [bowler, setBowler] = useState<string>(prev?.bowlerId && eligible.includes(prev.bowlerId) ? prev.bowlerId : inn.balls % 6 !== 0 && inn.currentBowler ? inn.currentBowler : "");
  const [strat, setStrat] = useState<Record<Delivery, number>>(prev?.strategy ?? { ...defaultBowlingStrategy });
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Bowling plan (private)</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Select value={bowler} onValueChange={setBowler}>
          <SelectTrigger><SelectValue placeholder="Choose bowler" /></SelectTrigger>
          <SelectContent>{eligible.map((id) => <SelectItem key={id} value={id}>{names[id]}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={field} onValueChange={(v) => setField(v as FieldPreset)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{(["attacking", "balanced", "defensive", "death"] as FieldPreset[]).map((f) => <SelectItem key={f} value={f}>{f} field</SelectItem>)}</SelectContent>
        </Select>
        {DELIVERIES.map((d) => (
          <div key={d} className="text-sm">
            <div className="flex justify-between"><span className="capitalize">{d}</span><span>{strat[d]}</span></div>
            <Slider value={[strat[d]]} min={0} max={100} step={5} onValueChange={(v) => setStrat({ ...strat, [d]: v[0] })} />
          </div>
        ))}
        <Button className="w-full" disabled={!live || !bowler} onClick={() => rpc("mp_submit_decision", { p_room: room.id, p_kind: "bowling", p_payload: { field, bowlerId: bowler, strategy: strat }, p_expected_version: version })}>Lock in</Button>
      </CardContent>
    </Card>
  );
}
