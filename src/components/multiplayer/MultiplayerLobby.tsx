import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCricketStore } from "@/hooks/useCricketStore";
import { rpc, engine } from "@/lib/mpApi";
import type { Member, MPTeam, Room, Side } from "@/types/multiplayer";

interface Props { room: Room; members: Member[]; me: Member; isHost: boolean; online: Set<string>; version: number }

export default function MultiplayerLobby({ room, members, me, isHost, online, version }: Props) {
  const teams = useCricketStore((s) => s.teams).filter((t) => t.squad.length >= 11);
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [busy, setBusy] = useState(false);
  const owners = { A: members.find((m) => m.team_side === "A"), B: members.find((m) => m.team_side === "B") };
  const teamName = (s: Side) => (s === "A" ? room.team_a?.name : room.team_b?.name) ?? `Team ${s}`;

  const toMP = (id: string): MPTeam | null => {
    const t = teams.find((x) => x.id === id);
    if (!t) return null;
    return { name: t.name.slice(0, 60), squad: t.squad.slice(0, 40).map((p) => ({ id: p.id, name: p.name, batSkill: p.batSkill, bowlSkill: p.bowlSkill, isOverseas: p.isOverseas, imageUrl: p.imageUrl })) };
  };

  const canStart = owners.A?.ready && owners.B?.ready && room.setups.A && room.setups.B;

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-muted/30">
              <span className={`h-2 w-2 rounded-full ${online.has(m.user_id) ? "bg-primary" : "bg-muted-foreground/40"}`} />
              <span className="font-medium">{m.display_name}{m.user_id === me.user_id && " (you)"}</span>
              {m.user_id === room.host_user_id && <Badge>Host</Badge>}
              <Badge variant="outline">{m.role === "team_owner" ? `Owner · ${teamName(m.team_side!)}` : m.role}</Badge>
              {m.role === "team_owner" && <Badge variant={m.ready ? "default" : "secondary"}>{m.ready ? "Ready" : "Setting up"}</Badge>}
              {isHost && (
                <div className="ml-auto flex flex-wrap gap-1">
                  <Select value={m.role === "team_owner" ? `owner_${m.team_side}` : m.role}
                    onValueChange={(v) => v.startsWith("owner_") ? rpc("mp_assign_member", { p_room: room.id, p_user: m.user_id, p_role: "team_owner", p_side: v.slice(6) }) : rpc("mp_assign_member", { p_room: room.id, p_user: m.user_id, p_role: v })}>
                    <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner_A">Owner: {teamName("A")}</SelectItem>
                      <SelectItem value="owner_B">Owner: {teamName("B")}</SelectItem>
                      <SelectItem value="spectator">Spectator</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                  {m.user_id !== me.user_id && <>
                    <Button size="sm" variant="ghost" onClick={() => rpc("mp_transfer_host", { p_room: room.id, p_user: m.user_id })}>Make host</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => rpc("mp_kick_member", { p_room: room.id, p_user: m.user_id })}>Kick</Button>
                  </>}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Teams</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p><b>A:</b> {room.team_a?.name ?? "—"} · {owners.A?.display_name ?? "no owner"}</p>
          <p><b>B:</b> {room.team_b?.name ?? "—"} · {owners.B?.display_name ?? "no owner"}</p>
          {isHost && (
            teams.length < 2 ? <p className="text-muted-foreground">Create at least two teams (11+ players) in the Teams tab first.</p> : <>
              <Select value={a} onValueChange={setA}><SelectTrigger><SelectValue placeholder="Team A" /></SelectTrigger>
                <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
              <Select value={b} onValueChange={setB}><SelectTrigger><SelectValue placeholder="Team B" /></SelectTrigger>
                <SelectContent>{teams.filter((t) => t.id !== a).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
              <Button variant="secondary" className="w-full" disabled={!a || !b || a === b} onClick={() => rpc("mp_set_teams", { p_room: room.id, p_team_a: toMP(a), p_team_b: toMP(b) })}>Set teams</Button>
            </>
          )}
          {isHost && (
            <Button className="w-full" disabled={!canStart || busy} onClick={async () => { setBusy(true); await engine("start", room.id, version); setBusy(false); }}>
              Start match
            </Button>
          )}
          {!isHost && <p className="text-muted-foreground">Waiting for the host to start.</p>}
        </CardContent>
      </Card>

      {me.role === "team_owner" && me.team_side && <TeamSetup room={room} side={me.team_side} />}
    </div>
  );
}

function TeamSetup({ room, side }: { room: Room; side: Side }) {
  const team = side === "A" ? room.team_a : room.team_b;
  const existing = room.setups[side];
  const [xi, setXi] = useState<string[]>(existing?.xi ?? []);
  const [impact, setImpact] = useState<string[]>(existing?.impact ?? []);
  if (!team) return <Card className="lg:col-span-3"><CardContent className="pt-6 text-muted-foreground">You control Team {side}. Waiting for the host to pick teams.</CardContent></Card>;
  const overseas = team.squad.filter((p) => xi.includes(p.id) && p.isOverseas).length;
  const toggle = (id: string, list: string[], set: (v: string[]) => void, max: number) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : list.length < max ? [...list, id] : list);

  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">You control {team.name} — pick your XI (batting order = pick order) and up to 4 impact players</CardTitle>
        <p className="text-sm text-muted-foreground">XI {xi.length}/11 · Overseas {overseas}/4 · Impact {impact.length}/4</p>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {team.squad.map((p) => {
            const pos = xi.indexOf(p.id);
            return (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm">
                <Checkbox checked={pos >= 0} disabled={impact.includes(p.id)} onCheckedChange={() => toggle(p.id, xi, setXi, 11)} />
                <span className="w-5 text-muted-foreground">{pos >= 0 ? pos + 1 : ""}</span>
                <span className="flex-1 truncate">{p.name}{p.isOverseas && " ✈"}</span>
                <span className="text-xs text-muted-foreground">{p.batSkill}/{p.bowlSkill}</span>
                <Button size="sm" variant={impact.includes(p.id) ? "default" : "ghost"} className="h-6 px-2 text-xs" disabled={pos >= 0} onClick={() => toggle(p.id, impact, setImpact, 4)}>IP</Button>
              </div>
            );
          })}
        </div>
        <Button className="mt-4" disabled={xi.length !== 11 || overseas > 4} onClick={() => rpc("mp_submit_team_setup", { p_room: room.id, p_xi: xi, p_impact: impact })}>
          Lock in team
        </Button>
      </CardContent>
    </Card>
  );
}
