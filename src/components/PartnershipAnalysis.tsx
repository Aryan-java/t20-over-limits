import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Match, Partnership as PartnershipType } from "@/types/cricket";
import { User, ArrowLeftRight, Zap, Flame, Target } from "lucide-react";

interface PartnershipAnalysisProps {
  match: Match;
}

const PartnershipAnalysis = ({ match }: PartnershipAnalysisProps) => {
  const getCurrentInnings = () => {
    return match.currentInnings === 1 ? match.firstInnings : match.secondInnings;
  };

  const innings = getCurrentInnings();
  const partnerships = innings?.partnerships || [];

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

  // Calculate phase-wise stats
  const phaseStats = {
    powerplay: { runs: 0, balls: 0, partnerships: 0 },
    middle: { runs: 0, balls: 0, partnerships: 0 },
    death: { runs: 0, balls: 0, partnerships: 0 },
  };

  partnerships.forEach(p => {
    phaseStats[p.phase].runs += p.runs;
    phaseStats[p.phase].balls += p.balls;
    phaseStats[p.phase].partnerships += 1;
  });

  const getPhaseIcon = (phase: 'powerplay' | 'middle' | 'death') => {
    switch (phase) {
      case 'powerplay':
        return <Zap className="h-3 w-3" />;
      case 'death':
        return <Flame className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  const getPhaseColor = (phase: 'powerplay' | 'middle' | 'death') => {
    switch (phase) {
      case 'powerplay':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50';
      case 'death':
        return 'bg-red-500/20 text-red-600 border-red-500/50';
      default:
        return 'bg-blue-500/20 text-blue-600 border-blue-500/50';
    }
  };

  const getPhaseBgColor = (phase: 'powerplay' | 'middle' | 'death') => {
    switch (phase) {
      case 'powerplay':
        return 'border-l-4 border-l-yellow-500';
      case 'death':
        return 'border-l-4 border-l-red-500';
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

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
        {/* Phase Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-3 bg-yellow-500/10 rounded-lg text-center border border-yellow-500/30">
            <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-medium">Powerplay</span>
            </div>
            <div className="text-lg font-bold">{phaseStats.powerplay.runs}</div>
            <div className="text-xs text-muted-foreground">
              {phaseStats.powerplay.balls > 0 
                ? ((phaseStats.powerplay.runs / phaseStats.powerplay.balls) * 6).toFixed(2) 
                : '0.00'} RR
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg text-center border border-blue-500/30">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Middle</span>
            </div>
            <div className="text-lg font-bold">{phaseStats.middle.runs}</div>
            <div className="text-xs text-muted-foreground">
              {phaseStats.middle.balls > 0 
                ? ((phaseStats.middle.runs / phaseStats.middle.balls) * 6).toFixed(2) 
                : '0.00'} RR
            </div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-center border border-red-500/30">
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-medium">Death</span>
            </div>
            <div className="text-lg font-bold">{phaseStats.death.runs}</div>
            <div className="text-xs text-muted-foreground">
              {phaseStats.death.balls > 0 
                ? ((phaseStats.death.runs / phaseStats.death.balls) * 6).toFixed(2) 
                : '0.00'} RR
            </div>
          </div>
        </div>

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
          const strikeRotations = Math.max(0, partnership.runs - (partnership.fours * 4) - (partnership.sixes * 6));
          const rotationRate = partnership.balls > 0 
            ? ((strikeRotations / partnership.balls) * 100).toFixed(1) 
            : '0.0';

          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${getPhaseBgColor(partnership.phase)} ${
                partnership.isActive 
                  ? 'bg-cricket-green/10 border-cricket-green/30' 
                  : 'bg-muted/30'
              }`}
            >
              {/* Partnership Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={partnership.isActive ? "default" : "secondary"}>
                    {index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}
                  </Badge>
                  <Badge variant="outline" className={getPhaseColor(partnership.phase)}>
                    {getPhaseIcon(partnership.phase)}
                    <span className="ml-1 capitalize">{partnership.phase}</span>
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
                      <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{partnership.batsman1Name}</span>
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
                      <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{partnership.batsman2Name}</span>
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
                    {partnership.fours}
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
                    {strikeRotations}
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
                {Math.round(partnerships.reduce((sum, p) => {
                  const rotations = Math.max(0, p.runs - (p.fours * 4) - (p.sixes * 6));
                  return sum + rotations;
                }, 0) / 
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