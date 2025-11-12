import { useParams, useNavigate } from "react-router-dom";
import { useCricketStore } from "@/hooks/useCricketStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowLeft, TrendingUp, Trophy, Target, Award, User, Calendar } from "lucide-react";
import CricketHeader from "@/components/CricketHeader";

const PlayerProfile = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { teams, matchHistory } = useCricketStore();

  // Find the player across all teams
  let player = null;
  let team = null;
  
  for (const t of teams) {
    const foundPlayer = t.squad.find(p => p.id === playerId);
    if (foundPlayer) {
      player = foundPlayer;
      team = t;
      break;
    }
  }

  if (!player || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30">
        <CricketHeader />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">Player not found</p>
              <Button onClick={() => navigate("/")} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const performanceHistory = player.performanceHistory || {
    totalMatches: 0,
    totalRuns: 0,
    totalWickets: 0,
    averageRuns: 0,
    averageWickets: 0,
    formRating: 50,
  };

  // Get match-by-match performance
  const playerMatchPerformance = matchHistory
    .filter(match => {
      const team1Players = match.team1Setup?.playingXI || [];
      const team2Players = match.team2Setup?.playingXI || [];
      return [...team1Players, ...team2Players].some(p => p.id === playerId);
    })
    .map((match, index) => {
      const team1Players = match.team1Setup?.playingXI || [];
      const team2Players = match.team2Setup?.playingXI || [];
      const allPlayers = [...team1Players, ...team2Players];
      const playerInMatch = allPlayers.find(p => p.id === playerId);
      
      return {
        matchNumber: index + 1,
        opponent: match.team1.id === team.id ? match.team2.name : match.team1.name,
        runs: playerInMatch?.runs || 0,
        wickets: playerInMatch?.wickets || 0,
        balls: playerInMatch?.balls || 0,
        date: new Date(match.completedAt).toLocaleDateString(),
        strikeRate: playerInMatch?.balls ? ((playerInMatch.runs / playerInMatch.balls) * 100).toFixed(1) : "0.0",
      };
    });

  // Calculate cumulative stats for graphs
  let cumulativeRuns = 0;
  let cumulativeWickets = 0;
  const cumulativeData = playerMatchPerformance.map((match) => {
    cumulativeRuns += match.runs;
    cumulativeWickets += match.wickets;
    return {
      matchNumber: match.matchNumber,
      cumulativeRuns,
      cumulativeWickets,
    };
  });

  const strikeRate = performanceHistory.totalMatches > 0 && player.balls > 0
    ? ((performanceHistory.totalRuns / player.balls) * 100).toFixed(1)
    : "N/A";

  const economy = performanceHistory.totalMatches > 0 && player.oversBowled > 0
    ? (player.runsConceded / player.oversBowled).toFixed(2)
    : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30">
      <CricketHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tournament
        </Button>

        {/* Player Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={player.imageUrl} alt={player.name} />
                <AvatarFallback>
                  <User className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{player.name}</h1>
                  {player.isOverseas && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                      Overseas Player
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground mb-4">{team.name}</p>
                
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Bat Skill: <strong>{player.batSkill}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Bowl Skill: <strong>{player.bowlSkill}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{performanceHistory.totalMatches}</div>
              <div className="text-sm text-muted-foreground">Matches</div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200 bg-orange-500/5">
            <CardContent className="p-4 text-center">
              <Award className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold text-orange-600">{performanceHistory.totalRuns}</div>
              <div className="text-sm text-muted-foreground">Total Runs</div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-500/5">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-purple-600">{performanceHistory.totalWickets}</div>
              <div className="text-sm text-muted-foreground">Total Wickets</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{performanceHistory.averageRuns.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Runs</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats & Graphs */}
        <Tabs defaultValue="graphs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="graphs">Career Graphs</TabsTrigger>
            <TabsTrigger value="matches">Match History</TabsTrigger>
            <TabsTrigger value="stats">Detailed Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="graphs" className="space-y-4">
            {playerMatchPerformance.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Cumulative Runs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={cumulativeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="matchNumber" 
                          label={{ value: 'Match Number', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis label={{ value: 'Runs', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="cumulativeRuns" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Total Runs"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cumulative Wickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={cumulativeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="matchNumber" 
                          label={{ value: 'Match Number', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis label={{ value: 'Wickets', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="cumulativeWickets" 
                          stroke="hsl(var(--purple-500))" 
                          strokeWidth={2}
                          name="Total Wickets"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Match-by-Match Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={playerMatchPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="matchNumber" 
                          label={{ value: 'Match Number', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="runs" fill="hsl(var(--primary))" name="Runs" />
                        <Bar dataKey="wickets" fill="hsl(var(--purple-500))" name="Wickets" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground">No match data available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Stats will appear once the player completes matches</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Match-by-Match Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {playerMatchPerformance.length > 0 ? (
                  <div className="space-y-3">
                    {playerMatchPerformance.map((match) => (
                      <Card key={match.matchNumber} className="border">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">Match {match.matchNumber}</Badge>
                                <span className="text-sm text-muted-foreground">{match.date}</span>
                              </div>
                              <p className="font-semibold">vs {match.opponent}</p>
                            </div>
                            <div className="flex gap-6 text-sm">
                              <div>
                                <p className="text-muted-foreground">Runs</p>
                                <p className="text-lg font-bold text-orange-600">{match.runs}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Balls</p>
                                <p className="text-lg font-bold">{match.balls}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">SR</p>
                                <p className="text-lg font-bold">{match.strikeRate}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Wickets</p>
                                <p className="text-lg font-bold text-purple-600">{match.wickets}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>No match history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Award className="h-5 w-5" />
                    Batting Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Runs</div>
                      <div className="text-2xl font-bold">{performanceHistory.totalRuns}</div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Average</div>
                      <div className="text-2xl font-bold">{performanceHistory.averageRuns.toFixed(1)}</div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Strike Rate</div>
                      <div className="text-2xl font-bold">{strikeRate}</div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Bat Skill</div>
                      <div className="text-2xl font-bold">{player.batSkill}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <Trophy className="h-5 w-5" />
                    Bowling Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Wickets</div>
                      <div className="text-2xl font-bold">{performanceHistory.totalWickets}</div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Average</div>
                      <div className="text-2xl font-bold">{performanceHistory.averageWickets.toFixed(1)}</div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Economy</div>
                      <div className="text-2xl font-bold">{economy}</div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Bowl Skill</div>
                      <div className="text-2xl font-bold">{player.bowlSkill}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Overall Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Matches Played</div>
                      <div className="text-2xl font-bold">{performanceHistory.totalMatches}</div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Form Rating</div>
                      <div className="text-2xl font-bold">{performanceHistory.formRating.toFixed(0)}</div>
                    </div>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <div className="text-sm text-muted-foreground">Player Type</div>
                      <div className="text-lg font-bold">
                        {player.batSkill > 70 && player.bowlSkill > 70 ? "All-rounder" :
                         player.batSkill > 70 ? "Batsman" :
                         player.bowlSkill > 70 ? "Bowler" : "Specialist"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PlayerProfile;
