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
import { getRandomVenue } from "@/data/venues";

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

  const handleBowlerChange = (bowlerId: string) => {
    // Update current bowler in match state
    console.log("Changing bowler to:", bowlerId);
  };

  const handleNextBatsman = (batsmanId: string) => {
    // Update batting lineup
    console.log("Next batsman:", batsmanId);
  };

  const handleSimulateBall = () => {
    // Simulate next ball
    console.log("Simulating ball");
  };

  const handleUseImpactPlayer = (playerId: string, replacePlayerId: string) => {
    if (!currentMatch) return;
    
    const innings = currentMatch.currentInnings === 1 ? currentMatch.firstInnings : currentMatch.secondInnings;
    if (!innings) return;
    
    const isTeam1Batting = innings.battingTeam === currentMatch.team1.name;
    const teamSetup = isTeam1Batting ? currentMatch.team1Setup : currentMatch.team2Setup;
    
    if (!teamSetup) return;
    
    // Find the impact player and the player being replaced
    const impactPlayer = teamSetup.impactPlayers.find(p => p.id === playerId);
    const replacePlayerIdx = teamSetup.playingXI.findIndex(p => p.id === replacePlayerId);
    
    if (!impactPlayer || replacePlayerIdx === -1) return;
    
    // Create new playing XI with substitution
    const newPlayingXI = [...teamSetup.playingXI];
    const replacedPlayer = newPlayingXI[replacePlayerIdx];
    
    // Mark the replaced player as dismissed (cannot participate further)
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
    
    // Update the match state
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
      <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="space-y-3">
          <div className="text-4xl">🏏</div>
          <h3 className="text-lg font-medium">No active match</h3>
          <p className="text-muted-foreground">
            Start a match from the Fixtures tab to begin live simulation
          </p>
        </div>
      </div>
    );
  }

  const handleStartMatch = () => {
    if (!currentMatch.tossWinner) {
      // Show venue info first, then toss
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
    // Use fresh state to avoid any stale data after toss update
    const m = useCricketStore.getState().currentMatch;
    if (!m || !m.tossWinner || !m.tossChoice) {
      setShowToss(false);
      return;
    }

    setShowToss(false);

    // Determine batting and bowling teams based on toss result and choice
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Match</h2>
          <p className="text-muted-foreground">
            {currentMatch.team1.name} vs {currentMatch.team2.name}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {!matchStarted && (
            <Button onClick={handleStartMatch} className="bg-cricket-green hover:bg-cricket-green/90">
              <Play className="h-4 w-4 mr-2" />
              {currentMatch.tossWinner ? 'Start Match' : 'Start Toss'}
            </Button>
          )}
          
          <Button variant="outline" onClick={() => setCurrentMatch(null)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            End Match
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LiveScoreboard match={currentMatch} />
          
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