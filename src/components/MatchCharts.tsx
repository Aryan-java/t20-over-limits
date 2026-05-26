import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Match, Innings } from "@/types/cricket";
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceDot,
} from "recharts";

interface MatchChartsProps {
  match: Match;
}

interface OverPoint {
  over: number;
  runs: number;
  wickets: number;
  cumulative: number;
  phase: "powerplay" | "middle" | "death";
}

const phaseColor = (over: number, totalOvers: number): string => {
  if (over <= 6) return "hsl(217 91% 60%)";
  if (over > totalOvers - 4) return "hsl(0 84% 60%)";
  return "hsl(142 70% 45%)";
};

const buildOverData = (innings: Innings | null, totalOvers: number): OverPoint[] => {
  if (!innings || !innings.overs) return [];
  let cumulative = 0;
  return innings.overs.map((ov) => {
    const runs = ov.balls.reduce(
      (s, b) => s + (b.runs || 0) + (b.extras?.runs || 0),
      0
    );
    const wickets = ov.balls.filter((b) => b.isWicket).length;
    cumulative += runs;
    const overNum = ov.overNumber;
    const phase: OverPoint["phase"] =
      overNum <= 6 ? "powerplay" : overNum > totalOvers - 4 ? "death" : "middle";
    return { over: overNum, runs, wickets, cumulative, phase };
  });
};

const buildBoundaries = (innings: Innings | null) => {
  if (!innings) return [] as { x: number; y: number; runs: 4 | 6; batsman: string; over: number }[];
  const pts: { x: number; y: number; runs: 4 | 6; batsman: string; over: number }[] = [];
  innings.overs.forEach((ov) => {
    ov.balls.forEach((b, i) => {
      if (b.runs === 4 || b.runs === 6) {
        // Deterministic-ish angle per ball
        const seed = (ov.overNumber * 31 + i * 7 + b.batsman.length) % 360;
        const angleDeg = seed;
        const radius = b.runs === 6 ? 95 : 75;
        const rad = (angleDeg * Math.PI) / 180;
        pts.push({
          x: 100 + Math.cos(rad) * radius,
          y: 100 + Math.sin(rad) * radius,
          runs: b.runs as 4 | 6,
          batsman: b.batsman,
          over: ov.overNumber,
        });
      }
    });
  });
  return pts;
};

