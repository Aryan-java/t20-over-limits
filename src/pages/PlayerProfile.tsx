import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCricketStore } from "@/hooks/useCricketStore";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, TrendingUp, Trophy, Target, Award, User, Calendar, Star, Globe, Zap, Loader2, Swords, Shield } from "lucide-react";
import CricketHeader from "@/components/CricketHeader";
import { SkillRadarChart } from "@/components/ui/SkillRadarChart";
import { StatProgressBar } from "@/components/ui/CareerStatsGraph";
import { cn } from "@/lib/utils";

interface DbStats {
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

interface InningsRecord {
  id: string;
  player_name: string;
  team_name: string | null;
  match_id: string | null;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  dismissed: boolean;
  created_at: string;
}

const DONUT_COLORS = ["hsl(var(--primary))", "hsl(45, 93%, 47%)", "hsl(262, 83%, 58%)", "hsl(var(--muted))"];

const PlayerProfile = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { teams } = useCricketStore();

  const [dbStats, setDbStats] = useState<DbStats | null>(null);
  const [innings, setInnings] = useState<InningsRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Try to find local player for skills info
  let localPlayer: any = null;
  let localTeam: any = null;
  for (const t of teams) {
    const p = t.squad.find((p: any) => p.id === playerId);
    if (p) { localPlayer = p; localTeam = t; break; }
  }

