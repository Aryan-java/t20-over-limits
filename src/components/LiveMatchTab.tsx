import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Trophy, MapPin } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";
import LiveScoreboard from "./LiveScoreboard";
import TossDialog from "./TossDialog";
import BallByBallEngine from "./BallByBallEngine";
import LiveMatchControls from "./LiveMatchControls";
import RunRateGraph from "./RunRateGraph";
import PartnershipAnalysis from "./PartnershipAnalysis";
import VenueInfoDialog from "./VenueInfoDialog";
import WinPrediction from "./WinPrediction";
import WeatherConditionsPanel from "./WeatherConditionsPanel";
import { getRandomVenue } from "@/data/venues";
import { useMatchConditions, generateInitialConditions, calculateModifiers } from "@/hooks/useMatchConditions";

const LiveMatchTab = () => {
  const { currentMatch, setCurrentMatch, updateMatch, fixtures } = useCricketStore();
  const [showToss, setShowToss] = useState(false);
  const [showVenueInfo, setShowVenueInfo] = useState(false);
  const [matchStarted, setMatchStarted] = useState(false);

  // Memoize venue so it doesn't change on every re-render
  const venue = useMemo(() => {
    const matchFixture = fixtures.find(
      f => f.team1.id === currentMatch?.team1.id && f.team2.id === currentMatch?.team2.id
    );
    return matchFixture?.venue || getRandomVenue();
  }, [currentMatch?.team1.id, currentMatch?.team2.id, fixtures]);

  // Match conditions system
  const { conditions, modifiers, initializeConditions, updateConditions, setConditions } = useMatchConditions(venue);

  // Initialize conditions when match starts
  useEffect(() => {
    if (matchStarted && !conditions && venue) {
      const initialConditions = generateInitialConditions(venue);
      setConditions(initialConditions);
    }
  }, [matchStarted, conditions, venue, setConditions]);

  // Update conditions as match progresses
  useEffect(() => {
    if (currentMatch && conditions) {
      const innings = currentMatch.currentInnings === 1 ? currentMatch.firstInnings : currentMatch.secondInnings;
      if (innings) {
        updateConditions(innings.ballsBowled, currentMatch.currentInnings === 2);
      }
    }
  }, [currentMatch?.firstInnings?.ballsBowled, currentMatch?.secondInnings?.ballsBowled, currentMatch?.currentInnings, conditions, updateConditions]);

  const handleBowlerChange = (bowlerId: string) => {
    console.log("Changing bowler to:", bowlerId);
  };

  const handleNextBatsman = (batsmanId: string) => {
    console.log("Next batsman:", batsmanId);
  };

  const handleSimulateBall = () => {
    console.log("Simulating ball");
  };

  const handleUseImpactPlayer = (playerId: string, replacePlayerId: string) => {
    if (!currentMatch) return;
    
    const innings = currentMatch.currentInnings === 1 ? currentMatch.firstInnings : currentMatch.secondInnings;
    if (!innings) return;
    
    const isTeam1Batting = innings.battingTeam === currentMatch.team1.name;
    const teamSetup = isTeam1Batting ? currentMatch.team1Setup : currentMatch.team2Setup;
    
    if (!teamSetup) return;
    
    const impactPlayer = teamSetup.impactPlayers.find(p => p.id === playerId);
    const replacePlayerIdx = teamSetup.playingXI.findIndex(p => p.id === replacePlayerId);
    
    if (!impactPlayer || replacePlayerIdx === -1) return;
    
    const newPlayingXI = [...teamSetup.playingXI];
    const replacedPlayer = newPlayingXI[replacePlayerIdx];
    
    newPlayingXI[replacePlayerIdx] = {
      ...impactPlayer,
      isPlaying: true,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dismissed: false,
      dismissalInfo: '',
      oversBowled: 0,
      maidens: 0,
      wickets: 0,
      runsConceded: 0,
      widesConceded: 0,
      noBallsConceded: 0,
      dotBalls: 0,
    };
    
    const updatedSetup = {
      ...teamSetup,
      playingXI: newPlayingXI,
      impactPlayerUsed: true,
      substitutedPlayerId: replacePlayerId
    };
    
    if (isTeam1Batting) {
      updateMatch({ team1Setup: updatedSetup });
    } else {
      updateMatch({ team2Setup: updatedSetup });
    }
    
    console.log(`Impact Player: ${impactPlayer.name} replaced ${replacedPlayer.name}`);
  };

  if (!currentMatch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-slide-up">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cricket-green/20 via-cricket-pitch/20 to-cricket-green/20 blur-3xl" />
          <div className="relative glass rounded-2xl p-12 border-2 border-dashed border-cricket-green/30 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cricket-green/20 to-cricket-pitch/20 flex items-center justify-center">
              <span className="text-5xl animate-bounce">🏏</span>
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">No Active Match</h3>
            <p className="text-muted-foreground max-w-sm">
              Head to the Fixtures tab to set up and start a new match
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleStartMatch = () => {
    if (!currentMatch.tossWinner) {
      setShowVenueInfo(true);
    } else {
      setMatchStarted(true);
    }
  };

  const handleProceedToToss = () => {
    setShowVenueInfo(false);
    setShowToss(true);
  };

  const handleTossComplete = () => {
    const m = useCricketStore.getState().currentMatch;
    if (!m || !m.tossWinner || !m.tossChoice) {
      setShowToss(false);
      return;
    }

    setShowToss(false);

    const otherTeamName = m.tossWinner.name === m.team1.name ? m.team2.name : m.team1.name;
    const battingTeam = m.tossChoice === 'bat' ? m.tossWinner.name : otherTeamName;
    const bowlingTeam = m.tossChoice === 'bowl' ? m.tossWinner.name : otherTeamName;

    const battingSetup = battingTeam === m.team1.name ? m.team1Setup : m.team2Setup;

    if (battingSetup && battingSetup.openingPair) {
      const firstInnings = {
        battingTeam,
        bowlingTeam,
        totalRuns: 0,
        wickets: 0,
        ballsBowled: 0,
        overs: [],
        currentBatsmen: {
          striker: battingSetup.openingPair[0] || null,
          nonStriker: battingSetup.openingPair[1] || null,
        },
        currentBowler: null,
        battingOrder: [battingSetup.openingPair[0], battingSetup.openingPair[1]],
        isCompleted: false,
        isFreeHit: false,
        extras: {
          wides: 0,
          noBalls: 0,
          byes: 0,
          legByes: 0,
        },
        fallOfWickets: [],
        partnerships: [{
          batsman1Id: battingSetup.openingPair[0].id,
          batsman1Name: battingSetup.openingPair[0].name,
          batsman2Id: battingSetup.openingPair[1].id,
          batsman2Name: battingSetup.openingPair[1].name,
          runs: 0,
          balls: 0,
          batsman1Runs: 0,
          batsman1Balls: 0,
          batsman2Runs: 0,
          batsman2Balls: 0,
          fours: 0,
          sixes: 0,
          startOver: 0,
          phase: 'powerplay' as const,
          isActive: true,
        }],
      };

      updateMatch({
        firstInnings,
        isLive: true,
      });
    }

    setMatchStarted(true);
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Enhanced Match Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cricket-green/10 via-cricket-pitch/5 to-cricket-green/10 border border-cricket-green/20 p-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgzNCwxOTcsMTAwLDAuMSkiLz48L3N2Zz4=')] opacity-50" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Team 1 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cricket-green/30 to-cricket-pitch/30 flex items-center justify-center text-2xl font-bold shadow-lg">
                {currentMatch.team1.name.substring(0, 2).toUpperCase()}
              </div>
              <p className="mt-2 font-semibold text-sm">{currentMatch.team1.name}</p>
            </div>
            
            {/* VS Badge */}
            <div className="flex flex-col items-center">
              <Badge className="bg-gradient-to-r from-cricket-green to-cricket-pitch text-white px-4 py-1 text-lg font-bold shadow-lg">
                VS
              </Badge>
              {matchStarted && currentMatch.isLive && (
                <Badge className="mt-2 bg-score-wicket/90 text-white animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white mr-2 animate-ping" />
                  LIVE
                </Badge>
              )}
            </div>
            
            {/* Team 2 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cricket-ball/30 to-cricket-stumps/30 flex items-center justify-center text-2xl font-bold shadow-lg">
                {currentMatch.team2.name.substring(0, 2).toUpperCase()}
              </div>
              <p className="mt-2 font-semibold text-sm">{currentMatch.team2.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!matchStarted && (
              <Button 
                onClick={handleStartMatch} 
                className="bg-gradient-to-r from-cricket-green to-cricket-pitch hover:from-cricket-green/90 hover:to-cricket-pitch/90 text-white shadow-lg shadow-cricket-green/20 transition-all hover:scale-105"
                size="lg"
              >
                <Play className="h-5 w-5 mr-2" />
                {currentMatch.tossWinner ? 'Start Match' : 'Begin Toss'}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setCurrentMatch(null)}
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              End
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LiveScoreboard match={currentMatch} conditions={conditions} />
          
          {matchStarted && (
            <BallByBallEngine match={currentMatch} />
          )}
          
          {matchStarted && (
            <RunRateGraph match={currentMatch} />
          )}
          
          {matchStarted && (
            <PartnershipAnalysis match={currentMatch} />
          )}
          
          {matchStarted && (
            <LiveMatchControls 
              match={currentMatch}
              onBowlerChange={handleBowlerChange}
              onNextBatsman={handleNextBatsman}
              onSimulateBall={handleSimulateBall}
              onUseImpactPlayer={handleUseImpactPlayer}
            />
          )}
        </div>
        
        <div className="space-y-6">
          {/* Weather & Pitch Conditions */}
          {matchStarted && conditions && modifiers && (
            <WeatherConditionsPanel 
              conditions={conditions} 
              modifiers={modifiers} 
            />
          )}
          
          {/* Win Prediction - Only show during live match */}
          {matchStarted && currentMatch.isLive && !currentMatch.isCompleted && (
            <WinPrediction match={currentMatch} />
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Match Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Venue</span>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <MapPin className="h-3 w-3" />
                  {venue.name}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Format</span>
                <Badge>T{currentMatch.overs}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pitch</span>
                <Badge variant="outline" className="capitalize">{venue.pitchType}</Badge>
              </div>
              
              {currentMatch.tossWinner && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Toss Winner</span>
                    <span className="text-sm font-medium">{currentMatch.tossWinner.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Elected to</span>
                    <Badge variant="outline">{currentMatch.tossChoice} first</Badge>
                  </div>
                </div>
              )}
              
              {currentMatch.result && (
                <div className="p-3 bg-cricket-green/10 rounded-lg border border-cricket-green/20">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-cricket-green" />
                    <span className="text-sm font-medium text-cricket-green">
                      {currentMatch.result}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">{currentMatch.team1.name}</div>
                <div className="text-sm text-muted-foreground">
                  Playing XI: {currentMatch.team1Setup?.playingXI?.length || 0}/11
                </div>
                <div className="text-sm text-muted-foreground">
                  Impact: {currentMatch.team1Setup?.impactPlayers?.length || 0}/4
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="font-medium">{currentMatch.team2.name}</div>
                <div className="text-sm text-muted-foreground">
                  Playing XI: {currentMatch.team2Setup?.playingXI?.length || 0}/11
                </div>
                <div className="text-sm text-muted-foreground">
                  Impact: {currentMatch.team2Setup?.impactPlayers?.length || 0}/4
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <VenueInfoDialog
        venue={venue}
        team1={currentMatch.team1}
        team2={currentMatch.team2}
        team1PlayingXI={currentMatch.team1Setup?.playingXI}
        team2PlayingXI={currentMatch.team2Setup?.playingXI}
        open={showVenueInfo}
        onOpenChange={setShowVenueInfo}
        onProceedToToss={handleProceedToToss}
      />

      <TossDialog 
        match={currentMatch}
        open={showToss}
        onOpenChange={setShowToss}
        onComplete={handleTossComplete}
      />
    </div>
  );
};

export default LiveMatchTab;