const MatchCharts = ({ match }: MatchChartsProps) => {
  const t1Name = match.team1.name;
  const t2Name = match.team2.name;

  const firstData = useMemo(() => buildOverData(match.firstInnings, match.overs), [match]);
  const secondData = useMemo(() => buildOverData(match.secondInnings, match.overs), [match]);

  // Merge for worm chart
  const wormData = useMemo(() => {
    const max = Math.max(firstData.length, secondData.length);
    const arr: { over: number; first?: number; second?: number; firstWicket?: number; secondWicket?: number }[] = [];
    for (let i = 0; i < max; i++) {
      arr.push({
        over: i + 1,
        first: firstData[i]?.cumulative,
        second: secondData[i]?.cumulative,
        firstWicket: firstData[i]?.wickets ? firstData[i].cumulative : undefined,
        secondWicket: secondData[i]?.wickets ? secondData[i].cumulative : undefined,
      });
    }
    return arr;
  }, [firstData, secondData]);

  const firstInningsBattingTeam = match.firstInnings?.battingTeam || t1Name;
  const secondInningsBattingTeam = match.secondInnings?.battingTeam || t2Name;

  const boundariesFirst = useMemo(() => buildBoundaries(match.firstInnings), [match]);
  const boundariesSecond = useMemo(() => buildBoundaries(match.secondInnings), [match]);

  const ManhattanChart = ({ data, label }: { data: OverPoint[]; label: string }) => (
    <div>
      <p className="text-sm font-semibold mb-2">{label}</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="over" tickLine={false} className="text-xs" />
            <YAxis tickLine={false} className="text-xs" />
            <Tooltip
              contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
              formatter={(v: number, k: string) => (k === "runs" ? [`${v} runs`, `Over`] : [v, k])}
              labelFormatter={(l) => `Over ${l}`}
            />
            <Bar dataKey="runs" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={phaseColor(d.over, match.overs)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const WagonWheel = ({
    pts,
    label,
  }: {
    pts: { x: number; y: number; runs: 4 | 6; batsman: string; over: number }[];
    label: string;
  }) => (
    <div>
      <p className="text-sm font-semibold mb-2">{label}</p>
      <div className="relative aspect-square max-w-[260px] mx-auto">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Field */}
          <circle cx="100" cy="100" r="95" fill="hsl(142 50% 25% / 0.25)" stroke="hsl(142 60% 40% / 0.6)" strokeWidth="1" />
          <circle cx="100" cy="100" r="55" fill="hsl(142 50% 30% / 0.3)" stroke="hsl(142 60% 45% / 0.5)" strokeDasharray="2 2" strokeWidth="0.6" />
          {/* Pitch */}
          <rect x="93" y="78" width="14" height="44" rx="2" fill="hsl(40 50% 65%)" opacity="0.7" />
          {/* Divider lines */}
          {[0, 45, 90, 135].map((a) => {
            const r = (a * Math.PI) / 180;
            return (
              <line
                key={a}
                x1={100 - Math.cos(r) * 95}
                y1={100 - Math.sin(r) * 95}
                x2={100 + Math.cos(r) * 95}
                y2={100 + Math.sin(r) * 95}
                stroke="hsl(var(--border))"
                strokeWidth="0.4"
                strokeDasharray="1 2"
              />
            );
          })}
          {/* Boundary shots */}
          {pts.map((p, i) => (
            <line
              key={i}
              x1={100}
              y1={100}
              x2={p.x}
              y2={p.y}
              stroke={p.runs === 6 ? "hsl(0 85% 60%)" : "hsl(217 91% 60%)"}
              strokeWidth={p.runs === 6 ? 1.6 : 1.1}
              opacity={0.85}
            />
          ))}
          {pts.map((p, i) => (
            <circle
              key={`d-${i}`}
              cx={p.x}
              cy={p.y}
              r={p.runs === 6 ? 2.6 : 1.8}
              fill={p.runs === 6 ? "hsl(0 85% 60%)" : "hsl(217 91% 60%)"}
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-center gap-3 mt-2 text-xs">
        <Badge variant="outline" className="border-blue-500/40 text-blue-500">
          Fours: {pts.filter((p) => p.runs === 4).length}
        </Badge>
        <Badge variant="outline" className="border-red-500/40 text-red-500">
          Sixes: {pts.filter((p) => p.runs === 6).length}
        </Badge>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-lg">Match Insights</span>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="border-blue-500/40 text-blue-500">⚡ Powerplay</Badge>
            <Badge variant="outline" className="border-green-500/40 text-green-500">Middle</Badge>
            <Badge variant="outline" className="border-red-500/40 text-red-500">🔥 Death</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="worm" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="worm">Worm</TabsTrigger>
            <TabsTrigger value="manhattan">Manhattan</TabsTrigger>
            <TabsTrigger value="wagon">Wagon Wheel</TabsTrigger>
          </TabsList>

          <TabsContent value="worm" className="pt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wormData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="over" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                    labelFormatter={(l) => `After Over ${l}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="first"
                    name={firstInningsBattingTeam}
                    stroke="hsl(217 91% 60%)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="second"
                    name={secondInningsBattingTeam}
                    stroke="hsl(330 80% 60%)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  {wormData.map(
                    (d, i) =>
                      d.firstWicket !== undefined && (
                        <ReferenceDot
                          key={`fw-${i}`}
                          x={d.over}
                          y={d.firstWicket}
                          r={4}
                          fill="hsl(0 84% 60%)"
                          stroke="hsl(217 91% 60%)"
                        />
                      )
                  )}
                  {wormData.map(
                    (d, i) =>
                      d.secondWicket !== undefined && (
                        <ReferenceDot
                          key={`sw-${i}`}
                          x={d.over}
                          y={d.secondWicket}
                          r={4}
                          fill="hsl(0 84% 60%)"
                          stroke="hsl(330 80% 60%)"
                        />
                      )
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Red dots = wickets. Both teams' run progression compared.
            </p>
          </TabsContent>

          <TabsContent value="manhattan" className="pt-4 space-y-6">
            {firstData.length > 0 && <ManhattanChart data={firstData} label={`${firstInningsBattingTeam} — Runs per Over`} />}
            {secondData.length > 0 && <ManhattanChart data={secondData} label={`${secondInningsBattingTeam} — Runs per Over`} />}
            {firstData.length === 0 && secondData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No overs bowled yet.</p>
            )}
          </TabsContent>

          <TabsContent value="wagon" className="pt-4 grid md:grid-cols-2 gap-6">
            <WagonWheel pts={boundariesFirst} label={`${firstInningsBattingTeam} boundaries`} />
            <WagonWheel pts={boundariesSecond} label={`${secondInningsBattingTeam} boundaries`} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MatchCharts;
