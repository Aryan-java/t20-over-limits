import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAllTimeStats } from "@/hooks/useAllTimeStats";
import {
  User, TrendingUp, Target, Loader2, ChevronRight, RefreshCw,
  Trophy, Crown, Medal, Star, Sparkles, Swords, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const getMedalIcon = (index: number) => {
  if (index === 0) return Crown;
  if (index <= 2) return Medal;
  return Star;
};

const getMedalClass = (index: number) => {
  if (index === 0) return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30";
  if (index === 1) return "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/30";
  if (index === 2) return "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30";
  return "bg-muted text-muted-foreground";
};

const calcBatAvg = (runs: number, matches: number, notOuts: number) => {
  const inn = matches - notOuts;
  return inn <= 0 ? (runs > 0 ? "∞" : "0.00") : (runs / inn).toFixed(2);
};
const calcSR = (runs: number, balls: number) => (balls === 0 ? "0.00" : ((runs / balls) * 100).toFixed(2));
const calcBowlAvg = (runs: number, wkts: number) => (wkts === 0 ? "-" : (runs / wkts).toFixed(2));
const calcEcon = (runs: number, balls: number) => (balls === 0 ? "0.00" : ((runs / balls) * 6).toFixed(2));

const formatNumber = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(2) + "K";
  return num.toString();
};

