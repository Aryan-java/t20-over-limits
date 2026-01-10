import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Match } from "@/types/cricket";
import { User, Target, Zap, Flame, TrendingUp } from "lucide-react";
import OverProgress from "@/components/ui/OverProgress";
import AnimatedScore from "@/components/ui/AnimatedScore";

interface LiveScoreboardProps {
  match: Match;
}

const LiveScoreboard = ({ match }: LiveScoreboardProps) => {
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
    <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-transparent to-primary/5">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span>Live Score</span>
          </div>
          <div className="flex items-center gap-2">
            {currentInnings && !currentInnings.isCompleted && inPowerplay && (
              <Badge className="bg-cricket-boundary text-white text-xs gap-1 animate-pulse-slow">
                <Zap className="h-3 w-3" />
                Powerplay
              </Badge>
            )}
            {currentInnings && !currentInnings.isCompleted && inDeathOvers && (
              <Badge className="bg-cricket-ball text-white text-xs gap-1">
                <Flame className="h-3 w-3" />
                Death Overs
              </Badge>
            )}
            {match.isLive && (
              <Badge className="bg-cricket-ball text-white gap-1.5">
                <span className="w-2 h-2 bg-white rounded-full animate-live-dot" />
                LIVE
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Main Score Display */}
        {currentInnings && (
          <div className="text-center space-y-3 py-4">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {currentInnings.battingTeam}
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <AnimatedScore 
                value={currentInnings.totalRuns} 
                className="text-5xl font-bold tracking-tight"
              />
              <span className="text-3xl text-muted-foreground">/</span>
              <span className="text-3xl font-semibold text-destructive">
                {currentInnings.wickets}
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {formatOvers(currentInnings.ballsBowled)} overs
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-primary font-medium">
                CRR: {currentRunRate}
              </span>
            </div>
          </div>
        )}

        {/* Current Over Progress */}
        {currentInnings && !currentInnings.isCompleted && (
          <div className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground font-medium">This Over</span>
            <OverProgress balls={getCurrentOver()} size="md" />
          </div>
        )}

        {/* Target Information */}
        {targetInfo && (
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 rounded-xl border border-primary/20">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Target</div>
                <div className="text-xl font-bold text-primary">{targetInfo.target}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Need</div>
                <div className="text-xl font-bold text-cricket-ball">{targetInfo.required}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Balls</div>
                <div className="text-lg font-semibold">{targetInfo.ballsLeft}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">RRR</div>
                <div className={`text-lg font-semibold ${parseFloat(targetInfo.runRate) > 12 ? 'text-destructive' : parseFloat(targetInfo.runRate) > 9 ? 'text-accent' : 'text-cricket-green'}`}>
                  {targetInfo.runRate}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Batsmen */}
        {currentInnings && currentInnings.currentBatsmen.striker && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              At The Crease
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Striker */}
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarImage src={currentInnings.currentBatsmen.striker.imageUrl} alt={currentInnings.currentBatsmen.striker.name} />
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate flex items-center gap-1">
                    {currentInnings.currentBatsmen.striker.name}
                    <span className="text-primary">*</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold">{currentInnings.currentBatsmen.striker.runs}</span>
                    <span className="text-muted-foreground text-xs">({currentInnings.currentBatsmen.striker.balls})</span>
                  </div>
                  <div className={`text-[10px] font-medium ${
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
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Avatar className="h-12 w-12 border-2 border-muted">
                    <AvatarImage src={currentInnings.currentBatsmen.nonStriker.imageUrl} alt={currentInnings.currentBatsmen.nonStriker.name} />
                    <AvatarFallback className="bg-muted">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-muted-foreground">
                      {currentInnings.currentBatsmen.nonStriker.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold">{currentInnings.currentBatsmen.nonStriker.runs}</span>
                      <span className="text-muted-foreground text-xs">({currentInnings.currentBatsmen.nonStriker.balls})</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
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
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">1st Innings</span>
              <span className="font-semibold">
                {match.firstInnings.battingTeam}: {match.firstInnings.totalRuns}/{match.firstInnings.wickets}
                <span className="text-muted-foreground ml-1">
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