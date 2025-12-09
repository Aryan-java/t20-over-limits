import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Crown } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";
import { useGameSession } from "@/hooks/useGameSession";

interface MultiplayerTeamsTabProps {
  controlledTeamId: string | null;
  isAdmin: boolean;
}

const MultiplayerTeamsTab = ({ controlledTeamId, isAdmin }: MultiplayerTeamsTabProps) => {
  const { teams } = useCricketStore();
  const { players } = useGameSession();

  const getTeamManager = (teamId: string) => {
    return players.find(p => p.team_id === teamId);
  };

  if (teams.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="space-y-3">
          <div className="text-4xl">🏏</div>
          <h3 className="text-lg font-medium">No teams yet</h3>
          <p className="text-muted-foreground">
            Teams were created in the lobby. If you don't see them, try refreshing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teams</h2>
          <p className="text-muted-foreground">Tournament teams - synced for all players</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {teams.length} Teams
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const manager = getTeamManager(team.id);
          const isYourTeam = team.id === controlledTeamId;
          const overseasCount = team.squad.filter(p => p.isOverseas).length;

          return (
            <Card 
              key={team.id} 
              className={`transition-all ${isYourTeam ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {team.name}
                    {isYourTeam && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Your Team
                      </Badge>
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{team.squad.length} Players</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{overseasCount} Overseas</span>
                  </div>
                </div>

                {manager && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Manager: {manager.nickname}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Top Players:</p>
                  <div className="flex flex-wrap gap-1">
                    {team.squad.slice(0, 5).map((player) => (
                      <Badge key={player.id} variant="secondary" className="text-xs">
                        {player.name.split(' ').pop()}
                      </Badge>
                    ))}
                    {team.squad.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{team.squad.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MultiplayerTeamsTab;
