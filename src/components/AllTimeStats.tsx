import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllTimeStats } from "@/hooks/useAllTimeStats";
import { User, TrendingUp, Target, Loader2, ChevronRight } from "lucide-react";
export default function AllTimeStats() {
  const navigate = useNavigate();
  const { battingLeaderboard, bowlingLeaderboard, isLoading } = useAllTimeStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const calculateBattingAvg = (runs: number, matches: number, notOuts: number) => {
    const innings = matches - notOuts;
    if (innings <= 0) return runs > 0 ? "∞" : "0.00";
    return (runs / innings).toFixed(2);
  };

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return "0.00";
    return ((runs / balls) * 100).toFixed(2);
  };

  const calculateBowlingAvg = (runs: number, wickets: number) => {
    if (wickets === 0) return "-";
    return (runs / wickets).toFixed(2);
  };

  const calculateEconomy = (runs: number, balls: number) => {
    if (balls === 0) return "0.00";
    return ((runs / balls) * 6).toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          All-Time Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="batting" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="batting" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Batting
            </TabsTrigger>
            <TabsTrigger value="bowling" className="gap-2">
              <Target className="h-4 w-4" />
              Bowling
            </TabsTrigger>
          </TabsList>

          <TabsContent value="batting">
            {battingLeaderboard.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/50 rounded-lg">
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
                {battingLeaderboard.slice(0, 15).map((player, index) => (
                  <div
                    key={player.id}
                    onClick={() => navigate(`/player/${player.player_id}`)}
                    className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg transition-colors cursor-pointer group ${
                      index === 0 ? 'bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20' : 'bg-background/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="col-span-1 font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.image_url || undefined} alt={player.player_name} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-sm truncate">{player.player_name}</p>
                    </div>
                    <div className="col-span-1 text-center text-sm">{player.matches_batted}</div>
                    <div className="col-span-2 text-center font-bold text-orange-600">{player.total_runs}</div>
                    <div className="col-span-1 text-center text-sm">{player.highest_score}</div>
                    <div className="col-span-1 text-center text-sm">
                      {calculateBattingAvg(player.total_runs, player.matches_batted, player.not_outs)}
                    </div>
                    <div className="col-span-1 text-center text-sm">
                      {calculateStrikeRate(player.total_runs, player.balls_faced)}
                    </div>
                    <div className="col-span-1 text-center text-sm">{player.fifties}</div>
                    <div className="col-span-1 text-center text-sm flex items-center justify-center gap-1">
                      {player.hundreds}
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No batting stats recorded yet</p>
                <p className="text-sm mt-1">Complete matches to build all-time records</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bowling">
            {bowlingLeaderboard.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted/50 rounded-lg">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Player</div>
                  <div className="col-span-1 text-center">M</div>
                  <div className="col-span-2 text-center">Wkts</div>
                  <div className="col-span-2 text-center">Best</div>
                  <div className="col-span-1 text-center">Avg</div>
                  <div className="col-span-2 text-center">Econ</div>
                </div>
                {bowlingLeaderboard.slice(0, 15).map((player, index) => (
                  <div
                    key={player.id}
                    onClick={() => navigate(`/player/${player.player_id}`)}
                    className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg transition-colors cursor-pointer group ${
                      index === 0 ? 'bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20' : 'bg-background/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="col-span-1 font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={player.image_url || undefined} alt={player.player_name} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-sm truncate">{player.player_name}</p>
                    </div>
                    <div className="col-span-1 text-center text-sm">{player.matches_bowled}</div>
                    <div className="col-span-2 text-center font-bold text-purple-600">{player.total_wickets}</div>
                    <div className="col-span-2 text-center text-sm">
                      {player.best_bowling_wickets}/{player.best_bowling_runs}
                    </div>
                    <div className="col-span-1 text-center text-sm">
                      {calculateBowlingAvg(player.runs_conceded, player.total_wickets)}
                    </div>
                    <div className="col-span-2 text-center text-sm flex items-center justify-center gap-1">
                      {calculateEconomy(player.runs_conceded, player.balls_bowled)}
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No bowling stats recorded yet</p>
                <p className="text-sm mt-1">Complete matches to build all-time records</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
