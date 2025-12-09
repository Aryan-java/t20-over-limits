import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import CricketHeader from "@/components/CricketHeader";
import TabNavigation from "@/components/TabNavigation";
import TeamsTab from "@/components/TeamsTab";
import MultiplayerTeamsTab from "@/components/MultiplayerTeamsTab";
import LiveMatchTab from "@/components/LiveMatchTab";
import TournamentTab from "@/components/TournamentTab";
import StatsTab from "@/components/StatsTab";
import FixturesTab from "@/components/FixturesTab";
import MultiplayerFixturesTab from "@/components/MultiplayerFixturesTab";
import GameLobby from "@/components/GameLobby";
import GameModeSelector from "@/components/GameModeSelector";
import { TabsContent } from "@/components/ui/tabs";
import { useGameSession } from "@/hooks/useGameSession";
import { useCricketStore } from "@/hooks/useCricketStore";

type GameMode = 'selecting' | 'single' | 'multiplayer';

const Index = () => {
  const [activeTab, setActiveTab] = useState("teams");
  const [gameMode, setGameMode] = useState<GameMode>('selecting');
  const [multiplayerStarted, setMultiplayerStarted] = useState(false);
  
  const { session, currentPlayer, players } = useGameSession();
  const { setTeams, setCurrentMatch, setFixtures, setTournament, setMatchHistory, resetTeams, teams, fixtures, tournament, matchHistory, currentMatch } = useCricketStore();

  // Check if there's an existing multiplayer session
  useEffect(() => {
    const sessionId = localStorage.getItem('game_session_id');
    if (sessionId) {
      setGameMode('multiplayer');
    }
  }, []);

  // Auto-set multiplayerStarted when session status is 'playing'
  useEffect(() => {
    if (gameMode === 'multiplayer' && session?.status === 'playing' && !multiplayerStarted) {
      setMultiplayerStarted(true);
    }
  }, [session?.status, gameMode, multiplayerStarted]);

  // Clear local state when entering multiplayer to prevent stale data
  useEffect(() => {
    if (gameMode === 'multiplayer' && !session) {
      // Clear local store when entering multiplayer but session not yet loaded
      resetTeams();
    }
  }, [gameMode]);

  // Sync ALL game state from session for multiplayer - this ensures all players see the same state
  // This runs on every session update to keep all players in sync
  useEffect(() => {
    if (gameMode === 'multiplayer' && session?.game_state) {
      // Always sync from session - session is the source of truth in multiplayer
      const gs = session.game_state;
      
      // Sync teams (always override local with session data)
      if (JSON.stringify(gs.teams) !== JSON.stringify(teams)) {
        setTeams(gs.teams || []);
      }
      
      // Sync fixtures
      if (JSON.stringify(gs.fixtures) !== JSON.stringify(fixtures)) {
        setFixtures(gs.fixtures || []);
      }
      
      // Sync current match - only update if different to avoid loops
      if (JSON.stringify(gs.currentMatch) !== JSON.stringify(currentMatch)) {
        setCurrentMatch(gs.currentMatch || null);
      }
      
      // Sync tournament state
      if (JSON.stringify(gs.tournament) !== JSON.stringify(tournament)) {
        setTournament(gs.tournament || null);
      }
      
      // Sync match history
      if (JSON.stringify(gs.matchHistory) !== JSON.stringify(matchHistory)) {
        setMatchHistory(gs.matchHistory || []);
      }
    }
  }, [session?.game_state, gameMode]);

  // Auto-switch to Live tab when match starts in multiplayer
  useEffect(() => {
    if (gameMode === 'multiplayer' && currentMatch?.isLive) {
      setActiveTab('live');
    }
  }, [currentMatch?.isLive, gameMode]);

  const handleSelectSingle = () => {
    setGameMode('single');
  };

  const handleSelectMultiplayer = () => {
    setGameMode('multiplayer');
  };

  const handleMultiplayerGameStart = () => {
    setMultiplayerStarted(true);
  };

  const handleExitMultiplayer = () => {
    localStorage.removeItem('game_player_id');
    localStorage.removeItem('game_session_id');
    setGameMode('selecting');
    setMultiplayerStarted(false);
  };

  const handleBackToModeSelect = () => {
    setGameMode('selecting');
  };

  // Show mode selection at start
  if (gameMode === 'selecting') {
    return (
      <>
        <GameModeSelector 
          onSelectSingle={handleSelectSingle}
          onSelectMultiplayer={handleSelectMultiplayer}
        />
        <Toaster />
      </>
    );
  }

  // Show multiplayer lobby if multiplayer mode and game hasn't started
  if (gameMode === 'multiplayer' && !multiplayerStarted) {
    return (
      <GameLobby 
        onGameStart={handleMultiplayerGameStart} 
        onBack={handleBackToModeSelect}
      />
    );
  }

  const isMultiplayer = gameMode === 'multiplayer';
  const controlledTeamId = currentPlayer?.team_id || null;
  const isAdmin = currentPlayer?.is_admin || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cricket-pitch via-background to-cricket-pitch/30">
      <CricketHeader 
        isMultiplayer={isMultiplayer} 
        onExitMultiplayer={handleExitMultiplayer}
      />
      
      <main className="container mx-auto px-4 py-8">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab}>
          <TabsContent value="teams">
            {isMultiplayer ? (
              <MultiplayerTeamsTab 
                controlledTeamId={controlledTeamId}
                isAdmin={isAdmin}
              />
            ) : (
              <TeamsTab />
            )}
          </TabsContent>

          <TabsContent value="fixtures">
            {isMultiplayer ? (
              <MultiplayerFixturesTab 
                controlledTeamId={controlledTeamId}
                isAdmin={isAdmin}
              />
            ) : (
              <FixturesTab />
            )}
          </TabsContent>

          <TabsContent value="live">
            <LiveMatchTab 
              isMultiplayer={isMultiplayer}
              controlledTeamId={controlledTeamId}
            />
          </TabsContent>

          <TabsContent value="tournament">
            <TournamentTab 
              isMultiplayer={isMultiplayer}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="stats">
            <StatsTab />
          </TabsContent>
        </TabNavigation>
      </main>
      
      <Toaster />
    </div>
  );
};

export default Index;
