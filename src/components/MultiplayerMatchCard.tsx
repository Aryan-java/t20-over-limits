import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Match, Team } from "@/types/cricket";
import { Play, Eye, CheckCircle, Clock, Users } from "lucide-react";

interface MultiplayerMatchCardProps {
  team1: Team;
  team2: Team;
  match?: Match | null;
  onStartMatch?: () => void;
  onViewMatch?: () => void;
  isFixture?: boolean;
  // Multiplayer props
  controlledTeamId?: string | null;
  readyTeams?: string[];
  onTeamReady?: (teamId: string) => void;
  isAdmin?: boolean;
}

const MultiplayerMatchCard = ({ 
  team1,
  team2,
  match, 
  onStartMatch, 
  onViewMatch, 
  isFixture = false,
  controlledTeamId,
  readyTeams = [],
  onTeamReady,
  isAdmin = false,
}: MultiplayerMatchCardProps) => {
  const getMatchStatus = () => {
    if (match?.result) return "completed";
    if (match?.isLive) return "live";
    return "pending";
  };

  const status = getMatchStatus();
  
  const team1Ready = readyTeams.includes(team1.id);
  const team2Ready = readyTeams.includes(team2.id);
  const bothTeamsReady = team1Ready && team2Ready;
  
  const controlsTeam1 = controlledTeamId === team1.id;
  const controlsTeam2 = controlledTeamId === team2.id;
  const controlsAnyTeam = controlsTeam1 || controlsTeam2;
  const isSpectator = !controlsAnyTeam;
  
  const myTeamReady = (controlsTeam1 && team1Ready) || (controlsTeam2 && team2Ready);

  const getStatusBadge = () => {
    if (bothTeamsReady) {
      return <Badge className="bg-cricket-green text-white">Both Teams Ready!</Badge>;
    }
    switch (status) {
      case "live":
        return <Badge className="bg-cricket-ball text-white animate-pulse">🔴 Live</Badge>;
      case "completed":
        return <Badge className="bg-cricket-green text-white">Completed</Badge>;
      default:
        return <Badge variant="outline">Awaiting Teams</Badge>;
    }
  };

  const handleReady = () => {
    if (controlsTeam1 && onTeamReady) {
      onTeamReady(team1.id);
    } else if (controlsTeam2 && onTeamReady) {
      onTeamReady(team2.id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span>{team1.name}</span>
                {team1Ready && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
              <span className="text-muted-foreground text-sm">vs</span>
              <div className="flex items-center gap-2">
                <span>{team2.name}</span>
                {team2Ready && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
            </div>
          </CardTitle>
          {getStatusBadge()}
        </div>
        {match?.tossWinner && (
          <p className="text-sm text-muted-foreground">
            Toss: {match.tossWinner.name} won, chose to {match.tossChoice} first
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Ready status indicator */}
          {status === "pending" && (
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Waiting for both teams to be ready</span>
              </div>
              <div className="flex gap-4 text-xs">
                <span className={team1Ready ? "text-green-500" : "text-muted-foreground"}>
                  {team1.name}: {team1Ready ? "Ready" : "Not ready"}
                </span>
                <span className={team2Ready ? "text-green-500" : "text-muted-foreground"}>
                  {team2.name}: {team2Ready ? "Ready" : "Not ready"}
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            {/* Ready Button for team managers */}
            {status === "pending" && controlsAnyTeam && !myTeamReady && (
              <Button 
                onClick={handleReady} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                I'm Ready
              </Button>
            )}

            {/* Waiting indicator after pressing ready */}
            {status === "pending" && controlsAnyTeam && myTeamReady && !bothTeamsReady && (
              <Button disabled variant="outline" className="flex-1">
                <Clock className="h-4 w-4 mr-1 animate-spin" />
                Waiting for opponent...
              </Button>
            )}

            {/* Start Match Button - shown only when both teams are ready */}
            {status === "pending" && bothTeamsReady && onStartMatch && (
              <Button 
                onClick={onStartMatch} 
                className="flex-1 bg-cricket-green hover:bg-cricket-green/90"
              >
                <Play className="h-4 w-4 mr-1" />
                Setup & Start Match
              </Button>
            )}

            {/* Spectator view */}
            {status === "pending" && isSpectator && (
              <Button disabled variant="outline" className="flex-1">
                <Users className="h-4 w-4 mr-1" />
                Spectating
              </Button>
            )}
            
            {status === "live" && onViewMatch && (
              <Button onClick={onViewMatch} className="flex-1" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                Watch Live
              </Button>
            )}
            
            {status === "completed" && onViewMatch && (
              <Button onClick={onViewMatch} className="flex-1" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                View Scorecard
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiplayerMatchCard;