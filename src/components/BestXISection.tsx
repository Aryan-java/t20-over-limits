import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAllTimeStats } from "@/hooks/useAllTimeStats";
import { playerDatabase } from "@/data/playerDatabase";
import { User, Trophy, Shield, Swords, Star, Crown, Loader2 } from "lucide-react";
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

type Role = "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper";

interface RankedPlayer extends PlayerStat {
  role: Role;
  rating: number;
  battingOrder: number;
  dbRole?: string;
}

// Build a lookup from playerDatabase for role/skills
const DB_LOOKUP = new Map<string, { role: string; batSkill: number; bowlSkill: number }>();
playerDatabase.forEach((p) => {
  DB_LOOKUP.set(p.name.toLowerCase().trim(), { role: p.role, batSkill: p.batSkill, bowlSkill: p.bowlSkill });
});

function getRole(p: PlayerStat): Role {
  const db = DB_LOOKUP.get(p.player_name.toLowerCase().trim());
  if (db) {
    if (db.role === "Wicket-keeper") return "Wicket-Keeper";
    if (db.role === "All-rounder") return "All-Rounder";
    if (db.role === "Bowler") return "Bowler";
    return "Batsman";
  }
  // Fallback from stats
  const hasBat = p.total_runs > 50 || p.matches_batted > 3;
  const hasBowl = p.total_wickets > 5 || p.matches_bowled > 3;
  if (hasBat && hasBowl) return "All-Rounder";
  if (hasBowl) return "Bowler";
  return "Batsman";
}

function getBatSkill(name: string): number {
  return DB_LOOKUP.get(name.toLowerCase().trim())?.batSkill ?? 50;
}
function getBowlSkill(name: string): number {
  return DB_LOOKUP.get(name.toLowerCase().trim())?.bowlSkill ?? 50;
}

const calcAvg = (r: number, m: number, no: number) => { const inn = m - no; return inn <= 0 ? r : r / inn; };
const calcSR = (r: number, b: number) => (b === 0 ? 0 : (r / b) * 100);

function rateBatsman(p: PlayerStat): number {
  const avg = calcAvg(p.total_runs, p.matches_batted, p.not_outs);
  const sr = calcSR(p.total_runs, p.balls_faced);
  const skill = getBatSkill(p.player_name);
  return (
    p.total_runs * 1.2 +
    avg * 20 +
    sr * 3 +
    p.hundreds * 80 +
    p.fifties * 30 +
    p.sixes * 4 +
    p.fours * 2 +
    skill * 5 +
    p.matches_batted * 3
  );
}

function rateBowler(p: PlayerStat): number {
  const wickets = p.total_wickets;
  const avg = wickets > 0 ? p.runs_conceded / wickets : 999;
  const econ = p.balls_bowled > 0 ? (p.runs_conceded / p.balls_bowled) * 6 : 99;
  const skill = getBowlSkill(p.player_name);
  return (
    wickets * 40 +
    (avg < 999 ? (35 - Math.min(avg, 35)) * 12 : 0) +
    (econ < 99 ? (12 - Math.min(econ, 12)) * 10 : 0) +
    p.best_bowling_wickets * 30 +
    p.maidens * 20 +
    skill * 5 +
    p.matches_bowled * 3
  );
}

function rateAllRounder(p: PlayerStat): number {
  return rateBatsman(p) * 0.45 + rateBowler(p) * 0.55;
}

