import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAllTimeStats } from "@/hooks/useAllTimeStats";
import { User, TrendingUp, Target, Loader2, ChevronRight, RefreshCw, Trophy, Crown, Medal, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AllTimeStats() {
  const navigate = useNavigate();
  const { battingLeaderboard, bowlingLeaderboard, isLoading, isError, refetch } = useAllTimeStats();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card className="stadium-card">
        <CardContent className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Loading records...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="stadium-card">
        <CardContent className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Trophy className="h-12 w-12 text-destructive opacity-50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Failed to load records</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
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

  const getMedalIcon = (index: number) => {
    if (index === 0) return Crown;
    if (index === 1) return Medal;
    if (index === 2) return Medal;
    return Star;
  };

  const getMedalClass = (index: number) => {
    if (index === 0) return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30";
    if (index === 1) return "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/30";
    if (index === 2) return "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card className="stadium-card overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cricket-gold/10 to-cricket-purple/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b relative">
        <CardTitle className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-cricket-gold to-cricket-gold/80 rounded-xl shadow-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div className="absolute inset-0 bg-cricket-gold/30 rounded-xl blur-md" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-cricket-gold animate-pulse" />
          </div>
          <div>
            <span className="text-2xl font-bold">All-Time Records</span>
            <p className="text-sm font-normal text-muted-foreground">Career statistics leaderboard</p>
          </div>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 border-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent className="p-6 relative">
        <Tabs defaultValue="batting" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-14 p-1.5 bg-muted/50">
            <TabsTrigger 
              value="batting" 
              className="gap-2.5 text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <TrendingUp className="h-4 w-4" />
              Batting Leaders
            </TabsTrigger>
            <TabsTrigger 
              value="bowling" 
              className="gap-2.5 text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Target className="h-4 w-4" />
              Bowling Leaders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="batting" className="animate-fade-slide-up">
            {battingLeaderboard.length > 0 ? (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-4 py-3 bg-gradient-to-r from-orange-500/10 to-transparent rounded-xl uppercase tracking-wider border border-orange-500/10">
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
                
                {/* Rows */}
                {battingLeaderboard.slice(0, 15).map((player, index) => {
                  const MedalIcon = getMedalIcon(index);
                  return (
                    <div
                      key={player.id}
                      onClick={() => navigate(`/player/${player.player_id}`)}
                      className={cn(
                        "grid grid-cols-12 gap-2 items-center p-3 rounded-xl transition-all duration-300 cursor-pointer group animate-fade-slide-up",
                        index < 3 
                          ? "bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border-2 border-orange-500/20 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10" 
                          : "bg-card/50 hover:bg-muted/50 border border-transparent hover:border-border"
                      )}
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className="col-span-1">
                        <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110", getMedalClass(index))}>
                          {index < 3 ? <MedalIcon className="h-4 w-4" /> : index + 1}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="relative">
                          <Avatar className={cn("h-10 w-10 border-2 transition-all", index === 0 ? "border-yellow-500 ring-2 ring-yellow-500/30" : "border-orange-500/30")}>
                            <AvatarImage src={player.image_url || undefined} alt={player.player_name} />
                            <AvatarFallback className="bg-orange-500/10 text-orange-600">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Crown className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate group-hover:text-orange-600 transition-colors">{player.player_name}</p>
                          {player.team_name && <p className="text-[10px] text-muted-foreground truncate">{player.team_name}</p>}
                        </div>
                      </div>
                      <div className="col-span-1 text-center text-sm font-medium">{player.matches_batted}</div>
                      <div className="col-span-2 text-center">
                        <span className="font-black text-xl text-orange-600">{player.total_runs}</span>
                      </div>
                      <div className="col-span-1 text-center text-sm font-semibold">
                        {player.highest_score}
                        {player.highest_score >= 100 && <span className="text-orange-500">*</span>}
                      </div>
                      <div className="col-span-1 text-center text-sm">{calculateBattingAvg(player.total_runs, player.matches_batted, player.not_outs)}</div>
                      <div className="col-span-1 text-center text-sm">{calculateStrikeRate(player.total_runs, player.balls_faced)}</div>
                      <div className="col-span-1 text-center text-sm font-medium">{player.fifties}</div>
                      <div className="col-span-1 text-center text-sm flex items-center justify-center gap-1 font-medium">
                        {player.hundreds}
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-orange-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <div className="relative inline-block mb-4">
                  <TrendingUp className="h-20 w-20 opacity-20" />
                  <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-2xl" />
                </div>
                <p className="text-xl font-bold mb-2">No Batting Records Yet</p>
                <p className="text-sm">Complete matches to build all-time statistics</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bowling" className="animate-fade-slide-up">
            {bowlingLeaderboard.length > 0 ? (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-4 py-3 bg-gradient-to-r from-purple-500/10 to-transparent rounded-xl uppercase tracking-wider border border-purple-500/10">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Player</div>
                  <div className="col-span-1 text-center">M</div>
                  <div className="col-span-2 text-center">Wkts</div>
                  <div className="col-span-2 text-center">Best</div>
                  <div className="col-span-1 text-center">Avg</div>
                  <div className="col-span-2 text-center">Econ</div>
                </div>
                
                {/* Rows */}
                {bowlingLeaderboard.slice(0, 15).map((player, index) => {
                  const MedalIcon = getMedalIcon(index);
                  return (
                    <div
                      key={player.id}
                      onClick={() => navigate(`/player/${player.player_id}`)}
                      className={cn(
                        "grid grid-cols-12 gap-2 items-center p-3 rounded-xl transition-all duration-300 cursor-pointer group animate-fade-slide-up",
                        index < 3 
                          ? "bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border-2 border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10" 
                          : "bg-card/50 hover:bg-muted/50 border border-transparent hover:border-border"
                      )}
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className="col-span-1">
                        <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110", getMedalClass(index))}>
                          {index < 3 ? <MedalIcon className="h-4 w-4" /> : index + 1}
                        </span>
                      </div>
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="relative">
                          <Avatar className={cn("h-10 w-10 border-2 transition-all", index === 0 ? "border-purple-500 ring-2 ring-purple-500/30" : "border-purple-500/30")}>
                            <AvatarImage src={player.image_url || undefined} alt={player.player_name} />
                            <AvatarFallback className="bg-purple-500/10 text-purple-600">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                              <Crown className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate group-hover:text-purple-600 transition-colors">{player.player_name}</p>
                          {player.team_name && <p className="text-[10px] text-muted-foreground truncate">{player.team_name}</p>}
                        </div>
                      </div>
                      <div className="col-span-1 text-center text-sm font-medium">{player.matches_bowled}</div>
                      <div className="col-span-2 text-center">
                        <span className="font-black text-xl text-purple-600">{player.total_wickets}</span>
                      </div>
                      <div className="col-span-2 text-center text-sm font-semibold">
                        {player.best_bowling_wickets}/{player.best_bowling_runs}
                      </div>
                      <div className="col-span-1 text-center text-sm">{calculateBowlingAvg(player.runs_conceded, player.total_wickets)}</div>
                      <div className="col-span-2 text-center text-sm flex items-center justify-center gap-1">
                        <span className={cn(
                          parseFloat(calculateEconomy(player.runs_conceded, player.balls_bowled)) < 7 
                            ? "text-cricket-green font-semibold" 
                            : parseFloat(calculateEconomy(player.runs_conceded, player.balls_bowled)) > 9 
                              ? "text-destructive" 
                              : ""
                        )}>
                          {calculateEconomy(player.runs_conceded, player.balls_bowled)}
                        </span>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-purple-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <div className="relative inline-block mb-4">
                  <Target className="h-20 w-20 opacity-20" />
                  <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-2xl" />
                </div>
                <p className="text-xl font-bold mb-2">No Bowling Records Yet</p>
                <p className="text-sm">Complete matches to build all-time statistics</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