  useEffect(() => {
    if (!playerId) return;
    const fetch = async () => {
      setLoading(true);
      const [statsRes, inningsRes] = await Promise.all([
        supabase.from("player_all_time_stats").select("*").eq("player_id", playerId).maybeSingle(),
        supabase.from("player_innings").select("*").eq("player_id", playerId).order("created_at", { ascending: false }).limit(5),
      ]);
      if (statsRes.data) setDbStats(statsRes.data as unknown as DbStats);
      if (inningsRes.data) setInnings(inningsRes.data as unknown as InningsRecord[]);
      setLoading(false);
    };
    fetch();
  }, [playerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CricketHeader />
        <main className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  const name = dbStats?.player_name || localPlayer?.name || "Unknown Player";
  const imageUrl = dbStats?.image_url || localPlayer?.imageUrl;
  const teamName = dbStats?.team_name || localTeam?.name || "—";
  const batSkill = localPlayer?.batSkill ?? 50;
  const bowlSkill = localPlayer?.bowlSkill ?? 50;
  const isOverseas = localPlayer?.isOverseas ?? false;

  if (!dbStats && !localPlayer) {
    return (
      <div className="min-h-screen bg-background">
        <CricketHeader />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-lg text-muted-foreground">Player not found</p>
              <Button onClick={() => navigate("/")} className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const s = dbStats || {
    matches_batted: 0, total_runs: 0, balls_faced: 0, highest_score: 0,
    fifties: 0, hundreds: 0, fours: 0, sixes: 0, not_outs: 0,
    matches_bowled: 0, total_wickets: 0, balls_bowled: 0, runs_conceded: 0,
    best_bowling_wickets: 0, best_bowling_runs: 0, maidens: 0,
  };

  const batAvg = (s.matches_batted - s.not_outs) > 0 ? (s.total_runs / (s.matches_batted - s.not_outs)).toFixed(1) : "—";
  const sr = s.balls_faced > 0 ? ((s.total_runs / s.balls_faced) * 100).toFixed(1) : "—";
  const econ = s.balls_bowled > 0 ? ((s.runs_conceded / s.balls_bowled) * 6).toFixed(2) : "—";
  const bowlAvg = s.total_wickets > 0 ? (s.runs_conceded / s.total_wickets).toFixed(1) : "—";

  const getRole = () => {
    const diff = batSkill - bowlSkill;
    if (diff > 20) return { role: "Batsman", color: "text-orange-500", icon: TrendingUp };
    if (diff < -20) return { role: "Bowler", color: "text-purple-500", icon: Target };
    return { role: "All-Rounder", color: "text-primary", icon: Zap };
  };
  const role = getRole();

  // Generate about points
  const aboutPoints: string[] = [];
  if (s.hundreds > 0) aboutPoints.push(`Has scored ${s.hundreds} centuries in competitive matches`);
  else if (s.fifties > 0) aboutPoints.push(`Consistent performer with ${s.fifties} half-centuries`);
  else if (s.total_runs > 100) aboutPoints.push(`Has accumulated ${s.total_runs} runs across ${s.matches_batted} innings`);

  if (s.total_wickets >= 10) aboutPoints.push(`Claimed ${s.total_wickets} wickets with best figures of ${s.best_bowling_wickets}/${s.best_bowling_runs}`);
  else if (s.total_wickets > 0) aboutPoints.push(`Has picked up ${s.total_wickets} wickets in ${s.matches_bowled} bowling outings`);

  if (s.sixes > 10) aboutPoints.push(`Power hitter with ${s.sixes} sixes and ${s.fours} fours in total`);
  else if (s.fours > 10) aboutPoints.push(`Elegant stroke-player with ${s.fours} fours across ${s.matches_batted} innings`);

  if (aboutPoints.length === 0) aboutPoints.push("Emerging talent looking to make a mark");

  // Pie chart: run scoring breakdown
  const singles = Math.max(0, s.total_runs - (s.fours * 4) - (s.sixes * 6));
  const runBreakdown = [
    { name: "1s & 2s & 3s", value: singles },
    { name: "Fours", value: s.fours * 4 },
    { name: "Sixes", value: s.sixes * 6 },
  ].filter(d => d.value > 0);

  // Last 5 innings bar data
  const last5Data = [...innings].reverse().map((inn, i) => ({
    label: `Inn ${i + 1}`,
    runs: inn.runs,
    balls: inn.balls_faced,
    sr: inn.balls_faced > 0 ? ((inn.runs / inn.balls_faced) * 100).toFixed(0) : "0",
    dismissed: inn.dismissed,
  }));

  return (
    <div className="min-h-screen bg-background">
      <CricketHeader />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Button onClick={() => navigate("/")} variant="ghost" className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" />Back
        </Button>

        {/* Hero Card */}
        <Card className="mb-6 overflow-hidden border-2 border-primary/20">
          <div className="relative h-28 bg-gradient-to-br from-primary via-primary/80 to-purple-600 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent)]" />
            {isOverseas && (
              <Badge className="absolute top-3 right-3 bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
                <Globe className="h-3 w-3 mr-1" />Overseas
              </Badge>
            )}
          </div>
          <CardContent className="p-6 -mt-14 relative">
            <div className="flex flex-col md:flex-row items-start gap-5">
              <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl">
                <AvatarImage src={imageUrl} alt={name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-3xl">
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pt-4 md:pt-6">
                <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-muted-foreground">{teamName}</span>
                  <Badge variant="outline" className={cn("text-xs", role.color)}>
                    <role.icon className="h-3 w-3 mr-1" />{role.role}
                  </Badge>
                </div>
                {/* About Points */}
                <ul className="mt-3 space-y-1">
                  {aboutPoints.map((pt, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Star className="h-3.5 w-3.5 mt-0.5 text-yellow-500 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
              {localPlayer && (
                <div className="hidden md:block">
                  <SkillRadarChart batting={batSkill} bowling={bowlSkill} size={140} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Matches", value: Math.max(s.matches_batted, s.matches_bowled), icon: Calendar },
            { label: "Runs", value: s.total_runs, icon: Award, accent: "text-orange-500" },
            { label: "Wickets", value: s.total_wickets, icon: Trophy, accent: "text-purple-500" },
            { label: "Highest", value: s.highest_score, icon: TrendingUp },
          ].map((stat) => (
            <Card key={stat.label} className="border">
              <CardContent className="p-4 text-center">
                <stat.icon className={cn("h-5 w-5 mx-auto mb-1", stat.accent || "text-muted-foreground")} />
                <div className={cn("text-2xl font-bold", stat.accent)}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Batting Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Swords className="h-4 w-4 text-orange-500" />Batting Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { l: "Innings", v: s.matches_batted },
                  { l: "Average", v: batAvg },
                  { l: "SR", v: sr },
                  { l: "50s", v: s.fifties },
                  { l: "100s", v: s.hundreds },
                  { l: "Not Outs", v: s.not_outs },
                  { l: "Fours", v: s.fours },
                  { l: "Sixes", v: s.sixes },
                  { l: "BF", v: s.balls_faced },
                ].map((item) => (
                  <div key={item.l} className="p-2 rounded-lg bg-muted/30">
                    <div className="text-lg font-bold">{item.v}</div>
                    <div className="text-[11px] text-muted-foreground">{item.l}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bowling Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-500" />Bowling Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { l: "Innings", v: s.matches_bowled },
                  { l: "Wickets", v: s.total_wickets },
                  { l: "Economy", v: econ },
                  { l: "Average", v: bowlAvg },
                  { l: "Best", v: `${s.best_bowling_wickets}/${s.best_bowling_runs}` },
                  { l: "Maidens", v: s.maidens },
                  { l: "Runs Given", v: s.runs_conceded },
                  { l: "Balls", v: s.balls_bowled },
                  { l: "BPW", v: s.total_wickets > 0 ? (s.balls_bowled / s.total_wickets).toFixed(1) : "—" },
                ].map((item) => (
                  <div key={item.l} className="p-2 rounded-lg bg-muted/30">
                    <div className="text-lg font-bold">{item.v}</div>
                    <div className="text-[11px] text-muted-foreground">{item.l}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Run Scoring Breakdown + Last 5 Innings */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Donut Chart */}
          {runBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Run Scoring Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={runBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {runBreakdown.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v} runs`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {runBreakdown.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last 5 Innings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Last 5 Innings</CardTitle>
            </CardHeader>
            <CardContent>
              {last5Data.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={last5Data}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-popover border rounded-lg p-2 shadow text-xs">
                              <p className="font-bold">{d.runs} ({d.balls}b)</p>
                              <p>SR: {d.sr} {d.dismissed ? "" : "• Not Out"}</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="runs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5">
                    {innings.map((inn, i) => (
                      <div key={inn.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-muted/20">
                        <span className="font-medium">
                          {inn.runs}{!inn.dismissed && <span className="text-primary">*</span>}
                          <span className="text-muted-foreground ml-1">({inn.balls_faced}b)</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {inn.fours > 0 && `${inn.fours}×4 `}{inn.sixes > 0 && `${inn.sixes}×6`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          SR {inn.balls_faced > 0 ? ((inn.runs / inn.balls_faced) * 100).toFixed(0) : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No innings data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Skill Bars (if local player data exists) */}
        {localPlayer && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Skill Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <StatProgressBar label="Batting Skill" value={batSkill} maxValue={100} color="gold" />
                <StatProgressBar label="Bowling Skill" value={bowlSkill} maxValue={100} color="purple" />
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PlayerProfile;
