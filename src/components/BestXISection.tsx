import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Shield, Swords, Star, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerStat {
  id: string;
  player_id: string;
  player_name: string;
  team_name: string | null;
  image_url: string | null;
  matches_batted: number;
  total_runs: number;
  balls_faced: number;
  highest_score: number;
  fifties: number;
  hundreds: number;
  fours: number;
  sixes: number;
  not_outs: number;
  matches_bowled: number;
  total_wickets: number;
  balls_bowled: number;
  runs_conceded: number;
  best_bowling_wickets: number;
  best_bowling_runs: number;
  maidens: number;
}

interface RankedPlayer extends PlayerStat {
  role: "Batsman" | "Bowler" | "All-Rounder";
  rating: number;
  battingOrder: number;
}

const calcAvg = (r: number, m: number, no: number) => {
  const inn = m - no;
  return inn <= 0 ? r : r / inn;
};
const calcSR = (r: number, b: number) => (b === 0 ? 0 : (r / b) * 100);
const calcBowlAvg = (r: number, w: number) => (w === 0 ? 999 : r / w);
const calcEcon = (r: number, b: number) => (b === 0 ? 99 : (r / b) * 6);

function classifyRole(p: PlayerStat): "Batsman" | "Bowler" | "All-Rounder" {
  const hasBat = p.total_runs > 30 || p.matches_batted > 2;
  const hasBowl = p.total_wickets > 3 || p.matches_bowled > 2;
  if (hasBat && hasBowl) return "All-Rounder";
  if (hasBowl) return "Bowler";
  return "Batsman";
}

function rateBatsman(p: PlayerStat): number {
  const avg = calcAvg(p.total_runs, p.matches_batted, p.not_outs);
  const sr = calcSR(p.total_runs, p.balls_faced);
  const matches = Math.max(p.matches_batted, 1);
  return (
    p.total_runs * 1.0 +
    avg * 15 +
    sr * 2 +
    p.hundreds * 50 +
    p.fifties * 20 +
    p.sixes * 3 +
    p.fours * 1.5 +
    matches * 5
  );
}

function rateBowler(p: PlayerStat): number {
  const avg = calcBowlAvg(p.runs_conceded, p.total_wickets);
  const econ = calcEcon(p.runs_conceded, p.balls_bowled);
  const matches = Math.max(p.matches_bowled, 1);
  return (
    p.total_wickets * 30 +
    (avg < 999 ? (30 - Math.min(avg, 30)) * 10 : 0) +
    (econ < 99 ? (12 - Math.min(econ, 12)) * 8 : 0) +
    p.best_bowling_wickets * 25 +
    p.maidens * 15 +
    matches * 5
  );
}

function rateAllRounder(p: PlayerStat): number {
  return rateBatsman(p) * 0.5 + rateBowler(p) * 0.5;
}

function selectBestXI(players: PlayerStat[]): { playing: RankedPlayer[]; substitutes: RankedPlayer[] } {
  if (players.length === 0) return { playing: [], substitutes: [] };

  const classified = players.map((p) => {
    const role = classifyRole(p);
    let rating = 0;
    if (role === "Batsman") rating = rateBatsman(p);
    else if (role === "Bowler") rating = rateBowler(p);
    else rating = rateAllRounder(p);
    return { ...p, role, rating, battingOrder: 0 } as RankedPlayer;
  });

  const batsmen = classified.filter((p) => p.role === "Batsman").sort((a, b) => b.rating - a.rating);
  const bowlers = classified.filter((p) => p.role === "Bowler").sort((a, b) => b.rating - a.rating);
  const allRounders = classified.filter((p) => p.role === "All-Rounder").sort((a, b) => b.rating - a.rating);

  // Pick: 5 batsmen, 3 all-rounders, 3 bowlers (flexible)
  const picked: RankedPlayer[] = [];
  const usedIds = new Set<string>();

  const pick = (list: RankedPlayer[], count: number) => {
    let added = 0;
    for (const p of list) {
      if (added >= count) break;
      if (!usedIds.has(p.player_name.toLowerCase())) {
        usedIds.add(p.player_name.toLowerCase());
        picked.push(p);
        added++;
      }
    }
    return added;
  };

  const batPicked = pick(batsmen, 5);
  const arPicked = pick(allRounders, 3);
  const bowlPicked = pick(bowlers, 3);

  // Fill remaining slots to reach 11
  const remaining = 11 - picked.length;
  if (remaining > 0) {
    const all = [...batsmen, ...allRounders, ...bowlers]
      .filter((p) => !usedIds.has(p.player_name.toLowerCase()))
      .sort((a, b) => b.rating - a.rating);
    pick(all, remaining);
  }

  // Assign batting order
  const sortedPlaying = [...picked];
  // Batsmen first (sorted by avg/runs), then all-rounders, then bowlers
  const batsInXI = sortedPlaying.filter((p) => p.role === "Batsman").sort((a, b) => {
    const avgA = calcAvg(a.total_runs, a.matches_batted, a.not_outs);
    const avgB = calcAvg(b.total_runs, b.matches_batted, b.not_outs);
    // Higher SR openers, higher avg middle order
    const srA = calcSR(a.total_runs, a.balls_faced);
    const srB = calcSR(b.total_runs, b.balls_faced);
    return srB - srA; // Aggressive batters at top
  });
  const arsInXI = sortedPlaying.filter((p) => p.role === "All-Rounder").sort((a, b) => b.total_runs - a.total_runs);
  const bowlsInXI = sortedPlaying.filter((p) => p.role === "Bowler").sort((a, b) => b.rating - a.rating);

  const ordered = [...batsInXI, ...arsInXI, ...bowlsInXI];
  ordered.forEach((p, i) => (p.battingOrder = i + 1));

  // Substitutes: next best 5 not in XI
  const subs: RankedPlayer[] = [];
  const allSorted = classified
    .filter((p) => !usedIds.has(p.player_name.toLowerCase()))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  allSorted.forEach((p, i) => {
    p.battingOrder = 12 + i;
    subs.push(p);
  });

  return { playing: ordered, substitutes: subs };
}

