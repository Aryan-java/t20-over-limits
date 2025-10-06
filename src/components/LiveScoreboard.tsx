import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Match } from "@/types/cricket";
import { User } from "lucide-react";

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

  const currentInnings = getCurrentInnings();
  const targetInfo = getTargetInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Score</span>
          {match.isLive && (
            <Badge className="bg-cricket-ball text-white animate-pulse">🔴 Live</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Current Innings Score */}
          {currentInnings && (
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold">
                {currentInnings.totalRuns}/{currentInnings.wickets}
              </div>
              <div className="text-lg text-muted-foreground">
                {formatOvers(currentInnings.ballsBowled)} overs
              </div>
              <div className="text-sm text-muted-foreground">
                {currentInnings.battingTeam}
              </div>
            </div>
          )}

          {/* Target Information */}
          {targetInfo && (
            <div className="bg-cricket-pitch p-4 rounded-lg border">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Target</div>
                  <div className="text-xl font-bold">{targetInfo.target}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Required</div>
                  <div className="text-xl font-bold">{targetInfo.required}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Balls Left</div>
                  <div className="text-lg font-semibold">{targetInfo.ballsLeft}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Req RR</div>
                  <div className="text-lg font-semibold">{targetInfo.runRate}</div>
                </div>
              </div>
            </div>
          )}

          {/* Current Batsmen */}
          {currentInnings && currentInnings.currentBatsmen.striker && (
            <div className="space-y-3">
              <h4 className="font-semibold">Current Batsmen</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={currentInnings.currentBatsmen.striker.imageUrl} alt={currentInnings.currentBatsmen.striker.name} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {currentInnings.currentBatsmen.striker.name} *
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentInnings.currentBatsmen.striker.runs}({currentInnings.currentBatsmen.striker.balls})
                    </div>
                  </div>
                </div>
                {currentInnings.currentBatsmen.nonStriker && (
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={currentInnings.currentBatsmen.nonStriker.imageUrl} alt={currentInnings.currentBatsmen.nonStriker.name} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {currentInnings.currentBatsmen.nonStriker.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {currentInnings.currentBatsmen.nonStriker.runs}({currentInnings.currentBatsmen.nonStriker.balls})
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
              <h4 className="font-semibold mb-2">First Innings</h4>
              <div className="text-sm text-muted-foreground">
                {match.firstInnings.battingTeam}: {match.firstInnings.totalRuns}/{match.firstInnings.wickets} 
                ({formatOvers(match.firstInnings.ballsBowled)} overs)
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveScoreboard;