import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, RotateCcw, Zap } from "lucide-react";
import { Match, BallEvent, Player } from "@/types/cricket";
import { useCricketStore } from "@/hooks/useCricketStore";

interface BallByBallEngineProps {
  match: Match;
}

const BallByBallEngine = ({ match }: BallByBallEngineProps) => {
  const { updateMatch } = useCricketStore();
  const [commentary, setCommentary] = useState<BallEvent[]>([]);
  const [showBowlerDialog, setShowBowlerDialog] = useState(true);
  const [showBatsmanDialog, setShowBatsmanDialog] = useState(false);
  const [selectedBowler, setSelectedBowler] = useState("");
  const [selectedBatsman, setSelectedBatsman] = useState("");
  const [nextBatsmanIndex, setNextBatsmanIndex] = useState(2);

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
    const innings = getCurrentInnings();
    const maxOvers = Math.floor(match.overs / 5);
    return bowlingTeam.filter(player => 
      player.oversBowled < maxOvers && 
      player.id !== innings?.currentBowler?.id
    );
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

  const simulateBallOutcome = (batsman: Player, bowler: Player) => {
    const batSkill = batsman.batSkill;
    const bowlSkill = bowler.bowlSkill;
    
    // Calculate probabilities based on skills
    const skillDiff = batSkill - bowlSkill;
    const dotProb = Math.max(20, 45 - skillDiff * 0.3);
    const wicketProb = Math.max(3, 8 - skillDiff * 0.1);
    const boundaryProb = Math.max(8, 15 + skillDiff * 0.2);
    const sixProb = Math.max(2, 6 + skillDiff * 0.15);
    
    const outcomes = [
      { runs: 0, isWicket: false, weight: dotProb },
      { runs: 1, isWicket: false, weight: 35 },
      { runs: 2, isWicket: false, weight: 15 },
      { runs: 3, isWicket: false, weight: 3 },
      { runs: 4, isWicket: false, weight: boundaryProb },
      { runs: 6, isWicket: false, weight: sixProb },
      { runs: 0, isWicket: true, weight: wicketProb },
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

  const handleBowlerSelection = () => {
    if (!selectedBowler) return;
    
    const innings = getCurrentInnings();
    if (!innings) return;
    
    const bowler = getBowlingTeam().find(p => p.id === selectedBowler);
    if (!bowler) return;
    
    // Update current bowler
    const updatedInnings = {
      ...innings,
      currentBowler: bowler
    };
    
    const matchUpdate = match.currentInnings === 1 
      ? { firstInnings: updatedInnings }
      : { secondInnings: updatedInnings };
    
    updateMatch(matchUpdate);
    setShowBowlerDialog(false);
    setSelectedBowler("");
  };

  const handleBatsmanSelection = () => {
    if (!selectedBatsman) return;
    
    const innings = getCurrentInnings();
    if (!innings) return;
    
    const batsman = getBattingTeam().find(p => p.id === selectedBatsman);
    if (!batsman) return;
    
    // Replace striker with new batsman
    const updatedInnings = {
      ...innings,
      currentBatsmen: {
        ...innings.currentBatsmen,
        striker: batsman
      }
    };
    
    const matchUpdate = match.currentInnings === 1 
      ? { firstInnings: updatedInnings }
      : { secondInnings: updatedInnings };
    
    updateMatch(matchUpdate);
    setShowBatsmanDialog(false);
    setSelectedBatsman("");
    setNextBatsmanIndex(prev => prev + 1);
  };

  const handleSimulateBall = () => {
    const innings = getCurrentInnings();
    if (!innings || innings.isCompleted || !innings.currentBowler) return;
    if (!innings.currentBatsmen.striker || !innings.currentBatsmen.nonStriker) return;

    const outcome = simulateBallOutcome(innings.currentBatsmen.striker, innings.currentBowler);
    
    const runs = outcome.runs;
    const isWicket = outcome.isWicket;
    
    // Update striker's stats
    const striker = { ...innings.currentBatsmen.striker };
    striker.runs += runs;
    striker.balls += 1;
    
    if (runs === 4) striker.fours += 1;
    if (runs === 6) striker.sixes += 1;
    
    if (isWicket) {
      striker.dismissed = true;
      striker.dismissalInfo = `b ${innings.currentBowler.name}`;
    }
    
    // Update bowler stats
    const bowler = { ...innings.currentBowler };
    bowler.oversBowled = Number(((innings.ballsBowled + 1) / 6).toFixed(2));
    bowler.runsConceded += runs;
    if (isWicket) bowler.wickets += 1;
    
    // Rotate strike if odd runs
    let newStriker = striker;
    let newNonStriker = innings.currentBatsmen.nonStriker;
    
    if (runs % 2 === 1 && !isWicket) {
      newStriker = innings.currentBatsmen.nonStriker;
      newNonStriker = striker;
    }
    
    // Check if over complete
    const newBallsBowled = innings.ballsBowled + 1;
    const isOverComplete = newBallsBowled % 6 === 0;
    
    // Rotate strike at end of over
    if (isOverComplete && !isWicket) {
      [newStriker, newNonStriker] = [newNonStriker, newStriker];
    }
    
    // Update innings
    const updatedInnings = {
      ...innings,
      totalRuns: innings.totalRuns + runs,
      ballsBowled: newBallsBowled,
      wickets: isWicket ? innings.wickets + 1 : innings.wickets,
      currentBatsmen: {
        striker: isWicket ? null : newStriker,
        nonStriker: newNonStriker
      },
      currentBowler: isOverComplete ? null : bowler,
      isCompleted: 
        newBallsBowled >= match.overs * 6 || 
        (isWicket && innings.wickets + 1 >= 10)
    };
    
    // Generate commentary
    const generateCommentary = (): string => {
      const over = Math.floor(newBallsBowled / 6);
      const ball = (newBallsBowled % 6) || 6;
      
      if (isWicket) {
        const wicketTexts = [
          `OUT! ${innings.currentBatsmen.striker.name} b ${innings.currentBowler.name}! What a delivery!`,
          `WICKET! ${innings.currentBowler.name} strikes! ${innings.currentBatsmen.striker.name} departs for ${striker.runs}`,
          `Bowled him! ${innings.currentBowler.name} gets the breakthrough!`,
          `Gone! Clean bowled! ${innings.currentBatsmen.striker.name} has to walk back`
        ];
        return wicketTexts[Math.floor(Math.random() * wicketTexts.length)];
      }
      
      if (runs === 0) {
        return `Dot ball! ${innings.currentBowler.name} keeps it tight`;
      } else if (runs === 1) {
        return `${innings.currentBatsmen.striker.name} takes a quick single`;
      } else if (runs === 2) {
        return `Good running between the wickets, they pick up two`;
      } else if (runs === 3) {
        return `Excellent running! Three runs taken`;
      } else if (runs === 4) {
        return `FOUR! Beautiful shot from ${innings.currentBatsmen.striker.name}! That raced away to the boundary`;
      } else if (runs === 6) {
        return `SIX! Massive hit from ${innings.currentBatsmen.striker.name}! That's gone all the way!`;
      }
      return `${runs} runs scored`;
    };
    
    const ballEvent: BallEvent = {
      ballNumber: newBallsBowled,
      bowler: innings.currentBowler.name,
      batsman: innings.currentBatsmen.striker.name,
      runs,
      isWicket,
      commentary: generateCommentary(),
    };
    
    setCommentary(prev => [ballEvent, ...prev]);
    
    const matchUpdate = match.currentInnings === 1 
      ? { firstInnings: updatedInnings }
      : { secondInnings: updatedInnings };
    
    updateMatch(matchUpdate);
    
    // Show dialogs
    if (isOverComplete) {
      setShowBowlerDialog(true);
    }
    
    if (isWicket && innings.wickets + 1 < 10) {
      setShowBatsmanDialog(true);
    }
  };

  const formatBallNumber = (ballNum: number) => {
    const over = Math.floor(ballNum / 6);
    const ball = (ballNum % 6) || 6;
    return `${over}.${ball}`;
  };

  const innings = getCurrentInnings();
  const canSimulate = innings && 
    !innings.isCompleted && 
    innings.currentBowler && 
    innings.currentBatsmen.striker && 
    innings.currentBatsmen.nonStriker;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ball-by-Ball Simulation</span>
            <div className="flex space-x-2">
              <Button
                onClick={handleSimulateBall}
                disabled={!canSimulate}
                className="bg-cricket-green hover:bg-cricket-green/90"
              >
                <Zap className="h-4 w-4 mr-1" />
                Simulate Ball
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCommentary([]);
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
                <p>Select a bowler to start the match simulation</p>
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

      {/* Bowler Selection Dialog */}
      <Dialog open={showBowlerDialog} onOpenChange={setShowBowlerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Bowler for {innings ? `Over ${Math.floor(innings.ballsBowled / 6) + 1}` : 'Next Over'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedBowler} onValueChange={setSelectedBowler}>
              <SelectTrigger>
                <SelectValue placeholder="Choose bowler" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableBowlers().map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} ({player.oversBowled} overs, {player.wickets} wickets, {player.runsConceded} runs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleBowlerSelection} 
              disabled={!selectedBowler}
              className="w-full"
            >
              Set Bowler
            </Button>
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
            <div className="p-3 bg-destructive/10 rounded-lg text-sm">
              Wicket! Select the next batsman to come in.
            </div>
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
            <Button 
              onClick={handleBatsmanSelection} 
              disabled={!selectedBatsman}
              className="w-full"
            >
              Send In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BallByBallEngine;