const ROLE_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  Batsman: { bg: "bg-primary/15", text: "text-primary", icon: Swords },
  Bowler: { bg: "bg-destructive/15", text: "text-destructive", icon: Shield },
  "All-Rounder": { bg: "bg-accent/50", text: "text-accent-foreground", icon: Star },
};

function PlayerSlot({ player, index, isSub }: { player: RankedPlayer; index: number; isSub?: boolean }) {
  const navigate = useNavigate();
  const style = ROLE_STYLES[player.role];
  const Icon = style.icon;
  const avg = calcAvg(player.total_runs, player.matches_batted, player.not_outs);
  const sr = calcSR(player.total_runs, player.balls_faced);
  const matches = Math.max(player.matches_batted, player.matches_bowled);

  return (
    <div
      onClick={() => navigate(`/player/${player.player_id}`)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group",
        isSub
          ? "bg-muted/30 hover:bg-muted/60 border border-dashed border-border/40"
          : index < 3
          ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/40"
          : "bg-card/60 hover:bg-muted/50 border border-border/20 hover:border-border"
      )}
    >
      <span className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
        isSub ? "bg-muted text-muted-foreground" : index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white" : "bg-primary/20 text-primary"
      )}>
        {player.battingOrder}
      </span>

      <Avatar className={cn("h-9 w-9 border-2 flex-shrink-0", index === 0 && !isSub ? "border-yellow-500" : "border-border/30")}>
        <AvatarImage src={player.image_url || undefined} />
        <AvatarFallback className="bg-primary/10"><User className="h-4 w-4 text-primary" /></AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{player.player_name}</p>
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4", style.bg, style.text)}>
          <Icon className="h-2.5 w-2.5 mr-0.5" />{player.role}
        </Badge>
      </div>

      <div className="hidden sm:flex items-center gap-3">
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-[9px] text-muted-foreground">MAT</span>
          <span className="font-bold text-xs">{matches}</span>
        </div>
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-[9px] text-muted-foreground">RUNS</span>
          <span className="font-bold text-xs">{player.total_runs}</span>
        </div>
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-[9px] text-muted-foreground">AVG</span>
          <span className="font-bold text-xs">{avg > 0 ? avg.toFixed(1) : "-"}</span>
        </div>
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-[9px] text-muted-foreground">SR</span>
          <span className="font-bold text-xs">{sr > 0 ? sr.toFixed(1) : "-"}</span>
        </div>
        {(player.role === "Bowler" || player.role === "All-Rounder") && (
          <div className="flex flex-col items-center min-w-[40px]">
            <span className="text-[9px] text-muted-foreground">WKT</span>
            <span className="font-bold text-xs">{player.total_wickets}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BestXISection({ battingLeaderboard, bowlingLeaderboard }: {
  battingLeaderboard: PlayerStat[];
  bowlingLeaderboard: PlayerStat[];
}) {
  const allPlayers = useMemo(() => {
    const map = new Map<string, PlayerStat>();
    for (const p of [...battingLeaderboard, ...bowlingLeaderboard]) {
      const key = p.player_name.toLowerCase().trim();
      if (!map.has(key)) map.set(key, p);
    }
    return Array.from(map.values());
  }, [battingLeaderboard, bowlingLeaderboard]);

  const { playing, substitutes } = useMemo(() => selectBestXI(allPlayers), [allPlayers]);

  if (playing.length === 0) {
    return (
      <Card className="stadium-card">
        <CardContent className="py-16 text-center text-muted-foreground">
          <Trophy className="h-16 w-16 opacity-20 mx-auto mb-3" />
          <p className="font-bold">Play some matches to generate the Best XI</p>
        </CardContent>
      </Card>
    );
  }

  const batCount = playing.filter((p) => p.role === "Batsman").length;
  const bowlCount = playing.filter((p) => p.role === "Bowler").length;
  const arCount = playing.filter((p) => p.role === "All-Rounder").length;

  return (
    <Card className="stadium-card overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-5 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Best XI of All Time</h3>
              <p className="text-xs text-muted-foreground">
                {batCount} Batsmen · {arCount} All-Rounders · {bowlCount} Bowlers
              </p>
            </div>
          </div>
        </div>

        {/* Playing XI */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">Playing XI</span>
          </div>
          {playing.map((p, i) => (
            <PlayerSlot key={p.player_id + i} player={p} index={i} />
          ))}
        </div>

        {/* Substitutes */}
        {substitutes.length > 0 && (
          <div className="p-4 pt-0 space-y-2">
            <div className="flex items-center gap-2 mb-3 mt-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground">Substitutes</span>
            </div>
            {substitutes.map((p, i) => (
              <PlayerSlot key={p.player_id + i} player={p} index={i} isSub />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}