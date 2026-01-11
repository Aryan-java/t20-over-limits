import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Match } from "@/types/cricket";
import { Venue, getBowlingRecommendation } from "@/data/venues";
import { Play, Eye, Trophy, MapPin, Target, Wind, Droplets, Sun, Moon, CloudSun, Thermometer, Zap, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  venue?: Venue;
  onStartMatch?: () => void;
  onViewMatch?: () => void;
  isFixture?: boolean;
}

const MatchCard = ({ match, venue, onStartMatch, onViewMatch, isFixture = false }: MatchCardProps) => {
  const canStart = true;
  
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
        return (
          <Badge className="bg-cricket-ball text-white gap-1.5">
            <span className="w-2 h-2 bg-white rounded-full animate-live-dot" />
            LIVE
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-cricket-green text-white gap-1">
            <Trophy className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "ready":
        return (
          <Badge className="bg-gradient-to-r from-accent to-cricket-gold text-accent-foreground gap-1">
            <Play className="h-3 w-3" />
            Ready
          </Badge>
        );
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getPitchBadgeColor = (pitchType: string) => {
    switch (pitchType) {
      case 'batting': return 'bg-cricket-green/10 text-cricket-green border-cricket-green/30';
      case 'bowling': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'balanced': return 'bg-primary/10 text-primary border-primary/30';
      case 'spin': return 'bg-cricket-purple/10 text-cricket-purple border-cricket-purple/30';
      case 'pace': return 'bg-accent/10 text-accent border-accent/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMatchTimeIcon = (matchTime: string) => {
    switch (matchTime) {
      case 'day': return <Sun className="h-3 w-3" />;
      case 'night': return <Moon className="h-3 w-3" />;
      case 'day-night': return <CloudSun className="h-3 w-3" />;
      default: return <Sun className="h-3 w-3" />;
    }
  };

  const getRecommendationColor = (type: 'spin' | 'pace' | 'balanced') => {
    switch (type) {
      case 'spin': return 'bg-cricket-purple/10 border-cricket-purple/30 text-cricket-purple';
      case 'pace': return 'bg-accent/10 border-accent/30 text-accent';
      case 'balanced': return 'bg-primary/10 border-primary/30 text-primary';
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 card-hover",
      status === "live" && "ring-2 ring-cricket-ball/50 shadow-wicket",
      status === "completed" && "border-cricket-green/30"
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            <div className="flex items-center gap-2">
              <span className="font-bold">{match.team1.name}</span>
              <Swords className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold">{match.team2.name}</span>
            </div>
          </CardTitle>
          {getStatusBadge()}
        </div>
        {match.tossWinner && (
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">{match.tossWinner.name}</span> won toss, elected to {match.tossChoice} first
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Venue Details Section */}
        {venue && isFixture && (
          <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
            {/* Venue Name & Weather */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{venue.name}</span>
                <span className="text-xs text-muted-foreground">({venue.city})</span>
              </div>
            </div>
            
            {/* Weather Conditions */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="gap-1 bg-amber-50 border-amber-200 text-amber-800">
                {getMatchTimeIcon(venue.weather.matchTime)}
                <span className="capitalize">{venue.weather.matchTime.replace('-', '/')}</span>
              </Badge>
              <Badge variant="outline" className="gap-1 bg-red-50 border-red-200 text-red-700">
                <Thermometer className="h-3 w-3" />
                {venue.weather.avgTemperature}°C
              </Badge>
              <Badge variant="outline" className="gap-1 bg-sky-50 border-sky-200 text-sky-700">
                <Droplets className="h-3 w-3" />
                {venue.weather.humidity}% humid
              </Badge>
              <Badge variant="outline" className="gap-1 capitalize">
                <Wind className="h-3 w-3" />
                {venue.weather.windSpeed}
              </Badge>
            </div>

            {/* Match Stats */}
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
            
            {/* Pitch Badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className={`text-xs capitalize ${getPitchBadgeColor(venue.pitchType)}`}>
                {venue.pitchType} pitch
              </Badge>
              {venue.spinFriendliness >= 60 && (
                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300">
                  Spin: {venue.spinFriendliness}%
                </Badge>
              )}
              {venue.paceFriendliness >= 60 && (
                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                  Pace: {venue.paceFriendliness}%
                </Badge>
              )}
              {venue.dewFactor >= 70 && (
                <Badge variant="outline" className="text-xs bg-cyan-100 text-cyan-800 border-cyan-300">
                  <Droplets className="h-3 w-3 mr-1" />
                  High Dew
                </Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">
                {venue.boundarySize} boundary
              </Badge>
            </div>

            {/* Bowling Recommendation */}
            {(() => {
              const recommendation = getBowlingRecommendation(venue);
              return (
                <div className={`p-2 rounded-md border ${getRecommendationColor(recommendation.type)}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3.5 w-3.5" />
                    <span className="font-semibold text-xs">{recommendation.priority}</span>
                  </div>
                  <p className="text-xs opacity-90">{recommendation.description}</p>
                </div>
              );
            })()}
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

        <div className="flex gap-2">
          {(status === "ready" || status === "pending") && onStartMatch && (
            <Button 
              onClick={onStartMatch} 
              className="flex-1 bg-gradient-to-r from-cricket-green to-cricket-grass hover:from-cricket-green/90 hover:to-cricket-grass/90 shadow-md transition-all duration-300 hover:shadow-lg"
            >
              <Play className="h-4 w-4 mr-1" />
              Setup & Start
            </Button>
          )}
          
          {status === "live" && onViewMatch && (
            <Button onClick={onViewMatch} className="flex-1 border-cricket-ball text-cricket-ball hover:bg-cricket-ball/10" variant="outline">
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