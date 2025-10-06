import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Innings, Player } from "@/types/cricket";

interface DetailedScorecardProps {
  innings: Innings;
  title: string;
  target?: number;
  bowlers?: Player[];
}

const DetailedScorecard = ({ innings, title, target, bowlers }: DetailedScorecardProps) => {
  const formatOvers = (balls: number) => {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
  };

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return "0.00";
    return ((runs / balls) * 100).toFixed(2);
  };

  const calculateEconomy = (runs: number, balls: number) => {
    if (balls === 0) return "0.00";
    return ((runs / balls) * 6).toFixed(2);
  };

  const oversToBalls = (overs: number) => {
    const whole = Math.floor(overs);
    const balls = Math.round((overs - whole) * 10);
    return whole * 6 + balls;
  };

  const formatOversValue = (overs: number) => {
    const balls = oversToBalls(overs);
    const ov = Math.floor(balls / 6);
    const rem = balls % 6;
    return `${ov}.${rem}`;
  };

  const getBattingStatus = (player: any) => {
    if (player.dismissed) {
      return `${player.dismissalInfo}`;
    }
    if (player === innings.currentBatsmen.striker) {
      return "batting*";
    }
    if (player === innings.currentBatsmen.nonStriker) {
      return "batting";
    }
    return "not out";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {innings.totalRuns}/{innings.wickets}
            </Badge>
            <Badge variant="secondary">
              {formatOvers(innings.ballsBowled)} overs
            </Badge>
            {target && (
              <Badge variant={innings.totalRuns >= target ? "default" : "destructive"}>
                Target: {target}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Batting Scorecard */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-cricket-primary">Batting</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Batsman</th>
                  <th className="text-right py-2 font-medium">R</th>
                  <th className="text-right py-2 font-medium">B</th>
                  <th className="text-right py-2 font-medium">4s</th>
                  <th className="text-right py-2 font-medium">6s</th>
                  <th className="text-right py-2 font-medium">SR</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {innings.battingOrder
                  .filter(player => player.balls > 0 || player.dismissed ||
                    player.id === innings.currentBatsmen.striker?.id ||
                    player.id === innings.currentBatsmen.nonStriker?.id)
                  .map((player, index) => (
                    <tr key={player.id} className="border-b hover:bg-muted/50">
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.imageUrl} alt={player.name} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{player.name}</span>
                          {(player === innings.currentBatsmen.striker || player === innings.currentBatsmen.nonStriker) && (
                            <Badge variant="outline" className="text-xs">
                              {player === innings.currentBatsmen.striker ? "*" : ""}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-2 font-medium">{player.runs}</td>
                      <td className="text-right py-2">{player.balls}</td>
                      <td className="text-right py-2">{player.fours}</td>
                      <td className="text-right py-2">{player.sixes}</td>
                      <td className="text-right py-2">{calculateStrikeRate(player.runs, player.balls)}</td>
                      <td className="text-left py-2 text-sm text-muted-foreground">
                        {getBattingStatus(player)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bowling Figures */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-cricket-primary">Bowling</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Bowler</th>
                  <th className="text-right py-2 font-medium">O</th>
                  <th className="text-right py-2 font-medium">M</th>
                  <th className="text-right py-2 font-medium">R</th>
                  <th className="text-right py-2 font-medium">W</th>
                  <th className="text-right py-2 font-medium">Econ</th>
                </tr>
              </thead>
              <tbody>
                {bowlers && bowlers.filter(b => oversToBalls(b.oversBowled) > 0).map((bowler) => {
                  const balls = oversToBalls(bowler.oversBowled);
                  return (
                    <tr key={bowler.id} className="border-b hover:bg-muted/50">
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={bowler.imageUrl} alt={bowler.name} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <span>{bowler.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-2">{formatOversValue(bowler.oversBowled)}</td>
                      <td className="text-right py-2">{bowler.maidens || 0}</td>
                      <td className="text-right py-2">{bowler.runsConceded}</td>
                      <td className="text-right py-2">{bowler.wickets}</td>
                      <td className="text-right py-2">{calculateEconomy(bowler.runsConceded, balls)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Match Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cricket-primary">{innings.totalRuns}</div>
            <div className="text-sm text-muted-foreground">Total Runs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cricket-accent">{innings.wickets}</div>
            <div className="text-sm text-muted-foreground">Wickets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatOvers(innings.ballsBowled)}</div>
            <div className="text-sm text-muted-foreground">Overs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {calculateEconomy(innings.totalRuns, innings.ballsBowled)}
            </div>
            <div className="text-sm text-muted-foreground">Run Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailedScorecard;