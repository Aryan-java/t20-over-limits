import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Match, Innings, Player } from "@/types/cricket";
import { User, ArrowLeftRight, Target, Zap } from "lucide-react";

interface PartnershipAnalysisProps {
  match: Match;
}

interface Partnership {
  batsman1: Player;
  batsman2: Player;
  runs: number;
  balls: number;
  batsman1Runs: number;
  batsman1Balls: number;
  batsman2Runs: number;
  batsman2Balls: number;
  boundaries: number;
  sixes: number;
  strikeRotations: number; // Singles/threes taken
  dotBalls: number;
  isActive: boolean;
}

const PartnershipAnalysis = ({ match }: PartnershipAnalysisProps) => {
  const getCurrentInnings = (): Innings | null => {
    return match.currentInnings === 1 ? match.firstInnings : match.secondInnings;
  };

  const calculatePartnerships = (innings: Innings | null): Partnership[] => {
    if (!innings) return [];

    const partnerships: Partnership[] = [];
    const battingOrder = innings.battingOrder;

    // Calculate partnerships based on batting order
    // Each partnership is between consecutive batsmen
    for (let i = 0; i < battingOrder.length - 1; i++) {
      const batsman1 = battingOrder[i];
      const batsman2 = battingOrder[i + 1];

      // Check if this is the current partnership
      const isActive = 
        (innings.currentBatsmen.striker?.id === batsman1.id || 
         innings.currentBatsmen.striker?.id === batsman2.id) &&
        (innings.currentBatsmen.nonStriker?.id === batsman1.id || 
         innings.currentBatsmen.nonStriker?.id === batsman2.id);

      // Estimate partnership stats based on individual performances
      // In a real app, this would track ball-by-ball data
      const batsman1Runs = batsman1.runs;
      const batsman1Balls = batsman1.balls;
      const batsman2Runs = batsman2.runs;
      const batsman2Balls = batsman2.balls;

      // Calculate estimated partnership contribution
      const partnershipRuns = Math.round((batsman1Runs + batsman2Runs) * 0.6); // Estimate
      const partnershipBalls = Math.round((batsman1Balls + batsman2Balls) * 0.6);

      const boundaries = batsman1.fours + batsman2.fours;
      const sixes = batsman1.sixes + batsman2.sixes;
      
      // Estimate strike rotations (singles + threes)
      const totalScoringShots = partnershipRuns - (boundaries * 4) - (sixes * 6);
      const strikeRotations = Math.max(0, Math.round(totalScoringShots * 0.7)); // ~70% are singles
      
      // Estimate dot balls
      const dotBalls = Math.max(0, partnershipBalls - Math.round(partnershipRuns * 0.8));

      if (partnershipRuns > 0 || isActive) {
        partnerships.push({
          batsman1,
          batsman2,
          runs: partnershipRuns,
          balls: partnershipBalls,
          batsman1Runs: Math.round(batsman1Runs * 0.6),
          batsman1Balls: Math.round(batsman1Balls * 0.6),
          batsman2Runs: Math.round(batsman2Runs * 0.6),
          batsman2Balls: Math.round(batsman2Balls * 0.6),
          boundaries,
          sixes,
          strikeRotations,
          dotBalls,
          isActive,
        });
      }
    }

    // If we have current batsmen but no partnership yet, show the active partnership
    if (innings.currentBatsmen.striker && innings.currentBatsmen.nonStriker) {
      const existingActive = partnerships.find(p => p.isActive);
      if (!existingActive) {
        const striker = innings.currentBatsmen.striker;
        const nonStriker = innings.currentBatsmen.nonStriker;
        
        const partnershipRuns = striker.runs + nonStriker.runs;
        const partnershipBalls = striker.balls + nonStriker.balls;
        const boundaries = striker.fours + nonStriker.fours;
        const sixes = striker.sixes + nonStriker.sixes;
        const totalScoringShots = partnershipRuns - (boundaries * 4) - (sixes * 6);
        const strikeRotations = Math.max(0, Math.round(totalScoringShots * 0.7));
        const dotBalls = Math.max(0, partnershipBalls - Math.round(partnershipRuns * 0.8));

        partnerships.push({
          batsman1: striker,
          batsman2: nonStriker,
          runs: partnershipRuns,
          balls: partnershipBalls,
          batsman1Runs: striker.runs,
          batsman1Balls: striker.balls,
          batsman2Runs: nonStriker.runs,
          batsman2Balls: nonStriker.balls,
          boundaries,
          sixes,
          strikeRotations,
          dotBalls,
          isActive: true,
        });
      }
    }

    return partnerships;
  };

  const innings = getCurrentInnings();
  const partnerships = calculatePartnerships(innings);

  if (!innings || partnerships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Partnership Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            <p>Partnership data will appear as the innings progresses</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRuns = innings.totalRuns;
  const highestPartnership = Math.max(...partnerships.map(p => p.runs));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            <span className="text-lg">Partnership Analysis</span>
          </div>
          <Badge variant="outline">
            {partnerships.length} Partnership{partnerships.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {partnerships.map((partnership, index) => {
          const runRate = partnership.balls > 0 
            ? ((partnership.runs / partnership.balls) * 6).toFixed(2) 
            : '0.00';
          const contribution = totalRuns > 0 
            ? ((partnership.runs / totalRuns) * 100).toFixed(1) 
            : '0.0';
          const batsman1Contribution = partnership.runs > 0 
            ? ((partnership.batsman1Runs / partnership.runs) * 100) 
            : 50;
          const rotationRate = partnership.balls > 0 
            ? ((partnership.strikeRotations / partnership.balls) * 100).toFixed(1) 
            : '0.0';

          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${
                partnership.isActive 
                  ? 'bg-cricket-green/10 border-cricket-green/30' 
                  : 'bg-muted/30'
              }`}
            >
              {/* Partnership Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={partnership.isActive ? "default" : "secondary"}>
                    {index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}
                  </Badge>
                  {partnership.isActive && (
                    <Badge className="bg-cricket-green text-white animate-pulse">
                      Active
                    </Badge>
                  )}
                  {partnership.runs === highestPartnership && partnership.runs > 0 && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      ⭐ Best
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{partnership.runs}</div>
                  <div className="text-xs text-muted-foreground">
                    ({partnership.balls} balls) • RR: {runRate}
                  </div>
                </div>
              </div>

              {/* Batsmen with contribution bar */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={partnership.batsman1.imageUrl} />
                      <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{partnership.batsman1.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {partnership.batsman1Runs} ({partnership.batsman1Balls})
                  </span>
                </div>
                
                {/* Contribution Bar */}
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  <div 
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${batsman1Contribution}%` }}
                  />
                  <div 
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${100 - batsman1Contribution}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={partnership.batsman2.imageUrl} />
                      <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{partnership.batsman2.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {partnership.batsman2Runs} ({partnership.batsman2Balls})
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-background/50 rounded">
                  <div className="text-lg font-bold text-blue-500">
                    {partnership.boundaries}
                  </div>
                  <div className="text-xs text-muted-foreground">4s</div>
                </div>
                <div className="p-2 bg-background/50 rounded">
                  <div className="text-lg font-bold text-purple-500">
                    {partnership.sixes}
                  </div>
                  <div className="text-xs text-muted-foreground">6s</div>
                </div>
                <div className="p-2 bg-background/50 rounded">
                  <div className="text-lg font-bold text-green-500">
                    {partnership.strikeRotations}
                  </div>
                  <div className="text-xs text-muted-foreground">Rotations</div>
                </div>
                <div className="p-2 bg-background/50 rounded">
                  <div className="text-lg font-bold text-orange-500">
                    {contribution}%
                  </div>
                  <div className="text-xs text-muted-foreground">Share</div>
                </div>
              </div>

              {/* Strike Rotation Analysis */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Strike Rotation Rate:</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      parseFloat(rotationRate) > 40 
                        ? 'text-green-600 border-green-600' 
                        : parseFloat(rotationRate) > 25 
                        ? 'text-yellow-600 border-yellow-600'
                        : 'text-red-600 border-red-600'
                    }
                  >
                    {rotationRate}%
                  </Badge>
                </div>
                <Progress 
                  value={parseFloat(rotationRate)} 
                  className="h-2 mt-2" 
                />
              </div>
            </div>
          );
        })}

        {/* Summary Stats */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Innings Partnership Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-cricket-primary">
                {highestPartnership}
              </div>
              <div className="text-xs text-muted-foreground">Best Partnership</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">
                {partnerships.length}
              </div>
              <div className="text-xs text-muted-foreground">Partnerships</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(partnerships.reduce((sum, p) => sum + p.strikeRotations, 0) / 
                  Math.max(1, partnerships.reduce((sum, p) => sum + p.balls, 0)) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Rotation</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnershipAnalysis;