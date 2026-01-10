import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAllTimeStats } from "@/hooks/useAllTimeStats";
import { User, TrendingUp, Target, Loader2, ChevronRight, RefreshCw, Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AllTimeStats() {
  const navigate = useNavigate();
  const { battingLeaderboard, bowlingLeaderboard, isLoading, refetch } = useAllTimeStats();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card className="border-2 shadow-lg">
        <CardContent className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading stats...</span>
          </div>
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

  const getMedalClass = (index: number) => {
    if (index === 0) return "medal-gold";
    if (index === 1) return "medal-silver";
    if (index === 2) return "medal-bronze";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card className="border-2 shadow-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 via-transparent to-primary/5 border-b">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="text-xl">All-Time Records</span>
            <p className="text-sm font-normal text-muted-foreground">Career statistics leaderboard</p>
          </div>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="batting" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
            <TabsTrigger value="batting" className="gap-2 text-sm font-semibold data-[state=active]:bg-cricket-gold data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4" />
              Batting Leaders
            </TabsTrigger>
            <TabsTrigger value="bowling" className="gap-2 text-sm font-semibold data-[state=active]:bg-cricket-purple data-[state=active]:text-white">
              <Target className="h-4 w-4" />
              Bowling Leaders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="batting" className="animate-fade-slide-up">
            {battingLeaderboard.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-4 py-3 bg-muted/50 rounded-lg uppercase tracking-wider">
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
                    className={cn(
                      "grid grid-cols-12 gap-2 items-center p-3 rounded-lg transition-all duration-200 cursor-pointer group",
                      index < 3 
                        ? "bg-gradient-to-r from-cricket-gold/10 to-transparent border border-cricket-gold/20 hover:from-cricket-gold/20" 
                        : "bg-card hover:bg-muted/50 border border-transparent hover:border-muted"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="col-span-1">
                      <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", getMedalClass(index))}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <Avatar className="h-9 w-9 border-2 border-cricket-gold/30">
                        <AvatarImage src={player.image_url || undefined} alt={player.player_name} />
                        <AvatarFallback className="bg-cricket-gold/10 text-cricket-gold">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-cricket-gold transition-colors">{player.player_name}</p>
                        {player.team_name && <p className="text-[10px] text-muted-foreground truncate">{player.team_name}</p>}
                      </div>
                    </div>
                    <div className="col-span-1 text-center text-sm">{player.matches_batted}</div>
                    <div className="col-span-2 text-center font-bold text-cricket-gold text-lg">{player.total_runs}</div>
                    <div className="col-span-1 text-center text-sm font-medium">{player.highest_score}{player.highest_score >= 100 && '*'}</div>
                    <div className="col-span-1 text-center text-sm">{calculateBattingAvg(player.total_runs, player.matches_batted, player.not_outs)}</div>
                    <div className="col-span-1 text-center text-sm">{calculateStrikeRate(player.total_runs, player.balls_faced)}</div>
                    <div className="col-span-1 text-center text-sm">{player.fifties}</div>
                    <div className="col-span-1 text-center text-sm flex items-center justify-center gap-1">
                      {player.hundreds}
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No batting records yet</p>
                <p className="text-sm mt-1">Complete matches to build all-time statistics</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bowling" className="animate-fade-slide-up">
            {bowlingLeaderboard.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-4 py-3 bg-muted/50 rounded-lg uppercase tracking-wider">
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
                    className={cn(
                      "grid grid-cols-12 gap-2 items-center p-3 rounded-lg transition-all duration-200 cursor-pointer group",
                      index < 3 
                        ? "bg-gradient-to-r from-cricket-purple/10 to-transparent border border-cricket-purple/20 hover:from-cricket-purple/20" 
                        : "bg-card hover:bg-muted/50 border border-transparent hover:border-muted"
                    )}
                  >
                    <div className="col-span-1">
                      <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", getMedalClass(index))}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <Avatar className="h-9 w-9 border-2 border-cricket-purple/30">
                        <AvatarImage src={player.image_url || undefined} alt={player.player_name} />
                        <AvatarFallback className="bg-cricket-purple/10 text-cricket-purple">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-cricket-purple transition-colors">{player.player_name}</p>
                        {player.team_name && <p className="text-[10px] text-muted-foreground truncate">{player.team_name}</p>}
                      </div>
                    </div>
                    <div className="col-span-1 text-center text-sm">{player.matches_bowled}</div>
                    <div className="col-span-2 text-center font-bold text-cricket-purple text-lg">{player.total_wickets}</div>
                    <div className="col-span-2 text-center text-sm font-medium">{player.best_bowling_wickets}/{player.best_bowling_runs}</div>
                    <div className="col-span-1 text-center text-sm">{calculateBowlingAvg(player.runs_conceded, player.total_wickets)}</div>
                    <div className="col-span-2 text-center text-sm flex items-center justify-center gap-1">
                      {calculateEconomy(player.runs_conceded, player.balls_bowled)}
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No bowling records yet</p>
                <p className="text-sm mt-1">Complete matches to build all-time statistics</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}