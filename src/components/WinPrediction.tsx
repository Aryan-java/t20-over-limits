import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Zap, Target, Flame, Sparkles } from "lucide-react";
import { Match } from "@/types/cricket";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface WinPredictionProps {
  match: Match;
}

const WinPrediction = ({ match }: WinPredictionProps) => {
  const prediction = useMemo(() => {
    const innings = match.currentInnings === 1 ? match.firstInnings : match.secondInnings;
    if (!innings) return null;

    const totalOvers = match.overs;
    const ballsBowled = innings.ballsBowled;
    const oversCompleted = ballsBowled / 6;
    const wicketsLost = innings.wickets;
    const currentRuns = innings.totalRuns;

    // First innings prediction (based on projected score)
    if (match.currentInnings === 1) {
      // Calculate current run rate
      const currentRunRate = oversCompleted > 0 ? currentRuns / oversCompleted : 0;
      
      // Project final score using current run rate with adjustments
      const oversRemaining = totalOvers - oversCompleted;
      const wicketFactor = Math.max(0.5, 1 - (wicketsLost * 0.08)); // Each wicket reduces scoring by ~8%
      const deathOverBonus = oversRemaining <= 4 ? 1.3 : 1; // Death overs acceleration
      
      const projectedScore = Math.round(
        currentRuns + (currentRunRate * oversRemaining * wicketFactor * deathOverBonus)
      );

      // Calculate win probability based on projected score for T20
      // Average winning score in T20 is around 160-170
      const avgWinningScore = 165;
      const scoreDiff = projectedScore - avgWinningScore;
      
      // Batting team's probability based on projected score
      let battingProb = 50 + (scoreDiff * 0.5);
      battingProb = Math.min(95, Math.max(5, battingProb));

      return {
        team1: innings.battingTeam,
        team2: innings.bowlingTeam,
        team1Prob: battingProb,
        team2Prob: 100 - battingProb,
        projectedScore,
        currentRunRate: currentRunRate.toFixed(2),
        phase: oversCompleted < 6 ? 'powerplay' : oversCompleted >= totalOvers - 4 ? 'death' : 'middle',
        momentum: currentRunRate > 8 ? 'high' : currentRunRate > 6 ? 'medium' : 'low',
      };
    }

    // Second innings prediction (based on chase equation)
    const target = match.firstInnings!.totalRuns + 1;
    const runsRequired = target - currentRuns;
    const ballsRemaining = (totalOvers * 6) - ballsBowled;
    const wicketsRemaining = 10 - wicketsLost;

    // Required run rate
    const requiredRunRate = ballsRemaining > 0 ? (runsRequired / (ballsRemaining / 6)) : 999;
    const currentRunRate = oversCompleted > 0 ? currentRuns / oversCompleted : 0;

    // Win probability calculation for chase
    let chasingProb: number;

    // Already won
    if (runsRequired <= 0) {
      chasingProb = 100;
    }
    // All out
    else if (wicketsRemaining === 0 || ballsRemaining === 0) {
      chasingProb = 0;
    }
    else {
      // Base probability from run rate comparison
      const runRateDiff = currentRunRate - requiredRunRate;
      
      // Resource remaining (simplified Duckworth-Lewis style)
      const resourceRemaining = (ballsRemaining / (totalOvers * 6)) * (wicketsRemaining / 10);
      
      // Calculate probability
      chasingProb = 50 + (runRateDiff * 8); // Each run rate difference = 8% swing
      
      // Wicket adjustment
      chasingProb -= (10 - wicketsRemaining) * 5; // Each wicket lost = -5%
      
      // Balls remaining adjustment
      if (ballsRemaining > 30 && requiredRunRate < 10) {
        chasingProb += 10; // Comfortable chase bonus
      } else if (ballsRemaining < 12 && requiredRunRate > 12) {
        chasingProb -= 20; // Very difficult chase penalty
      }
      
      // Resource adjustment
      chasingProb += (resourceRemaining - 0.5) * 30;
      
      // Clamp to valid range
      chasingProb = Math.min(95, Math.max(5, chasingProb));
    }

    const battingTeam = innings.battingTeam;
    const bowlingTeam = innings.bowlingTeam;

    // Determine momentum
    let momentum: 'high' | 'medium' | 'low';
    if (currentRunRate > requiredRunRate + 2) momentum = 'high';
    else if (currentRunRate > requiredRunRate - 1) momentum = 'medium';
    else momentum = 'low';

    return {
      team1: battingTeam,
      team2: bowlingTeam,
      team1Prob: chasingProb,
      team2Prob: 100 - chasingProb,
      runsRequired,
      ballsRemaining,
      requiredRunRate: requiredRunRate.toFixed(2),
      currentRunRate: currentRunRate.toFixed(2),
      phase: oversCompleted >= totalOvers - 4 ? 'death' : oversCompleted < 6 ? 'powerplay' : 'middle',
      momentum,
    };
  }, [match]);

  if (!prediction) return null;

  const getTrendIcon = (prob: number) => {
    if (prob > 60) return <TrendingUp className="h-4 w-4 text-cricket-green" />;
    if (prob < 40) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-accent" />;
  };

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'high': return 'bg-cricket-green';
      case 'medium': return 'bg-accent';
      case 'low': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getPhaseConfig = (phase: string) => {
    switch (phase) {
      case 'powerplay': 
        return { icon: <Zap className="h-3.5 w-3.5" />, class: 'bg-cricket-boundary text-white', label: 'Powerplay' };
      case 'death': 
        return { icon: <Flame className="h-3.5 w-3.5" />, class: 'bg-cricket-ball text-white', label: 'Death Overs' };
      default: 
        return { icon: <Target className="h-3.5 w-3.5" />, class: 'bg-muted text-muted-foreground', label: 'Middle Overs' };
    }
  };

  const phaseConfig = getPhaseConfig(prediction.phase || 'middle');

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-cricket-purple/5 to-primary/10">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cricket-gold animate-pulse-slow" />
            <span>Win Prediction</span>
            <Badge variant="outline" className="gap-1 bg-gradient-to-r from-cricket-purple/20 to-primary/20 border-cricket-purple/30">
              🤖 AI
            </Badge>
          </div>
          {prediction.phase && (
            <Badge className={cn("gap-1", phaseConfig.class)}>
              {phaseConfig.icon}
              <span>{phaseConfig.label}</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Win Probability Bars */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{prediction.team1}</span>
                {getTrendIcon(prediction.team1Prob)}
              </div>
              <span className={cn(
                "font-bold text-xl",
                prediction.team1Prob > 60 ? "text-cricket-green" : 
                prediction.team1Prob < 40 ? "text-destructive" : "text-accent"
              )}>
                {Math.round(prediction.team1Prob)}%
              </span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  prediction.team1Prob > 60 ? "bg-gradient-to-r from-cricket-green to-cricket-grass" :
                  prediction.team1Prob < 40 ? "bg-gradient-to-r from-destructive/70 to-destructive" :
                  "bg-gradient-to-r from-accent/70 to-accent"
                )}
                style={{ width: `${prediction.team1Prob}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{prediction.team2}</span>
                {getTrendIcon(prediction.team2Prob)}
              </div>
              <span className={cn(
                "font-bold text-xl",
                prediction.team2Prob > 60 ? "text-cricket-green" : 
                prediction.team2Prob < 40 ? "text-destructive" : "text-accent"
              )}>
                {Math.round(prediction.team2Prob)}%
              </span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  prediction.team2Prob > 60 ? "bg-gradient-to-r from-cricket-green to-cricket-grass" :
                  prediction.team2Prob < 40 ? "bg-gradient-to-r from-destructive/70 to-destructive" :
                  "bg-gradient-to-r from-accent/70 to-accent"
                )}
                style={{ width: `${prediction.team2Prob}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="text-center p-3 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl">
            <div className="text-xs text-muted-foreground font-medium">Current RR</div>
            <div className="font-bold text-2xl text-primary">{prediction.currentRunRate}</div>
          </div>
          
          {match.currentInnings === 2 && 'requiredRunRate' in prediction ? (
            <div className="text-center p-3 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl">
              <div className="text-xs text-muted-foreground font-medium">Required RR</div>
              <div className={cn(
                "font-bold text-2xl",
                parseFloat(prediction.requiredRunRate) > parseFloat(prediction.currentRunRate) + 2
                  ? 'text-destructive'
                  : parseFloat(prediction.requiredRunRate) < parseFloat(prediction.currentRunRate)
                  ? 'text-cricket-green'
                  : 'text-accent'
              )}>
                {prediction.requiredRunRate}
              </div>
            </div>
          ) : (
            <div className="text-center p-3 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl">
              <div className="text-xs text-muted-foreground font-medium">Projected</div>
              <div className="font-bold text-2xl text-cricket-purple">
                {'projectedScore' in prediction ? prediction.projectedScore : '-'}
              </div>
            </div>
          )}
        </div>

        {/* Momentum Indicator */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 rounded-xl">
          <span className="text-sm font-medium text-muted-foreground">Batting Momentum</span>
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full animate-pulse", getMomentumColor(prediction.momentum))} />
            <span className={cn(
              "text-sm font-bold capitalize",
              prediction.momentum === 'high' ? 'text-cricket-green' :
              prediction.momentum === 'low' ? 'text-destructive' : 'text-accent'
            )}>{prediction.momentum}</span>
          </div>
        </div>

        {/* Second innings specific - runs/balls remaining */}
        {match.currentInnings === 2 && 'runsRequired' in prediction && (
          <div className="p-4 bg-gradient-to-r from-cricket-ball/10 via-accent/10 to-cricket-ball/10 rounded-xl border border-cricket-ball/20">
            <div className="flex justify-around items-center">
              <div className="text-center">
                <div className="text-3xl font-black text-cricket-ball">{prediction.runsRequired}</div>
                <div className="text-xs text-muted-foreground font-medium">runs needed</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="text-3xl font-black">{prediction.ballsRemaining}</div>
                <div className="text-xs text-muted-foreground font-medium">balls left</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WinPrediction;
