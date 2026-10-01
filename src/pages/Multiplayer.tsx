import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, LogOut, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMultiplayerRoom } from "@/hooks/useMultiplayerRoom";
import MultiplayerAuth from "@/components/multiplayer/MultiplayerAuth";
import MultiplayerHome from "@/components/multiplayer/MultiplayerHome";
import MultiplayerLobby from "@/components/multiplayer/MultiplayerLobby";
import MultiplayerMatch from "@/components/multiplayer/MultiplayerMatch";
import ActivityFeed from "@/components/multiplayer/ActivityFeed";
import { rpc } from "@/lib/mpApi";
import { toast } from "@/hooks/use-toast";

export default function Multiplayer() {
  const { roomId } = useParams();
  const { user, loading, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Single-player</Link></Button>
          <h1 className="text-2xl font-bold flex-1">Multiplayer</h1>
          {user && <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-1" />Sign out</Button>}
        </div>
        {loading ? null : !user ? <MultiplayerAuth /> : roomId ? <RoomView roomId={roomId} userId={user.id} /> : <MultiplayerHome email={user.email ?? "player"} />}
      </main>
    </div>
  );
}

function RoomView({ roomId, userId }: { roomId: string; userId: string }) {
  const nav = useNavigate();
  const r = useMultiplayerRoom(roomId, userId);
  if (r.loading) return <p className="text-muted-foreground">Loading room…</p>;
  if (r.error || !r.room) return <div className="space-y-3"><p>{r.error ?? "Room unavailable."}</p><Button onClick={() => nav("/multiplayer")}>Back</Button></div>;
  const me = r.members.find((m) => m.user_id === userId);
  if (!me) return <p>You are not in this room.</p>;
  const isHost = r.room.host_user_id === userId;
  const teamName = (s: string) => (s === "A" ? r.room!.team_a?.name : r.room!.team_b?.name) ?? `Team ${s}`;
  const inLobby = r.room.status === "lobby" || r.room.status === "ready" || !r.state;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="font-mono text-base tracking-widest">{r.room.code}</Badge>
        <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(r.room!.code); toast({ title: "Code copied" }); }}><Copy className="h-4 w-4" /></Button>
        <Badge variant="secondary">{r.room.status.replace("_", " ")}</Badge>
        <Badge variant={r.conn === "live" ? "default" : "destructive"} className="gap-1">{r.conn === "live" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}{r.conn}</Badge>
        <span className="text-sm text-muted-foreground">{r.online.size} online</span>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={async () => { if (await rpc("mp_leave_room", { p_room: roomId })) nav("/multiplayer"); }}>Leave room</Button>
      </div>
      <div className="grid xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          {inLobby
            ? <MultiplayerLobby room={r.room} members={r.members} me={me} isHost={isHost} online={r.online} version={r.version} />
            : <MultiplayerMatch room={r.room} state={r.state!} version={r.version} me={me} isHost={isHost} decisions={r.decisions} myDecisions={r.myDecisions} online={r.online} members={r.members} />}
        </div>
        <ActivityFeed events={r.events} teamName={teamName} />
      </div>
    </div>
  );
}
