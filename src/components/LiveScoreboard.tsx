import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Match } from "@/types/cricket";
import { MatchConditions } from "@/types/weather";
import { User, Target, Zap, Flame, TrendingUp, Radio, Crosshair, Cloud, Sun, Droplets, Wind } from "lucide-react";
import OverProgress from "@/components/ui/OverProgress";
import AnimatedScore from "@/components/ui/AnimatedScore";
import { WEATHER_ICONS, PITCH_ICONS } from "@/types/weather";

interface LiveScoreboardProps {
  match: Match;
  conditions?: MatchConditions | null;
}

const LiveScoreboard = ({ match, conditions }: LiveScoreboardProps) => {
  const formatOvers = (balls: number) => {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
  };

  const getCurrentInnings = () => {
    return match.currentInnings === 1 ? match.firstInnings : match.secondInnings;
  };

  const getTargetInfo = () => {
    if (match.currentInnings === 2 && match.firstInnings) {
      const target = match.firstInnings.totalRuns + 1;
      const current = match.secondInnings?.totalRuns || 0;
      const required = target - current;
      const ballsLeft = (match.overs * 6) - (match.secondInnings?.ballsBowled || 0);
      const oversLeft = ballsLeft / 6;
      
      return {
        target,
        required,
        ballsLeft,
        oversLeft: formatOvers(ballsLeft),
        runRate: required > 0 && oversLeft > 0 ? (required / oversLeft).toFixed(2) : "0.00"
      };
    }
    return null;
  };

  const getCurrentOver = () => {
    const innings = getCurrentInnings();
    if (!innings || innings.overs.length === 0) return [];
    const lastOver = innings.overs[innings.overs.length - 1];
    return lastOver.balls.map(b => b.isWicket ? -1 : b.runs);
  };

  const currentInnings = getCurrentInnings();
  const targetInfo = getTargetInfo();
  const currentOverNumber = currentInnings ? Math.floor(currentInnings.ballsBowled / 6) : 0;
  const inPowerplay = currentOverNumber < 6;
  const inDeathOvers = currentOverNumber >= match.overs - 4;
  const currentRunRate = currentInnings && currentInnings.ballsBowled > 0 
    ? ((currentInnings.totalRuns / currentInnings.ballsBowled) * 6).toFixed(2)
    : "0.00";

  const getStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return 0;
    return ((runs / balls) * 100).toFixed(1);
  };

  return (
    <Card className="overflow-hidden scoreboard relative">
      {/* Animated border glow for live matches */}
      {match.isLive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-cricket-ball/20 to-primary/20 animate-pulse pointer-events-none" />
      )}
      
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent relative">
        {/* Stadium light effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-primary/20 blur-2xl rounded-full" />
        
        <CardTitle className="flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="relative p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur animate-pulse" />
            </div>
            <div>
              <span className="font-bold">Live Score</span>
              <div className="text-xs text-muted-foreground font-normal">
                Innings {match.currentInnings}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Weather & Pitch Indicators */}
            {conditions && (
              <div className="flex items-center gap-1.5 mr-2">
                <Badge variant="outline" className="gap-1 text-xs bg-background/50 backdrop-blur-sm">
                  <span>{WEATHER_ICONS[conditions.weather]}</span>
                  <span className="hidden sm:inline capitalize">{conditions.weather.replace('-', ' ')}</span>
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs bg-background/50 backdrop-blur-sm">
                  <span>{PITCH_ICONS[conditions.pitch]}</span>
                  <span className="hidden sm:inline capitalize">{conditions.pitch}</span>
                </Badge>
                {conditions.dewFactor > 50 && (
                  <Badge className="gap-1 text-xs bg-indigo-500/20 text-indigo-600 border-indigo-500/30">
                    <Droplets className="h-3 w-3" />
                    <span className="hidden sm:inline">Dew</span>
                  </Badge>
                )}
              </div>
            )}
            {currentInnings && !currentInnings.isCompleted && inPowerplay && (
              <Badge className="bg-gradient-to-r from-cricket-boundary to-blue-600 text-white text-xs gap-1.5 border-0 shadow-lg animate-pulse">
                <Zap className="h-3 w-3" />
                Powerplay
              </Badge>
            )}
            {currentInnings && !currentInnings.isCompleted && inDeathOvers && (
              <Badge className="bg-gradient-to-r from-cricket-ball to-red-700 text-white text-xs gap-1.5 border-0 shadow-lg">
                <Flame className="h-3 w-3" />
                Death Overs
              </Badge>
            )}
            {match.isLive && (
              <Badge className="bg-cricket-ball text-white gap-2 px-3 py-1.5 border-0 shadow-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                </span>
                LIVE
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-5 relative">
        {/* Main Score Display */}
        {currentInnings && (
          <div className="text-center space-y-4 py-6 relative">
            {/* Team name with gradient underline */}
            <div className="relative inline-block">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {currentInnings.battingTeam}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
            </div>
            
            {/* Score display with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
              <div className="relative flex items-baseline justify-center gap-2">
                <AnimatedScore 
                  value={currentInnings.totalRuns} 
                  className="text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70"
                />
                <span className="text-4xl text-muted-foreground/50 font-light">/</span>
                <span className="text-4xl font-bold text-destructive">
                  {currentInnings.wickets}
                </span>
              </div>
            </div>
            
            {/* Overs and run rate */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/50">
                <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">
                  {formatOvers(currentInnings.ballsBowled)} overs
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-bold">
                  CRR: {currentRunRate}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Current Over Progress */}
        {currentInnings && !currentInnings.isCompleted && (
          <div className="flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">This Over</span>
            </div>
            <OverProgress balls={getCurrentOver()} size="md" />
          </div>
        )}

        {/* Target Information */}
        {targetInfo && (
          <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/15 to-primary/10 p-5 rounded-xl border-2 border-primary/30">
            {/* Animated background pulse */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent animate-pulse" />
            
            <div className="relative grid grid-cols-4 gap-4 text-center">
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Target</div>
                <div className="text-2xl font-black text-primary">{targetInfo.target}</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Need</div>
                <div className="text-2xl font-black text-cricket-ball">{targetInfo.required}</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Balls</div>
                <div className="text-xl font-bold">{targetInfo.ballsLeft}</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">RRR</div>
                <div className={`text-xl font-bold ${
                  parseFloat(targetInfo.runRate) > 12 
                    ? 'text-destructive' 
                    : parseFloat(targetInfo.runRate) > 9 
                      ? 'text-accent' 
                      : 'text-cricket-green'
                }`}>
                  {targetInfo.runRate}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Batsmen */}
        {currentInnings && currentInnings.currentBatsmen.striker && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
              <Target className="h-4 w-4 text-primary" />
              At The Crease
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Striker */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl blur-sm group-hover:blur-md transition-all" />
                <div className="relative flex items-center gap-3 p-4 bg-card/80 backdrop-blur-sm rounded-xl border-2 border-primary/30 shadow-lg">
                  <Avatar className="h-14 w-14 border-2 border-primary/50 shadow-lg">
                    <AvatarImage src={currentInnings.currentBatsmen.striker.imageUrl} alt={currentInnings.currentBatsmen.striker.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                      <User className="h-7 w-7 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate flex items-center gap-1.5">
                      {currentInnings.currentBatsmen.striker.name}
                      <span className="text-primary text-lg">*</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xl font-black">{currentInnings.currentBatsmen.striker.runs}</span>
                      <span className="text-muted-foreground text-xs">({currentInnings.currentBatsmen.striker.balls})</span>
                    </div>
                    <div className={`text-xs font-semibold mt-0.5 ${
                      Number(getStrikeRate(currentInnings.currentBatsmen.striker.runs, currentInnings.currentBatsmen.striker.balls)) > 150 
                        ? 'text-cricket-green' 
                        : Number(getStrikeRate(currentInnings.currentBatsmen.striker.runs, currentInnings.currentBatsmen.striker.balls)) < 100 
                          ? 'text-destructive' 
                          : 'text-muted-foreground'
                    }`}>
                      SR: {getStrikeRate(currentInnings.currentBatsmen.striker.runs, currentInnings.currentBatsmen.striker.balls)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Non-Striker */}
              {currentInnings.currentBatsmen.nonStriker && (
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                  <Avatar className="h-14 w-14 border-2 border-muted">
                    <AvatarImage src={currentInnings.currentBatsmen.nonStriker.imageUrl} alt={currentInnings.currentBatsmen.nonStriker.name} />
                    <AvatarFallback className="bg-muted">
                      <User className="h-7 w-7 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-muted-foreground">
                      {currentInnings.currentBatsmen.nonStriker.name}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xl font-bold">{currentInnings.currentBatsmen.nonStriker.runs}</span>
                      <span className="text-muted-foreground text-xs">({currentInnings.currentBatsmen.nonStriker.balls})</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SR: {getStrikeRate(currentInnings.currentBatsmen.nonStriker.runs, currentInnings.currentBatsmen.nonStriker.balls)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Previous Innings Summary */}
        {match.firstInnings && match.currentInnings === 2 && (
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center justify-between text-sm p-3 bg-muted/20 rounded-lg">
              <span className="text-muted-foreground font-semibold">1st Innings</span>
              <span className="font-bold">
                {match.firstInnings.battingTeam}: 
                <span className="text-primary ml-1">{match.firstInnings.totalRuns}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-destructive">{match.firstInnings.wickets}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  ({formatOvers(match.firstInnings.ballsBowled)})
                </span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveScoreboard;
