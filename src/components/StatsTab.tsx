import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Trophy, Target, Users } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";

const StatsTab = () => {
  const { teams, fixtures } = useCricketStore();

  const totalMatches = fixtures.length;
  const playedMatches = fixtures.filter(f => f.played).length;
  const totalPlayers = teams.reduce((sum, team) => sum + team.squad.length, 0);
  const overseasPlayers = teams.reduce((sum, team) => 
    sum + team.squad.filter(p => p.isOverseas).length, 0
  );

  const getTeamStats = () => {
    return teams.map(team => {
      const avgBatSkill = Math.round(
        team.squad.reduce((sum, p) => sum + p.batSkill, 0) / team.squad.length
      );
      const avgBowlSkill = Math.round(
        team.squad.reduce((sum, p) => sum + p.bowlSkill, 0) / team.squad.length
      );
      const overseasCount = team.squad.filter(p => p.isOverseas).length;
      
      return {
        ...team,
        avgBatSkill,
        avgBowlSkill,
        overseasCount,
        totalSkill: avgBatSkill + avgBowlSkill,
      };
    }).sort((a, b) => b.totalSkill - a.totalSkill);
  };

  const teamStats = getTeamStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tournament Statistics</h2>
          <p className="text-muted-foreground">Overview of teams, players, and performance</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-cricket-green" />
              <div>
                <div className="text-2xl font-bold">{teams.length}</div>
                <div className="text-sm text-muted-foreground">Teams</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-accent" />
              <div>
                <div className="text-2xl font-bold">{totalPlayers}</div>
                <div className="text-sm text-muted-foreground">Total Players</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-cricket-stumps" />
              <div>
                <div className="text-2xl font-bold">{playedMatches}/{totalMatches}</div>
                <div className="text-sm text-muted-foreground">Matches Played</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-cricket-ball" />
              <div>
                <div className="text-2xl font-bold">{overseasPlayers}</div>
                <div className="text-sm text-muted-foreground">Overseas Players</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Team Rankings by Skill</CardTitle>
        </CardHeader>
        <CardContent>
          {teamStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No teams to display
            </div>
          ) : (
            <div className="space-y-4">
              {teamStats.map((team, index) => (
                <div 
                  key={team.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-cricket-green text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{team.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {team.squad.length} players • {team.overseasCount} overseas
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Batting</div>
                      <div className="font-semibold">{team.avgBatSkill}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Bowling</div>
                      <div className="font-semibold">{team.avgBowlSkill}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Overall</div>
                      <Badge 
                        className={
                          team.totalSkill >= 140 
                            ? "bg-cricket-green text-white"
                            : team.totalSkill >= 120
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {team.totalSkill}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Batsmen by Skill</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const allPlayers = teams.flatMap(t => t.squad);
              const topBatsmen = allPlayers
                .sort((a, b) => b.batSkill - a.batSkill)
                .slice(0, 5);
              
              return topBatsmen.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No players to display
                </div>
              ) : (
                <div className="space-y-3">
                  {topBatsmen.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 text-center font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          {player.isOverseas && (
                            <Badge variant="outline" className="text-xs">Overseas</Badge>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-cricket-green text-white">
                        {player.batSkill}
                      </Badge>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Bowlers by Skill</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const allPlayers = teams.flatMap(t => t.squad);
              const topBowlers = allPlayers
                .sort((a, b) => b.bowlSkill - a.bowlSkill)
                .slice(0, 5);
              
              return topBowlers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No players to display
                </div>
              ) : (
                <div className="space-y-3">
                  {topBowlers.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 text-center font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          {player.isOverseas && (
                            <Badge variant="outline" className="text-xs">Overseas</Badge>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-cricket-ball text-white">
                        {player.bowlSkill}
                      </Badge>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsTab;