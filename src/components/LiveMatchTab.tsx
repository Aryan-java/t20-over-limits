import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, RotateCcw, Trophy, Eye, Users } from "lucide-react";
import { useCricketStore } from "@/hooks/useCricketStore";
import LiveScoreboard from "./LiveScoreboard";
import TossDialog from "./TossDialog";
import BallByBallEngine from "./BallByBallEngine";
import LiveMatchControls from "./LiveMatchControls";
import { useGameSession, GameSession } from "@/hooks/useGameSession";
import { getSupabase } from "@/lib/supabaseClient";

interface LiveMatchTabProps {
  isMultiplayer?: boolean;
  controlledTeamId?: string | null;
}

const LiveMatchTab = ({ isMultiplayer = false, controlledTeamId = null }: LiveMatchTabProps) => {
  const { currentMatch, setCurrentMatch, updateMatch } = useCricketStore();
  const { session } = useGameSession();
  const [showToss, setShowToss] = useState(false);
  const [matchStarted, setMatchStarted] = useState(false);

  // Check if current player is part of this match
  const isParticipant = currentMatch && controlledTeamId && 
    (currentMatch.team1.id === controlledTeamId || currentMatch.team2.id === controlledTeamId);
  
  const isSpectator = isMultiplayer && currentMatch && !isParticipant;

  // Remove duplicate sync - BallByBallEngine handles sync after each ball
  // This was causing conflicts with realtime updates

  // Listen for match state updates from other players
  useEffect(() => {
    if (!isMultiplayer || !session) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel(`match-sync-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${session.id}`
        },
        (payload) => {
          const newSession = payload.new as GameSession;
          const matchState = newSession.game_state?.currentMatch || newSession.game_state?.matchState;
          
          if (matchState && JSON.stringify(matchState) !== JSON.stringify(currentMatch)) {
            setCurrentMatch(matchState);
            if (matchState.isLive) {
              setMatchStarted(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMultiplayer, session?.id]);

  // Auto-start match view when match is live
  useEffect(() => {
    if (currentMatch?.isLive && !matchStarted) {
      setMatchStarted(true);
    }
  }, [currentMatch?.isLive]);

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
    console.log("Using impact player:", playerId, "to replace:", replacePlayerId);
  };

  if (!currentMatch) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
        <div className="space-y-3">
          <div className="text-4xl">🏏</div>
          <h3 className="text-lg font-medium">No active match</h3>
          <p className="text-muted-foreground">
            {isMultiplayer 
              ? "Both team managers must be ready in Fixtures tab to start a match"
              : "Start a match from the Fixtures tab to begin live simulation"
            }
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

  const handleTossComplete = async () => {
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
      };

      updateMatch({
        firstInnings,
        isLive: true,
      });
    }

    setMatchStarted(true);
  };

  // Determine if current player can control toss/start
  const canControlMatch = !isMultiplayer || isParticipant;

  return (
    <div className="space-y-6">
      {/* Spectator banner */}
      {isSpectator && (
        <Alert className="border-blue-500 bg-blue-500/10">
          <AlertDescription className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>You're spectating this match. Only team managers can control the game.</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Match</h2>
          <p className="text-muted-foreground">
            {currentMatch.team1.name} vs {currentMatch.team2.name}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {!matchStarted && canControlMatch && (
            <Button onClick={handleStartMatch} className="bg-cricket-green hover:bg-cricket-green/90">
              <Play className="h-4 w-4 mr-2" />
              {currentMatch.tossWinner ? 'Start Match' : 'Start Toss'}
            </Button>
          )}
          
          {!matchStarted && !canControlMatch && (
            <Button disabled variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Waiting for teams...
            </Button>
          )}
          
          {canControlMatch && (
            <Button variant="outline" onClick={() => setCurrentMatch(null)}>
              <RotateCcw className="h-4 w-4 mr-2" />
              End Match
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LiveScoreboard match={currentMatch} />
          
          {matchStarted && (
            <BallByBallEngine 
              match={currentMatch} 
              isMultiplayer={isMultiplayer}
            />
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
              
              {isMultiplayer && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Role</span>
                  <Badge variant={isSpectator ? "secondary" : "default"}>
                    {isSpectator ? "Spectator" : (
                      controlledTeamId === currentMatch.team1.id 
                        ? currentMatch.team1.name 
                        : currentMatch.team2.name
                    )}
                  </Badge>
                </div>
              )}
              
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
                <div className="font-medium flex items-center gap-2">
                  {currentMatch.team1.name}
                  {controlledTeamId === currentMatch.team1.id && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Playing XI: {currentMatch.team1Setup?.playingXI?.length || 0}/11
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="font-medium flex items-center gap-2">
                  {currentMatch.team2.name}
                  {controlledTeamId === currentMatch.team2.id && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Playing XI: {currentMatch.team2Setup?.playingXI?.length || 0}/11
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