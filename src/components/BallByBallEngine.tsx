import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, SkipForward, RotateCcw, Zap } from "lucide-react";
import { Match, BallEvent, Player } from "@/types/cricket";
import { useCricketStore } from "@/hooks/useCricketStore";

interface BallByBallEngineProps {
  match: Match;
}

const BallByBallEngine = ({ match }: BallByBallEngineProps) => {
  const { updateMatch } = useCricketStore();
  const [isSimulating, setIsSimulating] = useState(false);
  const [commentary, setCommentary] = useState<BallEvent[]>([]);
  const [currentBall, setCurrentBall] = useState(0);
  const [showBowlerDialog, setShowBowlerDialog] = useState(false);
  const [showBatsmanDialog, setShowBatsmanDialog] = useState(false);
  const [selectedBowler, setSelectedBowler] = useState("");
  const [selectedBatsman, setSelectedBatsman] = useState("");
  const [ballOutcome, setBallOutcome] = useState<{runs: number, isWicket: boolean} | null>(null);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);

  const getCurrentInnings = () => {
    return match.currentInnings === 1 ? match.firstInnings : match.secondInnings;
  };

  const getBowlingTeam = () => {
    const innings = getCurrentInnings();
    if (!innings) return [];
    
    return innings.bowlingTeam === match.team1.name 
      ? (match.team1Setup?.playingXI || [])
      : (match.team2Setup?.playingXI || []);
  };

  const getBattingTeam = () => {
    const innings = getCurrentInnings();
    if (!innings) return [];
    
    return innings.battingTeam === match.team1.name 
      ? (match.team1Setup?.playingXI || [])
      : (match.team2Setup?.playingXI || []);
  };

  const getAvailableBowlers = () => {
    const bowlingTeam = getBowlingTeam();
    const maxOvers = Math.floor(match.overs / 5);
    return bowlingTeam.filter(player => player.oversBowled < maxOvers);
  };

  const getAvailableBatsmen = () => {
    const battingTeam = getBattingTeam();
    const innings = getCurrentInnings();
    if (!innings) return [];
    
    return battingTeam.filter(player => 
      !player.dismissed &&
      player.id !== innings.currentBatsmen.striker?.id &&
      player.id !== innings.currentBatsmen.nonStriker?.id
    );
  };

  const simulateBallOutcome = () => {
    const outcomes = [
      { runs: 0, isWicket: false, weight: 40, commentary: "Dot ball! Good bowling." },
      { runs: 1, isWicket: false, weight: 30, commentary: "Single taken." },
      { runs: 2, isWicket: false, weight: 15, commentary: "Two runs scored." },
      { runs: 3, isWicket: false, weight: 5, commentary: "Three runs taken." },
      { runs: 4, isWicket: false, weight: 8, commentary: "FOUR! Beautiful shot!" },
      { runs: 6, isWicket: false, weight: 4, commentary: "SIX! What a shot!" },
      { runs: 0, isWicket: true, weight: 3, commentary: "WICKET! Clean bowled!" },
    ];

    const totalWeight = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
    const random = Math.random() * totalWeight;
    
    let weightSum = 0;
    for (const outcome of outcomes) {
      weightSum += outcome.weight;
      if (random <= weightSum) {
        return outcome;
      }
    }
    return outcomes[0];
  };

  const handleBallSimulation = () => {
    const innings = getCurrentInnings();
    if (!innings || innings.isCompleted) return;

    const outcome = simulateBallOutcome();
    setBallOutcome(outcome);
    setShowOutcomeDialog(true);
  };

  const confirmBallOutcome = (customRuns?: number, customWicket?: boolean) => {
    const innings = getCurrentInnings();
    if (!innings) return;

    const runs = customRuns !== undefined ? customRuns : ballOutcome?.runs || 0;
    const isWicket = customWicket !== undefined ? customWicket : ballOutcome?.isWicket || false;

    const ballEvent: BallEvent = {
      ballNumber: currentBall + 1,
      bowler: innings.currentBowler?.name || "Unknown",
      batsman: innings.currentBatsmen.striker?.name || "Unknown",
      runs,
      isWicket,
      commentary: generateCommentary(runs, isWicket),
    };

    setCommentary(prev => [ballEvent, ...prev.slice(0, 19)]);
    setCurrentBall(prev => prev + 1);
    setShowOutcomeDialog(false);
    setBallOutcome(null);

    // Check if over is complete
    if ((currentBall + 1) % 6 === 0) {
      setShowBowlerDialog(true);
    }

    // Check if wicket fell
    if (isWicket) {
      setShowBatsmanDialog(true);
    }
  };

  const generateCommentary = (runs: number, isWicket: boolean): string => {
    if (isWicket) {
      const wicketCommentaries = [
        "WICKET! What a delivery!",
        "OUT! The bowler strikes!",
        "Gone! Excellent bowling!",
        "WICKET! The batsman departs!"
      ];
      return wicketCommentaries[Math.floor(Math.random() * wicketCommentaries.length)];
    }

    switch (runs) {
      case 0: return "Dot ball! Good bowling.";
      case 1: return "Single taken.";
      case 2: return "Two runs scored.";
      case 3: return "Three runs taken.";
      case 4: return "FOUR! Beautiful shot!";
      case 6: return "SIX! What a shot!";
      default: return `${runs} runs scored.`;
    }
  };

  const handleBowlerChange = () => {
    if (selectedBowler) {
      // Update current bowler logic here
      setShowBowlerDialog(false);
      setSelectedBowler("");
    }
  };

  const handleBatsmanChange = () => {
    if (selectedBatsman) {
      // Update batting lineup logic here
      setShowBatsmanDialog(false);
      setSelectedBatsman("");
    }
  };

  const formatBallNumber = (ballNum: number) => {
    const over = Math.floor((ballNum - 1) / 6) + 1;
    const ball = ((ballNum - 1) % 6) + 1;
    return `${over}.${ball}`;
  };

  const innings = getCurrentInnings();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ball-by-Ball Simulation</span>
            <div className="flex space-x-2">
              <Button
                onClick={handleBallSimulation}
                disabled={!innings || innings.isCompleted}
                className="bg-cricket-green hover:bg-cricket-green/90"
              >
                <Zap className="h-4 w-4 mr-1" />
                Simulate Ball
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCommentary([]);
                  setCurrentBall(0);
                  setIsSimulating(false);
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commentary.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">🏏</div>
                <p>Click "Simulate Ball" to start the match simulation</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {commentary.map((ball, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      ball.isWicket 
                        ? 'bg-destructive/10 border-destructive/20' 
                        : ball.runs >= 4 
                        ? 'bg-cricket-green/10 border-cricket-green/20'
                        : 'bg-muted/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {formatBallNumber(ball.ballNumber)}
                          </Badge>
                          <span className="text-sm font-medium">
                            {ball.bowler} to {ball.batsman}
                          </span>
                        </div>
                        <p className="text-sm">{ball.commentary}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {ball.isWicket ? (
                          <Badge className="bg-destructive text-white">W</Badge>
                        ) : (
                          <Badge 
                            className={
                              ball.runs >= 4 
                                ? "bg-cricket-green text-white"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {ball.runs}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ball Outcome Dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ball Outcome</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <div className="text-2xl font-bold mb-2">
                {ballOutcome?.isWicket ? "WICKET!" : `${ballOutcome?.runs} RUNS`}
              </div>
              <p className="text-sm text-muted-foreground">
                {ballOutcome?.commentary}
              </p>
            </div>
            
            <div className="text-sm text-muted-foreground text-center">
              You can accept this outcome or choose a different result:
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3, 4, 6].map(runs => (
                <Button
                  key={runs}
                  variant="outline"
                  onClick={() => confirmBallOutcome(runs, false)}
                  className="h-12"
                >
                  {runs}
                </Button>
              ))}
              <Button
                variant="destructive"
                onClick={() => confirmBallOutcome(0, true)}
                className="h-12"
              >
                W
              </Button>
            </div>
            
            <Button 
              onClick={() => confirmBallOutcome()}
              className="w-full"
            >
              Accept Outcome
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bowler Selection Dialog */}
      <Dialog open={showBowlerDialog} onOpenChange={setShowBowlerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Bowler for Next Over</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedBowler} onValueChange={setSelectedBowler}>
              <SelectTrigger>
                <SelectValue placeholder="Choose bowler" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableBowlers().map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} ({player.oversBowled} overs bowled)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button onClick={handleBowlerChange} disabled={!selectedBowler}>
                Set Bowler
              </Button>
              <Button variant="outline" onClick={() => setShowBowlerDialog(false)}>
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batsman Selection Dialog */}
      <Dialog open={showBatsmanDialog} onOpenChange={setShowBatsmanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Next Batsman</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedBatsman} onValueChange={setSelectedBatsman}>
              <SelectTrigger>
                <SelectValue placeholder="Choose next batsman" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableBatsmen().map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} (Bat: {player.batSkill})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button onClick={handleBatsmanChange} disabled={!selectedBatsman}>
                Send In
              </Button>
              <Button variant="outline" onClick={() => setShowBatsmanDialog(false)}>
                Skip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BallByBallEngine;