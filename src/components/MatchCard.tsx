import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Match } from "@/types/cricket";
import { Play, Eye, Clock, Trophy } from "lucide-react";

interface MatchCardProps {
  match: Match;
  onStartMatch?: () => void;
  onViewMatch?: () => void;
  isFixture?: boolean;
}

const MatchCard = ({ match, onStartMatch, onViewMatch, isFixture = false }: MatchCardProps) => {
  const canStart = true; // Always allow starting match, setup will be done in match setup dialog
  
  const getMatchStatus = () => {
    if (match.result) return "completed";
    if (match.isLive) return "live";
    if (canStart) return "ready";
    return "pending";
  };

  const status = getMatchStatus();
  
  const getStatusBadge = () => {
    switch (status) {
      case "live":
        return <Badge className="bg-cricket-ball text-white animate-pulse">🔴 Live</Badge>;
      case "completed":
        return <Badge className="bg-cricket-green text-white">Completed</Badge>;
      case "ready":
        return <Badge className="bg-accent text-accent-foreground">Ready to Setup</Badge>;
      default:
        return <Badge variant="outline">Ready to Setup</Badge>;
    }
  };

  const getCurrentScore = () => {
    if (!match.isLive) return null;
    
    const currentInnings = match.currentInnings === 1 ? match.firstInnings : match.secondInnings;
    if (!currentInnings) return null;
    
    const overs = Math.floor(currentInnings.ballsBowled / 6);
    const balls = currentInnings.ballsBowled % 6;
    
    return (
      <div className="text-sm font-mono">
        {currentInnings.totalRuns}/{currentInnings.wickets} ({overs}.{balls})
      </div>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            <div className="flex items-center space-x-2">
              <span>{match.team1.name}</span>
              <span className="text-muted-foreground">vs</span>
              <span>{match.team2.name}</span>
            </div>
          </CardTitle>
          {getStatusBadge()}
        </div>
        {match.tossWinner && (
          <p className="text-sm text-muted-foreground">
            Toss: {match.tossWinner.name} won, chose to {match.tossChoice} first
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            {(status === "ready" || status === "pending") && onStartMatch && (
              <Button onClick={onStartMatch} className="flex-1 bg-cricket-green hover:bg-cricket-green/90">
                <Play className="h-4 w-4 mr-1" />
                Setup & Start
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

export default MatchCard;