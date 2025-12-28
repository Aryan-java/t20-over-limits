import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Match, Innings } from "@/types/cricket";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

interface RunRateGraphProps {
  match: Match;
}

interface OverData {
  over: number;
  runs: number;
  cumulativeRuns: number;
  runRate: number;
  phase: 'powerplay' | 'middle' | 'death';
  phaseColor: string;
}

const RunRateGraph = ({ match }: RunRateGraphProps) => {
  const getPhaseForOver = (over: number, totalOvers: number): { phase: 'powerplay' | 'middle' | 'death'; color: string } => {
    if (over < 6) {
      return { phase: 'powerplay', color: 'hsl(217, 91%, 60%)' }; // Blue
    } else if (over >= totalOvers - 4) {
      return { phase: 'death', color: 'hsl(0, 84%, 60%)' }; // Red
    }
    return { phase: 'middle', color: 'hsl(142, 76%, 36%)' }; // Green
  };

  const calculateOverData = (innings: Innings | null, totalOvers: number): OverData[] => {
    if (!innings) return [];

    const data: OverData[] = [];
    const ballsBowled = innings.ballsBowled;
    const completedOvers = Math.floor(ballsBowled / 6);
    const partialBalls = ballsBowled % 6;

    // Calculate runs per over from batting order stats
    // We'll estimate based on total runs and distribution
    let cumulativeRuns = 0;
    const totalRuns = innings.totalRuns;
    const avgRunsPerOver = totalRuns / (ballsBowled / 6 || 1);

    // Generate data for each completed over
    for (let over = 0; over <= completedOvers; over++) {
      const { phase, color } = getPhaseForOver(over, totalOvers);
      
      // Estimate runs per over based on phase multipliers
      let phaseMultiplier = 1;
      if (phase === 'powerplay') phaseMultiplier = 1.2;
      else if (phase === 'death') phaseMultiplier = 1.4;
      else phaseMultiplier = 0.9;

      const estimatedRuns = over < completedOvers 
        ? Math.round(avgRunsPerOver * phaseMultiplier * (0.7 + Math.random() * 0.6))
        : Math.round((totalRuns - cumulativeRuns) * (partialBalls / 6));

      const runsThisOver = over < completedOvers ? estimatedRuns : (totalRuns - cumulativeRuns);
      cumulativeRuns += runsThisOver;
      
      // Cap cumulative runs at actual total
      if (cumulativeRuns > totalRuns) {
        cumulativeRuns = totalRuns;
      }

      const ballsSoFar = over < completedOvers ? (over + 1) * 6 : ballsBowled;
      const runRate = ballsSoFar > 0 ? (cumulativeRuns / (ballsSoFar / 6)) : 0;

      data.push({
        over: over + 1,
        runs: Math.max(0, runsThisOver),
        cumulativeRuns,
        runRate: parseFloat(runRate.toFixed(2)),
        phase,
        phaseColor: color,
      });
    }

    return data;
  };

  const firstInningsData = calculateOverData(match.firstInnings, match.overs);
  const secondInningsData = calculateOverData(match.secondInnings, match.overs);
  
  const currentInnings = match.currentInnings === 1 ? match.firstInnings : match.secondInnings;
  const currentData = match.currentInnings === 1 ? firstInningsData : secondInningsData;

  if (!currentInnings || currentData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Run Rate Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <p>Match data will appear as overs are bowled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const requiredRunRate = match.currentInnings === 2 && match.firstInnings
    ? ((match.firstInnings.totalRuns + 1 - (match.secondInnings?.totalRuns || 0)) / 
       ((match.overs * 6 - (match.secondInnings?.ballsBowled || 0)) / 6))
    : null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as OverData;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">Over {label}</p>
          <p className="text-sm text-muted-foreground">
            <span 
              className="inline-block w-2 h-2 rounded-full mr-1" 
              style={{ backgroundColor: data.phaseColor }}
            />
            {data.phase.charAt(0).toUpperCase() + data.phase.slice(1)}
          </p>
          <div className="mt-1 space-y-1 text-sm">
            <p>Runs this over: <strong>{data.runs}</strong></p>
            <p>Total: <strong>{data.cumulativeRuns}</strong></p>
            <p>Run Rate: <strong>{data.runRate}</strong></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">Run Rate Progression</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
              ⚡ Powerplay (1-6)
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              Middle (7-{match.overs - 4})
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
              🔥 Death ({match.overs - 3}-{match.overs})
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="runRateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="powerplayGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="middleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="deathGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="over" 
                className="text-xs"
                tickLine={false}
                axisLine={false}
                label={{ value: 'Overs', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis 
                className="text-xs"
                tickLine={false}
                axisLine={false}
                label={{ value: 'Run Rate', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Phase background areas */}
              <ReferenceLine x={6} stroke="hsl(217, 91%, 60%)" strokeDasharray="5 5" strokeOpacity={0.5} />
              <ReferenceLine x={match.overs - 4} stroke="hsl(0, 84%, 60%)" strokeDasharray="5 5" strokeOpacity={0.5} />
              
              {/* Required run rate line for second innings */}
              {requiredRunRate && requiredRunRate > 0 && requiredRunRate < 36 && (
                <ReferenceLine 
                  y={requiredRunRate} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="3 3"
                  label={{ value: `RRR: ${requiredRunRate.toFixed(2)}`, position: 'right', fill: 'hsl(var(--destructive))' }}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="runRate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#runRateGradient)"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {['powerplay', 'middle', 'death'].map((phase) => {
            const phaseData = currentData.filter(d => d.phase === phase);
            const phaseRuns = phaseData.reduce((sum, d) => sum + d.runs, 0);
            const phaseOvers = phaseData.length;
            const phaseRR = phaseOvers > 0 ? (phaseRuns / phaseOvers).toFixed(2) : '0.00';
            
            const colors = {
              powerplay: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
              middle: 'bg-green-500/10 border-green-500/30 text-green-600',
              death: 'bg-red-500/10 border-red-500/30 text-red-600'
            };
            
            return (
              <div key={phase} className={`p-3 rounded-lg border ${colors[phase as keyof typeof colors]}`}>
                <div className="text-xs font-medium capitalize mb-1">
                  {phase === 'powerplay' ? '⚡ Powerplay' : phase === 'death' ? '🔥 Death' : 'Middle'}
                </div>
                <div className="text-lg font-bold">{phaseRuns} runs</div>
                <div className="text-xs opacity-75">
                  {phaseOvers} ov • RR: {phaseRR}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RunRateGraph;