import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Zap, Target } from "lucide-react";
import { Match } from "@/types/cricket";
import { useMemo } from "react";

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
    if (prob > 60) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (prob < 40) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'powerplay': return <Zap className="h-4 w-4" />;
      case 'death': return <Target className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <span>Win Prediction</span>
            <Badge variant="outline" className="animate-pulse">
              🤖 AI
            </Badge>
          </div>
          {prediction.phase && (
            <Badge 
              className={`${
                prediction.phase === 'powerplay' 
                  ? 'bg-blue-600' 
                  : prediction.phase === 'death' 
                  ? 'bg-red-600' 
                  : 'bg-muted'
              } text-white`}
            >
              {getPhaseIcon(prediction.phase)}
              <span className="ml-1 capitalize">{prediction.phase}</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Win Probability Bars */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{prediction.team1}</span>
                {getTrendIcon(prediction.team1Prob)}
              </div>
              <span className="font-bold text-lg">{Math.round(prediction.team1Prob)}%</span>
            </div>
            <Progress 
              value={prediction.team1Prob} 
              className="h-3"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{prediction.team2}</span>
                {getTrendIcon(prediction.team2Prob)}
              </div>
              <span className="font-bold text-lg">{Math.round(prediction.team2Prob)}%</span>
            </div>
            <Progress 
              value={prediction.team2Prob} 
              className="h-3"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="text-xs text-muted-foreground">Current RR</div>
            <div className="font-bold text-lg">{prediction.currentRunRate}</div>
          </div>
          
          {match.currentInnings === 2 && 'requiredRunRate' in prediction ? (
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground">Required RR</div>
              <div className={`font-bold text-lg ${
                parseFloat(prediction.requiredRunRate) > parseFloat(prediction.currentRunRate) + 2
                  ? 'text-red-500'
                  : parseFloat(prediction.requiredRunRate) < parseFloat(prediction.currentRunRate)
                  ? 'text-green-500'
                  : 'text-yellow-500'
              }`}>
                {prediction.requiredRunRate}
              </div>
            </div>
          ) : (
            <div className="text-center p-2 bg-muted/30 rounded-lg">
              <div className="text-xs text-muted-foreground">Projected</div>
              <div className="font-bold text-lg">
                {'projectedScore' in prediction ? prediction.projectedScore : '-'}
              </div>
            </div>
          )}
        </div>

        {/* Momentum Indicator */}
        <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
          <span className="text-sm text-muted-foreground">Batting Momentum</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getMomentumColor(prediction.momentum)} animate-pulse`} />
            <span className="text-sm font-medium capitalize">{prediction.momentum}</span>
          </div>
        </div>

        {/* Second innings specific - runs/balls remaining */}
        {match.currentInnings === 2 && 'runsRequired' in prediction && (
          <div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{prediction.runsRequired}</div>
                <div className="text-xs text-muted-foreground">runs needed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{prediction.ballsRemaining}</div>
                <div className="text-xs text-muted-foreground">balls left</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WinPrediction;
