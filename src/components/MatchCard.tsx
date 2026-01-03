import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Match } from "@/types/cricket";
import { Venue } from "@/data/venues";
import { Play, Eye, Clock, Trophy, MapPin, Target, Wind, Droplets } from "lucide-react";

interface MatchCardProps {
  match: Match;
  venue?: Venue;
  onStartMatch?: () => void;
  onViewMatch?: () => void;
  isFixture?: boolean;
}

const MatchCard = ({ match, venue, onStartMatch, onViewMatch, isFixture = false }: MatchCardProps) => {
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

  const getPitchBadgeColor = (pitchType: string) => {
    switch (pitchType) {
      case 'batting': return 'bg-green-100 text-green-800 border-green-300';
      case 'bowling': return 'bg-red-100 text-red-800 border-red-300';
      case 'balanced': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
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
      
      <CardContent className="space-y-3">
        {/* Venue Details Section */}
        {venue && isFixture && (
          <div className="p-3 bg-muted/40 rounded-lg border space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">{venue.name}</span>
              <span className="text-xs text-muted-foreground">({venue.city})</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Avg Score:</span>
                <span className="font-medium">{venue.avgFirstInningsScore}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Bat 1st Win:</span>
                <span className="font-medium">{venue.avgWinBatFirst}%</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className={`text-xs capitalize ${getPitchBadgeColor(venue.pitchType)}`}>
                {venue.pitchType} pitch
              </Badge>
              {venue.spinFriendliness >= 70 && (
                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300">
                  <Wind className="h-3 w-3 mr-1" />
                  Spin: {venue.spinFriendliness}%
                </Badge>
              )}
              {venue.paceFriendliness >= 70 && (
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                  <Target className="h-3 w-3 mr-1" />
                  Pace: {venue.paceFriendliness}%
                </Badge>
              )}
              {venue.dewFactor >= 70 && (
                <Badge variant="outline" className="text-xs bg-cyan-100 text-cyan-800 border-cyan-300">
                  <Droplets className="h-3 w-3 mr-1" />
                  High Dew
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Boundary: {venue.boundarySize}m
              </Badge>
            </div>
          </div>
        )}
        
        {/* Simple venue line for non-fixture cards */}
        {venue && !isFixture && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{venue.name}, {venue.city}</span>
            <Badge variant="outline" className="ml-2 text-xs capitalize">{venue.pitchType}</Badge>
          </div>
        )}

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
      </CardContent>
    </Card>
  );
};

export default MatchCard;