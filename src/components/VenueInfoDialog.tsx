import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Wind, Droplets, Target, TrendingUp } from "lucide-react";
import { Venue } from "@/data/venues";
import { Team, Player } from "@/types/cricket";

interface VenueInfoDialogProps {
  venue: Venue;
  team1: Team;
  team2: Team;
  team1PlayingXI?: Player[];
  team2PlayingXI?: Player[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceedToToss: () => void;
}

const VenueInfoDialog = ({
  venue,
  team1,
  team2,
  team1PlayingXI,
  team2PlayingXI,
  open,
  onOpenChange,
  onProceedToToss,
}: VenueInfoDialogProps) => {
  // Calculate team strengths based on venue
  const calculateTeamStrength = (players: Player[] | undefined): { spinStrength: number; paceStrength: number; batStrength: number } => {
    if (!players || players.length === 0) {
      return { spinStrength: 50, paceStrength: 50, batStrength: 50 };
    }

    const avgBat = players.reduce((sum, p) => sum + p.batSkill, 0) / players.length;
    const bowlers = players.filter(p => p.bowlSkill >= 60);
    
    // Classify bowlers as spin or pace based on their skill distribution
    const spinBowlers = bowlers.filter(p => p.bowlSkill >= 70 && p.batSkill < 60);
    const paceBowlers = bowlers.filter(p => p.bowlSkill >= 60 && p.batSkill < 70);
    
    const spinStrength = spinBowlers.length > 0 
      ? spinBowlers.reduce((sum, p) => sum + p.bowlSkill, 0) / spinBowlers.length 
      : 50;
    const paceStrength = paceBowlers.length > 0 
      ? paceBowlers.reduce((sum, p) => sum + p.bowlSkill, 0) / paceBowlers.length 
      : 50;

    return { spinStrength, paceStrength, batStrength: avgBat };
  };

  const team1Strength = calculateTeamStrength(team1PlayingXI || team1.squad.slice(0, 11));
  const team2Strength = calculateTeamStrength(team2PlayingXI || team2.squad.slice(0, 11));

  // Calculate win probability based on venue characteristics and team strengths
  const calculateWinProbability = () => {
    let team1Score = 50;
    let team2Score = 50;

    // Venue factors
    const spinFactor = venue.spinFriendliness / 100;
    const paceFactor = venue.paceFriendliness / 100;

    // Adjust scores based on team bowling strengths matching venue
    team1Score += (team1Strength.spinStrength - 50) * spinFactor * 0.3;
    team1Score += (team1Strength.paceStrength - 50) * paceFactor * 0.3;
    team1Score += (team1Strength.batStrength - 50) * 0.2;

    team2Score += (team2Strength.spinStrength - 50) * spinFactor * 0.3;
    team2Score += (team2Strength.paceStrength - 50) * paceFactor * 0.3;
    team2Score += (team2Strength.batStrength - 50) * 0.2;

    // Normalize to percentage
    const total = team1Score + team2Score;
    const team1Probability = Math.round((team1Score / total) * 100);
    const team2Probability = 100 - team1Probability;

    // Clamp between 25-75% to avoid extreme predictions
    return {
      team1: Math.max(25, Math.min(75, team1Probability)),
      team2: Math.max(25, Math.min(75, team2Probability)),
    };
  };

  const winProbability = calculateWinProbability();

  const getPitchTypeColor = () => {
    switch (venue.pitchType) {
      case 'spin': return 'bg-amber-500';
      case 'pace': return 'bg-green-600';
      default: return 'bg-blue-500';
    }
  };

  const getBoundarySizeLabel = () => {
    switch (venue.boundarySize) {
      case 'small': return 'Short boundaries - Batting paradise';
      case 'large': return 'Large boundaries - Bowlers friendly';
      default: return 'Standard dimensions';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Venue Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Venue Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{venue.name}</h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{venue.city}</span>
              <span>•</span>
              <Users className="h-4 w-4" />
              <span>{venue.capacity.toLocaleString()} capacity</span>
            </div>
          </div>

          {/* Pitch Characteristics */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pitch Characteristics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pitch Type</span>
                    <Badge className={getPitchTypeColor()}>
                      {venue.pitchType.charAt(0).toUpperCase() + venue.pitchType.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spin Friendly</span>
                      <span className="font-medium">{venue.spinFriendliness}%</span>
                    </div>
                    <Progress value={venue.spinFriendliness} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pace Friendly</span>
                      <span className="font-medium">{venue.paceFriendliness}%</span>
                    </div>
                    <Progress value={venue.paceFriendliness} className="h-2" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Droplets className="h-3 w-3" /> Dew Factor
                      </span>
                      <span className="font-medium">{venue.dewFactor}%</span>
                    </div>
                    <Progress value={venue.dewFactor} className="h-2" />
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-muted-foreground">Boundary Size: </span>
                    <span className="font-medium capitalize">{venue.boundarySize}</span>
                    <p className="text-xs text-muted-foreground mt-1">{getBoundarySizeLabel()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expected Scores */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Expected Scores (Based on History)
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-primary">{venue.avgFirstInningsScore}</div>
                  <div className="text-sm text-muted-foreground">Avg 1st Innings Score</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-3xl font-bold text-primary">{venue.avgSecondInningsScore}</div>
                  <div className="text-sm text-muted-foreground">Avg 2nd Innings Score</div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Badge variant="outline" className="text-sm">
                  <Wind className="h-3 w-3 mr-1" />
                  Teams batting first win {venue.avgWinBatFirst}% of matches here
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Win Probability */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-4 text-center">Win Probability</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 text-right font-medium truncate">{team1.name}</div>
                  <div className="flex-1">
                    <div className="h-8 bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className="bg-primary h-full flex items-center justify-center text-primary-foreground text-sm font-bold transition-all"
                        style={{ width: `${winProbability.team1}%` }}
                      >
                        {winProbability.team1}%
                      </div>
                      <div 
                        className="bg-accent h-full flex items-center justify-center text-accent-foreground text-sm font-bold transition-all"
                        style={{ width: `${winProbability.team2}%` }}
                      >
                        {winProbability.team2}%
                      </div>
                    </div>
                  </div>
                  <div className="w-24 font-medium truncate">{team2.name}</div>
                </div>
                
                <p className="text-xs text-center text-muted-foreground">
                  * Probability based on team composition and venue characteristics
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Proceed to Toss */}
          <div className="flex justify-center">
            <Button onClick={onProceedToToss} size="lg" className="w-full sm:w-auto">
              🪙 Proceed to Toss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VenueInfoDialog;
