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
  const [showInningsBreakDialog, setShowInningsBreakDialog] = useState(false);
  const [selectedBowler, setSelectedBowler] = useState("");
  const [selectedBatsman, setSelectedBatsman] = useState("");
  const [openingBatsman1, setOpeningBatsman1] = useState("");
  const [openingBatsman2, setOpeningBatsman2] = useState("");
  const [nextBatsmanIndex, setNextBatsmanIndex] = useState(2);
  const [lastBowlerId, setLastBowlerId] = useState<string | null>(null);
  const [showMatchResultDialog, setShowMatchResultDialog] = useState(false);

  // Helper conversions between overs (e.g., 2.3) and balls
  const oversToBalls = (overs: number) => {
    const whole = Math.floor(overs);
    const balls = Math.round((overs - whole) * 10);
    return whole * 6 + balls;
  };
  const ballsToOvers = (balls: number) => {
    const ov = Math.floor(balls / 6);
    const rem = balls % 6;
    return ov + rem / 10;
  };

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
    const maxOvers = Math.floor(match.overs / 5); // Max 4 overs per bowler in 20 over match
    
    return bowlingTeam.filter(player => {
      // Can't bowl if already bowled max overs
      if (Math.floor(player.oversBowled) >= maxOvers) return false;
      
      // Can't bowl consecutive overs
      if (lastBowlerId && player.id === lastBowlerId) return false;
      
      return true;
    });
  };

  const getAvailableBatsmen = () => {
    const battingTeam = getBattingTeam();
    const innings = getCurrentInnings();
    if (!innings) return [];

    return battingTeam.filter(player => {
      const hasBatted = player.balls > 0 || player.dismissed;
      const isCurrentlyBatting = player.id === innings.currentBatsmen.striker?.id ||
                                  player.id === innings.currentBatsmen.nonStriker?.id;

      return !hasBatted && !isCurrentlyBatting;
    });
  };

  const calculateManOfTheMatch = () => {
    if (!match.firstInnings || !match.secondInnings) return null;
    
    const allPlayers = [
      ...match.team1.squad.filter(p => p.isPlaying),
      ...match.team2.squad.filter(p => p.isPlaying)
    ];
    
    // Calculate player scores based on performance
    const playerScores = allPlayers.map(player => {
      let score = 0;
      
      // Batting contribution
      score += player.runs * 1.5;
      score += player.fours * 2;
      score += player.sixes * 4;
      if (player.balls > 0) {
        const strikeRate = (player.runs / player.balls) * 100;
        if (strikeRate > 150) score += 10;
      }
      
      // Bowling contribution
      score += player.wickets * 25;
      score += player.maidens * 10;
      if (player.oversBowled > 0) {
        const economy = player.runsConceded / player.oversBowled;
        if (economy < 6) score += 15;
        if (economy < 5) score += 10;
      }
      
      return { player, score };
    });
    
    // Return player with highest score
    playerScores.sort((a, b) => b.score - a.score);
    return playerScores[0]?.player || null;
  };

  const simulateBallOutcome = (batsman: Player, bowler: Player) => {
    const batSkill = batsman.batSkill;
    const bowlSkill = bowler.bowlSkill;

    const batsmanForm = batsman.performanceHistory?.formRating || 50;
    const bowlerForm = bowler.performanceHistory?.formRating || 50;

    const batsmanLast5Runs = batsman.performanceHistory?.last5MatchesRuns || 0;
    const bowlerLast5Wickets = bowler.performanceHistory?.last5MatchesWickets || 0;

    const formBonus = (batsmanForm - bowlerForm) * 0.15;
    const recentFormBonus = (batsmanLast5Runs * 0.02) - (bowlerLast5Wickets * 0.5);

    const skillDiff = batSkill - bowlSkill;
    const totalDiff = skillDiff + formBonus + recentFormBonus;

    const dotProb = Math.max(20, 45 - totalDiff * 0.3);
    const wicketProb = Math.max(3, 8 - totalDiff * 0.1);
    const boundaryProb = Math.max(8, 15 + totalDiff * 0.2);
    const sixProb = Math.max(2, 6 + totalDiff * 0.15);

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

  const handleBowlerSelection = (bowlerId: string) => {
    if (!bowlerId) return;
    
    const innings = getCurrentInnings();
    if (!innings) return;
    
    const bowler = getBowlingTeam().find(p => p.id === bowlerId);
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
    bowler.runsConceded += runs;
    if (isWicket) bowler.wickets += 1;
    
    // Update overs bowled (per bowler, includes partial overs)
    const newBallsBowled = innings.ballsBowled + 1;
    const bowlerBalls = oversToBalls(bowler.oversBowled) + 1;
    bowler.oversBowled = ballsToOvers(bowlerBalls);

    // Update batting order to include all batters who have faced balls
    const updatedBattingOrder = [...innings.battingOrder];
    const strikerInOrder = updatedBattingOrder.find(p => p.id === striker.id);
    if (!strikerInOrder) {
      updatedBattingOrder.push(striker);
    } else {
      const index = updatedBattingOrder.findIndex(p => p.id === striker.id);
      updatedBattingOrder[index] = striker;
    }

    // Also update non-striker in batting order if they exist
    if (innings.currentBatsmen.nonStriker) {
      const nonStrikerIndex = updatedBattingOrder.findIndex(p => p.id === innings.currentBatsmen.nonStriker!.id);
      if (nonStrikerIndex === -1) {
        updatedBattingOrder.push(innings.currentBatsmen.nonStriker);
      }
    }

    // Update team squads with new stats
    const battingTeamId = innings.battingTeam === match.team1.name ? match.team1.id : match.team2.id;
    const bowlingTeamId = innings.bowlingTeam === match.team1.name ? match.team1.id : match.team2.id;

    const updatedTeam1 = match.team1.id === battingTeamId
      ? {
          ...match.team1,
          squad: match.team1.squad.map(p =>
            p.id === striker.id ? striker :
            p.id === innings.currentBatsmen.nonStriker?.id ? innings.currentBatsmen.nonStriker :
            p
          )
        }
      : {
          ...match.team1,
          squad: match.team1.squad.map(p => p.id === bowler.id ? bowler : p)
        };

    const updatedTeam2 = match.team2.id === battingTeamId
      ? {
          ...match.team2,
          squad: match.team2.squad.map(p =>
            p.id === striker.id ? striker :
            p.id === innings.currentBatsmen.nonStriker?.id ? innings.currentBatsmen.nonStriker :
            p
          )
        }
      : {
          ...match.team2,
          squad: match.team2.squad.map(p => p.id === bowler.id ? bowler : p)
        };
    
    // Rotate strike if odd runs
    let newStriker = striker;
    let newNonStriker = innings.currentBatsmen.nonStriker;
    
    if (runs % 2 === 1 && !isWicket) {
      newStriker = innings.currentBatsmen.nonStriker;
      newNonStriker = striker;
    }
    
    // Check if over complete
    const isOverComplete = newBallsBowled % 6 === 0;
    
    // Track last bowler when over is complete
    if (isOverComplete) {
      setLastBowlerId(bowler.id);
    }
    
    // Rotate strike at end of over
    if (isOverComplete && !isWicket) {
      [newStriker, newNonStriker] = [newNonStriker, newStriker];
    }
    
    // Calculate new totals
    const newTotalRuns = innings.totalRuns + runs;
    const newWickets = isWicket ? innings.wickets + 1 : innings.wickets;
    
    // Check if innings is completed
    let isInningsComplete = newBallsBowled >= match.overs * 6 || newWickets >= 10;
    
    // In second innings, check if target is chased
    if (match.currentInnings === 2 && match.firstInnings) {
      const target = match.firstInnings.totalRuns + 1;
      if (newTotalRuns >= target) {
        isInningsComplete = true;
      }
    }
    
    // Update innings
    const updatedInnings = {
      ...innings,
      totalRuns: newTotalRuns,
      ballsBowled: newBallsBowled,
      wickets: newWickets,
      currentBatsmen: {
        striker: isWicket ? null : newStriker,
        nonStriker: newNonStriker
      },
      currentBowler: isOverComplete ? null : bowler,
      battingOrder: updatedBattingOrder,
      isCompleted: isInningsComplete
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
    
    // Rebuild team setups so playing XI reflect latest player stats
    const rebuildSetup = (setup: any, team: any) => {
      if (!setup) return setup;
      const find = (id: string) => team.squad.find((s: any) => s.id === id);
      return {
        ...setup,
        playingXI: setup.playingXI?.map((p: any) => find(p.id) || p) || setup.playingXI,
        impactPlayers: setup.impactPlayers?.map((p: any) => find(p.id) || p) || setup.impactPlayers,
        battingOrder: setup.battingOrder?.map((p: any) => find(p.id) || p) || setup.battingOrder,
        openingPair: setup.openingPair
          ? [find(setup.openingPair[0].id) || setup.openingPair[0], find(setup.openingPair[1].id) || setup.openingPair[1]]
          : setup.openingPair,
      };
    };

    const matchUpdate = {
      team1: updatedTeam1,
      team2: updatedTeam2,
      team1Setup: match.team1Setup ? rebuildSetup(match.team1Setup, updatedTeam1) : match.team1Setup,
      team2Setup: match.team2Setup ? rebuildSetup(match.team2Setup, updatedTeam2) : match.team2Setup,
      ...(match.currentInnings === 1 
        ? { firstInnings: updatedInnings }
        : { secondInnings: updatedInnings })
    };
    
    updateMatch(matchUpdate);
    
    // Check if innings just ended
    if (updatedInnings.isCompleted) {
      if (match.currentInnings === 1) {
        setShowInningsBreakDialog(true);
        return;
      } else {
        // Second innings ended - determine match result
        const firstInnings = match.firstInnings!;
        const secondInnings = updatedInnings;

        let result = '';
        let winnerId: string | null = null;

        if (secondInnings.totalRuns > firstInnings.totalRuns) {
          const wicketsLeft = 10 - secondInnings.wickets;
          result = `${secondInnings.battingTeam} won by ${wicketsLeft} wickets`;
          winnerId = secondInnings.battingTeam === matchUpdate.team1.name ? matchUpdate.team1.id : matchUpdate.team2.id;
        } else if (secondInnings.totalRuns < firstInnings.totalRuns) {
          const runsDiff = firstInnings.totalRuns - secondInnings.totalRuns;
          result = `${firstInnings.battingTeam} won by ${runsDiff} runs`;
          winnerId = firstInnings.battingTeam === matchUpdate.team1.name ? matchUpdate.team1.id : matchUpdate.team2.id;
        } else {
          result = 'Match Tied';
        }

        const manOfTheMatch = calculateManOfTheMatch();

        const completedMatch = {
          ...match,
          ...matchUpdate,
          result,
          isCompleted: true,
          manOfTheMatch,
        };

        updateMatch(completedMatch);

        // Save to history using store
        const { completeMatch } = useCricketStore.getState();
        completeMatch(completedMatch);

        setShowMatchResultDialog(true);
        return;
      }
    }
    
    // Show dialogs
    if (isOverComplete && !updatedInnings.isCompleted) {
      setShowBowlerDialog(true);
    }
    
    if (isWicket && newWickets < 10 && !updatedInnings.isCompleted) {
      setShowBatsmanDialog(true);
    }
  };

  const handleStartSecondInnings = () => {
    if (!openingBatsman1 || !openingBatsman2) return;
    
    const firstInnings = match.firstInnings;
    if (!firstInnings) return;

    // Swap teams
    const newBattingTeam = firstInnings.bowlingTeam;
    const newBowlingTeam = firstInnings.battingTeam;
    
    const battingSquad = newBattingTeam === match.team1.name 
      ? (match.team1Setup?.playingXI || [])
      : (match.team2Setup?.playingXI || []);
    
    const batsman1 = battingSquad.find(p => p.id === openingBatsman1);
    const batsman2 = battingSquad.find(p => p.id === openingBatsman2);
    
    if (!batsman1 || !batsman2) return;

    const secondInnings = {
      battingTeam: newBattingTeam,
      bowlingTeam: newBowlingTeam,
      totalRuns: 0,
      wickets: 0,
      ballsBowled: 0,
      overs: [],
      currentBatsmen: {
        striker: batsman1,
        nonStriker: batsman2
      },
      currentBowler: null,
      battingOrder: [batsman1, batsman2],
      isCompleted: false
    };

    updateMatch({
      currentInnings: 2,
      secondInnings
    });

    setShowInningsBreakDialog(false);
    setShowBowlerDialog(true);
    setOpeningBatsman1("");
    setOpeningBatsman2("");
    setCommentary([]);
    setLastBowlerId(null); // Reset for second innings
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Select Bowler for {innings ? `Over ${Math.floor(innings.ballsBowled / 6) + 1}` : 'Next Over'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Bowling Team: {innings?.bowlingTeam}
            </p>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {getAvailableBowlers().length === 0 ? (
              <div className="p-4 bg-destructive/10 rounded-lg text-center">
                <p className="text-sm font-medium">No bowlers available!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All bowlers have either completed their quota or the previous bowler cannot bowl consecutive overs.
                </p>
              </div>
            ) : (
              getAvailableBowlers().map(player => {
                const maxOvers = Math.floor(match.overs / 5);
                const bowlerBalls = oversToBalls(player.oversBowled);
                const economy = bowlerBalls > 0 
                  ? (player.runsConceded / (bowlerBalls / 6)).toFixed(2)
                  : '0.00';
                
                return (
                  <Card 
                    key={player.id}
                    className="cursor-pointer hover:border-cricket-green transition-colors"
                    onClick={() => handleBowlerSelection(player.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{player.name}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Overs:</span>
                              <Badge variant="outline">{player.oversBowled}/{maxOvers}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Wickets:</span>
                              <Badge className="bg-destructive text-white">{player.wickets}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Runs:</span>
                              <Badge variant="secondary">{player.runsConceded}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Economy:</span>
                              <Badge variant="outline">{economy}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Badge className="bg-cricket-green text-white">
                            Bowl Skill: {player.bowlSkill}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
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

      {/* Innings Break Dialog */}
      <Dialog open={showInningsBreakDialog} onOpenChange={setShowInningsBreakDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Innings Break - Start Second Innings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-cricket-green/10 rounded-lg">
              <p className="font-semibold">First Innings Complete!</p>
              <p className="text-sm mt-1">
                {match.firstInnings?.battingTeam}: {match.firstInnings?.totalRuns}/{match.firstInnings?.wickets} 
                {` (${Math.floor((match.firstInnings?.ballsBowled || 0) / 6)}.${(match.firstInnings?.ballsBowled || 0) % 6} overs)`}
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="font-medium">Select Opening Batsmen for {match.firstInnings?.bowlingTeam}:</p>
              
              <Select value={openingBatsman1} onValueChange={setOpeningBatsman1}>
                <SelectTrigger>
                  <SelectValue placeholder="First batsman" />
                </SelectTrigger>
                <SelectContent>
                  {(match.firstInnings?.bowlingTeam === match.team1.name 
                    ? match.team1Setup?.playingXI 
                    : match.team2Setup?.playingXI)?.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} (Bat: {player.batSkill})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={openingBatsman2} onValueChange={setOpeningBatsman2}>
                <SelectTrigger>
                  <SelectValue placeholder="Second batsman" />
                </SelectTrigger>
                <SelectContent>
                  {(match.firstInnings?.bowlingTeam === match.team1.name 
                    ? match.team1Setup?.playingXI 
                    : match.team2Setup?.playingXI)?.filter(p => p.id !== openingBatsman1).map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} (Bat: {player.batSkill})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleStartSecondInnings} 
              disabled={!openingBatsman1 || !openingBatsman2}
              className="w-full bg-cricket-green hover:bg-cricket-green/90"
            >
              Start Second Innings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Match Result Dialog */}
      <Dialog open={showMatchResultDialog} onOpenChange={setShowMatchResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Match Complete! 🏆</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Result */}
            <div className="p-4 bg-cricket-green/10 rounded-lg text-center">
              <p className="text-xl font-bold text-cricket-green">{match.result}</p>
            </div>
            
            {/* Innings Summary */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">{match.firstInnings?.battingTeam}</span>
                <span className="font-bold">
                  {match.firstInnings?.totalRuns}/{match.firstInnings?.wickets}
                  {` (${Math.floor((match.firstInnings?.ballsBowled || 0) / 6)}.${(match.firstInnings?.ballsBowled || 0) % 6})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">{match.secondInnings?.battingTeam}</span>
                <span className="font-bold">
                  {match.secondInnings?.totalRuns}/{match.secondInnings?.wickets}
                  {` (${Math.floor((match.secondInnings?.ballsBowled || 0) / 6)}.${(match.secondInnings?.ballsBowled || 0) % 6})`}
                </span>
              </div>
            </div>

            {/* Man of the Match */}
            {(() => {
              const motm = calculateManOfTheMatch();
              return motm ? (
                <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-lg">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Man of the Match</p>
                  <p className="text-xl font-bold">{motm.name}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    {motm.runs > 0 && (
                      <span className="text-muted-foreground">
                        {motm.runs} runs ({motm.balls} balls)
                      </span>
                    )}
                    {motm.wickets > 0 && (
                      <span className="text-muted-foreground">
                        {motm.wickets}-{motm.runsConceded} ({motm.oversBowled} ov)
                      </span>
                    )}
                  </div>
                </div>
              ) : null;
            })()}

            <Button 
              onClick={() => setShowMatchResultDialog(false)}
              className="w-full bg-cricket-green hover:bg-cricket-green/90"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BallByBallEngine;
