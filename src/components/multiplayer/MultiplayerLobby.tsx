import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PLAYER_DATABASE } from "@/data/playerDatabase";
import { rpc, engine } from "@/lib/mpApi";
import type { Member, Room, Side } from "@/types/multiplayer";

interface Props { room: Room; members: Member[]; me: Member; isHost: boolean; online: Set<string>; version: number }

export default function MultiplayerLobby({ room, members, me, isHost, online, version }: Props) {
  const [busy, setBusy] = useState(false);
  const owners = { A: members.find((m) => m.team_side === "A"), B: members.find((m) => m.team_side === "B") };
  const teamName = (s: Side) => (s === "A" ? room.team_a?.name : room.team_b?.name) ?? `Team ${s}`;

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
          <p><b>A:</b> {room.team_a ? `${room.team_a.name} (${room.team_a.squad.length})` : "squad not built"} · {owners.A?.display_name ?? "no owner"}{room.setups.A && " · XI locked"}</p>
          <p><b>B:</b> {room.team_b ? `${room.team_b.name} (${room.team_b.squad.length})` : "squad not built"} · {owners.B?.display_name ?? "no owner"}{room.setups.B && " · XI locked"}</p>
          <p className="text-muted-foreground">Each team owner builds their own squad from the player database.</p>
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
  const [editing, setEditing] = useState(false);
  if (!team || editing) return <SquadBuilder room={room} initial={team ?? null} onDone={() => { setEditing(false); setXi([]); setImpact([]); }} />;
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
        <Button variant="ghost" className="mt-4 ml-2" onClick={() => setEditing(true)}>Edit squad</Button>
      </CardContent>
    </Card>
  );
}

const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);

function SquadBuilder({ room, initial, onDone }: { room: Room; initial: Room["team_a"]; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [picked, setPicked] = useState<string[]>(initial?.squad.map((p) => p.name) ?? []);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const byName = new Map(PLAYER_DATABASE.map((p) => [p.name, p]));
  const overseas = picked.filter((n) => byName.get(n)?.isOverseas).length;
  const list = PLAYER_DATABASE.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 120);
  const toggle = (n: string) => {
    if (picked.includes(n)) return setPicked(picked.filter((x) => x !== n));
    if (picked.length >= 25) return;
    if (byName.get(n)?.isOverseas && overseas >= 8) return;
    setPicked([...picked, n]);
  };
  const valid = name.trim().length > 0 && picked.length >= 18 && picked.length <= 25 && overseas <= 8;
  const save = async () => {
    setBusy(true);
    const squad = picked.map((n) => { const p = byName.get(n)!; return { id: slug(p.name), name: p.name, batSkill: p.batSkill, bowlSkill: p.bowlSkill, isOverseas: p.isOverseas, imageUrl: p.imageUrl }; });
    const ok = await rpc("mp_set_my_squad", { p_room: room.id, p_team: { name: name.trim().slice(0, 60), squad } });
    setBusy(false);
    if (ok) onDone();
  };
  return (
    <Card className="lg:col-span-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Build your squad</CardTitle>
        <p className="text-sm text-muted-foreground">Players {picked.length}/25 (min 18) · Overseas {overseas}/8</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-2">
          <Input placeholder="Team name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Search players…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {picked.length > 0 && <div className="flex flex-wrap gap-1">{picked.map((n) => <Badge key={n} variant="secondary" className="cursor-pointer" onClick={() => toggle(n)}>{n} ×</Badge>)}</div>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
          {list.map((p) => (
            <label key={p.name} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm cursor-pointer">
              <Checkbox checked={picked.includes(p.name)} onCheckedChange={() => toggle(p.name)} />
              <span className="flex-1 truncate">{p.name}{p.isOverseas && " ✈"}</span>
              <span className="text-xs text-muted-foreground">{p.role} · {p.batSkill}/{p.bowlSkill}</span>
            </label>
          ))}
        </div>
        <Button disabled={!valid || busy} onClick={save}>Save squad</Button>
      </CardContent>
    </Card>
  );
}
