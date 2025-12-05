import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Trophy } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";
import LiveScoreboard from "./LiveScoreboard";
import TossDialog from "./TossDialog";
import BallByBallEngine from "./BallByBallEngine";
import LiveMatchControls from "./LiveMatchControls";

interface LiveMatchTabProps {
  isMultiplayer?: boolean;
  controlledTeamId?: string | null;
}

const LiveMatchTab = ({ isMultiplayer = false, controlledTeamId = null }: LiveMatchTabProps) => {
  const { currentMatch, setCurrentMatch, updateMatch } = useCricketStore();
  const [showToss, setShowToss] = useState(false);
  const [matchStarted, setMatchStarted] = useState(false);

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
    // Use impact player substitution
    console.log("Using impact player:", playerId, "to replace:", replacePlayerId);
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
      setShowToss(true);
    } else {
      setMatchStarted(true);
    }
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
            <LiveMatchControls 
              match={currentMatch}
              onBowlerChange={handleBowlerChange}
              onNextBatsman={handleNextBatsman}
              onSimulateBall={handleSimulateBall}
              onUseImpactPlayer={handleUseImpactPlayer}
              isMultiplayer={isMultiplayer}
              controlledTeamId={controlledTeamId}
            />
          )}
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Match Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Format</span>
                <Badge>T{currentMatch.overs}</Badge>
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