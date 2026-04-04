import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAllTimeStats } from "@/hooks/useAllTimeStats";
import { supabase } from "@/integrations/supabase/client";
import {
  User, TrendingUp, Target, Loader2, RefreshCw,
  Trophy, Crown, Medal, Star, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const getMedalClass = (i: number) => {
  if (i === 0) return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30";
  if (i === 1) return "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/30";
  if (i === 2) return "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30";
  return "bg-muted text-muted-foreground";
};
const getMedalIcon = (i: number) => (i === 0 ? Crown : i <= 2 ? Medal : Star);

const calcBatAvg = (r: number, m: number, no: number) => { const inn = m - no; return inn <= 0 ? (r > 0 ? "∞" : "0.00") : (r / inn).toFixed(2); };
const calcSR = (r: number, b: number) => (b === 0 ? "0.00" : ((r / b) * 100).toFixed(2));
const calcBowlAvg = (r: number, w: number) => (w === 0 ? "-" : (r / w).toFixed(2));
const calcEcon = (r: number, b: number) => (b === 0 ? "0.00" : ((r / b) * 6).toFixed(2));
const calcBowlSR = (b: number, w: number) => (w === 0 ? "-" : (b / w).toFixed(1));
const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toString();

const BATTING_CATEGORIES = [
  { key: "most-runs", label: "Most Runs" },
  { key: "highest-score", label: "Highest Individual Score" },
  { key: "highest-sr-tournament", label: "Highest Strike Rate (Tournament)" },
  { key: "highest-avg", label: "Highest Averages" },
  { key: "most-sixes", label: "Most Sixes" },
  { key: "most-fours", label: "Most Fours" },
  { key: "most-fifties", label: "Most Fifties" },
  { key: "most-centuries", label: "Most Centuries" },
  { key: "fastest-fifties", label: "Fastest Fifties" },
  { key: "fastest-centuries", label: "Fastest Centuries" },
  { key: "most-not-outs", label: "Most Not Outs" },
  { key: "most-balls-faced", label: "Most Balls Faced" },
  { key: "most-boundaries", label: "Most Boundaries" },
];

const BOWLING_CATEGORIES = [
  { key: "most-wickets", label: "Most Wickets" },
  { key: "best-avg", label: "Best Averages" },
  { key: "best-economy", label: "Best Economy" },
  { key: "best-sr", label: "Best Strike-Rates" },
  { key: "most-runs-conceded", label: "Most Runs Conceded" },
  { key: "most-dot-balls", label: "Most Dot Balls Bowled" },
  { key: "most-maidens", label: "Most Maiden Overs Bowled" },
  { key: "most-balls-bowled", label: "Most Balls Bowled" },
];

const CHART_COLORS = [
  "hsl(330, 85%, 55%)", "hsl(45, 95%, 55%)", "hsl(160, 60%, 45%)",
  "hsl(270, 70%, 55%)", "hsl(200, 80%, 55%)", "hsl(15, 85%, 55%)",
  "hsl(90, 60%, 45%)", "hsl(340, 75%, 65%)", "hsl(50, 90%, 50%)", "hsl(220, 70%, 55%)",
];

type PlayerStat = ReturnType<typeof useAllTimeStats>["battingLeaderboard"][number];

function Sidebar({ items, active, onSelect, icon: Icon, color }: {
  items: { key: string; label: string }[];
  active: string;
  onSelect: (k: string) => void;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="w-full lg:w-56 flex-shrink-0 space-y-1">
      <div className="flex items-center gap-2 px-3 py-2 mb-2">
        <Icon className={cn("h-5 w-5", color)} />
        <span className="text-sm font-bold text-foreground">{color.includes("primary") ? "Batting Stats" : "Bowling Stats"}</span>
      </div>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onSelect(item.key)}
          className={cn(
            "w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            active === item.key
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function LeaderRow({ player, index, columns, navigate }: {
  player: PlayerStat;
  index: number;
  columns: { label: string; value: string | number; highlight?: boolean }[];
  navigate: (path: string) => void;
}) {
  const MIcon = getMedalIcon(index);
  return (
    <div
      onClick={() => navigate(`/player/${player.player_id}`)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer group",
        index < 3
          ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 hover:border-primary/40"
          : "bg-card/50 hover:bg-muted/50 border border-transparent hover:border-border"
      )}
    >
      <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0", getMedalClass(index))}>
        {index < 3 ? <MIcon className="h-4 w-4" /> : index + 1}
      </span>
      <Avatar className={cn("h-9 w-9 border-2 flex-shrink-0", index === 0 ? "border-yellow-500" : "border-primary/20")}>
        <AvatarImage src={player.image_url || undefined} />
        <AvatarFallback className="bg-primary/10"><User className="h-4 w-4 text-primary" /></AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{player.player_name}</p>
        {player.team_name && <p className="text-[10px] text-muted-foreground truncate">{player.team_name}</p>}
      </div>
      {columns.map((col, ci) => (
        <div key={ci} className="hidden sm:flex flex-col items-center min-w-[50px]">
          <span className="text-[9px] text-muted-foreground uppercase">{col.label}</span>
          <span className={cn("font-bold text-sm", col.highlight ? "text-primary text-lg" : "")}>{col.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AllTimeStats() {
  const navigate = useNavigate();
  const { battingLeaderboard, bowlingLeaderboard, isLoading, isError, refetch } = useAllTimeStats();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [batCat, setBatCat] = useState("most-runs");
  const [bowlCat, setBowlCat] = useState("most-wickets");

  // Fetch per-innings data for fastest 50/100 categories
  const [inningsData, setInningsData] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("player_innings").select("*").limit(1000).then(({ data }) => {
      if (data) setInningsData(data);
    });
  }, [isRefreshing]);

  const handleRefresh = async () => { setIsRefreshing(true); await refetch(); setIsRefreshing(false); };

  const agg = useMemo(() => {
    const b = battingLeaderboard;
    const bw = bowlingLeaderboard;
    return {
      totalRuns: b.reduce((s, p) => s + p.total_runs, 0),
      totalWickets: bw.reduce((s, p) => s + p.total_wickets, 0),
      totalFours: b.reduce((s, p) => s + p.fours, 0),
      totalSixes: b.reduce((s, p) => s + p.sixes, 0),
      totalFifties: b.reduce((s, p) => s + p.fifties, 0),
      totalHundreds: b.reduce((s, p) => s + p.hundreds, 0),
      totalMaidens: bw.reduce((s, p) => s + p.maidens, 0),
    };
  }, [battingLeaderboard, bowlingLeaderboard]);

  const sortedBatters = useMemo(() => {
    const list = [...battingLeaderboard];
    switch (batCat) {
      case "most-runs": return list.sort((a, b) => b.total_runs - a.total_runs);
      case "highest-score": return list.sort((a, b) => b.highest_score - a.highest_score);
      case "highest-sr-tournament": return list.filter(p => p.balls_faced >= 10).sort((a, b) => parseFloat(calcSR(b.total_runs, b.balls_faced)) - parseFloat(calcSR(a.total_runs, a.balls_faced)));
      case "highest-avg": return list.filter(p => p.matches_batted >= 2).sort((a, b) => parseFloat(calcBatAvg(b.total_runs, b.matches_batted, b.not_outs)) - parseFloat(calcBatAvg(a.total_runs, a.matches_batted, a.not_outs)));
      case "most-sixes": return list.sort((a, b) => b.sixes - a.sixes);
      case "most-fours": return list.sort((a, b) => b.fours - a.fours);
      case "most-fifties": return list.filter(p => p.fifties > 0).sort((a, b) => b.fifties - a.fifties);
      case "most-centuries": return list.filter(p => p.hundreds > 0).sort((a, b) => b.hundreds - a.hundreds);
      case "fastest-fifties": {
        return inningsData
          .filter((inn: any) => inn.runs >= 50 && inn.runs < 100)
          .sort((a: any, b: any) => a.balls_faced - b.balls_faced)
          .slice(0, 20)
          .map((inn: any) => ({
            id: inn.id,
            player_id: inn.player_id,
            player_name: inn.player_name,
            team_name: inn.team_name,
            image_url: inn.image_url,
            total_runs: inn.runs,
            balls_faced: inn.balls_faced,
            fours: inn.fours,
            sixes: inn.sixes,
            matches_batted: 0,
            highest_score: inn.runs,
            fifties: 1,
            hundreds: 0,
            not_outs: inn.dismissed ? 0 : 1,
            matches_bowled: 0,
            total_wickets: 0,
            balls_bowled: 0,
            runs_conceded: 0,
            best_bowling_wickets: 0,
            best_bowling_runs: 0,
            maidens: 0,
          } as PlayerStat));
      }
      case "fastest-centuries": {
        return inningsData
          .filter((inn: any) => inn.runs >= 100)
          .sort((a: any, b: any) => a.balls_faced - b.balls_faced)
          .slice(0, 20)
          .map((inn: any) => ({
            id: inn.id,
            player_id: inn.player_id,
            player_name: inn.player_name,
            team_name: inn.team_name,
            image_url: inn.image_url,
            total_runs: inn.runs,
            balls_faced: inn.balls_faced,
            fours: inn.fours,
            sixes: inn.sixes,
            matches_batted: 0,
            highest_score: inn.runs,
            fifties: 0,
            hundreds: 1,
            not_outs: inn.dismissed ? 0 : 1,
            matches_bowled: 0,
            total_wickets: 0,
            balls_bowled: 0,
            runs_conceded: 0,
            best_bowling_wickets: 0,
            best_bowling_runs: 0,
            maidens: 0,
          } as PlayerStat));
      }
      case "most-not-outs": return list.sort((a, b) => b.not_outs - a.not_outs);
      case "most-balls-faced": return list.sort((a, b) => b.balls_faced - a.balls_faced);
      case "most-boundaries": return list.sort((a, b) => (b.fours + b.sixes) - (a.fours + a.sixes));
      default: return list;
    }
  }, [battingLeaderboard, batCat, inningsData]);

  const sortedBowlers = useMemo(() => {
    const list = [...bowlingLeaderboard];
    switch (bowlCat) {
      case "most-wickets": return list.sort((a, b) => b.total_wickets - a.total_wickets);
      case "best-avg": return list.filter(p => p.total_wickets > 0).sort((a, b) => parseFloat(calcBowlAvg(a.runs_conceded, a.total_wickets) === "-" ? "999" : calcBowlAvg(a.runs_conceded, a.total_wickets)) - parseFloat(calcBowlAvg(b.runs_conceded, b.total_wickets) === "-" ? "999" : calcBowlAvg(b.runs_conceded, b.total_wickets)));
      case "best-economy": return list.filter(p => p.balls_bowled >= 12).sort((a, b) => parseFloat(calcEcon(a.runs_conceded, a.balls_bowled)) - parseFloat(calcEcon(b.runs_conceded, b.balls_bowled)));
      case "best-sr": return list.filter(p => p.total_wickets > 0).sort((a, b) => parseFloat(calcBowlSR(a.balls_bowled, a.total_wickets) === "-" ? "999" : calcBowlSR(a.balls_bowled, a.total_wickets)) - parseFloat(calcBowlSR(b.balls_bowled, b.total_wickets) === "-" ? "999" : calcBowlSR(b.balls_bowled, b.total_wickets)));
      case "most-runs-conceded": return list.sort((a, b) => b.runs_conceded - a.runs_conceded);
      case "most-dot-balls": return list.sort((a, b) => b.maidens - a.maidens); // using maidens as proxy for dot ball dominance
      case "most-maidens": return list.sort((a, b) => b.maidens - a.maidens);
      case "most-balls-bowled": return list.sort((a, b) => b.balls_bowled - a.balls_bowled);
      default: return list;
    }
  }, [bowlingLeaderboard, bowlCat]);

  const getBatColumns = (p: PlayerStat): { label: string; value: string | number; highlight?: boolean }[] => {
    switch (batCat) {
      case "most-runs": return [{ label: "M", value: p.matches_batted }, { label: "Runs", value: p.total_runs, highlight: true }, { label: "HS", value: p.highest_score }, { label: "Avg", value: calcBatAvg(p.total_runs, p.matches_batted, p.not_outs) }, { label: "SR", value: calcSR(p.total_runs, p.balls_faced) }, { label: "4s", value: p.fours }, { label: "6s", value: p.sixes }];
      case "highest-score": return [{ label: "HS", value: p.highest_score, highlight: true }, { label: "Runs", value: p.total_runs }, { label: "SR", value: calcSR(p.total_runs, p.balls_faced) }, { label: "M", value: p.matches_batted }];
      case "highest-sr-tournament": return [{ label: "SR", value: calcSR(p.total_runs, p.balls_faced), highlight: true }, { label: "Runs", value: p.total_runs }, { label: "BF", value: p.balls_faced }, { label: "4s", value: p.fours }, { label: "6s", value: p.sixes }];
      case "highest-avg": return [{ label: "Avg", value: calcBatAvg(p.total_runs, p.matches_batted, p.not_outs), highlight: true }, { label: "Runs", value: p.total_runs }, { label: "M", value: p.matches_batted }, { label: "NO", value: p.not_outs }];
      case "most-sixes": return [{ label: "6s", value: p.sixes, highlight: true }, { label: "Runs", value: p.total_runs }, { label: "SR", value: calcSR(p.total_runs, p.balls_faced) }, { label: "4s", value: p.fours }];
      case "most-fours": return [{ label: "4s", value: p.fours, highlight: true }, { label: "Runs", value: p.total_runs }, { label: "SR", value: calcSR(p.total_runs, p.balls_faced) }, { label: "6s", value: p.sixes }];
      case "most-fifties": return [{ label: "50s", value: p.fifties, highlight: true }, { label: "Runs", value: p.total_runs }, { label: "Avg", value: calcBatAvg(p.total_runs, p.matches_batted, p.not_outs) }, { label: "100s", value: p.hundreds }];
      case "most-centuries": return [{ label: "100s", value: p.hundreds, highlight: true }, { label: "Runs", value: p.total_runs }, { label: "HS", value: p.highest_score }, { label: "Avg", value: calcBatAvg(p.total_runs, p.matches_batted, p.not_outs) }];
      case "fastest-fifties": return [{ label: "Score", value: p.total_runs, highlight: true }, { label: "Balls", value: p.balls_faced }, { label: "SR", value: calcSR(p.total_runs, p.balls_faced) }, { label: "4s", value: p.fours }, { label: "6s", value: p.sixes }];
      case "fastest-centuries": return [{ label: "Score", value: p.total_runs, highlight: true }, { label: "Balls", value: p.balls_faced }, { label: "SR", value: calcSR(p.total_runs, p.balls_faced) }, { label: "4s", value: p.fours }, { label: "6s", value: p.sixes }];
      case "most-not-outs": return [{ label: "NO", value: p.not_outs, highlight: true }, { label: "M", value: p.matches_batted }, { label: "Runs", value: p.total_runs }, { label: "Avg", value: calcBatAvg(p.total_runs, p.matches_batted, p.not_outs) }];
      case "most-balls-faced": return [{ label: "BF", value: p.balls_faced, highlight: true }, { label: "Runs", value: p.total_runs }, { label: "SR", value: calcSR(p.total_runs, p.balls_faced) }, { label: "M", value: p.matches_batted }];
      case "most-boundaries": return [{ label: "Bdry", value: p.fours + p.sixes, highlight: true }, { label: "4s", value: p.fours }, { label: "6s", value: p.sixes }, { label: "Runs", value: p.total_runs }];
      default: return [];
    }
  };

  const getBowlColumns = (p: PlayerStat): { label: string; value: string | number; highlight?: boolean }[] => {
    switch (bowlCat) {
      case "most-wickets": return [{ label: "M", value: p.matches_bowled }, { label: "Wkts", value: p.total_wickets, highlight: true }, { label: "Best", value: `${p.best_bowling_wickets}/${p.best_bowling_runs}` }, { label: "Avg", value: calcBowlAvg(p.runs_conceded, p.total_wickets) }, { label: "Econ", value: calcEcon(p.runs_conceded, p.balls_bowled) }];
      case "best-avg": return [{ label: "Avg", value: calcBowlAvg(p.runs_conceded, p.total_wickets), highlight: true }, { label: "Wkts", value: p.total_wickets }, { label: "Runs", value: p.runs_conceded }];
      case "best-economy": return [{ label: "Econ", value: calcEcon(p.runs_conceded, p.balls_bowled), highlight: true }, { label: "Wkts", value: p.total_wickets }, { label: "Overs", value: (p.balls_bowled / 6).toFixed(1) }];
      case "best-sr": return [{ label: "SR", value: calcBowlSR(p.balls_bowled, p.total_wickets), highlight: true }, { label: "Wkts", value: p.total_wickets }, { label: "Balls", value: p.balls_bowled }];
      case "most-runs-conceded": return [{ label: "Runs", value: p.runs_conceded, highlight: true }, { label: "Wkts", value: p.total_wickets }, { label: "Overs", value: (p.balls_bowled / 6).toFixed(1) }, { label: "Econ", value: calcEcon(p.runs_conceded, p.balls_bowled) }];
      case "most-dot-balls": return [{ label: "Mdns", value: p.maidens, highlight: true }, { label: "Wkts", value: p.total_wickets }, { label: "Econ", value: calcEcon(p.runs_conceded, p.balls_bowled) }];
      case "most-maidens": return [{ label: "Mdns", value: p.maidens, highlight: true }, { label: "Wkts", value: p.total_wickets }, { label: "Econ", value: calcEcon(p.runs_conceded, p.balls_bowled) }];
      case "most-balls-bowled": return [{ label: "Balls", value: p.balls_bowled, highlight: true }, { label: "Overs", value: (p.balls_bowled / 6).toFixed(1) }, { label: "Wkts", value: p.total_wickets }, { label: "Econ", value: calcEcon(p.runs_conceded, p.balls_bowled) }];
      case "best-sr": return [{ label: "SR", value: calcBowlSR(p.balls_bowled, p.total_wickets), highlight: true }, { label: "Wkts", value: p.total_wickets }, { label: "Balls", value: p.balls_bowled }];
      case "most-maidens": return [{ label: "Maidens", value: p.maidens, highlight: true }, { label: "Wkts", value: p.total_wickets }, { label: "Econ", value: calcEcon(p.runs_conceded, p.balls_bowled) }];
      default: return [];
    }
  };

  if (isLoading) {
    return (
      <Card className="stadium-card">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="stadium-card">
        <CardContent className="flex items-center justify-center py-20 flex-col gap-4">
          <Trophy className="h-12 w-12 text-destructive opacity-50" />
          <Button variant="outline" size="sm" onClick={handleRefresh}><RefreshCw className="h-4 w-4 mr-2" /> Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: "Sixes", value: agg.totalSixes, color: "hsl(270, 70%, 55%)" },
    { name: "Fours", value: agg.totalFours, color: "hsl(45, 95%, 55%)" },
  ];

  const runsBreakdown = [
    { name: "6s Runs", value: agg.totalSixes * 6, color: "hsl(270, 70%, 55%)" },
    { name: "4s Runs", value: agg.totalFours * 4, color: "hsl(45, 95%, 55%)" },
    { name: "Other", value: Math.max(0, agg.totalRuns - agg.totalSixes * 6 - agg.totalFours * 4), color: "hsl(200, 60%, 50%)" },
  ];

  const topBatters = battingLeaderboard.slice(0, 8);
  const barData = topBatters.map(p => ({ name: p.player_name.split(" ").pop(), runs: p.total_runs, full: p.player_name }));

  const radarData = topBatters.slice(0, 5).map(p => ({
    player: p.player_name.split(" ").pop(),
    runs: Math.min(p.total_runs, 500),
    sr: Math.min(parseFloat(calcSR(p.total_runs, p.balls_faced)), 200),
    avg: Math.min(parseFloat(calcBatAvg(p.total_runs, p.matches_batted, p.not_outs)) || 0, 100),
    boundaries: Math.min(p.fours + p.sixes, 100),
  }));

  const topBowlers = bowlingLeaderboard.slice(0, 8);
  const bowlBarData = topBowlers.map(p => ({ name: p.player_name.split(" ").pop(), wickets: p.total_wickets, full: p.player_name }));

  const tooltipStyle = { backgroundColor: 'hsl(260, 55%, 18%)', border: '1px solid hsl(260, 40%, 28%)', borderRadius: '8px', color: '#fff', fontSize: '12px' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Tournament Records</h2>
            <p className="text-sm text-muted-foreground">All-time stats & leaderboards</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Overview Charts & Aggregates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Runs", value: fmt(agg.totalRuns), color: "text-primary" },
          { label: "Total Wickets", value: agg.totalWickets, color: "text-cricket-purple" },
          { label: "Centuries", value: agg.totalHundreds, color: "text-accent" },
          { label: "Half Centuries", value: agg.totalFifties, color: "text-accent" },
          { label: "Total Sixes", value: agg.totalSixes, color: "text-cricket-purple" },
          { label: "Total Fours", value: agg.totalFours, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-card/80 border border-border/50 rounded-xl p-3 text-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={cn("text-2xl font-black mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Boundaries Donut */}
        <Card className="stadium-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Boundaries Split</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "hsl(270, 70%, 55%)" }} /> 6s: {agg.totalSixes}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "hsl(45, 95%, 55%)" }} /> 4s: {agg.totalFours}</span>
            </div>
          </CardContent>
        </Card>

        {/* Runs Breakdown Pie */}
        <Card className="stadium-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Runs Breakdown</p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={runsBreakdown} cx="50%" cy="50%" outerRadius={60} dataKey="value" strokeWidth={0}>
                    {runsBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 text-[10px] flex-wrap">
              {runsBreakdown.map(r => (
                <span key={r.name} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: r.color }} />{r.name}: {r.value}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Run Scorers Bar */}
        <Card className="stadium-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Run Scorers</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(260, 20%, 65%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(260, 20%, 65%)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _: string, props: any) => [v, props.payload.full]} />
                  <Bar dataKey="runs" radius={[4, 4, 0, 0]}>
                    {barData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* More Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Wicket Takers Bar */}
        <Card className="stadium-card">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top Wicket Takers</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bowlBarData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(260, 20%, 65%)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'hsl(260, 20%, 65%)' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, _: string, props: any) => [v, props.payload.full]} />
                  <Bar dataKey="wickets" radius={[0, 4, 4, 0]}>
                    {bowlBarData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radar comparison */}
        {radarData.length > 0 && (
          <Card className="stadium-card">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Top 5 Batters Comparison</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(260, 20%, 30%)" />
                    <PolarAngleAxis dataKey="player" tick={{ fontSize: 9, fill: 'hsl(260, 20%, 65%)' }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar name="Runs" dataKey="runs" stroke="hsl(330, 85%, 55%)" fill="hsl(330, 85%, 55%)" fillOpacity={0.3} />
                    <Radar name="SR" dataKey="sr" stroke="hsl(45, 95%, 55%)" fill="hsl(45, 95%, 55%)" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Batting Stats with Sidebar */}
      <Card className="stadium-card overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            <div className="border-b lg:border-b-0 lg:border-r border-border/30 p-4">
              <Sidebar items={BATTING_CATEGORIES} active={batCat} onSelect={setBatCat} icon={TrendingUp} color="text-primary" />
            </div>
            <div className="flex-1 p-4 space-y-2 overflow-x-auto">
              <h3 className="text-lg font-bold mb-3">{BATTING_CATEGORIES.find(c => c.key === batCat)?.label}</h3>
              {sortedBatters.length > 0 ? sortedBatters.slice(0, 15).map((p, i) => (
                <LeaderRow key={p.id} player={p} index={i} columns={getBatColumns(p)} navigate={navigate} />
              )) : (
                <div className="py-16 text-center text-muted-foreground">
                  <TrendingUp className="h-16 w-16 opacity-20 mx-auto mb-3" />
                  <p className="font-bold">No Batting Records Yet</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bowling Stats with Sidebar */}
      <Card className="stadium-card overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            <div className="border-b lg:border-b-0 lg:border-r border-border/30 p-4">
              <Sidebar items={BOWLING_CATEGORIES} active={bowlCat} onSelect={setBowlCat} icon={Target} color="text-cricket-purple" />
            </div>
            <div className="flex-1 p-4 space-y-2 overflow-x-auto">
              <h3 className="text-lg font-bold mb-3">{BOWLING_CATEGORIES.find(c => c.key === bowlCat)?.label}</h3>
              {sortedBowlers.length > 0 ? sortedBowlers.slice(0, 15).map((p, i) => (
                <LeaderRow key={p.id} player={p} index={i} columns={getBowlColumns(p)} navigate={navigate} />
              )) : (
                <div className="py-16 text-center text-muted-foreground">
                  <Target className="h-16 w-16 opacity-20 mx-auto mb-3" />
                  <p className="font-bold">No Bowling Records Yet</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
