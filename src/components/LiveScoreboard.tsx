import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Match } from "@/types/cricket";
import { MatchConditions } from "@/types/weather";
import { User, Target, Zap, Flame, TrendingUp, Radio, Crosshair, Droplets } from "lucide-react";
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
      {/* Live match glow border */}
      {match.isLive && (
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary via-cricket-ball to-cricket-gold opacity-50 blur-sm pointer-events-none" />
      )}
      
      <CardHeader className="pb-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cricket-gold/5" />
        
        <CardTitle className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/20">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-bold text-base">Live Score</span>
              <div className="text-xs text-muted-foreground font-medium tracking-wide">
                Innings {match.currentInnings}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {conditions && (
              <div className="flex items-center gap-1 mr-1">
                <Badge variant="outline" className="gap-1 text-xs bg-background/60 backdrop-blur-sm border-border/40 px-2 py-0.5">
                  <span className="text-sm">{WEATHER_ICONS[conditions.weather]}</span>
                  <span className="hidden sm:inline capitalize text-[11px]">{conditions.weather.replace('-', ' ')}</span>
                </Badge>
                <Badge variant="outline" className="gap-1 text-xs bg-background/60 backdrop-blur-sm border-border/40 px-2 py-0.5">
                  <span className="text-sm">{PITCH_ICONS[conditions.pitch]}</span>
                  <span className="hidden sm:inline capitalize text-[11px]">{conditions.pitch}</span>
                </Badge>
                {conditions.dewFactor > 50 && (
                  <Badge className="gap-0.5 text-[11px] bg-indigo-500/15 text-indigo-400 border-indigo-500/30 px-1.5 py-0.5">
                    <Droplets className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            )}
            {currentInnings && !currentInnings.isCompleted && inPowerplay && (
              <Badge className="bg-cricket-boundary text-white text-xs gap-1 border-0 shadow-sm font-semibold px-2 py-0.5">
                <Zap className="h-3 w-3" />
                Powerplay
              </Badge>
            )}
            {currentInnings && !currentInnings.isCompleted && inDeathOvers && (
              <Badge className="bg-cricket-ball text-white text-xs gap-1 border-0 shadow-sm font-semibold px-2 py-0.5">
                <Flame className="h-3 w-3" />
                Death
              </Badge>
            )}
            {match.isLive && (
              <Badge className="bg-cricket-ball text-white gap-1.5 px-3 py-1 border-0 shadow-md shadow-cricket-ball/20 font-bold text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
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
          <div className="text-center space-y-4 py-6">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
              {currentInnings.battingTeam}
            </div>
            
            {/* Score */}
            <div className="relative py-2">
              <div className="flex items-baseline justify-center gap-2">
                <AnimatedScore 
                  value={currentInnings.totalRuns} 
                  className="text-6xl md:text-7xl font-black tracking-tighter text-foreground"
                />
                <span className="text-4xl text-muted-foreground/25 font-light">/</span>
                <span className="text-4xl font-bold text-destructive">
                  {currentInnings.wickets}
                </span>
              </div>
            </div>
            
            {/* Overs and run rate */}
            <div className="flex items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/50">
                <Radio className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold">
                  {formatOvers(currentInnings.ballsBowled)} ov
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

        {/* Current Over */}
        {currentInnings && !currentInnings.isCompleted && (
          <div className="flex flex-col items-center gap-2 p-3 bg-muted/20 rounded-lg border border-border/40">
            <div className="flex items-center gap-1.5">
              <Crosshair className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">This Over</span>
            </div>
            <OverProgress balls={getCurrentOver()} size="md" />
          </div>
        )}

        {/* Target Info */}
        {targetInfo && (
          <div className="bg-primary/8 p-4 rounded-lg border border-primary/20">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Target</div>
                <div className="text-xl font-black text-primary mt-0.5">{targetInfo.target}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Need</div>
                <div className="text-xl font-black text-cricket-ball mt-0.5">{targetInfo.required}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Balls</div>
                <div className="text-lg font-bold mt-0.5">{targetInfo.ballsLeft}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">RRR</div>
                <div className={`text-lg font-bold mt-0.5 ${
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
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Target className="h-3.5 w-3.5 text-primary" />
              At The Crease
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Striker */}
              <div className="flex items-center gap-2.5 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Avatar className="h-11 w-11 border-2 border-primary/30">
                  <AvatarImage src={currentInnings.currentBatsmen.striker.imageUrl} alt={currentInnings.currentBatsmen.striker.name} />
                  <AvatarFallback className="bg-primary/10 text-sm">
                    <User className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate flex items-center gap-1">
                    {currentInnings.currentBatsmen.striker.name}
                    <span className="text-primary">*</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-black">{currentInnings.currentBatsmen.striker.runs}</span>
                    <span className="text-muted-foreground text-xs">({currentInnings.currentBatsmen.striker.balls})</span>
                  </div>
                  <div className={`text-[11px] font-semibold ${
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

              {/* Non-Striker */}
              {currentInnings.currentBatsmen.nonStriker && (
                <div className="flex items-center gap-2.5 p-3 bg-muted/20 rounded-lg border border-border/40">
                  <Avatar className="h-11 w-11 border border-muted">
                    <AvatarImage src={currentInnings.currentBatsmen.nonStriker.imageUrl} alt={currentInnings.currentBatsmen.nonStriker.name} />
                    <AvatarFallback className="bg-muted text-sm">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-muted-foreground">
                      {currentInnings.currentBatsmen.nonStriker.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-lg font-bold">{currentInnings.currentBatsmen.nonStriker.runs}</span>
                      <span className="text-muted-foreground text-xs">({currentInnings.currentBatsmen.nonStriker.balls})</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      SR: {getStrikeRate(currentInnings.currentBatsmen.nonStriker.runs, currentInnings.currentBatsmen.nonStriker.balls)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Previous Innings */}
        {match.firstInnings && match.currentInnings === 2 && (
          <div className="border-t border-border/40 pt-3">
            <div className="flex items-center justify-between text-sm p-2.5 bg-muted/15 rounded-lg">
              <span className="text-muted-foreground font-medium text-xs">1st Innings</span>
              <span className="font-bold text-sm">
                {match.firstInnings.battingTeam}: 
                <span className="text-primary ml-1">{match.firstInnings.totalRuns}</span>
                <span className="text-muted-foreground/50">/</span>
                <span className="text-destructive">{match.firstInnings.wickets}</span>
                <span className="text-muted-foreground ml-1.5 text-xs">
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
