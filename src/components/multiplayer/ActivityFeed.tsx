import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RoomEvent } from "@/types/multiplayer";

function describe(e: RoomEvent, teamName: (s: string) => string): string {
  const p = e.payload ?? {};
  switch (e.type) {
    case "room_created": return `${p.name} created the room`;
    case "member_joined": return `${p.name} joined`;
    case "member_left": return `A member left`;
    case "member_kicked": return `${p.name} was removed`;
    case "member_assigned": return p.role === "team_owner" ? `${p.name} now controls ${teamName(p.side)}` : `${p.name} is now ${p.role}`;
    case "host_transferred": return `${p.name} is now host`;
    case "teams_selected": return `Teams: ${p.A} vs ${p.B}`;
    case "team_ready": return `${teamName(p.side)} locked in their XI`;
    case "match_started": return `Match started — ${teamName(p.tossWinner)} won the toss and chose to ${p.decision}`;
    case "decision_submitted": return `${teamName(p.side)} locked in ${p.kind} plan`;
    case "ball_played": return p.ball?.text ? `${p.ball.over}: ${p.ball.text}` : "Ball played";
    case "match_completed": return p.result?.text ?? "Match completed";
    case "paused": return "Match paused";
    case "resumed": return "Match resumed";
    default: return e.type.replace(/_/g, " ");
  }
}

export default function ActivityFeed({ events, teamName }: { events: RoomEvent[]; teamName: (s: string) => string }) {
  const list = [...events].reverse();
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Activity</CardTitle></CardHeader>
      <CardContent>
        <ScrollArea className="h-72 pr-2">
          <ul className="space-y-1.5 text-sm">
            {list.map((e) => (
              <li key={e.id} className="flex gap-2">
                <span className="text-muted-foreground text-xs shrink-0 pt-0.5">{new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span>{describe(e, teamName)}</span>
              </li>
            ))}
            {!list.length && <li className="text-muted-foreground">Nothing yet.</li>}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