function selectBestXI(players: PlayerStat[]): { playing: RankedPlayer[]; substitutes: RankedPlayer[] } {
  if (players.length === 0) return { playing: [], substitutes: [] };

  const classified = players.map((p) => {
    const role = getRole(p);
    let rating = 0;
    if (role === "Batsman" || role === "Wicket-Keeper") rating = rateBatsman(p);
    else if (role === "Bowler") rating = rateBowler(p);
    else rating = rateAllRounder(p);
    return { ...p, role, rating, battingOrder: 0 } as RankedPlayer;
  });

  const batsmen = classified.filter((p) => p.role === "Batsman").sort((a, b) => b.rating - a.rating);
  const keepers = classified.filter((p) => p.role === "Wicket-Keeper").sort((a, b) => b.rating - a.rating);
  const bowlers = classified.filter((p) => p.role === "Bowler").sort((a, b) => b.rating - a.rating);
  const allRounders = classified.filter((p) => p.role === "All-Rounder").sort((a, b) => b.rating - a.rating);

  const picked: RankedPlayer[] = [];
  const usedNames = new Set<string>();

  const pick = (list: RankedPlayer[], count: number) => {
    let added = 0;
    for (const p of list) {
      if (added >= count) break;
      const key = p.player_name.toLowerCase().trim();
      if (!usedNames.has(key)) {
        usedNames.add(key);
        picked.push(p);
        added++;
      }
    }
    return added;
  };

  // Target: 4-5 batsmen, 1 keeper, 2-3 all-rounders, 3-4 bowlers
  pick(batsmen, 5);
  pick(keepers, 1);
  pick(allRounders, 2);
  pick(bowlers, 3);

  // Fill to 11
  const remaining = 11 - picked.length;
  if (remaining > 0) {
    const pool = [...batsmen, ...keepers, ...allRounders, ...bowlers]
      .filter((p) => !usedNames.has(p.player_name.toLowerCase().trim()))
      .sort((a, b) => b.rating - a.rating);
    pick(pool, remaining);
  }

  // Batting order: aggressive batsmen open, then middle order, keeper, all-rounders, bowlers
  const batsInXI = picked.filter((p) => p.role === "Batsman");
  const keepersInXI = picked.filter((p) => p.role === "Wicket-Keeper");
  const arsInXI = picked.filter((p) => p.role === "All-Rounder");
  const bowlsInXI = picked.filter((p) => p.role === "Bowler");

  // Sort batsmen: higher SR at top (openers), higher avg in middle
  batsInXI.sort((a, b) => {
    const srA = calcSR(a.total_runs, a.balls_faced);
    const srB = calcSR(b.total_runs, b.balls_faced);
    return srB - srA;
  });

  arsInXI.sort((a, b) => b.total_runs - a.total_runs);
  bowlsInXI.sort((a, b) => b.rating - a.rating);

  const ordered = [...batsInXI, ...keepersInXI, ...arsInXI, ...bowlsInXI];
  ordered.forEach((p, i) => (p.battingOrder = i + 1));

  // 5 Substitutes
  const subs = classified
    .filter((p) => !usedNames.has(p.player_name.toLowerCase().trim()))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  subs.forEach((p, i) => (p.battingOrder = 12 + i));

  return { playing: ordered, substitutes: subs };
}

const ROLE_COLORS: Record<string, string> = {
  Batsman: "bg-primary/15 text-primary",
  "Wicket-Keeper": "bg-primary/15 text-primary",
  Bowler: "bg-destructive/15 text-destructive",
  "All-Rounder": "bg-accent/50 text-accent-foreground",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  Batsman: Swords,
  "Wicket-Keeper": Shield,
  Bowler: Shield,
  "All-Rounder": Star,
};