// CWC23-style highlight card with player image
function HighlightCard({ title, value, player, color = "primary" }: {
  title: string;
  value: string | number;
  player?: { name: string; image_url: string | null; team?: string | null };
  color?: "primary" | "accent" | "green" | "purple";
}) {
  const colorMap = {
    primary: "from-primary/20 to-primary/5 border-primary/30",
    accent: "from-accent/20 to-accent/5 border-accent/30",
    green: "from-cricket-green/20 to-cricket-green/5 border-cricket-green/30",
    purple: "from-cricket-purple/20 to-cricket-purple/5 border-cricket-purple/30",
  };
  const valueColor = {
    primary: "text-primary",
    accent: "text-accent",
    green: "text-cricket-green",
    purple: "text-cricket-purple",
  };

  return (
    <div className={cn(
      "relative bg-gradient-to-br rounded-xl border p-4 flex items-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
      colorMap[color]
    )}>
      {player && (
        <Avatar className="h-16 w-16 border-2 border-white/20 shadow-md flex-shrink-0">
          <AvatarImage src={player.image_url || undefined} alt={player.name} />
          <AvatarFallback className="bg-secondary"><User className="h-6 w-6" /></AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className={cn("text-3xl font-black mt-0.5", valueColor[color])}>{value}</p>
        {player && <p className="text-xs text-foreground/70 truncate mt-0.5">{player.name}</p>}
      </div>
    </div>
  );
}

// Simple aggregate stat card (no player image)
function StatCard({ title, value, color = "primary" }: {
  title: string;
  value: string | number;
  color?: "primary" | "accent" | "green" | "purple";
}) {
  const valueColor = {
    primary: "text-primary",
    accent: "text-accent",
    green: "text-cricket-green",
    purple: "text-cricket-purple",
  };

  return (
    <div className="bg-card/80 border border-border/50 rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:border-primary/30">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      <p className={cn("text-3xl font-black mt-1", valueColor[color])}>{value}</p>
    </div>
  );
}

export default function AllTimeStats() {
  const navigate = useNavigate();
  const { battingLeaderboard, bowlingLeaderboard, isLoading, isError, refetch } = useAllTimeStats();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Compute aggregate stats
  const aggregates = useMemo(() => {
    const allBatters = battingLeaderboard;
    const allBowlers = bowlingLeaderboard;

    const totalRuns = allBatters.reduce((sum, p) => sum + p.total_runs, 0);
    const totalWickets = allBowlers.reduce((sum, p) => sum + p.total_wickets, 0);
    const totalFours = allBatters.reduce((sum, p) => sum + p.fours, 0);
    const totalSixes = allBatters.reduce((sum, p) => sum + p.sixes, 0);
    const totalFifties = allBatters.reduce((sum, p) => sum + p.fifties, 0);
    const totalHundreds = allBatters.reduce((sum, p) => sum + p.hundreds, 0);

    // Top performers
    const topRunScorer = allBatters[0] || null;

    const topAvgPlayer = [...allBatters]
      .filter(p => p.matches_batted >= 2)
      .sort((a, b) => {
        const avgA = parseFloat(calcBatAvg(a.total_runs, a.matches_batted, a.not_outs));
        const avgB = parseFloat(calcBatAvg(b.total_runs, b.matches_batted, b.not_outs));
        return avgB - avgA;
      })[0] || null;

    const topSRPlayer = [...allBatters]
      .filter(p => p.balls_faced >= 20)
      .sort((a, b) => parseFloat(calcSR(b.total_runs, b.balls_faced)) - parseFloat(calcSR(a.total_runs, a.balls_faced)))[0] || null;

    const topWicketTaker = allBowlers[0] || null;

    const bestEconPlayer = [...allBowlers]
      .filter(p => p.balls_bowled >= 12)
      .sort((a, b) => parseFloat(calcEcon(a.runs_conceded, a.balls_bowled)) - parseFloat(calcEcon(b.runs_conceded, b.balls_bowled)))[0] || null;

    const topBoundaryScorer = [...allBatters]
      .sort((a, b) => (b.fours + b.sixes) - (a.fours + a.sixes))[0] || null;

    const topSixScorer = [...allBatters].sort((a, b) => b.sixes - a.sixes)[0] || null;
    const topFourScorer = [...allBatters].sort((a, b) => b.fours - a.fours)[0] || null;

    const highestIndividualScore = [...allBatters].sort((a, b) => b.highest_score - a.highest_score)[0] || null;
    const mostCenturies = [...allBatters].sort((a, b) => b.hundreds - a.hundreds)[0] || null;
    const mostFifties = [...allBatters].sort((a, b) => b.fifties - a.fifties)[0] || null;

    const boundaryRuns = totalFours * 4 + totalSixes * 6;

    // Top 10 run scorers for bar chart
    const topTenBatters = allBatters.slice(0, 10);

    return {
      totalRuns, totalWickets, totalFours, totalSixes, totalFifties, totalHundreds,
      topRunScorer, topAvgPlayer, topSRPlayer, topWicketTaker, bestEconPlayer,
      topBoundaryScorer, topSixScorer, topFourScorer,
      highestIndividualScore, mostCenturies, mostFifties,
      boundaryRuns, topTenBatters,
    };
  }, [battingLeaderboard, bowlingLeaderboard]);

  if (isLoading) {
    return (
      <Card className="stadium-card">
        <CardContent className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Loading records...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="stadium-card">
        <CardContent className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Trophy className="h-12 w-12 text-destructive opacity-50" />
            <p className="text-sm text-muted-foreground font-medium">Failed to load records</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: "Total 6s", value: aggregates.totalSixes, color: "hsl(270, 70%, 55%)" },
    { name: "Total 4s", value: aggregates.totalFours, color: "hsl(45, 95%, 55%)" },
  ];

  return (
    <div className="space-y-6">
      {/* CWC23-style Overview Dashboard */}
      <Card className="stadium-card overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <CardHeader className="flex flex-row items-center justify-between border-b border-primary/20 relative">
          <CardTitle className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent animate-pulse" />
            </div>
            <div>
              <span className="text-2xl font-bold">Overview Dashboard</span>
              <p className="text-sm font-normal text-muted-foreground">Tournament highlights & records</p>
            </div>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || isLoading} className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-2">
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} /> Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-6 relative space-y-6">
          {/* Row 1: Top performers with images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aggregates.topRunScorer && (
              <HighlightCard
                title="Top Run Scorer"
                value={aggregates.topRunScorer.total_runs}
                player={{ name: aggregates.topRunScorer.player_name, image_url: aggregates.topRunScorer.image_url }}
                color="primary"
              />
            )}
            {aggregates.topAvgPlayer && (
              <HighlightCard
                title="Highest Batting Avg"
                value={calcBatAvg(aggregates.topAvgPlayer.total_runs, aggregates.topAvgPlayer.matches_batted, aggregates.topAvgPlayer.not_outs)}
                player={{ name: aggregates.topAvgPlayer.player_name, image_url: aggregates.topAvgPlayer.image_url }}
                color="accent"
              />
            )}
            <StatCard title="Centuries" value={aggregates.totalHundreds} color="accent" />
            <StatCard title="Total Runs" value={formatNumber(aggregates.totalRuns)} color="primary" />
          </div>

          {/* Row 2: Bowling highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aggregates.topWicketTaker && (
              <HighlightCard
                title="Top Wickets Taker"
                value={aggregates.topWicketTaker.total_wickets}
                player={{ name: aggregates.topWicketTaker.player_name, image_url: aggregates.topWicketTaker.image_url }}
                color="purple"
              />
            )}
            {aggregates.bestEconPlayer && (
              <HighlightCard
                title="Best Economy"
                value={calcEcon(aggregates.bestEconPlayer.runs_conceded, aggregates.bestEconPlayer.balls_bowled)}
                player={{ name: aggregates.bestEconPlayer.player_name, image_url: aggregates.bestEconPlayer.image_url }}
                color="green"
              />
            )}
            <StatCard title="Half Centuries" value={aggregates.totalFifties} color="accent" />
            <StatCard title="Total Wickets" value={aggregates.totalWickets} color="purple" />
          </div>

          {/* Row 3: Boundaries & chart */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card/80 border border-border/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Boundary Runs</p>
              <p className="text-3xl font-black text-primary">{formatNumber(aggregates.boundaryRuns)}</p>
              <p className="text-xs text-muted-foreground">scored by boundaries</p>
            </div>

            <div className="bg-card/80 border border-border/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Boundaries Split</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-cricket-purple" /> 6s: {aggregates.totalSixes}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-accent" /> 4s: {aggregates.totalFours}
                </span>
              </div>
            </div>

            {/* Batting highlights: top individual records */}
            <div className="bg-card/80 border border-border/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Individual Records</p>
              {aggregates.highestIndividualScore && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-primary/20">
                    <AvatarImage src={aggregates.highestIndividualScore.image_url || undefined} />
                    <AvatarFallback className="bg-secondary text-xs"><User className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Highest Score</p>
                    <p className="text-sm font-bold truncate">{aggregates.highestIndividualScore.player_name}</p>
                  </div>
                  <span className="text-lg font-black text-primary">{aggregates.highestIndividualScore.highest_score}</span>
                </div>
              )}
              {aggregates.mostCenturies && aggregates.mostCenturies.hundreds > 0 && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-accent/20">
                    <AvatarImage src={aggregates.mostCenturies.image_url || undefined} />
                    <AvatarFallback className="bg-secondary text-xs"><User className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Most 100s</p>
                    <p className="text-sm font-bold truncate">{aggregates.mostCenturies.player_name}</p>
                  </div>
                  <span className="text-lg font-black text-accent">{aggregates.mostCenturies.hundreds}</span>
                </div>
              )}
              {aggregates.mostFifties && aggregates.mostFifties.fifties > 0 && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border border-cricket-green/20">
                    <AvatarImage src={aggregates.mostFifties.image_url || undefined} />
                    <AvatarFallback className="bg-secondary text-xs"><User className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Most 50s</p>
                    <p className="text-sm font-bold truncate">{aggregates.mostFifties.player_name}</p>
                  </div>
                  <span className="text-lg font-black text-cricket-green">{aggregates.mostFifties.fifties}</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Top Run Scorers Bar Chart */}
          {aggregates.topTenBatters.length > 0 && (
            <div className="bg-card/80 border border-border/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Top Run Scorers</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregates.topTenBatters.map(p => ({ name: p.player_name.split(' ').pop(), runs: p.total_runs, fullName: p.player_name }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(260, 20%, 65%)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(260, 20%, 65%)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(260, 55%, 18%)', border: '1px solid hsl(260, 40%, 28%)', borderRadius: '8px', color: '#fff' }}
                      formatter={(value: number, name: string, props: any) => [value, props.payload.fullName]}
                    />
                    <Bar dataKey="runs" fill="hsl(45, 95%, 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batting Stats Section */}
      <Card className="stadium-card overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <CardHeader className="border-b border-primary/20 relative">
          <CardTitle className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-accent to-accent/80 rounded-xl shadow-lg">
              <TrendingUp className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <span className="text-2xl font-bold">Batting Stats</span>
              <p className="text-sm font-normal text-muted-foreground">Detailed batting records</p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 relative space-y-6">
          {/* CWC23-style batting highlight cards */}
          {battingLeaderboard.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {aggregates.topRunScorer && (
                <HighlightCard title="Top Run Scorer" value={aggregates.topRunScorer.total_runs} player={{ name: aggregates.topRunScorer.player_name, image_url: aggregates.topRunScorer.image_url }} color="primary" />
              )}
              {aggregates.topSRPlayer && (
                <HighlightCard title="Highest Strike Rate" value={calcSR(aggregates.topSRPlayer.total_runs, aggregates.topSRPlayer.balls_faced)} player={{ name: aggregates.topSRPlayer.player_name, image_url: aggregates.topSRPlayer.image_url }} color="primary" />
              )}
              {aggregates.topAvgPlayer && (
                <HighlightCard title="Highest Batting Avg" value={calcBatAvg(aggregates.topAvgPlayer.total_runs, aggregates.topAvgPlayer.matches_batted, aggregates.topAvgPlayer.not_outs)} player={{ name: aggregates.topAvgPlayer.player_name, image_url: aggregates.topAvgPlayer.image_url }} color="accent" />
              )}
              {aggregates.topBoundaryScorer && (
                <HighlightCard title="Top Boundary Scorer" value={(aggregates.topBoundaryScorer.fours + aggregates.topBoundaryScorer.sixes)} player={{ name: aggregates.topBoundaryScorer.player_name, image_url: aggregates.topBoundaryScorer.image_url }} color="primary" />
              )}
              {aggregates.topSixScorer && (
                <HighlightCard title="Top 6s Scorer" value={aggregates.topSixScorer.sixes} player={{ name: aggregates.topSixScorer.player_name, image_url: aggregates.topSixScorer.image_url }} color="purple" />
              )}
              {aggregates.topFourScorer && (
                <HighlightCard title="Top 4s Scorer" value={aggregates.topFourScorer.fours} player={{ name: aggregates.topFourScorer.player_name, image_url: aggregates.topFourScorer.image_url }} color="green" />
              )}
            </div>
          )}

          {/* Batting Leaderboard Table */}
          {battingLeaderboard.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-4 py-3 bg-gradient-to-r from-primary/10 to-transparent rounded-xl uppercase tracking-wider border border-primary/10">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Player</div>
                <div className="col-span-1 text-center">M</div>
                <div className="col-span-2 text-center">Runs</div>
                <div className="col-span-1 text-center">HS</div>
                <div className="col-span-1 text-center">Avg</div>
                <div className="col-span-1 text-center">SR</div>
                <div className="col-span-1 text-center">50s</div>
                <div className="col-span-1 text-center">100s</div>
              </div>
              {battingLeaderboard.slice(0, 15).map((player, index) => {
                const MedalIcon = getMedalIcon(index);
                return (
                  <div key={player.id} onClick={() => navigate(`/player/${player.player_id}`)}
                    className={cn("grid grid-cols-12 gap-2 items-center p-3 rounded-xl transition-all duration-300 cursor-pointer group animate-fade-slide-up",
                      index < 3 ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                        : "bg-card/50 hover:bg-muted/50 border border-transparent hover:border-border"
                    )} style={{ animationDelay: `${index * 40}ms` }}>
                    <div className="col-span-1">
                      <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110", getMedalClass(index))}>
                        {index < 3 ? <MedalIcon className="h-4 w-4" /> : index + 1}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="relative">
                        <Avatar className={cn("h-10 w-10 border-2 transition-all", index === 0 ? "border-yellow-500 ring-2 ring-yellow-500/30" : "border-primary/30")}>
                          <AvatarImage src={player.image_url || undefined} alt={player.player_name} />
                          <AvatarFallback className="bg-primary/10 text-primary"><User className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        {index === 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center"><Crown className="h-2.5 w-2.5 text-white" /></div>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{player.player_name}</p>
                        {player.team_name && <p className="text-[10px] text-muted-foreground truncate">{player.team_name}</p>}
                      </div>
                    </div>
                    <div className="col-span-1 text-center text-sm font-medium">{player.matches_batted}</div>
                    <div className="col-span-2 text-center"><span className="font-black text-xl text-primary">{player.total_runs}</span></div>
                    <div className="col-span-1 text-center text-sm font-semibold">{player.highest_score}</div>
                    <div className="col-span-1 text-center text-sm">{calcBatAvg(player.total_runs, player.matches_batted, player.not_outs)}</div>
                    <div className="col-span-1 text-center text-sm">{calcSR(player.total_runs, player.balls_faced)}</div>
                    <div className="col-span-1 text-center text-sm font-medium">{player.fifties}</div>
                    <div className="col-span-1 text-center text-sm flex items-center justify-center gap-1 font-medium">
                      {player.hundreds}
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <TrendingUp className="h-20 w-20 opacity-20 mx-auto mb-4" />
              <p className="text-xl font-bold mb-2">No Batting Records Yet</p>
              <p className="text-sm">Complete matches to build all-time statistics</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bowling Stats Section */}
      <Card className="stadium-card overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cricket-purple/10 to-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <CardHeader className="border-b border-primary/20 relative">
          <CardTitle className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-cricket-purple to-cricket-purple/80 rounded-xl shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold">Bowling Stats</span>
              <p className="text-sm font-normal text-muted-foreground">Detailed bowling records</p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 relative">
          {bowlingLeaderboard.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-4 py-3 bg-gradient-to-r from-cricket-purple/10 to-transparent rounded-xl uppercase tracking-wider border border-cricket-purple/10">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Player</div>
                <div className="col-span-1 text-center">M</div>
                <div className="col-span-2 text-center">Wkts</div>
                <div className="col-span-2 text-center">Best</div>
                <div className="col-span-1 text-center">Avg</div>
                <div className="col-span-2 text-center">Econ</div>
              </div>
              {bowlingLeaderboard.slice(0, 15).map((player, index) => {
                const MedalIcon = getMedalIcon(index);
                return (
                  <div key={player.id} onClick={() => navigate(`/player/${player.player_id}`)}
                    className={cn("grid grid-cols-12 gap-2 items-center p-3 rounded-xl transition-all duration-300 cursor-pointer group animate-fade-slide-up",
                      index < 3 ? "bg-gradient-to-r from-cricket-purple/10 via-cricket-purple/5 to-transparent border-2 border-cricket-purple/20 hover:border-cricket-purple/40 hover:shadow-lg hover:shadow-cricket-purple/10"
                        : "bg-card/50 hover:bg-muted/50 border border-transparent hover:border-border"
                    )} style={{ animationDelay: `${index * 40}ms` }}>
                    <div className="col-span-1">
                      <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110", getMedalClass(index))}>
                        {index < 3 ? <MedalIcon className="h-4 w-4" /> : index + 1}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="relative">
                        <Avatar className={cn("h-10 w-10 border-2 transition-all", index === 0 ? "border-cricket-purple ring-2 ring-cricket-purple/30" : "border-cricket-purple/30")}>
                          <AvatarImage src={player.image_url || undefined} alt={player.player_name} />
                          <AvatarFallback className="bg-cricket-purple/10 text-cricket-purple"><User className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        {index === 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-cricket-purple rounded-full flex items-center justify-center"><Crown className="h-2.5 w-2.5 text-white" /></div>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate group-hover:text-cricket-purple transition-colors">{player.player_name}</p>
                        {player.team_name && <p className="text-[10px] text-muted-foreground truncate">{player.team_name}</p>}
                      </div>
                    </div>
                    <div className="col-span-1 text-center text-sm font-medium">{player.matches_bowled}</div>
                    <div className="col-span-2 text-center"><span className="font-black text-xl text-cricket-purple">{player.total_wickets}</span></div>
                    <div className="col-span-2 text-center text-sm font-semibold">{player.best_bowling_wickets}/{player.best_bowling_runs}</div>
                    <div className="col-span-1 text-center text-sm">{calcBowlAvg(player.runs_conceded, player.total_wickets)}</div>
                    <div className="col-span-2 text-center text-sm flex items-center justify-center gap-1">
                      <span className={cn(
                        parseFloat(calcEcon(player.runs_conceded, player.balls_bowled)) < 7 ? "text-cricket-green font-semibold"
                          : parseFloat(calcEcon(player.runs_conceded, player.balls_bowled)) > 9 ? "text-destructive" : ""
                      )}>{calcEcon(player.runs_conceded, player.balls_bowled)}</span>
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-cricket-purple" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Target className="h-20 w-20 opacity-20 mx-auto mb-4" />
              <p className="text-xl font-bold mb-2">No Bowling Records Yet</p>
              <p className="text-sm">Complete matches to build all-time statistics</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