function PlayerSlot({ player, index, isSub }: { player: RankedPlayer; index: number; isSub?: boolean }) {
  const navigate = useNavigate();
  const Icon = ROLE_ICONS[player.role] || Star;
  const colorCls = ROLE_COLORS[player.role] || "";
  const avg = calcAvg(player.total_runs, player.matches_batted, player.not_outs);
  const sr = calcSR(player.total_runs, player.balls_faced);
  const matches = Math.max(player.matches_batted, player.matches_bowled);

  return (
    <div
      onClick={() => navigate(`/player/${player.player_id}`)}
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 group",
        isSub
          ? "bg-muted/30 hover:bg-muted/60 border border-dashed border-border/40"
          : index < 3
          ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/40 shadow-sm"
          : "bg-card/60 hover:bg-muted/50 border border-border/20 hover:border-border"
      )}
    >
      <span className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
        isSub
          ? "bg-muted text-muted-foreground"
          : index === 0
          ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-md"
          : index < 3
          ? "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground"
          : "bg-primary/15 text-primary"
      )}>
        #{player.battingOrder}
      </span>

      <Avatar className={cn("h-10 w-10 border-2 flex-shrink-0", index === 0 && !isSub ? "border-yellow-500" : "border-border/30")}>
        <AvatarImage src={player.image_url || undefined} />
        <AvatarFallback className="bg-primary/10"><User className="h-4 w-4 text-primary" /></AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{player.player_name}</p>
        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 mt-0.5", colorCls)}>
          <Icon className="h-2.5 w-2.5 mr-0.5" />{player.role}
        </Badge>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        <div className="flex flex-col items-center min-w-[44px]">
          <span className="text-[9px] text-muted-foreground uppercase">Mat</span>
          <span className="font-bold text-sm">{matches}</span>
        </div>
        <div className="flex flex-col items-center min-w-[44px]">
          <span className="text-[9px] text-muted-foreground uppercase">Runs</span>
          <span className="font-bold text-sm">{player.total_runs}</span>
        </div>
        <div className="flex flex-col items-center min-w-[44px]">
          <span className="text-[9px] text-muted-foreground uppercase">Avg</span>
          <span className="font-bold text-sm">{avg > 0 ? avg.toFixed(1) : "-"}</span>
        </div>
        <div className="flex flex-col items-center min-w-[44px]">
          <span className="text-[9px] text-muted-foreground uppercase">SR</span>
          <span className="font-bold text-sm">{sr > 0 ? sr.toFixed(1) : "-"}</span>
        </div>
        {(player.role === "Bowler" || player.role === "All-Rounder") && (
          <div className="flex flex-col items-center min-w-[44px]">
            <span className="text-[9px] text-muted-foreground uppercase">Wkt</span>
            <span className="font-bold text-sm">{player.total_wickets}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BestXITab() {
  const { battingLeaderboard, bowlingLeaderboard, isLoading } = useAllTimeStats();

  const allPlayers = useMemo(() => {
    const map = new Map<string, PlayerStat>();
    for (const p of [...battingLeaderboard, ...bowlingLeaderboard]) {
      const key = p.player_name.toLowerCase().trim();
      if (!map.has(key)) map.set(key, p);
    }
    return Array.from(map.values());
  }, [battingLeaderboard, bowlingLeaderboard]);

  const { playing, substitutes } = useMemo(() => selectBestXI(allPlayers), [allPlayers]);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (playing.length === 0) {
    return (
      <Card className="stadium-card">
        <CardContent className="py-20 text-center text-muted-foreground">
          <Trophy className="h-16 w-16 opacity-20 mx-auto mb-3" />
          <p className="font-bold text-lg">Play some matches to generate the Best XI</p>
          <p className="text-sm mt-1">The dream team will be selected based on match performances</p>
        </CardContent>
      </Card>
    );
  }

  const batCount = playing.filter((p) => p.role === "Batsman").length;
  const keeperCount = playing.filter((p) => p.role === "Wicket-Keeper").length;
  const bowlCount = playing.filter((p) => p.role === "Bowler").length;
  const arCount = playing.filter((p) => p.role === "All-Rounder").length;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card className="stadium-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/25 via-primary/10 to-transparent p-6 border-b border-border/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/20">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Best XI of All Time</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {batCount} Batsmen · {keeperCount} Keeper · {arCount} All-Rounders · {bowlCount} Bowlers
              </p>
            </div>
          </div>
        </div>

        {/* Playing XI */}
        <CardContent className="p-5 space-y-2.5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-base font-bold">Playing XI</span>
            <Badge variant="outline" className="ml-auto text-xs">Based on performance</Badge>
          </div>
          {playing.map((p, i) => (
            <PlayerSlot key={p.player_name + i} player={p} index={i} />
          ))}
        </CardContent>
      </Card>

      {/* Substitutes */}
      {substitutes.length > 0 && (
        <Card className="stadium-card">
          <CardContent className="p-5 space-y-2.5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-base font-bold text-muted-foreground">Substitutes</span>
              <Badge variant="outline" className="ml-auto text-xs text-muted-foreground">Next in line</Badge>
            </div>
            {substitutes.map((p, i) => (
              <PlayerSlot key={p.player_name + i} player={p} index={i} isSub />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
